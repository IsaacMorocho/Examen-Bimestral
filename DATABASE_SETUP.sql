-- ============================================
-- TIGO CONECTA - Base de Datos SQL
-- Supabase - Postgres
-- ============================================

-- Tabla de Perfiles de Usuario
CREATE TABLE IF NOT EXISTS perfiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  rol VARCHAR(50) NOT NULL CHECK (rol IN ('asesor_comercial', 'usuario_registrado')),
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Tabla de Planes Móviles
CREATE TABLE IF NOT EXISTS planes_moviles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  precio DECIMAL(10, 2) NOT NULL,
  segmento VARCHAR(50) NOT NULL CHECK (segmento IN ('Básico', 'Medio', 'Premium')),
  datos_moviles VARCHAR(255) NOT NULL,
  minutos_voz VARCHAR(255) NOT NULL,
  sms VARCHAR(255) NOT NULL,
  velocidad_4g VARCHAR(255) NOT NULL,
  velocidad_5g VARCHAR(255),
  redes_sociales VARCHAR(255) NOT NULL,
  whatsapp VARCHAR(255) NOT NULL,
  llamadas_internacionales VARCHAR(255) NOT NULL,
  roaming VARCHAR(255) NOT NULL,
  imagen_url TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Tabla de Contrataciones
CREATE TABLE IF NOT EXISTS contrataciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL,
  plan_id UUID NOT NULL,
  estado VARCHAR(50) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'activa', 'cancelada', 'renovacion')),
  fecha_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  fecha_fin TIMESTAMP WITH TIME ZONE,
  precio_mensual DECIMAL(10, 2) NOT NULL,
  numero_linea VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES planes_moviles(id) ON DELETE RESTRICT
);

