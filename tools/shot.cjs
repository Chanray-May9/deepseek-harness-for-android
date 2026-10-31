// Render the phone shell against the isolated dsh web instance and capture states.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(path.join(__dirname, 'node_modules/playwright-core'));

const ROOT = path.resolve(__dirname, '..');
const BASE = fs.readFileSync(path.join(ROOT, 'build/web.url'), 'utf8').trim();
const CSS = fs.readFileSync(path.join(ROOT, 'mobile/android-mobile.css'), 'utf8');
const JS = fs.readFileSync(path.join(ROOT, 'mobile/android-mobile.js'), 'utf8');
const OUT = path.join(ROOT, 'build/shots');

async function open(browser, size, opts = {}) {
  const ctx = await browser.newContext({
    viewport: size,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: 'zh-CN',
    storageState: opts.state,
  });
  await ctx.addInitScript(() => {
    const go = () => {
      try {
        document.documentElement.setAttribute('data-harness-android', '');
      } catch (e) {}
    };
    go();
    document.addEventListener('DOMContentLoaded', go, { once: true });
  });
  await ctx.route('**/*', async (route) => {
    const req = route.request();
    if (req.resourceType() !== 'document') return route.fallback();
    const res = await route.fetch();
    let body = await res.text();
    if (!body.includes('android-mobile.css')) {
      body = body.replace(
        '</head>',
        '<link rel="stylesheet" href="/__hm/android-mobile.css">\n<script defer src="/__hm/android-mobile.js"></script>\n</head>',
      );
    }
    await route.fulfill({ response: res, body });
  });
  await ctx.route('**/__hm/android-mobile.css', (r) => r.fulfill({ contentType: 'text/css', body: CSS }));
  await ctx.route('**/__hm/android-mobile.js', (r) => r.fulfill({ contentType: 'text/javascript', body: JS }));

  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  for (let i = 0; i < 4; i++) {
    const closeBtn = page.locator('[role=dialog] button[aria-label="关闭"], [role=dialog] button[aria-label="Close"]');
    if (!(await closeBtn.count())) break;
    await closeBtn.first().click().catch(() => {});
    await page.waitForTimeout(400);
  }
  await page.waitForTimeout(600);
  return { ctx, page, errors };
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
  });

  const { ctx, page, errors } = await open(browser, { width: 450, height: 800 });

  // Select the first-use default workspace when the composer is still gated on it.
  const gate = page.locator('button[aria-label="选择工作区"], button[aria-label="Choose workspace"]');
  if (await gate.count()) {
    await gate.first().click().catch(() => {});
    await page.waitForTimeout(700);
    const menu = page.locator('[role=menu]').first();
    const item = menu.locator('button, [role=menuitem]').filter({ hasText: /默认工作区|Default workspace/ });
    if (await item.count()) {
      await item.first().click().catch(() => {});
      await page.waitForTimeout(1800);
    } else {
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(300);
    }
  }

  await page.screenshot({ path: path.join(OUT, '02-mobile-home.png') });

  const metrics = await page.evaluate(() => {
    const rect = (s) => {
      const el = document.querySelector(s);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)];
    };
    return {
      html: document.documentElement.getAttribute('data-harness-android'),
      viewport: [innerWidth, innerHeight],
      frame: rect('.mP3x-q_frame'),
      sidebar: rect('.wtg9ga_root'),
      toggle: rect('.wtg9ga_toggle'),
      actions: rect('#harness-mobile-actions'),
      heroHeadline: rect('.WOwLGG_headline'),
      heroRoot: rect('.WOwLGG_root'),
      workspaceRow: rect('.an3WzG_heroWorkspaceRow'),
      workspace: rect('.WOwLGG_workspace'),
      mode: rect('.m2hUqa_seat'),
      card: rect('.GRgSLq_card'),
      input: rect('[data-composer-input]'),
      addBtn: rect('.GRgSLq_add'),
      sendBtn: rect('.GRgSLq_primary'),
      overflowX: document.documentElement.scrollWidth,
      titleText: document.querySelector('.WOwLGG_titleGroup > span')?.textContent,
      headlineFont: getComputedStyle(document.querySelector('.WOwLGG_headline')).fontSize,
      placeholder: document.querySelector('.GRgSLq_placeholder')?.textContent,
    };
  });
  console.log(JSON.stringify({ errors, metrics }, null, 2));
  fs.writeFileSync(path.join(ROOT, 'build/metrics-home.json'), JSON.stringify(metrics, null, 2));

  // Drawer state: the only permanent navigation surface on the phone.
  await page.locator('.wtg9ga_toggle').first().click().catch(() => {});
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, '06-mobile-drawer.png') });
  const drawer = await page.evaluate(() => {
    const root = document.querySelector('.wtg9ga_root');
    const r = root?.getBoundingClientRect();
    return {
      cls: String(root?.className || ''),
      rect: r ? [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] : null,
      entries: [...document.querySelectorAll('.wtg9ga_newSession, .wtg9ga_panelRow')].map((b) =>
        (b.getAttribute('aria-label') || b.innerText || '').replace(/\s+/g, ' ').trim(),
      ),
    };
  });
  console.log('DRAWER', JSON.stringify(drawer));
  await page.evaluate(() => window.HarnessMobile && window.HarnessMobile.closeDrawer());
  await page.waitForTimeout(400);

  await ctx.storageState({ path: path.join(ROOT, 'build/state.json') });
  await browser.close();
})().catch((e) => {
  console.error('SHOT_FAIL', e.message);
  process.exit(1);
});