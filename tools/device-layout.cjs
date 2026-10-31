// Settings density check plus multi-viewport layout check.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const BASE = process.env.HARNESS_CDP_URL;
const ADB = process.env.HARNESS_ADB || 'D:/Program Files/Netease/MuMu/nx_main/adb.exe';
const DEV = process.env.HARNESS_DEVICE || '127.0.0.1:16416';
const OUT = path.resolve(__dirname, '..', 'build', 'device');

function connect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const pending = new Map();
    let id = 0;
    ws.addEventListener('open', () =>
      resolve({
        send(method, params = {}) {
          return new Promise((res, rej) => {
            const mid = ++id;
            pending.set(mid, { res, rej });
            ws.send(JSON.stringify({ id: mid, method, params }));
            setTimeout(() => { if (pending.has(mid)) { pending.delete(mid); rej(new Error('timeout ' + method)); } }, 20000);
          });
        },
        async eval(expression) {
          const r = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
          if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'eval failed');
          return r.result?.value;
        },
        close: () => ws.close(),
      }),
    );
    ws.addEventListener('message', (e) => {
      const m = JSON.parse(e.data);
      if (m.id && pending.has(m.id)) {
        const p = pending.get(m.id);
        pending.delete(m.id);
        m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result);
      }
    });
    ws.addEventListener('error', reject);
  });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const list = await (await fetch(BASE + '/json/list')).json();
  const c = await connect(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
  fs.mkdirSync(OUT, { recursive: true });
  const shot = (n) => {
    const b = execFileSync(ADB, ['-s', DEV, 'exec-out', 'screencap', '-p'], { maxBuffer: 64 * 1024 * 1024 });
    fs.writeFileSync(path.join(OUT, n + '.png'), b);
  };
  const report = {};

  // close any sheet first
  await c.eval(`(() => { const s = document.getElementById('harness-attach-sheet'); if (s) s.hidden = true; return true; })()`);
  await sleep(300);

  // open settings
  await c.eval(`(() => { const b = document.querySelector('button[aria-label="账号菜单"]'); if (b) b.click(); return !!b; })()`);
  await sleep(600);
  await c.eval(`(() => { const t = [...document.querySelectorAll('[role=menuitem],button,span')].find(e => (e.textContent || '').trim() === '设置'); const target = t && (t.closest('[role=menuitem],button') || t); if (target) target.click(); return !!target; })()`);
  await sleep(1200);
  shot('b1-settings');

  report.settings = await c.eval(`(() => {
    const r = (s) => { const el = document.querySelector(s); if (!el) return null; const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)]; };
    const nav = document.querySelector('.VOzbGW_navList');
    const opts = document.querySelector('.VOzbGW_options');
    const rows = opts ? [...opts.children].slice(0, 6).map((row) => { const b = row.getBoundingClientRect(); return { h: Math.round(b.height), text: (row.innerText || '').replace(/\\s+/g, ' ').slice(0, 24) }; }) : [];
    return {
      panel: r('.VOzbGW_panel'),
      nav: r('.VOzbGW_navList'),
      navScrollable: nav ? nav.scrollWidth > nav.clientWidth + 2 : null,
      tabs: nav ? [...nav.querySelectorAll('.VOzbGW_navCell')].map((t) => (t.innerText || '').trim()) : [],
      options: r('.VOzbGW_options'),
      firstRows: rows,
      overflowX: document.documentElement.scrollWidth,
      vw: innerWidth,
    };
  })()`);
  console.log('SETTINGS', JSON.stringify(report.settings, null, 1));

  // close settings
  await c.eval(`(() => { const b = document.querySelector('.VOzbGW_close'); if (b) b.click(); return true; })()`);
  await sleep(600);

  // multi-viewport checks
  for (const [name, width, height] of [
    ['b2-w360', 360, 780],
    ['b3-w600', 600, 900],
    ['b4-w480', 480, 900],
  ]) {
    try {
      await c.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 2, mobile: true });
      await sleep(500);
      const geo = await c.eval(`(() => {
        const r = (s) => { const el = document.querySelector(s); if (!el) return null; const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)]; };
        const vh = innerHeight;
        return {
          vw: innerWidth, vh,
          card: r('.uV2eYG_card'),
          cardBottomPct: (() => { const el = document.querySelector('.uV2eYG_card'); if (!el) return null; const b = el.getBoundingClientRect(); return Math.round(((b.y + b.height) / vh) * 1000) / 10; })(),
          headline: r('.pXSMma_headline'),
          toggle: r('.hHd-Xa_toggle'),
          actions: r('#harness-mobile-actions'),
          overflowX: document.documentElement.scrollWidth,
        };
      })()`);
      shot(name);
      report[name] = geo;
      console.log(name, JSON.stringify(geo));
    } catch (e) {
      console.log(name, 'unsupported:', e.message);
    }
  }
  await c.send('Emulation.clearDeviceMetricsOverride').catch(() => {});
  await sleep(400);

  fs.writeFileSync(path.join(OUT, 'layout-report.json'), JSON.stringify(report, null, 1));
  c.close();
})().catch((e) => {
  console.error('LAYOUT_FAIL', e.message);
  process.exit(1);
});
