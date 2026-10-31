// Reproduce the workspace picker flow and create the first-use default workspace.
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
  const reqs = [];
  page.on('request', (r) => {
    if (r.url().includes('/api/')) reqs.push(r.method() + ' ' + r.url().split('?')[0]);
  });
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  for (let i = 0; i < 4; i++) {
    const closeBtn = page.locator('[role=dialog] button[aria-label="关闭"], [role=dialog] button[aria-label="Close"]');
    if (!(await closeBtn.count())) break;
    await closeBtn.first().click().catch(() => {});
    await page.waitForTimeout(400);
  }
  await page.waitForTimeout(500);

  const trigger = page.locator('button[aria-label="选择工作区"], button[aria-label="Choose workspace"]');
  console.log('trigger count', await trigger.count());
  if (await trigger.count()) {
    await trigger.first().click();
    await page.waitForTimeout(900);
  }
  const picker = await page.evaluate(() => {
    const dlg = [...document.querySelectorAll('[role=dialog],[role=menu],[role=listbox]')].map((d) => ({
      role: d.getAttribute('role'),
      cls: String(d.className).slice(0, 90),
      text: d.innerText.slice(0, 800),
      buttons: [...d.querySelectorAll('button')].map((b) => ({
        label: b.getAttribute('aria-label'),
        text: b.innerText.replace(/\s+/g, ' ').trim(),
      })),
    }));
    return { dialogs: dlg, body: document.body.innerText.slice(0, 900) };
  });
  console.log(JSON.stringify(picker, null, 2));
  await page.screenshot({ path: path.join(ROOT, 'build/shots/03-workspace-picker.png') });

  // Try the first-use default workspace action when the picker offers it.
  for (const label of ['默认工作区', 'Default workspace', '新建工作区', '添加工作区']) {
    const b = page.getByRole('button', { name: label, exact: true });
    if (await b.count()) {
      console.log('clicking', label);
      await b.first().click().catch(() => {});
      await page.waitForTimeout(2500);
      break;
    }
  }
  const after = await page.evaluate(() => ({
    body: document.body.innerText.slice(0, 600),
    workspace: document.querySelector('.WOwLGG_workspace')?.innerText,
    placeholder: document.querySelector('.GRgSLq_placeholder')?.textContent,
    cardCls: document.querySelector('.GRgSLq_card')?.className,
  }));
  console.log('AFTER', JSON.stringify(after, null, 2));
  console.log('API', [...new Set(reqs)].join('\n'));
  await page.screenshot({ path: path.join(ROOT, 'build/shots/04-after-workspace.png') });
  await ctx.storageState({ path: path.join(ROOT, 'build/state.json') });
  await browser.close();
})().catch((e) => {
  console.error('WS_FAIL', e.message);
  process.exit(1);
});
