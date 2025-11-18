-- ============================================
-- FUNCIÓN SEGURA MEJORADA - CON VALIDACIÓN
-- ============================================

-- 1. Crear función mejorada que valida el usuario primero
CREATE OR REPLACE FUNCTION public.crear_perfil_usuario(
  p_user_id UUID,
  p_full_name TEXT,
  p_phone TEXT DEFAULT NULL,
  p_rol TEXT DEFAULT 'usuario_registrado'
)
RETURNS json AS $$
DECLARE
  v_user_exists BOOLEAN;
  v_result json;
BEGIN
  -- 1. Verificar que el usuario existe en auth.users
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id)
  INTO v_user_exists;
  
  IF NOT v_user_exists THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuario no encontrado en auth.users'
    );
  END IF;
  
  -- 2. Verificar que no hay perfil duplicado
  IF EXISTS(SELECT 1 FROM public.perfiles WHERE user_id = p_user_id) THEN
    RETURN json_build_object(
      'success', true,
      'message', 'Perfil ya existe para este usuario'
    );
  END IF;
  
  -- 3. Insertar el perfil
  INSERT INTO public.perfiles (user_id, full_name, phone, rol, created_at, updated_at)
  VALUES (p_user_id, p_full_name, p_phone, p_rol, NOW(), NOW());
  
  v_result := json_build_object(
    'success', true,
    'message', 'Perfil creado exitosamente',
    'user_id', p_user_id
  );
  RETURN v_result;
  
EXCEPTION WHEN OTHERS THEN
  v_result := json_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', 'Error al crear el perfil: ' || SQLERRM
  );
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Permitir acceso a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.crear_perfil_usuario(UUID, TEXT, TEXT, TEXT) TO authenticated, anon;

-- 3. Verificar que se creó
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'crear_perfil_usuario';
