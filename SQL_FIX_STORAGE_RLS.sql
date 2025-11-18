-- ============================================================================
-- FIX: Habilitar uploads en Supabase Storage (deshabilitar RLS)
-- ============================================================================
-- El error "new row violates row-level security policy" en Storage ocurre porque
-- RLS está habilitado pero no hay políticas que permitan uploads.
--
-- SOLUCIÓN: Deshabilitar RLS en la tabla storage.objects
-- ============================================================================

-- 1. Deshabilitar RLS en la tabla storage.objects
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 2. Verificar que RLS está deshabilitado
SELECT tablename FROM pg_tables 
WHERE schemaname = 'storage' 
AND rowsecurity = true;

-- Si no aparece 'objects' en el resultado, ¡está deshabilitado correctamente!

-- ============================================================================
-- ALTERNATIVA (si necesitas mantener RLS habilitado):
-- Crea estas políticas en lugar de deshabilitar RLS
-- ============================================================================

-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- -- Política para que usuarios autenticados suban archivos
-- CREATE POLICY "Permitir uploads para usuarios autenticados"
--   ON storage.objects
--   FOR INSERT
--   WITH CHECK (
--     auth.role() = 'authenticated'
--     AND bucket_id = 'planes-imagenes'
--   );

-- -- Política para que usuarios lean archivos públicos
-- CREATE POLICY "Permitir lectura pública"
--   ON storage.objects
--   FOR SELECT
--   USING (
--     bucket_id = 'planes-imagenes'
--     AND (storage.foldername(name))[1] = 'planes'
--   );

-- ============================================================================
-- PASO A PASO:
-- ============================================================================
-- 1. Ve a Supabase Dashboard → SQL Editor
-- 2. Copia TODO el contenido de este script (solo la parte de ALTER TABLE)
-- 3. Pega en SQL Editor
-- 4. Haz clic en "Ejecutar" (Ctrl+Enter)
-- 5. Deberías ver "Query executed successfully"
-- 6. En tu navegador: Ctrl+Shift+Delete (limpiar caché)
-- 7. Recarga: Ctrl+F5
-- 8. Intenta subir imagen nuevamente al crear plan
-- ============================================================================
