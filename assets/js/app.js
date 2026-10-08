// ─── ROUTING ──────────────────────────────────────────
const SUBLINKS = {
  docencia: [
    { label: 'Catálogo',           page: 'cursos' },
    { label: 'Aula',  page: 'aula' }
  ],
  aparatologia: [
    { label: 'Catálogo', page: 'tienda' },
    { label: 'Demos',    page: null, action: 'openDemoForm()' }
  ]
};
const pages = {
  'home':       { el: 'page-home',       area: '',           areaLabel: '',              subActive: null },
  'cursos':     { el: 'page-cursos',     area: 'docencia',   areaLabel: 'Cursos',        subActive: 'cursos' },
  'curso':      { el: 'page-curso',      area: 'docencia',   areaLabel: 'Cursos',        subActive: 'cursos' },
  'aula':       { el: 'page-aula',       area: 'docencia',   areaLabel: 'Cursos',        subActive: 'aula' },
  'aula-curso': { el: 'page-aula-curso', area: 'docencia',   areaLabel: 'Cursos',        subActive: 'aula' },
  'leccion':    { el: 'page-leccion',    area: 'docencia',   areaLabel: 'Cursos',        subActive: 'aula' },
  'tests':      { el: 'page-tests',      area: 'docencia',   areaLabel: 'Cursos',        subActive: 'aula' },
  'resultado':  { el: 'page-resultado',  area: 'docencia',   areaLabel: 'Cursos',        subActive: 'aula' },
  'tienda':     { el: 'page-tienda',     area: 'aparatologia', areaLabel: 'Aparatología', subActive: 'tienda' },
  'producto':   { el: 'page-producto',   area: 'aparatologia', areaLabel: 'Aparatología', subActive: 'tienda' },
  'admin':      { el: 'page-admin',      area: '',           areaLabel: '',              subActive: null },
};

function goTo(pageKey, area) {
  const _av = document.querySelector('.cursos-pub-aviso'); if (_av) _av.remove();
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const cfg = pages[pageKey];
  if (!cfg) return;
  document.getElementById(cfg.el).classList.add('active');
  window.scrollTo(0,0);
  updateNav(pageKey, cfg);
  updateTabBar(cfg.area, pageKey);
  if (typeof onPageEnter === 'function') onPageEnter(pageKey);
}

function updateNav(pageKey, cfg) {
  // Orden real de .nav-link: [0]=Inicio, [1]=Cursos, [2]=Aparatología
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  if (!cfg.area) document.querySelectorAll('.nav-link')[0].classList.add('active');
  if (cfg.area === 'docencia') document.querySelectorAll('.nav-link')[1].classList.add('active');
  if (cfg.area === 'aparatologia') document.querySelectorAll('.nav-link')[2].classList.add('active');

  const row2 = document.getElementById('nav-row2');
  const label = document.getElementById('nav-area-label');
  const subLinks = document.getElementById('nav-sub-links');

  if (!cfg.area) { row2.style.display = 'none'; return; }
  row2.style.display = '';
  label.textContent = cfg.areaLabel;
  const items = SUBLINKS[cfg.area] || [];
  subLinks.innerHTML = items.map(it => {
    const isActive = it.page && it.page === cfg.subActive;
    const href = it.page === 'cursos' ? '/cursos/' : (it.page ? ('/' + (PAGE_HASH[it.page] || '')) : '/');
    const onclick = it.page
      ? `onclick="goTo('${it.page}','${cfg.area}');return false"`
      : (it.action ? `onclick="${it.action};return false"` : '');
    const hasMenu = it.page === 'cursos' && (window.PRECISSA_CATEGORIES || []).length > 0;
    const link = `<a class="nav-sub-link${isActive ? ' active' : ''}" href="${href}" ${hasMenu ? 'aria-haspopup="true" aria-expanded="false" ' : ''}${onclick}>${it.label}</a>`;
    // Si es Cursos, le añadimos un dropdown con las 4 categorías
    if (it.page === 'cursos') {
      const cats = (window.PRECISSA_CATEGORIES || []);
      if (cats.length === 0) return link;
      const dropdownItems = [
        `<a class="nav-dropdown-item" href="/cursos/" onclick="goTo('cursos','docencia');return false">Ver todos los cursos</a>`,
        `<div class="nav-dropdown-sep"></div>`,
        ...cats.map(c =>
          `<a class="nav-dropdown-item" href="/#cat/${c.id}" onclick="goToCursosCategory('${c.id}');return false">${escapeHtml(c.label)}<span class="nav-dropdown-item-tagline">${escapeHtml(c.tagline || '')}</span></a>`
        )
      ].join('');
      return `<span class="nav-sub-link-wrap">${link}<div class="nav-dropdown">${dropdownItems}</div></span>`;
    }
    return link;
  }).join('');
}

function updateTabBar(area, pageKey) {
  const tabs = document.querySelectorAll('.tab-item');
  tabs.forEach(t => t.classList.remove('active'));
  // Las páginas del aula viven en el área 'docencia', pero su pestaña
  // en móvil es "Aula" (índice 3), no "Cursos".
  const aulaPages = ['aula', 'aula-curso', 'leccion', 'tests', 'resultado'];
  if (pageKey && aulaPages.indexOf(pageKey) !== -1) { tabs[3].classList.add('active'); return; }
  if (!area) tabs[0].classList.add('active');
  else if (area === 'docencia') tabs[1].classList.add('active');
  else if (area === 'aparatologia') tabs[2].classList.add('active');
}

// ─── STICKY NAV ────────────────────────────────────────
window.addEventListener('scroll', () => {
  document.getElementById('main-nav').classList.toggle('scrolled', window.scrollY > 80);
});

// ─── DRAWER ────────────────────────────────────────────
let _drawerOpener = null;
let _drawerInerted = [];
function _drawerIsOpen() { return document.getElementById('mobile-drawer').classList.contains('open'); }
function openDrawer() {
  const drawer = document.getElementById('mobile-drawer');
  if (drawer.classList.contains('open')) return;
  _drawerOpener = document.activeElement;
  drawer.classList.add('open');
  document.body.style.overflow = 'hidden';
  document.querySelectorAll('.hamburger').forEach(b => b.setAttribute('aria-expanded', 'true'));
  // Lo que queda detrás del cajón no debe recibir foco ni lector de pantalla.
  _drawerInerted = Array.from(document.body.children).filter(el =>
    el !== drawer && !/^(SCRIPT|STYLE|LINK|NOSCRIPT)$/.test(el.tagName) && !el.hasAttribute('inert'));
  _drawerInerted.forEach(el => el.setAttribute('inert', ''));
  const close = drawer.querySelector('.drawer-close');
  if (close) close.focus();
}
function closeDrawer() {
  const drawer = document.getElementById('mobile-drawer');
  const wasOpen = drawer.classList.contains('open');
  drawer.classList.remove('open');
  document.body.style.overflow = '';
  document.querySelectorAll('.hamburger').forEach(b => b.setAttribute('aria-expanded', 'false'));
  _drawerInerted.forEach(el => el.removeAttribute('inert'));
  _drawerInerted = [];
  if (wasOpen && _drawerOpener && document.contains(_drawerOpener)) {
    try { _drawerOpener.focus(); } catch (e) {}
  }
  _drawerOpener = null;
}

// ─── Foco: lista de elementos enfocables y trampa de Tab ────────
function _focusables(root) {
  return Array.from(root.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )).filter(el => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden');
}
function _trapTab(e, root) {
  const list = _focusables(root);
  if (!list.length) { e.preventDefault(); return; }
  const first = list[0], last = list[list.length - 1];
  const active = document.activeElement;
  if (!root.contains(active)) { e.preventDefault(); first.focus(); }
  else if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
}

// ─── Desplegables del menú: foco por teclado ────────────────────
// El CSS los abre con :hover y :focus-within; aquí sincronizamos
// aria-expanded y dejamos cerrar con Escape (devuelve el foco al enlace).
(function () {
  const WRAP = '.nav-link-wrap, .nav-sub-link-wrap';
  function trigger(wrap) { return wrap.querySelector(':scope > a'); }
  function sync(wrap, open) { const t = trigger(wrap); if (t) t.setAttribute('aria-expanded', open ? 'true' : 'false'); }
  document.addEventListener('focusin', e => {
    const wrap = e.target.closest && e.target.closest(WRAP);
    if (!wrap || wrap.classList.contains('dd-esc')) return;
    sync(wrap, true);
  });
  document.addEventListener('focusout', e => {
    const wrap = e.target.closest && e.target.closest(WRAP);
    if (!wrap) return;
    if (e.relatedTarget && wrap.contains(e.relatedTarget)) return;
    wrap.classList.remove('dd-esc');
    sync(wrap, false);
  });
  document.addEventListener('mouseout', e => {
    const wrap = e.target.closest && e.target.closest(WRAP);
    if (wrap && !wrap.contains(e.relatedTarget)) wrap.classList.remove('dd-esc');
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const wrap = document.activeElement && document.activeElement.closest && document.activeElement.closest(WRAP);
    if (!wrap || !wrap.querySelector('.nav-dropdown')) return;
    wrap.classList.add('dd-esc');
    sync(wrap, false);
    const t = trigger(wrap);
    if (t) t.focus();
  });
})();

// ─── TEST INTERACTION ──────────────────────────────────
function testSelect(el) {
  el.closest('.test-main, .test-preview-card, .tests-section')
    .querySelectorAll('.test-opt, .test-option').forEach(o => { o.classList.remove('selected'); o.setAttribute('aria-pressed', 'false'); });
  el.classList.add('selected');
  el.setAttribute('aria-pressed', 'true');
}
function selectOption(el) {
  el.closest('.test-preview-card, .tests-section')
    .querySelectorAll('.test-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
}

// ─── TABS (curso detail) ────────────────────────────────
function switchTab(btn, tabId) {
  btn.closest('.page').querySelectorAll('.tab-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
  btn.classList.add('active');
  btn.setAttribute('aria-selected', 'true');
  btn.closest('.page').querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  const target = document.getElementById(tabId);
  if (target) target.classList.add('active');
}

// ─── TABS (lección) ────────────────────────────────────
function switchLeccionTab(btn, tabId) {
  btn.closest('.leccion-main').querySelectorAll('.leccion-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  ['ltab-apuntes','ltab-recursos','ltab-comentarios','ltab-faq'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  const target = document.getElementById(tabId);
  if (target) target.style.display = 'block';
}

// ─── MÓDULO ACORDEÓN ───────────────────────────────────
function toggleModulo(header) {
  const body = header.nextElementSibling;
  const chevron = header.querySelector('.modulo-chevron');
  const isOpen = body.classList.contains('open');
  body.classList.toggle('open', !isOpen);
  header.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
  chevron.style.transform = isOpen ? 'rotate(-90deg)' : 'rotate(0deg)';
}

// ─── FILTER TIENDA ─────────────────────────────────────
function filterTienda(chip, cat) {
  _tiendaFilter = cat;
  const cont = chip.closest('.filter-chips');
  if (cont) {
    cont.querySelectorAll('.filter-chip').forEach(c => { c.classList.remove('active'); c.setAttribute('aria-pressed', 'false'); });
    chip.classList.add('active');
    chip.setAttribute('aria-pressed', 'true');
  }
  const grid = document.getElementById('tienda-grid');
  if (grid) {
    grid.style.opacity = '0.4';
    setTimeout(() => { renderTienda(); grid.style.opacity = '1'; }, 150);
  } else {
    renderTienda();
  }
}

// ─── NEWSLETTER ────────────────────────────────────────
// El formulario envía a Brevo (https://www.brevo.com), herramienta de
// email marketing gratuita.
//
// PASOS PARA ACTIVARLO (una sola vez):
//   1. Crear cuenta gratis en https://onboarding.brevo.com/account/register
//   2. En el panel: Contacts → Lists → "+ Add a new list" → nombre p.ej.
//      "Newsletter PRECISSA INSTITUTE" → guardar.
//   3. Forms → "+ Create a new form" → tipo "Subscription form".
//      Asigna la lista creada en el paso 2. Diseño da igual (no se usa).
//   4. En la pestaña "Share" del form: copia el atributo `action` del
//      bloque <form> que aparece (URL larga tipo
//      https://sibforms.com/serve/MUIFAA...).
//   5. Pega esa URL en la constante BREVO_FORM_URL de abajo y haz commit.
//
// Mientras BREVO_FORM_URL está vacío, las suscripciones se envían como
// fallback al inbox de precissainstitute@gmail.com via FormSubmit.
const BREVO_FORM_URL = '';  // ← PEGAR AQUÍ la URL del form de Brevo

async function submitNewsletter() {
  const form   = document.getElementById('newsletter-form');
  const input  = form.querySelector('.newsletter-input');
  const btn    = form.querySelector('.newsletter-btn');
  const thanks = document.getElementById('newsletter-thanks');
  const email  = (input.value || '').trim();

  // Validación mínima de email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    input.focus();
    input.style.borderColor = 'rgba(255,150,140,0.8)';
    return;
  }
  input.style.borderColor = '';

  btn.disabled = true;
  btn.textContent = 'Enviando…';

  try {
    if (BREVO_FORM_URL) {
      // Envío al endpoint de Brevo (form público, no expone API key).
      const data = new FormData();
      data.append('EMAIL', email);
      data.append('email_address_check', ''); // honeypot de Brevo
      data.append('locale', 'es');
      data.append('html_type', 'simple');
      await fetch(BREVO_FORM_URL, { method:'POST', body:data, mode:'no-cors' });
    } else {
      // Fallback: enviar al inbox via FormSubmit con asunto distinguible.
      // FormSubmit responde {success:"true"} — sin validar la respuesta, un
      // 4xx/5xx o el estado "email pendiente de activar" mostraría el
      // "gracias" y la suscripción se perdería en silencio.
      const res = await fetch(QUOTE_ENDPOINT, {
        method:  'POST',
        headers: { 'Content-Type':'application/json', 'Accept':'application/json' },
        body:    JSON.stringify({
          email:     email,
          origen:    'Suscripcion newsletter (Diario PRECISSA INSTITUTE)',
          _subject:  'Nueva suscripcion newsletter · PRECISSA INSTITUTE',
          _template: 'table'
        })
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json().catch(() => ({}));
      if (json.success !== 'true' && json.success !== true) throw new Error('FormSubmit rechazó el envío');
    }
    form.style.display   = 'none';
    thanks.style.display = 'block';
  } catch (err) {
    btn.disabled    = false;
    btn.textContent = 'Suscribirme';
    input.style.borderColor = 'rgba(255,150,140,0.8)';
  }
}

// ─── PRODUCT THUMBS ────────────────────────────────────
document.querySelectorAll('.producto-thumb').forEach(thumb => {
  thumb.addEventListener('click', function() {
    this.closest('.producto-layout').querySelectorAll('.producto-thumb').forEach(t => t.classList.remove('active'));
    this.classList.add('active');
  });
});

// ═══════════════════════════════════════════════════════
// LECCIÓN VISUAL (slides + parallax 3D + quiz)
// ═══════════════════════════════════════════════════════
(() => {
  let initialized = false;
  let resetQuizFn = null;

  function initLeccionVisual() {
    if (initialized) {
      if (resetQuizFn) resetQuizFn();   // al volver a entrar, resetear el quiz
      return;
    }
    const page = document.getElementById('page-leccion');
    if (!page) return;

    const stage = document.getElementById('lv-stage');
    const slides = stage.querySelectorAll('.lv-slide');
    if (!slides.length) return;

    // ─── Construir puntos de navegación lateral ──────────
    const dotsWrap = document.getElementById('lv-dots');
    if (dotsWrap && !dotsWrap.children.length) {
      slides.forEach((s, i) => {
        const dot = document.createElement('div');
        dot.className = 'lv-dot' + (i === 0 ? ' is-active' : '');
        dot.dataset.label = s.dataset.label || ('Slide ' + (i+1));
        dot.dataset.idx = i;
        dot.addEventListener('click', () => {
          const top = s.getBoundingClientRect().top + window.scrollY - 56;
          window.scrollTo({ top, behavior: 'smooth' });
        });
        dotsWrap.appendChild(dot);
      });
    }
    const dots = dotsWrap.querySelectorAll('.lv-dot');
    const progFill = document.getElementById('lv-prog-fill');
    const progNum  = document.getElementById('lv-prog-num');
    const totalStr = String(slides.length).padStart(2,'0');

    // ─── IntersectionObserver para fade-in y progreso ───
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          const idx = parseInt(entry.target.dataset.slide,10) - 1;
          dots.forEach((d, i) => d.classList.toggle('is-active', i === idx));
          if (progNum) progNum.textContent = String(idx+1).padStart(2,'0') + ' / ' + totalStr;
          if (progFill) progFill.style.width = ((idx+1)/slides.length*100).toFixed(1) + '%';
        }
      });
    }, { threshold: reduceMotion ? 0 : 0.35 });

    slides.forEach(s => io.observe(s));
    // El primer slide se muestra inmediatamente
    slides[0].classList.add('in-view');

    // ─── Interacción del diagrama de las 3 capas ────────
    const layers = page.querySelectorAll('.lv-layer');
    const layerList = page.querySelectorAll('#lv-layers-list li');
    const setLayer = (idx) => {
      layers.forEach((l, i) => l.classList.toggle('is-active', i === idx));
      layerList.forEach((l, i) => l.classList.toggle('is-active', i === idx));
    };
    layers.forEach((l, i) => l.addEventListener('click', () => setLayer(i)));
    layerList.forEach((l, i) => l.addEventListener('click', () => setLayer(i)));

    // ─── PARALLAX 3D editorial ──────────────────────────
    const parallaxStage = document.getElementById('lv-parallax-stage');
    const parallaxImg = document.getElementById('lv-parallax-img');
    if (parallaxStage && parallaxImg && !reduceMotion) {
      let raf = null;
      let active = false;
      const update = () => {
        const rect = parallaxStage.getBoundingClientRect();
        const vh = window.innerHeight;
        // progreso: -1 (sección entrando por abajo) → 0 (centrada) → 1 (saliendo por arriba)
        const progress = (rect.top + rect.height / 2 - vh / 2) / vh;
        const clamped = Math.max(-1.2, Math.min(1.2, progress));

        // Imagen base: traslación + leve zoom para sensación 3D
        const ty = -clamped * 0.35 * 140;      // ~ -49 a +49 px
        const scale = 1.04 + Math.abs(clamped) * 0.04;
        parallaxImg.style.transform = `translate3d(0, ${ty.toFixed(2)}px, 0) scale(${scale.toFixed(3)})`;

        // Pseudo-capas (luz cálida y viñeta) → manipuladas vía CSS custom prop
        parallaxStage.style.setProperty('--lvp-progress', clamped.toFixed(3));
        parallaxStage.querySelector('.lv-parallax-copy').style.transform =
          `translate3d(0, ${(-clamped * 28).toFixed(2)}px, 0)`;

        raf = null;
      };
      const onScroll = () => {
        if (raf === null) raf = requestAnimationFrame(update);
      };
      const pio = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !active) {
            active = true;
            window.addEventListener('scroll', onScroll, { passive: true });
            update();
          } else if (!entry.isIntersecting && active) {
            active = false;
            window.removeEventListener('scroll', onScroll);
          }
        });
      }, { rootMargin: '30% 0px' });
      pio.observe(parallaxStage);
    }

    // ─── QUIZ ────────────────────────────────────────────
    const quizData = [
      {
        q: '¿Cuál es la capa de la piel que actúa como <em>barrera</em> y se renueva continuamente?',
        opts: [
          { t: 'Hipodermis', ok: false },
          { t: 'Dermis reticular', ok: false },
          { t: 'Epidermis', ok: true },
          { t: 'Tejido subcutáneo', ok: false }
        ],
        feedback: 'La <b>epidermis</b> es la capa más externa, avascular, formada por epitelio queratinizado, y se renueva cada 28–30 días en un adulto joven sano.'
      },
      {
        q: '¿Cuál de los siguientes es un dato <em>real</em> sobre la piel humana?',
        opts: [
          { t: 'Pesa menos de 1 kg y mide 30 cm².', ok: false },
          { t: 'Tiene una superficie aproximada de 2 m² y puede suponer el 15 % del peso corporal.', ok: true },
          { t: 'Carece de receptores sensoriales propios.', ok: false },
          { t: 'Tiene un pH alcalino (7,5–8,2).', ok: false }
        ],
        feedback: 'Correcto: ~<b>2 m² de superficie</b>, hasta el <b>15 % del peso corporal</b>, con más de 4 millones de receptores y un pH ligeramente ácido (4,5–5,9).'
      },
      {
        q: '¿Dónde encontramos <em>piel gruesa o glabra</em>?',
        opts: [
          { t: 'En el cuero cabelludo y la frente.', ok: false },
          { t: 'En la espalda y los brazos.', ok: false },
          { t: 'En las palmas de las manos y las plantas de los pies.', ok: true },
          { t: 'En el rostro, especialmente en la zona T.', ok: false }
        ],
        feedback: 'La piel gruesa es exclusiva de <b>palmas y plantas</b>: sin folículos pilosos ni glándulas sebáceas, pero con estrato córneo muy desarrollado y estrato lúcido.'
      }
    ];

    let qIdx = 0, qHits = 0, qAnswered = false;
    const qNumEl   = document.getElementById('lv-quiz-q-num');
    const qEl      = document.getElementById('lv-quiz-q');
    const optsEl   = document.getElementById('lv-quiz-opts');
    const fbEl     = document.getElementById('lv-quiz-feedback');
    const progEl   = document.getElementById('lv-quiz-progress');
    const nextBtn  = document.getElementById('lv-quiz-next');
    const finalScore = document.getElementById('lv-end-score');

    function renderQuestion() {
      qAnswered = false;
      const data = quizData[qIdx];
      qNumEl.textContent = 'Pregunta ' + String(qIdx+1).padStart(2,'0') + ' / ' + String(quizData.length).padStart(2,'0');
      qEl.innerHTML = data.q;
      optsEl.innerHTML = '';
      fbEl.classList.remove('show'); fbEl.innerHTML = '';
      nextBtn.style.display = 'none';
      progEl.textContent = 'Aciertos: ' + qHits + ' / ' + qIdx;

      data.opts.forEach((opt, i) => {
        const div = document.createElement('div');
        div.className = 'lv-quiz-opt';
        div.innerHTML = '<span class="lv-quiz-opt-ltr">' + String.fromCharCode(65+i) + '</span>' + opt.t;
        div.addEventListener('click', () => {
          if (qAnswered) return;
          qAnswered = true;
          if (opt.ok) qHits++;
          // Marca resultado
          Array.from(optsEl.children).forEach((c, ci) => {
            if (data.opts[ci].ok) c.classList.add('right');
            else if (ci === i) c.classList.add('wrong');
          });
          // Feedback
          fbEl.innerHTML = data.feedback;
          fbEl.classList.add('show');
          progEl.textContent = 'Aciertos: ' + qHits + ' / ' + (qIdx+1);
          nextBtn.style.display = '';
          nextBtn.innerHTML = (qIdx < quizData.length - 1) ? 'Siguiente pregunta <i class="ico ico-arrow" aria-hidden="true"></i>' : 'Ver resultado <i class="ico ico-arrow" aria-hidden="true"></i>';
        });
        optsEl.appendChild(div);
      });
    }

    window.lvQuizNext = function() {
      if (qIdx < quizData.length - 1) {
        qIdx++;
        renderQuestion();
      } else {
        if (finalScore) finalScore.textContent = qHits + ' / ' + quizData.length;
        // ir al slide final
        const last = stage.querySelector('[data-slide="9"]');
        if (last) {
          const top = last.getBoundingClientRect().top + window.scrollY - 56;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }
    };

    resetQuizFn = () => {
      qIdx = 0; qHits = 0; qAnswered = false;
      if (finalScore) finalScore.textContent = '— / 3';
      renderQuestion();
    };

    renderQuestion();
    initialized = true;
  }

  // Inicializar cuando se navega a la lección
  const _goTo = window.goTo;
  window.goTo = function(pageKey, area) {
    _goTo(pageKey, area);
    if (pageKey === 'leccion') {
      // pequeño delay para que el DOM esté visible
      setTimeout(initLeccionVisual, 30);
    }
  };
})();

