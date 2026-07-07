/* =============================================================
 * PRECISSA INSTITUTE · API de administración (Supabase)
 * -------------------------------------------------------------
 * Expone window.admin con funciones para:
 *   · listar alumnas registradas (tabla profiles)
 *   · listar/editar matrículas (tabla enrollments)
 *   · saber si la sesión actual es admin
 *
 * La seguridad real la imponen las políticas RLS en Supabase
 * (ver supabase/setup.sql). Este JS solo es la capa cliente.
 * ============================================================= */
(function () {
  function client() {
    if (!window.auth || !window.auth.getClient) return null;
    return window.auth.getClient();
  }

  // Fuente única de la lista de admins: window.PRECISSA_ADMIN_EMAILS,
  // definida en index.html (sincroniza con public.is_admin() del SQL).
  // Se lee en tiempo de llamada porque este archivo carga antes que el
  // script inline que la define; el fallback solo cubre usos fuera de
  // index.html.
  const ADMIN_EMAILS_FALLBACK = [
    'carlosalbiachperez@gmail.com',
    'beautysecrets.betty@gmail.com',
    'precissainstitute@gmail.com'
  ];
  function adminEmails() {
    return window.PRECISSA_ADMIN_EMAILS || ADMIN_EMAILS_FALLBACK;
  }

  async function currentEmail() {
    const c = client();
    if (!c) return null;
    try {
      const { data: { user } } = await c.auth.getUser();
      return (user && user.email) ? user.email.toLowerCase().trim() : null;
    } catch (e) { return null; }
  }

  async function isAdmin() {
    const e = await currentEmail();
    return e ? adminEmails().includes(e) : false;
  }

  // ─── PROFILES ─────────────────────────────────────────────
  async function listAllUsers() {
    const c = client();
    if (!c) return [];
    const { data, error } = await c
      .from('profiles')
      .select('id, email, full_name, created_at')
      .order('created_at', { ascending: false });
    if (error) { console.error('[admin] listAllUsers', error); return []; }
    return data || [];
  }

  // ─── ENROLLMENTS ──────────────────────────────────────────
  async function listAllEnrollments() {
    const c = client();
    if (!c) return [];
    const { data, error } = await c
      .from('enrollments')
      .select('email, course_id, expires_at, updated_at');
    if (error) { console.error('[admin] listAllEnrollments', error); return []; }
    return data || [];
  }

  async function listEnrollmentsForEmail(email) {
    const c = client();
    if (!c) return [];
    const e = String(email || '').toLowerCase().trim();
    if (!e) return [];
    const { data, error } = await c
      .from('enrollments')
      .select('id, email, course_id, expires_at, granted_by, notes, created_at, updated_at')
      .eq('email', e);
    if (error) { console.error('[admin] listEnrollmentsForEmail', error); return []; }
    return data || [];
  }

  async function upsertEnrollment(email, courseId, expiresAt, notes) {
    const c = client();
    if (!c) throw new Error('Supabase no inicializado.');
    const grantedBy = await currentEmail();
    const e   = String(email || '').toLowerCase().trim();
    const cid = String(courseId).trim();
    if (!e || !cid) throw new Error('Email y curso son obligatorios.');
    const payload = {
      email: e,
      course_id: cid,
      expires_at: expiresAt || null,
      granted_by: grantedBy,
      notes: notes || null
    };
    const { error } = await c
      .from('enrollments')
      .upsert(payload, { onConflict: 'email,course_id' });
    if (error) throw error;
  }

  async function deleteEnrollment(email, courseId) {
    const c = client();
    if (!c) throw new Error('Supabase no inicializado.');
    const e   = String(email || '').toLowerCase().trim();
    const cid = String(courseId).trim();
    const { error } = await c
      .from('enrollments')
      .delete()
      .eq('email', e)
      .eq('course_id', cid);
    if (error) throw error;
  }

  window.admin = {
    isAdmin,
    currentEmail,
    listAllUsers,
    listAllEnrollments,
    listEnrollmentsForEmail,
    upsertEnrollment,
    deleteEnrollment
  };
})();
