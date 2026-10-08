/* =============================================================
 * PRECISSA INSTITUTE · Autenticación (Supabase)
 * -------------------------------------------------------------
 * Maneja login con Google + email/contraseña, signup, logout y
 * la lectura de la sesión actual. Expone window.auth con la API
 * que la web (index.html) consume.
 *
 * Si Supabase aún no está configurado en supabase-config.js,
 * todas las acciones muestran un aviso pero no rompen la web.
 * ============================================================= */
(function () {
  const cfg = window.PRECISSA_SUPABASE_CONFIG || {};
  const isConfigured = Boolean(cfg.url && cfg.anonKey);
  let client = null;
  let mode = 'login'; // 'login' | 'signup'
  let recovering = false; // true mientras elige la nueva contraseña

  if (isConfigured && window.supabase && window.supabase.createClient) {
    client = window.supabase.createClient(cfg.url, cfg.anonKey);
  }

  // ─── UI helpers ─────────────────────────────────────────
  function $(id) { return document.getElementById(id); }
  function show(el, on) { if (el) el.style.display = on ? '' : 'none'; }
  function setAuthClass(authed) {
    document.body.classList.toggle('is-authed', !!authed);
    document.querySelectorAll('.acceder-btn').forEach(b => b.style.display = authed ? 'none' : '');
    document.querySelectorAll('.mi-aula-btn').forEach(b => b.style.display = authed ? '' : 'none');
  }
  function setMsg(text, kind) {
    const el = $('aula-login-msg');
    if (!el) return;
    if (!text) { el.style.display = 'none'; el.textContent = ''; return; }
    el.style.display = '';
    el.className = 'aula-msg aula-msg-' + (kind || 'info');
    el.textContent = text;
  }

  // Traduce los errores de Supabase a un español comprensible. Nunca
  // devuelve el mensaje original (queda en consola para quien lo necesite).
  function mensajeAuth(error) {
    const raw = String((error && (error.message || error.error_description)) || error || '');
    const m = raw.toLowerCase();
    if (m.includes('invalid login credentials')) return 'El email o la contraseña no coinciden. Revisa ambos o pulsa «¿Olvidaste la contraseña?».';
    if (m.includes('email not confirmed')) return 'Aún no has confirmado tu email. Busca nuestro correo (mira también en spam) y pulsa el enlace.';
    if (m.includes('user already registered') || m.includes('already been registered')) return 'Ya tienes cuenta con este email. Pulsa «Entrar» e inicia sesión.';
    if (m.includes('password should be at least') || (m.includes('password') && m.includes('6'))) return 'La contraseña debe tener al menos 6 caracteres.';
    if (m.includes('rate limit') || m.includes('too many requests')) return 'Demasiados intentos seguidos. Espera un minuto y vuelve a probar.';
    if (m.includes('invalid email') || m.includes('unable to validate email')) return 'Ese email no parece correcto. Revísalo.';
    if (m.includes('network') || m.includes('failed to fetch')) return 'No hay conexión con el aula. Revisa tu internet e inténtalo de nuevo.';
    console.warn('[auth] error no traducido:', raw);
    return 'No hemos podido completar la operación. Inténtalo de nuevo o escríbenos por WhatsApp.';
  }

  const MSG_SIN_CONEXION = 'No hemos podido conectar con el aula. Revisa tu conexión o inténtalo en unos minutos.';

  function showConfigWarning() {
    const warn = $('aula-config-warn');
    if (!isConfigured) console.warn('[auth] Supabase no configurado: revisa assets/js/supabase-config.js');
    if (warn) warn.style.display = isConfigured ? 'none' : '';
  }

  function setMode(next) {
    mode = next;
    const submit = $('aula-submit-btn');
    const toggle = $('aula-mode-toggle');
    if (mode === 'login') {
      submit.textContent = 'Entrar';
      toggle.textContent = '¿Primera vez? Crea tu contraseña';
    } else {
      submit.textContent = 'Crear cuenta';
      toggle.textContent = '¿Ya tienes contraseña? Entra';
    }
    setMsg('');
  }

  // ─── Render estado actual ──────────────────────────────
  async function refresh() {
    showConfigWarning();
    const loginSection = $('aula-login-section');
    const listSection = $('aula-list-section');
    // Notifica a quien dependa del estado de admin (panel admin, etc.)
    if (typeof window.refreshAdminLinks === 'function') {
      window.refreshAdminLinks().catch(() => {});
    }
    // Las cards del catálogo público cambian su CTA según matrícula
    // ("Entrar al curso" vs "Solicitar información").
    if (typeof window.decoratePublicCourseCards === 'function') {
      Promise.resolve(window.decoratePublicCourseCards()).catch(() => {});
    }
    // Si la alumna hace login estando YA en la página del aula, el grid de
    // cursos se renderizó sin sesión ("Aún no tienes cursos asignados") y
    // nadie lo volvía a pintar: re-renderizar al cambiar el estado de auth.
    const aulaPage = document.getElementById('page-aula');
    if (aulaPage && aulaPage.classList.contains('active') && typeof window.renderAulaCourses === 'function') {
      Promise.resolve(window.renderAulaCourses()).catch(() => {});
    }
    if (recovering) {
      // La sesión de recuperación ya existe, pero hasta guardar la contraseña
      // se mantiene visible el formulario de nueva contraseña.
      show(loginSection, true);
      show(listSection, false);
      return;
    }
    if (!client) {
      show(loginSection, true);
      show(listSection, false);
      setAuthClass(false);
      return;
    }
    try {
      const { data: { user } } = await client.auth.getUser();
      if (user) {
        show(loginSection, false);
        show(listSection, true);
        setAuthClass(true);
        let display;
        const fullName = user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name);
        if (fullName) {
          display = fullName.split(' ')[0]; // primer nombre
        } else if (user.email) {
          display = user.email.split('@')[0]; // parte antes del @
        } else {
          display = 'alumna';
        }
        if (display.length > 18) display = display.slice(0, 16) + '…';
        display = display.charAt(0).toUpperCase() + display.slice(1);
        const userNameEl = $('aula-user-name');
        if (userNameEl) userNameEl.textContent = display;
        const avatarEl = $('aula-avatar');
        if (avatarEl) avatarEl.textContent = display.charAt(0).toUpperCase();
        const subEl = $('aula-user-sub');
        if (subEl && user.email) subEl.textContent = user.email;
      } else {
        show(loginSection, true);
        show(listSection, false);
        setAuthClass(false);
      }
    } catch (err) {
      console.error('[auth] getUser error:', err);
      show(loginSection, true);
      show(listSection, false);
      setAuthClass(false);
    }
  }

  // ─── Acciones ───────────────────────────────────────────
  async function loginWithGoogle() {
    if (!client) { console.warn('[auth] sin cliente Supabase'); setMsg(MSG_SIN_CONEXION, 'err'); return; }
    setMsg('Redirigiendo a Google…', 'info');
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: cfg.redirectTo }
    });
    if (error) setMsg(mensajeAuth(error), 'err');
  }

  async function loginWithEmail() {
    if (!client) { console.warn('[auth] sin cliente Supabase'); setMsg(MSG_SIN_CONEXION, 'err'); return; }
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
    if (res.error) { setMsg(mensajeAuth(res.error), 'err'); return; }
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
    if (!client) { console.warn('[auth] sin cliente Supabase'); setMsg(MSG_SIN_CONEXION, 'err'); return; }
    const email = ($('aula-email').value || '').trim();
    if (!email) { setMsg('Escribe tu email arriba y vuelve a pulsar "¿Olvidaste la contraseña?".', 'err'); return; }
    setMsg('Enviando enlace de recuperación a ' + email + '…', 'info');
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: cfg.redirectTo });
    if (error) { setMsg(mensajeAuth(error), 'err'); return; }
    setMsg('Listo. Revisa tu bandeja de entrada (y la de spam) y pulsa el enlace que te mandamos.', 'ok');
  }

  // Flujo de recuperación: muestra el formulario de nueva contraseña
  // dentro de la propia tarjeta de login (sin prompt ni alert).
  function promptNewPassword() {
    if (!client) return;
    const np = $('aula-newpass');
    if (!np) return;
    recovering = true;
    show($('aula-login-form'), false);
    show($('aula-foot-mode'), false);
    show($('aula-foot-forgot'), false);
    np.hidden = false;
    show($('aula-login-section'), true);
    show($('aula-list-section'), false);
    setMsg('');
    const inp = $('aula-newpass-input');
    if (inp) { inp.value = ''; try { inp.focus(); } catch (e) {} }
  }

  async function saveNewPassword() {
    if (!client) { setMsg(MSG_SIN_CONEXION, 'err'); return; }
    const inp = $('aula-newpass-input');
    const pw = inp ? inp.value : '';
    if (pw.length < 6) { setMsg('La contraseña debe tener al menos 6 caracteres.', 'err'); return; }
    setMsg('Guardando tu contraseña…', 'info');
    let res;
    try { res = await client.auth.updateUser({ password: pw }); }
    catch (err) { setMsg(mensajeAuth(err), 'err'); return; }
    if (res.error) { setMsg(mensajeAuth(res.error), 'err'); return; }
    if (inp) inp.value = '';
    $('aula-newpass').hidden = true;
    setMsg('Contraseña actualizada. Ya estás dentro del aula.', 'ok');
    // Deja leer la confirmación un instante y entra al aula.
    setTimeout(function () {
      recovering = false;
      show($('aula-login-form'), true);
      show($('aula-foot-mode'), true);
      show($('aula-foot-forgot'), true);
      setMsg('');
      refresh();
    }, 1600);
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
        // Al cambiar la sesión (login/logout/cambio de cuenta), la caché de
        // matrículas del usuario anterior deja de valer.
        if (window.enrollments && window.enrollments.invalidate) window.enrollments.invalidate();
        refresh();
      });
    }
    refresh();
  }

  window.auth = {
    init, refresh,
    loginWithGoogle, loginWithEmail, toggleMode, logout,
    forgotPassword, saveNewPassword, mensajeAuth,
    isConfigured: () => isConfigured,
    getClient: () => client
  };
})();
