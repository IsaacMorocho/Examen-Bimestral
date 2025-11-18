-- DIAGNÓSTICO: Verificar tabla asesores en Supabase
-- Ejecuta esta consulta para ver qué datos existen

-- 1. Ver estructura de la tabla asesores
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'asesores';

-- 2. Ver todos los asesores registrados
SELECT * FROM public.asesores;

-- 3. Ver el primer asesor con detalle
SELECT id, email, nombre, password_hash, activo, created_at
FROM public.asesores 
LIMIT 1;
