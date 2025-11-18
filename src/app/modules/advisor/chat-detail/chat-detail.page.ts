import { Component, OnInit, ViewChild, AfterViewChecked, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule, IonContent } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { ChatService } from '../../../services/chat.service';
import { ContratacionesService } from '../../../services/contrataciones.service';
import { User, MensajeChat, Contratacion } from '../../../models';
import { Observable, Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-chat-detail',
  templateUrl: './chat-detail.page.html',
  styleUrls: ['./chat-detail.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class ChatDetailPage implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild(IonContent) content!: IonContent;

  contratacionId!: string;
  currentUser$: Observable<User | null>;
  mensajes$: Observable<MensajeChat[]>;
  contratacion: Contratacion | null = null;
  newMessage = '';
  currentUserId = '';
  usuarioId: string | null = null;
  isLoading = true;
  shouldScroll = false;
  otherUserTyping = false;

  private destroy$ = new Subject<void>();
  private typingSubject$ = new Subject<string>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private chatService: ChatService,
    private contratacionesService: ContratacionesService
  ) {
    this.currentUser$ = this.authService.getCurrentUser();
    this.mensajes$ = this.chatService.subscribeToConversacion('');
  }

  ngOnInit() {
    this.contratacionId = this.route.snapshot.paramMap.get('contratacionId') || '';

    this.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user) {
          this.currentUserId = user.id;
          this.contratacionesService.getContratacionById(this.contratacionId)
            .pipe(takeUntil(this.destroy$))
            .subscribe(
              contratacion => {
                if (contratacion) {
                  this.contratacion = contratacion;
                  this.usuarioId = contratacion.usuario_id;
                  this.mensajes$ = this.chatService.subscribeToConversacion(this.contratacionId);
                  
                  this.chatService.subscribeToTypingEvents(this.contratacionId)
                    .pipe(takeUntil(this.destroy$))
                    .subscribe(event => {
                      if (event.userId !== this.currentUserId) {
                        this.otherUserTyping = event.isTyping;
                      }
                    });

                  this.isLoading = false;
                }
              }
            );
        }
      });

    this.typingSubject$
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(message => {
        const isTyping = message.length > 0;
        this.chatService.notifyTyping(this.contratacionId, this.currentUserId, isTyping);
      });
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  ngOnDestroy() {
    this.chatService.unsubscribeFromConversacion(this.contratacionId);
    this.destroy$.next();
    this.destroy$.complete();
  }

  onMessageInputChange(message: string) {
    this.typingSubject$.next(message);
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.contratacion) {
      return;
    }

    const message = this.newMessage;
    this.newMessage = '';
    this.shouldScroll = true;

    this.chatService.sendMessage(
      this.contratacionId,
      this.currentUserId,
      this.usuarioId,
      message
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        result => {
          if (!result) {
            console.error('Error enviando mensaje');
          }
        }
      );
  }

  private scrollToBottom() {
    if (this.content) {
      this.content.scrollToBottom(200);
    }
  }

  goBack() {
    this.router.navigate(['/advisor/chat-list']);
  }

  isMessageFromCurrentUser(usuarioId: string): boolean {
    return usuarioId === this.currentUserId;
  }
}
