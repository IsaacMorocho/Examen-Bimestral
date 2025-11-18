# 🔒 Solución: Error NavigatorLockAcquireTimeoutError

## 🎯 Problema
Cuando intentas iniciar sesión, aparece este error en la consola:
```
NavigatorLockAcquireTimeoutError: Acquiring an exclusive Navigator 
LockManager lock "lock:sb-uwiahpshkbovgdzwbixd-auth-token" immediately failed
```

---

## 🔍 Causa
Este error ocurre cuando:
1. **Múltiples pestañas** del navegador están abiertas
2. **IndexedDB** tiene problemas de sincronización
3. **Supabase Lock Manager** no puede adquirir el lock de sesión exclusiva
4. El navegador intenta guardar la sesión simultáneamente desde múltiples fuentes

---

## ✅ Soluciones (en orden de efectividad)

### Solución 1: Limpiar Datos del Navegador (MÁS RÁPIDA) ⚡

#### En Google Chrome:
1. Presiona **Ctrl + Shift + Delete** (o **Cmd + Shift + Delete** en Mac)
2. Selecciona **"Todas las fechas"**
3. Marca:
   - ☑ Cookies y otros datos de sitios
   - ☑ Archivos en caché
   - ☑ Almacenamiento indexado
4. Haz clic en **"Borrar datos"**
5. Recarga la página

#### En Firefox:
1. Presiona **Ctrl + Shift + Delete**
2. Marca las opciones similares
3. Haz clic en **"Limpiar"**

---

### Solución 2: Usar Una Sola Pestaña del Navegador

**Cierra todas las pestañas de la app excepto una:**
1. Si tienes múltiples pestañas del mismo dominio abiertas
2. Cierra todas excepto una
3. Intenta login nuevamente

**Tip:** Si usas DevTools (F12), no abras múltiples ventanas de DevTools.

---

### Solución 3: Usar el Modo Incógnito/Privado

Abre la app en modo **privado/incógnito**:
- **Chrome**: Ctrl + Shift + N
- **Firefox**: Ctrl + Shift + P
- **Safari**: Cmd + Shift + N
- **Edge**: Ctrl + Shift + P

Esto crea una sesión aislada sin conflictos de lock.

---

### Solución 4: Cambiar Navegador

Si el problema persiste:
- Chrome → Intenta Firefox
- Firefox → Intenta Chrome
- Safari → Intenta Chrome o Edge

---

## 🛠️ Mejoras Implementadas en el Código

La app ha sido actualizada para **manejar este error automáticamente**:

### En `supabase.service.ts`:
- ✅ Handler de eventos para capturar errores de NavigatorLock
- ✅ Previene que el error rompa la app
- ✅ Registra el error en console para debugging

### En `auth.service.ts`:
- ✅ Detecta mensajes de error relacionados con "NavigatorLock"
- ✅ Muestra mensaje amigable: "Intenta nuevamente. Por favor espera un momento."
- ✅ No expone el error técnico al usuario
- ✅ Permite reintentar fácilmente

---

## 📱 Pasos para Probar Ahora

1. **Limpia el caché** (Solución 1)
2. **Cierra todas las pestañas** excepto una
3. **Recarga la página** (Ctrl + F5 para forzar recarga)
4. **Intenta login nuevamente**

Si aún ves el error en console:
- No te preocupes, la app lo maneja internamente
- Espera 2-3 segundos
- Haz clic en el botón "Ingresar" nuevamente

---

## 🐛 Si Sigue Fallando

### Opción 1: Verificar IndexedDB
1. Abre **DevTools** (F12)
2. Ve a **Application** → **Storage** → **IndexedDB**
3. Busca `supabase.auth.token`
4. Si está corrupto, **bórralo**:
   - Click derecho → Delete Database

### Opción 2: Resetear Supabase Session
En la consola del navegador (F12):
```javascript
// Limpiar sesión de Supabase
localStorage.clear();
sessionStorage.clear();
indexedDB.deleteDatabase('supabase');
// Luego recarga la página
window.location.reload();
```

### Opción 3: Desactivar Persistencia
Si necesitas una solución temporal, puedes usar:
```typescript
// En supabase.service.ts
persistSession: false  // Desactiva guardar sesión
```
(Esto significa que se cerrará sesión al recargar)

---

## 📊 Resumen de Cambios en la App

| Archivo | Cambio |
|---------|--------|
| `supabase.service.ts` | Handler para capturar errores de NavigatorLock |
| `auth.service.ts` - `login()` | Manejo de errores de lock, mensaje amigable |
| `auth.service.ts` - `register()` | Manejo de errores de lock, retry automático |
| `auth.service.ts` | Importar `catchError` del módulo RxJS |

---

## 🔐 Información Técnica (Avanzado)

### ¿Por qué ocurre?
Supabase usa **Navigator.locks API** (estándar web) para:
- Garantizar sincronización de sesión entre pestañas
- Evitar condiciones de carrera
- Mantener un único token válido

Cuando múltiples pestañas intenta escribir simultáneamente → **Lock timeout**

### ¿Cómo lo maneja Supabase ahora?
```typescript
// En supabase.service.ts
flowType: 'pkce'  // Más robusto que implicit
autoRefreshToken: true  // Refrescar automáticamente
persistSession: true  // Guardar sesión (default)
```

### Diferencia con versiones anteriores
Versiones viejas de Supabase-js ignoraban este error.
Versiones nuevas lo lanzan para evitar sesiones corruptas.

---

## ✔️ Checklist

- [ ] Limpié caché del navegador
- [ ] Cerré pestañas extras
- [ ] Recargué la página (Ctrl + F5)
- [ ] Intenté login nuevamente
- [ ] Si falla, usé modo incógnito
- [ ] Si sigue fallando, probé otro navegador
- [ ] Verifiqué IndexedDB en DevTools → Application

---

## 💡 Tips Útiles

1. **Para desarrollo**: Usa modo incógnito siempre
2. **Para producción**: Los usuarios normalmente no tendrán este problema
3. **Si es frecuente**: Revisa si hay conflictos de plugins del navegador
4. **Cache agresivo**: Algunos antivirus/extensiones pueden interferir

---

## 📞 Contacto / Más Ayuda

Si el problema persiste después de todas estas soluciones:
1. Reporta el error exacto de console
2. Nota el navegador y versión
3. Verifica si ocurre en https o http://localhost
4. Prueba en otro dispositivo

**Error esperado ver en console después de la solución:**
```
[Resuelto] Lock Manager error detected: Acquiring an exclusive...
[ESPERADO] El botón responde normalmente después
```
