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
    filtro: '',
    plantillas: [],
    ajustesTab: 'tratamientos',
    citasError: false,
    fichaFiltro: null,
    profesionales: [],
    // Con UNA sola profesional activa, todo se asigna a ella sin preguntar.
    profesionalActivo: null
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
    const { data: esAdmin, error: eAdmin } = await db.rpc('is_admin');
    if (eAdmin) {
      // Fallo de RED, no de permisos: no destruir la sesión ni acusar
      // a la cuenta. Se reintenta recargando.
      mostrarLogin('No se ha podido comprobar el acceso. Revisa la conexión y recarga.');
      return;
    }
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
    await Promise.all([cargarClientas(), cargarTratamientos(), cargarPlantillas(), cargarProfesionales(), cargarHorario()]);
    await cargarCitas();
  }
  async function cargarProfesionales() {
    // Tolerante: si aún no se ha ejecutado agenda-profesionales.sql, la
    // app funciona igual que antes, sin el concepto de profesional.
    const { data, error } = await db.from('profesionales')
      .select('*').order('orden').order('nombre');
    if (error) { state.profesionales = []; state.profesionalActivo = null; return; }
    state.profesionales = data || [];
    const activos = state.profesionales.filter(p => p.activo);
    state.profesionalActivo = activos.length === 1 ? activos[0].id : null;
  }
  const profesionalDe = (id) => state.profesionales.find(p => p.id === id);
  async function cargarPlantillas() {
    const { data, error } = await db.from('consentimiento_plantillas')
      .select('*').order('nombre');
    // Si aún no se ha ejecutado agenda-consentimientos.sql, la app sigue
    // funcionando sin la parte de firmas.
    if (error) { state.plantillas = []; return; }
    state.plantillas = data || [];
  }
  async function cargarClientas() {
    const { data, error } = await db.from('clientas').select('*').order('nombre');
    if (error) { toast('No se pudieron cargar los clientes'); return; }
    state.clientas = data || [];
  }
  async function cargarTratamientos() {
    const { data, error } = await db.from('tratamientos').select('*')
      .order('orden').order('nombre');
    if (error) { toast('No se pudieron cargar los tratamientos'); return; }
    state.tratamientos = data || [];
  }
  /** Rango de fechas que la vista actual necesita tener cargado. */
  function rangoMostrado() {
    if (state.modo === 'mes') {
      // La cuadrícula del mes puede enseñar hasta 6 semanas: desde el
      // lunes anterior al día 1 hasta el domingo posterior al último día.
      const primero = new Date(state.fecha.getFullYear(), state.fecha.getMonth(), 1);
      const ultimo = new Date(state.fecha.getFullYear(), state.fecha.getMonth() + 1, 0);
      return { desde: lunesDe(primero), hasta: addDias(lunesDe(ultimo), 7) };
    }
    const l = lunesDe(state.fecha);
    return { desde: addDias(l, -7), hasta: addDias(l, 14) };
  }

  /** Carga el rango de la vista con margen de ±14 días. */
  async function cargarCitas() {
    const r = rangoMostrado();
    const desde = addDias(r.desde, -14);
    const hasta = addDias(r.hasta, 14);
    const { data, error } = await db.from('citas').select('*')
      .gte('inicio', desde.toISOString()).lt('inicio', hasta.toISOString())
      .order('inicio');
    if (error) {
      // Distinguir "no hay citas" de "no se pudo comprobar": con datos
      // rancios la agenda parecería libre y se daría hora encima.
      state.citasError = true;
      return;
    }
    state.citasError = false;
    state.citas = data || [];
    actualizarCampana(); // sin await: el globito no frena el pintado
    pintarEnCabina();    // ídem: la barra de tratamientos sin finalizar
  }

  /** Barra fija con TODOS los tratamientos en cabina, de cualquier día:
   *  imposible dejar una sesión sin finalizar sin darse cuenta. No
   *  bloquea: la agenda sigue libre para consultar o modificar citas. */
  async function pintarEnCabina() {
    const cont = $('encabina');
    if (!cont) return;
    const { data, error } = await db.from('citas')
      .select('id, clienta_id, tratamiento, inicio')
      .eq('estado', 'en_curso').order('inicio');
    if (error) return; // sin conexión: la barra se queda como estaba
    const lista = data || [];
    if (!lista.length) { cont.hidden = true; cont.innerHTML = ''; return; }
    cont.hidden = false;
    cont.innerHTML = lista.map(c => {
      const olvidada = !mismaFecha(new Date(c.inicio), hoy());
      const cl = clientaDe(c.clienta_id);
      return `<button type="button" class="cabina-item${olvidada ? ' cabina-olvidada' : ''}" data-cabina="${c.id}">
        <i></i>
        <span><b>${esc(cl ? nombreCompleto(cl) : '—')}</b> · ${esc(c.tratamiento || 'sin tratamiento')} ·
          en cabina desde las ${fmtHora(c.inicio)}${olvidada ? ` del ${fmtFechaCorta(c.inicio)} · SIN FINALIZAR` : ''}</span>
        <em>Abrir</em>
      </button>`;
    }).join('');
    cont.querySelectorAll('[data-cabina]').forEach(b =>
      b.addEventListener('click', () => abrirCita(b.dataset.cabina)));
  }
  const clientaDe = (id) => state.clientas.find(c => c.id === id);
  const clienteNombre = (id) => { const c = clientaDe(id); return c ? nombreCompleto(c) : 'otro cliente'; };

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
    pararLineaAhora();
    const esSemana = state.modo === 'semana';
    const esMes = state.modo === 'mes';
    if (esMes) {
      $('date-label').textContent = `${MESES[state.fecha.getMonth()]} ${state.fecha.getFullYear()}`;
      $('date-sub').textContent = '';
    } else if (esSemana) {
      const l = lunesDe(state.fecha), d = addDias(l, 4); // L–V
      $('date-label').textContent = `${l.getDate()} – ${d.getDate()} de ${MESES[d.getMonth()]}`;
      $('date-sub').textContent = d.getFullYear();
    } else {
      $('date-label').textContent = fmtFechaLarga(state.fecha);
      $('date-sub').textContent = mismaFecha(state.fecha, hoy())
        ? 'Hoy' : state.fecha.getFullYear();
    }
    if (state.citasError) {
      $('agenda-body').innerHTML = `
        <div class="empty">No se han podido cargar las citas.<br>
          <button class="btn btn-outline btn-sm" id="citas-reintentar" style="margin-top:10px">Reintentar</button>
        </div>`;
      $('citas-reintentar').addEventListener('click', async () => {
        await cargarCitas(); renderAgenda();
      });
      return;
    }
    const comoLista = localStorage.getItem('agendaLista') === '1';
    if (esMes) {
      $('agenda-body').innerHTML = htmlMes();
    } else if (esSemana) {
      const l = lunesDe(state.fecha);
      const dias = [0, 1, 2, 3, 4].map(i => addDias(l, i));
      // El finde solo aparece si tiene citas: una cita aceptada en sábado
      // JAMÁS puede quedar invisible.
      [5, 6].forEach(i => { const d = addDias(l, i); if (citasDe(d).length) dias.push(d); });
      $('agenda-body').innerHTML = htmlRejilla(dias, true) + piePrevisto(dias);
      // En móvil, arrancar la semana en HOY, no en lunes
      const sc = document.querySelector('#agenda-body .rej-scroll');
      if (sc) {
        const idx = dias.findIndex(d => mismaFecha(d, hoy()));
        if (idx > 0 && sc.children[idx]) {
          sc.scrollLeft = sc.children[idx].offsetLeft - sc.children[0].offsetLeft;
        }
      }
    } else if (comoLista) {
      $('agenda-body').innerHTML = htmlDia() +
        `<div class="rej-pie"><span></span><a data-toggle-lista>Ver como rejilla</a></div>`;
    } else {
      const activos = state.profesionales.filter(p => p.activo);
      $('agenda-body').innerHTML = (activos.length > 1
        ? htmlRejillaProfesionales(state.fecha, activos)
        : htmlRejilla([state.fecha], false)) + piePrevisto([state.fecha]);
    }
    arrancarLineaAhora();
  }

  function piePrevisto(dias) {
    const total = dias.flatMap(d => citasDe(d))
      .filter(c => c.estado !== 'cancelada' && c.estado !== 'no_asistio')
      .reduce((s, c) => s + (Number(c.precio) || 0), 0);
    const modo = state.modo === 'dia'
      ? `<a data-toggle-lista>Ver como lista</a>` : '<span></span>';
    return `<div class="rej-pie">${modo}${total > 0
      ? `<span>Previsto: <strong style="color:var(--ink)">${fmtPrecio(total)}</strong></span>` : '<span></span>'}</div>`;
  }

  function htmlDia() {
    const citas = citasDe(state.fecha);
    if (!citas.length) {
      return `<div class="empty">No hay citas este día.<br>Pulsa el botón + para añadir una.</div>`;
    }
    const total = citas.filter(c => c.estado !== 'cancelada' && c.estado !== 'no_asistio')
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
          <div class="cita-nombre">${esc(cl ? nombreCompleto(cl) : 'Cliente eliminado')}</div>
          <div class="cita-trat">${esc(c.tratamiento || 'Sin tratamiento')}</div>
          <div class="cita-meta">
            hasta ${fmtHora(fin)}${c.precio ? ' · ' + fmtPrecio(c.precio) : ''}
            ${c.estado !== 'programada' ? ` · <span class="badge badge-${c.estado}">${etiquetaEstado(c.estado)}</span>` : ''}
          </div>
        </div>
      </article>`;
  }

  // ═══ REJILLA TEMPORAL ═══════════════════════════════════
  /** Ventana base de la rejilla: el horario configurado (el tramo más
   *  amplio de la semana) con media hora de respiro por cada lado. */
  function ventanaBase() {
    let abre = Infinity, cierra = -Infinity;
    for (let d = 0; d < 7; d++) {
      const h = horarioDe(d);
      if (!h.activo) continue;
      abre = Math.min(abre, h.abre);
      cierra = Math.max(cierra, h.cierra);
    }
    if (!Number.isFinite(abre)) { abre = HORARIO_DEFECTO.abre; cierra = HORARIO_DEFECTO.cierra; }
    return { desde: Math.max(0, abre - 30), hasta: Math.min(24 * 60, cierra + 30) };
  }

  const minutosDe = (iso) => { const d = new Date(iso); return d.getHours() * 60 + d.getMinutes(); };

  /** Ventana visible: la base, ampliada (nunca recortada) por las citas
   *  reales y redondeada a la hora. Ninguna cita se oculta. */
  function ventanaDe(citasPorDia) {
    const base = ventanaBase();
    let desde = base.desde, hasta = base.hasta;
    for (const citas of citasPorDia) {
      for (const c of citas) {
        const ini = minutosDe(c.inicio);
        const fin = Math.min(ini + (c.duracion_min || 60), 24 * 60);
        if (ini < desde) desde = Math.floor(ini / 60) * 60;
        if (fin > hasta) hasta = Math.ceil(fin / 60) * 60;
      }
    }
    return { desde: Math.max(0, desde), hasta: Math.min(24 * 60, hasta) };
  }

  /** Reparte citas solapadas en columnas dentro de su racimo de colisión.
   *  Devuelve [{cita, col, cols, ini, fin}] con minutos de reloj. */
  function repartir(citas) {
    const items = citas.map(c => {
      const ini = minutosDe(c.inicio);
      return { cita: c, ini, fin: Math.min(ini + (c.duracion_min || 60), 24 * 60), col: 0, cols: 1 };
    }).sort((a, b) => a.ini - b.ini || b.fin - a.fin);

    // Racimos: la colisión es transitiva (A-B y B-C juntan a A, B y C)
    const racimos = [];
    let g = [], finG = -Infinity;
    for (const it of items) {
      if (g.length && it.ini >= finG) { racimos.push(g); g = []; finG = -Infinity; }
      g.push(it); finG = Math.max(finG, it.fin);
    }
    if (g.length) racimos.push(g);

    for (const racimo of racimos) {
      const cols = []; // cols[i] = fin de la última cita colocada en esa columna
      for (const it of racimo) {
        let i = cols.findIndex(f => f <= it.ini);
        if (i === -1) { i = cols.length; cols.push(0); }
        cols[i] = it.fin;
        it.col = i;
      }
      for (const it of racimo) it.cols = cols.length;
    }
    return items;
  }

  /** Huecos ≥30 min entre citas ocupantes, dentro del horario del día.
   *  Con horario partido, la pausa de mediodía NO cuenta como hueco. */
  function huecosDe(ocupantes, hDia) {
    if (!hDia.activo) return [];
    const huecos = [];
    for (const t of hDia.tramos) {
      const ocupado = ocupantes.map(o => [Math.max(o.ini, t.abre), Math.min(o.fin, t.cierra)])
        .filter(([a, b]) => b > a).sort((a, b) => a[0] - b[0]);
      let cursor = t.abre;
      for (const [a, b] of ocupado) {
        if (a - cursor >= 30) huecos.push({ ini: cursor, fin: a });
        cursor = Math.max(cursor, b);
      }
      if (t.cierra - cursor >= 30) huecos.push({ ini: cursor, fin: t.cierra });
    }
    return huecos;
  }

  function etiquetaHueco(min) {
    const hh = Math.floor(min / 60), mm = min % 60;
    if (!hh) return `${mm} min libres`;
    return mm ? `${hh} h ${mm} min libres` : `${hh} h libres`;
  }

  const colorTrat = (c) => {
    const t = state.tratamientos.find(x => x.id === c.tratamiento_id);
    return (t && t.color) || 'var(--accent)';
  };

  function htmlRejilla(dias, conCabecera) {
    const porDia = dias.map(d => citasDe(d));
    const v = ventanaDe(porDia);
    const altura = (v.hasta - v.desde);

    // Regleta de horas
    let horas = '';
    for (let m = Math.ceil(v.desde / 60) * 60; m <= v.hasta; m += 60) {
      horas += `<span class="rej-hora" style="top:calc(var(--px) * ${m - v.desde})">${String(m / 60).padStart(2, '0')}:00</span>`;
    }

    const cols = dias.map((dia, di) => {
      const citas = porDia[di];
      const esHoy = mismaFecha(dia, hoy());
      const hDia = horarioDe(dia.getDay());
      const laborable = hDia.activo;

      const ocupantes = repartir(citas.filter(c => ESTADOS_QUE_OCUPAN.includes(c.estado)));
      const finas = citas.filter(c => !ESTADOS_QUE_OCUPAN.includes(c.estado));

      let bloques = '';

      // Fuera de horario apagado (que una cita a las 14:30 salte a la vista)
      if (laborable) {
        // Se apaga todo lo que quede fuera de los tramos de trabajo,
        // incluida la pausa de mediodía del horario partido
        let cursorH = v.desde;
        for (const t of hDia.tramos) {
          if (t.abre > cursorH) bloques += `<div class="rej-fuera" style="top:calc(var(--px) * ${cursorH - v.desde});height:calc(var(--px) * ${t.abre - cursorH})"></div>`;
          cursorH = Math.max(cursorH, t.cierra);
        }
        if (v.hasta > cursorH) bloques += `<div class="rej-fuera" style="top:calc(var(--px) * ${cursorH - v.desde});height:calc(var(--px) * ${v.hasta - cursorH})"></div>`;
      } else {
        bloques += `<div class="rej-fuera" style="top:0;height:calc(var(--px) * ${altura})"></div>`;
      }

      // Huecos con etiqueta (tocar → nueva cita a esa hora)
      for (const hgap of huecosDe(ocupantes, hDia)) {
        bloques += `<button type="button" class="rej-hueco" data-hueco="${dia.toISOString()}|${hgap.ini}"
          style="top:calc(var(--px) * ${hgap.ini - v.desde});height:calc(var(--px) * ${hgap.fin - hgap.ini})">${etiquetaHueco(hgap.fin - hgap.ini)}</button>`;
      }

      // Citas ocupantes
      for (const it of ocupantes) {
        const c = it.cita;
        const cl = clientaDe(c.clienta_id);
        const anchoCol = 100 / it.cols;
        const durPx = it.fin - it.ini;
        const corta = durPx < 26; // por debajo de ~44px reales
        bloques += `
          <button type="button" class="gcita estado-${c.estado}${corta ? ' gcita--corta' : ''}" data-cita="${c.id}"
            style="top:calc(var(--px) * ${it.ini - v.desde});height:calc(var(--px) * ${durPx});
                   left:calc(${it.col * anchoCol}% + 3px);width:calc(${anchoCol}% - 6px);
                   border-left-color:${esc(colorTrat(c))}"
            aria-label="De ${fmtHora(c.inicio)} a ${fmtHora(new Date(finDe(c)).toISOString())}, ${esc(cl ? nombreCompleto(cl) : 'cliente eliminado')}, ${esc(c.tratamiento || 'sin tratamiento')}, ${etiquetaEstado(c.estado)}">
            <b>${fmtHora(c.inicio)} · ${esc(cl ? cl.nombre : '—')}</b>
            <span>${esc(c.tratamiento || '')}</span>
          </button>`;
      }

      // Canceladas y faltas: franja fina, el hueco queda libre
      for (const c of finas) {
        const ini = minutosDe(c.inicio);
        const dur = Math.min(c.duracion_min || 60, 24 * 60 - ini);
        bloques += `<button type="button" class="gcita--fina" data-cita="${c.id}"
          style="top:calc(var(--px) * ${ini - v.desde});height:calc(var(--px) * ${dur})"
          aria-label="${etiquetaEstado(c.estado)}: ${fmtHora(c.inicio)}"
          title="${etiquetaEstado(c.estado)} · ${fmtHora(c.inicio)}"></button>`;
      }

      // Línea de ahora (solo hoy y si cae dentro de la ventana)
      if (esHoy) {
        bloques += `<div class="rej-ahora" data-ahora data-desde="${v.desde}" style="display:none"></div>`;
      }

      const cab = conCabecera
        ? `<div class="rej-col-cab${esHoy ? ' is-hoy' : ''}" data-ir-dia="${dia.toISOString()}">
             ${DIAS[dia.getDay()].slice(0, 3)} <small>${dia.getDate()}</small></div>`
        : '';
      return `<div class="rej-col">${cab}
        <div class="rej-lienzo" style="height:calc(var(--px) * ${altura})">${bloques}</div>
      </div>`;
    }).join('');

    const scroll = (conCabecera && dias.length > 1) ? ' rej-scroll' : '';
    return `<div class="rejilla">
      <div class="rej-horas"${conCabecera ? ' style="padding-top:34px"' : ''}>
        <div style="position:relative;height:calc(var(--px) * ${altura})">${horas}</div>
      </div>
      <div class="rej-cols${scroll}">${cols}</div>
    </div>`;
  }

  /** Vista día con una columna por profesional (solo con 2 o más). */
  function htmlRejillaProfesionales(dia, activos) {
    const citas = citasDe(dia);
    const v = ventanaDe([citas]);
    const altura = v.hasta - v.desde;
    const hDia = horarioDe(dia.getDay());
      const laborable = hDia.activo;
    const esHoy = mismaFecha(dia, hoy());

    let horas = '';
    for (let m = Math.ceil(v.desde / 60) * 60; m <= v.hasta; m += 60) {
      horas += `<span class="rej-hora" style="top:calc(var(--px) * ${m - v.desde})">${String(m / 60).padStart(2, '0')}:00</span>`;
    }

    // Citas cuya profesional no está entre las activas (sin asignar o de
    // baja): columna propia para que NUNCA desaparezcan de la vista.
    const idsActivas = new Set(activos.map(p => p.id));
    const sueltas = citas.filter(c => !idsActivas.has(c.profesional_id));
    const columnas = activos.map(p =>
      ({ id: p.id, nombre: p.nombre, color: p.color }));
    if (sueltas.length) columnas.push({ id: null, nombre: 'Sin asignar', color: '#6E6558' });

    const cols = columnas.map(p => {
      const propias = p.id === null ? sueltas : citas.filter(c => c.profesional_id === p.id);
      const ocupantes = repartir(propias.filter(c => ESTADOS_QUE_OCUPAN.includes(c.estado)));
      const finas = propias.filter(c => !ESTADOS_QUE_OCUPAN.includes(c.estado));
      let bloques = '';
      if (laborable) {
        // Se apaga todo lo que quede fuera de los tramos de trabajo,
        // incluida la pausa de mediodía del horario partido
        let cursorH = v.desde;
        for (const t of hDia.tramos) {
          if (t.abre > cursorH) bloques += `<div class="rej-fuera" style="top:calc(var(--px) * ${cursorH - v.desde});height:calc(var(--px) * ${t.abre - cursorH})"></div>`;
          cursorH = Math.max(cursorH, t.cierra);
        }
        if (v.hasta > cursorH) bloques += `<div class="rej-fuera" style="top:calc(var(--px) * ${cursorH - v.desde});height:calc(var(--px) * ${v.hasta - cursorH})"></div>`;
      } else {
        bloques += `<div class="rej-fuera" style="top:0;height:calc(var(--px) * ${altura})"></div>`;
      }
      for (const hgap of huecosDe(ocupantes, hDia)) {
        bloques += `<button type="button" class="rej-hueco" data-hueco="${dia.toISOString()}|${hgap.ini}"
          style="top:calc(var(--px) * ${hgap.ini - v.desde});height:calc(var(--px) * ${hgap.fin - hgap.ini})">${etiquetaHueco(hgap.fin - hgap.ini)}</button>`;
      }
      for (const it of ocupantes) {
        const c = it.cita;
        const cl = clientaDe(c.clienta_id);
        const anchoCol = 100 / it.cols;
        const durPx = it.fin - it.ini;
        bloques += `
          <button type="button" class="gcita estado-${c.estado}${durPx < 26 ? ' gcita--corta' : ''}" data-cita="${c.id}"
            style="top:calc(var(--px) * ${it.ini - v.desde});height:calc(var(--px) * ${durPx});
                   left:calc(${it.col * anchoCol}% + 3px);width:calc(${anchoCol}% - 6px);
                   border-left-color:${esc(p.color)}"
            aria-label="De ${fmtHora(c.inicio)} a ${fmtHora(new Date(finDe(c)).toISOString())}, ${esc(cl ? nombreCompleto(cl) : 'cliente eliminado')}, ${esc(c.tratamiento || 'sin tratamiento')}, con ${esc(p.nombre)}">
            <b>${fmtHora(c.inicio)} · ${esc(cl ? cl.nombre : '—')}</b>
            <span>${esc(c.tratamiento || '')}</span>
          </button>`;
      }
      for (const c of finas) {
        const ini = minutosDe(c.inicio);
        bloques += `<button type="button" class="gcita--fina" data-cita="${c.id}"
          style="top:calc(var(--px) * ${ini - v.desde});height:calc(var(--px) * ${Math.min(c.duracion_min || 60, 1440 - ini)})"
          aria-label="${etiquetaEstado(c.estado)}"></button>`;
      }
      if (esHoy) bloques += `<div class="rej-ahora" data-ahora data-desde="${v.desde}" style="display:none"></div>`;
      return `<div class="rej-col">
        <div class="rej-col-cab" style="color:${esc(p.color)}">${esc(p.nombre)}</div>
        <div class="rej-lienzo" style="height:calc(var(--px) * ${altura})">${bloques}</div>
      </div>`;
    }).join('');

    return `<div class="rejilla">
      <div class="rej-horas" style="padding-top:34px">
        <div style="position:relative;height:calc(var(--px) * ${altura})">${horas}</div>
      </div>
      <div class="rej-cols">${cols}</div>
    </div>`;
  }

  // ── VISTA MES ─────────────────────────────────────────────
  function htmlMes() {
    const y = state.fecha.getFullYear(), m = state.fecha.getMonth();
    const primero = new Date(y, m, 1);
    const ultimo = new Date(y, m + 1, 0);
    const inicio = lunesDe(primero);
    const semanas = Math.ceil((Math.round((addDias(lunesDe(ultimo), 7) - inicio) / 86400000)) / 7);

    let filas = '';
    for (let s = 0; s < semanas; s++) {
      let celdas = '';
      for (let d = 0; d < 6; d++) { // L–S: el sábado se trabaja a veces
        const dia = addDias(inicio, s * 7 + d);
        const esMesActual = dia.getMonth() === m;
        const esHoy = mismaFecha(dia, hoy());
        const citas = citasDe(dia);
        const ocupantes = citas.filter(c => ESTADOS_QUE_OCUPAN.includes(c.estado));

        let lineas = '';
        const visibles = ocupantes.slice(0, 3);
        // Si el "+N más" fuese a contener una sola cita, se enseña la cita
        const resto = ocupantes.length - visibles.length;
        for (const c of visibles) {
          const cl = clientaDe(c.clienta_id);
          lineas += `<div class="mes-linea" style="border-left-color:${esc(colorTrat(c))}">
            <b>${fmtHora(c.inicio)}</b> ${esc(cl ? cl.nombre : '—')}</div>`;
        }
        if (resto === 1) {
          const c = ocupantes[3];
          const cl = clientaDe(c.clienta_id);
          lineas += `<div class="mes-linea" style="border-left-color:${esc(colorTrat(c))}">
            <b>${fmtHora(c.inicio)}</b> ${esc(cl ? cl.nombre : '—')}</div>`;
        } else if (resto > 1) {
          lineas += `<div class="mes-mas">+${resto} más</div>`;
        }
        // En móvil las líneas se ocultan por CSS y mandan los puntos
        const puntos = ocupantes.slice(0, 4).map(c =>
          `<i style="background:${esc(colorTrat(c))}"></i>`).join('');

        celdas += `<button type="button"
          class="mes-celda${esMesActual ? '' : ' mes-otro'}${esHoy ? ' mes-hoy' : ''}"
          data-ir-dia="${dia.toISOString()}"
          aria-label="${fmtFechaLarga(dia)}: ${ocupantes.length} cita${ocupantes.length === 1 ? '' : 's'}">
          <span class="mes-num">${dia.getDate()}</span>
          <div class="mes-lineas">${lineas}</div>
          <div class="mes-puntos">${puntos}</div>
        </button>`;
      }
      filas += celdas;
    }
    // Citas en domingo: la cuadrícula es L-S, pero ninguna cita puede
    // quedar invisible → franja de aviso pulsable.
    let findes = '';
    for (let s = 0; s < semanas; s++) {
      for (const d of [6]) {
        const dia = addDias(inicio, s * 7 + d);
        if (dia.getMonth() !== m) continue;
        const oc = citasDe(dia).filter(c => ESTADOS_QUE_OCUPAN.includes(c.estado));
        if (oc.length) {
          findes += `<button type="button" class="mes-finde-btn" data-ir-dia="${dia.toISOString()}">
            ${DIAS[dia.getDay()]} ${dia.getDate()} · ${oc.length} cita${oc.length === 1 ? '' : 's'}</button>`;
        }
      }
    }
    const avisoFinde = findes
      ? `<div class="mes-finde">Citas en domingo: ${findes}</div>` : '';

    return avisoFinde + `<div class="mes-cab">${['Lun','Mar','Mié','Jue','Vie','Sáb'].map(d => `<span>${d}</span>`).join('')}</div>
      <div class="mes-grid" style="grid-template-rows:repeat(${semanas}, minmax(0, 1fr))">${filas}</div>`;
  }

  // ── Línea de "ahora": mueve SOLO su style.top, nunca repinta ──
  let _tAhora = null;
  function pintarAhora() {
    const ahora = new Date();
    const min = ahora.getHours() * 60 + ahora.getMinutes();
    document.querySelectorAll('[data-ahora]').forEach(el => {
      const desde = Number(el.dataset.desde);
      const lienzo = el.parentElement;
      const minutos = lienzoAltura(lienzo);
      const pxMin = minutos ? lienzo.offsetHeight / minutos : 0;
      const dentro = pxMin > 0 && min >= desde && min <= desde + minutos;
      el.style.display = dentro ? '' : 'none';
      if (dentro) el.style.top = (min - desde) * pxMin + 'px';
    });
  }
  function lienzoAltura(lienzo) {
    // minutos que representa el lienzo, deducidos de su height en calc
    const m = /\* ([\d.]+)\)/.exec(lienzo.getAttribute('style') || '');
    return m ? Number(m[1]) : 330;
  }
  function arrancarLineaAhora() {
    pintarAhora();
    if (_tAhora) clearTimeout(_tAhora);
    const tick = () => {
      pintarAhora();
      _tAhora = setTimeout(tick, 60000 - (Date.now() % 60000) + 250);
    };
    _tAhora = setTimeout(tick, 60000 - (Date.now() % 60000) + 250);
  }
  function pararLineaAhora() { if (_tAhora) { clearTimeout(_tAhora); _tAhora = null; } }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) pintarAhora(); });
  window.addEventListener('pageshow', pintarAhora);

  function etiquetaEstado(e) {
    return {
      programada: 'Programada', en_curso: 'En cabina', completada: 'Completada',
      cancelada: 'Cancelada', no_asistio: 'No se presentó'
    }[e] || e;
  }

  // Delegación registrada UNA vez: los listeners por tarjeta se
  // acumulaban en cada repintado (la ficha sigue en el DOM oculta por
  // CSS) y un clic llegaba a abrir el modal varias veces.
  function alClicarCita(ev) {
    const firma = ev.target.closest('[data-firma]');
    if (firma) {
      ev.preventDefault();
      verConsentimiento(firma.dataset.firma);
      return;
    }
    const el = ev.target.closest('[data-cita]');
    if (el) { abrirCita(el.dataset.cita); return; }

    // Toque en un hueco libre → nueva cita con la hora ya puesta
    const hueco = ev.target.closest('[data-hueco]');
    if (hueco) {
      const [iso, min] = hueco.dataset.hueco.split('|');
      const dia = new Date(iso);
      const redondeado = Math.ceil(Number(min) / 15) * 15; // hacia arriba: jamás dentro de la cita anterior
      modalCita(null, null, {
        fecha: inputFecha(dia),
        hora: `${String(Math.floor(redondeado / 60)).padStart(2, '0')}:${String(redondeado % 60).padStart(2, '0')}`
      });
      return;
    }
    // Cabecera de un día en la vista semana → vista día
    const cab = ev.target.closest('[data-ir-dia]');
    if (cab) {
      state.fecha = new Date(cab.dataset.irDia);
      state.fecha.setHours(0, 0, 0, 0);
      cambiarModo('dia');
      return;
    }
    // Enlace lista/rejilla
    if (ev.target.closest('[data-toggle-lista]')) {
      const actual = localStorage.getItem('agendaLista') === '1';
      localStorage.setItem('agendaLista', actual ? '0' : '1');
      renderAgenda();
    }
  }
  $('agenda-body').addEventListener('click', alClicarCita);
  $('ficha-body').addEventListener('click', alClicarCita);

  $('prev-btn').addEventListener('click', () => moverFecha(-1));
  $('next-btn').addEventListener('click', () => moverFecha(1));
  $('today-btn').addEventListener('click', async () => {
    state.fecha = hoy(); await cargarCitas(); renderAgenda();
  });
  async function moverFecha(dir) {
    if (state.modo === 'mes') {
      // new Date(y, m+dir, 1), nunca setMonth: desde el 31 de enero,
      // setMonth(getMonth()+1) aterriza en el 3 de marzo.
      state.fecha = new Date(state.fecha.getFullYear(), state.fecha.getMonth() + dir, 1);
    } else {
      state.fecha = addDias(state.fecha, state.modo === 'semana' ? 7 * dir : dir);
    }
    await cargarCitas();
    renderAgenda();
  }
  async function cambiarModo(modo) {
    state.modo = modo;
    document.querySelectorAll('#mode-seg button').forEach(x =>
      x.classList.toggle('active', x.dataset.mode === modo));
    await cargarCitas(); // el mes necesita un rango más ancho que el día
    renderAgenda();
  }
  document.querySelectorAll('#mode-seg button').forEach(b =>
    b.addEventListener('click', () => cambiarModo(b.dataset.mode)));

  // ─── CLIENTAS ────────────────────────────────────────────
  function renderClientas() {
    const q = state.filtro.toLowerCase().trim();
    const lista = state.clientas.filter(c => !q ||
      nombreCompleto(c).toLowerCase().includes(q) ||
      (c.telefono || '').includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.dni || '').toLowerCase().includes(q));
    $('clientas-body').innerHTML = lista.length
      ? lista.map(c => {
        const num = telWa(c.telefono);
        return `
        <div class="row" data-clienta="${c.id}">
          <div class="avatar">${esc(iniciales(c))}</div>
          <div class="row-body">
            <b>${esc(nombreCompleto(c))}</b>
            <span>${esc(c.telefono || c.email || 'Sin contacto')}</span>
          </div>
          ${c.contraindicaciones ? '<span title="Tiene contraindicaciones anotadas">⚠️</span>' : ''}
          ${num ? `
          <a class="icon-btn row-icono" href="tel:+${num}" aria-label="Llamar a ${esc(nombreCompleto(c))}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          </a>
          <a class="icon-btn row-icono" href="https://wa.me/${num}" target="_blank" rel="noopener" aria-label="Escribir por WhatsApp a ${esc(nombreCompleto(c))}">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.1-.7.2s-.7 1-.9 1.2c-.2.2-.3.2-.6.1a8 8 0 0 1-4-3.5c-.3-.5.3-.5.8-1.5.1-.2 0-.4 0-.5l-1-2.2c-.2-.5-.4-.5-.6-.5h-.6a1.1 1.1 0 0 0-.8.4A3.3 3.3 0 0 0 5 9.1c0 1.5 1.1 2.9 1.2 3.1a12 12 0 0 0 4.7 4.1c1.7.7 2.4.8 3.2.7.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.3s-.2-.2-.5-.3z"/><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z"/></svg>
          </a>` : ''}
        </div>`;
      }).join('')
      : `<div class="empty">${q ? 'Nadie coincide con la búsqueda.' : 'Aún no hay clientes. Pulsa + para dar de alta el primero.'}</div>`;
    document.querySelectorAll('[data-clienta]').forEach(el =>
      el.addEventListener('click', (ev) => {
        // Los iconos de llamar/WhatsApp no deben abrir la ficha
        if (ev.target.closest('a')) return;
        state.clientaAbierta = el.dataset.clienta;
        state.fichaFiltro = null; // cada ficha arranca sin filtro
        irA('ficha');
      }));
  }
  $('cli-search').addEventListener('input', (e) => { state.filtro = e.target.value; renderClientas(); });

  // ─── FICHA ───────────────────────────────────────────────
  async function renderFicha() {
    const c = clientaDe(state.clientaAbierta);
    if (!c) { irA('clientas'); return; }

    // El histórico completo se pide aparte: puede ir más atrás que la agenda cargada
    const { data: hist, error: eHist } = await db.from('citas').select('*')
      .eq('clienta_id', c.id).order('inicio', { ascending: false });
    if (eHist) {
      // Sin esto, un fallo de red pintaría "0 citas" como si fuera verdad.
      $('ficha-body').innerHTML = `
        <div class="view-head"><div><div class="eyebrow">Ficha de cliente</div>
          <h1>${esc(nombreCompleto(c))}</h1></div></div>
        <div class="empty">No se ha podido cargar su histórico.<br>
          <button class="btn btn-outline btn-sm" id="ficha-reintentar" style="margin-top:10px">Reintentar</button>
        </div>`;
      $('ficha-reintentar').addEventListener('click', () => renderFicha());
      return;
    }
    const historico = hist || [];
    const gastado = historico.filter(x => x.estado === 'completada')
      .reduce((s, x) => s + (Number(x.precio) || 0), 0);

    // Consentimientos firmados de esta persona, indexados por cita
    const { data: firmas } = await db.from('consentimientos_firmados')
      .select('id, cita_id, titulo, firmado_at').eq('clienta_id', c.id);
    const firmaDe = {};
    (firmas || []).forEach(x => { firmaDe[x.cita_id] = x; });

    // Fotos de sus sesiones, por cita (si la tabla aún no existe, nada)
    const { data: fts } = await db.from('fotos_sesion')
      .select('id, cita_id, ruta').eq('clienta_id', c.id).order('created_at');
    const fotosDe = {};
    (fts || []).forEach(f => { (fotosDe[f.cita_id] = fotosDe[f.cita_id] || []).push(f); });

    // Bonos y sus usos firmados (si el SQL aún no está, la tarjeta avisa)
    const { data: bonos, error: eBonos } = await db.from('bonos')
      .select('*').eq('clienta_id', c.id).order('created_at', { ascending: false });
    let usosBono = [];
    if (!eBonos) {
      const { data: u } = await db.from('bono_usos')
        .select('id, bono_id, cita_id, usado_at').eq('clienta_id', c.id).order('usado_at');
      usosBono = u || [];
    }
    const usosDe = {};
    usosBono.forEach(u => { (usosDe[u.bono_id] = usosDe[u.bono_id] || []).push(u); });
    const bonoEnCita = {};
    usosBono.forEach(u => { if (u.cita_id) bonoEnCita[u.cita_id] = true; });

    // Porcentaje de faltas: solo cuentan las citas que ya pasaron y se
    // cerraron de una forma u otra. Las canceladas con aviso no penalizan.
    const cerradas = historico.filter(x => ['completada', 'no_asistio'].includes(x.estado));
    const faltas = cerradas.filter(x => x.estado === 'no_asistio').length;
    const pctFaltas = cerradas.length ? Math.round(faltas * 100 / cerradas.length) : 0;
    const faltasPreocupan = faltas >= 2 && pctFaltas >= 25;

    // Filtro del histórico por tratamiento: para leer la evolución de un
    // mismo tratamiento seguida, sin las otras 20 sesiones en medio.
    const tiposTrat = [...new Set(historico.map(x => x.tratamiento).filter(Boolean))];
    const filtroTrat = tiposTrat.includes(state.fichaFiltro) ? state.fichaFiltro : null;
    const historialVisible = filtroTrat
      ? historico.filter(x => x.tratamiento === filtroTrat) : historico;

    $('ficha-body').innerHTML = `
      <div class="view-head">
        <div>
          <div class="eyebrow">Ficha de cliente</div>
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
          <dt>DNI / NIE</dt><dd>${esc(c.dni || '—')}</dd>
          <dt>Dirección</dt><dd>${esc(c.direccion || '—')}</dd>
          <dt>Nacimiento</dt><dd>${c.fecha_nacimiento ? fmtFechaCorta(c.fecha_nacimiento) : '—'}</dd>
          <dt>Notas</dt><dd>${esc(c.notas || '—')}</dd>
          <dt>Alta</dt><dd>${fmtFechaCorta(c.created_at)}</dd>
        </dl>
      </div>

      ${(() => {
        // Lo primero que se quiere saber al abrir la ficha: qué se le
        // hizo la última vez y con qué parámetros (notas de aquel día).
        const u = historico.find(x => ['completada', 'en_curso'].includes(x.estado));
        if (!u) return '';
        return `
      <div class="card ultima-card" data-cita="${u.id}" role="button" tabindex="0"
           aria-label="Abrir la última sesión">
        <h2>Última sesión</h2>
        <p class="ultima-meta">${fmtFechaCorta(u.inicio)} · <b>${esc(u.tratamiento || 'Sin tratamiento')}</b>${u.precio ? ' · ' + fmtPrecio(u.precio) : ''}</p>
        <p class="ultima-notas">${u.notas ? esc(u.notas) : 'Sin notas registradas aquel día.'}</p>
      </div>`;
      })()}

      <div class="card">
        <h2>Resumen</h2>
        <div class="stats">
          <div class="stat"><b>${historico.length}</b><span>citas totales</span></div>
          <div class="stat"><b>${historico.filter(x => x.estado === 'completada').length}</b><span>completadas</span></div>
          <div class="stat${faltasPreocupan ? ' alerta-faltas' : ''}"><b>${faltas}</b><span>sin presentarse</span></div>
          <div class="stat${faltasPreocupan ? ' alerta-faltas' : ''}"><b>${pctFaltas}%</b><span>de faltas</span></div>
          ${gastado > 0 ? `<div class="stat"><b style="font-size:19px">${fmtPrecio(gastado)}</b><span>facturado</span></div>` : ''}
        </div>
        ${faltasPreocupan ? `<p style="font-size:13px;color:#8A5A17;margin-top:12px">
          Ha faltado sin avisar ${faltas} de ${cerradas.length} veces. Quizá convenga confirmar la cita el día antes o pedir señal.
        </p>` : ''}
      </div>

      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
          <h2>Bonos</h2>
          <button class="btn btn-outline btn-sm" id="nuevo-bono">Nuevo bono</button>
        </div>
        ${eBonos
          ? '<p class="fotos-nota" style="margin-top:10px">Para activar los bonos, ejecuta <b>supabase/agenda-bonos.sql</b> en Supabase (SQL Editor).</p>'
          : (bonos && bonos.length ? bonos.map(b => {
              const usadas = (usosDe[b.id] || []).length;
              const quedan = b.sesiones_total - usadas;
              return `
              <div class="bono${quedan <= 0 ? ' bono-agotado' : ''}">
                <div class="bono-info">
                  <b>${esc(b.nombre)}</b>
                  <span>${fmtFechaCorta(b.comprado_at)}${b.precio !== null ? ' · ' + fmtPrecio(b.precio) : ''}</span>
                  <div class="bono-progreso"><i style="width:${Math.min(100, Math.round(usadas * 100 / b.sesiones_total))}%"></i></div>
                  <span>${usadas} de ${b.sesiones_total} usadas · ${quedan > 0 ? `quedan <b>${quedan}</b>` : '<b>agotado</b>'}</span>
                </div>
                <div class="bono-acciones">
                  ${quedan > 0 ? `<button class="btn btn-dark btn-sm" data-bono-usar="${b.id}">Descontar sesión</button>` : ''}
                  ${usadas > 0 ? `<button class="btn btn-outline btn-sm" data-bono-ver="${b.id}">Ver usos</button>` : ''}
                  <button class="btn btn-ghost btn-sm" data-bono-borrar="${b.id}" data-usos="${usadas}">Eliminar</button>
                </div>
              </div>`;
            }).join('')
          : '<p style="font-size:13.5px;color:var(--muted);margin-top:10px">Sin bonos. Con "Nuevo bono" registras un paquete de sesiones pagado por adelantado.</p>')}
      </div>

      <div class="card">
        <h2>Histórico de tratamientos</h2>
        <p style="font-size:13px;color:var(--muted);margin-bottom:12px">
          ${historico.length} cita${historico.length === 1 ? '' : 's'}${gastado > 0 ? ` · ${fmtPrecio(gastado)} facturado` : ''}
        </p>
        ${tiposTrat.length > 1 ? `<div class="fchips">
          <button type="button" data-ftrat=""${!filtroTrat ? ' class="activo"' : ''}>Todos</button>
          ${tiposTrat.map(t => `<button type="button" data-ftrat="${esc(t)}"${filtroTrat === t ? ' class="activo"' : ''}>${esc(t)}</button>`).join('')}
        </div>` : ''}
        ${historialVisible.length ? historialVisible.map(h => `
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
                ${(state.profesionales.filter(p => p.activo).length > 1 && profesionalDe(h.profesional_id)) ? esc(profesionalDe(h.profesional_id).nombre) + ' · ' : ''}
                <span class="badge badge-${h.estado}">${etiquetaEstado(h.estado)}</span>${bonoEnCita[h.id] ? ' · <span class="badge badge-bono">Bono</span>' : ''}
                ${firmaDe[h.id] ? ` · <a href="#" data-firma="${firmaDe[h.id].id}" style="color:var(--accent-dark);text-decoration:underline">consentimiento firmado</a>` : ''}
              </div>
              ${(fotosDe[h.id] || []).length ? `<div class="ficha-fotos" data-fotos-cita="${h.id}"></div>` : ''}
            </div>
          </div>`).join('')
          : `<div class="empty">${filtroTrat ? 'Sin sesiones de ese tratamiento.' : 'Todavía no tiene tratamientos registrados.'}</div>`}
      </div>`;

    document.querySelectorAll('#ficha-body [data-ftrat]').forEach(b =>
      b.addEventListener('click', () => {
        state.fichaFiltro = b.dataset.ftrat || null;
        renderFicha();
      }));

    $('editar-cli').addEventListener('click', () => modalClienta(c));
    $('cita-para-cli').addEventListener('click', () => modalCita(null, c.id));

    $('nuevo-bono').addEventListener('click', () => modalNuevoBono(c));
    document.querySelectorAll('[data-bono-usar]').forEach(b =>
      b.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const bono = (bonos || []).find(x => x.id === b.dataset.bonoUsar);
        if (bono) modalUsarBono(bono, c, null, (usosDe[bono.id] || []).length);
      }));
    document.querySelectorAll('[data-bono-ver]').forEach(b =>
      b.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const bono = (bonos || []).find(x => x.id === b.dataset.bonoVer);
        if (bono) modalVerUsosBono(bono);
      }));
    document.querySelectorAll('[data-bono-borrar]').forEach(b =>
      b.addEventListener('click', async (ev) => {
        ev.stopPropagation();
        const nUsos = Number(b.dataset.usos) || 0;
        const msg = nUsos
          ? `¿Eliminar este bono?\n\nSe borrarán también sus ${nUsos} uso${nUsos === 1 ? '' : 's'} registrado${nUsos === 1 ? '' : 's'}. Hazlo solo si el bono fue un error o una prueba; si solo quieres corregir un uso, usa "Ver usos".`
          : '¿Eliminar este bono? No tiene usos registrados.';
        if (!confirm(msg)) return;
        const { error } = await db.from('bonos').delete().eq('id', b.dataset.bonoBorrar);
        if (error) { toast('No se pudo eliminar'); return; }
        toast('Bono eliminado'); renderFicha();
      }));

    // Miniaturas de las fotos: todas las firmas de URL en un solo viaje
    const visibles = historialVisible.flatMap(h => fotosDe[h.id] || []);
    if (visibles.length) {
      const { data: sig } = await db.storage.from(BUCKET_FOTOS)
        .createSignedUrls(visibles.map(f => rutaMini(f.ruta)), 3600);
      const url = {};
      (sig || []).forEach((s, i) => { if (s && s.signedUrl) url[visibles[i].id] = s.signedUrl; });
      document.querySelectorAll('[data-fotos-cita]').forEach(box => {
        const lista = fotosDe[box.dataset.fotosCita] || [];
        box.innerHTML = lista.map(f =>
          `<img src="${url[f.id] || ''}" alt="Foto de la sesión" data-ver="${esc(f.ruta)}">`).join('');
      });
      document.querySelectorAll('[data-ver]').forEach(im =>
        im.addEventListener('click', (ev) => {
          ev.stopPropagation(); // que no abra además la cita
          abrirFotoGrande(im.dataset.ver);
        }));
    }
  }

  // ─── TRATAMIENTOS ────────────────────────────────────────
  function renderAjustes() {
    if (state.ajustesTab === 'consentimientos') return renderPlantillas();
    if (state.ajustesTab === 'profesionales') return renderProfesionales();
    if (state.ajustesTab === 'horario') return renderHorario();
    $('ajustes-body').innerHTML = state.tratamientos.length
      ? state.tratamientos.map(t => `
        <div class="row" data-trat="${t.id}">
          <div style="width:10px;height:38px;border-radius:5px;background:${esc(t.color)};flex-shrink:0"></div>
          <div class="row-body">
            <b>${esc(t.nombre)}</b>
            <span>${t.duracion_min} min${t.precio !== null ? ' · ' + fmtPrecio(t.precio) : ' · sin precio'}${t.requiere_prueba ? ' · prueba previa' : ''}${t.activo ? '' : ' · inactivo'}</span>
          </div>
        </div>`).join('')
      : '<div class="empty">No hay tratamientos en el catálogo.</div>';
    document.querySelectorAll('[data-trat]').forEach(el =>
      el.addEventListener('click', () =>
        modalTratamiento(state.tratamientos.find(t => t.id === el.dataset.trat))));
  }
  $('nuevo-trat-btn').addEventListener('click', () => {
    if (state.ajustesTab === 'consentimientos') return modalPlantilla(null);
    if (state.ajustesTab === 'profesionales') return modalProfesional(null);
    if (state.ajustesTab === 'horario') return; // el horario no "añade"
    modalTratamiento(null);
  });

  document.querySelectorAll('#ajustes-seg button').forEach(b =>
    b.addEventListener('click', () => {
      state.ajustesTab = b.dataset.tab;
      document.querySelectorAll('#ajustes-seg button').forEach(x =>
        x.classList.toggle('active', x === b));
      $('ajustes-ayuda').textContent = {
        tratamientos: 'Tu catálogo para agendar rápido: al elegir un tratamiento se rellenan solos la duración y el precio.',
        consentimientos: 'Los documentos que firman tus clientes en la tablet. Asocia cada uno a su tratamiento desde la pestaña anterior.',
        profesionales: 'Quién realiza las citas. Con una sola persona activa, la agenda no pregunta nada; con dos o más, el día se divide en columnas.',
        horario: 'Tu semana de trabajo: pinta la franja laborable, avisa de citas fuera de hora y alimenta el buscador de huecos. Nunca bloquea: siempre puedes agendar fuera.'
      }[state.ajustesTab];
      $('nuevo-trat-btn').style.display = state.ajustesTab === 'horario' ? 'none' : '';
      renderAjustes();
    }));

  // ─── AJUSTES · Horario semanal ───────────────────────────
  function renderHorario() {
    const orden = [1, 2, 3, 4, 5, 6, 0];
    const nombres = { 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 0: 'Domingo' };
    const sinSQL = !state.horario;
    $('ajustes-body').innerHTML = `
      ${sinSQL ? '<p class="fotos-nota" style="margin-bottom:12px">Para poder guardarlo, ejecuta <b>supabase/agenda-horario.sql</b> en Supabase (SQL Editor). Mientras tanto se usa L-V de 9:30 a 14:00.</p>' : ''}
      ${orden.map(d => {
        const h = horarioDe(d);
        const t1 = h.tramos[0];
        const t2 = h.tramos[1] || null;
        return `
        <div class="horario-fila">
          <label class="horario-dia">
            <input type="checkbox" data-h-activo="${d}"${h.activo ? ' checked' : ''}>
            <span>${nombres[d]}</span>
          </label>
          <span class="horario-tramo">
            <input type="time" data-h-abre="${d}" value="${minAHora(t1.abre)}"${h.activo ? '' : ' disabled'}>
            <span class="horario-sep">a</span>
            <input type="time" data-h-cierra="${d}" value="${minAHora(t1.cierra)}"${h.activo ? '' : ' disabled'}>
          </span>
          <span class="horario-tramo" data-h-t2="${d}"${t2 ? '' : ' hidden'}>
            <span class="horario-sep">y de</span>
            <input type="time" data-h-abre2="${d}" value="${t2 ? minAHora(t2.abre) : ''}"${h.activo ? '' : ' disabled'}>
            <span class="horario-sep">a</span>
            <input type="time" data-h-cierra2="${d}" value="${t2 ? minAHora(t2.cierra) : ''}"${h.activo ? '' : ' disabled'}>
            <button type="button" class="horario-quitar" data-h-quitar="${d}" aria-label="Quitar el tramo de tarde">×</button>
          </span>
          <button type="button" class="btn btn-ghost btn-sm" data-h-partir="${d}"${t2 ? ' hidden' : ''}${h.activo ? '' : ' disabled'}>+ tarde</button>
        </div>`;
      }).join('')}
      <p style="font-size:12.5px;color:var(--muted);margin-top:10px">
        «+ tarde» añade un segundo tramo para el horario partido: la pausa
        de mediodía queda apagada en el calendario y no se ofrece en los huecos.
      </p>
      <div style="margin-top:12px">
        <button class="btn btn-dark" id="h-guardar">Guardar horario</button>
      </div>`;

    document.querySelectorAll('[data-h-partir]').forEach(btn =>
      btn.addEventListener('click', () => {
        const d = btn.dataset.hPartir;
        document.querySelector(`[data-h-t2="${d}"]`).hidden = false;
        const a2 = document.querySelector(`[data-h-abre2="${d}"]`);
        if (!a2.value) a2.value = '16:00';
        const c2 = document.querySelector(`[data-h-cierra2="${d}"]`);
        if (!c2.value) c2.value = '20:00';
        btn.hidden = true;
      }));
    document.querySelectorAll('[data-h-quitar]').forEach(btn =>
      btn.addEventListener('click', () => {
        const d = btn.dataset.hQuitar;
        document.querySelector(`[data-h-t2="${d}"]`).hidden = true;
        document.querySelector(`[data-h-abre2="${d}"]`).value = '';
        document.querySelector(`[data-h-cierra2="${d}"]`).value = '';
        document.querySelector(`[data-h-partir="${d}"]`).hidden = false;
      }));

    document.querySelectorAll('[data-h-activo]').forEach(ch =>
      ch.addEventListener('change', () => {
        const d = ch.dataset.hActivo;
        ['abre', 'cierra', 'abre2', 'cierra2'].forEach(k => {
          document.querySelector(`[data-h-${k}="${d}"]`).disabled = !ch.checked;
        });
        document.querySelector(`[data-h-partir="${d}"]`).disabled = !ch.checked;
      }));

    $('h-guardar').addEventListener('click', async () => {
      const filas = orden.map(d => {
        const t2oculto = document.querySelector(`[data-h-t2="${d}"]`).hidden;
        return {
          dia: d,
          activo: document.querySelector(`[data-h-activo="${d}"]`).checked,
          abre: document.querySelector(`[data-h-abre="${d}"]`).value || '09:30',
          cierra: document.querySelector(`[data-h-cierra="${d}"]`).value || '14:00',
          abre2: t2oculto ? null : (document.querySelector(`[data-h-abre2="${d}"]`).value || null),
          cierra2: t2oculto ? null : (document.querySelector(`[data-h-cierra2="${d}"]`).value || null)
        };
      });
      const mal = filas.find(f => f.activo && f.cierra <= f.abre);
      if (mal) return toast(`Revisa el ${nombres[mal.dia].toLowerCase()}: el cierre debe ser posterior a la apertura`);
      const mal2 = filas.find(f => f.activo && (f.abre2 || f.cierra2) &&
        (!f.abre2 || !f.cierra2 || f.abre2 < f.cierra || f.cierra2 <= f.abre2));
      if (mal2) return toast(`Revisa la tarde del ${nombres[mal2.dia].toLowerCase()}: debe empezar tras la mañana y cerrar después de abrir`);
      // Un día sin tramo de tarde guarda ambos en blanco
      filas.forEach(f => { if (!f.abre2 || !f.cierra2) { f.abre2 = null; f.cierra2 = null; } });
      const btn = $('h-guardar'); btn.disabled = true;
      const { error } = await db.from('horario_semana').upsert(filas);
      btn.disabled = false;
      if (error) {
        toast(sinSQL ? 'Falta ejecutar supabase/agenda-horario.sql en Supabase'
                     : 'No se pudo guardar: ' + error.message);
        return;
      }
      await cargarHorario();
      toast('Horario guardado');
      renderHorario();
    });
  }

  function renderPlantillas() {
    $('ajustes-body').innerHTML = state.plantillas.length
      ? state.plantillas.map(p => `
        <div class="row" data-plant="${p.id}">
          <div class="avatar" style="border-radius:8px">📄</div>
          <div class="row-body">
            <b>${esc(p.nombre)}</b>
            <span>versión ${p.version}${p.activa ? '' : ' · inactiva'} · ${p.texto.length} caracteres</span>
          </div>
        </div>`).join('')
      : `<div class="empty">
           Aún no hay consentimientos.<br>
           Ejecuta <code>supabase/agenda-consentimientos.sql</code> para crear las plantillas iniciales.
         </div>`;
    document.querySelectorAll('[data-plant]').forEach(el =>
      el.addEventListener('click', () =>
        modalPlantilla(state.plantillas.find(p => p.id === el.dataset.plant))));
  }

  function renderProfesionales() {
    if (!state.profesionales.length) {
      $('ajustes-body').innerHTML = `<div class="empty">
        Falta un paso en Supabase.<br>
        Ejecuta <code>supabase/agenda-profesionales.sql</code> y recarga.
      </div>`;
      return;
    }
    $('ajustes-body').innerHTML = state.profesionales.map(p => `
      <div class="row" data-prof="${p.id}">
        <div style="width:10px;height:38px;border-radius:5px;background:${esc(p.color)};flex-shrink:0"></div>
        <div class="row-body">
          <b>${esc(p.nombre)}</b>
          <span>${p.activo ? 'activa' : 'inactiva'}</span>
        </div>
      </div>`).join('');
    document.querySelectorAll('[data-prof]').forEach(el =>
      el.addEventListener('click', () =>
        modalProfesional(profesionalDe(el.dataset.prof))));
  }

  // Seis colores fijos separados en tono: dos marrones de la casa serían
  // indistinguibles en la rejilla.
  const COLORES_PROF = ['#A86B4E', '#3D6E99', '#5C7A4E', '#8C5A5A', '#6E6558', '#C68B2F'];

  function modalProfesional(p) {
    const esNuevo = !p;
    const color = p ? p.color : COLORES_PROF.find(c =>
      !state.profesionales.some(x => x.color === c)) || COLORES_PROF[0];
    abrirModal(esNuevo ? 'Nueva profesional' : 'Editar profesional', `
      <div class="field">
        <label for="pr-nombre">Nombre *</label>
        <input id="pr-nombre" value="${esc(p ? p.nombre : '')}" placeholder="Como quieres verlo en la agenda">
      </div>
      <div class="field">
        <label>Color en la agenda</label>
        <div class="paleta" id="pr-paleta">
          ${COLORES_PROF.map(c => `
            <button type="button" class="paleta-color${c === color ? ' activo' : ''}"
              data-color="${c}" style="background:${c}" aria-label="Color ${c}"></button>`).join('')}
        </div>
      </div>
      <div class="field">
        <label for="pr-activo">Estado</label>
        <select id="pr-activo">
          <option value="1"${!p || p.activo ? ' selected' : ''}>Activa</option>
          <option value="0"${p && !p.activo ? ' selected' : ''}>Inactiva</option>
        </select>
        <p style="font-size:11.5px;color:var(--muted);margin-top:5px">
          Para dar de baja, usa "Inactiva": sus citas pasadas se conservan.
        </p>
      </div>
      <div class="modal-actions">
        <button class="btn btn-dark" id="pr-guardar">Guardar</button>
      </div>`);

    let colorElegido = color;
    document.querySelectorAll('#pr-paleta .paleta-color').forEach(b =>
      b.addEventListener('click', () => {
        colorElegido = b.dataset.color;
        document.querySelectorAll('#pr-paleta .paleta-color').forEach(x =>
          x.classList.toggle('activo', x === b));
      }));

    $('pr-guardar').addEventListener('click', async () => {
      const nombre = $('pr-nombre').value.trim();
      if (!nombre) return toast('El nombre es obligatorio');
      $('pr-guardar').disabled = true;
      try {
        const payload = { nombre, color: colorElegido, activo: $('pr-activo').value === '1' };
        const q = esNuevo
          ? db.from('profesionales').insert(payload)
          : db.from('profesionales').update(payload).eq('id', p.id);
        const { error } = await q;
        if (error) { toast('No se pudo guardar: ' + error.message); return; }
        cerrarModal(); await cargarProfesionales(); render(); toast('Guardado');
      } finally { const b = $('pr-guardar'); if (b) b.disabled = false; }
    });
  }

  function modalPlantilla(p) {
    const esNueva = !p;
    abrirModal(esNueva ? 'Nuevo consentimiento' : 'Editar consentimiento', `
      <div class="field">
        <label for="p-nombre">Nombre del documento *</label>
        <input id="p-nombre" value="${esc(p ? p.nombre : '')}" placeholder="Ej. Depilación láser">
      </div>
      <div class="field">
        <label for="p-texto">Texto que leerá y firmará la clienta *</label>
        <textarea id="p-texto" rows="14" style="min-height:280px;font-size:14px">${esc(p ? p.texto : '')}</textarea>
      </div>
      <div class="field">
        <label for="p-activa">Estado</label>
        <select id="p-activa">
          <option value="1"${!p || p.activa ? ' selected' : ''}>Activo</option>
          <option value="0"${p && !p.activa ? ' selected' : ''}>Inactivo</option>
        </select>
      </div>
      <p style="font-size:12px;color:var(--muted);margin-bottom:6px">
        Al editar el texto sube la versión. Los consentimientos ya firmados
        conservan su texto original: nunca cambian.
      </p>
      <div class="modal-actions">
        <button class="btn btn-dark" id="p-guardar">Guardar</button>
      </div>`);

    $('p-guardar').addEventListener('click', async () => {
      const nombre = $('p-nombre').value.trim();
      const texto = $('p-texto').value.trim();
      if (!nombre || !texto) return toast('Faltan el nombre o el texto');
      $('p-guardar').disabled = true;
      try {
      const cambioTexto = p && texto !== p.texto;
      const payload = {
        nombre, texto,
        activa: $('p-activa').value === '1',
        version: esNueva ? 1 : (p.version + (cambioTexto ? 1 : 0))
      };
      const q = esNueva
        ? db.from('consentimiento_plantillas').insert(payload)
        : db.from('consentimiento_plantillas').update(payload).eq('id', p.id);
      const { error } = await q;
      if (error) { toast('No se pudo guardar'); return; }
      cerrarModal(); await cargarPlantillas(); render();
      toast(cambioTexto ? `Guardado · ahora es la versión ${payload.version}` : 'Guardado');
      } finally { const b = $('p-guardar'); if (b) b.disabled = false; }
    });
  }

  // ─── MODAL ───────────────────────────────────────────────
  function abrirModal(titulo, html) {
    $('modal-title').textContent = titulo;
    $('modal-body').innerHTML = html;
    $('modal').classList.add('open');
  }
  let _limpiezasModal = [];
  let _guardaCierre = null;
  /** Registra una limpieza que se ejecutará al cerrar el modal actual. */
  function alCerrarModal(fn) { _limpiezasModal.push(fn); }
  /** El modal actual pedirá confirmación antes de cerrarse si fn() devuelve un mensaje. */
  function protegerCierre(fn) { _guardaCierre = fn; }
  function cerrarModal() {
    $('modal').classList.remove('open');
    _guardaCierre = null;
    _limpiezasModal.forEach(fn => { try { fn(); } catch (e) {} });
    _limpiezasModal = [];
  }
  /** Cierre iniciado por la usuaria (X, fondo, Escape): pasa por la guarda.
   *  Un roce en el fondo de la tablet no debe tirar una firma a medias. */
  function intentarCerrarModal() {
    if (_guardaCierre) {
      const msg = _guardaCierre();
      if (msg && !confirm(msg)) return;
    }
    cerrarModal();
  }
  $('modal-close').addEventListener('click', intentarCerrarModal);
  $('modal').addEventListener('click', (e) => { if (e.target === $('modal')) intentarCerrarModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('modal').classList.contains('open')) intentarCerrarModal(); });

  // ─── Solapes ─────────────────────────────────────────────
  // Estados que ocupan hueco de verdad. Una cancelada o una falta NO
  // bloquean: su hueco vuelve a estar disponible.
  const ESTADOS_QUE_OCUPAN = ['programada', 'en_curso', 'completada'];

  // ─── Horario del centro ──────────────────────────────────
  // Configurable desde Ajustes → Horario (tabla horario_semana). Mientras
  // el SQL no esté ejecutado, se usa este de siempre: L-V 9:30–14:00.
  const HORARIO_DEFECTO = { abre: 9 * 60 + 30, cierra: 14 * 60, dias: [1, 2, 3, 4, 5] };
  const minAHora = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  const horaAMin = (t) => { const [h, m] = String(t).split(':'); return (Number(h) || 0) * 60 + (Number(m) || 0); };

  /** Horario de un día de la semana (0=domingo…6=sábado).
   *  tramos: 1 (jornada seguida) o 2 (horario partido, pausa en medio).
   *  abre/cierra son el arranque del primer tramo y el fin del último
   *  (la envolvente, para dimensionar la rejilla). */
  function horarioDe(diaSemana) {
    const h = state.horario && state.horario[diaSemana];
    if (h) return h;
    return {
      activo: HORARIO_DEFECTO.dias.includes(diaSemana),
      abre: HORARIO_DEFECTO.abre,
      cierra: HORARIO_DEFECTO.cierra,
      tramos: [{ abre: HORARIO_DEFECTO.abre, cierra: HORARIO_DEFECTO.cierra }]
    };
  }

  async function cargarHorario() {
    const { data, error } = await db.from('horario_semana').select('*');
    if (error || !data || !data.length) { state.horario = null; return; }
    state.horario = {};
    data.forEach(r => {
      const tramos = [{ abre: horaAMin(r.abre), cierra: horaAMin(r.cierra) }];
      if (r.abre2 && r.cierra2) tramos.push({ abre: horaAMin(r.abre2), cierra: horaAMin(r.cierra2) });
      state.horario[r.dia] = {
        activo: r.activo,
        abre: tramos[0].abre,
        cierra: tramos[tramos.length - 1].cierra,
        tramos
      };
    });
  }

  /** Fin de una cita en milisegundos de época. Única definición de "fin". */
  function finDe(c) {
    return new Date(c.inicio).getTime() + (c.duracion_min || 60) * 60000;
  }

  // Intervalos semiabiertos [ini, fin) en milisegundos.
  // DOS "<" ESTRICTOS: 10:00-11:00 y 11:00-12:00 se tocan pero NO solapan
  // (encadenar citas es lo normal); un "<=" avisaría de choque cada día.
  function solapan(aIni, aFin, bIni, bFin) {
    return aIni < bFin && bIni < aFin;
  }

  /** Valida fecha/hora/duración y falla cerrado si algo no es un número. */
  function validarCita(fechaStr, horaStr, durStr) {
    const ini = new Date(aISO(fechaStr, horaStr)).getTime();
    const dur = Math.round(Number(durStr));
    if (!Number.isFinite(ini)) return { error: 'La fecha o la hora no son válidas' };
    if (!Number.isFinite(dur) || dur < 5 || dur > 600) {
      return { error: 'La duración debe estar entre 5 minutos y 10 horas' };
    }
    return { ini, dur, fin: ini + dur * 60000 };
  }

  /** ¿Cae fuera del horario del centro? Informativo, nunca bloquea. */
  function fueraDeHorario(ini, fin) {
    const d = new Date(ini);
    const h = horarioDe(d.getDay());
    if (!h.activo) return 'ese día el centro está cerrado según tu horario';
    const minIni = d.getHours() * 60 + d.getMinutes();
    const df = new Date(fin);
    const minFin = df.getHours() * 60 + df.getMinutes();
    // La cita debe caber ENTERA en alguno de los tramos: una cita que
    // pisa la pausa de mediodía también es "fuera de horario"
    const cabe = h.tramos.some(t => minIni >= t.abre && minFin <= t.cierra);
    if (!cabe || !mismaFecha(d, df)) {
      const tramos = h.tramos.map(t => `${minAHora(t.abre)}–${minAHora(t.cierra)}`).join(' y ');
      return `queda fuera de tu horario (${tramos})`;
    }
    return null;
  }

  /**
   * Comprobación AUTORITATIVA contra Supabase (no contra la memoria: una
   * cita editada desde la ficha puede estar fuera de la ventana cargada).
   * Si la consulta falla, LANZA: fallar cerrado, no se guarda a ciegas.
   */
  async function conflictosDe({ id, ini, fin }) {
    // Ninguna cita dura más de 600 min: nada que empiece antes de
    // ini-600min puede alcanzarnos. Cota inferior para usar el índice.
    // Se piden TODAS las citas del tramo (sin filtrar por profesional):
    // el duplicado de una misma clienta debe saltar aunque su otra cita
    // sea con otra profesional, y las citas sin asignar chocan con todas.
    const conProf = state.profesionales.length > 0; // la columna existe
    let q = db.from('citas')
      .select('id, clienta_id, inicio, duracion_min, estado, tratamiento' + (conProf ? ', profesional_id' : ''))
      .in('estado', ESTADOS_QUE_OCUPAN)
      .gte('inicio', new Date(ini - 600 * 60000).toISOString())
      .lt('inicio', new Date(fin).toISOString());
    if (id) q = q.neq('id', id); // nunca .neq con undefined: PostgREST da 400
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).filter(c => {
      const cIni = new Date(c.inicio).getTime();
      return solapan(ini, fin, cIni, cIni + (c.duracion_min || 60) * 60000);
    });
  }

  // ─── Modal: CITA ─────────────────────────────────────────
  function abrirCita(id) {
    const c = state.citas.find(x => x.id === id);
    if (c) modalCita(c);
    else { // viene del histórico de la ficha, fuera del rango cargado
      db.from('citas').select('*').eq('id', id).single()
        .then(({ data, error }) => {
          if (data) modalCita(data);
          else if (error) toast('No se pudo abrir la cita. Revisa la conexión.');
        });
    }
  }

  function modalCita(cita, clientaIdPre, prellenado) {
    const esNueva = !cita;
    const cid = cita ? cita.clienta_id : (clientaIdPre || '');
    const fecha = cita ? inputFecha(new Date(cita.inicio))
      : (prellenado && prellenado.fecha) || inputFecha(state.fecha);
    const hora = cita ? inputHora(cita.inicio)
      : (prellenado && prellenado.hora) || '10:00';

    // Acciones del día: solo tienen sentido cuando la cita ya toca.
    // Marcar la llegada de una cita de la semana que viene sería un error.
    const yaToca = cita && new Date(cita.inicio) <= new Date(Date.now() + 3600000);
    let acciones = '';
    if (cita && cita.estado === 'programada' && yaToca) {
      acciones = `
        <div class="acciones-hoy">
          <p><strong>¿Ha venido?</strong></p>
          <div class="fila">
            <button class="btn btn-dark" id="a-llego">Ha llegado</button>
            <button class="btn btn-outline" id="a-noasistio">No se presentó</button>
          </div>
        </div>`;
    } else if (cita && cita.estado === 'en_curso') {
      acciones = `
        <div class="acciones-hoy">
          <p><strong>En cabina ahora mismo.</strong> Al terminar, revisa el precio y las notas y ciérrala.</p>
          <div class="fila">
            <button class="btn btn-dark" id="a-finalizar">Finalizar tratamiento</button>
          </div>
        </div>`;
    }

    abrirModal(esNueva ? 'Nueva cita' : 'Cita', acciones + `
      <div class="field">
        <label for="f-buscar-cli">Cliente *</label>
        <input id="f-buscar-cli" autocomplete="off" placeholder="Escribe un nombre o teléfono…"
               value="${cid ? esc(nombreCompleto(clientaDe(cid) || {})) : ''}">
        <input type="hidden" id="f-clienta" value="${esc(cid)}">
        <div class="picker" id="f-lista-cli" hidden></div>
      </div>
      ${state.profesionales.filter(p => p.activo).length > 1 ? `
      <div class="field">
        <label for="f-profesional">Quién lo realiza *</label>
        <select id="f-profesional">
          ${(() => {
            const activos = state.profesionales.filter(p => p.activo);
            // Si la cita es de una profesional de baja, se mantiene su
            // opción marcada: editar el precio no debe reasignarla.
            const deBaja = cita && cita.profesional_id
              && !activos.some(p => p.id === cita.profesional_id)
              && profesionalDe(cita.profesional_id);
            return (deBaja ? [`<option value="${deBaja.id}" selected>${esc(deBaja.nombre)} (baja)</option>`] : [])
              .concat(activos.map(p =>
                `<option value="${p.id}"${cita && cita.profesional_id === p.id ? ' selected' : ''}>${esc(p.nombre)}</option>`))
              .join('');
          })()}
        </select>
      </div>` : ''}
      <div class="field">
        <label for="f-trat">Tratamiento</label>
        <select id="f-trat">
          <option value="">— Sin especificar —</option>
          ${state.tratamientos.filter(t => t.activo).map(t =>
            `<option value="${t.id}"${cita && cita.tratamiento_id === t.id ? ' selected' : ''}>${esc(t.nombre)}</option>`).join('')}
          ${(() => {
            // Cita con un tratamiento hoy dado de baja: se conserva su
            // opción marcada, que editar el precio no borre el tratamiento.
            const t = cita && cita.tratamiento_id
              && !state.tratamientos.some(x => x.activo && x.id === cita.tratamiento_id)
              && state.tratamientos.find(x => x.id === cita.tratamiento_id);
            return t ? `<option value="${t.id}" selected>${esc(t.nombre)} (baja)</option>` : '';
          })()}
          <option value="__otro"${cita && !cita.tratamiento_id && cita.tratamiento ? ' selected' : ''}>Otro (escribirlo a mano)…</option>
        </select>
      </div>
      <div class="field" id="f-trat-libre-wrap"${cita && !cita.tratamiento_id && cita.tratamiento ? '' : ' hidden'}>
        <label for="f-trat-libre">Nombre del tratamiento</label>
        <input id="f-trat-libre" autocomplete="off" placeholder="Escribe el tratamiento…"
               value="${esc(cita && !cita.tratamiento_id ? cita.tratamiento || '' : '')}">
      </div>
      <div class="ultima-sesion" id="f-ultima" hidden></div>
      <div class="ultima-sesion ultima-sesion--bono" id="f-bono" hidden></div>
      <div class="field-row">
        <div class="field"><label for="f-fecha">Fecha *</label><input type="date" id="f-fecha" value="${fecha}" required></div>
        <div class="field"><label for="f-hora">Hora *</label><input type="time" id="f-hora" value="${hora}" step="300" required></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="f-dur">Duración (min)</label><input type="number" id="f-dur" min="5" step="5" value="${cita ? cita.duracion_min : 60}"></div>
        <div class="field"><label for="f-precio">Precio (€)</label><input type="number" id="f-precio" min="0" step="0.01" value="${cita && cita.precio !== null ? cita.precio : ''}"></div>
      </div>
      <div class="fhuecos" id="f-huecos" hidden></div>
      ${!esNueva ? `
      <div class="field">
        <label for="f-estado">Estado</label>
        <select id="f-estado">
          ${['programada', 'en_curso', 'completada', 'cancelada', 'no_asistio'].map(e =>
            `<option value="${e}"${cita.estado === e ? ' selected' : ''}>${etiquetaEstado(e)}</option>`).join('')}
        </select>
      </div>` : ''}
      <div class="field">
        <label for="f-notas">Notas de la sesión</label>
        <textarea id="f-notas" placeholder="Parámetros usados, incidencias, evolución…">${esc(cita ? cita.notas || '' : '')}</textarea>
      </div>
      ${!esNueva ? `
      <div class="field">
        <label>Fotos de la sesión</label>
        <div class="fotos-grid" id="f-fotos"></div>
        <p id="f-fotos-aviso" class="fotos-nota" hidden>⚠️ En su último consentimiento firmado <b>no autorizó fotografías</b>. Mejor no hacerlas, o pedirle una firma nueva que sí las autorice.</p>
        <input type="file" id="f-foto-input" accept="image/*" multiple hidden>
      </div>` : ''}
      <div class="modal-actions">
        <button class="btn btn-dark" id="f-guardar">Guardar</button>
        ${esNueva || cita.estado === 'programada'
          ? '<button class="btn btn-accent" id="f-guardar-wa">Guardar y avisar</button>' : ''}
        ${!esNueva ? '<button class="btn btn-danger" id="f-borrar">Eliminar</button>' : ''}
      </div>`);

    function profesionalElegido() {
      const sel = $('f-profesional');
      return sel ? sel.value : (state.profesionalActivo || null);
    }

    /** Muestra las notas de la ÚLTIMA sesión de este mismo tratamiento:
     *  "¿con qué parámetros la traté la última vez?" sin buscar nada. */
    let _ultimaPedida = 0;
    async function pintarUltimaSesion() {
      const box = $('f-ultima');
      const nb = $('f-bono');
      if (!box) return;
      const cliId = $('f-clienta').value;
      const tratId = $('f-trat').value;
      const libre = tratId === '__otro' ? $('f-trat-libre').value.trim() : '';
      if (!cliId || !tratId || (tratId === '__otro' && !libre)) {
        box.hidden = true;
        if (nb) nb.hidden = true;
        return;
      }
      const peticion = ++_ultimaPedida;
      let q = db.from('citas').select('inicio, notas, precio')
        .eq('clienta_id', cliId)
        .in('estado', ['completada', 'en_curso'])
        .order('inicio', { ascending: false }).limit(1);
      // Con tratamiento a mano se busca por nombre (sin distinguir mayúsculas)
      q = tratId === '__otro' ? q.ilike('tratamiento', libre) : q.eq('tratamiento_id', tratId);
      if (!esNueva) q = q.neq('id', cita.id);
      const { data, error } = await q;
      if (peticion !== _ultimaPedida) return; // llegó tarde: ya se pidió otra

      // ¿Tiene bono activo que cubra este tratamiento? (si el SQL está)
      if (nb) {
        nb.hidden = true;
        const { data: bs, error: eB } = await db.from('bonos')
          .select('*').eq('clienta_id', cliId);
        if (peticion !== _ultimaPedida) return;
        if (!eB && bs && bs.length) {
          const { data: us } = await db.from('bono_usos')
            .select('bono_id').eq('clienta_id', cliId);
          if (peticion !== _ultimaPedida) return;
          const cuenta = {};
          (us || []).forEach(x => { cuenta[x.bono_id] = (cuenta[x.bono_id] || 0) + 1; });
          const b = bs.find(x =>
            (x.sesiones_total - (cuenta[x.id] || 0)) > 0 &&
            (!x.tratamiento_id || x.tratamiento_id === tratId));
          if (b) {
            nb.hidden = false;
            nb.innerHTML = `<b>🎟️ TIENE BONO ACTIVO</b> · ${esc(b.nombre)} · quedan <b>${b.sesiones_total - (cuenta[b.id] || 0)}</b>
              <p>Al marcar «Ha llegado» la agenda ofrecerá descontar la sesión.</p>`;
          }
        }
      }

      const u = !error && data && data[0];
      const t = tratId !== '__otro' ? state.tratamientos.find(x => x.id === tratId) : null;
      if (!u) {
        // Sin ninguna sesión previa: si el tratamiento exige prueba en
        // zona, que quien agenda lo vea. Avisa, no bloquea: esta cita
        // puede ser precisamente la de la prueba.
        if (!error && t && t.requiere_prueba) {
          box.hidden = false;
          box.className = 'ultima-sesion ultima-sesion--aviso';
          box.innerHTML = `<b>⚠️ PRIMERA VEZ · REQUIERE PRUEBA PREVIA</b>
            <p>No consta ninguna sesión de ${esc(t.nombre)} en su historial. Este tratamiento necesita prueba previa en zona (24–48 h antes): comprueba que la tiene hecha, o agenda primero la prueba.</p>`;
          return;
        }
        box.hidden = true;
        box.className = 'ultima-sesion';
        return;
      }
      box.hidden = false;
      box.className = 'ultima-sesion';
      box.innerHTML = `<b>ÚLTIMA SESIÓN DE ESTE TRATAMIENTO</b> · ${fmtFechaCorta(u.inicio)}${u.precio ? ' · ' + fmtPrecio(u.precio) : ''}
        <p>${u.notas ? esc(u.notas) : 'Sin notas registradas aquel día.'}</p>`;
    }

    // ── Buscador de clientes: filtra según se escribe ──
    const inpCli = $('f-buscar-cli'), listaCli = $('f-lista-cli'), hidCli = $('f-clienta');
    function pintarLista(q) {
      const t = (q || '').toLowerCase().trim();
      const res = state.clientas.filter(c =>
        !t || nombreCompleto(c).toLowerCase().includes(t) || (c.telefono || '').includes(t)
      ).slice(0, 8);
      if (!res.length) {
        listaCli.innerHTML = '<div class="picker-vacio">Sin coincidencias</div>';
      } else {
        listaCli.innerHTML = res.map(c => `
          <button type="button" class="picker-item" data-id="${c.id}">
            <span>${esc(nombreCompleto(c))}</span>
            <small>${esc(c.telefono || 'sin teléfono')}</small>
          </button>`).join('');
      }
      listaCli.hidden = false;
      listaCli.querySelectorAll('.picker-item').forEach(b =>
        b.addEventListener('click', () => {
          const c = clientaDe(b.dataset.id);
          hidCli.value = c.id;
          inpCli.value = nombreCompleto(c);
          listaCli.hidden = true;
          pintarUltimaSesion();
        }));
    }
    inpCli.addEventListener('input', () => { hidCli.value = ''; pintarLista(inpCli.value); });
    inpCli.addEventListener('focus', () => { if (!hidCli.value) pintarLista(inpCli.value); });
    // Registrado en el documento pero RETIRADO al cerrar el modal: antes
    // se quedaba vivo para siempre, uno por cada formulario abierto.
    const cerrarLista = (ev) => {
      if (listaCli && !listaCli.contains(ev.target) && ev.target !== inpCli) listaCli.hidden = true;
    };
    document.addEventListener('click', cerrarLista);
    alCerrarModal(() => document.removeEventListener('click', cerrarLista));

    // Al elegir tratamiento, rellenar duración y precio por defecto
    $('f-trat').addEventListener('change', () => {
      const val = $('f-trat').value;
      $('f-trat-libre-wrap').hidden = val !== '__otro';
      pintarUltimaSesion();
      if (val === '__otro') { $('f-trat-libre').focus(); return; }
      const t = state.tratamientos.find(x => x.id === val);
      if (!t) return;
      $('f-dur').value = t.duracion_min;
      if (t.precio !== null && !$('f-precio').value) $('f-precio').value = t.precio;
    });
    $('f-trat-libre').addEventListener('change', pintarUltimaSesion);
    pintarUltimaSesion(); // al abrir una cita existente, directamente

    // ── Huecos libres del día elegido, según duración y horario ──
    let _huecosPedidos = 0;
    async function pintarHuecos() {
      const box = $('f-huecos');
      if (!box) return;
      const fecha = $('f-fecha').value;
      const dur = Math.round(Number($('f-dur').value)) || 60;
      if (!fecha) { box.hidden = true; return; }
      const peticion = ++_huecosPedidos;
      const d0 = new Date(aISO(fecha, '00:00'));
      const { data, error } = await db.from('citas')
        .select('id, inicio, duracion_min, estado')
        .gte('inicio', d0.toISOString()).lt('inicio', addDias(d0, 1).toISOString());
      if (peticion !== _huecosPedidos) return; // llegó tarde
      if (error) { box.hidden = true; return; }
      const h = horarioDe(d0.getDay());
      box.hidden = false;
      // "Más días": presente en todas las variantes del recuadro
      const masDias = `<div style="margin-top:6px"><button type="button" class="btn btn-ghost btn-sm" id="fh-mas">Buscar hueco en los próximos días</button></div><div id="fh-lista"></div>`;
      const pieMas = () => {
        if ($('fh-mas')) $('fh-mas').addEventListener('click', ampliarHuecos);
      };
      const etiquetaDia = `${DIAS[d0.getDay()]} ${d0.getDate()} · ${fmtFechaCorta(d0)}`;
      if (!h.activo) {
        box.innerHTML = `<span class="fhuecos-nota">El ${etiquetaDia} está cerrado según tu horario (puedes agendar igualmente).</span>` + masDias;
        pieMas();
        return;
      }
      const props = propuestasDe(huecosLibresDe(d0, data || [], dur), dur);
      if (!props.length) {
        box.innerHTML = `<span class="fhuecos-nota">El ${etiquetaDia} no tiene hueco de ${dur} min dentro de tu horario.</span>` + masDias;
        pieMas();
        return;
      }
      const visibles = props.slice(0, 12);
      box.innerHTML = `<span class="fhuecos-tit">Huecos del ${etiquetaDia} (el día elegido arriba):</span>` +
        visibles.map(x =>
          `<button type="button" class="fhueco" data-hueco="${minAHora(x.ini)}">${minAHora(x.ini)}–${minAHora(x.fin)}</button>`).join('') +
        (props.length > visibles.length ? `<span class="fhuecos-nota"> +${props.length - visibles.length} más</span>` : '') +
        masDias;
      box.querySelectorAll('[data-hueco]').forEach(b =>
        b.addEventListener('click', () => {
          $('f-hora').value = b.dataset.hueco;
          quitarAviso();
        }));
      pieMas();
    }

    /** Huecos de UN día que aguantan la duración pedida. Si el día es
     *  hoy, lo ya pasado de hora no se ofrece. */
    function huecosLibresDe(dia, citasDia, dur) {
      const h = horarioDe(dia.getDay());
      if (!h.activo) return [];
      const ocupantes = citasDia
        .filter(c => ESTADOS_QUE_OCUPAN.includes(c.estado)
          && (esNueva || c.id !== cita.id)
          && mismaFecha(new Date(c.inicio), dia))
        .map(c => {
          const ini = minutosDe(c.inicio);
          return { ini, fin: Math.min(ini + (c.duracion_min || 60), 24 * 60) };
        });
      const ahora = new Date();
      if (mismaFecha(dia, ahora)) {
        // Redondeado al cuarto de hora siguiente, para no proponer "ya"
        ocupantes.push({ ini: 0, fin: Math.ceil((ahora.getHours() * 60 + ahora.getMinutes()) / 15) * 15 });
      }
      return huecosDe(ocupantes, h).filter(x => x.fin - x.ini >= dur);
    }

    /** Trocea los huecos en citas concretas del tamaño del tratamiento:
     *  un hueco de 9:30–14:00 con 60 min se ofrece como 9:30–10:30,
     *  10:30–11:30… y, si sobra un pico, también el último que apura el
     *  cierre (13:00–14:00). */
    function propuestasDe(huecos, dur) {
      const props = [];
      for (const hgap of huecos) {
        for (let t = hgap.ini; t + dur <= hgap.fin; t += dur) {
          props.push({ ini: t, fin: t + dur });
        }
        const ultimo = hgap.fin - dur;
        if (ultimo > hgap.ini && (ultimo - hgap.ini) % dur !== 0) {
          props.push({ ini: ultimo, fin: hgap.fin });
        }
      }
      return props;
    }

    /** La semana de un vistazo: huecos de los próximos 14 días que
     *  aguantan la duración. Un toque fija fecha y hora a la vez. */
    async function ampliarHuecos() {
      const dur = Math.round(Number($('f-dur').value)) || 60;
      const base = $('f-fecha').value ? new Date(aISO($('f-fecha').value, '00:00')) : hoy();
      const desde = base < hoy() ? hoy() : base;
      const btn = $('fh-mas');
      if (btn) { btn.disabled = true; btn.textContent = 'Buscando…'; }
      const { data, error } = await db.from('citas')
        .select('id, inicio, duracion_min, estado')
        .gte('inicio', desde.toISOString()).lt('inicio', addDias(desde, 14).toISOString());
      if (error) {
        if (btn) { btn.disabled = false; btn.textContent = 'Buscar hueco en los próximos días'; }
        toast('No se han podido consultar los próximos días');
        return;
      }
      let html = '', diasCon = 0;
      for (let i = 0; i < 14 && diasCon < 6; i++) {
        const dia = addDias(desde, i);
        // El día elegido ya tiene sus huecos arriba: aquí, solo los demás
        if (mismaFecha(dia, new Date(aISO($('f-fecha').value || inputFecha(desde), '00:00')))) continue;
        const props = propuestasDe(huecosLibresDe(dia, data || [], dur), dur);
        if (!props.length) continue;
        diasCon++;
        html += `<div class="fhuecos-dia">${DIAS[dia.getDay()]} ${dia.getDate()} · ${fmtFechaCorta(dia)}</div>` +
          props.slice(0, 5).map(x =>
            `<button type="button" class="fhueco" data-fdia="${inputFecha(dia)}" data-fhora="${minAHora(x.ini)}">${minAHora(x.ini)}–${minAHora(x.fin)}</button>`).join('') +
          (props.length > 5 ? `<span class="fhuecos-nota"> +${props.length - 5} más eligiendo ese día</span>` : '');
      }
      const cont = $('fh-lista');
      if (!cont) return;
      cont.innerHTML = html
        ? '<div class="fhuecos-cab">Otros días con hueco · toca para fijar fecha y hora:</div>' + html
        : `<span class="fhuecos-nota">Sin más huecos de ${dur} min en los próximos 14 días. Prueba con otra duración.</span>`;
      cont.querySelectorAll('[data-fdia]').forEach(b =>
        b.addEventListener('click', () => {
          $('f-fecha').value = b.dataset.fdia;
          $('f-hora').value = b.dataset.fhora;
          quitarAviso();
          pintarHuecos(); // repinta con el día recién elegido
        }));
      if (btn) btn.remove();
    }

    $('f-fecha').addEventListener('input', pintarHuecos);
    $('f-dur').addEventListener('input', pintarHuecos);
    pintarHuecos();

    function pintarAviso(html) {
      let panel = $('f-aviso');
      if (!panel) {
        panel = document.createElement('div');
        panel.id = 'f-aviso';
        panel.className = 'aviso-solape';
        const acciones = document.querySelector('#modal-body .modal-actions');
        acciones.parentNode.insertBefore(panel, acciones);
      }
      panel.innerHTML = html;
      panel.scrollIntoView({ block: 'nearest' });
    }
    function quitarAviso() { const p = $('f-aviso'); if (p) p.remove(); }

    async function guardar(avisar, forzar) {
      const clientaId = $('f-clienta').value;
      if (!clientaId) return toast('Elige un cliente');
      if (!$('f-fecha').value || !$('f-hora').value) return toast('Falta la fecha o la hora');

      const v = validarCita($('f-fecha').value, $('f-hora').value, $('f-dur').value);
      if (v.error) return toast(v.error);

      const botones = [$('f-guardar'), $('f-guardar-wa')].filter(Boolean);
      botones.forEach(b => { b.disabled = true; });
      try {
        // ── Comprobación de choques (autoritativa), salvo que fuerce ──
        if (!forzar) {
          let lista;
          try {
            lista = await conflictosDe({
              id: esNueva ? null : cita.id,
              ini: v.ini, fin: v.fin
            });
          } catch (e) {
            toast('No se ha podido comprobar si hay choque. Revisa la conexión.');
            return;
          }
          const prof = profesionalElegido();
          // Choque real: misma profesional, o cita sin asignar (choca con todas)
          const choques = lista.filter(c =>
            !prof || c.profesional_id == null || c.profesional_id === prof);
          const fuera = fueraDeHorario(v.ini, v.fin);
          const notaFuera = fuera
            ? `<p class="aviso-nota">Además, la cita ${fuera}. Puedes guardarla igual.</p>` : '';

          const mismaPersona = lista.filter(c => c.clienta_id === clientaId);
          if (mismaPersona.length) {
            const c0 = mismaPersona[0];
            pintarAviso(`
              <b>Ya tiene cita ese día</b>
              <p>${esc(clienteNombre(clientaId))} ya tiene cita a las ${fmtHora(c0.inicio)}
              (${esc(c0.tratamiento || 'sin tratamiento')}). ¿Seguro que no es un duplicado?</p>
              ${notaFuera}
              <div class="fila">
                <button type="button" class="btn btn-dark btn-sm" id="av-abrir">Abrir la cita que ya tiene</button>
                <button type="button" class="btn btn-ghost btn-sm" id="av-forzar">Crear otra igualmente</button>
              </div>`);
            $('av-abrir').addEventListener('click', () => { quitarAviso(); abrirCita(c0.id); });
            $('av-forzar').addEventListener('click', () => { quitarAviso(); guardar(avisar, true); });
            return;
          }
          if (choques.length) {
            const desc = choques.length === 1
              ? `Se pisa con <b>${esc(clienteNombre(choques[0].clienta_id))}</b>
                 · ${esc(choques[0].tratamiento || 'sin tratamiento')},
                 de ${fmtHora(choques[0].inicio)} a ${fmtHora(new Date(finDe(choques[0])).toISOString())}.`
              : `Se pisa con ${choques.length} citas: ` + choques.map(c =>
                  `${esc(clienteNombre(c.clienta_id))} (${fmtHora(c.inicio)})`).join(' y ') + '.';
            pintarAviso(`
              <b>Esa hora está ocupada</b>
              <p>${desc}</p>
              ${notaFuera}
              <div class="fila">
                <button type="button" class="btn btn-dark btn-sm" id="av-otra">Elegir otra hora</button>
                <button type="button" class="btn btn-ghost btn-sm" id="av-forzar">Guardar igualmente (se solapan)</button>
              </div>`);
            $('av-otra').addEventListener('click', () => { quitarAviso(); $('f-hora').focus(); });
            $('av-forzar').addEventListener('click', () => { quitarAviso(); guardar(avisar, true); });
            return;
          }
          if (fuera) {
            pintarAviso(`
              <b>Fuera de horario</b>
              <p>La cita ${fuera}. No pasa nada: puedes guardarla igual.</p>
              <div class="fila">
                <button type="button" class="btn btn-dark btn-sm" id="av-guardar">Guardar de todos modos</button>
                <button type="button" class="btn btn-ghost btn-sm" id="av-otra">Cambiar la hora</button>
              </div>`);
            $('av-guardar').addEventListener('click', () => { quitarAviso(); guardar(avisar, true); });
            $('av-otra').addEventListener('click', () => { quitarAviso(); $('f-hora').focus(); });
            return;
          }
        }

        // ── Guardado real ──
        const sel = $('f-trat').value;
        const t = sel === '__otro' ? null : state.tratamientos.find(x => x.id === sel);
        const libre = sel === '__otro' ? $('f-trat-libre').value.trim() : '';
        const payload = {
          clienta_id: clientaId,
          tratamiento_id: t ? t.id : null,
          tratamiento: t ? t.nombre : (libre || null),
          inicio: new Date(v.ini).toISOString(),
          duracion_min: v.dur,
          precio: $('f-precio').value === '' ? null : Number($('f-precio').value),
          notas: $('f-notas').value.trim() || null
        };
        if (!esNueva) payload.estado = $('f-estado').value;
        const prof = profesionalElegido();
        if (prof) payload.profesional_id = prof;

        const q = esNueva
          ? db.from('citas').insert(payload).select().single()
          : db.from('citas').update(payload).eq('id', cita.id).select().single();
        const { data, error } = await q;
        if (error) { toast('No se pudo guardar: ' + error.message); return; }
        await cargarCitas();
        render();
        if (avisar) {
          panelWhatsApp(data, esNueva ? 'Cita creada ✓' : 'Cita actualizada ✓');
        } else {
          cerrarModal();
          toast(esNueva ? 'Cita creada' : 'Cita actualizada');
        }
      } finally {
        botones.forEach(b => { b.disabled = false; });
      }
    }

    $('f-guardar').addEventListener('click', () => guardar(false, false));
    // Solo existe en citas nuevas o aún programadas: avisar por WhatsApp
    // de una cita en cabina o ya cerrada no tiene sentido.
    if ($('f-guardar-wa')) $('f-guardar-wa').addEventListener('click', () => guardar(true, false));

    // Al cambiar hora, fecha o duración, el aviso anterior deja de valer
    ['f-fecha', 'f-hora', 'f-dur'].forEach(id =>
      $(id).addEventListener('input', quitarAviso));

    if ($('a-llego')) $('a-llego').addEventListener('click', () => iniciarTratamiento(cita));
    if ($('a-noasistio')) $('a-noasistio').addEventListener('click', () => marcarNoAsistio(cita));
    if ($('a-finalizar')) $('a-finalizar').addEventListener('click', () => finalizarTratamiento(cita));

    if ($('f-fotos')) montarSeccionFotos(cita);

    if (!esNueva) {
      $('f-borrar').addEventListener('click', async () => {
        if (!confirm('¿Eliminar esta cita? No se puede deshacer.\n\nSi la clienta ha avisado de que no viene, es mejor marcarla como "Cancelada": así queda constancia en su histórico.')) return;
        await borrarArchivosFotos('cita_id', cita.id); // sus fotos, del bucket
        const { error } = await db.from('citas').delete().eq('id', cita.id);
        if (error) { toast('No se pudo eliminar'); return; }
        cerrarModal(); await cargarCitas(); render(); toast('Cita eliminada');
      });
    }
  }

  // ─── Modal: CLIENTA ──────────────────────────────────────
  function modalClienta(cl) {
    const esNueva = !cl;
    abrirModal(esNueva ? 'Nuevo cliente' : 'Editar ficha', `
      <div class="field-row">
        <div class="field"><label for="c-nombre">Nombre *</label><input id="c-nombre" value="${esc(cl ? cl.nombre : '')}" required></div>
        <div class="field"><label for="c-apellidos">Apellidos</label><input id="c-apellidos" value="${esc(cl ? cl.apellidos || '' : '')}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="c-tel">Teléfono</label><input id="c-tel" type="tel" value="${esc(cl ? cl.telefono || '' : '')}"></div>
        <div class="field"><label for="c-nac">Nacimiento</label><input id="c-nac" type="date" value="${cl && cl.fecha_nacimiento ? cl.fecha_nacimiento : ''}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="c-email">Email</label><input id="c-email" type="email" value="${esc(cl ? cl.email || '' : '')}"></div>
        <div class="field"><label for="c-dni">DNI / NIE <small>(para facturar)</small></label><input id="c-dni" autocomplete="off" value="${esc(cl ? cl.dni || '' : '')}"></div>
      </div>
      <div class="field">
        <label for="c-direccion">Dirección <small>(calle, nº, CP y población · para facturar)</small></label>
        <input id="c-direccion" autocomplete="off" value="${esc(cl ? cl.direccion || '' : '')}">
      </div>
      <div class="field">
        <label for="c-contra">Contraindicaciones, alergias y medicación</label>
        <textarea id="c-contra" placeholder="Embarazo, marcapasos, fotosensibilizantes, alergias, fototipo…">${esc(cl ? cl.contraindicaciones || '' : '')}</textarea>
        <p style="font-size:11.5px;color:var(--muted);margin-top:5px">
          Son datos de salud: anota solo lo necesario para un tratamiento seguro.
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
      $('c-guardar').disabled = true;
      try {
      const payload = {
        nombre,
        apellidos: $('c-apellidos').value.trim() || null,
        telefono: $('c-tel').value.trim() || null,
        email: $('c-email').value.trim() || null,
        dni: $('c-dni').value.trim().toUpperCase() || null,
        direccion: $('c-direccion').value.trim() || null,
        fecha_nacimiento: $('c-nac').value || null,
        contraindicaciones: $('c-contra').value.trim() || null,
        notas: $('c-notas').value.trim() || null
      };
      const guardarCon = (p) => esNueva
        ? db.from('clientas').insert(p).select().single()
        : db.from('clientas').update(p).eq('id', cl.id).select().single();
      let { data, error } = await guardarCon(payload);
      if (error && /dni|direccion/.test(error.message)) {
        // Aún no se ha ejecutado agenda-dni.sql: se guarda la ficha sin
        // esos dos campos para no bloquear el alta, y se avisa.
        const sinFacturacion = { ...payload };
        delete sinFacturacion.dni;
        delete sinFacturacion.direccion;
        ({ data, error } = await guardarCon(sinFacturacion));
        if (!error && (payload.dni || payload.direccion)) {
          toast('Guardado SIN DNI/dirección: ejecuta supabase/agenda-dni.sql para activarlos');
        }
      }
      if (error) { toast('No se pudo guardar: ' + error.message); return; }
      cerrarModal();
      await cargarClientas();
      if (esNueva) { state.clientaAbierta = data.id; irA('ficha'); }
      else render();
      toast(esNueva ? 'Cliente dado de alta' : 'Ficha actualizada');
      } finally { const b = $('c-guardar'); if (b) b.disabled = false; }
    });

    if (!esNueva) {
      $('c-borrar').addEventListener('click', async () => {
        if (!confirm(`¿Eliminar la ficha de ${nombreCompleto(cl)}?\n\nSe borrarán también TODAS sus citas y su histórico. Esta acción no se puede deshacer.`)) return;
        // Derecho de supresión de verdad: también las imágenes de firma
        // del bucket (la fila cae en cascada, el archivo no).
        try {
          const { data: archivos } = await db.storage.from('consentimientos')
            .list(cl.id, { limit: 100 });
          if (archivos && archivos.length) {
            await db.storage.from('consentimientos')
              .remove(archivos.map(a => cl.id + '/' + a.name));
          }
        } catch (e) { /* si falla, la fila manda; el archivo queda sin referencia */ }
        try { await borrarArchivosFotos('clienta_id', cl.id); } catch (e) { /* ídem */ }
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
      <div class="field">
        <label for="t-consent">Consentimiento que se firma</label>
        <select id="t-consent">
          <option value="">— Ninguno —</option>
          ${state.plantillas.filter(p => p.activa).map(p =>
            `<option value="${p.id}"${t && t.consentimiento_id === p.id ? ' selected' : ''}>${esc(p.nombre)}</option>`).join('')}
        </select>
      </div>
      <label class="check-linea">
        <input type="checkbox" id="t-prueba"${t && t.requiere_prueba ? ' checked' : ''}>
        <span><b>Requiere prueba previa en zona</b> (p. ej. parche 24–48 h antes).
        Al agendarlo a alguien sin sesiones previas, la agenda avisará.</span>
      </label>
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
      $('t-guardar').disabled = true;
      try {
      const payload = {
        nombre,
        duracion_min: Number($('t-dur').value) || 60,
        precio: $('t-precio').value === '' ? null : Number($('t-precio').value),
        color: $('t-color').value,
        activo: $('t-activo').value === '1',
        consentimiento_id: $('t-consent').value || null,
        requiere_prueba: $('t-prueba').checked
      };
      const q = esNuevo
        ? db.from('tratamientos').insert(payload)
        : db.from('tratamientos').update(payload).eq('id', t.id);
      const { error } = await q;
      if (error) {
        toast(/requiere_prueba/.test(error.message)
          ? 'Falta ejecutar supabase/agenda-prueba-previa.sql en Supabase'
          : 'No se pudo guardar');
        return;
      }
      cerrarModal(); await cargarTratamientos(); render(); toast('Guardado');
      } finally { const b = $('t-guardar'); if (b) b.disabled = false; }
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

  // ─── Flujo del día: llegada → cabina → cierre ────────────
  /** Si el modal de cita está abierto, recoge precio y notas escritos:
   *  "Finalizar" pide revisar esos campos y antes los descartaba. */
  function datosDelFormulario() {
    const extras = {};
    const p = $('f-precio');
    if (p) extras.precio = p.value === '' ? null : Number(p.value);
    const n = $('f-notas');
    if (n) extras.notas = n.value.trim() || null;
    return extras;
  }

  async function cambiarEstado(cita, estado, extras) {
    const { error } = await db.from('citas')
      .update(Object.assign({ estado }, extras || {})).eq('id', cita.id);
    if (error) {
      // El fallo típico: falta ejecutar agenda-consentimientos.sql, que es
      // quien permite el estado 'en_curso' en la base de datos.
      const falta = /constraint|check/i.test(error.message || '');
      toast(falta
        ? 'Falta ejecutar agenda-consentimientos.sql en Supabase'
        : 'No se pudo actualizar: ' + (error.message || 'error desconocido'));
      return false;
    }
    await cargarCitas();
    return true;
  }

  async function marcarNoAsistio(cita) {
    if (!(await cambiarEstado(cita, 'no_asistio', datosDelFormulario()))) return;
    cerrarModal(); render();
    toast('Marcada como no presentada');
  }

  async function finalizarTratamiento(cita) {
    if (!(await cambiarEstado(cita, 'completada', datosDelFormulario()))) return;
    cerrarModal(); render();
    toast('Tratamiento finalizado');
    // Si tiene bono con sesiones para este tratamiento, preguntar ahora
    await ofrecerBono(cita);
  }

  /** La clienta ha llegado: si su tratamiento tiene consentimiento, se firma ahora. */
  async function iniciarTratamiento(cita) {
    const extras = datosDelFormulario(); // antes de que otro modal pise el formulario

    // ¿Hay otro tratamiento aún en cabina? Confirmación consciente, no
    // bloqueo: el solape real existe (una clienta en reposo mientras
    // entra la siguiente) y con dos profesionales es el día a día.
    const { data: abiertas } = await db.from('citas')
      .select('id, clienta_id, inicio').eq('estado', 'en_curso').neq('id', cita.id);
    if (abiertas && abiertas.length) {
      const quien = abiertas.map(x =>
        `${clienteNombre(x.clienta_id)} (desde las ${fmtHora(x.inicio)})`).join(', ');
      if (!confirm(`Todavía está en cabina: ${quien}.\n\n¿Empezar también con ${clienteNombre(cita.clienta_id)}?\n\nSi ya habías terminado con la persona anterior, cancela y finaliza su tratamiento primero (barra oscura de arriba).`)) return;
    }
    const trat = state.tratamientos.find(t => t.id === cita.tratamiento_id);
    // Solo cuentan las plantillas ACTIVAS: con todas inactivas se firmaba
    // un consentimiento con texto vacío (valor probatorio nulo).
    const activas = state.plantillas.filter(p => p.activa);
    const plantilla = trat && trat.consentimiento_id
      ? activas.find(p => p.id === trat.consentimiento_id)
      : null;

    // ¿Ya firmó para esta cita? No se pide dos veces.
    const { data: previo } = await db.from('consentimientos_firmados')
      .select('id').eq('cita_id', cita.id).maybeSingle();

    if (previo || !activas.length) {
      if (!(await cambiarEstado(cita, 'en_curso', extras))) return;
      cerrarModal(); render();
      toast(previo ? 'Ya tenía el consentimiento firmado' : 'Tratamiento iniciado');
      await ofrecerBono(cita); // ¿se paga con bono? mejor al entrar
      return;
    }
    modalConsentimiento(cita, plantilla, extras);
  }

  // ─── Consentimiento informado con firma ──────────────────
  function modalConsentimiento(cita, plantillaPre, extras) {
    const cl = clientaDe(cita.clienta_id);
    const opciones = state.plantillas.filter(p => p.activa);
    const sel = plantillaPre || opciones[0];

    abrirModal('Consentimiento informado', `
      <div class="field">
        <label for="k-plantilla">Documento a firmar</label>
        <select id="k-plantilla">
          ${opciones.map(p => `<option value="${p.id}"${sel && p.id === sel.id ? ' selected' : ''}>${esc(p.nombre)}</option>`).join('')}
        </select>
      </div>
      <p style="font-size:12.5px;color:var(--muted);margin-bottom:4px">
        Pásale la tablet para que lo lea y firme.
      </p>
      <p style="font-size:12.5px;margin-bottom:8px">
        <a href="#" id="k-remoto" style="color:var(--accent-dark);text-decoration:underline">¿Sin tablet a mano? Que lo firme desde su propio móvil (QR o WhatsApp)</a>
      </p>
      <div class="consent-texto" id="k-texto"></div>
      <div class="field">
        <label for="k-nombre">Nombre y apellidos de quien firma *</label>
        <input id="k-nombre" value="${esc(cl ? nombreCompleto(cl) : '')}">
      </div>
      <label class="check-linea">
        <input type="checkbox" id="k-fotos">
        <span>Autorizo que se tomen fotografías del tratamiento con fines de seguimiento clínico
        (opcional; marcarla no autoriza su publicación).</span>
      </label>
      <div class="field">
        <label>Firma</label>
        <div class="firma-wrap" id="k-wrap">
          <canvas id="firma-canvas"></canvas>
          <div class="firma-linea"></div>
          <div class="firma-hint">Firma aquí con el dedo o el lápiz</div>
        </div>
        <button class="btn btn-ghost btn-sm" id="k-limpiar" style="margin-top:6px">Borrar firma</button>
      </div>
      <div class="modal-actions">
        <button class="btn btn-dark" id="k-firmar">Firmar y empezar</button>
        <button class="btn btn-outline" id="k-saltar">Empezar sin firmar</button>
      </div>`);

    const pintarTexto = () => {
      const p = state.plantillas.find(x => x.id === $('k-plantilla').value);
      $('k-texto').textContent = p ? p.texto : '';
    };
    $('k-plantilla').addEventListener('change', pintarTexto);
    pintarTexto();

    // ── Lienzo de firma ──
    const canvas = $('firma-canvas');
    const wrap = $('k-wrap');
    const ctx = canvas.getContext('2d');
    let pintando = false, hayFirma = false;

    function ajustar() {
      const r = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = r.width * dpr;
      canvas.height = r.height * dpr;
      ctx.scale(dpr, dpr);
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#241D17';
    }
    setTimeout(ajustar, 30);
    // Si la tablet gira o cambia el tamaño, recalibrar SIN perder el trazo:
    // redimensionar un canvas lo borra, así que se salva y se repinta.
    const reajustar = () => {
      const previo = hayFirma ? canvas.toDataURL() : null;
      ajustar();
      if (previo) {
        const im = new Image();
        im.onload = () => {
          const r = canvas.getBoundingClientRect();
          ctx.drawImage(im, 0, 0, r.width, r.height);
        };
        im.src = previo;
      }
    };
    window.addEventListener('resize', reajustar);
    alCerrarModal(() => window.removeEventListener('resize', reajustar));
    // Una firma a medias no se tira por un roce fuera del panel
    protegerCierre(() => hayFirma ? '¿Cerrar sin guardar la firma?' : null);

    const punto = (e) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      pintando = true; hayFirma = true;
      wrap.classList.add('firmado');
      const p = punto(e); ctx.beginPath(); ctx.moveTo(p.x, p.y);
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!pintando) return;
      e.preventDefault();
      const p = punto(e); ctx.lineTo(p.x, p.y); ctx.stroke();
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev =>
      canvas.addEventListener(ev, () => { pintando = false; }));

    $('k-limpiar').addEventListener('click', () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      hayFirma = false; wrap.classList.remove('firmado');
    });

    // ── Guardar ──
    $('k-firmar').addEventListener('click', async () => {
      const nombre = $('k-nombre').value.trim();
      if (!nombre) return toast('Falta el nombre de quien firma');
      if (!hayFirma) return toast('Falta la firma');

      const p = state.plantillas.find(x => x.id === $('k-plantilla').value);
      if (!p) return toast('Elige el documento a firmar');
      const btn = $('k-firmar'); btn.disabled = true; btn.textContent = 'Guardando…';

      const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
      const ruta = `${cita.clienta_id}/${cita.id}-${Date.now()}.png`;
      const { error: eUp } = await db.storage.from('consentimientos')
        .upload(ruta, blob, { contentType: 'image/png', upsert: false });
      if (eUp) {
        btn.disabled = false; btn.textContent = 'Firmar y empezar';
        toast('No se pudo guardar la firma: ' + eUp.message);
        return;
      }

      const { error } = await db.from('consentimientos_firmados').insert({
        cita_id: cita.id,
        clienta_id: cita.clienta_id,
        plantilla_id: p.id,
        titulo: p.nombre,
        texto_firmado: p.texto,   // copia literal de lo firmado
        version: p.version,
        firma_path: ruta,
        firmante_nombre: nombre,
        acepta_fotos: $('k-fotos').checked
      });
      if (error) {
        // La imagen ya subió: retirarla para no dejar una firma huérfana
        // (dato personal sin fila que lo referencie).
        db.storage.from('consentimientos').remove([ruta]).then(() => {}, () => {});
        btn.disabled = false; btn.textContent = 'Firmar y empezar';
        toast('No se pudo registrar: ' + error.message);
        return;
      }
      const ok = await cambiarEstado(cita, 'en_curso', extras);
      cerrarModal(); render();
      if (ok) toast('Consentimiento firmado · tratamiento iniciado');
      // si falló, cambiarEstado ya mostró su error; la firma queda guardada
      await ofrecerBono(cita);
    });

    $('k-saltar').addEventListener('click', async () => {
      if (!confirm('¿Empezar sin consentimiento firmado?\n\nQuedará registrado que esta sesión no tiene consentimiento.')) return;
      if (!(await cambiarEstado(cita, 'en_curso', extras))) return;
      cerrarModal(); render(); toast('Tratamiento iniciado sin firma');
      await ofrecerBono(cita);
    });

    $('k-remoto').addEventListener('click', (e) => {
      e.preventDefault();
      const p = state.plantillas.find(x => x.id === $('k-plantilla').value);
      if (!p) return toast('Elige el documento a firmar');
      firmaRemota(cita, p, extras);
    });
  }

  /** Firma desde el dispositivo del cliente: token de un solo uso →
   *  QR en pantalla + envío por WhatsApp, y espera hasta que firme. */
  async function firmaRemota(cita, plantilla, extras) {
    const cl = clientaDe(cita.clienta_id);
    const { data: tok, error } = await db.from('firma_tokens')
      .insert({ cita_id: cita.id, plantilla_id: plantilla.id }).select().single();
    if (error) {
      toast('Para la firma a distancia hay que ejecutar supabase/agenda-firma-remota.sql');
      return;
    }
    const url = `${location.origin}/agenda/firmar/?t=${tok.token}`;
    const num = telWa(cl && cl.telefono);
    const wa = num ? `https://wa.me/${num}?text=${encodeURIComponent(
      `Hola ${cl.nombre}, aquí tienes el consentimiento de tu tratamiento en ${NEGOCIO.nombre}, para leerlo y firmarlo desde el móvil:\n${url}`)}` : null;

    abrirModal('Firma desde su móvil', `
      <p style="font-size:13.5px;color:var(--ink-soft);margin-bottom:12px">
        <b>${esc(plantilla.nombre)}</b> · ${esc(cl ? nombreCompleto(cl) : '')}.<br>
        Que escanee el código con la cámara del móvil, o envíaselo por
        WhatsApp. El enlace <b>caduca en 2 horas y solo sirve una vez</b>.
      </p>
      <div class="qr-caja" id="k-qr"></div>
      ${wa ? `<a class="btn btn-outline" style="width:100%;margin-top:12px" href="${wa}" target="_blank" rel="noopener">Enviar el enlace por WhatsApp</a>`
           : '<p class="fotos-nota">No tiene teléfono en la ficha: enséñale el código.</p>'}
      <p class="rec-espera" id="k-espera">Esperando la firma… esta ventana avisará sola.</p>
      <div class="modal-actions">
        <button class="btn btn-ghost" id="k-volver">Volver a la firma en tablet</button>
      </div>`);

    // QR generado en el propio navegador (sin enviar la URL a nadie)
    try {
      const qr = qrcode(0, 'M');
      qr.addData(url);
      qr.make();
      $('k-qr').innerHTML = qr.createImgTag(5, 10);
    } catch (e) {
      $('k-qr').innerHTML = `<p style="font-size:12px;word-break:break-all">${esc(url)}</p>`;
    }

    // Sondeo: en cuanto exista el consentimiento de esta cita, seguimos
    const timer = setInterval(async () => {
      const { data } = await db.from('consentimientos_firmados')
        .select('id').eq('cita_id', cita.id).maybeSingle();
      if (!data) return;
      clearInterval(timer);
      const ok = await cambiarEstado(cita, 'en_curso', extras);
      cerrarModal(); render();
      toast(ok ? 'Consentimiento firmado · tratamiento iniciado'
               : 'Consentimiento firmado (no se pudo iniciar la cita)');
      await ofrecerBono(cita);
    }, 4000);
    alCerrarModal(() => clearInterval(timer));

    $('k-volver').addEventListener('click', () => {
      clearInterval(timer);
      modalConsentimiento(cita, plantilla, extras);
    });
  }

  /** Muestra un consentimiento ya firmado (texto + imagen de la firma). */
  async function verConsentimiento(id) {
    const { data: c, error } = await db.from('consentimientos_firmados')
      .select('*').eq('id', id).single();
    if (error || !c) return toast('No se pudo abrir el consentimiento');

    let img = '';
    if (c.firma_path) {
      const { data: s } = await db.storage.from('consentimientos')
        .createSignedUrl(c.firma_path, 300);
      if (s) img = `<img class="firma-img" src="${s.signedUrl}" alt="Firma de ${esc(c.firmante_nombre)}">`;
    } else if (c.firma_data && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(c.firma_data)) {
      // Firma hecha desde el móvil del cliente: imagen embebida
      img = `<img class="firma-img" src="${c.firma_data}" alt="Firma de ${esc(c.firmante_nombre)}">`;
    }
    abrirModal('Consentimiento firmado', `
      <p style="font-size:13px;color:var(--muted);margin-bottom:10px">
        <strong>${esc(c.titulo)}</strong><br>
        Firmado por ${esc(c.firmante_nombre)} el ${fmtFechaCorta(c.firmado_at)} a las ${fmtHora(c.firmado_at)}
        ${c.acepta_fotos ? '<br>Autorizó fotografías de seguimiento' : ''}
      </p>
      <div class="consent-texto" style="max-height:44vh">${esc(c.texto_firmado)}</div>
      ${img}`);
  }

  // ─── Bonos de sesiones ───────────────────────────────────
  // Paquetes prepagados. Cada sesión gastada queda registrada CON LA
  // FIRMA de la clienta: ante cualquier duda se le enseñan sus usos
  // firmados con fecha y hora, y no hay confusión posible.

  function modalNuevoBono(cl) {
    abrirModal('Nuevo bono', `
      <p style="font-size:13px;color:var(--muted);margin-bottom:12px">
        Paquete de sesiones pagado por adelantado para <b>${esc(nombreCompleto(cl))}</b>.
      </p>
      <div class="field">
        <label for="b-trat">Tratamiento</label>
        <select id="b-trat">
          <option value="">Cualquier tratamiento</option>
          ${state.tratamientos.filter(t => t.activo).map(t =>
            `<option value="${t.id}">${esc(t.nombre)}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label for="b-nombre">Nombre del bono *</label>
        <input id="b-nombre" placeholder="Ej.: Bono 5 sesiones láser">
      </div>
      <div class="field-row">
        <div class="field"><label for="b-sesiones">Nº de sesiones *</label>
          <input id="b-sesiones" type="number" min="1" max="100" step="1" value="5"></div>
        <div class="field"><label for="b-precio">Precio total (€)</label>
          <input id="b-precio" type="number" min="0" step="0.01"></div>
      </div>
      <div class="field">
        <label for="b-fecha">Fecha de compra</label>
        <input id="b-fecha" type="date" value="${inputFecha(new Date())}">
      </div>
      <div class="modal-actions">
        <button class="btn btn-dark" id="b-guardar">Crear bono</button>
      </div>`);

    // Nombre sugerido al elegir tratamiento (solo si no lo ha escrito ya)
    $('b-trat').addEventListener('change', () => {
      const t = state.tratamientos.find(x => x.id === $('b-trat').value);
      const n = $('b-nombre');
      if (t && (!n.value.trim() || n.dataset.auto === '1')) {
        n.value = `Bono ${$('b-sesiones').value || 5} sesiones · ${t.nombre}`;
        n.dataset.auto = '1';
      }
    });
    $('b-nombre').addEventListener('input', () => { $('b-nombre').dataset.auto = ''; });

    $('b-guardar').addEventListener('click', async () => {
      const nombre = $('b-nombre').value.trim();
      const sesiones = parseInt($('b-sesiones').value, 10);
      if (!nombre) return toast('Ponle nombre al bono');
      if (!(sesiones >= 1 && sesiones <= 100)) return toast('Revisa el número de sesiones');
      const btn = $('b-guardar'); btn.disabled = true;
      const { error } = await db.from('bonos').insert({
        clienta_id: cl.id,
        tratamiento_id: $('b-trat').value || null,
        nombre,
        sesiones_total: sesiones,
        precio: $('b-precio').value === '' ? null : Number($('b-precio').value),
        comprado_at: $('b-fecha').value || undefined
      });
      btn.disabled = false;
      if (error) { toast('No se pudo crear: ' + error.message); return; }
      cerrarModal(); toast('Bono creado'); renderFicha();
    });
  }

  /** Descuenta una sesión del bono (sin firma: un toque y confirmación).
   *  Si viene de "Ha llegado"/"Finalizar" trae la cita; desde la ficha, sin cita. */
  async function modalUsarBono(bono, cl, cita, usadas) {
    const n = usadas + 1;
    const quedan = bono.sesiones_total - n;
    if (!confirm(`¿Descontar una sesión del bono?\n\n${bono.nombre} · sesión ${n} de ${bono.sesiones_total}${quedan > 0 ? ` (quedarán ${quedan})` : ' (quedará agotado)'}${cita ? '\nSe anotará en la cita de hoy y su precio pasará a 0 €.' : ''}`)) return;
    const { error } = await db.from('bono_usos').insert({
      bono_id: bono.id,
      clienta_id: cl.id,
      cita_id: cita ? cita.id : null
    });
    if (error) { toast('No se pudo registrar: ' + error.message); return; }
    // Sesión cubierta por el bono: el importe ya se cobró al venderlo.
    // Se deja la cita a 0 € para no contar ese dinero dos veces.
    if (cita) await db.from('citas').update({ precio: 0 }).eq('id', cita.id);
    cerrarModal();
    toast(`Sesión ${n} de ${bono.sesiones_total} descontada${quedan > 0 ? ` · quedan ${quedan}` : ' · bono agotado'}`);
    if (state.vista === 'ficha') renderFicha(); else { await cargarCitas(); render(); }
  }

  /** Los usos de un bono: la cuenta detallada para enseñar si hay dudas.
   *  Los usos antiguos que se firmaron conservan y muestran su firma. */
  async function modalVerUsosBono(bono) {
    const { data, error } = await db.from('bono_usos')
      .select('*').eq('bono_id', bono.id).order('usado_at');
    if (error) return toast('No se pudieron cargar los usos');
    const usos = data || [];
    abrirModal('Usos del bono', `
      <p style="font-size:13px;color:var(--muted);margin-bottom:12px">
        <b>${esc(bono.nombre)}</b> · ${usos.length} de ${bono.sesiones_total} sesiones usadas.
        Cada uso queda registrado con su fecha y hora.
      </p>
      ${usos.map((u, i) => `
        <div class="bono-uso">
          <div>
            <b>Sesión ${i + 1}</b>
            <span>${fmtFechaCorta(u.usado_at)} · ${fmtHora(u.usado_at)}${u.firmante_nombre ? ' · ' + esc(u.firmante_nombre) : ''}</span>
          </div>
          ${u.firma_data && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(u.firma_data)
            ? `<img src="${u.firma_data}" alt="Firma del uso ${i + 1}">`
            : ''}
          <button type="button" class="icon-btn" data-uso-borrar="${u.id}" aria-label="Eliminar este uso" style="width:36px;height:36px">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>`).join('')}`);

    document.querySelectorAll('[data-uso-borrar]').forEach(btn =>
      btn.addEventListener('click', async () => {
        if (!confirm('¿Eliminar este uso?\n\nEl bono recuperará la sesión. Hazlo solo si fue un error.')) return;
        const { error: eDel } = await db.from('bono_usos').delete().eq('id', btn.dataset.usoBorrar);
        if (eDel) { toast('No se pudo eliminar el uso'); return; }
        toast('Uso eliminado · el bono recupera la sesión');
        modalVerUsosBono(bono); // repintar la lista
        if (state.vista === 'ficha') renderFicha();
      }));
  }

  /** Al entrar la clienta (o al finalizar, como red): si tiene bonos con
    *  sesiones para este tratamiento, ofrecer descontarla en un toque. */
  async function ofrecerBono(cita) {
    const { data: bonos, error } = await db.from('bonos')
      .select('*').eq('clienta_id', cita.clienta_id);
    if (error || !bonos || !bonos.length) return false; // sin SQL o sin bonos
    // Si esta cita ya descontó una sesión, no volver a preguntar
    const { data: yaUso } = await db.from('bono_usos')
      .select('id').eq('cita_id', cita.id).limit(1);
    if (yaUso && yaUso.length) return false;
    const { data: usos } = await db.from('bono_usos')
      .select('id, bono_id').eq('clienta_id', cita.clienta_id);
    const cuenta = {};
    (usos || []).forEach(u => { cuenta[u.bono_id] = (cuenta[u.bono_id] || 0) + 1; });
    // Valen: bonos con sesiones restantes y del tratamiento de la cita
    // (o de cualquier tratamiento)
    const validos = bonos.filter(b =>
      (b.sesiones_total - (cuenta[b.id] || 0)) > 0 &&
      (!b.tratamiento_id || b.tratamiento_id === cita.tratamiento_id));
    if (!validos.length) return false;

    const cl = clientaDe(cita.clienta_id);
    abrirModal('¿Se paga con bono?', `
      <p style="font-size:13.5px;color:var(--ink-soft);margin-bottom:12px">
        ${esc(cl ? nombreCompleto(cl) : '')} tiene bono con sesiones disponibles.
      </p>
      ${validos.map(b => `
        <button class="btn btn-dark" style="width:100%;margin-bottom:8px" data-elegir-bono="${b.id}">
          ${esc(b.nombre)} · quedan ${b.sesiones_total - (cuenta[b.id] || 0)}
        </button>`).join('')}
      <button class="btn btn-outline" style="width:100%" id="ob-no">No, se paga suelta</button>`);
    document.querySelectorAll('[data-elegir-bono]').forEach(btn =>
      btn.addEventListener('click', () => {
        const b = validos.find(x => x.id === btn.dataset.elegirBono);
        modalUsarBono(b, cl, cita, cuenta[b.id] || 0);
      }));
    $('ob-no').addEventListener('click', () => { cerrarModal(); });
    return true;
  }

  // ─── Fotos de la sesión ──────────────────────────────────
  // Bucket PRIVADO (agenda-fotos.sql): cada foto se comprime en el
  // navegador antes de subirse (grande ~1800 px + miniatura) para que el
  // almacenamiento gratuito dure años. Se enseñan con enlace firmado.
  const BUCKET_FOTOS = 'tratamiento-fotos';
  const rutaMini = (r) => r.replace(/\.jpg$/, '_mini.jpg');

  /** Reduce una imagen en el navegador y la devuelve como JPEG. */
  function comprimirImagen(file, maxLado, calidad) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const f = Math.min(1, maxLado / Math.max(img.width, img.height));
        const cv = document.createElement('canvas');
        cv.width = Math.max(1, Math.round(img.width * f));
        cv.height = Math.max(1, Math.round(img.height * f));
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        URL.revokeObjectURL(url);
        cv.toBlob(b => b ? res(b) : rej(new Error('sin blob')), 'image/jpeg', calidad);
      };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('imagen ilegible')); };
      img.src = url;
    });
  }

  /** Visor a pantalla completa; un toque lo cierra. */
  function visorFoto(url) {
    const v = document.createElement('div');
    v.className = 'visor';
    v.innerHTML = `<img src="${url}" alt="Foto del tratamiento">`;
    v.addEventListener('click', () => v.remove());
    document.body.appendChild(v);
  }
  async function abrirFotoGrande(ruta) {
    const { data } = await db.storage.from(BUCKET_FOTOS).createSignedUrl(ruta, 600);
    if (data && data.signedUrl) visorFoto(data.signedUrl);
    else toast('No se ha podido abrir la foto');
  }

  /** Pinta la galería de una cita dentro del formulario. */
  async function pintarFotosCita(cita) {
    const grid = $('f-fotos');
    if (!grid) return;
    const { data, error } = await db.from('fotos_sesion')
      .select('id, ruta').eq('cita_id', cita.id).order('created_at');
    if (error) {
      grid.innerHTML = '<p class="fotos-nota">Para activar las fotos, ejecuta <b>supabase/agenda-fotos.sql</b> en Supabase (SQL Editor).</p>';
      return;
    }
    const fotos = data || [];
    const urls = {};
    if (fotos.length) {
      const { data: sig } = await db.storage.from(BUCKET_FOTOS)
        .createSignedUrls(fotos.map(f => rutaMini(f.ruta)), 3600);
      (sig || []).forEach((s, i) => { if (s && s.signedUrl) urls[fotos[i].id] = s.signedUrl; });
    }
    grid.innerHTML = fotos.map(f => `
      <div class="foto-mini" data-foto="${f.id}" data-ruta="${esc(f.ruta)}" role="button" tabindex="0" aria-label="Ver foto">
        ${urls[f.id] ? `<img src="${urls[f.id]}" alt="">` : '<span>📷</span>'}
        <button type="button" class="foto-x" aria-label="Eliminar foto">×</button>
      </div>`).join('') + `
      <button type="button" class="foto-add" id="f-foto-add" aria-label="Añadir fotos">+</button>`;

    $('f-foto-add').addEventListener('click', () => $('f-foto-input').click());
    grid.querySelectorAll('.foto-mini').forEach(el => {
      el.addEventListener('click', (ev) => {
        if (ev.target.closest('.foto-x')) return;
        abrirFotoGrande(el.dataset.ruta);
      });
      el.querySelector('.foto-x').addEventListener('click', async () => {
        if (!confirm('¿Eliminar esta foto? No se puede deshacer.')) return;
        const ruta = el.dataset.ruta;
        // Primero los archivos, luego la fila: nunca queda una fila que
        // apunte a una foto ya borrada.
        await db.storage.from(BUCKET_FOTOS).remove([ruta, rutaMini(ruta)]);
        const { error: eDel } = await db.from('fotos_sesion').delete().eq('id', el.dataset.foto);
        if (eDel) { toast('No se pudo eliminar la foto'); return; }
        pintarFotosCita(cita);
      });
    });
  }

  /** Sección de fotos del formulario de cita: galería + subida + aviso
   *  si el último consentimiento firmado no autorizó fotografías. */
  function montarSeccionFotos(cita) {
    pintarFotosCita(cita);

    db.from('consentimientos_firmados').select('acepta_fotos')
      .eq('clienta_id', cita.clienta_id)
      .order('firmado_at', { ascending: false }).limit(1)
      .then(({ data }) => {
        if (data && data[0] && data[0].acepta_fotos === false) {
          const av = $('f-fotos-aviso');
          if (av) av.hidden = false;
        }
      });

    let contador = 0;
    $('f-foto-input').addEventListener('change', async () => {
      const files = [...$('f-foto-input').files];
      $('f-foto-input').value = '';
      for (const file of files) {
        try {
          toast('Subiendo foto…');
          const grande = await comprimirImagen(file, 1800, 0.85);
          const mini = await comprimirImagen(file, 320, 0.8);
          const ruta = `${cita.clienta_id}/${cita.id}/${Date.now()}-${contador++}.jpg`;
          const { error: e1 } = await db.storage.from(BUCKET_FOTOS)
            .upload(ruta, grande, { contentType: 'image/jpeg', upsert: false });
          if (e1) { toast('No se pudo subir la foto: ' + e1.message); continue; }
          await db.storage.from(BUCKET_FOTOS)
            .upload(rutaMini(ruta), mini, { contentType: 'image/jpeg', upsert: false });
          const { error: e2 } = await db.from('fotos_sesion')
            .insert({ clienta_id: cita.clienta_id, cita_id: cita.id, ruta });
          if (e2) {
            // Fila no guardada → fuera los archivos huérfanos
            db.storage.from(BUCKET_FOTOS).remove([ruta, rutaMini(ruta)]).then(() => {}, () => {});
            toast('No se pudo guardar la foto: ' + e2.message);
            continue;
          }
        } catch (e) { toast('Esa imagen no se ha podido leer'); }
      }
      pintarFotosCita(cita);
    });
  }

  /** Borra del bucket todas las fotos de una cita o de una clienta.
   *  Tolerante: si la tabla aún no existe, no hace nada. */
  async function borrarArchivosFotos(campo, id) {
    const { data } = await db.from('fotos_sesion').select('ruta').eq(campo, id);
    if (data && data.length) {
      await db.storage.from(BUCKET_FOTOS)
        .remove(data.flatMap(f => [f.ruta, rutaMini(f.ruta)]));
    }
  }

  // ─── Confirmación por WhatsApp con "añadir a mi calendario" ──
  /** Número en formato internacional para wa.me/tel:, o null si no hay. */
  function telWa(telefono) {
    const tel = (telefono || '').replace(/[^\d]/g, '');
    if (!tel) return null;
    return tel.length === 9 ? '34' + tel : tel;
  }

  /** Devuelve la URL de WhatsApp lista para usar, o null si no se puede. */
  function urlWhatsApp(cita) {
    const cl = clientaDe(cita.clienta_id);
    if (!cl || !cl.telefono) return null;

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

    return `https://wa.me/${telWa(cl.telefono)}?text=${encodeURIComponent(texto)}`;
  }

  /** URL de WhatsApp con el RECORDATORIO de una cita ya confirmada. */
  function urlRecordatorio(cita) {
    const cl = clientaDe(cita.clienta_id);
    const numero = cl && telWa(cl.telefono);
    if (!numero) return null;
    const inicio = new Date(cita.inicio);
    const texto =
      `Hola ${cl.nombre}, te recuerdo tu cita en ${NEGOCIO.nombre}:\n\n` +
      `📅 ${fmtFechaLarga(inicio)}\n` +
      `🕐 ${fmtHora(cita.inicio)}\n` +
      `📍 ${NEGOCIO.direccion}\n\n` +
      `Si no te viene bien, avísame y buscamos otro hueco. ¡Te espero!`;
    return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
  }

  // ── Recordatorios: qué citas ya se avisaron ──
  // WhatsApp no permite programar envíos desde una web: el recordatorio lo
  // manda la propietaria con un toque. El "ya avisada" se guarda en la
  // columna citas.recordatorio_enviado_at (agenda-recordatorios.sql) para
  // que todos los dispositivos lo compartan; el localStorage queda como
  // apunte de repuesto mientras ese SQL no esté ejecutado.
  const REC_KEY = 'agenda_recordatorios';
  function recLeer() {
    try {
      const m = JSON.parse(localStorage.getItem(REC_KEY)) || {};
      // Limpieza: citas ya pasadas no hace falta recordarlas más
      const ahora = Date.now();
      for (const id of Object.keys(m)) {
        if (new Date(m[id]).getTime() < ahora - 86400000) delete m[id];
      }
      return m;
    } catch (e) { return {}; }
  }
  function recMarcar(cita) {
    const m = recLeer();
    m[cita.id] = cita.inicio;
    try { localStorage.setItem(REC_KEY, JSON.stringify(m)); } catch (e) { /* sin sitio: da igual */ }
  }

  /** Marca una cita como avisada: en la base de datos (compartido entre
   *  dispositivos) y en local (repuesto por si el SQL no está ejecutado). */
  async function marcarRecordatorio(cita) {
    recMarcar(cita);
    await db.from('citas')
      .update({ recordatorio_enviado_at: new Date().toISOString() })
      .eq('id', cita.id);
    // Si la columna aún no existe, el update falla y queda el apunte local
    actualizarCampana();
  }

  /** Citas programadas de las PRÓXIMAS 24 HORAS aún sin recordatorio.
   *  Enviadas o ya empezadas desaparecen solas de esta lista. */
  async function recPendientes() {
    const hasta = new Date(Date.now() + 24 * 3600000);
    const { data, error } = await db.from('citas').select('*')
      .eq('estado', 'programada')
      .gte('inicio', new Date().toISOString())
      .lt('inicio', hasta.toISOString())
      .order('inicio');
    if (error) return null;
    const local = recLeer();
    return (data || []).filter(c => !c.recordatorio_enviado_at && !local[c.id]);
  }

  /** Globito con el número de recordatorios pendientes (24 h, con teléfono). */
  async function actualizarCampana() {
    const btn = $('rec-btn');
    if (!btn) return;
    const pendientes = await recPendientes();
    if (pendientes === null) return; // sin conexión, el globito se queda como estaba
    const n = pendientes.filter(c => telWa((clientaDe(c.clienta_id) || {}).telefono)).length;
    let b = btn.querySelector('.rec-badge');
    if (!n) { if (b) b.remove(); return; }
    if (!b) { b = document.createElement('span'); b.className = 'rec-badge'; btn.appendChild(b); }
    b.textContent = n;
  }

  /** Modal con los recordatorios PENDIENTES de las próximas 24 horas.
   *  Al enviar uno, desaparece de la lista; si la cita vence sin enviarlo,
   *  también desaparece (ya no tiene sentido recordarla). */
  async function modalRecordatorios() {
    const citas = await recPendientes();
    if (citas === null) { toast('No se han podido cargar las citas. Revisa la conexión.'); return; }

    let cuerpo = '';
    if (!citas.length) {
      cuerpo = '<div class="empty">Nada pendiente: no hay citas en las próximas 24 horas sin avisar.</div>';
    } else {
      let diaAnt = '';
      for (const c of citas) {
        const d = new Date(c.inicio);
        const clave = d.toDateString();
        if (clave !== diaAnt) {
          diaAnt = clave;
          const rel = mismaFecha(d, hoy()) ? 'Hoy · '
            : mismaFecha(d, addDias(hoy(), 1)) ? 'Mañana · ' : '';
          cuerpo += `<div class="rec-dia">${rel}${fmtFechaLarga(d)}</div>`;
        }
        const cl = clientaDe(c.clienta_id);
        const url = urlRecordatorio(c);
        cuerpo += `
          <div class="rec-item" data-rec-item="${c.id}">
            <div class="rec-info">
              <b>${fmtHora(c.inicio)} · ${esc(cl ? nombreCompleto(cl) : '—')}</b>
              <span>${esc(c.tratamiento || 'Sin tratamiento indicado')}</span>
            </div>
            ${url ? `
              <a class="btn btn-dark btn-sm rec-enviar"
                 href="${url}" target="_blank" rel="noopener" data-rec="${c.id}">
                Recordar
              </a>`
            : '<span class="rec-sintel">Sin teléfono</span>'}
          </div>`;
      }
    }

    abrirModal('Recordatorios', `
      <p style="font-size:13px;color:var(--muted);margin-bottom:14px">
        Citas de las <b>próximas 24 horas</b> aún sin recordatorio. Un toque
        en <b>Recordar</b> abre WhatsApp con el mensaje ya escrito; al
        enviarlo, la cita desaparece de esta lista en todos tus aparatos.
      </p>
      ${cuerpo}`);

    document.querySelectorAll('.rec-enviar').forEach(a =>
      a.addEventListener('click', () => {
        const c = citas.find(x => x.id === a.dataset.rec);
        if (c) marcarRecordatorio(c);
        // Enviado → fuera de la lista (con un instante de confirmación)
        a.textContent = 'Enviado ✓';
        a.classList.add('rec-ya', 'btn-outline');
        a.classList.remove('btn-dark');
        const fila = a.closest('[data-rec-item]');
        setTimeout(() => {
          if (fila) fila.remove();
          // Si era la última, mensaje de "todo al día" (y cabeceras fuera)
          if (!document.querySelector('[data-rec-item]')) {
            const body = $('modal-body');
            if (body) body.querySelectorAll('.rec-dia').forEach(x => x.remove());
            if (body && !body.querySelector('.empty')) {
              body.insertAdjacentHTML('beforeend',
                '<div class="empty">Todo al día: recordatorios enviados. ✓</div>');
            }
          }
        }, 900);
      }));
  }
  $('rec-btn').addEventListener('click', modalRecordatorios);

  /** Panel de confirmación tras crear o mover una cita. Usa un enlace real
   *  (no window.open tras un await): así ningún navegador lo bloquea. */
  function panelWhatsApp(cita, titulo) {
    const cl = clientaDe(cita.clienta_id);
    const url = urlWhatsApp(cita);
    abrirModal(titulo, `
      <p style="font-size:15px;margin-bottom:6px">
        <strong>${esc(cl ? nombreCompleto(cl) : '')}</strong><br>
        <span style="color:var(--ink-soft)">${fmtFechaLarga(new Date(cita.inicio))} a las ${fmtHora(cita.inicio)}</span>
      </p>
      ${url ? `
        <p style="font-size:13px;color:var(--muted);margin:14px 0">
          Se abrirá WhatsApp con la confirmación escrita y un enlace para que
          añada la cita a su calendario.
        </p>
        <a class="btn btn-dark" style="width:100%" href="${url}" target="_blank" rel="noopener" id="w-enviar">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.1-.7.2s-.7 1-.9 1.2c-.2.2-.3.2-.6.1a8 8 0 0 1-4-3.5c-.3-.5.3-.5.8-1.5.1-.2 0-.4 0-.5l-1-2.2c-.2-.5-.4-.5-.6-.5h-.6a1.1 1.1 0 0 0-.8.4A3.3 3.3 0 0 0 5 9.1c0 1.5 1.1 2.9 1.2 3.1a12 12 0 0 0 4.7 4.1c1.7.7 2.4.8 3.2.7.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.3s-.2-.2-.5-.3z"/><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z"/></svg>
          Enviar por WhatsApp
        </a>
        <button class="btn btn-ghost" style="width:100%;margin-top:8px" id="w-cerrar">Ahora no</button>`
      : `
        <div class="alerta" style="margin:14px 0">
          <b>Sin teléfono en la ficha</b>
          Añade el móvil a ${esc(cl ? cl.nombre : 'esta persona')} para poder avisar por WhatsApp.
        </div>
        <button class="btn btn-outline" style="width:100%" id="w-cerrar">Entendido</button>`}
    `);
    $('w-cerrar').addEventListener('click', cerrarModal);
    if ($('w-enviar')) $('w-enviar').addEventListener('click', () => {
      // Si la cita es de hoy o mañana, esta confirmación recién enviada ya
      // hace de recordatorio: que no vuelva a salir como pendiente.
      if (new Date(cita.inicio).getTime() - Date.now() < 48 * 3600000) marcarRecordatorio(cita);
      setTimeout(cerrarModal, 400);
    });
  }

  // ─── Botón flotante ──────────────────────────────────────
  $('fab').addEventListener('click', () => {
    if (state.vista === 'clientas') modalClienta(null);
    else modalCita(null);
  });

  // ─── Arranque ────────────────────────────────────────────
  // Marca de versión: si el HTML espera una versión y el navegador tiene
  // otra en caché, al menos queda constancia en la consola.
  console.info('[agenda] v31');
  comprobarSesion();
})();
