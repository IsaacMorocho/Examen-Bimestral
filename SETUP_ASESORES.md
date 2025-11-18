# 📱 TIGO Conecta - Guía de Configuración del Backend (Asesores)

## 🎯 Objetivo
Configurar la tabla `asesores` en Supabase para la autenticación de asesores comerciales con seguridad mejorada mediante bcryptjs.

---

## 📋 Pasos de Instalación

### Paso 1: Acceder a Supabase SQL Editor
1. Abre tu proyecto en [Supabase](https://supabase.com)
2. Ve a **SQL Editor** en el panel izquierdo
3. Haz clic en **"New Query"** para crear una nueva consulta SQL

### Paso 2: Ejecutar el Script SQL
1. Copia el contenido completo del archivo `SQL_asesores_table.sql`
2. Pégalo en el SQL Editor de Supabase
3. Haz clic en el botón **"RUN"** o presiona `Ctrl + Enter`

### Paso 3: Verificar la Creación
Después de ejecutar el script, verifica que:
- ✅ La tabla `asesores` se creó correctamente
- ✅ Los índices se crearon (email, activo, created_at)
- ✅ Las políticas RLS están habilitadas
- ✅ Los datos de prueba se insertaron

Para verificar, ejecuta esta consulta:
```sql
SELECT id, email, nombre, activo FROM public.asesores;
```

---

## 🔑 Credenciales de Prueba

Después de ejecutar el script, tendrás estos asesores disponibles para probar:

| Email | Contraseña | Nombre | Región |
|-------|-----------|--------|--------|
| asesor1@tigo.com | asesor123 | Juan Pérez | Costa |
| asesor2@tigo.com | asesor123 | María González | Litoral |
| asesor3@tigo.com | asesor123 | Carlos Rodríguez | Sierra |

---

## 🔐 Seguridad de Contraseñas

### Hash Usado
El script utiliza contraseñas hasheadas con **bcryptjs**:
- **Algoritmo**: Bcrypt
- **Costo**: 10 (estándar recomendado)
- **Hash de ejemplo**: `$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36gZvWFm`
- **Plaintext**: `asesor123`

### Validación en la App
El método `loginAdvisor()` en `auth.service.ts` valida:
1. ✅ Email existe en la tabla `asesores`
2. ✅ Password coincide (usando `bcryptjs.compare()`)
3. ✅ Asesor está activo (`activo = TRUE`)

---

## 📱 Flujo de Login de Asesores

```
┌─────────────────────────────────────────────┐
│  Usuario selecciona "Asesor" en auth.page   │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
        ┌─────────────────────┐
        │  Ingresa email y    │
        │  contraseña         │
        └────────┬────────────┘
                 │
                 ▼
    ┌───────────────────────────────┐
    │ loginAsAdvisor(email, pwd)    │
    │  (auth.page.ts)               │
    └────────┬──────────────────────┘
             │
             ▼
    ┌──────────────────────────────────┐
    │ authService.loginAdvisor()        │
    │ (auth.service.ts)                │
    │ 1. Busca email en tabla asesores │
    │ 2. Valida password con bcryptjs  │
    │ 3. Verifica activo = TRUE        │
    └────────┬─────────────────────────┘
             │
             ▼
      ┌──────────────────┐
      │ Navega a:        │
      │ /advisor/dashboard│
      └──────────────────┘
```

---

## 🛠️ Generar Nuevos Hashes de Contraseña

Si necesitas crear nuevas contraseñas o asesores:

### Opción 1: En Node.js/TypeScript
```typescript
import * as bcryptjs from 'bcryptjs';

async function generateHash(password: string) {
  const salt = await bcryptjs.genSalt(10);
  const hash = await bcryptjs.hash(password, salt);
  return hash;
}

// Uso:
generateHash('nuevacontraseña123').then(hash => {
  console.log('Hash:', hash);
  // Copia el hash y úsalo en la tabla asesores
});
```

### Opción 2: SQL para agregar nuevo asesor
```sql
INSERT INTO public.asesores (
  email, 
  nombre, 
  apellido, 
  password_hash, 
  telefono, 
  ciudad, 
  provincia, 
  activo, 
  region_asignada
) VALUES (
  'nuevo.asesor@tigo.com',
  'Nombre',
  'Apellido',
  'HASH_AQUI',  -- Reemplaza con hash generado
  '0987654324',
  'Ciudad',
  'Provincia',
  TRUE,
  'Región'
);
```

---

## 📊 Estructura de la Tabla Asesores

```typescript
interface Asesor {
  id: UUID;                    // PK - Generado automáticamente
  email: string;               // UNIQUE - Email del asesor
  nombre: string;              // Nombre del asesor
  apellido?: string;           // Apellido del asesor
  password_hash: string;       // Hash bcryptjs de contraseña
  telefono?: string;           // Número de contacto
  estado_civil?: string;       // Estado civil
  ciudad?: string;             // Ciudad de residencia
  provincia?: string;          // Provincia/Departamento
  foto_perfil?: string;        // URL de foto de perfil
  fecha_registro: timestamp;   // Fecha de creación
  fecha_actualizacion: timestamp; // Última actualización
  activo: boolean;             // Estado del asesor (default: true)
  region_asignada?: string;    // Región de ventas asignada
  created_at: timestamp;       // Timestamp de creación
  updated_at: timestamp;       // Timestamp de última actualización
}
```

---

## 🔍 Verificación Post-Instalación

### Verificar tabla creada:
```sql
SELECT * FROM information_schema.tables 
WHERE table_name = 'asesores';
```

### Ver todos los asesores:
```sql
SELECT id, email, nombre, activo, region_asignada, created_at 
FROM public.asesores 
ORDER BY created_at DESC;
```

### Ver logs de login (auditoría):
```sql
SELECT a.asesor_id, ad.nombre, a.login_timestamp, a.ip_address 
FROM public.audit_asesor_logins a
JOIN public.asesores ad ON a.asesor_id = ad.id
ORDER BY a.login_timestamp DESC;
```

---

## ⚠️ Notas Importantes

1. **RLS (Row Level Security)**: Habilitado para mayor seguridad
   - Cada asesor solo puede ver/editar su propio perfil
   - Usuarios anónimos pueden ver asesores activos

2. **Índices**: Creados para optimizar búsquedas por email y estado

3. **Triggers**: Automatizan actualización de timestamp `updated_at`

4. **Auditoría**: Tabla `audit_asesor_logins` para registrar intentos de login (opcional)

---

## 🚀 Próximos Pasos

Después de ejecutar este script:

1. ✅ Prueba login con credenciales de prueba
2. ✅ Verifica que navega a `/advisor/dashboard`
3. ✅ Implementa dashboard de asesor (si aún no existe)
4. ✅ Configura RLS para tablas relacionadas (planes, contratos)
5. ✅ Implementa métodos para cambiar contraseña
6. ✅ Implementa recuperación de contraseña

---

## 📞 Soporte

Si encuentras errores al ejecutar el script:
- Verifica que tienes permiso de admin en Supabase
- Asegúrate de que las tablas no existan previamente
- Revisa los mensajes de error en la consola SQL

---

## ✅ Checklist Final

- [ ] Script SQL ejecutado en Supabase
- [ ] Tabla `asesores` visible en Data Editor
- [ ] Datos de prueba insertados correctamente
- [ ] bcryptjs instalado en `package.json`
- [ ] `auth.service.ts` usa `bcryptjs.compare()`
- [ ] App compilada sin errores
- [ ] Login de asesor probado con credenciales
- [ ] Navegación a `/advisor/dashboard` funciona
