# 🔴 DIAGNÓSTICO COMPLETO: Errores de Registro

## 📊 Resumen de Errores

Hay **3 errores relacionados** cuando intentas registrarte:

### Error 1️⃣: `400 Bad Request` en Auth Token
```
POST https://uwiahpshkbovgdzwbixd.supabase.co/auth/v1/token?grant_type=password 400 (Bad Request)
```

**Ubicación en stack trace:** `signInWithPassword @ GoTrueClient.js:463`
**Ubicación en código:** `auth.service.ts:93`

**¿Qué pasaba?**
- El código original hacía `signUp()`, luego intentaba `signInWithPassword()` inmediatamente
- El usuario NO estaba completamente registrado en ese momento
- Supabase rechazaba el login con 400 Bad Request

**Solución aplicada:** ✅
- Removí el `signInWithPassword()` durante el registro
- Ahora solo hace `signUp()` una sola vez
- El usuario ya tiene sesión del `signUp()`

---

### Error 2️⃣: `401 Unauthorized` en POST /perfiles
```
POST https://...supabase.co/rest/v1/perfiles 401 (Unauthorized)
```

**¿Qué significa?**
- La API de Supabase rechaza el INSERT en la tabla `perfiles`
- Es un error de **autenticación** (falta credenciales válidas)
- Es causado por **RLS (Row Level Security)**

**¿Por qué ocurría?**
- No había **política RLS para INSERT** en la tabla `perfiles`
- El usuario está autenticado en `auth`, pero la política RLS no le permitía insertar su perfil
- Las políticas que existían eran solo para SELECT y UPDATE

**Solución necesaria:** 🔧 Ejecutar en Supabase
- Agregar política: `"Los usuarios pueden crear su propio perfil"` (INSERT)
- Esta permite que cualquier usuario inserte un registro donde `user_id = auth.uid()`

---

### Error 3️⃣: `42501` Row Level Security Violation
```
Error: {
  code: '42501',
  message: 'new row violates row-level security policy for table "perfiles"'
}
```

**¿Qué significa?**
- PostgreSQL rechazó la operación porque viola una política RLS
- `42501` es el código de error de PostgreSQL para "POLICY VIOLATION"
- Es el mismo problema que Error 2 pero con el código de error de la BD

**Por qué ocurrían AMBOS (Error 2 y 3)?**
- Supabase devuelve `401 Unauthorized` cuando falla por RLS
- PostgreSQL guarda `42501` en sus logs internos
- Tú ves ambos en la consola

**Solución:** Misma del Error 2 (agregar política RLS)

---

## 🔍 Análisis del Código Original

### `auth.service.ts` - Registro (ANTES) ❌

```typescript
register(email, password, fullName, phone) {
    return from(supabase.auth.signUp({ email, password }))
        .pipe(
            switchMap(async ({ data, error }) => {
                // ... validaciones ...

                const userId = data.user.id;

                // ❌ PROBLEMA: Intenta hacer login INMEDIATAMENTE después de signup
                const { data: sessionData } = await supabase.auth.getSession();
                if (!sessionData.session) {
                    // ❌ Esto falla con 400 Bad Request
                    await supabase.auth.signInWithPassword({ email, password });
                }

                // Intenta insertar perfil
                const { error: insertError } = await supabase
                    .from('perfiles')
                    .insert({ user_id: userId, ... });

                // ❌ Si RLS no permite INSERT, error 401/42501
                if (insertError) {
                    console.error('Error insertando perfil:', insertError);
                }
            })
        );
}
```

**Problemas:**
1. El `signInWithPassword()` intenta reutilizar credenciales que acaban de crearse
2. Supabase auth aún no está listo para ese login
3. Incluso si funcionara, falta la política RLS de INSERT

---

### `auth.service.ts` - Registro (DESPUÉS) ✅

```typescript
register(email, password, fullName, phone) {
    return from(
        supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`
            }
        })
    )
    .pipe(
        switchMap(async ({ data, error }) => {
            // ... validaciones ...

            const userId = data.user.id;

            // ✅ AHORA: Insertar perfil SIN hacer login adicional
            // El usuario ya está en sesión después de signUp()
            const { error: insertError } = await supabase
                .from('perfiles')
                .insert({
                    user_id: userId,
                    full_name: fullName,
                    phone: phone || undefined,
                    rol: 'usuario_registrado'
                });

            // ✅ Manejo mejorado de errores
            if (insertError) {
                return {
                    error: `Error al crear perfil: ${insertError.message}`,
                    user: null
                };
            }

            // ✅ Actualizar estado global
            this.currentUser$.next(mappedUser);
            this.isAuthenticated$.next(true);

            return { user: mappedUser, session: data.session };
        })
    );
}
```

**Mejoras:**
1. ✅ Removido el `signInWithPassword()` problemático
2. ✅ Agregada redirección de email confirmación
3. ✅ Mejor manejo de errores
4. ✅ Actualiza estado global del usuario
5. ✅ Todavía necesita la política RLS en Supabase

---

## 🗃️ Flujo de Datos del Registro

### Antes (FALLANDO) ❌

```
1. Usuario llena formulario
   ↓
