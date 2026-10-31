// Open the attachment sheet and measure its box precisely.
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const BASE = process.env.HARNESS_CDP_URL;

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
            setTimeout(() => { if (pending.has(mid)) { pending.delete(mid); rej(new Error('timeout')); } }, 15000);
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
  const c = await connect(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await c.eval(`(() => {
    const el = document.querySelector('.uV2eYG_add');
    const o = { bubbles: true, cancelable: true, pointerType: 'touch' };
    el.dispatchEvent(new PointerEvent('pointerdown', o));
    el.dispatchEvent(new PointerEvent('pointerup', o));
    el.click();
    return true;
  })()`);
  await new Promise((r) => setTimeout(r, 700));
  const geo = await c.eval(`(() => {
    const r = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)]; };
    const sheet = document.getElementById('harness-attach-sheet');
    const box = sheet && sheet.querySelector('.hm-sheet');
    const cs = box ? getComputedStyle(box) : null;
    return {
      vh: innerHeight,
      sheet: r(sheet),
      box: r(box),
      buttons: box ? [...box.querySelectorAll('button')].map((b) => ({ rect: r(b), minH: getComputedStyle(b).minHeight, font: getComputedStyle(b).fontSize })) : [],
      boxStyle: cs ? { pad: cs.padding, gap: cs.gap, margin: cs.margin, flex: cs.flex, maxHeight: cs.maxHeight } : null,
      card: r(document.querySelector('.uV2eYG_card')),
    };
  })()`);
  const buf = execFileSync(process.env.HARNESS_ADB || 'D:/Program Files/Netease/MuMu/nx_main/adb.exe', ['-s', process.env.HARNESS_DEVICE || '127.0.0.1:16416', 'exec-out', 'screencap', '-p'], { maxBuffer: 64 * 1024 * 1024 });
  require('node:fs').writeFileSync(path.join(__dirname, '..', 'build', 'device', process.argv[2] || 'sheet') + '.png', buf);
  console.log(JSON.stringify(geo, null, 1));
  c.close();
})().catch((e) => {
  console.error('FAIL', e.message);
  process.exit(1);
});