// ─── DOCENCIA · DATOS DE CURSOS ─────────────────────────
// Cursos "crudos" definidos en courses-data.js, sin overrides del panel.
function getRawCourses() {
  return (window.PRECISSA_COURSES && Array.isArray(window.PRECISSA_COURSES)) ? window.PRECISSA_COURSES : [];
}
function getRawCourse(id) {
  return getRawCourses().find(c => c.id === id) || null;
}
// Aplica el override de un curso sobre su versión por defecto: los
// metadatos de texto/portada se fusionan campo a campo (los que no estén
// en el override conservan el valor del JS); lessons y test, si vienen en
// el override, reemplazan al array por defecto.
function mergeCourseOverride(course, ov) {
  if (!ov) return course;
  const out = Object.assign({}, course);
  ['title', 'eyebrow', 'level', 'duration', 'shortDescription', 'description', 'category', 'cover', 'sourceDoc']
    .forEach(k => { if (ov[k] != null && ov[k] !== '') out[k] = ov[k]; });
  if (Array.isArray(ov.lessons)) out.lessons = ov.lessons;
  if (ov.test && Array.isArray(ov.test.questions)) out.test = ov.test;
  return out;
}
// Cursos con los overrides del panel aplicados (lo que ve toda la web:
// catálogo, home y aula).
function getCourses() {
  const raw = getRawCourses();
  const map = (window.courseContent && window.courseContent.getMap) ? window.courseContent.getMap() : null;
  if (!map) return raw.map(c => Object.assign({}, c));
  const out = [];
  const seen = {};
  // Cursos de base (courses-data.js) con sus overrides; los marcados como
  // eliminados desde el panel se omiten por completo.
  raw.forEach(c => {
    seen[c.id] = true;
    const ov = map[c.id];
    if (ov && ov.deleted) return;
    out.push(mergeCourseOverride(c, ov));
  });
  // Cursos creados desde el panel (no existen en courses-data.js).
  Object.keys(map).forEach(id => {
    if (seen[id]) return;
    const ov = map[id];
    if (!ov || ov.deleted) return;
    out.push(mergeCourseOverride({ id: id, lessons: [], test: { questions: [] } }, ov));
  });
  return out;
}
// Cursos visibles en el catálogo público (excluye los desactivados desde
// el panel admin). El aula y la gestión de matrículas usan getCourses()
// directamente, así que las alumnas matriculadas conservan el acceso.
function getPublicCourses() {
  const all = getCourses();
  const hidden = (window.courseVisibility && window.courseVisibility.getHiddenSet)
    ? window.courseVisibility.getHiddenSet() : null;
  if (!hidden || hidden.size === 0) return all;
  return all.filter(c => !hidden.has(c.id));
}

