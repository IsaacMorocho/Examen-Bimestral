-- ============================================
-- CORREGIR RLS POLICIES - PERMITIR REGISTRO
-- ============================================

-- 1. Primero, desactivar RLS temporalmente para limpiar políticas viejas
ALTER TABLE public.perfiles DISABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas antiguas conflictivas
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON public.perfiles;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON public.perfiles;
DROP POLICY IF EXISTS "Cualquiera puede ver perfiles públicos de asesores" ON public.perfiles;

-- 3. Volver a habilitar RLS
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

-- 4. CREAR NUEVAS POLÍTICAS RLS CORRECTAS

-- Política para INSERT: Usuarios recién creados pueden insertar su propio perfil
CREATE POLICY "Los usuarios pueden crear su propio perfil"
ON public.perfiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política para SELECT: Usuarios ven su propio perfil
CREATE POLICY "Los usuarios pueden ver su propio perfil"
ON public.perfiles
FOR SELECT
USING (auth.uid() = user_id);

-- Política para SELECT: Cualquiera puede ver asesores públicamente
CREATE POLICY "Cualquiera puede ver asesores"
ON public.perfiles
FOR SELECT
USING (rol = 'asesor_comercial');

-- Política para UPDATE: Usuarios pueden actualizar su propio perfil
CREATE POLICY "Los usuarios pueden actualizar su propio perfil"
ON public.perfiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. Verificar que las políticas existen
SELECT polname, polcmd FROM pg_policies WHERE tablename = 'perfiles';
