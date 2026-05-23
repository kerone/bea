/* =============================================================
 * AUREA · Matrículas (Google Sheets)
 * -------------------------------------------------------------
 * Lee qué alumna tiene acceso a qué curso desde una hoja de
 * Google publicada como CSV. La hoja debe tener al menos dos
 * columnas con cabecera:
 *
 *     email   | curso
 *     -------- ---------------------------
 *     a@x.com | anatomia-fisiologia-cutanea
 *     b@x.com | anatomia-fisiologia-cutanea
 *
 * Una fila por (alumna, curso). El valor de `curso` debe ser
 * el `id` del curso definido en courses-data.js.
 *
 * La hoja debe estar compartida como "Cualquier persona con el
 * enlace · Lector". No hace falta "Publicar en la web".
 *
 * Si SHEET_URL queda vacía, la web funciona en modo legacy
 * (lee el campo `enrolledEmails` de courses-data.js).
 * ============================================================= */
(function () {
  const SHEET_ID = '1iUHdVUImOKOKvloSZQx7MsIdxc4mdASqfCXSHxKLOUc';
  // Endpoint CSV de Google. gid=0 = primera pestaña.
  const SHEET_URL = SHEET_ID
    ? `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`
    : '';

  // Caché en memoria (30s) para no hacer una petición por cada interacción.
  const CACHE_TTL_MS = 30_000;
  let cache = { rows: null, timestamp: 0 };

  function parseCSV(text) {
    const lines = text.replace(/\r/g, '').split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return [];
    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    const emailIdx = header.indexOf('email');
    const cursoIdx = header.indexOf('curso');
    if (emailIdx === -1 || cursoIdx === -1) {
      console.warn('[enrollments] La hoja debe tener columnas "email" y "curso" en la fila 1.');
      return [];
    }
    return lines.slice(1).map(line => {
      // Split básico: asume sin comas dentro de los campos (emails y slugs no llevan).
      const cells = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      return {
        email: (cells[emailIdx] || '').toLowerCase(),
        curso: (cells[cursoIdx] || '').toLowerCase()
      };
    }).filter(r => r.email && r.curso);
  }

  async function fetchRows() {
    if (!SHEET_URL) return [];
    const now = Date.now();
    if (cache.rows && (now - cache.timestamp) < CACHE_TTL_MS) return cache.rows;
    try {
      const res = await fetch(SHEET_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const text = await res.text();
      const rows = parseCSV(text);
      cache = { rows, timestamp: now };
      return rows;
    } catch (err) {
      console.error('[enrollments] No se pudo leer la hoja de matrículas:', err);
      return cache.rows || [];
    }
  }

  async function canAccess(email, courseId) {
    if (!email || !courseId) return false;
    const rows = await fetchRows();
    const e = email.toLowerCase().trim();
    const c = courseId.toLowerCase().trim();
    return rows.some(r => r.email === e && r.curso === c);
  }

  async function coursesForUser(email) {
    if (!email) return [];
    const rows = await fetchRows();
    const e = email.toLowerCase().trim();
    return rows.filter(r => r.email === e).map(r => r.curso);
  }

  window.enrollments = {
    isConfigured: () => Boolean(SHEET_URL),
    canAccess,
    coursesForUser,
    fetchRows,
    // Para tirar la caché manualmente (útil al añadir una matrícula y querer ver el efecto al instante)
    invalidate: () => { cache = { rows: null, timestamp: 0 }; }
  };
})();