// ─── CURSOS PÚBLICO (listado agrupado por categoría) ────
function getCategories() {
  return (window.PRECISSA_CATEGORIES && Array.isArray(window.PRECISSA_CATEGORIES)) ? window.PRECISSA_CATEGORIES : [];
}
function normalizeSearch(s) {
  return (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
function buildCourseSearchText(c) {
  const cat = (window.PRECISSA_CATEGORIES || []).find(k => k.id === c.category);
  return normalizeSearch([
    c.title, c.shortDescription, c.description, c.eyebrow, c.level, c.duration,
    cat ? cat.label : '', cat ? cat.tagline : ''
  ].filter(Boolean).join(' '));
}
// Landings SEO estáticas por curso (los 5 cursos sin landing no aparecen).
const LANDING_BY_COURSE = {
  'plasma-pen': '/cursos/plasmapen-valencia/',
  'hifu': '/cursos/hifu-valencia/',
  'microblading-cejas': '/cursos/microblading-valencia/',
  'depilacion-laser': '/cursos/depilacion-laser-valencia/',
  'higiene-facial-profunda': '/cursos/limpieza-facial-profunda-valencia/',
  'micropigmentacion-labios': '/cursos/micropigmentacion-valencia/',
  'neutralizacion-labios': '/cursos/micropigmentacion-valencia/',
  'micropigmentacion-eyeliner': '/cursos/micropigmentacion-valencia/',
  'dermapen-microneedling': '/cursos/dermapen-valencia/',
  'hyaluron-pen': '/cursos/hyaluron-pen-valencia/',
  'cejas-diseno-visajismo': '/cursos/cejas-valencia/',
  'cejas-laminado-henna': '/cursos/cejas-valencia/',
  'pestanas-lifting-tinte': '/cursos/lifting-pestanas-valencia/',
  'maderoterapia': '/cursos/maderoterapia-valencia/',
  'drenaje-linfatico': '/cursos/drenaje-linfatico-valencia/',
  'vacuum-cavitacion-radiofrecuencia': '/cursos/electroestetica-valencia/',
  'diatermia': '/cursos/electroestetica-valencia/',
  'ipl-fotorejuvenecimiento': '/cursos/electroestetica-valencia/',
  'laser-switched-yag-carbon-peel': '/cursos/electroestetica-valencia/'
};
const MESES_ES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
// 'YYYY-MM-DD' -> '20 de octubre' (añade el año si no es el actual).
// Devuelve '' si la fecha no es válida.
function formatearFecha(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  if (!m) return '';
  const y = +m[1], mo = +m[2], d = +m[3];
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return '';
  return d + ' de ' + MESES_ES[mo - 1] + (y !== new Date().getFullYear() ? ' de ' + y : '');
}
// Devuelve la fecha formateada solo si la convocatoria no ha pasado.
function proximaConvocatoria(c) {
  if (!c || !c.nextStart) return '';
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const [y, mo, d] = String(c.nextStart).split('-').map(Number);
  if (new Date(y, mo - 1, d) < hoy) return '';
  return formatearFecha(c.nextStart);
}
// Portadas con versión WebP generada (lista estática; los datos de courses-data.js no cambian)
const WEBP_COVERS = new Set(['assets/anatomia-fisiologia-cutanea.jpg','assets/area-corporal.jpg','assets/area-electro.jpg','assets/area-facial.jpg','assets/area-micropigmentacion.jpg','assets/higiene-facial-profunda.jpg','assets/le-petit.jpg']);
const COVER_DIMS = { 'assets/anatomia-fisiologia-cutanea.jpg': [1376,768], 'assets/area-corporal.jpg': [1280,720], 'assets/area-electro.jpg': [1280,720], 'assets/area-facial.jpg': [1280,720], 'assets/area-micropigmentacion.jpg': [1280,720], 'assets/higiene-facial-profunda.jpg': [1400,781], 'assets/le-petit.jpg': [800,1200] };
function coverImgHtml(src, alt) {
  const d = COVER_DIMS[src];
  const dims = d ? ` width="${d[0]}" height="${d[1]}"` : '';
  const img = `<img src="${src}" alt="${alt || ''}"${dims} loading="lazy">`;
  return WEBP_COVERS.has(src) ? `<picture><source type="image/webp" srcset="${src.replace(/\.jpg$/, '.webp')}">${img}</picture>` : img;
}
function renderCourseCardPublic(c) {
  const landing = LANDING_BY_COURSE[c.id];
  const searchAttr = buildCourseSearchText(c);
  const cat = getCategories().find(k => k.id === c.category);
  const fecha = proximaConvocatoria(c);
  return `
    <article class="cursos-pub-card" id="curso-card-${escapeAttr(c.id)}" data-search="${escapeAttr(searchAttr)}">
      <div class="cursos-pub-card-cover">
        ${c.cover ? coverImgHtml(c.cover) : `<div class="cursos-pub-card-cover-fallback">${escapeHtml(c.title)}</div>`}
      </div>
      <div class="cursos-pub-card-body">
        ${cat ? `<div class="cursos-pub-card-tag">${escapeHtml(cat.label)}</div>` : ''}
        <div class="cursos-pub-card-title">${escapeHtml(c.title)}</div>
        <div class="cursos-pub-card-desc">${escapeHtml(c.shortDescription || c.description || '')}</div>
        <div class="cursos-pub-card-meta">
          ${c.duration ? `<span>${escapeHtml(c.duration)}</span>` : ''}
          ${c.level ? `<span>${escapeHtml(c.level)}</span>` : ''}
        </div>
        ${fecha ? `<div class="cursos-pub-card-fecha"><i class="ico ico-cal" aria-hidden="true"></i> Próxima convocatoria: <strong>${escapeHtml(fecha)}</strong></div>` : ''}
        <div class="cursos-pub-card-actions">
          <div class="cursos-pub-card-cta-slot" data-curso-id="${escapeAttr(c.id)}" data-curso-title="${escapeAttr(c.title)}">
            <button class="btn btn-dark btn-sm cursos-pub-card-cta" onclick="openCursoInfoForm('${escapeJs(c.title)}')">Solicitar información</button>
          </div>
          ${landing ? `<a class="btn btn-outline btn-sm cursos-pub-card-link" href="${escapeAttr(landing)}">Ver temario <i class="ico ico-arrow" aria-hidden="true"></i></a>` : ''}
        </div>
      </div>
    </article>`;
}
// ─── HOME · PRÓXIMAS CONVOCATORIAS ──────────────────────
// Hueco para los pósteres: cuando lleguen, basta con poner aquí la ruta
// (p. ej. 'assets/poster-depilacion-laser.jpg'). Vacío = se usa la portada.
const POSTERS = { 'depilacion-laser': 'assets/poster-depilacion-laser-4x5.webp', 'higiene-facial-profunda': 'assets/poster-limpieza-facial-4x5.webp' };
function convocatoriasVigentes() {
  return getPublicCourses()
    .filter(c => proximaConvocatoria(c))
    .sort((a, b) => String(a.nextStart).localeCompare(String(b.nextStart)));
}
// ['2026-10-20','2026-10-21'] -> { dias: '20 y 21', mes: 'octubre', ... } agrupado por mes
function resumenFechas(cursos) {
  const grupos = [];
  cursos.forEach(c => {
    const [y, mo, d] = String(c.nextStart).split('-').map(Number);
    let g = grupos.find(x => x.y === y && x.mo === mo);
    if (!g) { g = { y, mo, dias: [] }; grupos.push(g); }
    if (g.dias.indexOf(d) === -1) g.dias.push(d);
  });
  return grupos;
}
function unirLista(arr) {
  if (arr.length <= 1) return arr.join('');
  return arr.slice(0, -1).join(', ') + ' y ' + arr[arr.length - 1];
}
function textoInicios(cursos, conArticulo) {
  const grupos = resumenFechas(cursos);
  if (grupos.length === 0) return '';
  const anio = g => (g.y !== new Date().getFullYear() ? ' de ' + g.y : '');
  if (grupos.length === 1) {
    const g = grupos[0];
    const dias = conArticulo ? unirLista(g.dias.map(d => 'el ' + d)) : unirLista(g.dias.map(String));
    return dias + ' de ' + MESES_ES[g.mo - 1] + anio(g);
  }
  // Meses distintos: solo se nombran los meses
  return 'en ' + unirLista(grupos.map(g => MESES_ES[g.mo - 1]));
}
function renderConvocatorias() {
  const sec = document.getElementById('convocatorias');
  const link = document.getElementById('hero-convocatoria');
  if (!sec) return;
  const cursos = convocatoriasVigentes();
  if (cursos.length === 0) {
    sec.hidden = true; sec.querySelector('#convocatorias-grid').innerHTML = '';
    if (link) link.hidden = true;
    return;
  }
  const cats = getCategories();
  const h2 = 'Empezamos ' + textoInicios(cursos, true);
  document.getElementById('convocatorias-h2').textContent = h2;
  document.getElementById('convocatorias-grid').innerHTML = cursos.map(c => {
    const cat = cats.find(k => k.id === c.category);
    const landing = LANDING_BY_COURSE[c.id];
    const poster = POSTERS[c.id];
    const alt = poster ? 'Cartel del curso de ' + c.title + ' en Valencia, inicio el ' + (proximaConvocatoria(c) || '') : '';
    const img = poster
      ? `<img src="${escapeAttr(poster)}" alt="${escapeAttr(alt)}" loading="lazy">`
      : (c.cover ? coverImgHtml(c.cover) : '');
    const horas = /(\d+)\s*h\b/.exec(c.duration || '');
    return `
    <article class="convocatoria">
      <div class="convocatoria-img">${img}</div>
      <div class="convocatoria-body">
        ${cat ? `<div class="convocatoria-tag">${escapeHtml(cat.label)}</div>` : ''}
        <h3 class="convocatoria-title">${escapeHtml(c.title)}</h3>
        <div class="convocatoria-fecha"><i class="ico ico-cal" aria-hidden="true"></i> Inicio: ${escapeHtml(proximaConvocatoria(c))}</div>
        <div class="convocatoria-meta">Presencial en Valencia${horas ? ' · ' + horas[1] + ' h' : ''}</div>
        <p class="convocatoria-desc">${escapeHtml(c.shortDescription || c.description || '')}</p>
        <div class="convocatoria-ctas">
          <button type="button" class="btn btn-dark btn-sm" onclick="openCursoInfoForm('${escapeJs(c.title)}')">Solicitar plaza</button>
          ${landing ? `<a class="btn btn-outline btn-sm" href="${escapeAttr(landing)}">Ver temario</a>` : ''}
        </div>
      </div>
    </article>`;
  }).join('');
  sec.hidden = false;
  if (link) {
    document.getElementById('hero-convocatoria-txt').textContent = 'Próximos inicios: ' + textoInicios(cursos, false);
    link.hidden = false;
    if (!link._wired) {
      link._wired = true;
      link.addEventListener('click', e => {
        e.preventDefault();
        const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        sec.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      });
    }
  }
}
window.renderConvocatorias = renderConvocatorias;

function renderPublicCourseFilters() {
  const bar = document.getElementById('cursos-pub-filters');
  if (!bar) return;
  const categories = getCategories();
  if (categories.length === 0) { bar.innerHTML = ''; return; }
  const chips = [
    `<button class="cursos-pub-filter active" data-cat="all" onclick="filterCursosPublic(this,'all')">Todas</button>`,
    ...categories.map(cat =>
      `<button class="cursos-pub-filter" data-cat="${cat.id}" onclick="filterCursosPublic(this,'${cat.id}')">${escapeHtml(cat.label)}</button>`
    )
  ];
  bar.innerHTML = chips.join('');
}
function filterCursosPublic(btn, catId) {
  document.querySelectorAll('.cursos-pub-filter').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  applyCursosPubFilters();
}
function applyCursosPubFilters() {
  const input = document.getElementById('cursos-pub-search-input');
  const term = input ? normalizeSearch(input.value.trim()) : '';
  const activeChip = document.querySelector('#cursos-pub-filters .cursos-pub-filter.active');
  const activeCat = activeChip ? activeChip.dataset.cat : 'all';
  document.querySelectorAll('#cursos-pub-grid .cursos-pub-card').forEach(card => {
    const text = card.getAttribute('data-search') || '';
    card.classList.toggle('is-filtered', term !== '' && text.indexOf(term) === -1);
  });
  let anyVisible = false;
  document.querySelectorAll('#cursos-pub-grid .cursos-pub-category').forEach(sec => {
    const catId = sec.getAttribute('data-category');
    const catMatch = (activeCat === 'all' || catId === activeCat);
    const hasVisibleCard = Array.from(sec.querySelectorAll('.cursos-pub-card')).some(c => !c.classList.contains('is-filtered'));
    const show = catMatch && hasVisibleCard;
    sec.classList.toggle('is-hidden', !show);
    if (show) anyVisible = true;
  });
  const noRes = document.getElementById('cursos-pub-noresults');
  if (noRes) noRes.style.display = anyVisible ? 'none' : '';
}
function goToCursosCategory(catId) {
  goTo('cursos','docencia');
  // After page renders, activate the chip and scroll to section
  setTimeout(() => {
    const btn = document.querySelector(`.cursos-pub-filter[data-cat="${catId}"]`);
    filterCursosPublic(btn || null, catId);
    const target = document.getElementById('cat-' + catId);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 30);
}
// En el catálogo público, si la usuaria está logueada y matriculada en un
// curso, su card muestra "Entrar al curso" en vez de "Solicitar información".
// Idempotente: reescribe TODOS los slots según el estado de sesión actual,
// así también restaura los botones por defecto al cerrar sesión.
async function decoratePublicCourseCards() {
  const slots = document.querySelectorAll('.cursos-pub-card-cta-slot');
  if (!slots.length) return;
  let accessible = new Set();
  try {
    const email = await currentUserEmail();
    if (email) {
      if (isAdminEmail(email)) {
        accessible = new Set(getPublicCourses().map(c => c.id));
      } else if (window.enrollments) {
        (await window.enrollments.coursesForUser(email)).forEach(id => accessible.add(id));
      }
    }
  } catch (e) { /* sin sesión o fallo puntual: se quedan los CTA por defecto */ }
  slots.forEach(slot => {
    const id = slot.dataset.cursoId;
    const title = slot.dataset.cursoTitle || '';
    if (accessible.has(id)) {
      slot.innerHTML = `<button class="btn btn-dark btn-sm cursos-pub-card-cta cursos-pub-card-cta--enrolled" onclick="openAulaCurso('${escapeJs(id)}')">Entrar al curso <i class="ico ico-arrow" aria-hidden="true"></i></button>`;
    } else {
      slot.innerHTML = `<button class="btn btn-dark btn-sm cursos-pub-card-cta" onclick="openCursoInfoForm('${escapeJs(title)}')">Solicitar información</button>`;
    }
  });
}
window.decoratePublicCourseCards = decoratePublicCourseCards;

function renderPublicCourses() {
  const grid = document.getElementById('cursos-pub-grid');
  if (!grid) return;
  renderPublicCourseFilters();
  const courses = getPublicCourses();
  if (courses.length === 0) {
    grid.innerHTML = '<div class="cursos-pub-empty">Estamos actualizando el catálogo. Llámanos al 601 05 67 06 y te contamos los próximos cursos.</div>';
    return;
  }
  const categories = getCategories();
  // Si no hay categorías definidas, render plano (compatibilidad)
  if (categories.length === 0) {
    grid.innerHTML = courses.map(renderCourseCardPublic).join('');
    decoratePublicCourseCards();
    return;
  }
  // Agrupado por categoría, en el orden definido en PRECISSA_CATEGORIES
  const blocks = categories.map(cat => {
    const inCat = courses.filter(c => c.category === cat.id);
    if (inCat.length === 0) return '';
    return `
      <section class="cursos-pub-category" id="cat-${cat.id}" data-category="${cat.id}">
        <header class="cursos-pub-category-head">
          <h3 class="cursos-pub-category-title">${escapeHtml(cat.label)} <span class="cursos-pub-category-count">${inCat.length}</span></h3>
          <p class="cursos-pub-category-tagline">${escapeHtml(cat.tagline || '')}</p>
        </header>
        <div class="cursos-pub-category-cards">
          ${inCat.map(renderCourseCardPublic).join('')}
        </div>
      </section>`;
  }).filter(Boolean).join('');
  // Cursos sin categoría asignada (compatibilidad) — al final
  const orphans = courses.filter(c => !categories.find(cat => cat.id === c.category));
  const orphansBlock = orphans.length === 0 ? '' : `
    <section class="cursos-pub-category">
      <header class="cursos-pub-category-head">
        <h3 class="cursos-pub-category-title">Otros cursos</h3>
      </header>
      <div class="cursos-pub-category-cards">
        ${orphans.map(renderCourseCardPublic).join('')}
      </div>
    </section>`;
  grid.innerHTML = blocks + orphansBlock;
  decoratePublicCourseCards();
  // Al volver del detalle de un curso el buscador conserva el texto: el
  // filtro debe volver a aplicarse sobre la cuadrícula recién pintada.
  applyCursosPubFilters();
}

// ─── AULA · CONTROL DE ACCESO POR ALUMNA ────────────────
// Cada curso puede llevar un campo `enrolledEmails: ['a@x', 'b@y']`.
// - Sin ese campo (o vacío) → visible para cualquier alumna logueada.
// - Con emails → solo visible si el email de la alumna está en la lista.
//
// Superadmins: estos emails ven SIEMPRE todos los cursos, sin importar
// si hay Google Sheet configurada o lo que diga `enrolledEmails`.
const PRECISSA_ADMIN_EMAILS = [
  'carlosalbiachperez@gmail.com',
  'beautysecrets.betty@gmail.com',
  'precissainstitute@gmail.com'
];
// Exponerla en window: admin.js la lee como fuente única (un const no
// crea propiedad en window por sí solo).
window.PRECISSA_ADMIN_EMAILS = PRECISSA_ADMIN_EMAILS;
function isAdminEmail(email) {
  if (!email) return false;
  return PRECISSA_ADMIN_EMAILS.some(a => a.toLowerCase().trim() === email);
}
async function currentUserEmail() {
  if (!window.auth || !window.auth.getClient) return null;
  const client = window.auth.getClient();
  if (!client) return null;
  try {
    const { data: { user } } = await client.auth.getUser();
    return (user && user.email) ? user.email.toLowerCase().trim() : null;
  } catch (e) { return null; }
}
async function canAccessCourse(course) {
  if (!course) return false;
  const email = await currentUserEmail();
  return canAccessCourseFor(email, course);
}

// Versión optimizada para loops: recibe el email ya resuelto.
// Evita llamar a currentUserEmail() en cada iteración.
async function canAccessCourseFor(email, course) {
  if (!course) return false;
  // 0) Superadmins: acceso total siempre.
  if (isAdminEmail(email)) return true;
  // 1) Si hay matrículas configuradas (Supabase/Sheet), manda esa fuente.
  if (window.enrollments && window.enrollments.isConfigured()) {
    if (!email) return false;
    return await window.enrollments.canAccess(email, course.id);
  }
  // 2) Modo legacy (sin matrículas): array enrolledEmails del JSON.
  if (!course.enrolledEmails || course.enrolledEmails.length === 0) return true;
  if (!email) return false;
  return course.enrolledEmails.some(e => String(e).toLowerCase().trim() === email);
}

// ─── ADMIN · panel de matrículas ───────────────────────
let _admUsersCache    = [];   // [{id, email, full_name, created_at}, ...]
let _admEnrollsCache  = [];   // [{email, course_id, expires_at, updated_at}, ...]
let _admModalEmail    = '';

function admDefaultExpiry() {
  // Por defecto: 1 año desde hoy (yyyy-mm-dd)
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}
function admIsExpired(iso) {
  if (!iso) return false;
  return new Date(iso).getTime() <= Date.now();
}
function admFormatDate(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' }); }
  catch (e) { return iso; }
}

async function openAdmin() {
  // Routing ya nos ha traído. Verifica permisos y carga datos.
  if (!window.admin) {
    document.getElementById('adm-table-host').innerHTML =
      '<div class="adm-warn">No se ha cargado admin.js. Revisa la consola.</div>';
    return;
  }
  const ok = await window.admin.isAdmin();
  const tabs = document.getElementById('adm-tabs');
  if (!ok) {
    if (tabs) tabs.style.display = 'none';
    document.getElementById('adm-panel-resenas').style.display = 'none';
    document.getElementById('adm-panel-cursos').style.display = 'none';
    document.getElementById('adm-panel-alumnas').style.display = '';
    document.getElementById('adm-table-host').innerHTML =
      '<div class="adm-warn">Esta sección es solo para administradoras.</div>';
    document.getElementById('adm-sub-count').textContent = 'Sin permisos';
    return;
  }
  // Reset de pestañas: siempre se entra por «Alumnas» y se recargan los datos.
  if (tabs) tabs.style.display = '';
  _resLoaded = false;
  _cursLoaded = false;
  _aparLoaded = false;
  switchAdmTab('alumnas');
  document.getElementById('adm-table-host').innerHTML = '<div class="adm-loader">Cargando alumnas…</div>';
  document.getElementById('adm-warn-area').innerHTML = '';
  try {
    const [users, enrolls] = await Promise.all([
      window.admin.listAllUsers(),
      window.admin.listAllEnrollments()
    ]);
    _admUsersCache   = users || [];
    _admEnrollsCache = enrolls || [];
    document.getElementById('adm-sub-count').textContent =
      `${_admUsersCache.length} ${_admUsersCache.length === 1 ? 'alumna registrada' : 'alumnas registradas'}`;
    renderAdmTable();
  } catch (err) {
    console.error('[admin] error cargando', err);
    document.getElementById('adm-warn-area').innerHTML =
      '<div class="adm-warn">⚠️ Error leyendo de Supabase. Comprueba que has ejecutado <code>supabase/setup.sql</code> y que tu email está en la lista de admins. <br><small>' + escapeHtml(String(err && err.message || err)) + '</small></div>';
    document.getElementById('adm-table-host').innerHTML = '';
  }
}

function renderAdmTable() {
  const q = (document.getElementById('adm-search-input').value || '').toLowerCase().trim();
  const enrollsByEmail = {};
  _admEnrollsCache.forEach(en => {
    const k = (en.email || '').toLowerCase();
    if (!enrollsByEmail[k]) enrollsByEmail[k] = [];
    enrollsByEmail[k].push(en);
  });
  const filtered = _admUsersCache.filter(u => {
    if (!q) return true;
    const hay = (u.email + ' ' + (u.full_name || '')).toLowerCase();
    return hay.includes(q);
  });
  if (filtered.length === 0) {
    document.getElementById('adm-table-host').innerHTML =
      '<div class="adm-no-results">No se encontraron alumnas con ese filtro.</div>';
    return;
  }
  const rows = filtered.map(u => {
    const list    = enrollsByEmail[u.email.toLowerCase()] || [];
    const live    = list.filter(e => !admIsExpired(e.expires_at));
    const count   = live.length;
    const isAdmin = isAdminEmail(u.email.toLowerCase().trim());
    const latest  = list.length
      ? list.map(e => e.updated_at || e.expires_at || '').filter(Boolean).sort().slice(-1)[0]
      : null;
    const accessCell = isAdmin
      ? `<span class="adm-admin-badge" title="Acceso total como administradora">Admin</span>`
      : `<span class="adm-cell-count ${count === 0 ? 'zero' : ''}">${count === 0 ? 'sin accesos' : count}</span>`;
    return `
      <tr class="adm-row" onclick="openAdmEditor('${escapeJs(u.email)}')">
        <td>
          <div class="adm-email">${escapeHtml(u.email)}</div>
          ${u.full_name ? `<div class="adm-name">${escapeHtml(u.full_name)}</div>` : ''}
        </td>
        <td>${accessCell}</td>
        <td><span class="adm-cell-date">${latest ? 'Última modif. ' + admFormatDate(latest) : '—'}</span></td>
        <td class="adm-cell-edit"><button class="adm-curso-edit-btn" onclick="event.stopPropagation();openAdmEditor('${escapeJs(u.email)}')">Editar</button></td>
      </tr>`;
  }).join('');
  document.getElementById('adm-table-host').innerHTML = `
    <div class="adm-table-scroll">
    <table class="adm-table">
      <thead><tr>
        <th>Alumna</th>
        <th>Accesos activos</th>
        <th>Actividad</th>
        <th></th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    </div>`;
}

async function openAdmEditor(email) {
  _admModalEmail = email;
  document.getElementById('adm-modal-email').textContent = email;
  const profile = _admUsersCache.find(u => u.email === email);
  document.getElementById('adm-modal-name').textContent = (profile && profile.full_name) ? profile.full_name : '';
  document.getElementById('adm-modal-body').innerHTML = '<div class="adm-loader">Cargando…</div>';
  document.getElementById('adm-modal').classList.add('open');

  const enrolls = await window.admin.listEnrollmentsForEmail(email);
  const enrollMap = {};
  enrolls.forEach(en => { enrollMap[en.course_id] = en; });

  const courses = (window.PRECISSA_COURSES || []).slice()
    .sort((a, b) => (a.title || '').localeCompare(b.title || ''));

  const rows = courses.map(c => {
    const en       = enrollMap[c.id];
    const has      = Boolean(en);
    const isPerm   = has && !en.expires_at;
    const dateVal  = has && en.expires_at ? en.expires_at.slice(0, 10) : admDefaultExpiry();
    const search   = (c.title + ' ' + c.id + ' ' + (c.shortDescription || '') + ' ' + (c.description || '')).toLowerCase();
    return `
      <div class="adm-course-row" data-course="${escapeAttr(c.id)}" data-search="${escapeAttr(search)}">
        <input type="checkbox" ${has ? 'checked' : ''} onchange="onAdmCheckChange(this)">
        <div class="adm-course-name">
          ${escapeHtml(c.title)}
          <small>${escapeHtml(c.id)}</small>
        </div>
        <input type="date" value="${dateVal}" ${(has && !isPerm) ? '' : 'disabled'}>
        <select onchange="onAdmModeChange(this)" ${has ? '' : 'disabled'}>
          <option value="fecha" ${has && !isPerm ? 'selected' : ''}>Caduca el…</option>
          <option value="sin"   ${isPerm ? 'selected' : ''}>Sin caducidad</option>
        </select>
      </div>`;
  }).join('');
  document.getElementById('adm-modal-body').innerHTML = `
    <div class="adm-modal-search">
      <input type="search" id="adm-modal-search-input" class="cursos-search-input"
             placeholder="Buscar curso…"
             oninput="filterAdmModalCourses()">
    </div>
    <div id="adm-modal-empty" class="adm-modal-empty" style="display:none">No hay cursos que coincidan con esa búsqueda.</div>
    <div id="adm-modal-course-list">${rows}</div>`;
}

function filterAdmModalCourses() {
  const q = (document.getElementById('adm-modal-search-input').value || '').toLowerCase().trim();
  const rows = document.querySelectorAll('#adm-modal-course-list .adm-course-row');
  let visible = 0;
  rows.forEach(row => {
    const hay = row.dataset.search || '';
    const show = !q || hay.indexOf(q) !== -1;
    row.style.display = show ? '' : 'none';
    if (show) visible++;
  });
  const empty = document.getElementById('adm-modal-empty');
  if (empty) empty.style.display = (visible === 0) ? '' : 'none';
}

function onAdmCheckChange(cb) {
  const row    = cb.closest('.adm-course-row');
  const date   = row.querySelector('input[type="date"]');
  const mode   = row.querySelector('select');
  mode.disabled = !cb.checked;
  date.disabled = !cb.checked || mode.value === 'sin';
}
function onAdmModeChange(sel) {
  const row  = sel.closest('.adm-course-row');
  const date = row.querySelector('input[type="date"]');
  date.disabled = sel.value === 'sin';
}

function closeAdmModal() {
  document.getElementById('adm-modal').classList.remove('open');
  _admModalEmail = '';
}

async function saveAdmModal() {
  if (!_admModalEmail) return;
  const btn = document.getElementById('adm-save-btn');
  btn.disabled = true; btn.textContent = 'Guardando…';
  try {
    const rows = document.querySelectorAll('#adm-modal-body .adm-course-row');
    for (const row of rows) {
      const courseId = row.dataset.course;
      const cb       = row.querySelector('input[type="checkbox"]');
      const dateIn   = row.querySelector('input[type="date"]');
      const modeSel  = row.querySelector('select');
      if (cb.checked) {
        let expiresAt = null;
        if (modeSel.value === 'fecha' && dateIn.value) {
          // Caduca al final del día elegido (23:59:59)
          expiresAt = new Date(dateIn.value + 'T23:59:59').toISOString();
        }
        await window.admin.upsertEnrollment(_admModalEmail, courseId, expiresAt);
      } else {
        await window.admin.deleteEnrollment(_admModalEmail, courseId);
      }
    }
    closeAdmModal();
    if (window.enrollments) window.enrollments.invalidate();
    openAdmin(); // refrescar tabla
  } catch (err) {
    console.error('[admin] save', err);
    alert('Error guardando: ' + (err && err.message || err));
  } finally {
    btn.disabled = false; btn.textContent = 'Guardar cambios';
  }
}

// ─── ADMIN · RESEÑAS DE ALUMNAS ─────────────────────────
let _resCache = [];
let _resEditingId = null;   // null = creando; uuid = editando
let _resPhotoUrl  = null;   // URL actual (existente o recién subida)
let _resNewFile   = null;   // File pendiente de subir
let _resLoaded    = false;

function switchAdmTab(tab) {
  document.querySelectorAll('.adm-tab').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === tab));
  document.getElementById('adm-panel-alumnas').style.display = (tab === 'alumnas') ? '' : 'none';
  document.getElementById('adm-panel-resenas').style.display = (tab === 'resenas') ? '' : 'none';
  document.getElementById('adm-panel-cursos').style.display  = (tab === 'cursos')  ? '' : 'none';
  document.getElementById('adm-panel-aparatologia').style.display = (tab === 'aparatologia') ? '' : 'none';
  if (tab === 'resenas' && !_resLoaded)  loadResenas();
  if (tab === 'cursos'  && !_cursLoaded) loadCursosAdmin();
  if (tab === 'aparatologia' && !_aparLoaded) loadAparatologiaAdmin();
}

async function loadResenas() {
  const host = document.getElementById('adm-resenas-host');
  host.innerHTML = '<div class="adm-loader">Cargando reseñas…</div>';
  try {
    _resCache = (await window.testimonials.list()) || [];
    _resLoaded = true;
    renderResenas();
  } catch (err) {
    console.error('[admin] loadResenas', err);
    host.innerHTML = '<div class="adm-warn">⚠️ Error leyendo las reseñas. ¿Has ejecutado <code>supabase/testimonials.sql</code>?<br><small>' + escapeHtml(String(err && err.message || err)) + '</small></div>';
  }
}

function renderResenas() {
  const host  = document.getElementById('adm-resenas-host');
  const count = document.getElementById('adm-resenas-count');
  count.textContent = `${_resCache.length} ${_resCache.length === 1 ? 'reseña' : 'reseñas'}`;
  if (_resCache.length === 0) {
    host.innerHTML = '<div class="adm-no-results">Aún no hay reseñas. Pulsa «+ Nueva reseña» para crear la primera.</div>';
    return;
  }
  const phs = ['ph-rose', 'ph-clay', 'ph-sand', 'ph-honey'];
  host.innerHTML = '<div class="adm-resenas-grid">' + _resCache.map((t, i) => {
    const thumb = t.photo_url
      ? `<div class="adm-res-thumb"><img src="${escapeAttr(t.photo_url)}" alt="${escapeAttr(t.name)}" loading="lazy"></div>`
      : `<div class="adm-res-thumb ph ${phs[i % phs.length]}"></div>`;
    return `
      <div class="adm-res-card">
        ${thumb}
        <div class="adm-res-body">
          <div class="adm-res-quote">"${escapeHtml(t.quote || '')}"</div>
          <div class="adm-res-name">${escapeHtml(t.name || '')}</div>
          ${t.centro ? `<div class="adm-res-centro">${escapeHtml(t.centro)}</div>` : ''}
          <div class="adm-res-foot">
            <button onclick="openResEditor('${escapeJs(t.id)}')">Editar</button>
            <button class="adm-danger" onclick="deleteRes('${escapeJs(t.id)}')">Eliminar</button>
          </div>
        </div>
      </div>`;
  }).join('') + '</div>';
}

function openResEditor(id) {
  _resEditingId = id || null;
  _resNewFile   = null;
  const t = id ? _resCache.find(x => x.id === id) : null;
  _resPhotoUrl = t ? (t.photo_url || null) : null;
  document.getElementById('res-modal-title').textContent = id ? 'Editar reseña' : 'Nueva reseña';
  document.getElementById('res-quote').value  = t ? (t.quote  || '') : '';
  document.getElementById('res-name').value   = t ? (t.name   || '') : '';
  document.getElementById('res-centro').value = t ? (t.centro || '') : '';
  document.getElementById('res-photo-input').value = '';
  document.getElementById('res-delete-btn').style.display = id ? '' : 'none';
  renderResPhotoPreview();
  document.getElementById('res-modal').classList.add('open');
}

function closeResModal() {
  document.getElementById('res-modal').classList.remove('open');
}

function renderResPhotoPreview() {
  const prev = document.getElementById('res-photo-preview');
  const removeBtn = document.getElementById('res-photo-remove');
  let src = _resPhotoUrl;
  if (_resNewFile) src = URL.createObjectURL(_resNewFile);
  if (src) {
    prev.innerHTML = `<img src="${escapeAttr(src)}" alt="">`;
    removeBtn.style.display = '';
  } else {
    prev.innerHTML = '<span>Sin foto</span>';
    removeBtn.style.display = 'none';
  }
}

function onResPhotoChange(input) {
  const f = input.files && input.files[0];
  if (!f) return;
  _resNewFile = f;
  renderResPhotoPreview();
}

function clearResPhoto() {
  _resNewFile  = null;
  _resPhotoUrl = null;
  document.getElementById('res-photo-input').value = '';
  renderResPhotoPreview();
}

async function saveResModal() {
  const btn = document.getElementById('res-save-btn');
  const quote  = document.getElementById('res-quote').value.trim();
  const name   = document.getElementById('res-name').value.trim();
  const centro = document.getElementById('res-centro').value.trim();
  if (!quote || !name) { alert('La frase y el nombre son obligatorios.'); return; }
  btn.disabled = true; btn.textContent = 'Guardando…';
  try {
    let photoUrl = _resPhotoUrl;
    if (_resNewFile) {
      btn.textContent = 'Subiendo foto…';
      photoUrl = await window.testimonials.uploadPhoto(_resNewFile);
    }
    const fields = { quote, name, centro: centro || null, photo_url: photoUrl || null };
    if (_resEditingId) {
      await window.testimonials.update(_resEditingId, fields);
    } else {
      // nueva reseña: la colocamos al final
      const maxOrder = _resCache.reduce((m, r) => Math.max(m, r.sort_order || 0), 0);
      await window.testimonials.create(Object.assign(fields, { sort_order: maxOrder + 1 }));
    }
    closeResModal();
    await loadResenas();
    renderTestimonials(); // refrescar la home en vivo
  } catch (err) {
    console.error('[admin] saveResModal', err);
    alert('Error guardando la reseña: ' + (err && err.message || err));
  } finally {
    btn.disabled = false; btn.textContent = 'Guardar';
  }
}

async function deleteRes(id) {
  const t = _resCache.find(x => x.id === id);
  if (!confirm('¿Eliminar la reseña de ' + (t ? t.name : 'esta alumna') + '? No se puede deshacer.')) return;
  try {
    await window.testimonials.remove(id);
    await loadResenas();
    renderTestimonials();
  } catch (err) {
    console.error('[admin] deleteRes', err);
    alert('Error eliminando la reseña: ' + (err && err.message || err));
  }
}

function deleteResFromModal() {
  if (!_resEditingId) return;
  const id = _resEditingId;
  closeResModal();
  deleteRes(id);
}

// ─── ADMIN · VISIBILIDAD DE CURSOS EN LA WEB ────────────
let _cursLoaded = false;

async function loadCursosAdmin() {
  const host = document.getElementById('adm-cursos-host');
  host.innerHTML = '<div class="adm-loader">Cargando cursos…</div>';
  try {
    const tasks = [];
    if (window.courseVisibility) tasks.push(window.courseVisibility.load());
    if (window.courseContent)    tasks.push(window.courseContent.load());
    await Promise.all(tasks);
    _cursLoaded = true;
    renderCursosAdmin();
  } catch (err) {
    console.error('[admin] loadCursosAdmin', err);
    host.innerHTML = '<div class="adm-warn">⚠️ Error leyendo la visibilidad de cursos. ¿Has ejecutado <code>supabase/course-visibility.sql</code>?<br><small>' + escapeHtml(String(err && err.message || err)) + '</small></div>';
  }
}

function renderCursosAdmin() {
  const host = document.getElementById('adm-cursos-host');
  let courses = getCourses();
  if (courses.length === 0) {
    host.innerHTML = '<div class="adm-no-results">Aún no hay cursos. Crea el primero con «+ Nuevo curso».</div>';
    return;
  }
  const cats = getCategories();
  const catLabel = {};
  cats.forEach(c => { catLabel[c.id] = c.label; });
  // Filtro de búsqueda (título, id o categoría)
  const searchEl = document.getElementById('adm-cursos-search');
  const q = searchEl ? normalizeSearch(searchEl.value) : '';
  if (q) {
    courses = courses.filter(c => normalizeSearch(
      [c.title, c.id, catLabel[c.category] || c.category, c.eyebrow].filter(Boolean).join(' ')
    ).includes(q));
    if (courses.length === 0) {
      host.innerHTML = '<div class="adm-no-results">No se encontraron cursos con ese filtro.</div>';
      return;
    }
  }
  // Orden por categorías definidas; los sin categoría conocida, al final.
  const order = cats.map(c => c.id);
  const groups = {};
  courses.forEach(c => {
    const k = (order.indexOf(c.category) !== -1) ? c.category : '_otros';
    (groups[k] = groups[k] || []).push(c);
  });
  const keys = order.filter(k => groups[k]);
  if (groups._otros) keys.push('_otros');

  host.innerHTML = keys.map(k => {
    const label = (k === '_otros') ? 'Otros' : (catLabel[k] || k);
    const rows = groups[k]
      .slice().sort((a, b) => (a.title || '').localeCompare(b.title || ''))
      .map(courseVisibilityRow).join('');
    return `<div class="adm-cursos-cat">
      <div class="adm-cursos-cat-title">${escapeHtml(label)}</div>
      ${rows}
    </div>`;
  }).join('');
}

function courseVisibilityRow(c) {
  const hidden  = window.courseVisibility ? window.courseVisibility.isHidden(c.id) : false;
  const checked = hidden ? '' : 'checked';
  const edited = window.courseContent && window.courseContent.getOverride && window.courseContent.getOverride(c.id);
  return `
    <div class="adm-curso-row" data-course="${escapeAttr(c.id)}">
      <div class="adm-curso-info">
        <div class="adm-curso-title">${escapeHtml(c.title || c.id)}${edited ? ' <span class="adm-curso-edited" title="Tiene cambios guardados desde el panel">editado</span>' : ''}<small>${escapeHtml(c.id)}</small></div>
      </div>
      <button class="adm-curso-edit-btn" onclick="openCourseEditor('${escapeJs(c.id)}')">Editar</button>
      <span class="adm-curso-state ${hidden ? 'off' : 'on'}">${hidden ? 'Oculto' : 'Visible'}</span>
      <label class="adm-switch">
        <input type="checkbox" ${checked} onchange="toggleCourseVisibility('${escapeAttr(c.id)}', this)">
        <span class="adm-switch-slider"></span>
      </label>
    </div>`;
}

async function toggleCourseVisibility(courseId, cb) {
  const hidden = !cb.checked;               // sin marcar = oculto
  const row    = cb.closest('.adm-curso-row');
  const state  = row ? row.querySelector('.adm-curso-state') : null;
  cb.disabled = true;
  try {
    await window.courseVisibility.setHidden(courseId, hidden);
    if (state) {
      state.textContent = hidden ? 'Oculto' : 'Visible';
      state.classList.toggle('off', hidden);
      state.classList.toggle('on', !hidden);
    }
    renderPublicCourses(); // refrescar el catálogo público en vivo
  } catch (err) {
    console.error('[admin] toggleCourseVisibility', err);
    cb.checked = !cb.checked; // revertir
    alert('No se pudo cambiar la visibilidad: ' + (err && err.message || err));
  } finally {
    cb.disabled = false;
  }
}

// ─── ADMIN · EDITOR DE CURSO (metadatos / lecciones / test) ──────
let _ceCourseId  = null;
let _ceIsNew     = false;
let _ceLessons   = [];
let _ceTest      = [];
let _ceLessonsDirty = false;
let _ceTestDirty    = false;
let _ceCoverNewFile = null;
let _ceCoverCleared = false;
let _ceCoverUrl     = null;   // portada efectiva actual
let _ceMateriaNewFile = null; // .md de materia pendiente de subir
let _ceMateriaTextDirty = false;  // se ha editado el texto en el textarea
let _ceMateriaTextLoaded = false; // el textarea ya cargó el contenido

function clone(x) { try { return JSON.parse(JSON.stringify(x)); } catch (e) { return x; } }

function openCourseEditor(id) {
  const isNew = !id;
  const cats  = getCategories();
  const course = isNew
    ? { id: '', title: '', eyebrow: '', level: '', duration: '', shortDescription: '', description: '', category: (cats[0] && cats[0].id) || '', cover: '', sourceDoc: '', lessons: [], test: { questions: [] } }
    : getCourses().find(c => c.id === id);
  if (!course) { alert('Curso no encontrado.'); return; }
  _ceCourseId = isNew ? '' : id;
  _ceIsNew    = isNew;
  document.getElementById('ce-title').textContent = isNew ? 'Nuevo curso' : 'Editar curso';
  document.getElementById('ce-subtitle').textContent = isNew ? 'Rellena los datos y guarda' : ((course.title || id) + ' · ' + id);

  // Datos
  document.getElementById('ce-title-in').value = course.title || '';
  document.getElementById('ce-eyebrow').value  = course.eyebrow || '';
  document.getElementById('ce-level').value    = course.level || '';
  document.getElementById('ce-duration').value = course.duration || '';
  document.getElementById('ce-short').value    = course.shortDescription || '';
  document.getElementById('ce-desc').value     = course.description || '';
  document.getElementById('ce-source').value   = course.sourceDoc || '';
  // Materia (archivo .md privado): mostramos su estado actual
  _ceMateriaNewFile = null;
  ceMateriaResetEditor();
  renderCeMateriaStatus(course.sourceDoc);
  // Categoría
  document.getElementById('ce-category').innerHTML = cats.map(c =>
    `<option value="${escapeAttr(c.id)}" ${c.id === course.category ? 'selected' : ''}>${escapeHtml(c.label)}</option>`
  ).join('');
  // Botón eliminar: solo en cursos existentes
  const delBtn = document.getElementById('ce-delete-btn');
  delBtn.style.display = isNew ? 'none' : '';
  delBtn.textContent   = 'Eliminar curso';
  // Portada
  _ceCoverNewFile = null; _ceCoverCleared = false;
  _ceCoverUrl = course.cover || null;
  document.getElementById('ce-cover-input').value = '';
  renderCeCoverPreview();

  // Lecciones y test (copia profunda para no mutar los originales)
  _ceLessons = clone(course.lessons || []);
  _ceTest    = clone((course.test && course.test.questions) || []);
  _ceLessonsDirty = false; _ceTestDirty = false;
  renderCeLessons();
  renderCeTest();

  switchCeTab('datos');
  document.getElementById('ce-modal').classList.add('open');
}

function closeCourseEditor() {
  document.getElementById('ce-modal').classList.remove('open');
}

function switchCeTab(tab) {
  document.querySelectorAll('.adm-subtab').forEach(b => b.classList.toggle('active', b.dataset.cetab === tab));
  document.getElementById('ce-panel-datos').style.display     = (tab === 'datos')     ? '' : 'none';
  document.getElementById('ce-panel-lecciones').style.display = (tab === 'lecciones') ? '' : 'none';
  document.getElementById('ce-panel-test').style.display      = (tab === 'test')      ? '' : 'none';
}

// — Portada —
function renderCeCoverPreview() {
  const prev = document.getElementById('ce-cover-preview');
  const rm   = document.getElementById('ce-cover-remove');
  let src = _ceCoverUrl;
  if (_ceCoverNewFile) src = URL.createObjectURL(_ceCoverNewFile);
  if (src) { prev.innerHTML = `<img src="${escapeAttr(src)}" alt="">`; rm.style.display = ''; }
  else     { prev.innerHTML = '<span>Sin portada</span>'; rm.style.display = 'none'; }
}
function onCeCoverChange(input) {
  const f = input.files && input.files[0];
  if (!f) return;
  _ceCoverNewFile = f; _ceCoverCleared = false;
  renderCeCoverPreview();
}
function clearCeCover() {
  _ceCoverNewFile = null; _ceCoverCleared = true; _ceCoverUrl = null;
  document.getElementById('ce-cover-input').value = '';
  renderCeCoverPreview();
}

// — Materia (.md privado) —
function renderCeMateriaStatus(currentRef) {
  const st = document.getElementById('ce-materia-status');
  if (!st) return;
  if (_ceMateriaNewFile) {
    st.textContent = 'Pendiente de subir: ' + _ceMateriaNewFile.name;
    st.classList.add('ok');
  } else if (currentRef) {
    const isPriv = window.courseContent && window.courseContent.isPrivateRef && window.courseContent.isPrivateRef(currentRef);
    st.textContent = isPriv ? 'Materia protegida cargada ✓' : ('Materia actual: ' + currentRef);
    st.classList.remove('ok');
  } else {
    st.textContent = 'Sin materia asignada.';
    st.classList.remove('ok');
  }
}
function ceMateriaSetFile(f) {
  if (!f) return;
  const ok = /\.(md|markdown|txt)$/i.test(f.name) || f.type === 'text/markdown' || f.type === 'text/plain';
  if (!ok) { alert('La materia debe ser un archivo .md (Markdown).'); return; }
  _ceMateriaNewFile = f;
  renderCeMateriaStatus(document.getElementById('ce-source').value);
}
function ceMateriaFileChange(input) { ceMateriaSetFile(input.files && input.files[0]); }
function ceMateriaDragOver(e, el) { e.preventDefault(); el.classList.add('drag'); }
function ceMateriaDragLeave(el)   { el.classList.remove('drag'); }
function ceMateriaDrop(e, el) {
  e.preventDefault(); el.classList.remove('drag');
  ceMateriaSetFile(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]);
}

