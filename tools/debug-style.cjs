// Inspect computed styles of the composer container to see which rules win.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(path.join(__dirname, 'node_modules/playwright-core'));

const ROOT = path.resolve(__dirname, '..');
const BASE = fs.readFileSync(path.join(ROOT, 'build/web.url'), 'utf8').trim();
const CSS = fs.readFileSync(path.join(ROOT, 'mobile/android-mobile.css'), 'utf8');
const JS = fs.readFileSync(path.join(ROOT, 'mobile/android-mobile.js'), 'utf8');

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
  await ctx.addInitScript(() => {
    try {
      document.documentElement.setAttribute('data-harness-android', '');
    } catch (e) {}
  });
  await ctx.route('**/*', async (route) => {
    const req = route.request();
    if (req.resourceType() !== 'document') return route.fallback();
    const res = await route.fetch();
    let body = await res.text();
    body = body.replace(
      '</head>',
      '<link rel="stylesheet" href="/__hm/a.css">\n<script defer src="/__hm/a.js"></script>\n</head>',
    );
    await route.fulfill({ response: res, body });
  });
  await ctx.route('**/__hm/a.css', (r) => r.fulfill({ contentType: 'text/css', body: CSS }));
  await ctx.route('**/__hm/a.js', (r) => r.fulfill({ contentType: 'text/javascript', body: JS }));
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  for (const n of ['继续', '关闭']) {
    const b = page.getByRole('button', { name: n, exact: true });
    if (await b.count()) await b.first().click().catch(() => {});
  }
  await page.waitForTimeout(500);

  const out = await page.evaluate(() => {
    const pick = ['.an3WzG_composerSeat', '.an3WzG_composerStack', '.GRgSLq_root', '.GRgSLq_card', '.an3WzG_heroWorkspaceRow'];
    const rows = pick.map((s) => {
      const el = document.querySelector(s);
      if (!el) return { s, missing: true };
      const cs = getComputedStyle(el);
      return {
        s,
        cls: el.className,
        padding: cs.padding,
        margin: cs.margin,
        gap: cs.gap,
        width: cs.width,
        display: cs.display,
        flex: cs.flex,
        justify: cs.justifyContent,
        rect: (() => { const r = el.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(Math.round); })(),
      };
    });
    // Which sheets are loaded and how many rules match the composer hero?
    const sheets = [...document.styleSheets].map((sh) => {
      let n = 0;
      try { n = sh.cssRules.length; } catch (e) { n = -1; }
      return { href: sh.href || '(inline)', rules: n };
    });
    let matched = [];
    for (const sh of document.styleSheets) {
      let rules;
      try { rules = sh.cssRules; } catch (e) { continue; }
      for (const rl of rules) {
        if (!rl.selectorText) continue;
        if (!rl.selectorText.includes('composerHero') && !rl.selectorText.includes('composerStack')) continue;
        if (!rl.style || !rl.style.padding) continue;
        matched.push({ href: sh.href || '(inline)', sel: rl.selectorText.slice(0, 120), pad: rl.style.padding, imp: rl.style.getPropertyPriority('padding') });
      }
    }
    return { rows, sheets, matched, htmlAttr: document.documentElement.getAttribute('data-harness-android'), url: location.href.split('?')[0] };
  });
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
})().catch((e) => {
  console.error('DBG_FAIL', e.message);
  process.exit(1);
});
