# 🔧 SOLUCIÓN: Error 401 (Unauthorized) al Registrarse

## 🎯 El Problema
Cuando intentas registrarte como usuario normal, aparece este error:
```
POST https://...supabase.co/rest/v1/perfiles 401 (Unauthorized)
```

Esto significa que **las RLS (Row Level Security) policies** no permiten que usuarios recién registrados inserten su propio perfil.

---

## ✅ SOLUCIÓN RÁPIDA (5 minutos)

### Paso 1: Ejecutar el Script SQL

1. Ve a tu proyecto Supabase → **SQL Editor**
2. Click en **"New Query"**
3. Copia TODO el contenido de: `SQL_FIX_RLS_POLICIES.sql`
4. Pégalo en el SQL Editor
5. Click **RUN** o presiona **Ctrl + Enter**
6. Deberías ver: "Query executed successfully"

### Paso 2: Limpiar Caché del Navegador

1. Presiona **Ctrl + Shift + Delete** (Windows)
2. Selecciona:
   - ☑ Cookies y otros datos de sitios
   - ☑ Almacenamiento indexado
3. Click **"Borrar datos"**
4. **Recarga la página** (Ctrl + F5)

### Paso 3: Intentar Registrarse Nuevamente

1. Abre la app
2. Selecciona rol **"Usuario"**
3. Click en **"Registrarse"**
4. Completa el formulario:
   - Nombre completo: Tu nombre
   - Email: cualquier email (NO limitado a @tigo.com)
   - Teléfono: Tu número
   - Contraseña: Cualquiera (mín 6 caracteres)
5. Acepta los términos
6. Click en **"Registrarse"**

**Esperado**: Debe funcionar sin errores y mostrar "¡Registro exitoso!"

---

## 🔍 ¿Por Qué Ocurría el Error?

### Antes (Incorrecto)
```sql
-- Política antigua (¡RESTRICTIVA!)
CREATE POLICY "Usuarios pueden ver su propio perfil"
ON perfiles FOR SELECT
USING (auth.uid() = user_id);

-- Falta la política de INSERT
-- El usuario puede ver su perfil pero NO puede CREARLO
```

### Ahora (Correcto)
```sql
-- Política nueva (¡PERMITE INSERT!)
CREATE POLICY "Los usuarios pueden crear su propio perfil"
ON public.perfiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- El usuario puede crear su perfil si el user_id coincide con su auth.uid()
```

---

## 📊 Políticas RLS Correctas Después del Fix

| Acción | Quién | Condición |
|--------|-------|-----------|
| **INSERT** | Usuario nuevo | Su propio `user_id` |
| **SELECT** | Usuario | Su propio perfil |
| **SELECT** | Cualquiera | Solo asesores (`rol = 'asesor_comercial'`) |
| **UPDATE** | Usuario | Su propio perfil |

---

## ✔️ Verificar que Funcionó

Después de ejecutar el SQL, verifica en Supabase:

1. Ve a **SQL Editor**
2. Ejecuta esta query:
```sql
SELECT polname, polcmd FROM pg_policies WHERE tablename = 'perfiles';
```

Deberías ver **4 políticas**:
- ✅ Los usuarios pueden crear su propio perfil (INSERT)
- ✅ Los usuarios pueden ver su propio perfil (SELECT)
- ✅ Cualquiera puede ver asesores (SELECT)
- ✅ Los usuarios pueden actualizar su propio perfil (UPDATE)

---

## 🚀 Próximos Pasos

Después de que el registro funcione:

1. ✅ Intenta registrarte como usuario
2. ✅ Inicia sesión con tus nuevas credenciales
3. ✅ Ve a tu perfil (deberías verlo sin errores 406)
4. ✅ Prueba actualizar tu perfil (foto, bio, etc.)

---

## ❓ Si Aún No Funciona

### Verificar que el usuario existe en la BD

En Supabase SQL Editor:
```sql
-- Ver usuarios registrados
SELECT id, email FROM auth.users;

-- Ver perfiles creados
SELECT * FROM public.perfiles;
```

### Si hay diferencia

Significa que el INSERT en `perfiles` falló. En ese caso:
- Revisa la consola del navegador (F12)
- Busca el error exacto
- Copia el mensaje de error

---

## 📝 Diferencia Entre Errores

| Error | Significado | Solución |
|-------|-------------|----------|
| **401 Unauthorized** | RLS policy bloquea | Ejecuta SQL_FIX_RLS_POLICIES.sql |
| **406 Not Acceptable** | Problema en query SQL | Cambiar `.eq()` por `.match()` (ya hecho) |
| **400 Bad Request** | Validación fallida | Revisa datos del formulario |
| **409 Conflict** | Email duplicado | Usa otro email |

---

## 💡 Pro Tips

1. **No dejes caché viejo**: Siempre limpia caché después de cambios en RLS
2. **Revisa la consola**: F12 → Console → Busca errores
3. **Una política a la vez**: Es más fácil debuggear
4. **Usa USING para SELECT**: `USING (auth.uid() = user_id)`
5. **Usa WITH CHECK para INSERT**: `WITH CHECK (auth.uid() = user_id)`

---

**Deberías estar listo ahora. ¡Intenta registrarte!** 🎉
