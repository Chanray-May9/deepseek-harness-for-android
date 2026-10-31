// Assert every reported defect against the live app and save a screenshot per state.
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
  const page = list.find((t) => t.type === 'page');
  const c = await connect(page.webSocketDebuggerUrl);
  fs.mkdirSync(OUT, { recursive: true });
  const results = [];
  const shot = (n) => {
    const b = execFileSync(ADB, ['-s', DEV, 'exec-out', 'screencap', '-p'], { maxBuffer: 64 * 1024 * 1024 });
    fs.writeFileSync(path.join(OUT, n + '.png'), b);
  };
  const check = (name, ok, detail) => {
    results.push({ name, ok: !!ok, detail });
    console.log((ok ? 'PASS ' : 'FAIL ') + name + ' ' + JSON.stringify(detail));
  };
  const state = () =>
    c.eval(`(() => {
      const f = document.querySelector('.pI_x6G_frame');
      const rect = (s) => { const el = document.querySelector(s); if (!el) return null; const r = el.getBoundingClientRect(); return r.width > 1 && r.height > 1 ? [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] : null; };
      const sheet = document.getElementById('harness-attach-sheet');
      return {
        panelOpen: f ? f.hasAttribute('data-rightbar-fullscreen') : null,
        drawerOpen: f ? !f.hasAttribute('data-sidebar-collapsed') : null,
        closeBtn: rect('#harness-mobile-tools-close'),
        actions: rect('#harness-mobile-actions'),
        attachSheet: sheet ? !sheet.hidden : false,
        attachItems: sheet ? [...sheet.querySelectorAll('button')].map((b) => b.textContent.trim()) : [],
        menuCount: document.querySelectorAll('[role=menu]').length,
        dialog: !!rect('[role=dialog]'),
        card: rect('.uV2eYG_card'),
        addBtn: rect('.uV2eYG_add'),
      };
    })()`);

  // 0. clean home
  const pre = await state();
  if (pre.panelOpen) {
    await c.eval(`(() => { const b = document.getElementById('harness-mobile-tools-close') || document.querySelector('button[data-sidebar-right-toggle]'); if (b) b.click(); return true; })()`);
    await sleep(900);
  }
  if (pre.drawerOpen) {
    await c.eval(`document.getElementById('harness-drawer-backdrop')?.click()`);
    await sleep(600);
  }
  await c.eval(`(() => { const s = document.getElementById('harness-attach-sheet'); if (s) s.hidden = true; return true; })()`);
  await sleep(400);
  shot('a0-home');
  const home = await state();
  check('home has no modal and shows composer', !home.dialog && !home.panelOpen, { dialog: home.dialog, panel: home.panelOpen });

  // 1. attachment sheet replaces the command palette (real touch sequence: pointerdown then click)
  await c.eval(`(() => {
    const el = document.querySelector('.uV2eYG_add');
    const r = el.getBoundingClientRect();
    const opts = { bubbles: true, cancelable: true, pointerType: 'touch', clientX: r.x + r.width / 2, clientY: r.y + r.height / 2 };
    el.dispatchEvent(new PointerEvent('pointerdown', opts));
    el.dispatchEvent(new PointerEvent('pointerup', opts));
    el.click();
    return true;
  })()`);
  await sleep(600);
  const sheet = await state();
  shot('a1-attach-sheet');
  const wanted = ['相机', '照片', '文件'];
  check('plus opens camera/photos/files sheet', sheet.attachSheet && wanted.every((w) => sheet.attachItems.some((t) => t.includes(w))), { items: sheet.attachItems });
  await c.eval(`(() => { const s = document.getElementById('harness-attach-sheet'); if (s) s.hidden = true; return true; })()`);
  await sleep(400);

  // 2. right panel opens, exposes a close control, and closes with it
  await c.eval(`document.getElementById('harness-mobile-tools').click()`);
  await sleep(900);
  const opened = await state();
  shot('a2-right-panel');
  check('right panel opens with a reachable close button', opened.panelOpen && !!opened.closeBtn, { panel: opened.panelOpen, close: opened.closeBtn });
  await c.eval(`(() => { const b = document.getElementById('harness-mobile-tools-close'); if (b) b.click(); return true; })()`);
  await sleep(900);
  const closed = await state();
  shot('a3-right-panel-closed');
  check('close button collapses the panel', !closed.panelOpen && !closed.closeBtn, { panel: closed.panelOpen, close: closed.closeBtn });

  // 3. drawer
  await c.eval(`document.querySelector('.hHd-Xa_toggle').click()`);
  await sleep(800);
  const drawer = await state();
  shot('a4-drawer');
  check('drawer opens and hides the capsule', drawer.drawerOpen && !drawer.actions, { drawer: drawer.drawerOpen, capsule: drawer.actions });
  await c.eval(`document.getElementById('harness-drawer-backdrop')?.click()`);
  await sleep(600);

  fs.writeFileSync(path.join(OUT, 'verify.json'), JSON.stringify(results, null, 1));
  const failed = results.filter((r) => !r.ok);
  console.log('SUMMARY', JSON.stringify({ total: results.length, failed: failed.length }));
  c.close();
})().catch((e) => {
  console.error('VERIFY_FAIL', e.message);
  process.exit(1);
});
