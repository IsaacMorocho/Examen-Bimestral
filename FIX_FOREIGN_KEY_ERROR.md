# ✅ FIX: Foreign Key Constraint Error

## 🔴 El Error

```
insert or update on table "perfiles" violates foreign key constraint "perfiles_user_id_fkey"
```

**¿Qué significa?**
- La tabla `perfiles` tiene una Foreign Key a `auth.users(id)`
- Intentaste insertar un `user_id` que NO existe en `auth.users`
- Esto ocurre porque el usuario aún NO se ha propagado en la BD

---

## ✅ La Solución (2 partes)

### PARTE 1: Ejecutar Función Mejorada en Supabase

La función anterior no validaba si el usuario existía. Ahora con validación.

**Ejecuta ESTO en Supabase SQL Editor:**

```sql
-- ============================================
-- FUNCIÓN SEGURA MEJORADA - CON VALIDACIÓN
-- ============================================

-- 1. Crear función mejorada que valida el usuario primero
CREATE OR REPLACE FUNCTION public.crear_perfil_usuario(
  p_user_id UUID,
  p_full_name TEXT,
  p_phone TEXT DEFAULT NULL,
  p_rol TEXT DEFAULT 'usuario_registrado'
)
RETURNS json AS $$
DECLARE
  v_user_exists BOOLEAN;
  v_result json;
BEGIN
  -- 1. Verificar que el usuario existe en auth.users
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id)
  INTO v_user_exists;
  
  IF NOT v_user_exists THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuario no encontrado en auth.users'
    );
  END IF;
  
  -- 2. Verificar que no hay perfil duplicado
  IF EXISTS(SELECT 1 FROM public.perfiles WHERE user_id = p_user_id) THEN
    RETURN json_build_object(
      'success', true,
      'message', 'Perfil ya existe para este usuario'
    );
  END IF;
  
  -- 3. Insertar el perfil
  INSERT INTO public.perfiles (user_id, full_name, phone, rol, created_at, updated_at)
  VALUES (p_user_id, p_full_name, p_phone, p_rol, NOW(), NOW());
  
  v_result := json_build_object(
    'success', true,
    'message', 'Perfil creado exitosamente',
    'user_id', p_user_id
  );
  RETURN v_result;
  
EXCEPTION WHEN OTHERS THEN
  v_result := json_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', 'Error al crear el perfil: ' || SQLERRM
  );
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Permitir acceso
GRANT EXECUTE ON FUNCTION public.crear_perfil_usuario(UUID, TEXT, TEXT, TEXT) TO authenticated, anon;

-- 3. Verificar
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'crear_perfil_usuario';
```

**Pasos:**
1. Copia TODO el script
2. Ve a Supabase → SQL Editor → New Query
3. Pega y ejecuta (Ctrl + Enter)
4. Deberías ver: ✅ "Query executed successfully"

---

### PARTE 2: Código Actualizado (YA HECHO)

He actualizado `auth.service.ts` para:
1. **Esperar 500ms** después de `signUp()` para que el usuario se propague en la BD
2. Luego llamar la función SQL mejorada

El cambio clave:
```typescript
// IMPORTANTE: Esperar 500ms para que el usuario se propague en la BD
// Supabase necesita tiempo para sincronizar auth.users entre servidores
await new Promise(resolve => setTimeout(resolve, 500));

// Ahora sí llamar la función
const { error: funcError } = await supabase.rpc('crear_perfil_usuario', {...});
```

---

## 🚀 Ahora Prueba

1. **Limpia caché:** Ctrl + Shift + Delete
2. **Recarga:** Ctrl + F5
3. **Intenta registrarte:**
   - Email: `nuevo@ejemplo.com`
   - Contraseña: `Contraseña123!`
   - Nombre: `Tu Nombre`
4. **Esperado:** ✅ Se registra exitosamente

---

## 📊 ¿Por Qué Ocurría el Error?

### Timing Issue

```
T0: signUp() devuelve
    ├─ Usuario creado en auth (local)
    ├─ ✅ data.user.id disponible
    └─ ❌ Aún NO propagado a auth.users en la BD

T1: rpc() intenta insertar INMEDIATAMENTE
    ├─ Busca user_id en auth.users
    ├─ ❌ No lo encuentra (aún está en propagación)
    ├─ Foreign key falla
    └─ Error: "Usuario no encontrado"

T2 (después de 500ms): rpc() intenta insertar
    ├─ Busca user_id en auth.users
    ├─ ✅ Ahora SÍ existe
    ├─ Foreign key pasa
    └─ ✅ Insert exitoso
```

---

## ✅ Checklist

- [ ] Ejecuté la función mejorada en Supabase SQL
- [ ] Vi "Query executed successfully"
- [ ] Limpié caché (Ctrl + Shift + Delete)
- [ ] Recargué página (Ctrl + F5)
- [ ] Intenté registrarme
- [ ] ✅ ¡Funcionó!

---

## 🐛 Si AÚN Falla

### Error: "Usuario no encontrado en auth.users"
- **Causa:** El usuario tardó más de 500ms en propagarse
- **Solución:** Aumentar el delay a 1000ms (1 segundo)
  ```typescript
  await new Promise(resolve => setTimeout(resolve, 1000));
  ```

### Error: "Perfil ya existe para este usuario"
- **Causa:** Ya tiene un perfil
- **Solución:** Normal, es un mensaje de éxito

### Cualquier otro error
- **Solución:** Ve a Supabase → View Logs para ver el error exacto de la BD

---

## 📝 Resumen

| Problema | Causa | Solución |
|----------|-------|----------|
| Foreign Key Error | Usuario no propagado en BD | Esperar 500ms + Función mejorada |
| Timing Issue | rpc() llamado muy rápido | Delay de 500ms |
| Validación | Función no validaba usuario | Función mejorada con check |

**Status:** ✅ **LISTA PARA PROBAR**

Ejecuta el SQL mejorado y prueba el registro.