// — Edición de la materia como texto plano (para retocar palabras sueltas) —
function ceMateriaResetEditor() {
  _ceMateriaTextDirty = false;
  _ceMateriaTextLoaded = false;
  const ed = document.getElementById('ce-materia-editor');
  const ta = document.getElementById('ce-materia-text');
  const btn = document.getElementById('ce-materia-edit-btn');
  if (ed) ed.style.display = 'none';
  if (ta) ta.value = '';
  if (btn) btn.textContent = '✎ Editar texto de la materia';
}
async function ceMateriaToggleEdit() {
  const ed  = document.getElementById('ce-materia-editor');
  const ta  = document.getElementById('ce-materia-text');
  const btn = document.getElementById('ce-materia-edit-btn');
  if (ed.style.display === 'none') {
    ed.style.display = '';
    btn.textContent = '▴ Ocultar editor de texto';
    if (!_ceMateriaTextLoaded) {
      const ref = document.getElementById('ce-source').value;
      if (_ceMateriaNewFile) {
        ta.value = await _ceMateriaNewFile.text();
        _ceMateriaTextLoaded = true;
      } else if (ref) {
        ta.value = ''; ta.disabled = true;
        btn.textContent = '⏳ Cargando materia…';
        try {
          ta.value = await window.courseContent.fetchMateriaText(ref);
        } catch (e) {
          ta.value = ''; alert('No se pudo cargar la materia para editar: ' + (e && e.message || e));
        } finally { ta.disabled = false; _ceMateriaTextLoaded = true; btn.textContent = '▴ Ocultar editor de texto'; }
      } else {
        ta.value = ''; _ceMateriaTextLoaded = true;
      }
      ta.oninput = function () { _ceMateriaTextDirty = true; };
    }
  } else {
    ed.style.display = 'none';
    btn.textContent = '✎ Editar texto de la materia';
  }
}

// — Lecciones —
function renderCeLessons() {
  const host = document.getElementById('ce-lessons-list');
  if (_ceLessons.length === 0) {
    host.innerHTML = '<p class="res-hint" style="margin-bottom:12px">Este curso no tiene lecciones. Añade una con el botón de abajo.</p>';
    return;
  }
  host.innerHTML = _ceLessons.map((l, i) => {
    const isPrivSlide = window.courseContent && window.courseContent.isPrivateRef && window.courseContent.isPrivateRef(l.slides);
    const status = l._newFile ? ('Pendiente de subir: ' + l._newFile.name)
                              : (isPrivSlide ? 'Slide protegido cargado ✓' : (l.slides ? l.slides : 'Sin slide asignado'));
    const statusCls = l._newFile ? 'ok' : '';
    return `
      <div class="ce-lesson">
        <div class="ce-block-head">
          <span class="ce-block-num">Lección ${i + 1}</span>
          <div class="ce-block-ops">
            <button onclick="ceMoveLesson(${i},-1)" ${i === 0 ? 'disabled' : ''}>↑</button>
            <button onclick="ceMoveLesson(${i},1)" ${i === _ceLessons.length - 1 ? 'disabled' : ''}>↓</button>
            <button class="adm-danger" onclick="ceRemoveLesson(${i})">Eliminar</button>
          </div>
        </div>
        <div class="ce-row2">
          <div><span class="ce-mini-label">Título</span><input type="text" class="res-input" value="${escapeAttr(l.title || '')}" oninput="ceLessonField(${i},'title',this.value)"></div>
          <div><span class="ce-mini-label">Duración</span><input type="text" class="res-input" value="${escapeAttr(l.duration || '')}" oninput="ceLessonField(${i},'duration',this.value)"></div>
        </div>
        <div class="ce-drop" ondragover="ceLessonDragOver(event,this)" ondragleave="ceLessonDragLeave(this)" ondrop="ceLessonDrop(event,${i},this)">
          <span class="res-hint">Arrastra aquí el HTML del slide o</span>
          <button type="button" class="btn btn-text btn-sm" onclick="document.getElementById('ce-lfile-${i}').click()">elegir archivo…</button>
          <input type="file" id="ce-lfile-${i}" accept=".html,text/html" style="display:none" onchange="ceLessonFileChange(this,${i})">
          <div class="ce-drop-status ${statusCls}" id="ce-lstatus-${i}">${escapeHtml(status)}</div>
        </div>
      </div>`;
  }).join('');
}
function ceLessonField(i, key, val) { _ceLessons[i][key] = val; _ceLessonsDirty = true; }
function ceMoveLesson(i, dir) {
  const j = i + dir;
  if (j < 0 || j >= _ceLessons.length) return;
  const t = _ceLessons[i]; _ceLessons[i] = _ceLessons[j]; _ceLessons[j] = t;
  _ceLessonsDirty = true; renderCeLessons();
}
function ceRemoveLesson(i) { _ceLessons.splice(i, 1); _ceLessonsDirty = true; renderCeLessons(); }
function ceAddLesson() { _ceLessons.push({ id: '', title: '', duration: '', slides: '' }); _ceLessonsDirty = true; renderCeLessons(); }
function ceLessonDragOver(e, el) { e.preventDefault(); el.classList.add('drag'); }
function ceLessonDragLeave(el) { el.classList.remove('drag'); }
function ceLessonDrop(e, i, el) {
  e.preventDefault(); el.classList.remove('drag');
  const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
  ceLessonSetFile(i, f);
}
function ceLessonFileChange(input, i) { ceLessonSetFile(i, input.files && input.files[0]); }
function ceLessonSetFile(i, f) {
  if (!f) return;
  const isHtml = /\.html?$/i.test(f.name) || f.type === 'text/html';
  if (!isHtml) { alert('El slide debe ser un archivo HTML.'); return; }
  _ceLessons[i]._newFile = f;
  _ceLessonsDirty = true;
  const st = document.getElementById('ce-lstatus-' + i);
  if (st) { st.textContent = 'Pendiente de subir: ' + f.name; st.classList.add('ok'); }
}

// — Test —
function renderCeTest() {
  const host = document.getElementById('ce-test-list');
  if (_ceTest.length === 0) {
    host.innerHTML = '<p class="res-hint" style="margin-bottom:12px">Este curso no tiene test. Añade una pregunta con el botón de abajo.</p>';
    return;
  }
  host.innerHTML = _ceTest.map((q, i) => {
    const opts = (q.options || []).map((opt, j) => `
      <div class="ce-opt-row">
        <input type="radio" name="ce-correct-${i}" ${q.correct === j ? 'checked' : ''} onchange="ceSetCorrect(${i},${j})" title="Marcar como correcta">
        <input type="text" class="res-input" value="${escapeAttr(opt || '')}" oninput="ceOptionField(${i},${j},this.value)">
        <button onclick="ceRemoveOption(${i},${j})" title="Quitar opción">✕</button>
      </div>`).join('');
    return `
      <div class="ce-q">
        <div class="ce-block-head">
          <span class="ce-block-num">Pregunta ${i + 1}</span>
          <div class="ce-block-ops">
            <button class="adm-danger" onclick="ceRemoveQuestion(${i})">Eliminar</button>
          </div>
        </div>
        <textarea class="res-input" rows="2" placeholder="Enunciado de la pregunta" oninput="ceQField(${i},'q',this.value)">${escapeHtml(q.q || '')}</textarea>
        <p class="ce-correct-hint">Marca el círculo de la respuesta correcta.</p>
        ${opts}
        <button type="button" class="btn btn-text btn-sm" onclick="ceAddOption(${i})">+ Añadir opción</button>
      </div>`;
  }).join('');
}
function ceQField(i, key, val) { _ceTest[i][key] = val; _ceTestDirty = true; }
function ceOptionField(i, j, val) { _ceTest[i].options[j] = val; _ceTestDirty = true; }
function ceSetCorrect(i, j) { _ceTest[i].correct = j; _ceTestDirty = true; }
function ceAddOption(i) { (_ceTest[i].options = _ceTest[i].options || []).push(''); _ceTestDirty = true; renderCeTest(); }
function ceRemoveOption(i, j) {
  _ceTest[i].options.splice(j, 1);
  if (_ceTest[i].correct >= _ceTest[i].options.length) _ceTest[i].correct = 0;
  _ceTestDirty = true; renderCeTest();
}
function ceRemoveQuestion(i) { _ceTest.splice(i, 1); _ceTestDirty = true; renderCeTest(); }
function ceAddQuestion() { _ceTest.push({ q: '', options: ['', ''], correct: 0 }); _ceTestDirty = true; renderCeTest(); }

// — Guardar / restablecer —
async function saveCourseEditor() {
  const btn = document.getElementById('ce-save-btn');
  const titleVal = document.getElementById('ce-title-in').value.trim();
  if (!titleVal) { alert('El título del curso es obligatorio.'); switchCeTab('datos'); return; }
  let id = _ceCourseId;
  if (_ceIsNew) {
    id = slugify(titleVal) || ('curso-' + Date.now().toString(36));
    if (getCourses().some(c => c.id === id)) id = id + '-' + Date.now().toString(36).slice(-4);
  }
  const raw = _ceIsNew ? {} : (getRawCourse(id) || {});
  btn.disabled = true; btn.textContent = 'Guardando…';
  try {
    const fields = {};
    if (_ceIsNew) fields.deleted = false;
    // Metadatos: diff contra el valor por defecto (igual/vacío → null).
    const diff = (formVal, defVal) => {
      const a = String(formVal == null ? '' : formVal).trim();
      const b = String(defVal == null ? '' : defVal).trim();
      return (a === '' || a === b) ? null : a;
    };
    fields.title            = diff(document.getElementById('ce-title-in').value, raw.title);
    fields.eyebrow          = diff(document.getElementById('ce-eyebrow').value, raw.eyebrow);
    fields.level            = diff(document.getElementById('ce-level').value, raw.level);
    fields.duration         = diff(document.getElementById('ce-duration').value, raw.duration);
    fields.shortDescription = diff(document.getElementById('ce-short').value, raw.shortDescription);
    fields.description      = diff(document.getElementById('ce-desc').value, raw.description);
    fields.category         = diff(document.getElementById('ce-category').value, raw.category);

    // Materia (.md): prioridad → (1) texto editado a mano, (2) archivo
    // subido, (3) conservar la referencia actual. El texto y el archivo van
    // al bucket privado y se guarda su referencia 'private:'.
    if (_ceMateriaTextDirty) {
      btn.textContent = 'Guardando materia…';
      fields.sourceDoc = await window.courseContent.saveMateriaText(id, document.getElementById('ce-materia-text').value);
    } else if (_ceMateriaNewFile) {
      btn.textContent = 'Subiendo materia…';
      fields.sourceDoc = await window.courseContent.uploadMateriaPrivate(id, _ceMateriaNewFile);
    } else {
      fields.sourceDoc = diff(document.getElementById('ce-source').value, raw.sourceDoc);
    }

    // Portada
    if (_ceCoverNewFile) {
      btn.textContent = 'Subiendo portada…';
      fields.cover = await window.courseContent.uploadCover(_ceCoverNewFile);
    } else if (_ceCoverCleared) {
      fields.cover = null;
    } else {
      fields.cover = (!_ceCoverUrl || _ceCoverUrl === raw.cover) ? null : _ceCoverUrl;
    }

    // Lecciones (solo si se tocaron): subir HTML pendientes y construir array.
    if (_ceLessonsDirty) {
      const lessons = [];
      for (let i = 0; i < _ceLessons.length; i++) {
        const l = _ceLessons[i];
        const lid = (l.id && String(l.id).trim()) ? l.id : ('leccion-' + (i + 1));
        let slides = l.slides || '';
        if (l._newFile) {
          btn.textContent = 'Subiendo slide ' + (i + 1) + '…';
          slides = await window.courseContent.uploadSlidePrivate(id, lid, l._newFile);
        }
        lessons.push({ id: lid, title: l.title || '', duration: l.duration || '', slides: slides });
      }
      fields.lessons = lessons;
    }

    // Test (solo si se tocó)
    if (_ceTestDirty) {
      fields.test = { questions: _ceTest.map(q => ({
        q: q.q || '',
        options: (q.options || []).map(o => o || ''),
        correct: Number.isInteger(q.correct) ? q.correct : 0
      })) };
    }

    btn.textContent = 'Guardando…';
    await window.courseContent.save(id, fields);
    closeCourseEditor();
    await loadCursosAdmin();   // recarga overrides + re-render lista
    renderPublicCourses();     // refrescar catálogo en vivo
  } catch (err) {
    console.error('[admin] saveCourseEditor', err);
    alert('Error guardando el curso: ' + (err && err.message || err));
  } finally {
    btn.disabled = false; btn.textContent = 'Guardar';
  }
}

