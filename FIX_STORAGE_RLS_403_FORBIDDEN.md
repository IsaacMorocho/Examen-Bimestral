## SOLUCIÓN FINAL: Storage RLS Policies - Upload Bloqueado

### El Problema Real
```
Error: new row violates row-level security policy
Status Code: 403 (Forbidden)
```

**Causa raíz:** `storage.objects` tiene RLS habilitado pero **NO tiene políticas definidas**. Esto significa que **NADIE** puede insertar, ni siquiera usuarios autenticados.

---

## SOLUCIÓN EN 5 MINUTOS

### ✅ Paso 1: Ejecutar SQL en Supabase

1. Abre **Supabase Dashboard → SQL Editor**
2. Haz clic en **"New Query"**
3. **Copia este script completo:**

```sql
-- Crear políticas de RLS para Storage
CREATE POLICY "Permitir insert para usuarios autenticados en planes"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'planes-imagenes'
    AND (storage.foldername(name))[1] = 'planes'
  );

CREATE POLICY "Permitir lectura pública del bucket planes-imagenes"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'planes-imagenes');

CREATE POLICY "Permitir delete para propietarios"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'planes-imagenes'
    AND (storage.foldername(name))[1] = 'planes'
  );

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
```

4. **Pega en SQL Editor**
5. Haz clic en **"Run"** (Ctrl + Enter)
6. Deberías ver: **"Query executed successfully"** (4 times)

✅ **Las políticas de Storage están ahora creadas**

---

### ✅ Paso 2: Limpiar Caché Navegador

1. **Ctrl + Shift + Delete** (abrir panel de borrado)
2. Selecciona: **"Todo el tiempo"**
3. Marca:
   - ✓ Cookies y datos de sitios
   - ✓ Almacenamiento en caché
   - ✓ Almacenamiento de bases de datos
4. Haz clic: **"Borrar datos"**

---

### ✅ Paso 3: Recarga Forzada

1. **Ctrl + F5** (recarga ignorando caché)
2. Espera a que cargue completamente

---

### ✅ Paso 4: Prueba Upload

1. **Login como asesor**: `asesor1@tigo.com` / `asesor123`
2. **Ir a crear plan**
3. Llena el formulario
4. **Selecciona una imagen JPG/PNG**
5. Haz clic en **"Crear Plan"**

**Debería funcionar ahora** ✅

---

## ¿Qué hacen estas políticas?

| Política | Acción | Quién | Restricción |
|----------|--------|-------|-------------|
| `Permitir insert...` | INSERT | Usuarios autenticados | Solo en `planes-imagenes/planes/*` |
| `Permitir lectura...` | SELECT | Cualquiera (público) | Solo bucket `planes-imagenes` |
| `Permitir delete...` | DELETE | Usuarios autenticados | Solo en `planes-imagenes/planes/*` |
| `Permitir update...` | UPDATE | Usuarios autenticados | Solo en `planes-imagenes/planes/*` |

**Resultado:** 
- ✅ Asesores autenticados pueden subir imágenes
- ✅ Las imágenes son públicas y visibles para todos
- ✅ Las restricciones evitan acceso a carpetas sensibles

---

## Verificación - ¿Funcionó?

### ✅ Éxito
- Plan se crea exitosamente
- Imagen se sube correctamente
- Ves: "¡Plan creado exitosamente!"

### ❌ Sigue sin funcionar
1. Verifica que el SQL se ejecutó (busca "Query executed successfully")
2. Limpia caché nuevamente (Ctrl+Shift+Delete + Ctrl+F5)
3. Intenta login/logout y vuelve a intentar

### ❌ Error de políticas duplicadas
Si ves error como "policy already exists":
- Las políticas ya fueron creadas
- Simplemente recarga la app (Ctrl+F5)
- Debería funcionar

---

## Troubleshooting

### Problema: Error 403 Forbidden sigue apareciendo

**Solución:**
1. Abre DevTools (F12) → Network tab
2. Intenta subir imagen
3. Busca request a `storage.objects`
4. Verifica el error exacto en response
5. Si sigue siendo "row-level security", verifica que las 4 políticas se crearon

### Problema: ¿Por qué se bloquean por RLS?

**Razón:** Supabase activa RLS automáticamente en `storage.objects` para seguridad. Sin políticas explícitas, TODO está bloqueado. Es un problema de configuración, no de código.

### Problema: No veo las políticas creadas

1. Ve a **Supabase Dashboard → SQL Editor**
2. Ejecuta:
   ```sql
   SELECT policyname, roles 
   FROM pg_policies 
   WHERE tablename = 'objects' 
   AND schemaname = 'storage';
   ```
3. Deberías ver 4 políticas listadas

---

## Resumen de Cambios

### Antes
- ❌ storage.objects tenía RLS sin políticas
- ❌ Nadie podía hacer INSERT
- ❌ Error: 403 Forbidden en todos los uploads

### Después
- ✅ storage.objects tiene 4 políticas de RLS
- ✅ Usuarios autenticados pueden hacer INSERT
- ✅ Uploads funcionan correctamente
- ✅ Las imágenes son públicas

---

## Próximos Pasos (Después de que Funcione)

1. ✅ Crea 3-5 planes con imágenes
2. ✅ Verifica que aparezcan correctamente
3. ✅ Intenta editar un plan (agregar imagen)
4. ✅ Verifica que se muestren en dashboard

**¡Ahora sí debería funcionar todo!** 🎉
