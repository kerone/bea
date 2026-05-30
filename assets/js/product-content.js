/* =============================================================
 * PRECISSA INSTITUTE · Tienda de aparatología (CRUD)
 * -------------------------------------------------------------
 * Expone window.productContent:
 *   · load()            lee la tabla products y cachea
 *   · getList()         lista de equipos de la BD (cacheada)
 *   · getById(id)
 *   · save(record)      crea o actualiza un equipo (solo admin)
 *   · remove(id)        borra un equipo de la BD (solo admin)
 *   · uploadImage(file) → URL pública de una foto
 *
 * La base del catálogo vive en products-data.js. Aquí solo se
 * guardan los equipos creados/editados. Ver supabase/products.sql.
 * Reutiliza el bucket 'course-media' (carpeta products/).
 * ============================================================= */
(function () {
  const BUCKET = 'course-media';
  let _list = [];
  let _loaded = false;

  function client() {
    if (!window.auth || !window.auth.getClient) return null;
    return window.auth.getClient();
  }
  function isConfigured() { return !!client(); }

  // Normaliza una fila de BD (snake_case) al shape del JS (camelCase).
  function rowToProduct(r) {
    return {
      id:                 r.id,
      name:               r.name || '',
      category:           r.category || '',
      eyebrow:            r.eyebrow || '',
      shortDescription:   r.short_description || '',
      description:        r.description || '',
      price:              r.price || '',
      priceNote:          r.price_note || '',
      relatedCourseId:    r.related_course_id || '',
      relatedCourseLabel: r.related_course_label || '',
      images:             Array.isArray(r.images) ? r.images : [],
      specs:              Array.isArray(r.specs) ? r.specs : [],
      hidden:             !!r.hidden,
      deleted:            !!r.deleted
    };
  }

  async function load() {
    const c = client();
    if (!c) { _list = []; _loaded = true; return _list; }
    const { data, error } = await c.from('products').select('*').order('sort', { ascending: true });
    if (error) { console.error('[productContent] load', error); _loaded = true; return _list; }
    _list = (data || []).map(rowToProduct);
    _loaded = true;
    return _list;
  }

  function getList()    { return _list; }
  function getById(id)  { return _list.find(p => p.id === id) || null; }
  function isLoaded()   { return _loaded; }

  // record: shape camelCase como en products-data.js. deleted opcional.
  async function save(record) {
    const c = client();
    if (!c) throw new Error('Supabase no inicializado.');
    const id = String(record.id || '').trim();
    if (!id) throw new Error('Falta el id del equipo.');
    const payload = {
      id: id,
      name:                 record.name || '',
      category:             record.category || '',
      eyebrow:              record.eyebrow || '',
      short_description:    record.shortDescription || '',
      description:          record.description || '',
      price:                record.price || '',
      price_note:           record.priceNote || '',
      related_course_id:    record.relatedCourseId || '',
      related_course_label: record.relatedCourseLabel || '',
      images:               Array.isArray(record.images) ? record.images : [],
      specs:                Array.isArray(record.specs) ? record.specs : [],
      hidden:               !!record.hidden,
      deleted:              !!record.deleted
    };
    if (typeof record.sort === 'number') payload.sort = record.sort;
    const { error } = await c.from('products').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
    await load();
  }

  async function remove(id) {
    const c = client();
    if (!c) throw new Error('Supabase no inicializado.');
    const { error } = await c.from('products').delete().eq('id', id);
    if (error) throw error;
    await load();
  }

  function safe(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40) || 'x'; }

  async function uploadImage(file, productId) {
    const c = client();
    if (!c) throw new Error('Supabase no inicializado.');
    if (!file) throw new Error('No hay archivo.');
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const path = 'products/' + safe(productId || 'p') + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.' + ext;
    const { error } = await c.storage.from(BUCKET).upload(path, file, {
      cacheControl: '3600', upsert: false, contentType: file.type || undefined
    });
    if (error) throw error;
    const { data } = c.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  window.productContent = {
    isConfigured, load, getList, getById, isLoaded,
    save, remove, uploadImage
  };
})();
