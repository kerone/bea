/* =============================================================
 * AUREA · Configuración de Supabase
 * -------------------------------------------------------------
 * Pega aquí tu URL y tu anon-key. Las dos vienen del panel de
 * Supabase: Project Settings → API.
 *
 *   1. Crea cuenta gratis en https://supabase.com
 *   2. New project → elige región Europe (Frankfurt está cerca)
 *   3. Espera 1 min a que se aprovisione
 *   4. Settings → API → copia "Project URL" y "anon public"
 *   5. Pégalos abajo
 *   6. Settings → Auth → Providers → Google → activa OAuth
 *      (Google Cloud Console te da Client ID y Secret)
 *
 * Mientras esto NO esté configurado, la zona de "Acceso alumnado"
 * te avisará y no permitirá login. El resto de la web funciona
 * normalmente.
 * ============================================================= */

window.AUREA_SUPABASE_CONFIG = {
  // Reemplaza por tu URL real: https://xxxxxxxxxxxx.supabase.co
  url: '',

  // Reemplaza por tu anon key (NO la service_role key)
  anonKey: '',

  // URL a la que vuelve Google tras autenticar.
  // En GitHub Pages será algo como https://TU_USUARIO.github.io/bea/
  // En local: http://localhost:8000/
  redirectTo: window.location.origin + window.location.pathname
};
