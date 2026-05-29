/* =============================================================
 * PRECISSA INSTITUTE · API de reseñas de alumnas (testimonios)
 * -------------------------------------------------------------
 * Expone window.testimonials:
 *   · list()         lectura pública (la usa la home)
 *   · create/update/remove   solo admin (RLS lo impone en Supabase)
 *   · uploadPhoto(file)      sube la foto al bucket 'testimonials'
 *
 * Ver supabase/testimonials.sql para la tabla y las políticas.
 * ============================================================= */
(function () {
  const BUCKET = 'testimonials';

  function client() {
    if (!window.auth || !window.auth.getClient) return null;
    return window.auth.getClient();
  }
  function isConfigured() { return !!client(); }

  // Devuelve un array, o null si Supabase no está configurado / hay error
  // (en ese caso la home conserva las tarjetas estáticas de respaldo).
  async function list() {
    const c = client();
    if (!c) return null;
    const { data, error } = await c
      .from('testimonials')
      .select('id, quote, name, centro, photo_url, sort_order, created_at')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) { console.error('[testimonials] list', error); return null; }
    return data || [];
  }

  function clean(fields) {
    return {
      quote:      String(fields.quote || '').trim(),
      name:       String(fields.name || '').trim(),
      centro:     fields.centro ? String(fields.centro).trim() : null,
      photo_url:  fields.photo_url || null,
      sort_order: Number.isFinite(fields.sort_order) ? fields.sort_order : 0
    };
  }

  async function create(fields) {
    const c = client();
    if (!c) throw new Error('Supabase no inicializado.');
    const payload = clean(fields);
    if (!payload.quote || !payload.name) throw new Error('La frase y el nombre son obligatorios.');
    const { error } = await c.from('testimonials').insert(payload);
    if (error) throw error;
  }

  async function update(id, fields) {
    const c = client();
    if (!c) throw new Error('Supabase no inicializado.');
    if (!id) throw new Error('Falta el id de la reseña.');
    const payload = clean(fields);
    if (!payload.quote || !payload.name) throw new Error('La frase y el nombre son obligatorios.');
    const { error } = await c.from('testimonials').update(payload).eq('id', id);
    if (error) throw error;
  }

  async function remove(id) {
    const c = client();
    if (!c) throw new Error('Supabase no inicializado.');
    const { error } = await c.from('testimonials').delete().eq('id', id);
    if (error) throw error;
  }

  // Sube una foto al bucket público y devuelve su URL pública.
  async function uploadPhoto(file) {
    const c = client();
    if (!c) throw new Error('Supabase no inicializado.');
    if (!file) throw new Error('No hay archivo.');
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const path = 'r-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.' + ext;
    const { error } = await c.storage.from(BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || undefined
    });
    if (error) throw error;
    const { data } = c.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  window.testimonials = { isConfigured, list, create, update, remove, uploadPhoto };
})();
