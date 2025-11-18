import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, Subject, merge } from 'rxjs';
import { map, switchMap, tap, takeUntil, startWith, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { MensajeChat, ConversacionChat } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private mensajes$ = new BehaviorSubject<MensajeChat[]>([]);
  private conversaciones$ = new BehaviorSubject<ConversacionChat[]>([]);
  private typing$ = new BehaviorSubject<{ userId: string; typing: boolean }[]>([]);
  private destroy$ = new Subject<void>();

  constructor(private supabaseService: SupabaseService) {}

  private subscriptions: Map<string, any> = new Map();
  private typingTimeouts: Map<string, any> = new Map();

  getTypingStatus(): Observable<{ userId: string; typing: boolean }[]> {
    return this.typing$.asObservable();
  }

  subscribeToConversacion(contratacionId: string): Observable<MensajeChat[]> {
    if (!contratacionId) {
      return this.mensajes$.asObservable().pipe(startWith([]));
    }

    const supabase = this.supabaseService.getClient();

    this.loadMensajes(contratacionId);

    if (!this.subscriptions.has(contratacionId)) {
      const subscription = supabase
        .channel(`mensajes:${contratacionId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'mensajes_chat',
            filter: `contratacion_id=eq.${contratacionId}`
          },
          (payload) => {
            console.log('Nuevo mensaje recibido:', payload);
            this.loadMensajes(contratacionId);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'mensajes_chat',
            filter: `contratacion_id=eq.${contratacionId}`
          },
          () => {
            console.log('Mensaje actualizado');
            this.loadMensajes(contratacionId);
          }
        )
        .subscribe((status) => {
          console.log('Estado de suscripción a mensajes:', status);
        });

      this.subscriptions.set(contratacionId, subscription);
    }

    return this.mensajes$.asObservable();
  }

  private loadMensajes(contratacionId: string): void {
    const supabase = this.supabaseService.getClient();

    from(supabase
      .from('mensajes_chat')
      .select('*')
      .eq('contratacion_id', contratacionId)
      .order('created_at', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Error cargando mensajes:', error);
          return [];
        }
        return data as MensajeChat[];
      }),
      tap(mensajes => {
        this.mensajes$.next(mensajes);
        this.markAsRead(contratacionId);
      })
    ).subscribe();
  }

  sendMessage(contratacionId: string, usuarioId: string, asesorId: string | null, mensaje: string): Observable<MensajeChat | null> {
    const supabase = this.supabaseService.getClient();

    return from(supabase
      .from('mensajes_chat')
      .insert([{
        contratacion_id: contratacionId,
        usuario_id: usuarioId,
        asesor_id: asesorId || null,
        mensaje: mensaje,
        leido: false,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Error enviando mensaje:', error);
          return null;
        }
        return data as MensajeChat;
      }),
      tap(() => {
        this.updateTypingStatus(usuarioId, false);
      })
    );
  }

  notifyTyping(contratacionId: string, usuarioId: string, isTyping: boolean): void {
    const supabase = this.supabaseService.getClient();

    const channel = supabase.channel(`typing:${contratacionId}`);
    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        userId: usuarioId,
        isTyping: isTyping
      }
    });

    this.updateTypingStatus(usuarioId, isTyping);

    if (isTyping) {
      const timeoutId = this.typingTimeouts.get(usuarioId);
      if (timeoutId) clearTimeout(timeoutId);

      const newTimeout = setTimeout(() => {
        this.updateTypingStatus(usuarioId, false);
      }, 3000);

      this.typingTimeouts.set(usuarioId, newTimeout);
    }
  }

  subscribeToTypingEvents(contratacionId: string): Observable<{ userId: string; isTyping: boolean }> {
    const supabase = this.supabaseService.getClient();

    return new Observable(observer => {
      const subscription = supabase
        .channel(`typing:${contratacionId}`)
        .on('broadcast', { event: 'typing' }, (payload: any) => {
          observer.next({
            userId: payload['payload']['userId'],
            isTyping: payload['payload']['isTyping']
          });
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    });
  }

  private updateTypingStatus(userId: string, isTyping: boolean): void {
    const currentStatus = this.typing$.value;
    const updatedStatus = currentStatus.filter(t => t.userId !== userId);

    if (isTyping) {
      updatedStatus.push({ userId, typing: true });
    }

    this.typing$.next(updatedStatus);
  }

  private markAsRead(contratacionId: string): void {
    const supabase = this.supabaseService.getClient();

    supabase
      .from('mensajes_chat')
      .update({ leido: true })
      .eq('contratacion_id', contratacionId)
      .eq('leido', false)
      .then(({ error }) => {
        if (error) {
          console.error('Error marcando mensajes como leídos:', error);
        }
      });
  }

  getConversaciones(userId: string, isAdvisor: boolean): Observable<ConversacionChat[]> {
    const supabase = this.supabaseService.getClient();

    from(this.loadConversacionesInitial(userId, isAdvisor)).pipe(
      tap(data => this.conversaciones$.next(data))
    ).subscribe();

    if (!this.subscriptions.has(`conversaciones:${userId}`)) {
      const subscription = supabase
        .channel(`conversaciones:${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'contrataciones',
            filter: isAdvisor ? undefined : `usuario_id=eq.${userId}`
          },
          () => {
            this.loadConversacionesInitial(userId, isAdvisor).then(data => {
              this.conversaciones$.next(data);
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'mensajes_chat'
          },
          () => {
            this.loadConversacionesInitial(userId, isAdvisor).then(data => {
              this.conversaciones$.next(data);
            });
          }
        )
        .subscribe();

      this.subscriptions.set(`conversaciones:${userId}`, subscription);
    }

    return this.conversaciones$.asObservable();
  }

  private async loadConversacionesInitial(userId: string, isAdvisor: boolean): Promise<ConversacionChat[]> {
    const supabase = this.supabaseService.getClient();

    let query = supabase
      .from('vw_conversaciones_chat')
      .select('*');

    if (isAdvisor) {
      query = query.eq('asesor_id', userId);
    } else {
      query = query.eq('usuario_id', userId);
    }

    const { data, error } = await query.order('timestamp_ultimo', { ascending: false });

    if (error) {
      console.error('Error cargando conversaciones:', error);
      return [];
    }

    return (data || []) as ConversacionChat[];
  }

  unsubscribeFromConversacion(contratacionId: string): void {
    const subscription = this.subscriptions.get(contratacionId);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(contratacionId);
    }
  }

  cleanup(): void {
    this.subscriptions.forEach(sub => {
      if (sub && typeof sub.unsubscribe === 'function') {
        sub.unsubscribe();
      }
    });
    this.subscriptions.clear();
    this.typingTimeouts.forEach(timeout => clearTimeout(timeout));
    this.typingTimeouts.clear();
    this.destroy$.next();
    this.destroy$.complete();
  }
}

