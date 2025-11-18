-- ============================================
-- CONFIGURAR SUPABASE PARA PERMITIR REGISTRO
-- ============================================

-- NOTA: Este archivo es INFORMATIVO
-- Las configuraciones principales se hacen en la UI de Supabase, NO en SQL

-- Sin embargo, puedes verificar la configuración actual con:

-- 1. Ver configuración de Auth
SELECT * FROM auth.audit_log_entries LIMIT 5;

-- 2. Ver usuarios registrados
SELECT id, email, email_confirmed_at, created_at FROM auth.users;

-- 3. Ver si hay restricciones de dominio
-- (Supabase no permite por defecto, pero puedes haberlo configurado)

-- ============================================
-- PASOS EN LA UI DE SUPABASE (MÁS IMPORTANTE)
-- ============================================

/*

PASO 1: Ve a tu proyecto Supabase
1. supabase.com → Tu proyecto
2. Click izquierda en "Authentication"
3. Click en "Providers"

PASO 2: Habilitar Email Provider
1. Busca "Email"
2. Asegúrate que esté en ON (verde)
3. En "Email Confirmations" selecciona:
   - ☑ Send Email Confirmations (ó)
   - ☑ Require email verification before signing in (depende de tu preferencia)

   Recomendación para desarrollo: DESACTIVAR confirmación
   - Click en "Confirm Email" → Desactívalo
   - Esto permite registro inmediato

PASO 3: Habilitar Sign Up
1. Click en "User Signup" en la barra izquierda
2. Asegúrate que esté en ON (verde)
3. En "Confirm Email" selecciona:
   - ☑ Off (para permitir signup inmediato)
   - O si lo prefieres: On (requerirá confirmar email)

PASO 4: Revisar URL de Redirección
1. Click en "URL Configuration"
2. Asegúrate que tenga:
   - Site URL: http://localhost:8100 (para desarrollo local)
   - Additional Redirect URLs: Tu URL de producción

PASO 5: Guardar Cambios
- Deberías ver mensaje verde: "Configuration saved"

*/

-- ============================================
-- VERIFICACIÓN (Puedes ejecutar después)
-- ============================================

-- Ver último registro
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN 'Email Confirmado'
    ELSE 'Email NO confirmado (pendiente)'
  END as estado_confirmacion
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 1;

-- Ver si hay errores recientes
SELECT 
  id,
  event,
  actor_id,
  actor_username,
  created_at
FROM auth.audit_log_entries 
ORDER BY created_at DESC 
LIMIT 10;