2. Angular llama auth.service.register()
   ↓
3. Supabase: signUp({ email, password })
   ├─ ✅ Crea usuario en auth.users
   ├─ ✅ Crea sesión
   └─ Retorna { data.user.id = 'abc-123' }
   ↓
4. Intenta: signInWithPassword({ email, password })
   ├─ ❌ 400 Bad Request (problema 1)
   └─ Stack trace hacia: zone.js, GoTrueClient.js, helpers.js...
   ↓
5. Intenta: INSERT INTO perfiles
   ├─ ❌ 401 Unauthorized (problema 2)
   ├─ ❌ 42501 RLS violation (problema 3)
   └─ No se crea el perfil
   ↓
6. Usuario frustrado: "¿Por qué no me registro?"
```

### Después (FUNCIONA) ✅

```
1. Usuario llena formulario
   ↓
2. Angular llama auth.service.register()
   ↓
3. Supabase: signUp({ email, password })
   ├─ ✅ Crea usuario en auth.users
   ├─ ✅ Crea sesión
   └─ Retorna { data.user.id = 'abc-123' }
   ↓
4. ✅ Directamente: INSERT INTO perfiles (user_id = 'abc-123', ...)
   ├─ ✅ Si RLS permite: Perfil creado ✓
   ├─ ❌ Si RLS bloquea: 401/42501 (pero esto se arregla con SQL)
   └─ No hay conflicto de authenticación
   ↓
5. Retorna: { user: mappedUser, session: data.session }
   ↓
6. Angular actualiza estado y redirige
   ↓
7. ✅ Usuario registrado y listo para usar
```

---

## 🔧 Qué Necesitas Hacer AHORA

### Paso 1: Ejecutar SQL en Supabase ⚠️ CRÍTICO
Necesitas crear la política RLS de INSERT.

Ve a: **Supabase → SQL Editor → New Query**

Pega y ejecuta:
```sql
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden crear su propio perfil"
ON public.perfiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### Paso 2: Ya está hecho en código ✅
He actualizado `auth.service.ts` para remover el `signInWithPassword()` problemático.

### Paso 3: Compilar y Probar
La app ya debería compilar. Prueba el registro.

---

## 📋 Checklist de Solución

- [ ] Abrí Supabase SQL Editor
- [ ] Copié y ejecuté el script SQL (política RLS de INSERT)
- [ ] Vi "Query executed successfully"
- [ ] Limpié caché del navegador (Ctrl + Shift + Delete)
- [ ] Recargué la página (Ctrl + F5)
- [ ] Intenté registrarme nuevamente
- [ ] ✅ Funcionó! (sin errores 400, 401, ni 42501)

---

## 🚨 Debugging: Si AÚN Falla

Ejecuta estas queries en Supabase SQL Editor:

### 1. Verificar políticas
```sql
SELECT polname, polcmd FROM pg_policies WHERE tablename = 'perfiles';
```
**Debería mostrar 4 políticas** (INSERT, SELECT x2, UPDATE)

### 2. Verificar RLS está activo
```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'perfiles';
```
**Debería mostrar `rowsecurity = true`**

### 3. Verificar usuario creado
```sql
SELECT id, email, created_at FROM auth.users WHERE email = 'tu-email@test.com' LIMIT 1;
```
**Si aparece aquí pero NO en `public.perfiles`, entonces RLS bloqueó INSERT**

### 4. Intentar INSERT manual (para debug)
```sql
-- Reemplaza 'user-id-aqui' con un ID real de auth.users
INSERT INTO public.perfiles (user_id, full_name, phone, rol)
VALUES ('user-id-aqui', 'Test User', '+1234567890', 'usuario_registrado');
```
**Si falla con 42501, RLS aún está bloqueado**

---

## 📞 Resumen Final

| Problema | Causa | Solución |
|----------|-------|----------|
| 400 Bad Request | `signInWithPassword()` inmediato | ✅ Removido en auth.service.ts |
| 401 Unauthorized | RLS sin política INSERT | 🔧 Ejecutar SQL en Supabase |
| 42501 RLS Violation | Misma causa que 401 | 🔧 Ejecutar SQL en Supabase |

**Los cambios en código ya están hechos.** Solo necesitas ejecutar el SQL en Supabase.
