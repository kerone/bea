/* =============================================================
 * AUREA · Autenticación (Supabase)
 * -------------------------------------------------------------
 * Maneja login con Google + email/contraseña, signup, logout y
 * la lectura de la sesión actual. Expone window.auth con la API
 * que la web (index.html) consume.
 *
 * Si Supabase aún no está configurado en supabase-config.js,
 * todas las acciones muestran un aviso pero no rompen la web.
 * ============================================================= */
(function () {
  const cfg = window.AUREA_SUPABASE_CONFIG || {};
  const isConfigured = Boolean(cfg.url && cfg.anonKey);
  let client = null;
  let mode = 'login'; // 'login' | 'signup'

  if (isConfigured && window.supabase && window.supabase.createClient) {
    client = window.supabase.createClient(cfg.url, cfg.anonKey);
  }

  // ─── UI helpers ─────────────────────────────────────────
  function $(id) { return document.getElementById(id); }
  function show(el, on) { if (el) el.style.display = on ? '' : 'none'; }
  function setMsg(text, kind) {
    const el = $('aula-login-msg');
    if (!el) return;
    if (!text) { el.style.display = 'none'; el.textContent = ''; return; }
    el.style.display = '';
    el.className = 'aula-msg aula-msg-' + (kind || 'info');
    el.textContent = text;
  }

  function showConfigWarning() {
    const warn = $('aula-config-warn');
    if (warn) warn.style.display = isConfigured ? 'none' : '';
  }

  function setMode(next) {
    mode = next;
    const submit = $('aula-submit-btn');
    const modeText = $('aula-mode-text');
    const toggle = $('aula-mode-toggle');
    if (mode === 'login') {
      submit.textContent = 'Entrar';
      modeText.textContent = '¿No tienes cuenta?';
      toggle.textContent = 'Date de alta';
    } else {
      submit.textContent = 'Crear cuenta';
      modeText.textContent = '¿Ya tienes cuenta?';
      toggle.textContent = 'Entra';
    }
    setMsg('');
  }

  // ─── Render estado actual ──────────────────────────────
  async function refresh() {
    showConfigWarning();
    const loginSection = $('aula-login-section');
    const listSection = $('aula-list-section');
    if (!client) {
      show(loginSection, true);
      show(listSection, false);
      return;
    }
    try {
      const { data: { user } } = await client.auth.getUser();
      if (user) {
        show(loginSection, false);
        show(listSection, true);
        const name = (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) || user.email || 'alumna';
        const userNameEl = $('aula-user-name');
        if (userNameEl) userNameEl.textContent = name.split(' ')[0].toLowerCase();
      } else {
        show(loginSection, true);
        show(listSection, false);
      }
    } catch (err) {
      console.error('[auth] getUser error:', err);
      show(loginSection, true);
      show(listSection, false);
    }
  }

  // ─── Acciones ───────────────────────────────────────────
  async function loginWithGoogle() {
    if (!client) { setMsg('Configura Supabase en assets/js/supabase-config.js antes de poder usar Google.', 'err'); return; }
    setMsg('Redirigiendo a Google…', 'info');
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: cfg.redirectTo }
    });
    if (error) setMsg(error.message, 'err');
  }

  async function loginWithEmail() {
    if (!client) { setMsg('Configura Supabase en assets/js/supabase-config.js antes de poder iniciar sesión.', 'err'); return; }
    const email = ($('aula-email').value || '').trim();
    const password = $('aula-password').value || '';
    if (!email || !password) { setMsg('Introduce email y contraseña.', 'err'); return; }
    setMsg(mode === 'signup' ? 'Creando tu cuenta…' : 'Comprobando credenciales…', 'info');
    let res;
    if (mode === 'signup') {
      res = await client.auth.signUp({ email, password, options: { emailRedirectTo: cfg.redirectTo } });
    } else {
      res = await client.auth.signInWithPassword({ email, password });
    }
    if (res.error) { setMsg(res.error.message, 'err'); return; }
    if (mode === 'signup' && res.data && res.data.user && !res.data.session) {
      setMsg('Te hemos enviado un email de confirmación. Ábrelo para activar tu cuenta.', 'ok');
      return;
    }
    setMsg('');
    refresh();
  }

  function toggleMode() { setMode(mode === 'login' ? 'signup' : 'login'); }

  async function logout() {
    if (!client) return;
    await client.auth.signOut();
    refresh();
  }

  async function forgotPassword() {
    if (!client) { setMsg('Configura Supabase antes de poder recuperar la contraseña.', 'err'); return; }
    const email = ($('aula-email').value || '').trim();
    if (!email) { setMsg('Escribe tu email arriba y vuelve a pulsar "¿Olvidaste la contraseña?".', 'err'); return; }
    setMsg('Enviando enlace de recuperación a ' + email + '…', 'info');
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: cfg.redirectTo });
    if (error) { setMsg(error.message, 'err'); return; }
    setMsg('Listo. Revisa tu bandeja de entrada (y la de spam) y pulsa el enlace que te mandamos.', 'ok');
  }

  async function promptNewPassword() {
    if (!client) return;
    const pw = prompt('Recibimos tu solicitud de recuperación. Introduce tu nueva contraseña (mínimo 6 caracteres):');
    if (!pw) return;
    if (pw.length < 6) { alert('La contraseña debe tener al menos 6 caracteres.'); return promptNewPassword(); }
    const { error } = await client.auth.updateUser({ password: pw });
    if (error) { alert('Error al actualizar la contraseña: ' + error.message); return; }
    alert('Contraseña actualizada. Ya estás dentro del aula.');
    refresh();
  }

  // ─── Init y suscripción a cambios ───────────────────────
  function init() {
    showConfigWarning();
    setMode('login');
    if (client) {
      client.auth.onAuthStateChange((event /*, session */) => {
        if (event === 'PASSWORD_RECOVERY') {
          // Llega aquí cuando la usuaria pulsa el enlace del email de recuperación.
          promptNewPassword();
        }
        refresh();
      });
    }
    refresh();
  }

  window.auth = {
    init, refresh,
    loginWithGoogle, loginWithEmail, toggleMode, logout,
    forgotPassword,
    isConfigured: () => isConfigured,
    getClient: () => client
  };
})();
