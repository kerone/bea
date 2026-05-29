/* =============================================================
 * PRECISSA INSTITUTE · Matrículas (Supabase)
 * -------------------------------------------------------------
 * Fuente única: tabla `enrollments` de Supabase, gestionable
 * desde el panel /#admin de la web.
 *
 * canAccess(email, courseId) respeta caducidades: si la fila
 * tiene expires_at y ya pasó, el acceso queda revocado.
 * ============================================================= */
(function () {
  const CACHE_TTL_MS = 30_000;
  let cache = { rows: null, timestamp: 0 };

  function client() {
    if (!window.auth || !window.auth.getClient) return null;
    return window.auth.getClient();
  }

  async function fetchFromSupabase() {
    const c = client();
    if (!c) return [];
    try {
      const { data, error } = await c
        .from('enrollments')
        .select('email, course_id, expires_at');
      if (error) {
        console.warn('[enrollments] supabase error', error);
        return [];
      }
      return (data || []).map(r => ({
        email:      (r.email || '').toLowerCase(),
        curso:      r.course_id,
        expires_at: r.expires_at || null
      }));
    } catch (e) {
      console.warn('[enrollments] supabase fetch falló', e);
      return [];
    }
  }

  async function fetchRows() {
    const now = Date.now();
    if (cache.rows && (now - cache.timestamp) < CACHE_TTL_MS) return cache.rows;
    const rows = await fetchFromSupabase();
    cache = { rows, timestamp: now };
    return rows;
  }

  function isLive(row) {
    if (!row.expires_at) return true;
    return new Date(row.expires_at).getTime() > Date.now();
  }

  async function canAccess(email, courseId) {
    if (!email || !courseId) return false;
    const rows = await fetchRows();
    const e = email.toLowerCase().trim();
    const c = courseId.toLowerCase().trim();
    return rows.some(r => r.email === e && r.curso === c && isLive(r));
  }

  async function coursesForUser(email) {
    if (!email) return [];
    const rows = await fetchRows();
    const e = email.toLowerCase().trim();
    return rows.filter(r => r.email === e && isLive(r)).map(r => r.curso);
  }

  window.enrollments = {
    isConfigured: () => true,
    canAccess,
    coursesForUser,
    fetchRows,
    invalidate: () => { cache = { rows: null, timestamp: 0 }; }
  };
})();
