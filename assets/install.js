/* =============================================================
 * PRECISSA INSTITUTE · Boton flotante "Instalar app" (PWA)
 * -------------------------------------------------------------
 * - Solo aparece en mobile y si la app NO esta ya instalada
 * - Android: usa el prompt nativo beforeinstallprompt
 * - iOS: muestra un mini-tutorial con los pasos para Safari
 * - Descartar con la x: se recuerda en localStorage (no vuelve)
 * - Aparece con 3s de delay para no agredir al cargar la pagina
 * ============================================================= */
(function () {
  // --- Bloqueos de aparicion ---
  // Ya esta instalada (display-mode standalone en Android, navigator.standalone en iOS)
  if (window.matchMedia('(display-mode: standalone)').matches) return;
  if (window.navigator.standalone === true) return;
  // Usuario ya descarto
  if (localStorage.getItem('precissa-install-dismissed') === '1') return;
  // Solo mobile (touch + viewport estrecho o user agent movil)
  var ua = navigator.userAgent || '';
  var isMobile = window.matchMedia('(max-width: 900px)').matches
                 || /Android|iPhone|iPad|iPod/i.test(ua);
  if (!isMobile) return;

  var isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  var deferredPrompt = null;

  // --- CSS inyectado ---
  function injectStyles() {
    if (document.getElementById('pwa-install-style')) return;
    var s = document.createElement('style');
    s.id = 'pwa-install-style';
    s.textContent = [
      '.pwa-install-pill { position: fixed; right: 14px; bottom: calc(14px + env(safe-area-inset-bottom, 0px)); z-index: 9998; display: inline-flex; align-items: center; gap: 10px; padding: 8px 8px 8px 10px; background: rgba(242,236,227,0.96); backdrop-filter: saturate(140%) blur(8px); -webkit-backdrop-filter: saturate(140%) blur(8px); color: #241D17; border: 1px solid rgba(36,29,23,0.16); border-radius: 999px; box-shadow: 0 6px 22px rgba(36,29,23,0.14); font-family: Manrope, sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; opacity: 0; transform: translateY(12px); transition: opacity 0.45s ease, transform 0.45s ease; }',
      '.pwa-install-pill.show { opacity: 1; transform: translateY(0); }',
      '.pwa-install-pill img { width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0; }',
      '.pwa-install-pill .pwa-install-label { line-height: 1.1; padding-right: 4px; }',
      '.pwa-install-pill .pwa-install-close { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 50%; color: #8A8073; font-size: 18px; line-height: 1; background: transparent; border: none; cursor: pointer; transition: background 0.15s, color 0.15s; }',
      '.pwa-install-pill .pwa-install-close:hover { background: rgba(36,29,23,0.06); color: #241D17; }',
      '.pwa-install-modal { position: fixed; inset: 0; background: rgba(36,29,23,0.55); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); z-index: 9999; display: flex; align-items: flex-end; justify-content: center; padding: 0; opacity: 0; transition: opacity 0.3s ease; }',
      '.pwa-install-modal.show { opacity: 1; }',
      '.pwa-install-modal-card { background: #F2ECE3; border-radius: 18px 18px 0 0; padding: 28px 26px calc(28px + env(safe-area-inset-bottom, 0px)); max-width: 460px; width: 100%; font-family: Manrope, sans-serif; transform: translateY(20px); transition: transform 0.35s ease; }',
      '.pwa-install-modal.show .pwa-install-modal-card { transform: translateY(0); }',
      '.pwa-install-modal-seal { width: 56px; height: 56px; border-radius: 50%; margin: 0 auto 14px; display: block; }',
      '.pwa-install-modal-card h3 { font-family: "Instrument Serif", serif; font-weight: 400; font-size: 26px; margin: 0 0 6px; color: #241D17; text-align: center; letter-spacing: -0.01em; }',
      '.pwa-install-modal-card p { font-size: 14px; color: #544A40; margin: 0 0 18px; text-align: center; line-height: 1.55; }',
      '.pwa-install-steps { margin: 8px 0 20px; }',
      '.pwa-install-step { display: flex; gap: 12px; align-items: flex-start; padding: 10px 0; border-bottom: 1px solid rgba(36,29,23,0.08); }',
      '.pwa-install-step:last-child { border-bottom: none; }',
      '.pwa-install-step-num { flex-shrink: 0; width: 26px; height: 26px; border-radius: 50%; background: #A86B4E; color: #fff; font-family: "Instrument Serif", serif; font-style: italic; font-size: 14px; display: flex; align-items: center; justify-content: center; line-height: 1; }',
      '.pwa-install-step-body { font-size: 14px; color: #241D17; line-height: 1.5; padding-top: 4px; }',
      '.pwa-install-step-body strong { font-weight: 600; }',
      '.pwa-install-modal-btn { display: block; width: 100%; background: #241D17; color: #F2ECE3; border: none; padding: 13px 22px; border-radius: 999px; font-family: Manrope, sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; transition: background 0.15s; }',
      '.pwa-install-modal-btn:hover { background: #3a302a; }'
    ].join('\n');
    document.head.appendChild(s);
  }

  // --- Render del pill ---
  function showPill() {
    if (document.querySelector('.pwa-install-pill')) return;
    injectStyles();
    var pill = document.createElement('div');
    pill.className = 'pwa-install-pill';
    pill.setAttribute('role', 'button');
    pill.setAttribute('aria-label', 'Instalar Precissa Institute como aplicación');
    pill.innerHTML = '<img src="/assets/seal-ss.webp" alt=""><span class="pwa-install-label">Instalar app</span><button class="pwa-install-close" aria-label="Descartar">×</button>';
    document.body.appendChild(pill);
    requestAnimationFrame(function () { pill.classList.add('show'); });

    pill.querySelector('.pwa-install-close').addEventListener('click', function (e) {
      e.stopPropagation();
      localStorage.setItem('precissa-install-dismissed', '1');
      hidePill();
    });

    pill.addEventListener('click', function () {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function (choice) {
          deferredPrompt = null;
          if (choice.outcome === 'accepted') hidePill();
        });
      } else if (isIOS) {
        showIOSModal();
      }
    });
  }

  function hidePill() {
    var pill = document.querySelector('.pwa-install-pill');
    if (!pill) return;
    pill.classList.remove('show');
    setTimeout(function () { pill.remove(); }, 450);
  }

  // --- Modal de tutorial iOS ---
  function showIOSModal() {
    injectStyles();
    var modal = document.createElement('div');
    modal.className = 'pwa-install-modal';
    modal.innerHTML = [
      '<div class="pwa-install-modal-card">',
      '  <img src="/assets/seal-ss.webp" alt="" class="pwa-install-modal-seal">',
      '  <h3>Instalar en iPhone</h3>',
      '  <p>Añade Precissa Institute a tu pantalla de inicio para acceder más rápido al aula.</p>',
      '  <div class="pwa-install-steps">',
      '    <div class="pwa-install-step"><div class="pwa-install-step-num">1</div><div class="pwa-install-step-body">Pulsa el botón <strong>Compartir</strong> abajo en el centro de Safari ⬆</div></div>',
      '    <div class="pwa-install-step"><div class="pwa-install-step-num">2</div><div class="pwa-install-step-body">Desplázate y pulsa <strong>“Añadir a pantalla de inicio”</strong></div></div>',
      '    <div class="pwa-install-step"><div class="pwa-install-step-num">3</div><div class="pwa-install-step-body">Confirma <strong>“Añadir”</strong> arriba a la derecha</div></div>',
      '  </div>',
      '  <button class="pwa-install-modal-btn">Entendido</button>',
      '</div>'
    ].join('');
    document.body.appendChild(modal);
    requestAnimationFrame(function () { modal.classList.add('show'); });

    function close() {
      modal.classList.remove('show');
      setTimeout(function () { modal.remove(); }, 350);
    }
    modal.querySelector('.pwa-install-modal-btn').addEventListener('click', close);
    modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
  }

  // --- Captura del evento de instalacion nativa ---
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    setTimeout(showPill, 3000);
  });

  // En iOS no hay beforeinstallprompt, asi que mostramos el pill por tiempo
  if (isIOS) setTimeout(showPill, 3500);

  // Cuando se completa la instalacion, ocultar y recordar
  window.addEventListener('appinstalled', function () {
    localStorage.setItem('precissa-install-completed', '1');
    hidePill();
  });
})();
