// Trace ancestor chains for key UI strings and dump the hero/composer subtree.
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

  const res = await page.evaluate(() => {
    const chain = (el) => {
      const out = [];
      for (let e = el; e && e !== document.body; e = e.parentElement) {
        const r = e.getBoundingClientRect();
        const cs = getComputedStyle(e);
        out.unshift({
          tag: e.tagName.toLowerCase(),
          cls: String(e.className || '').slice(0, 120),
          rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
          disp: cs.display,
          pos: cs.position,
          gap: cs.gap,
          pad: cs.padding,
          font: cs.fontSize,
          attrs: [...e.attributes].map((a) => a.name + '=' + a.value.slice(0, 40)),
        });
      }
      return out;
    };
    const find = (text) =>
      [...document.querySelectorAll('*')].find(
        (e) => e.children.length === 0 && (e.textContent || '').trim() === text,
      );

    const subjects = {};
    for (const t of ['探索未至之境', '预览版', '默认工作区', '标准模式', '请选择模型']) {
      const el = find(t);
      subjects[t] = el ? { chain: chain(el), html: el.parentElement?.outerHTML.slice(0, 1200) } : null;
    }
    const scroll = document.querySelector('.an3WzG_scrollBody');
    return {
      subjects,
      scrollHTML: scroll ? scroll.innerHTML.replace(/<svg[\s\S]*?<\/svg>/g, '[svg]').slice(0, 9000) : null,
    };
  });

  fs.writeFileSync(path.join(ROOT, 'build/hero-trace.json'), JSON.stringify(res, null, 1));
  for (const [k, v] of Object.entries(res.subjects)) {
    console.log('=== ' + k);
    if (!v) { console.log('  missing'); continue; }
    for (const c of v.chain) console.log(`  ${c.tag}.${c.cls.replace(/\s+/g, ',')} [${c.rect.join(',')}] ${c.disp}/${c.pos} gap=${c.gap} pad=${c.pad} font=${c.font}`);
  }
  console.log('\n=== SCROLL HTML ===\n' + (res.scrollHTML || ''));
  await browser.close();
})().catch((e) => {
  console.error('TRACE_FAIL', e.message);
  process.exit(1);
});
