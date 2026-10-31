// Take a screenshot and its geometry in the same instant, so layout claims are checked
// against the same frame the screenshot shows.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const BASE = process.env.HARNESS_CDP_URL;
const ADB = process.env.HARNESS_ADB || 'D:/Program Files/Netease/MuMu/nx_main/adb.exe';
const DEV = process.env.HARNESS_DEVICE || '127.0.0.1:16416';
const OUT = path.resolve(__dirname, '..', 'build', 'device');
const name = process.argv[2] || 'snapshot';

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
            setTimeout(() => { if (pending.has(mid)) { pending.delete(mid); rej(new Error('timeout ' + method)); } }, 15000);
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

(async () => {
  const list = await (await fetch(BASE + '/json/list')).json();
  const page = list.find((t) => t.type === 'page');
  const c = await connect(page.webSocketDebuggerUrl);

  // close anything modal so the measurement is of the home state
  await c.eval(`(() => {
    document.querySelectorAll('[role=menu]').length;
    const close = document.querySelector('[role=dialog] button[aria-label="关闭"]');
    if (close) close.click();
    const sheet = document.getElementById('harness-attach-sheet');
    if (sheet) sheet.hidden = true;
    document.body.click();
    return true;
  })()`);
  await new Promise((r) => setTimeout(r, 700));

  const geo = await c.eval(`(() => {
    const vh = innerHeight, vw = innerWidth;
    const pct = (v) => Math.round((v / vh) * 1000) / 10;
    const box = (sel) => { const el = document.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); return { y: Math.round(r.y), h: Math.round(r.height), yPct: pct(r.y), bottomPct: pct(r.y + r.height) }; };
    const fish = document.querySelector('.pXSMma_fish, .pXSMma_root svg');
    const fr = fish && fish.getBoundingClientRect();
    return {
      viewport: [vw, vh],
      fish: fr ? { y: Math.round(fr.y), h: Math.round(fr.height), yPct: pct(fr.y) } : null,
      headline: box('.pXSMma_headline'),
      headlineRoot: box('.pXSMma_root'),
      workspaceRow: box('.wSkVaW_heroWorkspaceRow'),
      card: box('.uV2eYG_card'),
      seat: box('.wSkVaW_composerSeat'),
      hero: box('.wSkVaW_composerHero'),
      insetTop: getComputedStyle(document.documentElement).getPropertyValue('--hm-inset-top'),
      insetBottom: getComputedStyle(document.documentElement).getPropertyValue('--hm-inset-bottom'),
    };
  })()`);

  const buf = execFileSync(ADB, ['-s', DEV, 'exec-out', 'screencap', '-p'], { maxBuffer: 64 * 1024 * 1024 });
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, name + '.png'), buf);
  console.log(JSON.stringify(geo, null, 1));
  c.close();
})().catch((e) => {
  console.error('SNAP_FAIL', e.message);
  process.exit(1);
});
