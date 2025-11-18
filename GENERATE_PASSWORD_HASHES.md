# 🔐 Generador de Hashes bcryptjs para Asesores

Este documento proporciona una guía para generar hashes seguros de contraseñas para agregar nuevos asesores a TIGO Conecta.

---

## 🛠️ Herramientas Disponibles

### Opción 1: Usar bcryptjs en Node.js (RECOMENDADO)

#### Instalación
```bash
npm install bcryptjs
```

#### Script para generar hash
```javascript
// archivo: generate-hash.js
const bcryptjs = require('bcryptjs');

async function generateHash(password) {
  try {
    // Generar salt con costo 10 (estándar recomendado)
    const salt = await bcryptjs.genSalt(10);
    const hash = await bcryptjs.hash(password, salt);
    
    console.log('Password:', password);
    console.log('Hash:', hash);
    console.log('\n--- COPIA ESTE HASH AL SCRIPT SQL ---\n');
    
    return hash;
  } catch (error) {
    console.error('Error:', error);
  }
}

// Uso
generateHash('mi_contraseña_segura_123').then(hash => {
  console.log('Hash generado:', hash);
});
```

#### Ejecutar
```bash
node generate-hash.js
```

---

### Opción 2: Script NPX (SIN instalación local)

```bash
npx -y bcryptjs-cli hash "mi_contraseña" 10
```

---

### Opción 3: Online (NO RECOMENDADO para contraseñas reales)

Usa https://bcryptjs.org/#section_online (solo para pruebas)

---

## 📝 Plantilla SQL para Agregar Asesores

Después de generar el hash, usa esta plantilla:

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
) VALUES 
  (
    'nuevo.asesor@tigo.com',
    'Nombre',
    'Apellido',
    '$2a$10$HASH_BCRYPTJS_AQUI',
    '0987654324',
    'Quito',
    'Pichincha',
    TRUE,
    'Costa'
  ),
  (
    'otro.asesor@tigo.com',
    'Otro',
    'Nombre',
    '$2a$10$OTRO_HASH_AQUI',
    '0987654325',
    'Guayaquil',
    'Guayas',
    TRUE,
    'Litoral'
  );
```

---

## 🔄 Cambiar Contraseña de Asesor Existente

```sql
-- Primero genera el nuevo hash
-- Luego ejecuta:

UPDATE public.asesores 
SET password_hash = '$2a$10$NUEVO_HASH_AQUI'
WHERE email = 'asesor1@tigo.com';
```

---

## 🧪 Validar Hash en TypeScript

```typescript
import * as bcryptjs from 'bcryptjs';

async function validatePassword(plainPassword: string, hash: string): Promise<boolean> {
  return await bcryptjs.compare(plainPassword, hash);
}

// Uso:
validatePassword('asesor123', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36gZvWFm')
  .then(isValid => console.log('Contraseña válida:', isValid));
```

---

## 📊 Ejemplos de Hashes Generados

```
Password: asesor123
Hash: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36gZvWFm

Password: miPassword2024!
Hash: $2a$10$abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz

Password: TiGo@2024#Secure
Hash: $2a$10$zyxwvutsrqponmlkjihgfedcbazyxwvutsrqponmlkjihgfedcba
```

---

## ✅ Mejores Prácticas

1. **Nunca guardes contraseñas en texto plano** ❌
2. **Siempre hashea con bcryptjs** ✅
3. **Costo mínimo: 10 (recomendado)** ✅
4. **Máximo costo: 12 (más seguro, más lento)** ✅
5. **Usa contraseñas fuertes** ✅
   - Mínimo 8 caracteres
   - Incluye mayúsculas y minúsculas
   - Incluye números y caracteres especiales

---

## 🔗 Referencias

- [bcryptjs - GitHub](https://github.com/dcodeIO/bcrypt.js)
- [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [Bcrypt Salting y Hashing](https://en.wikipedia.org/wiki/Bcrypt)

---

## 📋 Checklist

- [ ] He leído las mejores prácticas
- [ ] He instalado bcryptjs localmente
- [ ] He generado mi primer hash
- [ ] He validado el hash funciona
- [ ] He insertado un nuevo asesor en Supabase
- [ ] He testeado login con nueva contraseña
