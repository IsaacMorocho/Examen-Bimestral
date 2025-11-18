-- ============================================================================
-- FUNCIÓN MEJORADA: crear_plan_asesor - Recibe user_id del cliente
-- ============================================================================
-- Problema: auth.uid() retorna NULL para usuarios locales (asesores)
-- Solución: Pasar p_user_id desde el cliente Angular
-- ============================================================================

-- 1. ELIMINAR FUNCIÓN ANTERIOR
DROP FUNCTION IF EXISTS crear_plan_asesor(
  TEXT, TEXT, DECIMAL, TEXT, TEXT, TEXT, TEXT, 
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) CASCADE;

-- 2. CREAR FUNCIÓN NUEVA QUE RECIBE user_id COMO PARÁMETRO
CREATE OR REPLACE FUNCTION crear_plan_asesor(
  p_user_id UUID,
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
  v_error_msg TEXT;
BEGIN
  -- Validar que p_user_id no es NULL
  IF p_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'user_id es NULL - no se recibió ID de usuario',
      'data', NULL
    );
  END IF;

  -- Log para debugging
  RAISE NOTICE 'Creando plan para user_id: %', p_user_id;

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
    p_user_id,  -- <<< Usar el user_id recibido como parámetro
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
      'created_by', p_user_id
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
      'user_id_recibido', p_user_id,
      'sqlstate', SQLSTATE
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. VERIFICAR QUE LA FUNCIÓN EXISTE CON LOS NUEVOS PARÁMETROS
SELECT 
  proname as function_name,
  pronargs as num_params
FROM pg_proc
WHERE proname = 'crear_plan_asesor';

-- Debería mostrar: pronargs = 15 (15 parámetros)
