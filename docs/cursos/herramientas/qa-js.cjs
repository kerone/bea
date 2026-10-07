const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file://' + process.argv[2]); await p.waitForTimeout(600);
  console.log('errores JS:', errs.length ? errs : 'ninguno');
  console.log('tot:', await p.evaluate(() => document.getElementById('tot').textContent));
  await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(400);
  console.log('cur tras 2 flechas:', await p.evaluate(() => document.getElementById('cur').textContent), '| bloque:', await p.evaluate(() => document.getElementById('bloque').textContent), '| bar:', await p.evaluate(() => document.getElementById('bar').style.width));
  await p.keyboard.press('n'); await p.waitForTimeout(400);
  console.log('guion abierto:', await p.evaluate(() => document.getElementById('notas').classList.contains('open')), '| chars guion:', await p.evaluate(() => document.getElementById('notas').textContent.length));
  await p.screenshot({ path: process.argv[3] + '/guion-abierto.png' });
  await b.close();
})();
