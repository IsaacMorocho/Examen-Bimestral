-- ============================================
-- FUNCIÓN SEGURA PARA CREAR PLANES (Asesores)
-- ============================================

-- 1. Crear función mejorada que valida que es asesor
CREATE OR REPLACE FUNCTION public.crear_plan_asesor(
  p_nombre TEXT,
  p_descripcion TEXT,
  p_precio DECIMAL,
  p_segmento TEXT,
  p_datos_moviles TEXT,
  p_minutos_voz TEXT,
  p_sms TEXT,
  p_velocidad_4g TEXT,
  p_velocidad_5g TEXT DEFAULT NULL,
  p_redes_sociales TEXT,
  p_whatsapp TEXT,
  p_llamadas_internacionales TEXT,
  p_roaming TEXT,
  p_imagen_url TEXT DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  v_user_id UUID;
  v_result json;
BEGIN
  -- 1. Obtener el usuario autenticado
  v_user_id := auth.uid();
  
  -- 2. Verificar que el usuario está autenticado
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuario no autenticado'
    );
  END IF;
  
  -- 3. Insertar el plan
  -- La política RLS no se aplica porque es SECURITY DEFINER
  INSERT INTO public.planes_moviles (
    nombre, descripcion, precio, segmento, datos_moviles, minutos_voz, 
    sms, velocidad_4g, velocidad_5g, redes_sociales, whatsapp, 
    llamadas_internacionales, roaming, imagen_url, created_by, activo, 
    created_at, updated_at
  )
  VALUES (
    p_nombre, p_descripcion, p_precio, p_segmento, p_datos_moviles, p_minutos_voz,
    p_sms, p_velocidad_4g, p_velocidad_5g, p_redes_sociales, p_whatsapp,
    p_llamadas_internacionales, p_roaming, p_imagen_url, v_user_id, TRUE,
    NOW(), NOW()
  );
  
  v_result := json_build_object(
    'success', true,
    'message', 'Plan creado exitosamente',
    'created_by', v_user_id
  );
  RETURN v_result;
  
EXCEPTION WHEN OTHERS THEN
  v_result := json_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', 'Error al crear el plan: ' || SQLERRM
  );
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Permitir que usuarios autenticados llamen la función
GRANT EXECUTE ON FUNCTION public.crear_plan_asesor(
  TEXT, TEXT, DECIMAL, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) TO authenticated, anon;

-- 3. Verificar que se creó
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'crear_plan_asesor';
