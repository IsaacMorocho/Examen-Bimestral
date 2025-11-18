# 🚀 PASOS INMEDIATOS PARA HACER FUNCIONAR EL LOGIN DE ASESORES

## 📋 Tu Lista de Pendientes (Orden de Importancia)

### ⚡ PASO 1: Limpiar Caché del Navegador (2 minutos)
**Esto es CRÍTICO para resolver el error de NavigatorLock**

1. Abre tu navegador
2. Presiona: **Ctrl + Shift + Delete** (Windows) o **Cmd + Shift + Del** (Mac)
3. Selecciona:
   - ☑ Cookies y otros datos de sitios
   - ☑ Archivos en caché
   - ☑ Almacenamiento indexado
4. Click en **"Borrar datos"**
5. **Recarga la página** de la app (Ctrl + F5)

---

### 🔑 PASO 2: Crear Tabla de Asesores en Supabase (5 minutos)

#### Opción A: Prueba Rápida (Recomendada)
1. Ve a tu proyecto en **supabase.com**
2. Abre **SQL Editor** → Click **"New Query"**
3. Copia TODO el contenido de: `SQL_ASESORES_SIMPLE.sql`
4. Pégalo en el SQL Editor
5. Click **RUN** o presiona **Ctrl + Enter**
6. ✅ Debes ver: "Query executed successfully"

#### Opción B: Prueba Completa (Con más características)
- En lugar de `SQL_ASESORES_SIMPLE.sql`, usa `SQL_asesores_table.sql`
- Incluye RLS policies, auditoría, etc.

---

### 🧪 PASO 3: Probar Login de Asesor (2 minutos)

1. Abre la app en tu navegador
2. Selecciona rol **"Asesor"** en la primera pantalla
3. Ingresa:
   - **Email**: `asesor1@tigo.com`
   - **Contraseña**: `asesor123`
4. Click en **"Ingresar como Asesor"**

**Esperado**: Debes ver la pantalla `/advisor/dashboard`

**Si falla**:
- Abre **DevTools** (F12)
- Ve a **Console**
- Busca mensajes de error
- Consulta `SOLUCION_LOGIN_ASESORES.md`

---

### 🎯 PASO 4: Prueba Adicional (Opcional)

Puedes probar con estos asesores también:
- **Email**: `asesor2@tigo.com` | **Contraseña**: `asesor123`
- **Email**: `asesor3@tigo.com` | **Contraseña**: `asesor123`

---

## 📚 Documentos de Referencia

Si tienes problemas, consulta estos archivos EN ESTE ORDEN:

1. **🔴 Error: "Contraseña incorrecta"**
   → Lee: `SOLUCION_LOGIN_ASESORES.md`

2. **🔴 Error: NavigatorLockAcquireTimeoutError**
   → Lee: `SOLUCION_NAVIGATOR_LOCK_ERROR.md`

3. **❓ ¿Cómo ejecutar el script SQL?**
   → Lee: `SETUP_ASESORES.md`

4. **📊 Resumen de todo lo que cambió**
   → Lee: `CAMBIOS_REALIZADOS.md`

---

## 🎓 Entender qué pasó

### El Problema Original
- La tabla `asesores` no existía en Supabase
- O existía pero no con los campos correctos
- El método de login de asesor no funcionaba

### La Solución
1. ✅ Creamos script SQL para crear la tabla
2. ✅ Mejoramos el código de login para ser más robusto
3. ✅ Agregamos manejo de errores de NavigatorLock
4. ✅ Todo está documentado

---

## 🔍 Verificar que Todo Esté Bien

Después de hacer los 3 pasos anteriores, verifica:

**En tu base de datos (Supabase):**
```
✅ Tabla "asesores" existe
✅ Tiene al menos 3 asesores
✅ Campo "password" contiene "asesor123" (o está hasheado)
✅ Campo "activo" = TRUE
```

**En la app:**
```
✅ No hay errores en console (F12)
✅ Botón "Ingresar como Asesor" funciona
✅ Navega a /advisor/dashboard después de login
```

---

## ⏱️ Tiempo Total Estimado

- Paso 1: **2 minutos** (limpiar caché)
- Paso 2: **5 minutos** (ejecutar SQL)
- Paso 3: **2 minutos** (probar login)
- **TOTAL: 9 minutos**

---

## ❓ Preguntas Frecuentes

**P: ¿Puedo omitir el Paso 1?**
R: No es recomendable. El error de NavigatorLock es causado por datos antiguos en el caché.

**P: ¿Qué si no sé dónde está el SQL Editor en Supabase?**
R: Ve a supabase.com → Abre tu proyecto → Mira el menú izquierdo → "SQL Editor"

**P: ¿Qué si el script falla?**
R: Consulta `DIAGNOSTICO_ASESORES.sql` para verificar qué está mal

**P: ¿Las contraseñas están seguras?**
R: Por ahora son texto plano (para pruebas). En producción, debes hashearlas con bcryptjs.

**P: ¿Puedo cambiar la contraseña?**
R: Sí, en Supabase Data Editor, abre tabla "asesores" y edita la columna "password"

---

## 🎬 Próximo Paso

👉 **Ahora mismo**: 
1. Limpia el caché (Paso 1)
2. Ejecuta el SQL (Paso 2)
3. Prueba el login (Paso 3)

Si todo funciona, ¡felicidades! 🎉

Si algo no funciona, abre la consola (F12) y revisa los documentos de ayuda.

---

**¿Necesitas ayuda?** Revisa el archivo relevante en esta lista:
- `SOLUCION_LOGIN_ASESORES.md`
- `SOLUCION_NAVIGATOR_LOCK_ERROR.md`
- `SETUP_ASESORES.md`
- `CAMBIOS_REALIZADOS.md`
