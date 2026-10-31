// Drive the in-app WebView: dismiss first-run dialog, expose layout metrics.
const path = require('node:path');

const BASE = process.env.HARNESS_CDP_URL || 'http://127.0.0.1:19223';

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
  const list = await (await fetch(BASE + '/json/list')).json();
  const page = list.find((t) => t.type === 'page');
  const c = await connect(page.webSocketDebuggerUrl);

  const dismissed = await c.eval(`(() => {
    const btns = [...document.querySelectorAll('button')];
    const target = btns.find(b => /^继续$/.test((b.innerText || '').trim()));
    if (target) { target.click(); return 'clicked'; }
    const close = document.querySelector('[role=dialog] button[aria-label="关闭"]');
    if (close) { close.click(); return 'closed'; }
    return 'none';
  })()`);
  console.log('dismiss:', dismissed);
  await new Promise((r) => setTimeout(r, 1200));

  const metrics = await c.eval(`(() => {
    const box = (sel) => { const el = document.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; };
    const cs = (sel, prop) => { const el = document.querySelector(sel); return el ? getComputedStyle(el)[prop] : null; };
    return {
      viewport: [innerWidth, innerHeight, devicePixelRatio],
      frame: box('.pI_x6G_frame'),
      sidebar: box('.pI_x6G_sidebarCol'),
      rightbar: box('.pI_x6G_rightbarCol'),
      toggle: box('.hHd-Xa_toggle'),
      actions: box('#harness-mobile-actions'),
      headline: box('.pXSMma_headline'),
      workspace: box('.pXSMma_workspace'),
      mode: box('.cubgiG_seat'),
      card: box('.uV2eYG_card'),
      addBtn: box('.uV2eYG_add'),
      sendBtn: box('.uV2eYG_primary'),
      modelTrigger: box('._9r0rkG_trigger'),
      permTrigger: box('._86kJGG_trigger'),
      inputFont: cs('[data-composer-input]', 'fontSize'),
      headlineFont: cs('.pXSMma_headline', 'fontSize'),
      workspaceFont: cs('.pXSMma_workspace', 'fontSize'),
      placeholder: (document.querySelector('[data-composer-placeholder]') || {}).textContent || null,
      overflowX: document.documentElement.scrollWidth,
      bodyTail: document.body.innerText.replace(/\\s+/g, ' ').slice(-160),
    };
  })()`);
  console.log(JSON.stringify(metrics, null, 2));
  c.close();
})().catch((e) => {
  console.error('DRIVE_FAIL', e.message);
  process.exit(1);
});
