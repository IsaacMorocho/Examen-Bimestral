# ✅ SOLUCIÓN CON TRIGGER: Auto-crear Perfil al Registrarse

Si el método anterior con RLS no funciona, usa **un trigger en PostgreSQL** que crea automáticamente el perfil cuando se registra un usuario.

## 🚀 Ventajas de esta Solución

- ✅ El perfil se crea **automáticamente** sin necesidad de insertar desde la app
- ✅ Evita problemas de RLS completamente
- ✅ Más seguro (usa credenciales de BD, no de cliente)
- ✅ El usuario solo hace `signUp()` y listo

## 🔧 SQL: Crear Trigger

**Ejecuta ESTO en Supabase SQL Editor:**

```sql
-- ============================================
-- CREAR TRIGGER PARA AUTO-CREAR PERFIL
-- ============================================

-- 1. Crear función que auto-crea el perfil
CREATE OR REPLACE FUNCTION public.create_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfiles (user_id, full_name, rol, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.user_metadata->>'full_name', NEW.email),
    'usuario_registrado',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Crear el trigger en la tabla auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_profile_on_signup();

-- 3. Verificar que el trigger existe
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

## ✅ Después de Crear el Trigger

Ya NO necesitas que `auth.service.ts` intente insertar el perfil. Puedes cambiar el método `register()` a:

```typescript
register(email: string, password: string, fullName: string, phone?: string): Observable<AuthResponse> {
    const supabase = this.supabaseService.getClient();

    return from(
        supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName  // ← Pasa el nombre para el trigger
                }
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

            // ✅ El perfil ya se creó automáticamente por el trigger
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
        })
    );
}
```

---

## 📋 Flujo Completo con Trigger

```
1. Usuario hace click en "Registrarse"
   ↓
2. Angular: auth.service.register(email, password, fullName, phone)
   ↓
3. Supabase: signUp({ email, password, options: { data: { full_name } } })
   ↓
4. ✅ Usuario creado en auth.users
   ↓
5. 🔥 TRIGGER AUTOMÁTICO: Crea registro en perfiles
   ├─ user_id = nuevo usuario id
   ├─ full_name = del metadata
   ├─ rol = 'usuario_registrado'
   └─ created_at = NOW()
   ↓
6. Retorna éxito
   ↓
7. Angular actualiza estado
   ↓
8. ✅ Usuario registrado y perfil creado
```

---

## 🎯 ¿Cuál Usar?

### Usa RLS Policies si:
- Quieres que la app controle el insert
- Prefieres lógica en el frontend
- Necesitas personalización dinámica

### Usa Trigger si:
- Quieres simplificar el frontend
- Prefieres que la BD haga el trabajo
- Quieres máxima seguridad

**Recomendación:** Usa el **TRIGGER** porque es más robusto y simple.

---

## ✅ Pasos Finales:

1. Ejecuta el script SQL del trigger en Supabase
2. Espera "Query executed successfully"
3. Intenta registrarte (solo `signUp()`, nada más)
4. ¡Debería funcionar!

Si aún tienes problema, reporta el error exacto.