async function deleteCourseFromEditor() {
  if (!_ceCourseId) return;
  const id = _ceCourseId;
  const isSeed = !!getRawCourse(id);   // viene de courses-data.js
  if (!confirm('¿Eliminar este curso? Desaparecerá del catálogo, de la home y del aula (también para las alumnas matriculadas). Esta acción no se puede deshacer desde el panel.')) return;
  const btn = document.getElementById('ce-delete-btn'); btn.disabled = true;
  try {
    if (isSeed) {
      // Curso de base: lo marcamos como eliminado (tombstone) para que no
      // reaparezca desde courses-data.js.
      await window.courseContent.save(id, { deleted: true });
    } else {
      // Curso creado desde el panel: se borra de verdad.
      await window.courseContent.reset(id);
    }
    closeCourseEditor();
    await loadCursosAdmin();
    renderPublicCourses();
  } catch (err) {
    console.error('[admin] deleteCourseFromEditor', err);
    alert('Error al eliminar: ' + (err && err.message || err));
  } finally { btn.disabled = false; }
}

// ═══════════════════════════════════════════════════════
//  TIENDA / APARATOLOGÍA · catálogo data-driven
// ═══════════════════════════════════════════════════════
function getRawProducts()       { return (window.PRECISSA_PRODUCTS && Array.isArray(window.PRECISSA_PRODUCTS)) ? window.PRECISSA_PRODUCTS : []; }
function getProductCategories() { return (window.PRECISSA_PRODUCT_CATEGORIES && Array.isArray(window.PRECISSA_PRODUCT_CATEGORIES)) ? window.PRECISSA_PRODUCT_CATEGORIES : []; }
function productCatLabel(id)    { const c = getProductCategories().find(k => k.id === id); return c ? c.label : ''; }

// Productos = base del JS + lo creado/editado en la BD (la BD manda por id;
// los equipos nuevos se añaden al final).
function getProducts() {
  const defaults = getRawProducts();
  const db = (window.productContent && window.productContent.getList) ? window.productContent.getList() : null;
  if (!db) return defaults.map(p => Object.assign({}, p));
  const byId = {}; db.forEach(r => { byId[r.id] = r; });
  const out = []; const seen = {};
  defaults.forEach(d => {
    const r = byId[d.id];
    if (r) { seen[d.id] = true; if (!r.deleted) out.push(r); }
    else out.push(Object.assign({}, d));
  });
  db.forEach(r => { if (!seen[r.id] && !r.deleted) out.push(r); });
  return out;
}
function getPublicProducts() { return getProducts().filter(p => !p.hidden); }
function getProductById(id)  { return getProducts().find(p => p.id === id) || null; }

function productImgHtml(p, cls, extra) {
  const url = (p.images && p.images[0]) ? p.images[0] : '';
  if (url) return `<div class="${cls}" style="background-image:url('${escapeAttr(url)}');background-size:cover;background-position:center">${extra || ''}</div>`;
  return `<div class="${cls} ph ph-clay">${extra || ''}</div>`;
}

let _tiendaFilter = 'todas';
function productDestacadoHtml(p) {
  const url = (p.images && p.images[0]) ? p.images[0] : '';
  const img = url
    ? `<div class="tienda-destacado-img" style="background-image:url('${escapeAttr(url)}')"></div>`
    : `<div class="tienda-destacado-img ph ph-clay"><span class="tienda-destacado-nombre-ph" aria-hidden="true">${escapeHtml(p.name)}</span></div>`;
  const learn = p.relatedCourseLabel ? `<div class="tienda-destacado-course">aprende con · <em>${escapeHtml(p.relatedCourseLabel)}</em></div>` : '';
  return `
    <div class="tienda-destacado">
      ${img}
      <div class="tienda-destacado-body">
        ${p.category ? `<span class="chip chip-accent">${escapeHtml(productCatLabel(p.category))}</span>` : ''}
        <h3 class="tienda-destacado-name"><a href="/#producto/${encodeURIComponent(p.id)}" onclick="goToProducto('${escapeJs(p.id)}');return false">${escapeHtml(p.name)}</a></h3>
        <p class="tienda-destacado-desc">${escapeHtml(p.shortDescription || '')}</p>
        ${learn}
        <div class="tienda-destacado-ctas">
          <button class="btn btn-dark btn-sm" onclick="openQuoteForm('${escapeJs(p.name)}')">Pedir precio</button>
          <button class="btn btn-outline btn-sm" onclick="openDemoForm('${escapeJs(p.name)}')">Solicitar demo</button>
        </div>
      </div>
    </div>`;
}

function renderTienda() {
  const grid = document.getElementById('tienda-grid');
  if (!grid) return;
  const chips = document.getElementById('tienda-filter-chips');
  const meta = document.querySelector('#page-tienda .tienda-meta');
  const few = getPublicProducts().length < 4;
  if (chips) chips.style.display = few ? 'none' : '';
  if (meta) meta.style.display = few ? 'none' : '';
  if (few) {
    const all = getPublicProducts();
    grid.innerHTML = all.length ? all.map(productDestacadoHtml).join('') : '<div class="adm-no-results" style="grid-column:1/-1">No hay equipos disponibles.</div>';
    return;
  }
  const cats = getProductCategories();
  if (chips) {
    chips.innerHTML = [`<button type="button" class="filter-chip${_tiendaFilter === 'todas' ? ' active' : ''}" aria-pressed="${_tiendaFilter === 'todas'}" onclick="filterTienda(this,'todas')">Todas</button>`]
      .concat(cats.map(c => `<button type="button" class="filter-chip${_tiendaFilter === c.id ? ' active' : ''}" aria-pressed="${_tiendaFilter === c.id}" onclick="filterTienda(this,'${escapeJs(c.id)}')">${escapeHtml(c.label)}</button>`)).join('');
  }
  const list = getPublicProducts().filter(p => _tiendaFilter === 'todas' || p.category === _tiendaFilter);
  if (list.length === 0) { grid.innerHTML = '<div class="adm-no-results" style="grid-column:1/-1">No hay equipos en esta categoría.</div>'; return; }
  grid.innerHTML = list.map(productCardPublic).join('');
}
function productCardPublic(p) {
  const learn = p.relatedCourseLabel ? `<div class="tienda-product-course">aprende con · <em>${escapeHtml(p.relatedCourseLabel)}</em></div>` : '';
  const chip  = p.relatedCourseLabel ? '<span class="product-learn-chip">Aprende a usarlo</span>' : '';
  return `
    <div class="tienda-product-card">
      ${productImgHtml(p, 'tienda-product-img', chip)}
      <div class="tienda-product-body">
        ${p.category ? `<span class="chip chip-accent" style="margin-bottom:6px">${escapeHtml(productCatLabel(p.category))}</span>` : ''}
        <div class="tienda-product-name"><a class="tienda-product-link" href="/#producto/${encodeURIComponent(p.id)}" onclick="goToProducto('${escapeJs(p.id)}');return false">${escapeHtml(p.name)}</a></div>
        <p class="tienda-product-desc">${escapeHtml(p.shortDescription || '')}</p>
        <div class="tienda-product-bottom"><span class="tienda-product-price serif">${escapeHtml(p.price || 'Consultar precio')}</span><span style="color:var(--muted);display:inline-flex"><i class="ico ico-arrow" aria-hidden="true"></i></span></div>
        ${learn}
      </div>
    </div>`;
}

function goToProducto(id) { window._currentProductId = id; goTo('producto', 'aparatologia'); }

function renderProducto(id) {
  const left  = document.getElementById('producto-left');
  const right = document.getElementById('producto-right');
  if (!left || !right) return;
  const p = getProductById(id) || getPublicProducts()[0] || getProducts()[0];
  if (!p) { left.innerHTML = ''; right.innerHTML = '<p class="res-hint">No hay equipos disponibles.</p>'; return; }
  window._currentProductId = p.id;
  const imgs = (p.images && p.images.length) ? p.images : [];
  const mainStyle = imgs[0] ? `style="background-image:url('${escapeAttr(imgs[0])}');background-size:cover;background-position:center"` : '';
  const mainCls = imgs[0] ? 'producto-gallery-main' : 'producto-gallery-main ph ph-clay';
  const thumbs = imgs.length > 1
    ? `<div class="producto-thumbs">${imgs.map((u, i) => `<div class="producto-thumb${i === 0 ? ' active' : ''}" style="background-image:url('${escapeAttr(u)}');background-size:cover;background-position:center" onclick="productoSetMain(this,'${escapeJs(u)}')"></div>`).join('')}</div>`
    : '';
  left.innerHTML = `
    <nav class="producto-breadcrumb" aria-label="Migas de pan">
      <a href="/" onclick="goTo('home','');return false">Inicio</a> <i class="ico ico-chev-r" aria-hidden="true"></i>
      <a href="/#tienda" onclick="goTo('tienda','aparatologia');return false">Aparatología</a> <i class="ico ico-chev-r" aria-hidden="true"></i>
      ${p.category ? `<a href="/#tienda" onclick="goTo('tienda','aparatologia');return false">${escapeHtml(productCatLabel(p.category))}</a> <i class="ico ico-chev-r" aria-hidden="true"></i>` : ''}
      <span style="color:var(--ink)" aria-current="page">${escapeHtml(p.name)}</span>
    </nav>
    <div class="${mainCls}" id="producto-main-img" ${mainStyle}>${imgs[0] ? '' : `<div class="ph-label">${escapeHtml(p.name)}</div>`}</div>
    ${thumbs}`;
  const specs = (p.specs || []).filter(s => (s.k || s.v));
  const specsHtml = specs.length ? `
    <div class="producto-specs">
      <div class="producto-specs-title serif">Especificaciones</div>
      <div class="specs-grid">
        ${specs.map(s => `<div class="spec-key">${escapeHtml(s.k || '')}</div><div class="spec-val">${escapeHtml(s.v || '')}</div>`).join('')}
      </div>
    </div>` : '';
  const aprende = p.relatedCourseLabel ? `
    <div class="producto-aprende" onclick="goTo('cursos','docencia')">
      <div class="producto-aprende-img ph ph-stone"></div>
      <div>
        <div class="producto-aprende-eyebrow">· Aprende a usarlo</div>
        <div class="producto-aprende-title">${escapeHtml(p.relatedCourseLabel)}</div>
        <div class="producto-aprende-dur">Formación incluida en la compra <i class="ico ico-arrow" aria-hidden="true"></i></div>
      </div>
    </div>` : '';
  right.innerHTML = `
    <div class="producto-eyebrow-row"><span class="eyebrow">${escapeHtml(p.eyebrow || productCatLabel(p.category) || 'PRECISSA INSTITUTE')}</span></div>
    <h2 class="producto-h1">${escapeHtml(p.name)}</h2>
    <p class="producto-desc">${escapeHtml(p.description || p.shortDescription || '')}</p>
    <div class="producto-precio-row"><span class="producto-precio serif">${escapeHtml(p.price || 'Consultar precio')}</span></div>
    ${p.priceNote ? `<div class="producto-precio-nota">${escapeHtml(p.priceNote)}</div>` : '<div style="margin-bottom:18px"></div>'}
    <div class="producto-ctas">
      <button class="btn btn-dark" onclick="openQuoteForm('${escapeJs(p.name)}')">Pedir precio</button>
      <button class="btn btn-outline" onclick="openDemoForm('${escapeJs(p.name)}')">Solicitar demo</button>
    </div>
    ${aprende}
    ${specsHtml}`;
}
function productoSetMain(thumb, url) {
  const main = document.getElementById('producto-main-img');
  if (main) {
    main.classList.remove('ph', 'ph-clay');
    main.style.backgroundImage = `url('${url}')`;
    main.style.backgroundSize = 'cover';
    main.style.backgroundPosition = 'center';
    main.innerHTML = '';
  }
  const cont = thumb.closest('.producto-thumbs');
  if (cont) cont.querySelectorAll('.producto-thumb').forEach(t => t.classList.remove('active'));
  thumb.classList.add('active');
}

function renderFeaturedProducts() {
  const grid = document.getElementById('home-products-grid');
  if (!grid) return;
  const list = getPublicProducts().slice(0, 3);
  if (list.length === 0) { grid.innerHTML = ''; return; }
  if (list.length === 1) {
    grid.className = 'tienda-destacado-home';
    grid.innerHTML = productDestacadoHtml(list[0]);
    return;
  }
  grid.className = 'products-grid';
  grid.innerHTML = list.map(p => `
    <div class="product-card">
      ${productImgHtml(p, 'product-img', p.relatedCourseLabel ? '<span class="product-learn-chip">Aprende a usarlo</span>' : '')}
      <div class="product-body">
        ${p.category ? `<span class="chip chip-accent" style="margin-bottom:8px">${escapeHtml(productCatLabel(p.category))}</span>` : ''}
        <div class="product-name"><a class="product-link" href="/#producto/${encodeURIComponent(p.id)}" onclick="goToProducto('${escapeJs(p.id)}');return false">${escapeHtml(p.name)}</a></div>
        <p class="product-desc">${escapeHtml(p.shortDescription || '')}</p>
        <div class="product-price-row">
          <span class="product-price serif">${escapeHtml(p.price || 'Consultar precio')}</span>
          <span style="font-size:18px;color:var(--muted);display:inline-flex"><i class="ico ico-arrow" aria-hidden="true"></i></span>
        </div>
        ${p.relatedCourseLabel ? `<div class="product-footer">aprende con · <em>${escapeHtml(p.relatedCourseLabel)}</em></div>` : ''}
      </div>
    </div>`).join('');
}

// ═══════════════════════════════════════════════════════
//  ADMIN · APARATOLOGÍA (alta / edición / borrado de equipos)
// ═══════════════════════════════════════════════════════
let _aparLoaded = false;
async function loadAparatologiaAdmin() {
  const host = document.getElementById('adm-aparatologia-host');
  host.innerHTML = '<div class="adm-loader">Cargando equipos…</div>';
  try {
    if (window.productContent) await window.productContent.load();
    _aparLoaded = true;
    renderAparatologiaAdmin();
  } catch (err) {
    console.error('[admin] loadAparatologiaAdmin', err);
    host.innerHTML = '<div class="adm-warn">⚠️ Error leyendo la tienda. ¿Has ejecutado <code>supabase/products.sql</code>?<br><small>' + escapeHtml(String(err && err.message || err)) + '</small></div>';
  }
}
function renderAparatologiaAdmin() {
  const host = document.getElementById('adm-aparatologia-host');
  if (!host) return;
  const list = getProducts();
  if (list.length === 0) { host.innerHTML = '<div class="adm-no-results">No hay equipos. Crea el primero con «+ Nuevo equipo».</div>'; return; }
  host.innerHTML = list.map(productAdminRow).join('');
}
function productAdminRow(p) {
  const edited = window.productContent && window.productContent.getById && window.productContent.getById(p.id);
  return `
    <div class="adm-curso-row" data-product="${escapeAttr(p.id)}">
      <div class="adm-curso-info">
        <div class="adm-curso-title">${escapeHtml(p.name || p.id)}${edited ? ' <span class="adm-curso-edited" title="Tiene cambios guardados desde el panel">editado</span>' : ''}<small>${escapeHtml(productCatLabel(p.category) || p.id)}</small></div>
      </div>
      <button class="adm-curso-edit-btn" onclick="openProductEditor('${escapeJs(p.id)}')">Editar</button>
      <span class="adm-curso-state ${p.hidden ? 'off' : 'on'}">${p.hidden ? 'Oculto' : 'Visible'}</span>
      <label class="adm-switch">
        <input type="checkbox" ${p.hidden ? '' : 'checked'} onchange="toggleProductVisible('${escapeAttr(p.id)}', this)">
        <span class="adm-switch-slider"></span>
      </label>
    </div>`;
}
async function toggleProductVisible(id, cb) {
  const p = getProductById(id);
  if (!p) return;
  cb.disabled = true;
  try {
    await window.productContent.save(Object.assign({}, p, { hidden: !cb.checked }));
    renderAparatologiaAdmin(); renderTienda(); renderFeaturedProducts();
  } catch (err) {
    console.error('[admin] toggleProductVisible', err);
    cb.checked = !cb.checked;
    alert('No se pudo cambiar la visibilidad: ' + (err && err.message || err));
  } finally { cb.disabled = false; }
}

// — Editor de equipo —
let _peId = null;
let _peImages = [];   // [{url} | {file}]
let _peSpecs = [];    // [{k,v}]
let _peIsNew = false;

function slugify(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
}

function openProductEditor(id) {
  const cats = getProductCategories();
  const isNew = !id;
  _peIsNew = isNew;
  const p = isNew
    ? { id: '', name: '', category: (cats[0] && cats[0].id) || '', eyebrow: '', shortDescription: '', description: '', price: '', priceNote: '', relatedCourseId: '', relatedCourseLabel: '', images: [], specs: [], hidden: false }
    : getProductById(id);
  if (!p) { alert('Equipo no encontrado.'); return; }
  _peId = isNew ? '' : p.id;
  document.getElementById('pe-title').textContent = isNew ? 'Nuevo equipo' : 'Editar equipo';
  document.getElementById('pe-subtitle').textContent = isNew ? 'Rellena los datos y guarda' : (p.name + ' · ' + p.id);
  document.getElementById('pe-name').value      = p.name || '';
  document.getElementById('pe-eyebrow').value   = p.eyebrow || '';
  document.getElementById('pe-price').value     = p.price || '';
  document.getElementById('pe-pricenote').value = p.priceNote || '';
  document.getElementById('pe-short').value     = p.shortDescription || '';
  document.getElementById('pe-desc').value      = p.description || '';
  document.getElementById('pe-hidden').checked  = !!p.hidden;
  document.getElementById('pe-category').innerHTML = cats.map(c => `<option value="${escapeAttr(c.id)}" ${c.id === p.category ? 'selected' : ''}>${escapeHtml(c.label)}</option>`).join('');
  const courses = (typeof getCourses === 'function') ? getCourses() : [];
  document.getElementById('pe-course').innerHTML = '<option value="">— Sin curso —</option>' +
    courses.map(c => `<option value="${escapeAttr(c.id)}" ${c.id === p.relatedCourseId ? 'selected' : ''}>${escapeHtml(c.title || c.id)}</option>`).join('');
  _peImages = (p.images || []).map(u => ({ url: u }));
  _peSpecs  = clone(p.specs || []);
  renderPeGallery();
  renderPeSpecs();
  // Botón eliminar/restablecer
  const delBtn = document.getElementById('pe-delete-btn');
  if (isNew) {
    delBtn.style.display = 'none';
  } else {
    const isDefault   = getRawProducts().some(d => d.id === p.id);
    const hasOverride = window.productContent && window.productContent.getById && window.productContent.getById(p.id);
    if (isDefault) {
      delBtn.style.display = hasOverride ? '' : 'none';
      delBtn.textContent = 'Restablecer a la versión base';
    } else {
      delBtn.style.display = '';
      delBtn.textContent = 'Eliminar equipo';
    }
  }
  switchPeTab('datos');
  document.getElementById('pe-modal').classList.add('open');
}
function closeProductEditor() { document.getElementById('pe-modal').classList.remove('open'); }
function switchPeTab(tab) {
  document.querySelectorAll('.adm-subtab[data-petab]').forEach(b => b.classList.toggle('active', b.dataset.petab === tab));
  document.getElementById('pe-panel-datos').style.display = (tab === 'datos') ? '' : 'none';
  document.getElementById('pe-panel-fotos').style.display = (tab === 'fotos') ? '' : 'none';
  document.getElementById('pe-panel-specs').style.display = (tab === 'specs') ? '' : 'none';
}

