/* =============================================================
 * PRECISSA INSTITUTE · Marca de agua del sello SS
 * Rota suavemente con el scroll en las paginas legales.
 * Respeta prefers-reduced-motion.
 * ============================================================= */
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
