-- ============================================
-- SOLUCIÓN CON FUNCIÓN SEGURA (SIN RLS)
-- ============================================
-- Esta función bypassa RLS y crea el perfil
-- Se llama desde la app directamente
-- ============================================

-- 1. Crear función que inserta perfil (SECURITY DEFINER = usa BD credentials)
CREATE OR REPLACE FUNCTION public.crear_perfil_usuario(
  p_user_id UUID,
  p_full_name TEXT,
  p_phone TEXT DEFAULT NULL,
  p_rol TEXT DEFAULT 'usuario_registrado'
)
RETURNS json AS $$
DECLARE
  v_result json;
BEGIN
  -- Insertar el perfil (sin RLS porque es SECURITY DEFINER)
  INSERT INTO public.perfiles (user_id, full_name, phone, rol, created_at, updated_at)
  VALUES (p_user_id, p_full_name, p_phone, p_rol, NOW(), NOW())
  ON CONFLICT(user_id) DO NOTHING;
  
  -- Retornar éxito
  v_result := json_build_object('success', true, 'message', 'Perfil creado exitosamente');
  RETURN v_result;
  
EXCEPTION WHEN OTHERS THEN
  -- Retornar error
  v_result := json_build_object('success', false, 'error', SQLERRM);
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Permitir que usuarios autenticados llamen la función
GRANT EXECUTE ON FUNCTION public.crear_perfil_usuario(UUID, TEXT, TEXT, TEXT) TO authenticated;

-- 3. Verificar que se creó
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'crear_perfil_usuario';