// — Galería de fotos —
function renderPeGallery() {
  const host = document.getElementById('pe-gallery');
  if (_peImages.length === 0) { host.innerHTML = ''; return; }
  host.innerHTML = _peImages.map((im, i) => {
    const src = im.url ? im.url : (im.file ? URL.createObjectURL(im.file) : '');
    return `
      <div class="pe-thumb${i === 0 ? ' main' : ''}">
        ${i === 0 ? '<span class="pe-thumb-tag">Principal</span>' : ''}
        <img src="${escapeAttr(src)}" alt="">
        <div class="pe-thumb-ops">
          ${i > 0 ? `<button title="Hacer principal" onclick="peImgMain(${i})">★</button>` : ''}
          <button title="Quitar" onclick="peImgRemove(${i})">✕</button>
        </div>
      </div>`;
  }).join('');
}
function peImgMain(i)   { const t = _peImages.splice(i, 1)[0]; _peImages.unshift(t); renderPeGallery(); }
function peImgRemove(i) { _peImages.splice(i, 1); renderPeGallery(); }
function peGalleryAddFiles(files) {
  const arr = Array.from(files || []).filter(f => /^image\//.test(f.type) || /\.(jpe?g|png|webp|gif|avif)$/i.test(f.name));
  if (arr.length === 0) return;
  arr.forEach(f => _peImages.push({ file: f }));
  renderPeGallery();
}
function peGalleryFileChange(input) { peGalleryAddFiles(input.files); input.value = ''; }
function peGalleryDragOver(e, el)  { e.preventDefault(); el.classList.add('drag'); }
function peGalleryDragLeave(el)    { el.classList.remove('drag'); }
function peGalleryDrop(e, el)      { e.preventDefault(); el.classList.remove('drag'); peGalleryAddFiles(e.dataTransfer && e.dataTransfer.files); }

// — Características (filas clave-valor) —
function renderPeSpecs() {
  const host = document.getElementById('pe-specs-list');
  if (_peSpecs.length === 0) { host.innerHTML = '<p class="res-hint" style="margin-bottom:12px">Sin características. Añade la primera abajo.</p>'; return; }
  host.innerHTML = _peSpecs.map((s, i) => `
    <div class="pe-spec-row">
      <input type="text" class="res-input pe-spec-k" placeholder="Característica" value="${escapeAttr(s.k || '')}" oninput="peSpecField(${i},'k',this.value)">
      <input type="text" class="res-input" placeholder="Valor" value="${escapeAttr(s.v || '')}" oninput="peSpecField(${i},'v',this.value)">
      <button title="Quitar" onclick="peRemoveSpec(${i})">✕</button>
    </div>`).join('');
}
function peSpecField(i, key, val) { _peSpecs[i][key] = val; }
function peAddSpec()    { _peSpecs.push({ k: '', v: '' }); renderPeSpecs(); }
function peRemoveSpec(i){ _peSpecs.splice(i, 1); renderPeSpecs(); }

// — Guardar / eliminar —
async function saveProductEditor() {
  const btn  = document.getElementById('pe-save-btn');
  const name = document.getElementById('pe-name').value.trim();
  if (!name) { alert('El nombre del equipo es obligatorio.'); switchPeTab('datos'); return; }
  let id = _peId;
  if (_peIsNew) {
    id = slugify(name) || ('equipo-' + Date.now().toString(36));
    if (getProducts().some(p => p.id === id)) id = id + '-' + Date.now().toString(36).slice(-4);
  }
  btn.disabled = true; btn.textContent = 'Guardando…';
  try {
    const images = [];
    for (let i = 0; i < _peImages.length; i++) {
      const im = _peImages[i];
      if (im.url) { images.push(im.url); }
      else if (im.file) { btn.textContent = 'Subiendo foto ' + (i + 1) + '…'; images.push(await window.productContent.uploadImage(im.file, id)); }
    }
    const relId     = document.getElementById('pe-course').value || '';
    const relCourse = relId ? getCourses().find(c => c.id === relId) : null;
    let relLabel = '';
    if (relCourse) relLabel = relCourse.title || '';
    else if (!_peIsNew) { const cur = getProductById(_peId); relLabel = cur ? (cur.relatedCourseLabel || '') : ''; }
    const record = {
      id: id,
      name: name,
      category: document.getElementById('pe-category').value || '',
      eyebrow: document.getElementById('pe-eyebrow').value.trim(),
      shortDescription: document.getElementById('pe-short').value.trim(),
      description: document.getElementById('pe-desc').value.trim(),
      price: document.getElementById('pe-price').value.trim(),
      priceNote: document.getElementById('pe-pricenote').value.trim(),
      relatedCourseId: relId,
      relatedCourseLabel: relLabel,
      images: images,
      specs: _peSpecs.filter(s => (s.k || '').trim() || (s.v || '').trim()),
      hidden: document.getElementById('pe-hidden').checked
    };
    btn.textContent = 'Guardando…';
    await window.productContent.save(record);
    closeProductEditor();
    renderAparatologiaAdmin(); renderTienda(); renderFeaturedProducts();
  } catch (err) {
    console.error('[admin] saveProductEditor', err);
    alert('Error guardando el equipo: ' + (err && err.message || err));
  } finally { btn.disabled = false; btn.textContent = 'Guardar'; }
}

async function deleteProductFromEditor() {
  if (!_peId) return;
  const isDefault = getRawProducts().some(d => d.id === _peId);
  const msg = isDefault
    ? '¿Restablecer este equipo a su versión base? Se perderán los cambios guardados desde el panel.'
    : '¿Eliminar este equipo de la tienda? No se puede deshacer.';
  if (!confirm(msg)) return;
  const btn = document.getElementById('pe-delete-btn'); btn.disabled = true;
  try {
    await window.productContent.remove(_peId);
    closeProductEditor();
    renderAparatologiaAdmin(); renderTienda(); renderFeaturedProducts();
  } catch (err) {
    console.error('[admin] deleteProductFromEditor', err);
    alert('Error al eliminar: ' + (err && err.message || err));
  } finally { btn.disabled = false; }
}

// Mostrar/ocultar enlaces de admin en el nav según si el usuario es admin
async function refreshAdminLinks() {
  const ok = window.admin ? await window.admin.isAdmin() : false;
  document.querySelectorAll('.nav-admin-link').forEach(el => {
    el.style.display = ok ? '' : 'none';
  });
}

// ─── AULA · LISTADO PRIVADO ─────────────────────────────
async function renderAulaCourses() {
  const grid = document.getElementById('aula-courses-grid');
  if (!grid) return;
  const all = getCourses();
  if (all.length === 0) {
    grid.innerHTML = '<div class="aula-empty">Ahora mismo no podemos mostrar los cursos. Vuelve a intentarlo en unos minutos.</div>';
    return;
  }
  // Optimización: resolvemos el email una sola vez y, si es admin, evitamos
  // tocar enrollments. Para alumnas normales, lanzamos todas las
  // comprobaciones en paralelo en vez de en serie.
  const email = await currentUserEmail();
  const admin = isAdminEmail(email);
  let courses;
  if (admin) {
    courses = all.slice();
  } else {
    const checks = await Promise.all(
      all.map(c => canAccessCourseFor(email, c))
    );
    courses = all.filter((_, i) => checks[i]);
  }
  if (courses.length === 0) {
    // Distinguir "sin matrícula" de "no se pudo comprobar" (fallo de red
    // o de Supabase): antes ambos casos mostraban el mismo mensaje y una
    // alumna matriculada veía "no tienes cursos" por un fallo puntual.
    if (window.enrollments && window.enrollments.hadError && window.enrollments.hadError()) {
      grid.innerHTML = '<div class="aula-empty"><div class="aula-empty-ico"><i class="ico ico-x" aria-hidden="true"></i></div>' +
        '<div class="aula-empty-title">No hemos podido comprobar tu matrícula</div>' +
        '<p>Ha fallado la conexión. Tus cursos siguen ahí: vuelve a intentarlo en un momento.</p>' +
        '<button class="btn btn-outline btn-sm" onclick="window.enrollments.invalidate();renderAulaCourses();return false">Reintentar</button></div>';
      return;
    }
    grid.innerHTML = '<div class="aula-empty"><div class="aula-empty-ico"><i class="ico ico-book" aria-hidden="true"></i></div>' +
      '<div class="aula-empty-title">Todavía no tienes cursos</div>' +
      '<p>Cuando tu profesora te dé acceso a un curso aparecerá aquí, con su materia, su presentación y sus tests.</p>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">' +
      '<button class="btn btn-dark btn-sm" onclick="goTo(\'cursos\',\'docencia\')">Ver el catálogo <i class="ico ico-arrow" aria-hidden="true"></i></button>' +
      '<a class="btn btn-outline btn-sm" href="https://wa.me/34601056706?text=Hola%2C%20me%20he%20registrado%20en%20el%20aula%20y%20no%20veo%20mis%20cursos." target="_blank" rel="noopener"><i class="ico ico-wa" aria-hidden="true"></i> ¿Te registraste con otro email? Escríbenos</a></div></div>';
    return;
  }
  const renderAulaCard = (c) => `
    <article class="aula-course-card" data-search="${escapeAttr(buildCourseSearchText(c))}" >
      <div class="aula-course-card-cover">
        ${c.cover ? coverImgHtml(c.cover) : ''}
      </div>
      <div class="aula-course-card-body">
        <div class="aula-course-card-title"><a class="aula-course-link" href="/#curso/${encodeURIComponent(c.id)}" onclick="openAulaCurso('${escapeJs(c.id)}');return false">${escapeHtml(c.title)}</a></div>
        <div class="aula-course-card-desc">${escapeHtml(c.shortDescription || c.description || '')}</div>
        <div class="aula-course-card-meta">
          ${c.lessons && c.lessons.length > 0 ? `<span>${c.lessons.length} lecciones</span>` : '<span>Próximamente</span>'}
          ${c.test && c.test.questions && c.test.questions.length > 0 ? `<span>Test incluido</span>` : ''}
        </div>
      </div>
    </article>`;
  const categories = getCategories();
  if (categories.length === 0) {
    grid.innerHTML = courses.map(renderAulaCard).join('');
    return;
  }
  const blocks = categories.map(cat => {
    const inCat = courses.filter(c => c.category === cat.id);
    if (inCat.length === 0) return '';
    return `
      <section class="aula-category" id="aula-cat-${cat.id}" data-category="${cat.id}">
        <header class="aula-category-head">
          <span class="aula-category-count">${inCat.length} ${inCat.length === 1 ? 'curso' : 'cursos'}</span>
          <h3 class="aula-category-title">${escapeHtml(cat.label)}</h3>
          <p class="aula-category-tagline">${escapeHtml(cat.tagline || '')}</p>
        </header>
        <div class="aula-category-cards">
          ${inCat.map(renderAulaCard).join('')}
        </div>
      </section>`;
  }).filter(Boolean).join('');
  const orphans = courses.filter(c => !categories.find(cat => cat.id === c.category));
  const orphansBlock = orphans.length === 0 ? '' : `
    <section class="aula-category" data-category="__orphans__">
      <header class="aula-category-head"><h3 class="aula-category-title">Otros cursos</h3></header>
      <div class="aula-category-cards">${orphans.map(renderAulaCard).join('')}</div>
    </section>`;
  grid.innerHTML = blocks + orphansBlock;
  renderAulaCourseFilters(courses, categories);
  applyAulaCoursesFilters(); // el texto del buscador sigue ahí al volver
}
function renderAulaCourseFilters(courses, categories) {
  const bar = document.getElementById('aula-courses-filters');
  if (!bar) return;
  if (!categories || categories.length === 0) { bar.innerHTML = ''; return; }
  // Solo mostramos las categorias que tengan al menos un curso accesible
  const visibleCats = categories.filter(cat => courses.some(c => c.category === cat.id));
  if (visibleCats.length <= 1) { bar.innerHTML = ''; return; }
  const chips = [
    `<button class="aula-courses-filter active" data-cat="all" onclick="filterAulaCourses(this,'all')">Todas</button>`,
    ...visibleCats.map(cat =>
      `<button class="aula-courses-filter" data-cat="${cat.id}" onclick="filterAulaCourses(this,'${cat.id}')">${escapeHtml(cat.label)}</button>`
    )
  ];
  bar.innerHTML = chips.join('');
}
function filterAulaCourses(btn, catId) {
  document.querySelectorAll('.aula-courses-filter').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  applyAulaCoursesFilters();
}
function applyAulaCoursesFilters() {
  const input = document.getElementById('aula-search-input');
  const term = input ? normalizeSearch(input.value.trim()) : '';
  const activeChip = document.querySelector('#aula-courses-filters .aula-courses-filter.active');
  const activeCat = activeChip ? activeChip.dataset.cat : 'all';
  document.querySelectorAll('#aula-courses-grid .aula-course-card').forEach(card => {
    const text = card.getAttribute('data-search') || '';
    card.classList.toggle('is-filtered', term !== '' && text.indexOf(term) === -1);
  });
  let anyVisible = false;
  document.querySelectorAll('#aula-courses-grid .aula-category').forEach(sec => {
    const catId = sec.getAttribute('data-category');
    const catMatch = (activeCat === 'all' || catId === activeCat);
    const hasVisibleCard = Array.from(sec.querySelectorAll('.aula-course-card')).some(c => !c.classList.contains('is-filtered'));
    const show = catMatch && hasVisibleCard;
    sec.classList.toggle('is-hidden', !show);
    if (show) anyVisible = true;
  });
  const noRes = document.getElementById('aula-noresults');
  if (noRes) noRes.style.display = anyVisible ? 'none' : '';
}

// ─── AULA · DETALLE DEL CURSO ──────────────────────────
// Única fuente de verdad del curso abierto: window._currentAulaCourseId.
// (Antes convivían un `let` léxico y la propiedad de window: el router
// escribía en una y el render leía la otra, y todo deep-link #curso/<id>
// abría el primer curso del catálogo.)
window._currentAulaCourseId = null;
async function openAulaCurso(courseId) {
  const course = getCourses().find(c => c.id === courseId);
  if (!course) return;
  if (!(await canAccessCourse(course))) {
    alert('No tienes acceso a este curso. Habla con tu profesora.');
    return;
  }
  window._currentAulaCourseId = courseId;
  goTo('aula-curso','docencia');
}

function renderAulaCurso() {
  const courses = getCourses();
  // Sin curso seleccionado (hash #aula-curso suelto, recarga rara): al aula,
  // nunca al primer curso del catálogo "por defecto".
  if (!window._currentAulaCourseId) { goTo('aula','docencia'); return; }
  const course = courses.find(c => c.id === window._currentAulaCourseId);
  if (course) {
    Promise.resolve(canAccessCourse(course)).then(ok => {
      if (!ok) goTo('aula','docencia');
    });
  }
  if (!course) {
    document.getElementById('ac-title').textContent = 'Sin cursos disponibles';
    document.getElementById('ac-desc').textContent = '';
    document.getElementById('ac-materia-host').innerHTML = '<div class="ac-materia-empty">Crea un curso desde <strong>Administración → Cursos</strong>.</div>';
    return;
  }
  document.getElementById('ac-bc-title').textContent = course.title;
  document.getElementById('ac-title').innerHTML = escapeHtml(course.title);
  document.getElementById('ac-desc').textContent = course.description || '';

  // Tab por defecto: Materia
  aulaSwitchTab('materia');
  renderAulaMateria(course);
  renderAulaPresentacion(course);
  renderAulaTest(course);
}

function aulaSwitchTab(name) {
  document.querySelectorAll('#page-aula-curso .ac-tab').forEach(t => { const on = t.dataset.tab === name; t.classList.toggle('active', on); t.setAttribute('aria-selected', on ? 'true' : 'false'); });
  ['materia','presentacion','test'].forEach(n => {
    const el = document.getElementById('ac-tab-' + n);
    if (el) el.classList.toggle('active', n === name);
  });
}

// ─── AULA · MATERIA (renderizado del .md fuente) ────────
function loadScriptOnce(src, isReady) {
  if (isReady()) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('No se pudo cargar ' + src));
    document.head.appendChild(s);
  });
}
async function loadMarkdownLib() {
  await loadScriptOnce('https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js', () => !!window.marked); // versión fijada
  if (window.marked && window.marked.setOptions) {
    window.marked.setOptions({ gfm: true, breaks: false });
  }
  return window.marked;
}
// marked NO escapa el HTML embebido en el .md: sin sanitizar, cualquier
// <script> o <img onerror> dentro de la materia se ejecutaría en el
// dominio. DOMPurify limpia el HTML resultante antes del innerHTML.
async function loadSanitizer() {
  try {
    await loadScriptOnce('https://cdn.jsdelivr.net/npm/dompurify@3.0.9/dist/purify.min.js', () => !!window.DOMPurify); // versión fijada
    return window.DOMPurify;
  } catch (e) {
    console.warn('[aula] DOMPurify no disponible; se renderiza sin sanitizar', e);
    return null;
  }
}
async function renderAulaMateria(course) {
  const host = document.getElementById('ac-materia-host');
  if (!host) return;
  if (!course.sourceDoc) {
    host.innerHTML = '<div class="ac-materia-empty">Este curso aún no tiene materia. Añade el enlace al .md desde <strong>Administración → Cursos → Editar → Materia</strong>.</div>';
    return;
  }
  // Caché en memoria por documento: volver a la materia (o cambiar de
  // pestaña y regresar) no vuelve a descargar ni a procesar 2-3 MB.
  window._aulaMateriaCache = window._aulaMateriaCache || {};
  const cacheKey = String(course.sourceDoc);
  if (window._aulaMateriaCache[cacheKey]) {
    host.innerHTML = window._aulaMateriaCache[cacheKey];
    aulaMateriaWire(host);
    return;
  }
  host.innerHTML = '<div class="ac-materia-loading">Cargando materia…</div>';
  try {
    const url = await resolveContentUrl(course.sourceDoc);
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const md = await res.text();
    const lib = await loadMarkdownLib();
    // Las imágenes embebidas (base64, cientos de KB cada una) se apartan
    // antes de marked y DOMPurify: con ellas dentro el procesado tardaba
    // segundos. Solo se apartan data-URIs de imagen con base64 limpio.
    const imgs = [];
    const mdLigero = md.replace(/data:image\/(?:jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+/g, m => {
      imgs.push(m); return '__AULA_IMG_' + (imgs.length - 1) + '__';
    });
    let html = lib.parse(mdLigero);
    const purifier = await loadSanitizer();
    if (purifier) html = purifier.sanitize(html);
    html = html.replace(/__AULA_IMG_(\d+)__/g, (_, i) => imgs[Number(i)] || '');
    host.innerHTML = '<article class="ac-materia">' + html + '</article>';
    window._aulaMateriaCache[cacheKey] = host.innerHTML;
    aulaMateriaWire(host);
  } catch (e) {
    // Mensaje amable: el "HTTP 404" en crudo asustaba y no orientaba.
    console.warn('[aula] materia no disponible', e);
    host.innerHTML = '<div class="ac-materia-empty">Ahora mismo no podemos mostrar la materia de este curso. ' +
      'Prueba a recargar la página en un momento y, si sigue sin aparecer, escríbenos a ' +
      '<a class="aula-link" href="mailto:precissainstitute@gmail.com">precissainstitute@gmail.com</a>.</div>';
  }
}
/** Comportamiento de la materia ya pintada: tablas deslizables e índice. */
function aulaMateriaWire(host) {
    // Tablas anchas: cada una va en un marco que se desliza de lado, con la
    // tabla entera dentro (cabecera y cuerpo alineados). Sin esto, en móvil
    // o se partían las palabras o cabecera y cuerpo calculaban columnas
    // distintas.
    host.querySelectorAll('.ac-materia table').forEach(t => {
      const w = document.createElement('div');
      w.className = 'ac-tabla-scroll';
      const cols = (t.querySelector('tr') || { children: [] }).children.length;
      if (cols <= 3) w.classList.add('ac-tabla-scroll--ajustada');
      t.parentNode.insertBefore(w, t);
      w.appendChild(t);
    });
    // Índice de la materia: desplazamiento suave SIN tocar el hash, que es
    // del router de la SPA (un href="#" suelto manda a la portada). Se
    // retira el href por si el enlace lo trae, y se captura el clic antes
    // que nadie.
    host.querySelectorAll('[data-ir]').forEach(a => {
      a.removeAttribute('href');
      a.setAttribute('role', 'link'); a.setAttribute('tabindex', '0');
      const ir = (e) => {
        e.preventDefault(); e.stopPropagation();
        const dest = host.querySelector('#' + a.dataset.ir);
        if (dest) dest.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
      a.addEventListener('click', ir, true);
      a.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') ir(e); });
    });
}

// Resuelve una referencia de contenido a una URL cargable. Si es privada
// (bucket course-private) pide un enlace firmado temporal (solo válido si
// hay matrícula/admin); si es pública, la devuelve tal cual.
async function resolveContentUrl(ref) {
  try {
    if (window.courseContent && window.courseContent.signedUrl) {
      return await window.courseContent.signedUrl(ref, 3600);
    }
  } catch (e) { console.warn('[aula] no se pudo firmar el contenido', e); }
  return ref;
}

// ─── AULA · PRESENTACIÓN (slide decks inline + fullscreen) ──
async function renderAulaPresentacion(course) {
  const host = document.getElementById('ac-pres-host');
  if (!host) return;
  const lessons = (course.lessons || []).filter(l => l.slides && l.slides !== 'leccion-integrada');
  if (lessons.length === 0) {
    host.innerHTML = '<div class="ac-pres-empty">Este curso aún no tiene presentaciones publicadas.</div>';
    return;
  }
  const picker = lessons.length > 1
    ? `<div class="ac-pres-picker">${lessons.map((l, i) =>
        `<button class="ac-pres-lesson${i === 0 ? ' active' : ''}" data-li="${i}" onclick="aulaPresLoad(${i})">${escapeHtml(l.title)}</button>`
      ).join('')}</div>`
    : `<div class="ac-pres-picker"><span style="font-size:13px;color:var(--ink-soft);padding:8px 0">${escapeHtml(lessons[0].title)}</span></div>`;
  host.innerHTML = `
    <div class="ac-pres-toolbar">
      ${picker}
      <button class="ac-pres-fs" onclick="aulaPresFullscreen()" title="Pantalla completa">
        <span class="ac-pres-fs-icon"></span> Pantalla completa
      </button>
    </div>
    <div class="ac-pres-frame-wrap" id="ac-pres-frame-wrap">
      <iframe class="ac-pres-frame" id="ac-pres-frame" title="${escapeAttr(lessons[0].title)}" allowfullscreen></iframe>
    </div>
  `;
  window._aulaPresLessons = lessons;
  aulaPresSetFrame(document.getElementById('ac-pres-frame'), lessons[0].slides)
    .catch(() => {
      const wrap = document.getElementById('ac-pres-frame-wrap');
      if (wrap) wrap.innerHTML = '<div class="ac-pres-empty">Ahora mismo no podemos cargar la presentación. Recarga la página en un momento y, si sigue igual, escríbenos.</div>';
    });
}

// Carga un deck en el iframe. Los archivos del bucket privado llegan con
// content-type de texto plano: si se cargan por src, el navegador enseña el
// código fuente en crudo (y con acentos rotos). Se descargan con el enlace
// firmado y se inyectan como documento (srcdoc), decodificando SIEMPRE como
// UTF-8 — así el render no depende de los metadatos del bucket.
async function aulaPresSetFrame(iframe, slidesRef) {
  if (!iframe) return;
  const url = await resolveContentUrl(slidesRef);
  if (String(slidesRef).startsWith('private:')) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const html = new TextDecoder('utf-8').decode(await res.arrayBuffer());
    iframe.removeAttribute('src');
    iframe.srcdoc = html;
  } else {
    iframe.removeAttribute('srcdoc');
    iframe.src = url;
  }
}
async function aulaPresLoad(idx) {
  const lessons = window._aulaPresLessons || [];
  if (!lessons[idx]) return;
  document.querySelectorAll('#ac-pres-host .ac-pres-lesson').forEach(b => b.classList.toggle('active', Number(b.dataset.li) === idx));
  const f = document.getElementById('ac-pres-frame');
  if (f) { f.title = lessons[idx].title; await aulaPresSetFrame(f, lessons[idx].slides).catch(() => {}); }
}
function aulaPresFullscreen() {
  const wrap = document.getElementById('ac-pres-frame-wrap');
  if (!wrap) return;
  if (document.fullscreenElement) {
    document.exitFullscreen();
    if (screen.orientation && screen.orientation.unlock) {
      try { screen.orientation.unlock(); } catch(e) {}
    }
    return;
  }
  if (wrap.requestFullscreen) {
    wrap.requestFullscreen().then(() => {
      aulaPresFocus();
      // En movil, intentar bloquear a horizontal (silencioso si falla)
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {});
      }
    }).catch(aulaPresOpenTab);
  } else {
    aulaPresOpenTab();
  }
}
// El foco se queda en la página al entrar en pantalla completa, y el deck
// escucha el teclado dentro de su iframe: sin esto había que hacer clic en
// la diapositiva para poder pasar de página.
function aulaPresFocus() {
  const f = document.getElementById('ac-pres-frame');
  if (!f) return;
  try { f.contentWindow.focus(); } catch (e) { try { f.focus(); } catch (e2) {} }
}
document.addEventListener('fullscreenchange', () => { if (document.fullscreenElement) aulaPresFocus(); });
// Y por si el foco sigue fuera (p. ej. tras pulsar el botón), las teclas de
// navegación que recibe la página se reenvían al deck mientras esté a la vista.
document.addEventListener('keydown', (e) => {
  const f = document.getElementById('ac-pres-frame');
  if (!f || !f.contentWindow) return;
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
  if (!document.fullscreenElement && f.offsetParent === null) return;
  const keys = ['ArrowRight', 'ArrowLeft', 'PageDown', 'PageUp', 'Home', 'End', ' ', 'n', 'N'];
  if (keys.indexOf(e.key) === -1) return;
  e.preventDefault();
  try {
    f.contentWindow.document.dispatchEvent(new KeyboardEvent('keydown', { key: e.key, code: e.code, bubbles: true, cancelable: true }));
  } catch (err) {}
});
// Fallback sin fullscreen nativo (iOS): abrir el deck en pestaña nueva.
// Con decks privados no hay src (van por srcdoc): se vuelca el documento.
function aulaPresOpenTab() {
  const f = document.getElementById('ac-pres-frame');
  if (!f) return;
  if (f.src) { window.open(f.src, '_blank'); return; }
  if (f.srcdoc) {
    const w = window.open('', '_blank');
    if (w) { w.document.write(f.srcdoc); w.document.close(); }
  }
}

