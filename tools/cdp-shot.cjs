// Screenshot straight from the renderer (CDP Page.captureScreenshot) so the image
// always matches the DOM state measured in the same pass.
const fs = require('node:fs');
const path = require('node:path');

const BASE = process.env.HARNESS_CDP_URL;
const OUT = path.resolve(__dirname, '..', 'build', 'device');
const name = process.argv[2] || 'cdp-shot';

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
            setTimeout(() => { if (pending.has(mid)) { pending.delete(mid); rej(new Error('timeout ' + method)); } }, 30000);
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
  await c.send('Page.enable');

  // dismiss anything modal so the shot is the home state
  await c.eval(`(() => {
    const sheet = document.getElementById('harness-attach-sheet');
    if (sheet) sheet.hidden = true;
    const close = document.querySelector('[role=dialog] button[aria-label="关闭"]');
    if (close) close.click();
    return true;
  })()`);
  await new Promise((r) => setTimeout(r, 600));

  const geo = await c.eval(`(() => {
    const b = (s) => { const el = document.querySelector(s); if (!el) return null; const r = el.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; };
    return {
      vw: innerWidth, vh: innerHeight, dpr: devicePixelRatio,
      style: document.documentElement.getAttribute('data-harness-composer-style'),
      card: b('.uV2eYG_card'),
      row: b('.uV2eYG_row'),
      placeholder: (document.querySelector('.uV2eYG_placeholder') || {}).textContent || null,
    };
  })()`);

  const shot = await c.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.mkdirSync(OUT, { recursive: true });
  const file = path.join(OUT, name + '.png');
  fs.writeFileSync(file, Buffer.from(shot.data, 'base64'));
  console.log(JSON.stringify({ ...geo, file: path.basename(file), bytes: fs.statSync(file).size }, null, 1));
  c.close();
})().catch((e) => {
  console.error('CDP_SHOT_FAIL', e.message);
  process.exit(1);
});
