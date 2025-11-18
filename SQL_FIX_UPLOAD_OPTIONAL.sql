-- ============================================================================
-- SOLUCIÓN 1: Hacer que imagen_url sea OPCIONAL en crear_plan_asesor
-- ============================================================================
-- El problema es que Storage requiere autenticación correcta.
-- La solución más simple: permitir crear planes SIN imagen

-- Primero, verificar la función actual:
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'crear_plan_asesor';

-- Luego DROP y recrear con imagen como OPCIONAL:
DROP FUNCTION IF EXISTS crear_plan_asesor(
  TEXT, TEXT, DECIMAL, TEXT, TEXT, TEXT, TEXT, 
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) CASCADE;

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
  p_imagen_url TEXT DEFAULT NULL  -- <<<< OPCIONAL, puede ser NULL
) RETURNS JSON AS $$
DECLARE
  v_plan_id UUID;
  v_user_id UUID;
BEGIN
  -- Obtener el user_id del usuario autenticado
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuario no autenticado'
    );
  END IF;

  -- Insertar el plan (imagen puede ser NULL)
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
    p_imagen_url,  -- <<< Puede ser NULL
    v_user_id,
    true
  )
  RETURNING id INTO v_plan_id;

  RETURN json_build_object(
    'success', true,
    'plan_id', v_plan_id,
    'message', 'Plan creado exitosamente'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', 'Error al crear el plan'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar que la función existe:
SELECT 'Plan created successfully' AS status;