async function openAulaSlides(courseId, lessonIdx) {
  const course = getCourses().find(c => c.id === courseId);
  if (!course || !course.lessons || !course.lessons[lessonIdx]) return;
  const lesson = course.lessons[lessonIdx];
  if (!lesson.slides) {
    alert('Esta lección aún no tiene slides asociados.');
    return;
  }
  // Caso especial: usar la lección visual integrada (parallax 3D)
  if (lesson.slides === 'leccion-integrada') {
    goTo('leccion','docencia');
    return;
  }
  document.getElementById('ac-slides-title').textContent = course.title + ' · ' + lesson.title;
  document.getElementById('ac-slides-frame').src = await resolveContentUrl(lesson.slides);
  document.getElementById('ac-slides-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeAulaSlides() {
  document.getElementById('ac-slides-modal').classList.remove('open');
  document.getElementById('ac-slides-frame').src = 'about:blank';
  document.body.style.overflow = '';
}

// ─── AULA · TEST ────────────────────────────────────────
function renderAulaTest(course) {
  const container = document.getElementById('ac-test-container');
  if (!course || !course.test || !course.test.questions || course.test.questions.length === 0) {
    container.innerHTML = '<div class="ac-test-empty"><p>Este curso aún no tiene test publicado.</p></div>';
    return;
  }
  const questions = course.test.questions;
  container.innerHTML = `
    <div id="ac-test-form">
      ${questions.map((q, qi) => `
        <div class="ac-test-q" data-qi="${qi}">
          <div class="ac-test-q-num">Pregunta ${qi+1} / ${questions.length}</div>
          <div class="ac-test-q-text">${escapeHtml(q.q)}</div>
          <div class="ac-test-opts">
            ${q.options.map((opt, oi) => `
              <button type="button" class="ac-test-opt" data-oi="${oi}" aria-pressed="false" onclick="aulaTestSelect(${qi}, ${oi})">${escapeHtml(opt)}</button>
            `).join('')}
          </div>
        </div>
      `).join('')}
      <button class="ac-test-submit" onclick="aulaTestSubmit()">Corregir test</button>
      <div id="ac-test-result"></div>
    </div>
  `;
  window._aulaTestAnswers = {};
  window._aulaTestQuestions = questions;
}
function aulaTestSelect(qi, oi) {
  window._aulaTestAnswers = window._aulaTestAnswers || {};
  window._aulaTestAnswers[qi] = oi;
  const qEl = document.querySelector(`.ac-test-q[data-qi="${qi}"]`);
  qEl.querySelectorAll('.ac-test-opt').forEach(o => { o.classList.remove('selected'); o.setAttribute('aria-pressed', 'false'); });
  const chosen = qEl.querySelector(`.ac-test-opt[data-oi="${oi}"]`);
  chosen.classList.add('selected');
  chosen.setAttribute('aria-pressed', 'true');
}
function aulaTestSubmit() {
  const answers = window._aulaTestAnswers || {};
  const questions = window._aulaTestQuestions || [];
  let correct = 0;
  questions.forEach((q, qi) => {
    const qEl = document.querySelector(`.ac-test-q[data-qi="${qi}"]`);
    qEl.querySelectorAll('.ac-test-opt').forEach((opt, oi) => {
      opt.classList.remove('selected');
      if (oi === q.correct) opt.classList.add('correct');
      if (answers[qi] === oi && oi !== q.correct) opt.classList.add('wrong');
    });
    if (answers[qi] === q.correct) correct++;
  });
  const pct = Math.round((correct / questions.length) * 100);
  document.getElementById('ac-test-result').innerHTML = `
    <div class="ac-test-result">
      <div class="ac-test-result-score">${correct} / ${questions.length}</div>
      <div class="ac-test-result-lbl">${pct}% de aciertos</div>
    </div>
  `;
  document.querySelector('.ac-test-submit').style.display = 'none';
}

// ─── UTILIDADES ─────────────────────────────────────────
function escapeHtml(s) {
  if (s == null) return '';
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function escapeAttr(s) { return escapeHtml(s).replace(/`/g, '&#96;'); }
// Para strings JS dentro de onclick="fn('...')": el navegador des-escapa las
// entidades HTML del atributo ANTES de parsear el JS, así que escapeAttr no
// protege — un apóstrofe en un título rompería el handler. Aquí se escapa
// para el parser de JS (\' \\) y después para el atributo HTML.
function escapeJs(s) { return escapeAttr(String(s ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'")); }

// ─── HOOK por cambio de página ──────────────────────────
// ─── HOME · RESEÑAS DE ALUMNAS (desde Supabase) ─────────
// La sección solo se muestra si hay al menos una reseña real en la BD.
// Sin Supabase, con error o sin reseñas, queda oculta (hidden), sin hueco.
// Reseñas reales publicadas en la ficha de Google de PRECISSA INSTITUTE
// (copiadas el 8 de octubre de 2026 con permiso de la propietaria). Se
// muestran siempre; si hay reseñas cargadas desde el panel, van primero.
const GOOGLE_REVIEWS = [
  { name: 'Yuly Vasquez', quote: 'Quiero agradecer a Beatriz por todo lo que he aprendido en sus clases de aparatología. Es una excelente profesora, con una forma de enseñar muy dinámica y práctica, que hace que aprender resulte fácil y, sobre todo, interesante. Gracias a ella he aprendido a trabajar con láser, depilación láser, IPL y Dermapen, siempre con mucha paciencia y dedicación.' },
  { name: 'Cristina Sifre Martínez', quote: 'Durante la formación he podido aprender y practicar un montón de cosas: electroestética, diferentes tipos de láser, tratamientos faciales, diatermia, radiofrecuencia y muchos otros tratamientos. Siempre ha tenido muchísima paciencia conmigo, enseñándome desde la práctica y desde su propia experiencia. Sin duda, volvería a formarme contigo una y mil veces.' },
  { name: 'Aroa Garci', quote: 'He tenido la oportunidad de formarme con ella y la experiencia ha sido excelente. Explica los contenidos de forma muy clara, tiene muchísima paciencia y se nota la gran experiencia que acumula en el sector. La recomiendo a cualquier persona que quiera aprender de una auténtica experta.' }
].map(r => Object.assign({ google: true, stars: 5 }, r));

async function renderTestimonials() {
  const sec = document.getElementById('testimonials-section');
  const grid = document.getElementById('testimonials-grid');
  if (!sec || !grid) return;
  const ocultar = () => { grid.innerHTML = ''; sec.hidden = true; };
  let data = [];
  if (window.testimonials && window.testimonials.isConfigured()) {
    try { data = (await window.testimonials.list()) || []; } catch (e) { data = []; }
  }
  // Las tres reseñas de ejemplo que se sembraron en Supabase al crear la
  // sección (Nerea Álvarez, Claudia Moreno, Marta Iglesias) no eran reales:
  // se descartan aunque sigan en la tabla hasta que se borren desde el panel.
  const FICTICIAS = ['nerea álvarez', 'claudia moreno', 'marta iglesias'];
  data = data.filter(t => FICTICIAS.indexOf(String(t.name || '').trim().toLowerCase()) === -1);
  data = data.concat(GOOGLE_REVIEWS);
  if (data.length === 0) return ocultar();
  const estrellas = (n) => `<div class="testimonial-stars" aria-label="${n} de 5 estrellas">${'<i class="ico ico-star" aria-hidden="true"></i>'.repeat(n)}</div>`;
  grid.innerHTML = data.map(t => {
    const nombre = String(t.name || '').trim();
    const img = t.photo_url
      ? `<div class="testimonial-img" style="border-radius:12px;overflow:hidden;">
           <img src="${escapeAttr(t.photo_url)}" alt="${escapeAttr(nombre)}" loading="lazy"
                style="width:100%;height:240px;object-fit:cover;object-position:center top;display:block;"></div>`
      : `<div class="testimonial-avatar" aria-hidden="true">${escapeHtml(nombre.charAt(0).toUpperCase() || '·')}</div>`;
    return `
      <div class="testimonial-card">
        ${img}
        ${t.stars ? estrellas(t.stars) : ''}
        <p class="testimonial-quote">"${escapeHtml(t.quote || '')}"</p>
        <div class="testimonial-name">${escapeHtml(nombre)}</div>
        ${t.centro ? `<div class="testimonial-centro">${escapeHtml(t.centro)}</div>` : ''}
        ${t.google ? `<span class="testimonial-google"><i class="ico ico-star" aria-hidden="true"></i>Reseña en Google</span>` : ''}
      </div>`;
  }).join('');
  sec.hidden = false;
}

function onPageEnter(pageKey) {
  if (pageKey === 'home') { renderTestimonials(); renderFeaturedProducts(); }
  if (pageKey === 'cursos') renderPublicCourses();
  if (pageKey === 'tienda') renderTienda();
  if (pageKey === 'producto') renderProducto(window._currentProductId);
  if (pageKey === 'aula') {
    if (window.auth && window.auth.refresh) window.auth.refresh();
    renderAulaCourses();
  }
  if (pageKey === 'aula-curso') renderAulaCurso();
  if (pageKey === 'admin') openAdmin();
  updateSeoForPage(pageKey);
}

// ─── SEO · meta tags dinámicos + JSON-LD por curso ──────
const SEO_BASE_URL = 'https://precissainstitute.com/';
const SEO_DEFAULTS = {
  title: 'Especialistas en Plasmapen y Electroestética en Valencia · PRECISSA',
  description: 'Academia especializada en Plasmapen y electroestética en Valencia. Cursos de aparatología, micropigmentación y estética avanzada. Formación presencial.'
};
const SEO_PAGE_META = {
  home:        { title: SEO_DEFAULTS.title, description: SEO_DEFAULTS.description },
  cursos:      { title: 'Cursos · Plasmapen, electroestética y más · PRECISSA INSTITUTE', description: 'Catálogo completo: curso de Plasmapen, electroestética, micropigmentación, dermocosmiatría y técnicas corporales. Protocolos basados en evidencia, casos clínicos y test discriminativo.' },
  aula:        { title: 'Aula · PRECISSA INSTITUTE', description: 'Acceso al aula privada de PRECISSA INSTITUTE para alumnado matriculado. Materia, presentación y test de cada curso.' },
  'aula-curso':{ title: 'Mi curso · PRECISSA INSTITUTE', description: 'Aula del curso: materia, presentación y test.' },
  leccion:     { title: 'Lección · PRECISSA INSTITUTE', description: 'Lección con slides en pantalla completa.' },
  tienda:      { title: 'Aparatología profesional · PRECISSA INSTITUTE', description: 'Catálogo de aparatología profesional de estética y electroestética: Plasmapen, radiofrecuencia, HIFU, IPL, láser y más.' },
  producto:    { title: 'Aparato · PRECISSA INSTITUTE', description: 'Ficha técnica de aparatología profesional.' }
};
function setMeta(name, value, isProperty) {
  const attr = isProperty ? 'property' : 'name';
  let el = document.head.querySelector(`meta[${attr}="${name}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, name); document.head.appendChild(el); }
  el.setAttribute('content', value);
}
function updateSeoForPage(pageKey) {
  const meta = SEO_PAGE_META[pageKey] || SEO_PAGE_META.home;
  let { title, description } = meta;
  let canonical = SEO_BASE_URL;
  // Si estamos viendo un curso (aula-curso), enriquecer con el curso actual
  if (pageKey === 'aula-curso' && window._currentAulaCourseId) {
    const c = (window.PRECISSA_COURSES || []).find(x => x.id === window._currentAulaCourseId);
    if (c) {
      title = c.title + ' · PRECISSA INSTITUTE';
      description = c.shortDescription || c.description || description;
      canonical = SEO_BASE_URL + '#curso/' + encodeURIComponent(c.id);
      injectCourseJsonLd(c);
    }
  } else {
    removeCourseJsonLd();
  }
  document.title = title;
  setMeta('description', description, false);
  setMeta('og:title', title, true);
  setMeta('og:description', description, true);
  setMeta('og:url', canonical, true);
  setMeta('twitter:title', title, false);
  setMeta('twitter:description', description, false);
  // Update canonical link
  let canonEl = document.head.querySelector('link[rel="canonical"]');
  if (!canonEl) { canonEl = document.createElement('link'); canonEl.setAttribute('rel', 'canonical'); document.head.appendChild(canonEl); }
  canonEl.setAttribute('href', canonical);
}
function injectCourseJsonLd(c) {
  removeCourseJsonLd();
  const data = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": c.title,
    "description": c.shortDescription || c.description || '',
    "provider": {
      "@type": "EducationalOrganization",
      "name": "PRECISSA INSTITUTE",
      "url": SEO_BASE_URL
    },
    "inLanguage": "es-ES",
    "url": SEO_BASE_URL + '#curso/' + encodeURIComponent(c.id)
  };
  if (c.level) data.educationalLevel = c.level;
  if (c.duration) data.timeRequired = c.duration;
  if (c.cover) data.image = SEO_BASE_URL + c.cover;
  const s = document.createElement('script');
  s.type = 'application/ld+json';
  s.id = 'seo-course-jsonld';
  s.textContent = JSON.stringify(data, null, 2);
  document.head.appendChild(s);
}
function removeCourseJsonLd() {
  const old = document.getElementById('seo-course-jsonld');
  if (old) old.remove();
}
// Inyectar ItemList global de cursos para que Google descubra todos
function injectCoursesItemListJsonLd() {
  const list = (window.PRECISSA_COURSES || []).filter(c => c.id);
  if (list.length === 0) return;
  const data = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Catálogo de cursos PRECISSA INSTITUTE",
    "itemListElement": list.map((c, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "item": {
        "@type": "Course",
        "name": c.title,
        "description": c.shortDescription || '',
        "url": SEO_BASE_URL + '#curso/' + encodeURIComponent(c.id),
        "provider": { "@type": "EducationalOrganization", "name": "PRECISSA INSTITUTE" }
      }
    }))
  };
  const s = document.createElement('script');
  s.type = 'application/ld+json';
  s.id = 'seo-courselist-jsonld';
  s.textContent = JSON.stringify(data);
  document.head.appendChild(s);
}
injectCoursesItemListJsonLd();

// ─── CONTACTO COMERCIAL (modal + FormSubmit AJAX) ───────
// Modo 'presupuesto': pedir precio de una máquina (auto-rellena el producto).
// Modo 'demo':        solicitar demostración (selector desplegable de máquinas).
// FormSubmit.co envía los formularios al email indicado.
//
// Usamos el TOKEN ofuscado de FormSubmit en lugar del email en plano:
// evita que scrapers de spam vean precissainstitute@gmail.com en el HTML.
// El token está vinculado al email en la cuenta de FormSubmit, así que el
// flujo de entrega no cambia.
const QUOTE_ENDPOINT = 'https://formsubmit.co/ajax/e42ac5fc68012174f8ffe40e562d842b';

let _quoteOpener = null;
function openContactForm(mode, opts) {
  opts = opts || {};
  if (mode !== 'demo' && mode !== 'curso') mode = 'presupuesto';

  const overlay        = document.getElementById('quote-overlay');
  const form           = document.getElementById('quote-form');
  const formWrap       = document.getElementById('quote-form-wrap');
  const success        = document.getElementById('quote-success');
  const status         = document.getElementById('quote-status');
  const title          = document.getElementById('quote-title');
  const eyebrow        = document.getElementById('quote-eyebrow');
  const subjectInput   = document.getElementById('quote-subject-input');
  const productHidden  = document.getElementById('quote-producto-input');
  const productSelect  = document.getElementById('quote-product-select');
  const priceHidden    = document.getElementById('quote-precio-input');
  const productLine    = document.getElementById('quote-product-line');
  const mensaje        = form.querySelector('textarea[name="mensaje"]');

  form.reset();
  quoteLimpiarErrores();
  quoteBloquear(false);
  overlay.setAttribute('data-mode', mode);

  if (mode === 'demo') {
    title.innerHTML       = 'Solicitar demo';
    eyebrow.textContent   = 'Solicitud de demostración';
    subjectInput.value    = 'Nueva solicitud de demo · PRECISSA INSTITUTE';
    mensaje.placeholder   = '¿Algún día u horario te conviene mejor?';
    // El campo "producto" activo es el select; el hidden queda inactivo.
    productHidden.disabled = true;
    productSelect.disabled = false;
    productSelect.required = true;
    priceHidden.value      = '';
    // Opciones desde el catálogo real (incluye equipos creados en el panel);
    // el HTML estático se quedaba desincronizado y la preselección fallaba.
    const machines = (typeof getPublicProducts === 'function' ? getPublicProducts() : []);
    productSelect.innerHTML = [
      '<option value="">— Selecciona una opción —</option>',
      ...machines.map(p => `<option value="${escapeAttr(p.name)}">${escapeHtml(p.name)}</option>`),
      '<option value="Asesoramiento general">Aún no lo sé · quiero asesoramiento</option>'
    ].join('');
    // Si nos pasan una máquina, la pre-seleccionamos en el dropdown.
    const preselect = opts.productName || '';
    const hasOption = preselect && Array.from(productSelect.options).some(o => o.value === preselect);
    productSelect.value = hasOption ? preselect : '';
    if (hasOption) {
      productLine.innerHTML = 'Máquina: <strong>' + escapeHtml(preselect) +
        '</strong>. Te confirmamos disponibilidad en 24 h laborables.';
    } else {
      productLine.textContent = 'Te confirmamos disponibilidad en menos de 24 h laborables.';
    }
  } else if (mode === 'curso') {
    title.innerHTML       = 'Solicitar información';
    eyebrow.textContent   = 'Información del curso';
    subjectInput.value    = 'Nueva solicitud de información · PRECISSA INSTITUTE';
    mensaje.placeholder   = '¿Qué fechas te encajan? ¿Tienes experiencia previa?';
    // Igual que presupuesto: producto en hidden, select desactivado
    productSelect.disabled = true;
    productSelect.required = false;
    productHidden.disabled = false;
    productHidden.value    = opts.productName || '(Consulta general)';
    priceHidden.value      = '';
    if (opts.productName) {
      const cursoSel = (getCourses() || []).find(x => x.title === opts.productName);
      const fechaSel = proximaConvocatoria(cursoSel);
      productLine.innerHTML = 'Curso: <strong>' + escapeHtml(opts.productName) + '</strong>. ' +
        (fechaSel
          ? 'Próxima convocatoria: ' + escapeHtml(fechaSel) + '. Te respondemos con precio y plazas disponibles en menos de 24 h laborables.'
          : 'Te respondemos con fechas, precio y plazas disponibles en menos de 24 h laborables.');
    } else {
      productLine.textContent = 'Te respondemos con la información que pidas en menos de 24 h laborables.';
    }
  } else {
    title.innerHTML       = 'Pedir presupuesto';
    eyebrow.textContent   = 'Solicitud de presupuesto';
    subjectInput.value    = 'Nueva solicitud de presupuesto · PRECISSA INSTITUTE';
    mensaje.placeholder   = '¿Necesitas formación incluida, demo previa, financiación…?';
    // El campo "producto" activo es el hidden; el select queda inactivo.
    productSelect.disabled = true;
    productSelect.required = false;
    productHidden.disabled = false;
    productHidden.value    = opts.productName || '(Consulta general)';
    priceHidden.value      = opts.productPrice || '';
    if (opts.productName) {
      productLine.innerHTML = 'Producto: <strong>' + escapeHtml(opts.productName) +
        '</strong>. Te respondemos en menos de 24 h laborables.';
    } else {
      productLine.textContent = 'Te respondemos en menos de 24 h laborables.';
    }
  }

  formWrap.hidden    = false;
  success.hidden     = true;
  status.textContent = '';

  if (!overlay.classList.contains('open')) _quoteOpener = document.activeElement;
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => form.querySelector('input[name="nombre"]').focus(), 80);
}
function openQuoteForm(productName, productPrice) {
  openContactForm('presupuesto', { productName: productName, productPrice: productPrice });
}
function openDemoForm(productName) {
  openContactForm('demo', { productName: productName });
}
function openCursoInfoForm(courseTitle) {
  openContactForm('curso', { productName: courseTitle });
}
window.openContactForm   = openContactForm;
window.openQuoteForm     = openQuoteForm;
window.openDemoForm      = openDemoForm;
window.openCursoInfoForm = openCursoInfoForm;

