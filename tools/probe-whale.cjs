// Probe the whale glyph markup and the workspace menu structure.
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
    try { document.documentElement.setAttribute('data-harness-android', ''); } catch (e) {}
  });
  await ctx.route('**/*', async (route) => {
    if (route.request().resourceType() !== 'document') return route.fallback();
    const res = await route.fetch();
    let body = await res.text();
    body = body.replace('</head>', '<link rel="stylesheet" href="/__hm/a.css"><script defer src="/__hm/a.js"></script></head>');
    await route.fulfill({ response: res, body });
  });
  await ctx.route('**/__hm/a.css', (r) => r.fulfill({ contentType: 'text/css', body: CSS }));
  await ctx.route('**/__hm/a.js', (r) => r.fulfill({ contentType: 'text/javascript', body: JS }));
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  for (let i = 0; i < 4; i++) {
    const b = page.locator('[role=dialog] button[aria-label="关闭"]');
    if (!(await b.count())) break;
    await b.first().click().catch(() => {});
    await page.waitForTimeout(350);
  }

  const whale = await page.evaluate(() => {
    const h = document.querySelector('.WOwLGG_headline');
    if (!h) return { missing: true };
    const first = h.firstElementChild;
    return {
      childCount: h.children.length,
      order: [...h.children].map((c) => ({ tag: c.tagName.toLowerCase(), cls: String(c.className).slice(0, 40), text: (c.textContent || '').trim().slice(0, 20) })),
      firstHTML: first ? first.outerHTML.slice(0, 700) : null,
      headlineHTML: h.outerHTML.slice(0, 1200).replace(/<svg[\s\S]*?<\/svg>/g, (m) => '[svg ' + m.length + 'B]'),
    };
  });
  console.log('WHALE', JSON.stringify(whale, null, 2));

  await page.locator('button[aria-label="选择工作区"]').first().click().catch(() => {});
  await page.waitForTimeout(900);
  const menu = await page.evaluate(() =>
    [...document.querySelectorAll('[role=menu]')].map((m) => ({
      cls: String(m.className).slice(0, 70),
      html: m.outerHTML.slice(0, 900),
    })),
  );
  console.log('MENU', JSON.stringify(menu, null, 2));
  await browser.close();
})().catch((e) => {
  console.error('PROBE_FAIL', e.message);
  process.exit(1);
});
