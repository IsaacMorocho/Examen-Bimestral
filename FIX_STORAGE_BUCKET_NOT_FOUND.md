# ✅ FIX: Storage Bucket Not Found

## 🔴 El Problema

```
StorageApiError: Bucket not found
POST https://.../storage/v1/object/planes-imagenes/... 400 (Bad Request)
```

**Causa:** El bucket `planes-imagenes` no existe en Supabase Storage.

---

## ✅ La Solución (2 opciones)

### OPCIÓN 1: Crear el Bucket Manualmente en Supabase (Recomendado)

1. Ve a **Supabase Dashboard → Storage**
2. Haz clic en **"New bucket"** (botón azul)
3. Rellena:
   - **Nombre:** `planes-imagenes`
   - **Privacy:** `Public` ✅ (para que se vean las imágenes)
4. Haz clic en **"Create bucket"**

**¡Listo!** Ya puedes subir imágenes.

---

### OPCIÓN 2: Crear el Bucket con SQL

Si prefieres por SQL, ejecuta esto en Supabase SQL Editor:

```sql
-- Crear bucket de almacenamiento
INSERT INTO storage.buckets (id, name, public)
VALUES ('planes-imagenes', 'planes-imagenes', true)
ON CONFLICT (id) DO NOTHING;

-- Crear políticas de acceso
-- 1. Lectura pública
CREATE POLICY "Lectura pública"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'planes-imagenes');

-- 2. Escritura solo para autenticados
CREATE POLICY "Escritura solo autenticados"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'planes-imagenes');

-- 3. Actualización solo del propietario
CREATE POLICY "Actualizar propios archivos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'planes-imagenes' AND owner = auth.uid())
WITH CHECK (bucket_id = 'planes-imagenes' AND owner = auth.uid());
```

---

## 🚀 Ahora Prueba

1. Crea el bucket (Opción 1 es más fácil)
2. Limpia caché: **Ctrl + Shift + Delete**
3. Recarga: **Ctrl + F5**
4. Inicia sesión como asesor
5. Intenta crear un plan con imagen
6. **Esperado:** ✅ Imagen sube sin errores

---

## 📊 ¿Por Qué Faltaba el Bucket?

La tabla `planes_moviles` tiene campo `imagen_url`, y el código intenta subir a `planes-imagenes`, pero:

- ✅ El código estaba correcto
- ❌ El bucket no se creó en Supabase

**Ahora que lo crees, todo funciona.**

---

## ✅ Checklist

- [ ] Fui a Supabase → Storage
- [ ] Creé bucket llamado `planes-imagenes`
- [ ] Configuré privacidad como "Public"
- [ ] Limpié caché (Ctrl + Shift + Delete)
- [ ] Recargué página (Ctrl + F5)
- [ ] Intenté subir imagen
- [ ] ✅ ¡Funcionó!

---

## 🐛 Si Aún Falla

### Error: "Permission denied"
- **Solución:** Asegúrate de que el bucket sea "Public" en Supabase

### Error: "File size too large"
- **Solución:** La imagen es muy grande (máx 5MB según código)

### Imagen sube pero plan no se crea
- **Solución:** Probablemente el plan se creó, pero hubo error en otra parte. Revisa la consola.

---

## 📝 Resumen

| Paso | Acción |
|------|--------|
| 1 | Ve a Supabase → Storage |
| 2 | Crea bucket: `planes-imagenes` |
| 3 | Privacidad: `Public` |
| 4 | Limpiar caché y recargar |
| 5 | Prueba crear plan con imagen |

**Status:** ✅ **LISTA PARA PROBAR**
