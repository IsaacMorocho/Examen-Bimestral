# 🚀 SOLUCIÓN EN 5 PASOS - REGÍSTRATE YA

## ⏱️ Tiempo Total: 5 Minutos

---

## PASO 1️⃣: Abre Supabase SQL Editor (1 minuto)

1. Ve a **supabase.com**
2. Abre tu proyecto TIGO Conecta
3. Click izquierda en **"SQL Editor"**
4. Click azul **"New Query"**

---

## PASO 2️⃣: Copia el Script SQL (1 minuto)

1. Abre el archivo: **`SQL_FIX_RLS_POLICIES.sql`** en tu carpeta
2. **Selecciona TODO** (Ctrl + A)
3. **Copia** (Ctrl + C)
4. En Supabase, **pega** en el editor (Ctrl + V)

---

## PASO 3️⃣: Ejecuta el Script (1 minuto)

1. Click **"RUN"** o presiona **Ctrl + Enter**
2. Deberías ver: ✅ **"Query executed successfully"** (en verde)
3. Si ves error en rojo, escríbelo y comparte

---

## PASO 4️⃣: Limpia tu Navegador (1 minuto)

1. Presiona **Ctrl + Shift + Delete**
2. Marca:
   - ☑ Cookies
   - ☑ Almacenamiento indexado
3. Click **"Borrar datos"**

---

## PASO 5️⃣: Recarga y Prueba (1 minuto)

1. Presiona **Ctrl + F5** (fuerza recarga)
2. Espera a que cargue completamente
3. Selecciona rol **"Usuario"**
4. Click **"Registrarse"**
5. Completa con:
   - **Nombre**: Tu nombre
   - **Email**: `test@gmail.com` (o cualquier email, NO debe ser @tigo.com)
   - **Teléfono**: `0987654321`
   - **Contraseña**: `Test123456`
   - ☑ Aceptar términos
6. Click **"Registrarse"**

---

## ✅ Si Funciona

Deberías ver:
```
✅ "¡Registro exitoso! Inicia sesión ahora"
```

Luego:
1. Click **"Iniciar Sesión"**
2. Usa tus credenciales
3. **¡Listo!**

---

## ❌ Si No Funciona

Abre la **Console** (F12) y busca el error:

**Si ves**: `401 Unauthorized`
→ El SQL script no se ejecutó bien
→ Repite PASO 2 y 3

**Si ves**: `406 Not Acceptable`
→ Ya está solucionado en el código
→ Limpia caché (Paso 4) e intenta de nuevo

**Si ves**: `409 Conflict`
→ Email ya existe
→ Usa otro email (ej: test2@gmail.com)

---

## 🎯 Próximo: Probar Login de Asesor

Una vez que el registro funcione:

1. Click atrás o recarga página
2. Selecciona rol **"Asesor"**
3. Email: `asesor1@tigo.com`
4. Contraseña: `asesor123`
5. Click **"Ingresar como Asesor"**

Deberías ver el **dashboard de asesor** (sin errores)

---

## 📞 ¿Duda?

Revisa estos archivos para más info:
- `FIX_REGISTRO_USUARIOS.md` - Explicación técnica
- `RESUMEN_TRES_PROBLEMAS.md` - Resumen de cambios
- `SOLUCION_LOGIN_ASESORES.md` - Para problemas de asesor
- `SOLUCION_NAVIGATOR_LOCK_ERROR.md` - Para errores de navegador

---

**¡ADELANTE! Ahora mismo ejecuta el SQL script.** 🚀
