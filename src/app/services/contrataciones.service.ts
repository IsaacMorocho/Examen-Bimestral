import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { Contratacion, ContratacionDetalle } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ContratacionesService {
  constructor(private supabaseService: SupabaseService) {}

  createContratacion(usuarioId: string, planId: string, precioPlan: number): Observable<Contratacion | null> {
    const supabase = this.supabaseService.getClient();

    return from(supabase
      .from('contrataciones')
      .insert([{
        usuario_id: usuarioId,
        plan_id: planId,
        estado: 'pendiente',
        fecha_inicio: new Date().toISOString(),
        precio_mensual: precioPlan,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Error creando contratación:', error);
          return null;
        }
        return data as Contratacion;
      })
    );
  }

  getContratacionesByUsuario(usuarioId: string): Observable<ContratacionDetalle[]> {
    const supabase = this.supabaseService.getClient();

    return from(supabase
      .from('vw_contrataciones_detalle')
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Error cargando contrataciones:', error);
          return [];
        }
        return data as ContratacionDetalle[];
      })
    );
  }

  getContratacionesPendientes(): Observable<ContratacionDetalle[]> {
    const supabase = this.supabaseService.getClient();

    return from(supabase
      .from('vw_contrataciones_detalle')
      .select('*')
      .eq('estado', 'pendiente')
      .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Error cargando contrataciones pendientes:', error);
          return [];
        }
        return data as ContratacionDetalle[];
      })
    );
  }

  actualizarEstadoContratacion(contratacionId: string, nuevoEstado: string): Observable<boolean> {
    const supabase = this.supabaseService.getClient();

    return from(supabase
      .from('contrataciones')
      .update({
        estado: nuevoEstado,
        updated_at: new Date().toISOString()
      })
      .eq('id', contratacionId)
    ).pipe(
      map(({ error }) => {
        if (error) {
          console.error('Error actualizando estado:', error);
          return false;
        }
        return true;
      })
    );
  }

  getContratacionById(id: string): Observable<Contratacion | null> {
    const supabase = this.supabaseService.getClient();

    return from(supabase
      .from('contrataciones')
      .select('*')
      .eq('id', id)
      .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Error cargando contratación:', error);
          return null;
        }
        return data as Contratacion;
      })
    );
  }
}
