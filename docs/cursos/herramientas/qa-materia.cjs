const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const [, , file, out] = process.argv;
  for (const [nombre, vp] of [['movil', { width: 390, height: 844 }], ['pc', { width: 1200, height: 900 }]]) {
    const p = await b.newPage({ viewport: vp }); await p.goto('file://' + file); await p.waitForTimeout(500);
    const objetivos = ['.ac-portada', '.ac-indice', '#sec-modulo-1-piel-pelo-y-foliculo', '.ac-fig:nth-of-type(2)', '.ac-act', '#sec-practicas-presenciales', '.ac-evid', '.ac-caso', '.ac-tabla-scroll:last-of-type'];
    let k = 0;
    for (const sel of objetivos) {
      const ok = await p.evaluate((sel) => { const el = document.querySelector(sel); if (!el) return false; document.documentElement.style.scrollBehavior='auto'; window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 12); return true; }, sel);
      if (!ok) { console.log('no encontrado', sel); continue; }
      await p.waitForTimeout(400); k++;
      await p.screenshot({ path: `${out}/mat-${nombre}-${String(k).padStart(2, '0')}.png` });
    }
    console.log(nombre, 'capturas:', k, '| ancho documento:', await p.evaluate(() => document.documentElement.scrollWidth), '| viewport:', vp.width);
    await p.close();
  }
  await b.close();
})();
