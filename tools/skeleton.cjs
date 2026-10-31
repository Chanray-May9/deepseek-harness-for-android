// Dump the real DOM skeleton (no width filtering) to locate layout containers.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(path.join(__dirname, 'node_modules/playwright-core'));

const ROOT = path.resolve(__dirname, '..');
const BASE = fs.readFileSync(path.join(ROOT, 'build/web.url'), 'utf8').trim();

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
  });
  const ctx = await browser.newContext({
    viewport: { width: 450, height: 800 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: 'zh-CN',
  });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3500);
  for (const name of ['继续', '关闭']) {
    const b = page.getByRole('button', { name, exact: true });
    if (await b.count()) await b.first().click().catch(() => {});
  }
  await page.waitForTimeout(500);

  const dump = await page.evaluate(() => {
    const lines = [];
    const walk = (el, depth) => {
      if (depth > 9) return;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      lines.push({
        i: depth,
        tag: el.tagName.toLowerCase(),
        cls: String(el.className || '').slice(0, 110),
        rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
        pos: cs.position,
        disp: cs.display,
        text: el.children.length === 0 ? (el.textContent || '').trim().slice(0, 30) : '',
      });
      for (const c of el.children) walk(c, depth + 1);
    };
    walk(document.body, 0);
    const classes = new Set();
    for (const el of document.querySelectorAll('*')) {
      for (const c of String(el.className || '').split(/\s+/)) if (c) classes.add(c);
    }
    return { lines, classes: [...classes].sort() };
  });

  fs.writeFileSync(path.join(ROOT, 'build/dom-skeleton.json'), JSON.stringify(dump.lines, null, 1));
  fs.writeFileSync(path.join(ROOT, 'build/classes.txt'), dump.classes.join('\n'));
  console.log('nodes', dump.lines.length, 'classes', dump.classes.length);
  for (const n of dump.lines.slice(0, 70)) {
    console.log(`${'  '.repeat(n.i)}${n.tag}.${n.cls.replace(/\s+/g, ',')} [${n.rect.join(',')}] ${n.pos}/${n.disp} ${n.text}`);
  }
  await browser.close();
})().catch((e) => {
  console.error('SKELETON_FAIL', e.message);
  process.exit(1);
});
