// Inspect the real WebView inside the running APK and prove whether the page is usable.
// Read-only: it only calls the app's own ready() bridge to lift the native overlay.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(path.join(__dirname, 'node_modules/playwright-core'));

const OUT = path.resolve(__dirname, '..', 'build', 'device');
fs.mkdirSync(OUT, { recursive: true });
const CDP = process.env.HARNESS_CDP_URL || 'http://127.0.0.1:19222';

(async () => {
  const browser = await chromium.connectOverCDP(CDP);
  const pages = browser.contexts().flatMap((c) => c.pages());
  const page = pages.find((p) => p.url().includes('127.0.0.1:3080')) || pages[0];
  if (!page) throw new Error('no page');

  const info = await page.evaluate(() => ({
    title: document.title,
    url: location.href.split('?')[0],
    body: document.body.innerText.replace(/\s+/g, ' ').slice(0, 400),
    android: document.documentElement.getAttribute('data-harness-android'),
    bridge: typeof window.HarnessAndroidExport,
    hasReady: !!(window.HarnessAndroidExport && window.HarnessAndroidExport.ready),
    heroTitle: document.querySelector('.pXSMma_titleGroup > span, .WOwLGG_titleGroup > span')?.textContent || null,
    composer: !!document.querySelector('.uV2eYG_root, .GRgSLq_root'),
    workspaceLabel: (document.querySelector('button[aria-label="选择工作区"],button[aria-label="Choose workspace"]')?.innerText || '').trim(),
  }));
  console.log('PAGE', JSON.stringify(info, null, 2));

  // Ask the app to lift its own startup overlay (same call the page makes when ready).
  const lifted = await page.evaluate(() => {
    try {
      if (window.HarnessAndroidExport && window.HarnessAndroidExport.ready) {
        window.HarnessAndroidExport.ready();
        return 'called';
      }
      return 'no-bridge';
    } catch (e) {
      return 'error:' + e.message;
    }
  });
  console.log('READY_BRIDGE', lifted);
  await page.waitForTimeout(1200);
  await browser.close();
})().catch((e) => {
  console.error('CDP_FAIL', e.message);
  process.exit(1);
});
