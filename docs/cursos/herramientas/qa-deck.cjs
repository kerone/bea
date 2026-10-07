const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const [,, deck, outDir] = process.argv;
(async () => {
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(async () => chromium.launch());
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto('file://' + deck, { waitUntil: 'load' });
await page.waitForTimeout(800);
const n = await page.evaluate(() => document.querySelectorAll('.slide').length);
const over = [];
for (let i = 0; i < n; i++) {
  const r = await page.evaluate((i) => {
    const slides = document.querySelectorAll('.slide');
    slides.forEach((s, k) => s.classList.toggle('active', k === i));
    const s = slides[i], inner = s.querySelector('.slide-inner');
    const disponible = s.clientHeight - 112; // padding 56 arriba y abajo
    const h2 = s.querySelector('.slide-h1,.slide-h2');
    return { i: i + 1, usado: inner.scrollHeight, disponible, titulo: (h2 ? h2.textContent : s.querySelector('.slide-eyebrow')?.textContent || '').trim().slice(0, 50) };
  }, i);
  if (r.usado > r.disponible) over.push(r);
}
console.log('slides:', n, '| desbordan:', over.length);
over.forEach(o => console.log(`  #${o.i} ${o.usado}/${o.disponible}px  ${o.titulo}`));
const muestra = [3, 6, 10, 20, 77, 78].filter(k => k <= n);
for (const k of muestra) {
  await page.evaluate((i) => { document.querySelectorAll('.slide').forEach((s, j) => s.classList.toggle('active', j === i)); document.getElementById('cur').textContent = String(i + 1).padStart(2, '0'); }, k - 1);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${outDir}/slide-${String(k).padStart(2, '0')}.png` });
}
await browser.close(); })();
