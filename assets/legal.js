/* =============================================================
 * PRECISSA INSTITUTE · Script compartido paginas legales/sobre
 * - Marca de agua del sello SS que rota con el scroll
 * - Registro del Service Worker (PWA)
 * Respeta prefers-reduced-motion para la animacion.
 * ============================================================= */

// Service Worker: instala la PWA tambien si la usuaria entra por
// estas paginas (no solo por la home)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .catch(function (err) { console.warn('[sw] registro fallo:', err); });
  });
}

(function () {
  var wm = document.querySelector('.page-watermark');
  if (!wm) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var ticking = false;
  function update() {
    var max = (document.documentElement.scrollHeight - window.innerHeight) || 1;
    var p = window.scrollY / max;
    var deg = p * 90; // 0 a 90 grados a lo largo del scroll
    wm.style.transform = 'translate3d(0,-50%,0) rotate(' + deg.toFixed(2) + 'deg)';
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  update();
})();
