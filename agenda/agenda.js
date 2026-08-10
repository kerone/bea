/* =============================================================
 * PRECISSA INSTITUTE · Agenda interna
 * -------------------------------------------------------------
 * Fichas de clientas, agenda de citas e histórico de tratamientos.
 *
 * Seguridad: la app comprueba is_admin() contra Supabase (fuente de
 * verdad en servidor, la misma que usan las políticas RLS). Ocultar
 * la URL no protege nada; lo que protege es el login + RLS.
 * ============================================================= */
(function () {
  'use strict';

  const cfg = window.PRECISSA_SUPABASE_CONFIG || {};
  const db = (window.supabase && cfg.url && cfg.anonKey)
    ? window.supabase.createClient(cfg.url, cfg.anonKey)
    : null;

  // Datos del negocio para la confirmación de cita
  const NEGOCIO = {
    nombre: 'PRECISSA INSTITUTE',
    direccion: "C/ de la República de la Costa d'Ivori, 46017 València",
    telefono: '601 05 67 06'
  };

  const state = {
    vista: 'agenda',
    modo: 'dia',            // 'dia' | 'semana'
    fecha: hoy(),           // Date del día/semana mostrado
    clientas: [],
    tratamientos: [],
    citas: [],
    clientaAbierta: null,
    filtro: ''
  };

  // ─── Utilidades ──────────────────────────────────────────
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function hoy() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  function addDias(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function lunesDe(d) {
    const x = new Date(d);
    const diff = (x.getDay() + 6) % 7; // 0 = lunes
    x.setDate(x.getDate() - diff); x.setHours(0, 0, 0, 0); return x;
  }
  function mismaFecha(a, b) { return a.toDateString() === b.toDateString(); }
  const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
    'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  function fmtFechaLarga(d) {
    return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`;
  }
  function fmtHora(iso) {
    const d = new Date(iso);
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }
  function fmtFechaCorta(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  function fmtPrecio(v) {
    if (v === null || v === undefined || v === '') return '';
    return Number(v).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
  }
  /** Date + "HH:MM" → ISO en hora local (no UTC, para no desplazar citas). */
  function aISO(fechaStr, horaStr) {
    const [y, m, d] = fechaStr.split('-').map(Number);
    const [hh, mm] = horaStr.split(':').map(Number);
    return new Date(y, m - 1, d, hh, mm, 0, 0).toISOString();
  }
  function inputFecha(d) {
    const x = new Date(d);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  }
  function inputHora(iso) {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  function iniciales(c) {
    return ((c.nombre || '?')[0] + (c.apellidos ? c.apellidos[0] : '')).toUpperCase();
  }
  function nombreCompleto(c) {
    return [c.nombre, c.apellidos].filter(Boolean).join(' ');
  }

  let toastT;
  function toast(msg) {
    const t = $('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600);
  }

  // ─── Autenticación ───────────────────────────────────────
  async function comprobarSesion() {
    if (!db) {
      $('login-msg').textContent = 'Supabase no está configurado.';
      return;
    }
    const { data: { user } } = await db.auth.getUser();
    if (!user) return mostrarLogin();

    // is_admin() vive en el servidor y es la misma función que usan
    // las políticas RLS: si dice que no, aquí no se entra.
    const { data: esAdmin } = await db.rpc('is_admin');
    if (!esAdmin) {
      await db.auth.signOut();
      mostrarLogin('Esta cuenta no tiene permiso para acceder.');
      return;
    }
    $('user-chip').textContent = user.email;
    entrar();
  }

  function mostrarLogin(msg) {
    $('login-view').style.display = '';
    $('app').hidden = true;
    if (msg) $('login-msg').textContent = msg;
  }

  async function entrar() {
    $('login-view').style.display = 'none';
    $('app').hidden = false;
    await cargarTodo();
    render();
  }

  $('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('li-btn'); const msg = $('login-msg');
    msg.textContent = ''; btn.disabled = true; btn.textContent = 'Entrando…';
    const { error } = await db.auth.signInWithPassword({
      email: $('li-email').value.trim(),
      password: $('li-pass').value
    });
    btn.disabled = false; btn.textContent = 'Entrar';
    if (error) { msg.textContent = 'Email o contraseña incorrectos.'; return; }
    comprobarSesion();
  });

  $('li-google').addEventListener('click', async () => {
    const msg = $('login-msg');
    msg.style.color = 'var(--muted)';
    msg.textContent = 'Redirigiendo a Google…';
    const { error } = await db.auth.signInWithOAuth({
      provider: 'google',
      // Volver a la propia agenda, no a la home de la web
      options: { redirectTo: location.origin + '/agenda/' }
    });
    if (error) { msg.style.color = 'var(--danger)'; msg.textContent = error.message; }
  });

  $('logout-btn').addEventListener('click', async () => {
    await db.auth.signOut();
    location.reload();
  });

  // ─── Carga de datos ──────────────────────────────────────
  async function cargarTodo() {
    await Promise.all([cargarClientas(), cargarTratamientos()]);
    await cargarCitas();
  }
  async function cargarClientas() {
    const { data, error } = await db.from('clientas').select('*').order('nombre');
    if (error) { toast('No se pudieron cargar las clientas'); return; }
    state.clientas = data || [];
  }
  async function cargarTratamientos() {
    const { data, error } = await db.from('tratamientos').select('*')
      .order('orden').order('nombre');
    if (error) { toast('No se pudieron cargar los tratamientos'); return; }
    state.tratamientos = data || [];
  }
  /** Carga un margen amplio alrededor de la fecha vista, para movernos sin recargar. */
  async function cargarCitas() {
    const desde = addDias(lunesDe(state.fecha), -35);
    const hasta = addDias(lunesDe(state.fecha), 42);
    const { data, error } = await db.from('citas').select('*')
      .gte('inicio', desde.toISOString()).lt('inicio', hasta.toISOString())
      .order('inicio');
    if (error) { toast('No se pudieron cargar las citas'); return; }
    state.citas = data || [];
  }
  const clientaDe = (id) => state.clientas.find(c => c.id === id);

  // ─── Navegación entre vistas ─────────────────────────────
  function irA(vista) {
    state.vista = vista;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    $('view-' + vista).classList.add('active');
    document.querySelectorAll('#tabs .tab').forEach(t =>
      t.classList.toggle('active', t.dataset.view === vista));
    document.querySelectorAll('#bottomnav button').forEach(b =>
      b.classList.toggle('active', b.dataset.view === vista));
    $('fab').style.display = (vista === 'agenda' || vista === 'clientas') ? '' : 'none';
    window.scrollTo(0, 0);
    render();
  }
  document.querySelectorAll('#tabs .tab, #bottomnav button').forEach(b =>
    b.addEventListener('click', () => irA(b.dataset.view)));
  $('ficha-back').addEventListener('click', () => irA('clientas'));

  // ─── Render principal ────────────────────────────────────
  function render() {
    if (state.vista === 'agenda') renderAgenda();
    if (state.vista === 'clientas') renderClientas();
    if (state.vista === 'ficha') renderFicha();
    if (state.vista === 'ajustes') renderAjustes();
  }

  // ─── AGENDA ──────────────────────────────────────────────
  function citasDe(dia) {
    return state.citas
      .filter(c => mismaFecha(new Date(c.inicio), dia))
      .sort((a, b) => new Date(a.inicio) - new Date(b.inicio));
  }

  function renderAgenda() {
    const esSemana = state.modo === 'semana';
    if (esSemana) {
      const l = lunesDe(state.fecha), d = addDias(l, 6);
      $('date-label').textContent = `${l.getDate()} – ${d.getDate()} de ${MESES[d.getMonth()]}`;
      $('date-sub').textContent = d.getFullYear();
    } else {
      $('date-label').textContent = fmtFechaLarga(state.fecha);
      $('date-sub').textContent = mismaFecha(state.fecha, hoy())
        ? 'Hoy' : state.fecha.getFullYear();
    }
    $('agenda-body').innerHTML = esSemana ? htmlSemana() : htmlDia();
    enlazarCitas();
  }

  function htmlDia() {
    const citas = citasDe(state.fecha);
    if (!citas.length) {
      return `<div class="empty">No hay citas este día.<br>Pulsa el botón + para añadir una.</div>`;
    }
    const total = citas.filter(c => c.estado !== 'cancelada')
      .reduce((s, c) => s + (Number(c.precio) || 0), 0);
    return citas.map(htmlCita).join('') + (total > 0
      ? `<div style="text-align:right;color:var(--muted);font-size:13.5px;margin-top:10px">
           Previsto del día: <strong style="color:var(--ink)">${fmtPrecio(total)}</strong></div>` : '');
  }

  function htmlCita(c) {
    const cl = clientaDe(c.clienta_id);
    const fin = new Date(new Date(c.inicio).getTime() + (c.duracion_min || 60) * 60000);
    return `
      <article class="cita estado-${c.estado}" data-cita="${c.id}">
        <div class="cita-bar"></div>
        <div class="cita-hora">${fmtHora(c.inicio)}<small>${c.duracion_min} min</small></div>
        <div class="cita-body">
          <div class="cita-nombre">${esc(cl ? nombreCompleto(cl) : 'Clienta eliminada')}</div>
          <div class="cita-trat">${esc(c.tratamiento || 'Sin tratamiento')}</div>
          <div class="cita-meta">
            hasta ${fmtHora(fin)}${c.precio ? ' · ' + fmtPrecio(c.precio) : ''}
            ${c.estado !== 'programada' ? ` · <span class="badge badge-${c.estado}">${etiquetaEstado(c.estado)}</span>` : ''}
          </div>
        </div>
      </article>`;
  }

  function htmlSemana() {
    const l = lunesDe(state.fecha);
    let out = '<div class="week">';
    for (let i = 0; i < 7; i++) {
      const d = addDias(l, i);
      const citas = citasDe(d);
      const esHoy = mismaFecha(d, hoy());
      out += `<div class="week-col${esHoy ? ' is-today' : ''}">
        <h3>${DIAS[d.getDay()].slice(0, 3)} ${d.getDate()}</h3>
        ${citas.length ? citas.map(c => {
          const cl = clientaDe(c.clienta_id);
          return `<div class="wcita" data-cita="${c.id}" style="border-left-color:${c.estado === 'cancelada' ? 'var(--muted)' : 'var(--accent)'}">
            <b>${fmtHora(c.inicio)}</b>
            <span>${esc(cl ? cl.nombre : '—')}</span>
          </div>`;
        }).join('') : '<div style="font-size:12px;color:var(--muted)">—</div>'}
      </div>`;
    }
    return out + '</div>';
  }

  function etiquetaEstado(e) {
    return { programada: 'Programada', completada: 'Completada', cancelada: 'Cancelada', no_asistio: 'No asistió' }[e] || e;
  }

  function enlazarCitas() {
    document.querySelectorAll('[data-cita]').forEach(el =>
      el.addEventListener('click', () => abrirCita(el.dataset.cita)));
  }

  $('prev-btn').addEventListener('click', () => moverFecha(-1));
  $('next-btn').addEventListener('click', () => moverFecha(1));
  $('today-btn').addEventListener('click', async () => {
    state.fecha = hoy(); await cargarCitas(); renderAgenda();
  });
  async function moverFecha(dir) {
    state.fecha = addDias(state.fecha, state.modo === 'semana' ? 7 * dir : dir);
    await cargarCitas();
    renderAgenda();
  }
  document.querySelectorAll('#mode-seg button').forEach(b =>
    b.addEventListener('click', () => {
      state.modo = b.dataset.mode;
      document.querySelectorAll('#mode-seg button').forEach(x =>
        x.classList.toggle('active', x === b));
      renderAgenda();
    }));

  // ─── CLIENTAS ────────────────────────────────────────────
  function renderClientas() {
    const q = state.filtro.toLowerCase().trim();
    const lista = state.clientas.filter(c => !q ||
      nombreCompleto(c).toLowerCase().includes(q) ||
      (c.telefono || '').includes(q) ||
      (c.email || '').toLowerCase().includes(q));
    $('clientas-body').innerHTML = lista.length
      ? lista.map(c => `
        <div class="row" data-clienta="${c.id}">
          <div class="avatar">${esc(iniciales(c))}</div>
          <div class="row-body">
            <b>${esc(nombreCompleto(c))}</b>
            <span>${esc(c.telefono || c.email || 'Sin contacto')}</span>
          </div>
          ${c.contraindicaciones ? '<span title="Tiene contraindicaciones anotadas">⚠️</span>' : ''}
        </div>`).join('')
      : `<div class="empty">${q ? 'Ninguna clienta coincide con la búsqueda.' : 'Aún no hay clientas. Pulsa + para dar de alta la primera.'}</div>`;
    document.querySelectorAll('[data-clienta]').forEach(el =>
      el.addEventListener('click', () => { state.clientaAbierta = el.dataset.clienta; irA('ficha'); }));
  }
  $('cli-search').addEventListener('input', (e) => { state.filtro = e.target.value; renderClientas(); });

  // ─── FICHA ───────────────────────────────────────────────
  async function renderFicha() {
    const c = clientaDe(state.clientaAbierta);
    if (!c) { irA('clientas'); return; }

    // El histórico completo se pide aparte: puede ir más atrás que la agenda cargada
    const { data: hist } = await db.from('citas').select('*')
      .eq('clienta_id', c.id).order('inicio', { ascending: false });
    const historico = hist || [];
    const gastado = historico.filter(x => x.estado === 'completada')
      .reduce((s, x) => s + (Number(x.precio) || 0), 0);

    $('ficha-body').innerHTML = `
      <div class="view-head">
        <div>
          <div class="eyebrow">Ficha de clienta</div>
          <h1>${esc(nombreCompleto(c))}</h1>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-outline btn-sm" id="editar-cli">Editar</button>
          <button class="btn btn-dark btn-sm" id="cita-para-cli">Nueva cita</button>
        </div>
      </div>

      ${c.contraindicaciones ? `
        <div class="alerta" style="margin-bottom:14px">
          <b>⚠️ Contraindicaciones y alergias</b>${esc(c.contraindicaciones)}
        </div>` : ''}

      <div class="card">
        <h2>Datos</h2>
        <dl class="kv">
          <dt>Teléfono</dt><dd>${c.telefono ? `<a href="tel:${esc(c.telefono)}">${esc(c.telefono)}</a>` : '—'}</dd>
          <dt>Email</dt><dd>${esc(c.email || '—')}</dd>
          <dt>Nacimiento</dt><dd>${c.fecha_nacimiento ? fmtFechaCorta(c.fecha_nacimiento) : '—'}</dd>
          <dt>Notas</dt><dd>${esc(c.notas || '—')}</dd>
          <dt>Alta</dt><dd>${fmtFechaCorta(c.created_at)}</dd>
        </dl>
      </div>

      <div class="card">
        <h2>Histórico de tratamientos</h2>
        <p style="font-size:13px;color:var(--muted);margin-bottom:12px">
          ${historico.length} cita${historico.length === 1 ? '' : 's'}${gastado > 0 ? ` · ${fmtPrecio(gastado)} facturado` : ''}
        </p>
        ${historico.length ? historico.map(h => `
          <div class="cita estado-${h.estado}" data-cita="${h.id}" style="margin-bottom:8px">
            <div class="cita-bar"></div>
            <div class="cita-hora" style="min-width:88px;font-size:15px">
              ${fmtFechaCorta(h.inicio)}<small>${fmtHora(h.inicio)}</small>
            </div>
            <div class="cita-body">
              <div class="cita-nombre">${esc(h.tratamiento || 'Sin tratamiento')}</div>
              ${h.notas ? `<div class="cita-trat">${esc(h.notas)}</div>` : ''}
              <div class="cita-meta">
                ${h.precio ? fmtPrecio(h.precio) + ' · ' : ''}
                <span class="badge badge-${h.estado}">${etiquetaEstado(h.estado)}</span>
              </div>
            </div>
          </div>`).join('')
          : '<div class="empty">Todavía no tiene tratamientos registrados.</div>'}
      </div>`;

    $('editar-cli').addEventListener('click', () => modalClienta(c));
    $('cita-para-cli').addEventListener('click', () => modalCita(null, c.id));
    enlazarCitas();
  }

  // ─── TRATAMIENTOS ────────────────────────────────────────
  function renderAjustes() {
    $('ajustes-body').innerHTML = state.tratamientos.length
      ? state.tratamientos.map(t => `
        <div class="row" data-trat="${t.id}">
          <div style="width:10px;height:38px;border-radius:5px;background:${esc(t.color)};flex-shrink:0"></div>
          <div class="row-body">
            <b>${esc(t.nombre)}</b>
            <span>${t.duracion_min} min${t.precio !== null ? ' · ' + fmtPrecio(t.precio) : ' · sin precio'}${t.activo ? '' : ' · inactivo'}</span>
          </div>
        </div>`).join('')
      : '<div class="empty">No hay tratamientos en el catálogo.</div>';
    document.querySelectorAll('[data-trat]').forEach(el =>
      el.addEventListener('click', () =>
        modalTratamiento(state.tratamientos.find(t => t.id === el.dataset.trat))));
  }
  $('nuevo-trat-btn').addEventListener('click', () => modalTratamiento(null));

  // ─── MODAL ───────────────────────────────────────────────
  function abrirModal(titulo, html) {
    $('modal-title').textContent = titulo;
    $('modal-body').innerHTML = html;
    $('modal').classList.add('open');
  }
  function cerrarModal() { $('modal').classList.remove('open'); }
  $('modal-close').addEventListener('click', cerrarModal);
  $('modal').addEventListener('click', (e) => { if (e.target === $('modal')) cerrarModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrarModal(); });

  // ─── Modal: CITA ─────────────────────────────────────────
  function abrirCita(id) {
    const c = state.citas.find(x => x.id === id);
    if (c) modalCita(c);
    else { // viene del histórico de la ficha, fuera del rango cargado
      db.from('citas').select('*').eq('id', id).single()
        .then(({ data }) => { if (data) modalCita(data); });
    }
  }

  function modalCita(cita, clientaIdPre) {
    const esNueva = !cita;
    const cid = cita ? cita.clienta_id : (clientaIdPre || '');
    const fecha = cita ? inputFecha(new Date(cita.inicio)) : inputFecha(state.fecha);
    const hora = cita ? inputHora(cita.inicio) : '10:00';

    abrirModal(esNueva ? 'Nueva cita' : 'Cita', `
      <div class="field">
        <label for="f-clienta">Clienta *</label>
        <select id="f-clienta" required>
          <option value="">— Elige una clienta —</option>
          ${state.clientas.map(c => `<option value="${c.id}"${c.id === cid ? ' selected' : ''}>${esc(nombreCompleto(c))}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label for="f-trat">Tratamiento</label>
        <select id="f-trat">
          <option value="">— Sin especificar —</option>
          ${state.tratamientos.filter(t => t.activo).map(t =>
            `<option value="${t.id}"${cita && cita.tratamiento_id === t.id ? ' selected' : ''}>${esc(t.nombre)}</option>`).join('')}
        </select>
      </div>
      <div class="field-row">
        <div class="field"><label for="f-fecha">Fecha *</label><input type="date" id="f-fecha" value="${fecha}" required></div>
        <div class="field"><label for="f-hora">Hora *</label><input type="time" id="f-hora" value="${hora}" step="300" required></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="f-dur">Duración (min)</label><input type="number" id="f-dur" min="5" step="5" value="${cita ? cita.duracion_min : 60}"></div>
        <div class="field"><label for="f-precio">Precio (€)</label><input type="number" id="f-precio" min="0" step="0.01" value="${cita && cita.precio !== null ? cita.precio : ''}"></div>
      </div>
      ${!esNueva ? `
      <div class="field">
        <label for="f-estado">Estado</label>
        <select id="f-estado">
          ${['programada', 'completada', 'cancelada', 'no_asistio'].map(e =>
            `<option value="${e}"${cita.estado === e ? ' selected' : ''}>${etiquetaEstado(e)}</option>`).join('')}
        </select>
      </div>` : ''}
      <div class="field">
        <label for="f-notas">Notas de la sesión</label>
        <textarea id="f-notas" placeholder="Parámetros usados, incidencias, evolución…">${esc(cita ? cita.notas || '' : '')}</textarea>
      </div>
      <div class="modal-actions">
        <button class="btn btn-dark" id="f-guardar">Guardar</button>
        ${!esNueva ? '<button class="btn btn-outline" id="f-wa">Enviar por WhatsApp</button>' : ''}
        ${!esNueva ? '<button class="btn btn-danger" id="f-borrar">Eliminar</button>' : ''}
      </div>`);

    // Al elegir tratamiento, rellenar duración y precio por defecto
    $('f-trat').addEventListener('change', () => {
      const t = state.tratamientos.find(x => x.id === $('f-trat').value);
      if (!t) return;
      $('f-dur').value = t.duracion_min;
      if (t.precio !== null && !$('f-precio').value) $('f-precio').value = t.precio;
    });

    $('f-guardar').addEventListener('click', async () => {
      const clientaId = $('f-clienta').value;
      if (!clientaId) return toast('Elige una clienta');
      if (!$('f-fecha').value || !$('f-hora').value) return toast('Falta la fecha o la hora');
      const t = state.tratamientos.find(x => x.id === $('f-trat').value);
      const payload = {
        clienta_id: clientaId,
        tratamiento_id: t ? t.id : null,
        tratamiento: t ? t.nombre : null,
        inicio: aISO($('f-fecha').value, $('f-hora').value),
        duracion_min: Number($('f-dur').value) || 60,
        precio: $('f-precio').value === '' ? null : Number($('f-precio').value),
        notas: $('f-notas').value.trim() || null
      };
      if (!esNueva) payload.estado = $('f-estado').value;

      const q = esNueva
        ? db.from('citas').insert(payload)
        : db.from('citas').update(payload).eq('id', cita.id);
      const { error } = await q;
      if (error) { toast('No se pudo guardar: ' + error.message); return; }
      cerrarModal();
      await cargarCitas();
      render();
      toast(esNueva ? 'Cita creada' : 'Cita actualizada');
    });

    if (!esNueva) {
      $('f-wa').addEventListener('click', () => enviarWhatsApp(cita));
      $('f-borrar').addEventListener('click', async () => {
        if (!confirm('¿Eliminar esta cita? No se puede deshacer.\n\nSi la clienta ha avisado de que no viene, es mejor marcarla como "Cancelada": así queda constancia en su histórico.')) return;
        const { error } = await db.from('citas').delete().eq('id', cita.id);
        if (error) { toast('No se pudo eliminar'); return; }
        cerrarModal(); await cargarCitas(); render(); toast('Cita eliminada');
      });
    }
  }

  // ─── Modal: CLIENTA ──────────────────────────────────────
  function modalClienta(cl) {
    const esNueva = !cl;
    abrirModal(esNueva ? 'Nueva clienta' : 'Editar ficha', `
      <div class="field-row">
        <div class="field"><label for="c-nombre">Nombre *</label><input id="c-nombre" value="${esc(cl ? cl.nombre : '')}" required></div>
        <div class="field"><label for="c-apellidos">Apellidos</label><input id="c-apellidos" value="${esc(cl ? cl.apellidos || '' : '')}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="c-tel">Teléfono</label><input id="c-tel" type="tel" value="${esc(cl ? cl.telefono || '' : '')}"></div>
        <div class="field"><label for="c-nac">Nacimiento</label><input id="c-nac" type="date" value="${cl && cl.fecha_nacimiento ? cl.fecha_nacimiento : ''}"></div>
      </div>
      <div class="field"><label for="c-email">Email</label><input id="c-email" type="email" value="${esc(cl ? cl.email || '' : '')}"></div>
      <div class="field">
        <label for="c-contra">Contraindicaciones, alergias y medicación</label>
        <textarea id="c-contra" placeholder="Embarazo, marcapasos, fotosensibilizantes, alergias, fototipo…">${esc(cl ? cl.contraindicaciones || '' : '')}</textarea>
        <p style="font-size:11.5px;color:var(--muted);margin-top:5px">
          Son datos de salud: anota solo lo necesario para tratarla con seguridad.
        </p>
      </div>
      <div class="field">
        <label for="c-notas">Notas</label>
        <textarea id="c-notas" placeholder="Preferencias, cómo llegó al centro…">${esc(cl ? cl.notas || '' : '')}</textarea>
      </div>
      <div class="modal-actions">
        <button class="btn btn-dark" id="c-guardar">Guardar</button>
        ${!esNueva ? '<button class="btn btn-danger" id="c-borrar">Eliminar ficha</button>' : ''}
      </div>`);

    $('c-guardar').addEventListener('click', async () => {
      const nombre = $('c-nombre').value.trim();
      if (!nombre) return toast('El nombre es obligatorio');
      const payload = {
        nombre,
        apellidos: $('c-apellidos').value.trim() || null,
        telefono: $('c-tel').value.trim() || null,
        email: $('c-email').value.trim() || null,
        fecha_nacimiento: $('c-nac').value || null,
        contraindicaciones: $('c-contra').value.trim() || null,
        notas: $('c-notas').value.trim() || null
      };
      const q = esNueva
        ? db.from('clientas').insert(payload).select().single()
        : db.from('clientas').update(payload).eq('id', cl.id).select().single();
      const { data, error } = await q;
      if (error) { toast('No se pudo guardar: ' + error.message); return; }
      cerrarModal();
      await cargarClientas();
      if (esNueva) { state.clientaAbierta = data.id; irA('ficha'); }
      else render();
      toast(esNueva ? 'Clienta dada de alta' : 'Ficha actualizada');
    });

    if (!esNueva) {
      $('c-borrar').addEventListener('click', async () => {
        if (!confirm(`¿Eliminar la ficha de ${nombreCompleto(cl)}?\n\nSe borrarán también TODAS sus citas y su histórico. Esta acción no se puede deshacer.`)) return;
        const { error } = await db.from('clientas').delete().eq('id', cl.id);
        if (error) { toast('No se pudo eliminar'); return; }
        cerrarModal(); await cargarTodo(); irA('clientas'); toast('Ficha eliminada');
      });
    }
  }

  // ─── Modal: TRATAMIENTO ──────────────────────────────────
  function modalTratamiento(t) {
    const esNuevo = !t;
    abrirModal(esNuevo ? 'Nuevo tratamiento' : 'Editar tratamiento', `
      <div class="field"><label for="t-nombre">Nombre *</label><input id="t-nombre" value="${esc(t ? t.nombre : '')}" required></div>
      <div class="field-row">
        <div class="field"><label for="t-dur">Duración (min)</label><input id="t-dur" type="number" min="5" step="5" value="${t ? t.duracion_min : 60}"></div>
        <div class="field"><label for="t-precio">Precio (€)</label><input id="t-precio" type="number" min="0" step="0.01" value="${t && t.precio !== null ? t.precio : ''}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="t-color">Color</label><input id="t-color" type="color" value="${t ? t.color : '#A86B4E'}" style="height:44px;padding:4px"></div>
        <div class="field"><label for="t-activo">Estado</label>
          <select id="t-activo">
            <option value="1"${!t || t.activo ? ' selected' : ''}>Activo</option>
            <option value="0"${t && !t.activo ? ' selected' : ''}>Inactivo</option>
          </select>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-dark" id="t-guardar">Guardar</button>
        ${!esNuevo ? '<button class="btn btn-danger" id="t-borrar">Eliminar</button>' : ''}
      </div>`);

    $('t-guardar').addEventListener('click', async () => {
      const nombre = $('t-nombre').value.trim();
      if (!nombre) return toast('El nombre es obligatorio');
      const payload = {
        nombre,
        duracion_min: Number($('t-dur').value) || 60,
        precio: $('t-precio').value === '' ? null : Number($('t-precio').value),
        color: $('t-color').value,
        activo: $('t-activo').value === '1'
      };
      const q = esNuevo
        ? db.from('tratamientos').insert(payload)
        : db.from('tratamientos').update(payload).eq('id', t.id);
      const { error } = await q;
      if (error) { toast('No se pudo guardar'); return; }
      cerrarModal(); await cargarTratamientos(); render(); toast('Guardado');
    });

    if (!esNuevo) {
      $('t-borrar').addEventListener('click', async () => {
        if (!confirm('¿Eliminar este tratamiento del catálogo?\n\nLas citas antiguas conservan su nombre y precio, no se pierde histórico.')) return;
        const { error } = await db.from('tratamientos').delete().eq('id', t.id);
        if (error) { toast('No se pudo eliminar'); return; }
        cerrarModal(); await cargarTratamientos(); render(); toast('Eliminado');
      });
    }
  }

  // ─── Confirmación por WhatsApp con "añadir a mi calendario" ──
  function enviarWhatsApp(cita) {
    const cl = clientaDe(cita.clienta_id);
    if (!cl) return toast('Clienta no encontrada');
    if (!cl.telefono) return toast('Esta clienta no tiene teléfono en su ficha');

    const inicio = new Date(cita.inicio);
    // El enlace solo lleva fecha, hora y duración: NO viaja el tratamiento
    // ni ningún dato de salud en la URL.
    const params = new URLSearchParams({
      i: String(Math.floor(inicio.getTime() / 1000)),
      d: String(cita.duracion_min || 60)
    });
    const enlace = `${location.origin}/agenda/cita/?${params}`;

    const texto =
      `Hola ${cl.nombre}, te confirmo tu cita en ${NEGOCIO.nombre}:\n\n` +
      `📅 ${fmtFechaLarga(inicio)}\n` +
      `🕐 ${fmtHora(cita.inicio)}\n` +
      `📍 ${NEGOCIO.direccion}\n\n` +
      `Añádela a tu calendario aquí:\n${enlace}\n\n` +
      `Si necesitas cambiarla, avísame. ¡Nos vemos!`;

    const tel = cl.telefono.replace(/[^\d]/g, '');
    const numero = tel.length === 9 ? '34' + tel : tel;
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(texto)}`, '_blank');
  }

  // ─── Botón flotante ──────────────────────────────────────
  $('fab').addEventListener('click', () => {
    if (state.vista === 'clientas') modalClienta(null);
    else modalCita(null);
  });

  // ─── Arranque ────────────────────────────────────────────
  comprobarSesion();
})();
