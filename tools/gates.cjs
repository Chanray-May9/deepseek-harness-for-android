// List every overlay and button so first-run gates can be dismissed deterministically.
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
  await page.waitForTimeout(4000);
  const info = await page.evaluate(() => {
    const overlays = [...document.querySelectorAll('[role=presentation],[role=dialog]')].map((e) => ({
      role: e.getAttribute('role'),
      cls: String(e.className).slice(0, 80),
      text: e.innerText.replace(/\s+/g, ' ').slice(0, 400),
      buttons: [...e.querySelectorAll('button')].map((b) => ({
        label: b.getAttribute('aria-label'),
        text: b.innerText.replace(/\s+/g, ' ').trim(),
        cls: String(b.className).slice(0, 60),
      })),
    }));
    return {
      overlays,
      allButtons: [...document.querySelectorAll('button')]
        .filter((b) => b.getBoundingClientRect().width > 0)
        .map((b) => ({
          label: b.getAttribute('aria-label'),
          text: b.innerText.replace(/\s+/g, ' ').trim().slice(0, 30),
        })),
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await page.screenshot({ path: path.join(ROOT, 'build/shots/00-first-run.png') });
  await browser.close();
})().catch((e) => {
  console.error('GATE_FAIL', e.message);
  process.exit(1);
});
