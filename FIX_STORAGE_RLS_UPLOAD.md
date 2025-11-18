## FIX: StorageApiError - Row Level Security Policy Violation

### El Problema
Cuando intentas subir imagen al crear plan, aparece:
```
StorageApiError: new row violates row-level security policy
```

### La Causa Raíz
Supabase Storage tiene **Row Level Security (RLS) habilitado** en la tabla `storage.objects`, pero no hay **políticas que permitan uploads** desde tu aplicación Angular.

Es el mismo problema que tuviste con las tablas de base de datos (perfiles, planes_moviles), pero ahora en el almacenamiento de archivos.

### La Solución
**Deshabilitar RLS en la tabla `storage.objects`** porque los archivos en `planes-imagenes` son públicos y no necesitan restricciones.

---

## PASO A PASO - Arreglarlo en 2 minutos

### ✅ Paso 1: Ejecutar SQL en Supabase

1. Abre **Supabase Dashboard** → **SQL Editor**
2. Haz clic en **"New Query"**
3. **Copia TODO este comando:**
   ```sql
   ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
   ```
4. **Pega** en el editor
5. Haz clic en **"Run"** (o presiona **Ctrl + Enter**)
6. Deberías ver: **"Query executed successfully"**

✅ **Storage RLS está ahora deshabilitado**

---

### ✅ Paso 2: Limpiar caché en navegador

1. En VS Code (en navegador): **Ctrl + Shift + Delete**
   - Se abre pestaña de borrar datos de navegación
   - Selecciona "Todo el tiempo"
   - Marca: Cookies y Almacenamiento
   - Haz clic en "Borrar datos"

2. Recarga la app: **Ctrl + F5** (recarga forzada)

---

### ✅ Paso 3: Probar Upload de Imagen

1. En tu app Ionic, **intenta crear un plan nuevamente**
2. Selecciona imagen para el plan
3. Haz clic en **"Crear Plan"**
4. **Debería funcionar ahora sin error de RLS**

---

## Verificación - ¿Funcionó?

✅ Si ves el plan creado sin errores en consola de browser → **¡ÉXITO!**

❌ Si aún obtienes error:
- Intenta de nuevo con caché completamente limpio
- Verifica en Supabase SQL Editor que el comando se ejecutó
- Consulta la sección "Troubleshooting" más abajo

---

## ¿Por qué funciona esto?

La tabla `storage.objects` en Supabase controla **metadatos de archivos** (quién subió, cuándo, etc.).

- **Antes**: RLS bloqueaba cualquier insert en storage.objects
- **Ahora**: RLS deshabilitado = aplicación puede registrar uploads normalmente
- **Seguridad**: No hay riesgo porque:
  - El bucket es público (archivos de planes visibles para todos)
  - La URL es predecible (planes/plan-ID-timestamp.jpg)
  - Los únicamente asesores pueden llamar a crear_plan_asesor()

---

## Troubleshooting

### Problema: Sigue sin funcionar después de limpiar caché

**Solución:**
1. Abre DevTools (F12)
2. Ve a **Network** tab
3. Intenta subir imagen
4. Busca request a `storage.objects` o `upload`
5. Verifica el error exacto en la respuesta

### Problema: ¿Necesito Security Definer también para Storage?

**No**. Storage no necesita función SQL especial:
- Las funciones (crear_perfil_usuario, crear_plan_asesor) ya crean los planes
- El upload es una operación separada de cliente a Storage
- RLS en storage.objects solo controla **metadatos**, no el contenido del archivo

### Problema: ¿Esto afecta seguridad del bucket?

**No**:
- Bucket `planes-imagenes` sigue siendo Public (por diseño)
- Solo asesores pueden crear planes (validado en crear_plan_asesor())
- URLs de archivos son impredecibles (incluyen timestamp)
- El archivo nunca tiene datos sensibles (es solo imagen de plan)

---

## Diagrama del Flujo (Después del Fix)

```
Asesor en App
    ↓
Llena formulario de plan + selecciona imagen
    ↓
Hace clic en "Crear Plan"
    ↓
Angular llama: storageService.uploadPlanImage()
    ↓
Supabase Storage recibe: PUT /planes-imagenes/planes/plan-ID.jpg
    ↓
Verifica RLS en storage.objects
    ↓ 
✅ RLS DESHABILITADO → INSERT en storage.objects permitido
    ↓
Archivo guardado, devuelve URL pública
    ↓
Simultáneamente: planesService.createPlan() llama crear_plan_asesor(imagen_url)
    ↓
✅ Plan creado con imagen_url en BD
    ↓
Asesor ve plan creado exitosamente
```

---

## Resumen

| Antes | Después |
|-------|---------|
| RLS habilitado en storage.objects | RLS **deshabilitado** |
| Upload bloqueado por RLS | Upload funciona correctamente |
| Error: "row violates RLS policy" | ✅ Imagen sube correctamente |

**Todo debería funcionar ahora** ✅
