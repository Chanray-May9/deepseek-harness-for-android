// Walk the phone UI and capture each state, so every reported defect is checked
// against a screenshot from the device rather than assumed.
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
            setTimeout(() => {
              if (pending.has(mid)) { pending.delete(mid); rej(new Error('timeout ' + method)); }
            }, 15000);
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

  const shot = (name) => {
    const buf = execFileSync(ADB, ['-s', DEV, 'exec-out', 'screencap', '-p'], { maxBuffer: 64 * 1024 * 1024 });
    fs.writeFileSync(path.join(OUT, name + '.png'), buf);
    return buf.length;
  };
  const tap = async (selector) => {
    // Synthetic mouse events do not always reach React handlers inside the WebView;
    // clicking the element directly exercises the same handler chain.
    const ok = await c.eval(`(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return false;
      el.click();
      return true;
    })()`);
    return ok;
  };
  const state = () =>
    c.eval(`(() => {
      const vis = (sel) => { const el = document.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); return r.width > 2 && r.height > 2; };
      const menu = [...document.querySelectorAll('[role=menu]')].map(m => ({
        rect: (() => { const r = m.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; })(),
        items: [...m.querySelectorAll('[role=menuitem]')].filter(i => i.getBoundingClientRect().height > 2).map(i => (i.innerText || '').replace(/\\s+/g, ' ').trim()),
      }));
      const card = document.querySelector('.uV2eYG_add');
      return {
        menu,
        addRect: card ? (() => { const r = card.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; })() : null,
        rightPanelOpen: (() => { const f = document.querySelector('.pI_x6G_frame'); return f ? !f.hasAttribute('data-rightbar-collapsed') : null; })(),
        closeVisible: vis('#harness-mobile-tools-close'),
        actionsVisible: vis('#harness-mobile-actions'),
        drawerOpen: (() => { const f = document.querySelector('.pI_x6G_frame'); return f ? !f.hasAttribute('data-sidebar-collapsed') : null; })(),
      };
    })()`);

  const steps = [];
  const record = async (name, note) => {
    await sleep(450);
    const st = await state();
    const bytes = shot(name);
    steps.push({ name, note, bytes, ...st });
    console.log(name, JSON.stringify(st));
  };

  // 1. "+" menu
  await tap('.uV2eYG_add');
  await record('61-add-menu', 'composer plus menu');
  await tap('.uV2eYG_add');
  await record('62-add-menu-toggle', 'same button pressed again');

  // 2. workspace menu must open upward
  await tap('.pXSMma_workspace');
  await record('63-workspace-menu', 'workspace picker');
  await tap('.pXSMma_workspace');
  await sleep(300);

  // 3. right panel + its close button + toggle back
  await tap('#harness-mobile-tools');
  await record('64-right-panel', 'right panel opened');
  await tap('#harness-mobile-tools');
  await record('65-right-panel-toggle', 'same tool button pressed again');

  // 4. drawer
  await tap('.hHd-Xa_toggle');
  await record('66-drawer', 'navigation drawer');
  await tap('#harness-drawer-backdrop');
  await sleep(300);

  fs.writeFileSync(path.join(OUT, 'flow.json'), JSON.stringify(steps, null, 1));
  c.close();
})().catch((e) => {
  console.error('FLOW_FAIL', e.message);
  process.exit(1);
});
