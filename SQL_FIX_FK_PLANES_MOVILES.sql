-- ============================================================================
-- FIX: Cambiar Foreign Key de planes_moviles.created_by
-- ============================================================================
-- PROBLEMA: planes_moviles.created_by apunta a auth.users(id)
-- Pero los asesores están en tabla asesores, no en auth.users
-- 
-- SOLUCIÓN: Cambiar la FK para que apunte a asesores.id
-- ============================================================================

-- 1. ELIMINAR LA FOREIGN KEY ACTUAL
ALTER TABLE planes_moviles 
DROP CONSTRAINT IF EXISTS planes_moviles_created_by_fkey;

-- 2. CREAR NUEVA FOREIGN KEY QUE APUNTE A asesores.id
ALTER TABLE planes_moviles
ADD CONSTRAINT planes_moviles_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES asesores(id) 
ON DELETE SET NULL;

-- 3. VERIFICAR QUE CAMBIÓ CORRECTAMENTE
SELECT 
  constraint_name,
  table_name,
  column_name,
  referenced_table_name,
  referenced_column_name
FROM information_schema.referential_constraints
WHERE constraint_name = 'planes_moviles_created_by_fkey';

-- 4. VER PLANES CREADOS (debería estar vacío si es primera vez)
SELECT id, nombre, created_by FROM planes_moviles;

-- 5. VER ASESORES DISPONIBLES (para verificar que existen)
SELECT id, email, nombre FROM asesores WHERE activo = TRUE;
