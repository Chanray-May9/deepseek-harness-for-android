// Minimal CDP client over a raw WebSocket: WebView targets reject the
// Browser-domain handshake Playwright uses, so talk to the page endpoint directly.
const path = require('node:path');

const BASE = process.env.HARNESS_CDP_URL || 'http://127.0.0.1:19223';

async function targets() {
  const res = await fetch(BASE + '/json/list');
  return res.json();
}

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
              if (pending.has(mid)) {
                pending.delete(mid);
                rej(new Error('timeout ' + method));
              }
            }, 15000);
          });
        },
        async eval(expression) {
          const r = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
          if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'eval failed');
          return r.result?.value;
        },
        close() {
          ws.close();
        },
      }),
    );
    ws.addEventListener('message', (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id && pending.has(msg.id)) {
        const p = pending.get(msg.id);
        pending.delete(msg.id);
        msg.error ? p.rej(new Error(JSON.stringify(msg.error))) : p.res(msg.result);
      }
    });
    ws.addEventListener('error', reject);
  });
}

(async () => {
  const list = await targets();
  const page = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl) || list[0];
  if (!page) throw new Error('no target');
  const c = await connect(page.webSocketDebuggerUrl);
  const info = await c.eval(`(() => ({
    url: location.href,
    title: document.title,
    ready: document.readyState,
    body: (document.body ? document.body.innerText : '').slice(0, 240),
    htmlLen: document.documentElement.outerHTML.length,
    androidAttr: document.documentElement.getAttribute('data-harness-android'),
    inlineScripts: document.scripts.length,
    external: [...document.scripts].map(s => s.src).filter(Boolean).slice(0, 4),
    cookieLen: document.cookie.length,
    hasFrame: !!document.querySelector('.pI_x6G_frame'),
    hasSidebar: !!document.querySelector('.hHd-Xa_root'),
    hasComposer: !!document.querySelector('.uV2eYG_root, .GRgSLq_root'),
    inputHeight: (() => { const el = document.querySelector('[data-composer-input]'); return el ? Math.round(el.getBoundingClientRect().height) : null; })(),
  }))()`);
  console.log(JSON.stringify(info, null, 2));
  const errors = await c.eval(`(() => {
    const out = [];
    window.addEventListener('error', e => out.push(String(e.message)));
    return { ua: navigator.userAgent.slice(0, 120), dpr: devicePixelRatio, vw: innerWidth, vh: innerHeight };
  })()`);
  console.log(JSON.stringify(errors, null, 2));
  c.close();
})().catch((e) => {
  console.error('PAGE_FAIL', e.message);
  process.exit(1);
});
