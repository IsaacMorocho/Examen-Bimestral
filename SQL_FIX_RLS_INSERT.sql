-- =====================================================
-- FIX: Agregar política RLS de INSERT para perfiles
-- Error: 42501 "new row violates row-level security policy"
-- =====================================================

-- 1️⃣ Verificar que RLS está habilitado (debería estarlo)
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

-- 2️⃣ Agregar política de INSERT para usuarios autenticados
-- Los usuarios pueden insertar su propio perfil
CREATE POLICY "Los usuarios pueden insertar su perfil"
ON public.perfiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);
    
-- 3️⃣ Verificar políticas existentes (opcional - para debug)
-- SELECT * FROM pg_policies WHERE tablename = 'perfiles';

-- =====================================================
-- Notas:
-- - Esta política permite INSERT solo si el user_id 
--   del nuevo registro coincide con el UID autenticado
-- - El registro() llama a signUp() que autentica al usuario
-- - Por eso funciona: el usuario está autenticado cuando 
--   intenta insertar su perfil
-- =====================================================
