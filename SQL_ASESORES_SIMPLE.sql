-- SOLUCIÓN RÁPIDA: Crear tabla asesores con campo 'password' (sin hash)
-- para pruebas iniciales, luego migrar a password_hash

-- 1. OPCIÓN A: Si la tabla NO existe, crearla con ambos campos
-- (Descomenta si necesitas crear la tabla desde cero)

/*
CREATE TABLE IF NOT EXISTS public.asesores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  nombre VARCHAR(255) NOT NULL,
  apellido VARCHAR(255),
  password VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255),
  telefono VARCHAR(20),
  estado_civil VARCHAR(50),
  ciudad VARCHAR(100),
  provincia VARCHAR(100),
  foto_perfil TEXT,
  fecha_registro TIMESTAMP NOT NULL DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP NOT NULL DEFAULT NOW(),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  region_asignada VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
*/

-- 2. OPCIÓN B: Si la tabla YA EXISTE, agregar el campo password si no existe
-- (Ejecuta esto si la tabla existe pero falta el campo password)

ALTER TABLE public.asesores
ADD COLUMN IF NOT EXISTS password VARCHAR(255);

-- 3. OPCIÓN C: Insertar datos de prueba SIN hash (contraseña plana)
-- para verificar que el resto funciona

INSERT INTO public.asesores (email, nombre, apellido, password, telefono, ciudad, provincia, activo, region_asignada)
VALUES 
  (
    'asesor1@tigo.com',
    'Juan',
    'Pérez',
    'asesor123',
    '0987654321',
    'Quito',
    'Pichincha',
    TRUE,
    'Costa'
  ),
  (
    'asesor2@tigo.com',
    'María',
    'González',
    'asesor123',
    '0987654322',
    'Guayaquil',
    'Guayas',
    TRUE,
    'Litoral'
  ),
  (
    'asesor3@tigo.com',
    'Carlos',
    'Rodríguez',
    'asesor123',
    '0987654323',
    'Ambato',
    'Tungurahua',
    TRUE,
    'Sierra'
  )
ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  activo = TRUE;

-- 4. Verificar que los datos se insertaron correctamente
SELECT id, email, nombre, password, activo FROM public.asesores;

-- ====================================================================
-- PRÓXIMO PASO: Actualizar auth.service.ts
-- ====================================================================
-- Después de ejecutar este script, actualiza el método loginAdvisor
-- en auth.service.ts para usar el campo 'password' en lugar de 'password_hash'
-- Cambiar: advisor.password_hash por advisor.password
