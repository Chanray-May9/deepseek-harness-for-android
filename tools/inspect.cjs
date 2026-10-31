// Inspect original web UI in a phone viewport (read-only, own qa-home instance).
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(path.join(__dirname, 'node_modules/playwright-core'));

const ROOT = path.resolve(__dirname, '..');
const BASE = process.env.DSH_URL || fs.readFileSync(path.join(ROOT, 'build/web.url'), 'utf8').trim();

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
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3500);

  const shot = path.join(ROOT, 'build/shots');
  fs.mkdirSync(shot, { recursive: true });

  // Dismiss first-run notice if present.
  for (const name of ['继续', '关闭', '知道了']) {
    const b = page.getByRole('button', { name, exact: true });
    if (await b.count()) {
      await b.first().click().catch(() => {});
      await page.waitForTimeout(600);
    }
  }

  await page.screenshot({ path: path.join(shot, '01-baseline.png') });

  const info = await page.evaluate(() => {
    const out = [];
    const walk = (el, depth) => {
      if (depth > 6) return;
      const r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) return;
      out.push({
        d: depth,
        tag: el.tagName.toLowerCase(),
        cls: (el.className && String(el.className).slice(0, 90)) || '',
        text: (el.children.length === 0 ? (el.textContent || '').trim().slice(0, 40) : ''),
        rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
      });
      for (const c of el.children) walk(c, depth + 1);
    };
    walk(document.body, 0);
    return {
      bodyText: document.body.innerText.slice(0, 1500),
      nodes: out.slice(0, 220),
      buttons: [...document.querySelectorAll('button')].map((b) => ({
        label: b.getAttribute('aria-label'),
        cls: String(b.className).slice(0, 70),
        text: b.innerText.replace(/\s+/g, ' ').trim().slice(0, 30),
      })),
      innerHeight: window.innerHeight,
      innerWidth: window.innerWidth,
    };
  });

  fs.writeFileSync(path.join(ROOT, 'build/dom-baseline.json'), JSON.stringify(info, null, 2));
  fs.writeFileSync(path.join(ROOT, 'build/dom-baseline.html'), await page.content());
  console.log(JSON.stringify({ errors, bodyText: info.bodyText, buttons: info.buttons }, null, 2));
  await browser.close();
})().catch((e) => {
  console.error('INSPECT_FAIL', e.message);
  process.exit(1);
});
