-- ============================================================================
-- FUNCIÓN: crear_plan_asesor - Crear planes para asesores
-- ============================================================================
-- Esta función crea un plan móvil con los datos del asesor autenticado
-- Usa SECURITY DEFINER para bypass RLS
-- ============================================================================

-- 1. ELIMINAR FUNCIÓN ANTERIOR (si existe y tiene diferentes parámetros)
DROP FUNCTION IF EXISTS crear_plan_asesor(
  TEXT, TEXT, DECIMAL, TEXT, TEXT, TEXT, TEXT, 
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) CASCADE;

-- 2. CREAR FUNCIÓN NUEVA CON MANEJO DE ERRORES MEJORADO
CREATE OR REPLACE FUNCTION crear_plan_asesor(
  p_nombre TEXT,
  p_descripcion TEXT,
  p_precio DECIMAL,
  p_segmento TEXT,
  p_datos_moviles TEXT,
  p_minutos_voz TEXT,
  p_sms TEXT,
  p_velocidad_4g TEXT,
  p_velocidad_5g TEXT,
  p_redes_sociales TEXT,
  p_whatsapp TEXT,
  p_llamadas_internacionales TEXT,
  p_roaming TEXT,
  p_imagen_url TEXT DEFAULT NULL
) RETURNS json AS $$
DECLARE
  v_plan_id UUID;
  v_user_id UUID;
  v_error_msg TEXT;
BEGIN
  -- Obtener el user_id del usuario autenticado
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuario no autenticado - auth.uid() es NULL',
      'data', NULL
    );
  END IF;

  -- Log para debugging
  RAISE NOTICE 'Creando plan para user_id: %', v_user_id;

  -- Insertar el plan
  INSERT INTO planes_moviles (
    nombre,
    descripcion,
    precio,
    segmento,
    datos_moviles,
    minutos_voz,
    sms,
    velocidad_4g,
    velocidad_5g,
    redes_sociales,
    whatsapp,
    llamadas_internacionales,
    roaming,
    imagen_url,
    created_by,
    activo
  ) VALUES (
    p_nombre,
    p_descripcion,
    p_precio,
    p_segmento,
    p_datos_moviles,
    p_minutos_voz,
    p_sms,
    p_velocidad_4g,
    p_velocidad_5g,
    p_redes_sociales,
    p_whatsapp,
    p_llamadas_internacionales,
    p_roaming,
    p_imagen_url,
    v_user_id,
    true
  )
  RETURNING id INTO v_plan_id;

  -- Si llegamos aquí, el insert fue exitoso
  RETURN json_build_object(
    'success', true,
    'plan_id', v_plan_id,
    'message', 'Plan creado exitosamente',
    'data', json_build_object(
      'id', v_plan_id,
      'nombre', p_nombre,
      'created_by', v_user_id
    )
  );

EXCEPTION WHEN OTHERS THEN
  -- Capturar cualquier error
  v_error_msg := SQLERRM;
  RAISE NOTICE 'Error en crear_plan_asesor: %', v_error_msg;
  
  RETURN json_build_object(
    'success', false,
    'error', v_error_msg,
    'data', NULL,
    'error_context', json_build_object(
      'function', 'crear_plan_asesor',
      'user_id', v_user_id,
      'sqlstate', SQLSTATE
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. VERIFICAR QUE LA FUNCIÓN EXISTE
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'crear_plan_asesor'
LIMIT 1;

-- 4. PRUEBA: Crear un plan de prueba (cambiar el user_id por uno real)
-- SELECT crear_plan_asesor(
--   'Plan Prueba',
--   'Descripción de prueba',
--   29.99,
--   'Premium',
--   '30GB',
--   '300',
--   'Ilimitados',
--   'Sí',
--   'No',
--   'Sí',
--   'Sí',
--   'No',
--   'No',
--   NULL
-- );
