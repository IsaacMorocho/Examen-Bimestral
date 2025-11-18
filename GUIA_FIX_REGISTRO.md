# 🔧 FIX INMEDIATO: Error 401 / 42501 en Registro de Usuarios

## ¿Por qué falla?
El error `42501 "new row violates row-level security policy for table perfiles"` significa que **falta la política RLS de INSERT** en la tabla `perfiles`. 

La app crea el usuario en Supabase.auth correctamente, pero no puede insertar el perfil porque no hay permiso.

---

## ✅ SOLUCIÓN EN 3 PASOS

### Paso 1: Abre Supabase SQL Editor
1. Ve a https://supabase.com
2. Entra a tu proyecto `Examen`
3. Navega a **SQL Editor** (lado izquierdo)
4. Haz clic en **"New Query"** (botón verde)

### Paso 2: Copia y ejecuta el script
1. Abre el archivo `SQL_FIX_RLS_INSERT.sql` en tu editor
2. Selecciona TODO el contenido (Ctrl + A)
3. Cópialo (Ctrl + C)
4. Vuelve a Supabase y pega el código en el editor SQL (Ctrl + V)
5. Haz clic en el botón **RUN** (o presiona Ctrl + Enter)

### Paso 3: Verifica que funcionó
- Deberías ver **✓ Query executed successfully** en verde
- Si hay error, revisa que:
  - Estés en el proyecto correcto
  - La tabla `perfiles` exista
  - Tengas permisos de administrador

---

## 🧪 Probar el registro

Después de ejecutar el SQL:

1. **Recarga la app**: Ctrl + F5 (vacía cache del navegador)
2. **Selecciona "Usuario"** en la pantalla de roles
3. **Haz clic en "Registrarse"**
4. Completa el formulario:
   - Email: `prueba@gmail.com` (cualquier email funciona)
   - Contraseña: `minimo6caracteres`
   - Nombre: `Juan Pérez`
   - Teléfono: `3101234567`
   - Acepta términos
5. **Haz clic en "Registrarse"**

### Resultado esperado:
✅ Aparece mensaje: **"¡Registro exitoso!"**
❌ Sin error 401 / 42501

---

## 📝 ¿Qué hace el script?

```sql
-- Habilita RLS en la tabla perfiles
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

-- Crea política que permite INSERT si:
-- - El usuario está autenticado (auth.uid() existe)
-- - El user_id del nuevo registro = UID del usuario autenticado
CREATE POLICY "Los usuarios pueden insertar su perfil"
ON public.perfiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

---

## 🔐 Políticas RLS actuales en `perfiles`

Después de ejecutar el script, deberías tener:

| Operación | Política | Condición |
|-----------|----------|-----------|
| SELECT | "Usuarios leen su propio perfil" | auth.uid() = user_id |
| UPDATE | "Usuarios actualizan su propio perfil" | auth.uid() = user_id |
| **INSERT** | **"Los usuarios pueden insertar su perfil"** | **auth.uid() = user_id** |

---

## 🚨 Si sigue fallando

1. Verifica en **Supabase → Table Editor → perfiles** que la tabla exista
2. Comprueba que RLS esté **ON** (debería decir "RLS: ON" en azul)
3. Intenta ejecutar manualmente en SQL Editor:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'perfiles';
   ```
   Deberías ver 3 políticas (SELECT, UPDATE, INSERT)

---

## ✨ Después que funcione el registro

Prueba el **login de asesor**:
- Email: `asesor1@tigo.com`
- Contraseña: `asesor123`
- Debe redirigir a `/advisor/dashboard`
