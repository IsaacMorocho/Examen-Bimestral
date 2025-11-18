# 🔐 Solución: Error "Contraseña incorrecta" en Login de Asesores

## 🎯 Problema
Al intentar login como asesor, siempre muestra: **"Contraseña incorrecta"** aunque las credenciales sean correctas.

---

## 🔍 Causa Raíz
El error se debe a una de estas razones:

### 1. **Nombre del campo incorrecto en la BD**
- El script SQL original esperaba `password_hash`
- Pero tu tabla en Supabase probablemente tiene el campo como `password`

### 2. **Formato de hash incorrecto**
- Si las contraseñas no están hasheadas en la BD, `bcryptjs.compare()` falla
- Necesita una comparación directa de cadenas

### 3. **Sincronización de datos**
- El script SQL original no se ejecutó
- Los asesores no existen en la tabla

---

## ✅ Solución (Paso a Paso)

### Paso 1: Verificar la Estructura de la Tabla

En Supabase SQL Editor, ejecuta:
```sql
SELECT * FROM public.asesores LIMIT 1;
```

**Anota los nombres de los campos exactos**, especialmente:
- ¿Se llama `password` o `password_hash`?
- ¿Las contraseñas comienzan con `$2a$` (hasheadas) o son texto plano?

### Paso 2: Opción A - Si NO tienes tabla asesores

Ejecuta: `SQL_ASESORES_SIMPLE.sql`

Este script:
- Crea la tabla `asesores` con campo `password` (texto plano)
- Inserta 3 asesores de prueba:
  - Email: `asesor1@tigo.com` | Contraseña: `asesor123`
  - Email: `asesor2@tigo.com` | Contraseña: `asesor123`
  - Email: `asesor3@tigo.com` | Contraseña: `asesor123`

### Paso 3: Opción B - Si YA tienes tabla asesores

1. Abre tu tabla en Supabase Data Editor
2. Verifica:
   - ✅ El campo de contraseña existe
   - ✅ Contiene valores (no está vacío)
   - ✅ El asesor tiene `activo = TRUE`
3. Si falta el campo, ejecuta:
   ```sql
   ALTER TABLE public.asesores ADD COLUMN password VARCHAR(255);
   ```

### Paso 4: Actualizar los Asesores

Inserta datos de prueba simples (sin hash):
```sql
INSERT INTO public.asesores (email, nombre, password, activo)
VALUES ('asesor1@tigo.com', 'Juan Pérez', 'asesor123', TRUE)
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password;
```

### Paso 5: Probar el Login

1. Compilación ya realizada: ✅
2. Abre la app en tu navegador/dispositivo
3. Selecciona rol **"Asesor"**
4. Ingresa:
   - Email: `asesor1@tigo.com`
   - Contraseña: `asesor123`
5. Haz clic en **"Ingresar como Asesor"**

---

## 🔐 Mejora de Seguridad - Actualización a Bcrypt

Una vez que el login funcione, actualiza las contraseñas a hasheadas:

### En Node.js/Terminal:
```bash
npm install -g @types/bcryptjs
```

### Script para hashear contraseñas:
```javascript
const bcryptjs = require('bcryptjs');

async function hashPassword(plainPassword) {
  const hash = await bcryptjs.hash(plainPassword, 10);
  console.log('Plaintext:', plainPassword);
  console.log('Hash:', hash);
  return hash;
}

// Generar hashes:
hashPassword('asesor123').then(h => console.log(h));
hashPassword('nuevacontraseña').then(h => console.log(h));
```

### Actualizar en Supabase:
```sql
UPDATE public.asesores SET 
  password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36gZvWFm'
WHERE email = 'asesor1@tigo.com';
```

Luego en `auth.service.ts`:
```typescript
const passwordField = advisor.password_hash; // Usar solo password_hash
```

---

## 📝 Estado del Código Actual

**auth.service.ts - loginAdvisor() mejorado:**
- ✅ Intenta buscar `password` primero
- ✅ Si no existe, intenta `password_hash`
- ✅ Detecta automáticamente si está hasheada (`$2a$`)
- ✅ Usa `bcryptjs.compare()` para hashes
- ✅ Usa comparación directa para texto plano
- ✅ Registra errores en console

---

## 🐛 Debug: Verificar en Console

Después de intentar login fallido:

1. Abre **DevTools** (F12)
2. Ve a **Console**
3. Busca mensajes de error como:
   - `"No hay campo de contraseña"`
   - `"Error en validación de contraseña"`
   - `"Asesor inactivo"`

---

## ✔️ Checklist

- [ ] He ejecutado el SQL script apropiado
- [ ] Verificué que la tabla `asesores` existe
- [ ] Confirmé que los asesores tienen `activo = TRUE`
- [ ] Probé login con credenciales de prueba
- [ ] Si falla, abrí Console (F12) para ver errores
- [ ] Si sigue fallando, ejecuté `DIAGNOSTICO_ASESORES.sql`

---

## 📞 Si Sigue Fallando

Ejecuta en Supabase SQL Editor:
```sql
-- Ver exactamente qué hay en la tabla
SELECT * FROM public.asesores WHERE email = 'asesor1@tigo.com';

-- Crear un asesor de prueba simple
INSERT INTO public.asesores (email, nombre, password, activo)
VALUES ('test@tigo.com', 'Test User', 'test123', true);

-- Ver auditoría de intentos de login
SELECT * FROM public.audit_asesor_logins ORDER BY login_timestamp DESC LIMIT 5;
```

Luego intenta login con `test@tigo.com` / `test123`
