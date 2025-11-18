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
  private planesRefresh$ = interval(5000);

  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService
  ) {
    this.initializeRealtime();
  }

  private initializeRealtime(): void {
    const supabase = this.supabaseService.getClient();
    
    this.loadPlanes();

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

    const currentUserObs = this.authService.getCurrentUser();
    
    return currentUserObs.pipe(
      switchMap(currentUser => {
        if (!currentUser || !currentUser.id) {
          console.error('❌ No hay usuario autenticado para crear plan');
          return from(Promise.resolve(null));
        }

        console.log('📝 Creando plan para user_id:', currentUser.id);

        const planData = {
          nombre: plan.nombre,
          descripcion: plan.descripcion,
          precio: plan.precio,
          segmento: plan.segmento,
          datos_moviles: plan.datos_moviles,
          minutos_voz: plan.minutos_voz,
          sms: plan.sms,
          velocidad_4g: plan.velocidad_4g,
          velocidad_5g: plan.velocidad_5g,
          redes_sociales: plan.redes_sociales,
          whatsapp: plan.whatsapp,
          llamadas_internacionales: plan.llamadas_internacionales,
          roaming: plan.roaming,
          imagen_url: plan.imagen_url,
          created_by: currentUser.id,
          activo: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        return from(
          supabase
            .from('planes_moviles')
            .insert([planData])
            .select()
            .single()
        ).pipe(
          switchMap(async (result: any) => {
            console.log('Response inserting plan:', result);
            
            if (result.error) {
              console.error('❌ Error inserting plan:', result.error);
              return { error: result.error.message, data: null } as any;
            }

            console.log('✅ Plan creado exitosamente:', result.data);
            
            await new Promise(resolve => setTimeout(resolve, 300));
            this.loadPlanes();

            return {
              data: result.data as Plan,
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
