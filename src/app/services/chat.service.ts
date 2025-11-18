import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { MensajeChat, ConversacionChat } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private mensajes$ = new BehaviorSubject<MensajeChat[]>([]);
  private conversaciones$ = new BehaviorSubject<ConversacionChat[]>([]);

  constructor(private supabaseService: SupabaseService) {}

  private subscriptions: Map<string, any> = new Map();

  subscribeToConversacion(contratacionId: string): Observable<MensajeChat[]> {
    const supabase = this.supabaseService.getClient();

    // Cargar mensajes iniciales
    this.loadMensajes(contratacionId);

    // Suscribirse a cambios en tiempo real
    if (!this.subscriptions.has(contratacionId)) {
      const subscription = supabase
        .channel(`mensajes:${contratacionId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'mensajes_chat',
            filter: `contratacion_id=eq.${contratacionId}`
          },
          () => {
            this.loadMensajes(contratacionId);
          }
        )
        .subscribe();

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
      })
    ).subscribe(mensajes => {
      this.mensajes$.next(mensajes);
      // Marcar como leídos
      this.markAsRead(contratacionId);
    });
  }

  sendMessage(contratacionId: string, usuarioId: string, asesorId: string, mensaje: string): Observable<MensajeChat | null> {
    const supabase = this.supabaseService.getClient();

    return from(supabase
      .from('mensajes_chat')
      .insert([{
        contratacion_id: contratacionId,
        usuario_id: usuarioId,
        asesor_id: asesorId,
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
      })
    );
  }

  private markAsRead(contratacionId: string): void {
    const supabase = this.supabaseService.getClient();
    
    supabase
      .from('mensajes_chat')
      .update({ leido: true })
      .eq('contratacion_id', contratacionId)
      .then();
  }

  getConversaciones(userId: string, isAdvisor: boolean): Observable<ConversacionChat[]> {
    const supabase = this.supabaseService.getClient();

    let query = supabase
      .from('vw_conversaciones_chat')
      .select('*');

    if (isAdvisor) {
      query = query.eq('asesor_id', userId);
    } else {
      query = query.eq('usuario_id', userId);
    }

    return from(query.order('timestamp_ultimo', { ascending: false })).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Error cargando conversaciones:', error);
          return [];
        }
        return data as ConversacionChat[];
      })
    );
  }

  unsubscribeFromConversacion(contratacionId: string): void {
    const subscription = this.subscriptions.get(contratacionId);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(contratacionId);
    }
  }
}
