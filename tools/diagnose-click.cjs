// Click the mode control with a real mouse event sequence and report caret state.
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

  const target = await c.eval(`(() => {
    const i = document.querySelector('[data-composer-input]');
    if (i) { i.focus(); }
    const seat = document.querySelector('.cubgiG_seat');
    const r = seat.getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), focused: document.activeElement === i };
  })()`);

  const click = async (x, y) => {
    await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
    await sleep(40);
    await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  };

  await click(target.x, target.y);
  await sleep(800);

  const state = (label) =>
    c.eval(`(() => {
      const i = document.querySelector('[data-composer-input]');
      const menus = [...document.querySelectorAll('[role=menu]')].filter(m => { const r = m.getBoundingClientRect(); return r.width > 8 && r.height > 8; });
      return {
        label: ${JSON.stringify(label)},
        composerFocused: document.activeElement === i,
        activeTag: document.activeElement ? document.activeElement.tagName : null,
        ranges: window.getSelection().rangeCount,
        visibleMenus: menus.length,
        expanded: (document.querySelector('.cubgiG_seat') || {}).getAttribute ? document.querySelector('.cubgiG_seat').getAttribute('aria-expanded') : null,
        compact: document.querySelector('.uV2eYG_hero').hasAttribute('data-harness-compact'),
      };
    })()`);

  console.log(JSON.stringify({ target, withMenu: await state('menu-open') }, null, 1));

  // now click a blank area far from the composer
  await click(360, 300);
  await sleep(500);
  console.log(JSON.stringify({ afterBlank: await state('blank') }, null, 1));

  c.close();
})().catch((e) => {
  console.error('MOUSE_DIAG_FAIL', e.message);
  process.exit(1);
});