-- Tabla de Mensajes de Chat
CREATE TABLE IF NOT EXISTS mensajes_chat (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contratacion_id UUID NOT NULL,
  usuario_id UUID NOT NULL,
  asesor_id UUID NOT NULL,
  mensaje TEXT NOT NULL,
  leido BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contratacion_id) REFERENCES contrataciones(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  FOREIGN KEY (asesor_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ============================================
-- VISTAS (Views) para consultas optimizadas
-- ============================================

-- Vista para obtener detalles de contrataciones
CREATE OR REPLACE VIEW vw_contrataciones_detalle AS
SELECT
  c.id,
  c.usuario_id,
  c.plan_id,
  c.estado,
  c.fecha_inicio,
  c.fecha_fin,
  c.precio_mensual,
  c.numero_linea,
  c.created_at,
  c.updated_at,
  p.full_name as usuario_nombre,
  pm.nombre as plan_nombre
FROM contrataciones c
LEFT JOIN perfiles p ON c.usuario_id = p.user_id
LEFT JOIN planes_moviles pm ON c.plan_id = pm.id;

-- Vista para conversaciones de chat
CREATE OR REPLACE VIEW vw_conversaciones_chat AS
SELECT
  c.id as contratacion_id,
  c.usuario_id,
  p.full_name as usuario_nombre,
  c.plan_id,
  pm.nombre as plan_nombre,
  cm.mensaje as ultimo_mensaje,
  cm.created_at as timestamp_ultimo,
  (SELECT COUNT(*) FROM mensajes_chat WHERE contratacion_id = c.id AND leido = FALSE) as no_leidos,
  (SELECT pa.user_id FROM perfiles pa WHERE pa.rol = 'asesor_comercial' LIMIT 1) as asesor_id,
  (SELECT pa.full_name FROM perfiles pa WHERE pa.rol = 'asesor_comercial' LIMIT 1) as asesor_nombre
FROM contrataciones c
LEFT JOIN perfiles p ON c.usuario_id = p.user_id
LEFT JOIN planes_moviles pm ON c.plan_id = pm.id
LEFT JOIN LATERAL (
  SELECT * FROM mensajes_chat WHERE contratacion_id = c.id ORDER BY created_at DESC LIMIT 1
) cm ON TRUE;

-- ============================================
-- ÍNDICES para optimización
-- ============================================

CREATE INDEX idx_perfiles_user_id ON perfiles(user_id);
CREATE INDEX idx_perfiles_rol ON perfiles(rol);

CREATE INDEX idx_planes_moviles_segmento ON planes_moviles(segmento);
CREATE INDEX idx_planes_moviles_activo ON planes_moviles(activo);
CREATE INDEX idx_planes_moviles_created_by ON planes_moviles(created_by);

CREATE INDEX idx_contrataciones_usuario_id ON contrataciones(usuario_id);
CREATE INDEX idx_contrataciones_plan_id ON contrataciones(plan_id);
CREATE INDEX idx_contrataciones_estado ON contrataciones(estado);

CREATE INDEX idx_mensajes_chat_contratacion_id ON mensajes_chat(contratacion_id);
CREATE INDEX idx_mensajes_chat_usuario_id ON mensajes_chat(usuario_id);
CREATE INDEX idx_mensajes_chat_asesor_id ON mensajes_chat(asesor_id);
CREATE INDEX idx_mensajes_chat_leido ON mensajes_chat(leido);

-- ============================================
-- POLÍTICAS DE SEGURIDAD (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE planes_moviles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contrataciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensajes_chat ENABLE ROW LEVEL SECURITY;

-- Políticas para Perfiles
CREATE POLICY "Usuarios pueden ver su propio perfil"
ON perfiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar su propio perfil"
ON perfiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Cualquiera puede ver perfiles públicos de asesores"
ON perfiles FOR SELECT
USING (rol = 'asesor_comercial');

-- Políticas para Planes
CREATE POLICY "Planes activos visibles para todos"
ON planes_moviles FOR SELECT
USING (activo = TRUE);

CREATE POLICY "Solo asesores pueden crear planes"
ON planes_moviles FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE user_id = auth.uid() AND rol = 'asesor_comercial'
  )
);

CREATE POLICY "Solo el creador puede actualizar su plan"
ON planes_moviles FOR UPDATE
USING (created_by = auth.uid());

CREATE POLICY "Solo el creador puede eliminar su plan"
ON planes_moviles FOR DELETE
USING (created_by = auth.uid());

-- Políticas para Contrataciones
CREATE POLICY "Usuarios ven sus propias contrataciones"
ON contrataciones FOR SELECT
USING (usuario_id = auth.uid());

CREATE POLICY "Usuarios pueden crear contrataciones"
ON contrataciones FOR INSERT
WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "Asesores ven todas las contrataciones"
ON contrataciones FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE user_id = auth.uid() AND rol = 'asesor_comercial'
  )
);

-- Políticas para Chat
CREATE POLICY "Usuarios ven su chat"
ON mensajes_chat FOR SELECT
USING (usuario_id = auth.uid() OR asesor_id = auth.uid());

CREATE POLICY "Usuarios envían mensajes a su contratación"
ON mensajes_chat FOR INSERT
WITH CHECK (usuario_id = auth.uid());

-- ============================================
-- DATOS INICIALES - Planes de Ejemplo
-- ============================================

-- Nota: Necesitas insertar un usuario asesor primero
-- INSERT INTO perfiles (user_id, full_name, phone, rol) 
-- VALUES ('tu-user-id', 'Asesor Inicial', '0987654321', 'asesor_comercial');

-- Planes predefinidos (ajustar created_by con ID real del asesor)
-- INSERT INTO planes_moviles (nombre, descripcion, precio, segmento, datos_moviles, minutos_voz, sms, velocidad_4g, redes_sociales, whatsapp, llamadas_internacionales, roaming, created_by) 
-- VALUES 
-- (
--   'Plan Smart 5GB',
--   'Plan básico perfecto para usuarios casuales, estudiantes y adultos mayores',
--   15.99,
--   'Básico',
--   '5 GB mensuales (4G LTE)',
--   '100 minutos nacionales',
--   'Ilimitados a nivel nacional',
--   'Hasta 50 Mbps',
--   'Consumo normal (descontable)',
--   'Incluido en los 5GB',
--   '$0.15/min',
--   'No incluido',
--   'asesor-user-id'
-- );
