import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { User, UserProfile, AuthResponse, UserRole } from '../models';
import * as bcryptjs from 'bcryptjs';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private currentUser$ = new BehaviorSubject<User | null>(null);
    private isAuthenticated$ = new BehaviorSubject<boolean>(false);

    constructor(private supabaseService: SupabaseService) {
        this.initializeAuth();
    }

    private initializeAuth(): void {
        const supabase = this.supabaseService.getClient();

        supabase.auth.getSession().then(({ data }) => {
            if (data.session?.user) {
                this.loadUserProfile(data.session.user.id);
            }
        });

        supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user) {
                this.loadUserProfile(session.user.id);
                this.isAuthenticated$.next(true);
            } else {
                this.currentUser$.next(null);
                this.isAuthenticated$.next(false);
            }
        });
    }

    private loadUserProfile(userId: string): void {
        const supabase = this.supabaseService.getClient();

        from(supabase
            .from('perfiles')
            .select('*')
            .match({ user_id: userId })
            .single()
        ).pipe(
            map(({ data, error }) => {
                if (error || !data) return null;
                return {
                    id: data.user_id,
                    email: '',
                    full_name: data.full_name,
                    phone: data.phone,
                    role: data.rol as UserRole,
                    avatar_url: data.avatar_url,
                    created_at: data.created_at,
                    updated_at: data.updated_at
                } as User;
            })
        ).subscribe(user => {
            if (user) {
                this.currentUser$.next(user);
            }
        });
    }

    register(email: string, password: string, fullName: string, phone?: string): Observable<AuthResponse> {
        const supabase = this.supabaseService.getClient();

        return from(
            supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`
                }
            })
        ).pipe(
            switchMap(async ({ data, error }) => {
                if (error) {
                    return { error: error.message || 'Error en el registro' } as AuthResponse;
                }

                if (!data.user) {
                    return { error: 'Usuario no creado' } as AuthResponse;
                }

                const userId = data.user.id;

                try {
                    await new Promise(resolve => setTimeout(resolve, 500));

                    const { error: funcError, data: funcResult } = await supabase
                        .rpc('crear_perfil_usuario', {
                            p_user_id: userId,
                            p_full_name: fullName,
                            p_phone: phone || null,
                            p_rol: 'usuario_registrado'
                        });

                    if (funcError) {
                        console.error('Error en función crear_perfil_usuario:', funcError);
                        return {
                            error: `Error al crear perfil: ${funcError.message}`,
                            user: null
                        } as AuthResponse;
                    }

                    console.log('Perfil creado exitosamente:', funcResult);

                    const mappedUser: User = {
                        id: data.user.id,
                        email: data.user.email ?? '',
                        full_name: fullName,
                        phone: phone || undefined,
                        role: 'usuario_registrado',
                        avatar_url: undefined,
                        created_at: data.user.created_at ?? '',
                        updated_at: data.user.updated_at ?? ''
                    };

                    this.currentUser$.next(mappedUser);
                    this.isAuthenticated$.next(true);

                    return {
                        user: mappedUser,
                        session: data.session ?? null,
                        error: null
                    } as AuthResponse;
                } catch (err: any) {
                    console.error('Error en registro:', err);
                    return {
                        error: err?.message || 'Error desconocido en registro',
                        user: null
                    } as AuthResponse;
                }
            })
        );
    }

    login(email: string, password: string): Observable<AuthResponse> {
        const supabase = this.supabaseService.getClient();

        return from(supabase.auth.signInWithPassword({
            email,
            password
        })).pipe(
            switchMap(({ data, error }) => {
                if (error) {
                    if (error.message && error.message.includes('NavigatorLock')) {
                        console.warn('Lock manager error, retrying...', error);
                        return Promise.resolve({ error: 'Intenta nuevamente. Error de sincronización.' } as AuthResponse);
                    }
                    return Promise.resolve({ error: error.message } as AuthResponse);
                }

                if (data.user) {
                    this.loadUserProfile(data.user.id);
                }

                return Promise.resolve({ user: data.user as any } as AuthResponse);
            }),
            catchError((err: any) => {
                console.error('Login error:', err);
                const errorMessage = err?.message || 'Error al iniciar sesión';

                if (errorMessage.includes('NavigatorLock') || errorMessage.includes('lock')) {
                    return Promise.resolve({ error: 'Intenta nuevamente. Por favor espera un momento.' } as AuthResponse);
                }

                return Promise.resolve({ error: errorMessage } as AuthResponse);
            })
        );
    }

    loginAdvisor(email: string, password: string): Observable<AuthResponse> {
        const supabase = this.supabaseService.getClient();

        return from(supabase.auth.signInWithPassword({ email, password })).pipe(
            switchMap(async ({ data: authData, error: authError }) => {
                if (authError || !authData.user) {
                    return { error: 'Credenciales de asesor no válidas' } as AuthResponse;
                }

                try {
                    const { data: perfil, error: perfilError } = await supabase
                        .from('perfiles')
                        .select('*')
                        .eq('user_id', authData.user.id)
                        .eq('rol', 'asesor_comercial')
                        .single();

                    if (perfilError || !perfil) {
                        await supabase.auth.signOut();
                        return { error: 'Usuario no autorizado como asesor' } as AuthResponse;
                    }

                    const asesorUser: User = {
                        id: authData.user.id,
                        email: authData.user.email || '',
                        full_name: perfil.full_name || '',
                        phone: perfil.phone,
                        role: 'asesor_comercial',
                        avatar_url: perfil.avatar_url,
                        created_at: perfil.created_at,
                        updated_at: perfil.updated_at
                    };

                    this.currentUser$.next(asesorUser);
                    this.isAuthenticated$.next(true);

                    return {
                        user: asesorUser
                    } as AuthResponse;
                } catch (error) {
                    console.error('Error en validación de contraseña:', error);
                    return { error: 'Error al validar credenciales' } as AuthResponse;
                }
            })
        );
    }

    logout(): Observable<void> {
        const supabase = this.supabaseService.getClient();
        return from(supabase.auth.signOut()).pipe(
            map(() => {
                this.currentUser$.next(null);
                this.isAuthenticated$.next(false);
            })
        );
    }

    getCurrentUser(): Observable<User | null> {
        return this.currentUser$.asObservable();
    }

    isAuthenticated(): Observable<boolean> {
        return this.isAuthenticated$.asObservable();
    }

    getUserRole(): Observable<UserRole | null> {
        return this.currentUser$.pipe(
            map(user => user?.role || null)
        );
    }

    isAdvisor(): Observable<boolean> {
        return this.currentUser$.pipe(
            map(user => user?.role === 'asesor_comercial')
        );
    }
}
