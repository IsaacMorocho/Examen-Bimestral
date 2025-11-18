## DIAGNÓSTICO Y FIX: Error creando plan: null

### El Problema
```
Error creando plan: null
```

Esto significa que la función RPC `crear_plan_asesor()` está retornando `null` o un valor inesperado.

**Posibles causas:**
1. La función NO existe en Supabase
2. La función existe pero retorna null (auth.uid() es NULL)
3. La función retorna un error que no se está mostrando

---

## SOLUCIÓN EN 3 PASOS

### ✅ Paso 1: Ejecutar SQL Mejorada en Supabase

Esta SQL crea la función con mejor manejo de errores y logging:

1. Ve a **Supabase Dashboard → SQL Editor**
2. Haz clic en **"New Query"**
3. **Copia TODO el contenido de:**
   - `SQL_CREAR_PLAN_ASESOR_MEJORADA.sql`
4. **Pega en SQL Editor**
5. Haz clic en **"Run"** (Ctrl+Enter)
6. Deberías ver: **"Query executed successfully"**

✅ **La función mejorada está ahora en Supabase**

---

### ✅ Paso 2: Verificar Función Existe

En el mismo SQL Editor, ejecuta:
```sql
SELECT proname, prosecdef 
FROM pg_proc 
WHERE proname = 'crear_plan_asesor';
```

Deberías ver:
- `proname`: `crear_plan_asesor`
- `prosecdef`: `true` (significa SECURITY DEFINER)

Si no aparece, la función NO se creó. Revisa si hay errores.

---

### ✅ Paso 3: Recargar App y Prueba

1. **Ctrl + Shift + Delete** (limpiar caché)
2. **Ctrl + F5** (recarga forzada)
3. Login como asesor: `asesor1@tigo.com` / `asesor123`
4. Crear plan
5. **Abre DevTools** (F12)
6. Ve a **Console**
7. Deberías ver logs como:
   ```
   RPC Response crear_plan_asesor: {success: true, plan_id: "xxx", ...}
   Plan creado exitosamente: {id: "xxx", nombre: "..."}
   ```

✅ **Si ves estos logs, el plan se crea exitosamente**

---

## Debugging Detallado

### Si ves este log:
```
RPC Response crear_plan_asesor: {success: false, error: "Usuario no autenticado..."}
```

**Problema:** `auth.uid()` es NULL → Usuario no está autenticado correctamente

**Solución:**
1. Verifica que inicié sesión como asesor
2. Verifica que el token está activo (recarga la página)
3. Cierra sesión y vuelve a iniciar

### Si ves este log:
```
RPC Response crear_plan_asesor: null
```

**Problema:** La función retorna NULL (no debería pasar)

**Solución:**
1. Verifica que ejecutaste el SQL correcto
2. Ejecuta en SQL Editor:
   ```sql
   SELECT * FROM pg_proc WHERE proname = 'crear_plan_asesor';
   ```
3. Si no aparece, la función no se creó. Intenta de nuevo.

### Si ves error en Console:
```
RPC Response crear_plan_asesor: {error: "relation \"planes_moviles\" does not exist"}
```

**Problema:** Tabla `planes_moviles` no existe

**Solución:**
1. Ejecuta `DATABASE_SETUP.sql` en Supabase
2. Verifica que la tabla fue creada

---

## Cambios en el Código (planes.service.ts)

He mejorado `createPlan()` para:

✅ **Registrar la respuesta completa del RPC:**
```typescript
console.log('RPC Response crear_plan_asesor:', result);
```

✅ **Manejar null/undefined:**
```typescript
if (!result) {
  console.error('RPC retornó null/undefined');
  return { error: 'RPC retornó null', data: null };
}
```

✅ **Diferenciar entre success/error:**
```typescript
if (result.success === false) {
  console.error('Error:', result.error);
  console.error('Context:', result.error_context);
}
```

✅ **Registrar contexto de error:**
```typescript
'error_context': {
  'function': 'crear_plan_asesor',
  'user_id': v_user_id,
  'sqlstate': SQLSTATE
}
```

---

## Checklist - ¿Qué verificar?

1. ✅ Ejecuté `SQL_CREAR_PLAN_ASESOR_MEJORADA.sql` en Supabase
2. ✅ Ejecuté `SQL_STORAGE_RLS_POLICIES.sql` en Supabase
3. ✅ Limpié caché del navegador (Ctrl+Shift+Delete)
4. ✅ Recargué la app (Ctrl+F5)
5. ✅ Inicialisé sesión como asesor
6. ✅ Abrí DevTools (F12) y veo los logs
7. ✅ El log muestra `{success: true, ...}`
8. ✅ El plan aparece en el dashboard

Si completaste todo esto y aún no funciona, ejecuta este SQL de diagnostico:

```sql
-- Ver si hay permisos en la función
SELECT grantee, privilege_type 
FROM role_table_grants 
WHERE table_name = 'planes_moviles';

-- Ver los límites de RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'planes_moviles';

-- Ver todas las políticas de RLS en planes_moviles
SELECT policyname, cmd, roles, qual
FROM pg_policies 
WHERE tablename = 'planes_moviles';
```

---

## Resumen

| Paso | Acción | Estado |
|------|--------|--------|
| 1 | Ejecutar SQL mejorada | ✅ |
| 2 | Verificar función existe | ✅ |
| 3 | Limpiar caché | ✅ |
| 4 | Recarga forzada | ✅ |
| 5 | Abrir DevTools | ✅ |
| 6 | Ver logs de éxito | ✅ |

**Debería funcionar ahora** 🎉
