/* =============================================================
 * PRECISSA INSTITUTE · Matrículas (Supabase + fallback Sheets)
 * -------------------------------------------------------------
 * Fuente principal: tabla `enrollments` de Supabase
 *   (gestionable desde el panel /#admin de la web).
 *
 * Fallback: la antigua hoja de Google publicada como CSV. Solo
 * se usa si Supabase aún no está montada o devuelve vacío. Se
 * deja como red de seguridad durante la migración.
 *
 * canAccess(email, courseId) respeta caducidades: si la fila
 * tiene expires_at y ya pasó, el acceso queda revocado.
 * ============================================================= */
(function () {
  // ─── Fallback Google Sheets ────────────────────────────────
  const SHEET_ID  = '1iUHdVUImOKOKvloSZQx7MsIdxc4mdASqfCXSHxKLOUc';
  const SHEET_URL = SHEET_ID
    ? `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`
    : '';

  const CACHE_TTL_MS = 30_000;
  let cache = { rows: null, timestamp: 0 };

  function client() {
    if (!window.auth || !window.auth.getClient) return null;
    return window.auth.getClient();
  }

  // Filas normalizadas: { email, curso, expires_at|null }
  async function fetchFromSupabase() {
    const c = client();
    if (!c) return null;
    try {
      const { data, error } = await c
        .from('enrollments')
        .select('email, course_id, expires_at');
      if (error) {
        // 401/403/404 son normales si el SQL aún no se ha aplicado.
        if (String(error.code || '').match(/^(PGRST|42)/)) return null;
        throw error;
      }
      return (data || []).map(r => ({
        email:      (r.email || '').toLowerCase(),
        curso:      r.course_id,
        expires_at: r.expires_at || null
      }));
    } catch (e) {
      console.warn('[enrollments] supabase fetch fallo, usaré fallback Sheet', e);
      return null;
    }
  }

  function parseCSV(text) {
    const lines = text.replace(/\r/g, '').split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return [];
    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    const emailIdx = header.indexOf('email');
    const cursoIdx = header.indexOf('curso');
    if (emailIdx === -1 || cursoIdx === -1) return [];
    return lines.slice(1).map(line => {
      const cells = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      return {
        email:      (cells[emailIdx] || '').toLowerCase(),
        curso:      (cells[cursoIdx] || '').toLowerCase(),
        expires_at: null
      };
    }).filter(r => r.email && r.curso);
  }

  async function fetchFromSheet() {
    if (!SHEET_URL) return [];
    try {
      const res = await fetch(SHEET_URL, { cache: 'no-store' });
      if (!res.ok) return [];
      return parseCSV(await res.text());
    } catch (e) {
      console.error('[enrollments] no se pudo leer la hoja:', e);
      return [];
    }
  }

  async function fetchRows() {
    const now = Date.now();
    if (cache.rows && (now - cache.timestamp) < CACHE_TTL_MS) return cache.rows;
    const fromDb = await fetchFromSupabase();
    let rows;
    if (fromDb && fromDb.length > 0) {
      rows = fromDb;
    } else {
      rows = await fetchFromSheet();
    }
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
    isConfigured: () => true, // siempre activo: Supabase y/o Sheet
    canAccess,
    coursesForUser,
    fetchRows,
    invalidate: () => { cache = { rows: null, timestamp: 0 }; }
  };
})();
