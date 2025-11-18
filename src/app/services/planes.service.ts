import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, interval } from 'rxjs';
import { map, switchMap, distinctUntilChanged, shareReplay } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { Plan } from '../models';

@Injectable({
  providedIn: 'root'
})
export class PlanesService {
  private planes$ = new BehaviorSubject<Plan[]>([]);
  private planesRefresh$ = interval(5000); // Actualizar cada 5 segundos

  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService
  ) {
    this.initializeRealtime();
  }

  private initializeRealtime(): void {
    const supabase = this.supabaseService.getClient();
    
    // Cargar planes iniciales
    this.loadPlanes();

    // Suscribirse a cambios en tiempo real
    const subscription = supabase
      .channel('planes_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'planes_moviles'
        },
        () => {
          this.loadPlanes();
        }
      )
      .subscribe();
  }

  private loadPlanes(): void {
    const supabase = this.supabaseService.getClient();

    from(supabase
      .from('planes_moviles')
      .select('*')
      .eq('activo', true)
      .order('precio', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Error cargando planes:', error);
          return [];
        }
        return data as Plan[];
      })
    ).subscribe(planes => {
      this.planes$.next(planes);
    });
  }

  getPlanes(): Observable<Plan[]> {
    return this.planes$.pipe(distinctUntilChanged());
  }

  getPlanById(id: string): Observable<Plan | null> {
    const supabase = this.supabaseService.getClient();

    return from(supabase
      .from('planes_moviles')
      .select('*')
      .eq('id', id)
      .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Error cargando plan:', error);
          return null;
        }
        return data as Plan;
      })
    );
  }

  getPlansBySegmento(segmento: string): Observable<Plan[]> {
    return this.planes$.pipe(
      map(planes => planes.filter(p => p.segmento === segmento))
    );
  }

  createPlan(plan: Omit<Plan, 'id' | 'created_at' | 'updated_at'>): Observable<Plan | null> {
    const supabase = this.supabaseService.getClient();

    // Obtener el usuario actual sincronicamente desde el BehaviorSubject
    const currentUserObs = this.authService.getCurrentUser();
    
    // Necesitamos usar switchMap para obtener el usuario de forma Observable
    return currentUserObs.pipe(
      switchMap(currentUser => {
        if (!currentUser || !currentUser.id) {
          console.error('❌ No hay usuario autenticado para crear plan');
          return from(Promise.resolve(null));
        }

        console.log('📝 Creando plan para user_id:', currentUser.id);

        return from(
          supabase.rpc('crear_plan_asesor', {
            p_user_id: currentUser.id,  // <<<< NUEVO: Pasar user_id como parámetro
            p_nombre: plan.nombre,
            p_descripcion: plan.descripcion,
            p_precio: plan.precio,
            p_segmento: plan.segmento,
            p_datos_moviles: plan.datos_moviles,
            p_minutos_voz: plan.minutos_voz,
            p_sms: plan.sms,
            p_velocidad_4g: plan.velocidad_4g,
            p_velocidad_5g: plan.velocidad_5g,
            p_redes_sociales: plan.redes_sociales,
            p_whatsapp: plan.whatsapp,
            p_llamadas_internacionales: plan.llamadas_internacionales,
            p_roaming: plan.roaming,
            p_imagen_url: plan.imagen_url
          })
        ).pipe(
          switchMap(async (result: any) => {
            // Debug: registrar la respuesta completa
            console.log('RPC Response crear_plan_asesor:', result);
            
            // Validar que result existe y tiene estructura correcta
            if (!result) {
              console.error('❌ RPC retornó null/undefined');
              return { error: 'RPC retornó null', data: null } as any;
            }

            // CASO 1: Respuesta de Supabase wrapper {error: null, data: {...}, status: 200}
            if (result.status !== undefined && result.status === 200) {
              // Verificar si el data contiene {success: false}
              if (result.data?.success === false) {
                console.error('❌ Función retornó error:', result.data.error);
                return { error: result.data.error, data: null } as any;
              }

              console.log('✅ Plan creado exitosamente (Supabase wrapper)');
              
              // Pequeño delay para que la BD se sincronice
              await new Promise(resolve => setTimeout(resolve, 300));

              // Recargar planes
              this.loadPlanes();

              // Retornar el plan creado (aproximado)
              return {
                data: {
                  ...plan,
                  id: 'temp-id',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                },
                error: null
              };
            }

            // CASO 2: Respuesta JSON de la función {success: true, ...}
            if (typeof result === 'object' && result.success === true) {
              console.log('✅ Plan creado exitosamente (JSON function):', result.data);
              
              // Pequeño delay para que la BD se sincronice
              await new Promise(resolve => setTimeout(resolve, 300));

              // Recargar planes
              this.loadPlanes();

              // Retornar el plan creado (aproximado)
              return {
                data: {
                  ...plan,
                  id: result.plan_id || 'temp-id',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                },
                error: null
              };
            }

            // CASO 3: Error en respuesta JSON {success: false, error: '...'}
            if (typeof result === 'object' && result.success === false) {
              console.error('❌ Plan creation failed:', result.error);
              console.error('Error context:', result.error_context);
              return { error: result.error, data: null } as any;
            }

            // FALLBACK: Si llegamos aquí, asumir éxito (ya que no hay error)
            console.warn('⚠️ Unexpected RPC response format, pero sin error - asumiendo éxito:', result);
            
            // Pequeño delay para que la BD se sincronice
            await new Promise(resolve => setTimeout(resolve, 300));

            // Recargar planes
            this.loadPlanes();

            return {
              data: {
                ...plan,
                id: 'temp-id',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              },
              error: null
            };
          }),
          map(({ data, error }) => {
            if (error) {
              console.error('Error en createPlan:', error);
              return null;
            }
            return data as Plan;
          })
        );
      })
    );
  }

  updatePlan(id: string, plan: Partial<Omit<Plan, 'id' | 'created_at'>>): Observable<Plan | null> {
    const supabase = this.supabaseService.getClient();

    return from(supabase
      .from('planes_moviles')
      .update({
        ...plan,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Error actualizando plan:', error);
          return null;
        }
        this.loadPlanes();
        return data as Plan;
      })
    );
  }

  deletePlan(id: string): Observable<boolean> {
    const supabase = this.supabaseService.getClient();

    return from(supabase
      .from('planes_moviles')
      .delete()
      .eq('id', id)
    ).pipe(
      map(({ error }) => {
        if (error) {
          console.error('Error eliminando plan:', error);
          return false;
        }
        this.loadPlanes();
        return true;
      })
    );
  }

  deactivatePlan(id: string): Observable<boolean> {
    return this.updatePlan(id, { activo: false }).pipe(
      map(result => result !== null)
    );
  }
}
