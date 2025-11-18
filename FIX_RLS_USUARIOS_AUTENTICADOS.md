# 🔴 PROBLEMA: RLS sigue bloqueando incluso después de políticas

## ¿Qué está pasando?

El error persiste:
```
42501: new row violates row-level security policy for table "perfiles"
```

Esto ocurre porque después de `signUp()`, el usuario en Supabase **tiene estado especial**:
- ✅ Existe en `auth.users`
- ✅ Tiene una sesión válida
- ❌ Pero RLS lo trata como "usuario nuevo sin verificar"

## 🔧 Solución: Política RLS Correcta para Nuevos Usuarios

**Ejecuta ESTO en Supabase SQL Editor:**

```sql
-- ============================================
-- FIX: RLS para nuevos usuarios sin verificar
-- ============================================

-- 1. Desactivar RLS temporalmente
ALTER TABLE public.perfiles DISABLE ROW LEVEL SECURITY;

-- 2. Eliminar TODAS las políticas viejas
DROP POLICY IF EXISTS "Los usuarios pueden crear su propio perfil" ON public.perfiles;
DROP POLICY IF EXISTS "Los usuarios pueden ver su propio perfil" ON public.perfiles;
DROP POLICY IF EXISTS "Cualquiera puede ver asesores" ON public.perfiles;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propio perfil" ON public.perfiles;
DROP POLICY IF EXISTS "Los usuarios pueden insertar su perfil" ON public.perfiles;

-- 3. Volver a habilitar RLS
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

-- 4. NUEVA POLÍTICA: Permitir INSERT a CUALQUIER usuario autenticado
-- (no requiere verificación de email)
CREATE POLICY "Usuarios autenticados pueden crear su propio perfil"
ON public.perfiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id::text);

-- 5. NUEVA POLÍTICA: SELECT su propio perfil
CREATE POLICY "Usuarios autenticados ven su propio perfil"
ON public.perfiles
FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id::text);

-- 6. NUEVA POLÍTICA: SELECT perfiles de asesores (para cualquiera)
CREATE POLICY "Perfiles de asesores públicos"
ON public.perfiles
FOR SELECT
TO public
USING (rol = 'asesor_comercial');

-- 7. NUEVA POLÍTICA: UPDATE su propio perfil
CREATE POLICY "Usuarios autenticados actualizan su perfil"
ON public.perfiles
FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_id::text)
WITH CHECK (auth.uid()::text = user_id::text);

-- 8. Verificar
SELECT polname, polcmd, roles FROM pg_policies WHERE tablename = 'perfiles' ORDER BY polname;
```

## ¿Qué cambió?

| Antes | Ahora |
|-------|-------|
| `WITH CHECK (auth.uid() = user_id)` | `WITH CHECK (auth.uid()::text = user_id::text)` |
| Aplicaba a todos | `TO authenticated` (solo usuarios autenticados) |
| Podía fallar con tipos mixed | Conversión explícita a texto |

## ✅ Pasos:

1. Copia TODO el script SQL anterior
2. Ve a Supabase → SQL Editor → New Query
3. Pega y ejecuta (Ctrl + Enter)
4. Deberías ver: "Query executed successfully"
5. Limpia caché del navegador (Ctrl + Shift + Delete)
6. Recarga (Ctrl + F5)
7. **Intenta registrarte de nuevo**

---

## 🐛 Si SIGUE fallando, ejecuta este DEBUG:

```sql
-- Ver tipo de datos del campo
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'perfiles' AND column_name IN ('user_id', 'id');

-- Ver políticas actuales
SELECT polname, polcmd, poldef FROM pg_policies 
WHERE tablename = 'perfiles' ORDER BY polname;

-- Verificar que RLS está ON
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'perfiles';
```

---

## 📞 Alternativa (Si nada funciona):

Si las políticas siguen fallando, es posible que necesites:

1. **Opción A**: Usar anon key solo para signup, luego cambiar a service key para insert
2. **Opción B**: Crear una función PostgreSQL que hace el INSERT sin RLS
3. **Opción C**: Usar un trigger que crea el perfil automáticamente

Por ahora, intenta con el script anterior. Reporta si funciona o si tienes otro error diferente.