function closeQuoteForm() {
  const ov = document.getElementById('quote-overlay');
  const wasOpen = ov.classList.contains('open');
  ov.classList.remove('open');
  // Si el cajón móvil sigue abierto, el scroll sigue bloqueado.
  document.body.style.overflow = _drawerIsOpen() ? 'hidden' : '';
  if (wasOpen && _quoteOpener && document.contains(_quoteOpener)) {
    try { _quoteOpener.focus(); } catch (e) {}
  }
  _quoteOpener = null;
}
window.closeQuoteForm = closeQuoteForm;

// Un único listener para Escape y la trampa de Tab. El modal del
// formulario tiene prioridad sobre el cajón móvil (está por encima).
document.addEventListener('keydown', e => {
  const quote = document.getElementById('quote-overlay');
  const quoteOpen = quote.classList.contains('open');
  if (e.key === 'Escape') {
    if (quoteOpen) { closeQuoteForm(); }
    else if (_drawerIsOpen()) { closeDrawer(); }
    return;
  }
  if (e.key !== 'Tab') return;
  if (quoteOpen) _trapTab(e, quote.querySelector('.quote-modal'));
  else if (_drawerIsOpen()) _trapTab(e, document.querySelector('#mobile-drawer .drawer-panel'));
});

// ─── Envío del modal: validación propia + dos canales ──────────────
// Origen publicitario (sin cookies): ver origenAnuncio() en las landings.
function origenAnuncio() {
  try {
    const q = new URLSearchParams(location.search);
    const s = (q.get('utm_source') || '').toLowerCase();
    if (!s) return '';
    const fuente = s.includes('google') ? 'Google' : (s.includes('insta') || s.includes('facebook') || s.includes('meta')) ? 'Instagram' : s;
    const camp = q.get('utm_campaign') || '';
    return fuente + (camp ? ' · ' + camp : '');
  } catch (e) { return ''; }
}
const ORIGEN_ANUNCIO = origenAnuncio();
if (ORIGEN_ANUNCIO) {
  document.querySelectorAll('a[href^="https://wa.me/"]').forEach(a => {
    try { const u = new URL(a.href); const t = u.searchParams.get('text') || ''; if (t && !t.includes('anuncio')) { u.searchParams.set('text', t + ' (Vengo del anuncio de ' + ORIGEN_ANUNCIO + ')'); a.href = u.toString(); } } catch (e) {}
  });
}
const QUOTE_MSG_FALLO = 'No hemos podido enviar tu solicitud. Llámanos al 601 05 67 06 o escríbenos a precissainstitute@gmail.com.';
let quoteEnviando = false;

// Devuelve la lista de errores [{ el, msg }]; vacía si todo está bien.
function validar(form) {
  const errores = [];
  const nombre = form.nombre.value.trim();
  const em     = form.email.value.trim();
  const tel    = form.telefono.value.trim();
  const sel    = document.getElementById('quote-product-select');
  if (sel && !sel.disabled && sel.required && !sel.value) {
    errores.push({ el: sel, msg: 'Elige la máquina que quieres ver en demo.' });
  }
  if (!nombre) errores.push({ el: form.nombre, msg: 'Escribe tu nombre para saber a quién respondemos.' });
  if (!em && !tel) errores.push({ el: form.telefono, msg: 'Déjanos un teléfono o un email: si WhatsApp no se abre, te contactamos por ahí.' });
  if (em && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) errores.push({ el: form.email, msg: 'Este email no parece completo (ejemplo: nombre@gmail.com).' });
  if (!form.rgpd.checked) errores.push({ el: form.rgpd, msg: 'Marca la casilla de privacidad para que podamos responderte.' });
  return errores;
}
function quoteCaja(el) { return el.closest('label') || el.parentNode; }
function quoteLimpiarCampo(el) {
  el.removeAttribute('aria-invalid');
  el.removeAttribute('aria-describedby');
  el.classList.remove('is-invalid');
  const n = quoteCaja(el).nextElementSibling;
  if (n && n.classList.contains('field-error')) n.remove();
}
function quoteLimpiarErrores() {
  const form = document.getElementById('quote-form');
  form.querySelectorAll('.is-invalid').forEach(quoteLimpiarCampo);
  form.querySelectorAll('.field-error').forEach(n => n.remove());
  document.getElementById('quote-status').textContent = '';
}
function quoteMarcar(err, i) {
  const el = err.el;
  const d  = document.createElement('div');
  d.className = 'field-error';
  d.id = 'quote-err-' + i;
  d.setAttribute('role', 'alert');
  d.textContent = err.msg;
  el.setAttribute('aria-invalid', 'true');
  el.setAttribute('aria-describedby', d.id);
  el.classList.add('is-invalid');
  quoteCaja(el).after(d);
}
function quoteBloquear(si) {
  quoteEnviando = si;
  document.getElementById('quote-submit-btn').disabled = si;
  document.getElementById('quote-alt-btn').disabled    = si;
}
function quoteMostrarExito(canal, wa) {
  const correo = canal === 'correo';
  document.getElementById('quote-success-title').textContent = correo ? 'Recibido, gracias' : 'Último paso: pulsa Enviar en WhatsApp';
  document.getElementById('quote-success-text').textContent  = correo
    ? 'Te contactamos en menos de 24 h laborables (lunes a viernes, 9:30 a 14:00).'
    : 'Si no usas WhatsApp, no pasa nada: te contactamos por teléfono o email.';
  document.getElementById('quote-wa-wrap').hidden = correo;
  if (!correo) document.getElementById('quote-wa-link').href = wa;
  document.getElementById('quote-status').textContent = '';
  document.getElementById('quote-form-wrap').hidden = true;
  document.getElementById('quote-success').hidden   = false;
  quoteBloquear(false);
}
function quoteMostrarFallo() {
  document.getElementById('quote-status').textContent = QUOTE_MSG_FALLO;
  quoteBloquear(false);
}

function quoteEnviar(canal) {
  if (quoteEnviando) return;
  const form   = document.getElementById('quote-form');
  const status = document.getElementById('quote-status');

  quoteLimpiarErrores();
  const errores = validar(form);
  if (errores.length) {
    errores.forEach(quoteMarcar);
    status.textContent = 'Revisa los campos marcados.';
    const primero = errores[0].el;
    primero.focus();
    primero.scrollIntoView({ block: 'center' });
    return;
  }

  const data = Object.fromEntries(new FormData(form));
  if (ORIGEN_ANUNCIO) data.origen_anuncio = ORIGEN_ANUNCIO;
  if (data._honey) return; // bot

  let wa = '';
  let abierto = null;
  if (canal === 'whatsapp') {
    // Canal principal: WhatsApp con la consulta ya escrita. Se abre DENTRO
    // del gesto (antes de cualquier await) o el navegador lo bloquearía.
    const modo = document.getElementById('quote-overlay').getAttribute('data-mode');
    const que  = data.producto && data.producto !== '(Consulta general)' ? data.producto : '';
    let texto = 'Hola, soy ' + String(data.nombre || '').trim() + '. ';
    if (modo === 'curso')     texto += que ? 'Me interesa el curso "' + que + '" y me gustaría recibir información (fechas, precio y plazas disponibles).' : 'Me gustaría recibir información sobre vuestros cursos.';
    else if (modo === 'demo') texto += 'Me gustaría solicitar una demostración' + (que ? ' de ' + que : '') + '.';
    else                      texto += 'Me gustaría recibir presupuesto' + (que ? ' de ' + que : '') + '.';
    if (data.profesional) texto += '\n(' + data.profesional + (data.empresa ? ' · ' + data.empresa : '') + ')';
    if (String(data.mensaje || '').trim()) texto += '\n\n' + String(data.mensaje).trim();
    if (ORIGEN_ANUNCIO) texto += ' (Vengo del anuncio de ' + ORIGEN_ANUNCIO + ')';
    wa = 'https://wa.me/34601056706?text=' + encodeURIComponent(texto);
    abierto = window.open(wa, '_blank');
    data.canal = 'WhatsApp (copia de respaldo)';
  } else {
    data.canal = 'Correo (sin WhatsApp)';
  }

  quoteBloquear(true);
  status.textContent = 'Enviando…';

  // Cuenta como entregado solo con res.ok Y json.success.
  fetch(QUOTE_ENDPOINT, {
    method: 'POST', keepalive: true,
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json().then(json => res.ok && !!json && (json.success === true || json.success === 'true')))
    .catch(() => false)
    .then(ok => {
      if (canal === 'whatsapp') {
        // Si WhatsApp se abrió, la persona puede enviar desde ahí aunque falle la copia.
        if (ok || abierto) quoteMostrarExito('whatsapp', wa); else quoteMostrarFallo();
      } else {
        if (ok) quoteMostrarExito('correo'); else quoteMostrarFallo();
      }
    });
}

(function () {
  const form = document.getElementById('quote-form');
  form.addEventListener('submit', function (e) { e.preventDefault(); quoteEnviar('whatsapp'); });
  document.getElementById('quote-alt-btn').addEventListener('click', function () { quoteEnviar('correo'); });
  // Limpia el error del campo al escribir
  form.addEventListener('input', function (e) {
    const el = e.target;
    if (el.name === 'email' || el.name === 'telefono') { quoteLimpiarCampo(form.email); quoteLimpiarCampo(form.telefono); }
    else if (el.classList) quoteLimpiarCampo(el);
  });
  form.addEventListener('change', function (e) {
    if (e.target.name === 'rgpd' || e.target.id === 'quote-product-select') quoteLimpiarCampo(e.target);
  });
  document.getElementById('quote-again').addEventListener('click', function () {
    document.getElementById('quote-success').hidden   = true;
    document.getElementById('quote-form-wrap').hidden = false;
    quoteLimpiarErrores();
    quoteBloquear(false);
    form.querySelector('input[name="nombre"]').focus();
  });
})();

// ─── INIT ───────────────────────────────────────────────
function renderDrawerCategorias() {
  const host = document.getElementById('drawer-cursos-cats');
  if (!host) return;
  const cats = window.PRECISSA_CATEGORIES || [];
  host.innerHTML = cats.map(c =>
    `<a class="drawer-subitem is-cat" href="/#cat/${c.id}" style="display:block" onclick="goToCursosCategory('${c.id}');closeDrawer();return false">${escapeHtml(c.label)}</a>`
  ).join('');
}

// ─── HOME · render dinamico de Areas de especializacion ─────
// Editorial: cada categoria tiene un titulo y descripcion mas
// evocativos que su tagline. Aqui los mapeamos por id.
// AREA_DISPLAY mantiene el placeholder de color y la descripcion editorial
// por categoria. El titulo grande de cada area se toma directamente de
// cat.label para que coincida con la categoria de la pagina de Cursos.
const AREA_DISPLAY = {
  'estetica-facial-avanzada': { ph: 'ph-rose', cover: 'assets/area-facial.jpg',           desc: 'Higiene profunda, peelings, antiacné, despigmentantes y rejuvenecimiento. Cosmetología avanzada y servicios de cabina facial.' },
  'electroestetica':          { ph: 'ph-clay', cover: 'assets/area-electro.jpg',          desc: 'Radiofrecuencia, ultrasonidos focalizados, láser y luz pulsada aplicados con precisión clínica.' },
  'micropigmentacion':        { ph: 'ph-dusk', cover: 'assets/area-micropigmentacion.jpg', desc: 'Técnica, color y seguridad para micropigmentación de cejas, labios y delineado.' },
  'corporal-bienestar':       { ph: 'ph-sand', cover: 'assets/area-corporal.jpg',         desc: 'Técnicas manuales y combinadas: drenaje linfático, maderoterapia y masajes reductores.' }
};
const AREA_ROMAN = ['I','II','III','IV','V','VI'];
function renderAreasHome() {
  const grid = document.getElementById('areas-grid');
  if (!grid) return;
  const cats = window.PRECISSA_CATEGORIES || [];
  grid.innerHTML = cats.map((cat, i) => {
    const d = AREA_DISPLAY[cat.id] || { ph: 'ph-sand', desc: cat.tagline || '' };
    const nCursos = (typeof getCourses === 'function' ? getCourses() : []).filter(c => c.category === cat.id).length;
    const ctaTxt = nCursos ? `Ver ${nCursos} ${nCursos === 1 ? 'curso' : 'cursos'}` : 'Ver cursos';
    const imgPart = d.cover
      ? coverImgHtml(d.cover, escapeAttr(cat.label))
      : `<div class="ph-label">${escapeHtml(cat.id)} · PRECISSA INSTITUTE</div>`;
    const imgClass = d.cover ? 'area-card-img' : 'area-card-img ph ' + d.ph;
    return `
      <div class="area-card" style="cursor:pointer" onclick="goToCursosCategory('${cat.id}')">
        <div class="${imgClass}">
          ${imgPart}
          <span class="area-roman">${AREA_ROMAN[i] || ''}</span>
        </div>
        <div class="area-card-body">
          <div class="area-title">${escapeHtml(cat.label)}</div>
          <p class="area-desc">${escapeHtml(d.desc)}</p>
          <button class="btn btn-outline btn-sm" aria-label="${escapeAttr(ctaTxt + ' de ' + cat.label)}">${escapeHtml(ctaTxt)} <i class="ico ico-arrow" aria-hidden="true"></i></button>
        </div>
      </div>`;
  }).join('');
}

// ─── Routing con persistencia de URL hash ───────────────────
const PAGE_HASH = {
  'home': '',
  'cursos': '#cursos',
  'curso': '#curso',
  'aula': '#aula',
  'aula-curso': '#aula-curso',
  'leccion': '#leccion',
  'tests': '#tests',
  'resultado': '#resultado',
  'tienda': '#tienda',
  'producto': '#producto',
  'admin': '#admin'
};
const HASH_PAGE = Object.fromEntries(Object.entries(PAGE_HASH).map(([k,v]) => [v, k]));
// Sobrescribimos goTo() para que tambien actualice la URL.
// pushState (no replaceState) para que el botón atrás/adelante navegue
// dentro de la SPA en vez de sacar al usuario del sitio.
const _origGoTo = goTo;
goTo = function(pageKey, area, opts) {
  opts = opts || {};
  _origGoTo(pageKey, area);
  if (!opts.skipHash) {
    const cfg = pages[pageKey];
    let targetHash = PAGE_HASH[pageKey] || '';
    // El curso abierto viaja en el hash: recargar o compartir #curso/<id>
    // vuelve al mismo curso (antes se perdía y caía al primero).
    if (pageKey === 'aula-curso' && window._currentAulaCourseId) {
      targetHash = '#curso/' + window._currentAulaCourseId;
    }
    if (cfg && targetHash !== window.location.hash) {
      const url = window.location.pathname + (targetHash || '');
      try { history.pushState(null, '', url); } catch(e) {}
    }
  }
};
function routeFromHash() {
  const hash = window.location.hash || '';
  // Callback OAuth de Supabase (Google login): no tocar el hash, Supabase
  // lo lee y limpia solo. Sin este bypass, el routing borraria el token.
  if (hash.indexOf('access_token=') !== -1 || hash.indexOf('error_description=') !== -1) {
    return;
  }
  // Ruta categorica: #cat/<id> → cursos + filtro
  if (hash.startsWith('#cat/')) {
    const catId = decodeURIComponent(hash.substring(5));
    _origGoTo('cursos','docencia');
    setTimeout(() => {
      const btn = document.querySelector(`.cursos-pub-filter[data-cat="${catId}"]`);
      if (btn) filterCursosPublic(btn, catId);
      const target = document.getElementById('cat-' + catId);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
    return;
  }
  // Ruta de curso: #curso/<id>. Con matrícula abre el aula del curso;
  // sin ella lleva al catálogo público desplazado hasta su ficha.
  if (hash.startsWith('#curso/')) {
    const courseId = decodeURIComponent(hash.substring(7));
    const course = getCourses().find(c => c.id === courseId);
    if (!course) {
      _origGoTo('cursos','docencia');
      try { history.replaceState(null, '', window.location.pathname + '#cursos'); } catch (e) {}
      const grid = document.getElementById('cursos-pub-grid');
      if (grid && grid.parentNode && !document.querySelector('.cursos-pub-aviso')) {
        const av = document.createElement('div');
        av.className = 'cursos-pub-aviso';
        av.setAttribute('role', 'status');
        av.textContent = 'No encontramos ese curso. Estos son todos los que impartimos.';
        grid.parentNode.insertBefore(av, grid);
      }
      return;
    }
    Promise.resolve(canAccessCourse(course)).then(ok => {
      if (ok) {
        window._currentAulaCourseId = courseId;
        _origGoTo('aula-curso','docencia');
      } else {
        _origGoTo('cursos','docencia');
        // Sincronizar la URL con lo que se muestra (el catálogo), sin crear
        // entrada de historial extra.
        try { history.replaceState(null, '', window.location.pathname + '#cursos'); } catch (e) {}
        setTimeout(() => {
          const el = document.getElementById('curso-card-' + courseId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('is-destacada');
            setTimeout(() => el.classList.remove('is-destacada'), 2500);
          }
        }, 80);
      }
    });
    return;
  }
  // Ruta de producto: #producto/<id>
  if (hash.startsWith('#producto/')) {
    window._currentProductId = decodeURIComponent(hash.substring(10));
    _origGoTo('producto','aparatologia');
    return;
  }
  // Hash directo
  const key = HASH_PAGE[hash];
  if (key && pages[key]) {
    _origGoTo(key, pages[key].area);
    return;
  }
  // Sin hash o desconocido: home
  _origGoTo('home','');
}
// popstate cubre atrás/adelante con pushState Y los cambios manuales de
// hash (que también lo disparan); escuchar además hashchange duplicaría
// el render en cada navegación del historial.
window.addEventListener('popstate', routeFromHash);

renderDrawerCategorias();
renderAreasHome();
renderConvocatorias();
routeFromHash();
if (window.auth && window.auth.init) window.auth.init();

// Cargar visibilidad y overrides de cursos; refrescar el catálogo al llegar.
if (window.courseVisibility && window.courseVisibility.isConfigured()) {
  window.courseVisibility.load().then(() => { renderPublicCourses(); renderConvocatorias(); }).catch(() => {});
}
if (window.courseContent && window.courseContent.isConfigured()) {
  window.courseContent.load().then(() => { renderPublicCourses(); renderConvocatorias(); }).catch(() => {});
}
// Cargar la tienda de aparatología; refrescar catálogo, ficha y home.
if (window.productContent && window.productContent.isConfigured()) {
  window.productContent.load().then(() => {
    renderTienda();
    renderFeaturedProducts();
    if (window._currentProductId) renderProducto(window._currentProductId);
  }).catch(() => {});
}
