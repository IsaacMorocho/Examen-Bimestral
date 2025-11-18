# 🚨 FIX CRÍTICO: Foreign Key en planes_moviles

## ❌ El Problema

El error que recibiste:
```
Función retornó error: insert or update on table "planes_moviles" violates foreign key constraint "planes_moviles_created_by_fkey"
```

### 🔍 Causa Raíz

La tabla `planes_moviles` tiene una **Foreign Key incorrecta**:

- **Actualmente:** `created_by` apunta a → `auth.users(id)`
- **Realidad:** Los asesores NO están en `auth.users`, están en tabla `asesores`
- **Resultado:** Cuando intentamos insertar un plan con `created_by = asesores.id`, falla porque ese ID no existe en `auth.users`

### 🎯 La Solución

Cambiar la Foreign Key para que apunte a `asesores.id` en lugar de `auth.users.id`.

---

## ✅ Pasos para Corregir

### PASO 1: Abrir Supabase SQL Editor
1. Ve a tu proyecto en [supabase.com](https://supabase.com)
2. Click en **SQL Editor** (lado izquierdo)
3. Click en **"New Query"**

### PASO 2: Ejecutar el Script SQL

Copia y pega **TODO ESTO**:

```sql
-- Cambiar Foreign Key de planes_moviles.created_by

-- 1. ELIMINAR LA FOREIGN KEY ACTUAL
ALTER TABLE planes_moviles 
DROP CONSTRAINT IF EXISTS planes_moviles_created_by_fkey;

-- 2. CREAR NUEVA FOREIGN KEY QUE APUNTE A asesores.id
ALTER TABLE planes_moviles
ADD CONSTRAINT planes_moviles_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES asesores(id) 
ON DELETE SET NULL;
```

### PASO 3: Ejecutar la Consulta
- Presiona **Ctrl + Enter** o click en botón **RUN**
- Debes ver: ✅ **"Query executed successfully"**

### PASO 4: Verificar el Cambio

Ejecuta esta consulta para confirmar:

```sql
-- Ver la nueva FK correcta
SELECT 
  constraint_name,
  table_name,
  column_name
FROM information_schema.table_constraints
WHERE constraint_name = 'planes_moviles_created_by_fkey' 
  AND table_name = 'planes_moviles';
```

Debes ver una fila con:
- constraint_name: `planes_moviles_created_by_fkey`
- table_name: `planes_moviles`
- column_name: `created_by`

---

## 🧪 Prueba del Fix

### 1. Limpiar Cache del Navegador
- Presiona **Ctrl + Shift + Delete**
- Selecciona "Borrar TODO"
- Click en "Borrar datos"
- Cierra y reabre navegador

### 2. Recargar Aplicación
- Presiona **Ctrl + F5** (fuerza recarga sin cache)

### 3. Intentar Crear Plan de Nuevo
1. Login como: `asesor1@tigo.com` / `asesor123`
2. Click en **"Crear Plan"**
3. Llena todos los campos
4. Click en **"Guardar"**

### 4. Esperado en Consola (F12)

Debes ver en el Console:
```
📝 Creando plan para user_id: 288a2743-12b2-4c5f-bb0c-17792e07c346
RPC Response crear_plan_asesor: {error: null, data: {...}, status: 200, statusText: ''}
✅ Plan creado exitosamente (Supabase wrapper)
```

### 5. Indicadores de Éxito
- ✅ No hay error rojo en consola
- ✅ Se ve mensaje "✅ Plan creado exitosamente"
- ✅ El plan aparece en el dashboard
- ✅ Sin errores de FK

---

## ⚠️ Si Aún Falla

Si ves otro error, ejecuta esta consulta para diagnosticar:

```sql
-- Verificar que existe el asesor
SELECT id, email, nombre FROM asesores 
WHERE activo = TRUE;

-- Ver estructura de planes_moviles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'planes_moviles' 
ORDER BY ordinal_position;

-- Ver foreign keys de planes_moviles
SELECT 
  constraint_name,
  column_name,
  referenced_table_name,
  referenced_column_name
FROM information_schema.referential_constraints
WHERE table_name = 'planes_moviles';
```

Luego copia el resultado del error y comparte conmigo.

---

## 📋 Resumen del Flujo

```
ANTES (❌ Incorrecto):
┌─────────────────────────────────────────────┐
│ planes_moviles                              │
│ created_by → (FK) → auth.users.id           │  ❌ Asesores NO en auth.users
└─────────────────────────────────────────────┘

DESPUÉS (✅ Correcto):
┌─────────────────────────────────────────────┐
│ planes_moviles                              │
│ created_by → (FK) → asesores.id             │  ✅ Apunta correctamente
└─────────────────────────────────────────────┘
```

---

## 🎯 Próximos Pasos (Después de este Fix)

1. ✅ Ejecutar `SQL_FIX_FK_PLANES_MOVILES.sql`
2. ⏭️ Limpiar cache y recargar navegador
3. ⏭️ Probar creación de planes
4. ⏭️ Si funciona: continuar con features adicionales

---

¡Avísame si el fix funcionó! 🚀
