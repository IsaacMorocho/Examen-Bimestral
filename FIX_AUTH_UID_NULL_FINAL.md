## SOLUCIÓN FINAL: auth.uid() NULL - Pasar user_id desde Cliente

### El Problema
```
"error": "Usuario no autenticado - auth.uid() es NULL"
```

**Causa raíz:** La función SQL `crear_plan_asesor()` intentaba usar `auth.uid()`, pero:
- Tú estás logueado como **asesor LOCAL** (tabla `asesores`)
- NO estás logueado en **Supabase Auth** (tabla `auth.users`)
- Por eso `auth.uid()` retorna NULL

**Solución:** Pasar el `user_id` desde el cliente Angular en lugar de usarlo desde SQL.

---

## CAMBIOS REALIZADOS

### 1. **SQL Mejorada** (`SQL_CREAR_PLAN_CON_USER_ID.sql`)
```sql
-- ANTES: Intentaba usar auth.uid() que retorna NULL
CREATE FUNCTION crear_plan_asesor(...) RETURNS json AS $$
  v_user_id := auth.uid();  -- ❌ NULL para usuarios locales

-- AHORA: Recibe user_id como parámetro
CREATE FUNCTION crear_plan_asesor(
  p_user_id UUID,  -- ✅ NUEVO parámetro
  p_nombre TEXT,
  ...
```

### 2. **Angular Service Mejorado** (`planes.service.ts`)
```typescript
// ANTES: No pasaba user_id
supabase.rpc('crear_plan_asesor', {
  p_nombre: plan.nombre,  // ❌ Faltaba p_user_id
  ...
})

// AHORA: Obtiene user_id del AuthService y lo pasa
const currentUser = this.authService.getCurrentUser();
supabase.rpc('crear_plan_asesor', {
  p_user_id: currentUser.id,  // ✅ NUEVO parámetro
  p_nombre: plan.nombre,
  ...
})
```

---

## PASO A PASO - Qué Hacer Ahora

### ✅ Paso 1: Ejecutar SQL Mejorada en Supabase

1. Ve a **Supabase Dashboard → SQL Editor**
2. Haz clic en **"New Query"**
3. **Copia TODO el contenido de:**
   - `SQL_CREAR_PLAN_CON_USER_ID.sql`
4. **Pega en SQL Editor**
5. Haz clic en **"Run"** (Ctrl+Enter)
6. Deberías ver: **"Query executed successfully"**

✅ **La función mejorada está ahora en Supabase**

---

### ✅ Paso 2: Ejecutar Políticas de Storage (si aún no lo hiciste)

1. En el mismo SQL Editor
2. **Copia TODO el contenido de:**
   - `SQL_STORAGE_RLS_POLICIES.sql`
3. **Pega en SQL Editor**
4. Haz clic en **"Run"** (Ctrl+Enter)
5. Deberías ver: **"Query executed successfully"** (x4 - 4 políticas)

✅ **Las políticas de Storage están creadas**

---

### ✅ Paso 3: Limpiar Caché y Recarga

1. **Ctrl + Shift + Delete** (abrir panel de borrado)
2. Selecciona: **"Todo el tiempo"**
3. Marca todas las opciones
4. Haz clic: **"Borrar datos"**
5. **Ctrl + F5** (recarga forzada)

---

### ✅ Paso 4: Prueba Crear Plan

1. **Login como asesor**: `asesor1@tigo.com` / `asesor123`
2. **Ir a crear plan**
3. Llena todos los campos
4. Selecciona imagen (JPG/PNG)
5. Haz clic en **"Crear Plan"**

**Debería funcionar ahora** ✅

---

## Verificación en Console (F12)

### ✅ Si ves estos logs:
```
📝 Creando plan para user_id: 12345678-1234-1234-1234-123456789abc
RPC Response crear_plan_asesor: {error: null, data: {...}, status: 200}
✅ Plan creado exitosamente (Supabase wrapper)
```

**¡ÉXITO!** El plan se creó correctamente.

### ❌ Si ves este log:
```
❌ Función retornó error: Usuario no autenticado - auth.uid() es NULL
```

**Significa:** No ejecutaste el SQL mejorado. Vuelve al Paso 1 y ejecuta `SQL_CREAR_PLAN_CON_USER_ID.sql`

### ❌ Si ves este log:
```
❌ No hay usuario autenticado para crear plan
```

**Significa:** No estás logueado correctamente. Verifica:
1. ¿Iniciaste sesión?
2. ¿Eres un asesor?
3. Cierra sesión y vuelve a iniciar

---

## Resumen de Cambios

| Antes | Después |
|-------|---------|
| ❌ Función usa `auth.uid()` (NULL para locales) | ✅ Función recibe `p_user_id` como parámetro |
| ❌ Angular NO pasa user_id | ✅ Angular obtiene user_id del AuthService |
| ❌ Error: "Usuario no autenticado" | ✅ Plan se crea correctamente |

---

## Troubleshooting

### Problema: Sigue sin funcionar

**Checklist:**
1. ✅ Ejecuté `SQL_CREAR_PLAN_CON_USER_ID.sql`?
2. ✅ Ejecuté `SQL_STORAGE_RLS_POLICIES.sql`?
3. ✅ Limpié caché (Ctrl+Shift+Delete)?
4. ✅ Recargué app (Ctrl+F5)?
5. ✅ Estoy logueado como asesor?
6. ✅ Veo logs en Console (F12)?

### Problema: Error diferente en console

Copia el error exacto y muéstramelo - así puedo diagnosticar rápidamente.

---

## Próximos Pasos Después de Éxito

1. ✅ Crea 3-5 planes con imágenes
2. ✅ Verifica que aparezcan en dashboard
3. ✅ Intenta editarlos
4. ✅ Intenta eliminarlos
5. ✅ Prueba también como usuario registrado (no asesor)

**¡Debería todo funcionar perfectamente ahora!** 🎉
