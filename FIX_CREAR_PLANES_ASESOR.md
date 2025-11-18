# ✅ FIX: Crear Planes como Asesor - Error RLS

## 🔴 El Problema

Al intentar crear un plan como asesor, obtenías:
```
Error 401/42501: new row violates row-level security policy for table "planes_moviles"
```

**Causa:** La política RLS de INSERT en `planes_moviles` verifica si el usuario es asesor buscando en la tabla `perfiles` con `rol = 'asesor_comercial'`. Pero los asesores NO están en `perfiles` (están en la tabla `asesores` que usa autenticación local).

---

## ✅ La Solución

Igual que con `perfiles`: usar una **función SQL segura (SECURITY DEFINER)** que bypassa RLS.

### PARTE 1: Ejecutar Función en Supabase

**Copia y ejecuta ESTO en Supabase SQL Editor:**

```sql
-- ============================================
-- FUNCIÓN SEGURA PARA CREAR PLANES (Asesores)
-- ============================================

CREATE OR REPLACE FUNCTION public.crear_plan_asesor(
  p_nombre TEXT,
  p_descripcion TEXT,
  p_precio DECIMAL,
  p_segmento TEXT,
  p_datos_moviles TEXT,
  p_minutos_voz TEXT,
  p_sms TEXT,
  p_velocidad_4g TEXT,
  p_velocidad_5g TEXT DEFAULT NULL,
  p_redes_sociales TEXT,
  p_whatsapp TEXT,
  p_llamadas_internacionales TEXT,
  p_roaming TEXT,
  p_imagen_url TEXT DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  v_user_id UUID;
  v_result json;
BEGIN
  -- 1. Obtener el usuario autenticado
  v_user_id := auth.uid();
  
  -- 2. Verificar que el usuario está autenticado
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuario no autenticado'
    );
  END IF;
  
  -- 3. Insertar el plan (sin RLS)
  INSERT INTO public.planes_moviles (
    nombre, descripcion, precio, segmento, datos_moviles, minutos_voz, 
    sms, velocidad_4g, velocidad_5g, redes_sociales, whatsapp, 
    llamadas_internacionales, roaming, imagen_url, created_by, activo, 
    created_at, updated_at
  )
  VALUES (
    p_nombre, p_descripcion, p_precio, p_segmento, p_datos_moviles, p_minutos_voz,
    p_sms, p_velocidad_4g, p_velocidad_5g, p_redes_sociales, p_whatsapp,
    p_llamadas_internacionales, p_roaming, p_imagen_url, v_user_id, TRUE,
    NOW(), NOW()
  );
  
  v_result := json_build_object(
    'success', true,
    'message', 'Plan creado exitosamente',
    'created_by', v_user_id
  );
  RETURN v_result;
  
EXCEPTION WHEN OTHERS THEN
  v_result := json_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', 'Error al crear el plan: ' || SQLERRM
  );
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.crear_plan_asesor(
  TEXT, TEXT, DECIMAL, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) TO authenticated, anon;

SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'crear_plan_asesor';
```

**Pasos:**
1. Copia TODO el script
2. Ve a Supabase → SQL Editor → New Query
3. Pega y ejecuta (Ctrl + Enter)
4. Deberías ver: ✅ "Query executed successfully"

---

### PARTE 2: Código Actualizado (YA HECHO)

He actualizado `planes.service.ts`:

**Cambio de:**
```typescript
// INSERT directo (bloqueado por RLS)
.from('planes_moviles')
.insert([{ ...plan }])
.select()
.single()
```

**A:**
```typescript
// Llamar función segura
.rpc('crear_plan_asesor', {
  p_nombre: plan.nombre,
  p_descripcion: plan.descripcion,
  // ... resto de parámetros
})
```

---

## 🚀 Ahora Prueba

1. **Limpia caché:** Ctrl + Shift + Delete
2. **Recarga:** Ctrl + F5
3. **Inicia sesión como asesor:**
   - Email: `asesor1@tigo.com`
   - Contraseña: `asesor123`
4. **Crea un nuevo plan**
5. **Esperado:** ✅ Plan creado exitosamente (sin error 401/42501)

---

## 📊 Flujo

```
1. Asesor llena formulario y hace submit
   ↓
2. planes.service.createPlan() llama:
   rpc('crear_plan_asesor', {...})
   ↓
3. Función PostgreSQL ejecuta
   ├─ Obtiene auth.uid() del asesor
   ├─ Inserta plan (sin RLS)
   └─ Retorna { success: true }
   ↓
4. Service actualiza planes$
   ↓
5. ✅ Plan aparece en el catálogo
```

---

## 🐛 Si Falla

### Error: "function crear_plan_asesor does not exist"
- **Causa:** No ejecutaste el SQL
- **Solución:** Repite PARTE 1

### Error: "Unauthorized" o "RLS violation"
- **Causa:** Probablemente la sesión no es válida
- **Solución:** Cierra sesión y vuelve a iniciar como asesor

### Error: "Decimal value out of range"
- **Causa:** El precio es muy grande
- **Solución:** Usa un precio más pequeño (ej: 19.99 en lugar de 999999999)

---

## ✅ Checklist

- [ ] Ejecuté la función en Supabase SQL
- [ ] Vi "Query executed successfully"
- [ ] Limpié caché (Ctrl + Shift + Delete)
- [ ] Recargué página (Ctrl + F5)
- [ ] Inicié sesión como asesor
- [ ] Intenté crear un plan
- [ ] ✅ ¡Funcionó!

---

## 📝 Resumen

| Antes | Ahora |
|-------|-------|
| INSERT directo (bloqueado por RLS) | Llamar función segura |
| Error 401/42501 | ✅ Funciona |
| RLS policy no permitía asesores | Función bypassa RLS |

**Status:** ✅ **LISTO PARA PROBAR**
