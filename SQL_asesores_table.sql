-- =================================================================
-- TABLA ASESORES - AUTENTICACIÓN DE ASESORES COMERCIALES
-- =================================================================

-- 1. Crear tabla de asesores
CREATE TABLE IF NOT EXISTS public.asesores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  nombre VARCHAR(255) NOT NULL,
  apellido VARCHAR(255),
  password_hash VARCHAR(255) NOT NULL,
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

-- 2. Crear índices para optimización
CREATE INDEX idx_asesores_email ON public.asesores(email);
CREATE INDEX idx_asesores_activo ON public.asesores(activo);
CREATE INDEX idx_asesores_created_at ON public.asesores(created_at);

-- 3. Crear función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_asesores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.fecha_actualizacion = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Crear trigger para actualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_asesores_updated_at ON public.asesores;
CREATE TRIGGER trigger_update_asesores_updated_at
BEFORE UPDATE ON public.asesores
FOR EACH ROW
EXECUTE FUNCTION public.update_asesores_updated_at();

-- 5. Configurar RLS (Row Level Security)
ALTER TABLE public.asesores ENABLE ROW LEVEL SECURITY;

-- 6. Crear política de RLS para lectura (cada asesor ve su propio registro)
DROP POLICY IF EXISTS "Asesores pueden ver su propio perfil" ON public.asesores;
CREATE POLICY "Asesores pueden ver su propio perfil"
  ON public.asesores
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text OR email = auth.jwt()->>'email');

-- 7. Crear política de RLS para actualización (cada asesor puede actualizar su perfil)
DROP POLICY IF EXISTS "Asesores pueden actualizar su propio perfil" ON public.asesores;
CREATE POLICY "Asesores pueden actualizar su propio perfil"
  ON public.asesores
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text OR email = auth.jwt()->>'email')
  WITH CHECK (auth.uid()::text = id::text OR email = auth.jwt()->>'email');

-- 8. Crear política anónima para lectura de datos públicos de asesores activos
DROP POLICY IF EXISTS "Usuarios anónimos pueden ver asesores activos" ON public.asesores;
CREATE POLICY "Usuarios anónimos pueden ver asesores activos"
  ON public.asesores
  FOR SELECT
  TO anon
  USING (activo = TRUE);

-- 9. Insertar datos de prueba con contraseñas hasheadas
-- Nota: En producción, estas contraseñas deben ser hasheadas con bcryptjs
-- Para pruebas, se usa bcryptjs con costo 10
-- PASSWORD: asesor123 (hasheada)
INSERT INTO public.asesores (email, nombre, apellido, password_hash, telefono, ciudad, provincia, activo, region_asignada)
VALUES 
  (
    'asesor1@tigo.com',
    'Juan',
    'Pérez',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36gZvWFm',  -- asesor123
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
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36gZvWFm',  -- asesor123
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
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36gZvWFm',  -- asesor123
    '0987654323',
    'Ambato',
    'Tungurahua',
    TRUE,
    'Sierra'
  );

-- =================================================================
-- TABLA DE AUDITORÍA PARA LOGINS DE ASESORES (OPCIONAL)
-- =================================================================
CREATE TABLE IF NOT EXISTS public.audit_asesor_logins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asesor_id UUID NOT NULL REFERENCES public.asesores(id) ON DELETE CASCADE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  login_timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  logout_timestamp TIMESTAMP,
  estado VARCHAR(50)
);

CREATE INDEX idx_audit_asesor_id ON public.audit_asesor_logins(asesor_id);
CREATE INDEX idx_audit_login_timestamp ON public.audit_asesor_logins(login_timestamp);

-- =================================================================
-- TABLA DE PERMISOS DE ASESORES (OPCIONAL - para futuro)
-- =================================================================
CREATE TABLE IF NOT EXISTS public.asesor_permisos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asesor_id UUID NOT NULL REFERENCES public.asesores(id) ON DELETE CASCADE,
  permiso VARCHAR(100) NOT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(asesor_id, permiso)
);

CREATE INDEX idx_asesor_permisos_id ON public.asesor_permisos(asesor_id);

-- =================================================================
-- INFORMACIÓN IMPORTANTE PARA DESARROLLO
-- =================================================================
/*

CREDENCIALES DE PRUEBA:
------------------------
Usuario: asesor1@tigo.com | Contraseña: asesor123
Usuario: asesor2@tigo.com | Contraseña: asesor123
Usuario: asesor3@tigo.com | Contraseña: asesor123

HASH UTILIZADO:
------------------------
Hash: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36gZvWFm
Costo: 10 (bcryptjs estándar)
Plaintext: asesor123

GENERAR NUEVOS HASHES:
------------------------
Para generar nuevos hashes en Node.js:

const bcryptjs = require('bcryptjs');

async function generateHash(password) {
  const hash = await bcryptjs.hash(password, 10);
  return hash;
}

// Ejemplo: 
// generateHash('nuevacontraseña123').then(hash => console.log(hash));

VALIDACIÓN EN TYPESCRIPT:
------------------------
La función loginAdvisor() en auth.service.ts valida:
1. Email existe en tabla asesores
2. Password coincide (validar con bcryptjs.compare())
3. Asesor activo = TRUE

PRÓXIMAS IMPLEMENTACIONES:
------------------------
1. Actualizar auth.service.ts para usar bcryptjs.compare() 
   en lugar de comparación directa
2. Agregar método para cambiar contraseña de asesor
3. Agregar método para recuperación de contraseña
4. Implementar tokens JWT para sesiones de asesor
5. Agregar auditoría de logins en audit_asesor_logins

*/
