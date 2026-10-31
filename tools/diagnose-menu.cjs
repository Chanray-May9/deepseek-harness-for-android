// Diagnose the mode menu: what appears on a real touch, and where focus goes.
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

  const setup = await c.eval(`(() => {
    const seat = document.querySelector('.cubgiG_seat');
    const input = document.querySelector('[data-composer-input]');
    if (!seat) return { error: 'no .cubgiG_seat' };
    const r = seat.getBoundingClientRect();
    window.__hmLog = [];
    window.__hmObs = new MutationObserver((muts) => {
      for (const m of muts) {
        for (const n of m.addedNodes) {
          if (n.nodeType !== 1) continue;
          const b = n.getBoundingClientRect();
          if (b.width < 40 || b.height < 20) continue;
          window.__hmLog.push({
            cls: String(n.className).slice(0, 48),
            role: n.getAttribute('role'),
            rect: [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)],
            text: (n.innerText || '').replace(/\\s+/g, ' ').slice(0, 30),
          });
        }
      }
    });
    window.__hmObs.observe(document.body, { childList: true, subtree: true });
    if (input) { input.focus(); }
    return {
      seatRect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
      focusedBefore: document.activeElement === input,
      seatTag: seat.tagName,
      seatRole: seat.getAttribute('role'),
      seatHtml: seat.outerHTML.slice(0, 220),
    };
  })()`);
  console.log('SETUP', JSON.stringify(setup, null, 1));

  const [x, y, w, h] = setup.seatRect;
  const cx = x + Math.round(w / 2);
  const cy = y + Math.round(h / 2);
  await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx, y: cy }] });
  await sleep(60);
  await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await sleep(900);

  const after = await c.eval(`(() => {
    const input = document.querySelector('[data-composer-input]');
    const active = document.activeElement;
    const base = window.__hmLog || [];
    if (window.__hmObs) window.__hmObs.disconnect();
    const popovers = [...document.querySelectorAll('body > *')]
      .filter((el) => el.id !== 'harness-attach-sheet' && el.id !== 'harness-mobile-actions' && el.id !== 'harness-drawer-backdrop')
      .map((el) => {
        const b = el.getBoundingClientRect();
        return { cls: String(el.className || el.id).slice(0, 40), rect: [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)] };
      })
      .filter((p) => p.rect[2] > 50 && p.rect[3] > 30);
    return {
      focusedAfter: active === input,
      activeTag: active ? active.tagName : null,
      activeIsBody: active === document.body,
      added: base.slice(0, 6),
      bodyPopovers: popovers.slice(0, 6),
    };
  })()`);
  console.log('AFTER', JSON.stringify(after, null, 1));
  c.close();
})().catch((e) => {
  console.error('DIAG_FAIL', e.message);
  process.exit(1);
});
