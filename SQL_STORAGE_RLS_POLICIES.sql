-- ============================================================================
-- SOLUCIÓN: Crear políticas RLS correctas para Supabase Storage
-- ============================================================================
-- El problema: storage.objects tiene RLS habilitado pero SIN políticas
-- Resultado: Incluso usuarios autenticados no pueden subir
--
-- SOLUCIÓN: Crear políticas que permitan INSERT para usuarios autenticados
-- ============================================================================

-- 1. Verificar que RLS está habilitado en storage.objects
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- 2. CREAR POLÍTICAS DE RLS PARA STORAGE.OBJECTS

-- Política 1: Permitir INSERT para usuarios autenticados
CREATE POLICY "Permitir insert para usuarios autenticados en planes"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'planes-imagenes'
    AND (storage.foldername(name))[1] = 'planes'
  );

-- Política 2: Permitir SELECT pública (lectura de archivos públicos)
CREATE POLICY "Permitir lectura pública del bucket planes-imagenes"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'planes-imagenes');

-- Política 3: Permitir DELETE para propietarios (opcional, para editar planes)
CREATE POLICY "Permitir delete para propietarios"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'planes-imagenes'
    AND (storage.foldername(name))[1] = 'planes'
  );

-- Política 4: Permitir UPDATE para propietarios (opcional)
CREATE POLICY "Permitir update para propietarios"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'planes-imagenes'
    AND (storage.foldername(name))[1] = 'planes'
  )
  WITH CHECK (
    bucket_id = 'planes-imagenes'
    AND (storage.foldername(name))[1] = 'planes'
  );

-- 3. VERIFICAR QUE LAS POLÍTICAS EXISTEN
SELECT policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;

-- ============================================================================
-- Si algo va mal, puedes eliminar las políticas con:
-- ============================================================================
-- DROP POLICY "Permitir insert para usuarios autenticados en planes" ON storage.objects;
-- DROP POLICY "Permitir lectura pública del bucket planes-imagenes" ON storage.objects;
-- DROP POLICY "Permitir delete para propietarios" ON storage.objects;
-- DROP POLICY "Permitir update para propietarios" ON storage.objects;
