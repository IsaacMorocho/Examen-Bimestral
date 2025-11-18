# 🚀 FIX REGISTRO DE USUARIOS - GUÍA PASO A PASO

## 🎯 El Problema

Cuando intentas registrarte, ves estos errores:
```
❌ 400 Bad Request en auth token
❌ 401 Unauthorized en POST /perfiles
❌ 42501 Row Level Security violation
```

## 🔧 La Solución (5 minutos)

### PASO 1: Ir a Supabase SQL Editor

1. Abre [supabase.com](https://supabase.com)
2. Entra a tu proyecto **TIGO Conecta**
3. En el menú izquierdo, haz clic en **"SQL Editor"**
4. Haz clic en el botón azul **"New Query"**

### PASO 2: Copiar y Ejecutar el Script SQL

**Copia TODO esto** y pégalo en el SQL Editor de Supabase:

```sql
-- ============================================
-- CORREGIR RLS POLICIES - PERMITIR REGISTRO
-- ============================================

-- 1. Desactivar RLS temporalmente para limpiar políticas viejas
ALTER TABLE public.perfiles DISABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas antiguas conflictivas
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON public.perfiles;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON public.perfiles;
DROP POLICY IF EXISTS "Cualquiera puede ver perfiles públicos de asesores" ON public.perfiles;
DROP POLICY IF EXISTS "Los usuarios pueden insertar su perfil" ON public.perfiles;

-- 3. Volver a habilitar RLS
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

-- 4. CREAR NUEVAS POLÍTICAS RLS CORRECTAS

-- ✅ Política 1: INSERT - Usuarios pueden crear su propio perfil
CREATE POLICY "Los usuarios pueden crear su propio perfil"
ON public.perfiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ✅ Política 2: SELECT - Usuarios ven su propio perfil
CREATE POLICY "Los usuarios pueden ver su propio perfil"
ON public.perfiles
FOR SELECT
USING (auth.uid() = user_id);

-- ✅ Política 3: SELECT - Cualquiera puede ver asesores
CREATE POLICY "Cualquiera puede ver asesores"
ON public.perfiles
FOR SELECT
USING (rol = 'asesor_comercial');

-- ✅ Política 4: UPDATE - Usuarios pueden actualizar su propio perfil
CREATE POLICY "Los usuarios pueden actualizar su propio perfil"
ON public.perfiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. Verificar que las políticas se crearon correctamente
SELECT polname, polcmd FROM pg_policies WHERE tablename = 'perfiles' ORDER BY polname;
```

### PASO 3: Ejecutar el Script

1. En Supabase SQL Editor, haz clic en el botón azul **"Run"** (arriba a la derecha)
2. O presiona **Ctrl + Enter**
3. Deberías ver el mensaje: **"Query executed successfully"**

### PASO 4: Verificar que Funcionó

Ejecuta esta query para confirmar:

```sql
SELECT polname, polcmd FROM pg_policies WHERE tablename = 'perfiles' ORDER BY polname;
```

**Deberías ver 4 políticas:**
- ✅ `Los usuarios pueden actualizar su propio perfil` (UPDATE)
- ✅ `Los usuarios pueden crear su propio perfil` (INSERT)
- ✅ `Los usuarios pueden ver su propio perfil` (SELECT)
- ✅ `Cualquiera puede ver asesores` (SELECT)

### PASO 5: Limpiar Caché y Probar

1. En tu navegador, presiona **Ctrl + Shift + Delete** (borrar caché)
2. Selecciona todo y haz clic en **"Borrar datos"**
3. Recarga la página: **Ctrl + F5**
4. Intenta registrarte de nuevo

---

## ✅ Ahora Prueba el Registro

1. Abre la app en tu navegador
2. Haz clic en **"Registrarse"** (rol Usuario)
3. Completa el formulario:
   - Email: `prueba@ejemplo.com` (cualquier email válido)
   - Contraseña: `Contraseña123!`
   - Nombre completo: `Tu Nombre`
   - Teléfono: `+1234567890`
4. Marca "Acepto términos"
5. Haz clic en **"Registrarse"**

**Esperado**: No deberías ver errores 401, 400, ni 42501. Deberías ver un mensaje de éxito.

---

## 🐛 Si Aún Falla

### Opción 1: Verificar Estado de RLS

Ejecuta en SQL Editor:
```sql
-- Ver tabla perfiles
SELECT * FROM public.perfiles LIMIT 5;

-- Ver políticas de perfiles
SELECT polname, polcmd FROM pg_policies WHERE tablename = 'perfiles';

-- Ver si RLS está activado
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'perfiles';
```

**Debería mostrar: `rowsecurity = true`**

### Opción 2: Ejecutar Script Alternativo

Si el anterior no funciona, ejecuta este:

```sql
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

-- Agregar solo la política de INSERT
CREATE POLICY "Los usuarios pueden insertar su perfil"
ON public.perfiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### Opción 3: Verificar Que el Usuario Se Creó

```sql
SELECT id, email FROM auth.users WHERE email = 'tu-email@ejemplo.com';
```

Si aparece el usuario en `auth.users` pero no en `public.perfiles`, entonces **el INSERT estaba bloqueado por RLS** (exactamente el problema que estamos arreglando).

---

## 📞 Resumen Rápido

| Paso | Acción |
|------|--------|
| 1 | Abre Supabase → SQL Editor → New Query |
| 2 | Copia el script SQL anterior |
| 3 | Pégalo y haz clic en Run (Ctrl + Enter) |
| 4 | Espera "Query executed successfully" |
| 5 | Limpia caché (Ctrl + Shift + Delete) |
| 6 | Recarga página (Ctrl + F5) |
| 7 | Prueba el registro |

**¡Hecho!** 🎉
