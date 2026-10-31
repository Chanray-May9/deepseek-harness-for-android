// Open settings, then report the back arrow geometry.
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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const list = await (await fetch(BASE + '/json/list')).json();
  const c = await connect(list.find((t) => t.type === 'page').webSocketDebuggerUrl);

  const opened = await c.eval(`(() => {
    const btn = [...document.querySelectorAll('button')].find(b => (b.getAttribute('aria-label') || '').indexOf('账号') >= 0);
    if (btn) { btn.click(); return 'menu-clicked'; }
    return 'no-account-button';
  })()`);
  await sleep(800);

  const picked = await c.eval(`(() => {
    const t = [...document.querySelectorAll('[role=menuitem],button,span')].find(e => (e.textContent || '').trim() === '设置');
    const target = t && (t.closest('[role=menuitem],button') || t);
    if (target) { target.click(); return true; }
    return false;
  })()`);
  await sleep(1400);

  const geo = await c.eval(`(() => {
    const back = document.getElementById('harness-settings-back');
    const close = document.querySelector('.VOzbGW_close');
    const title = document.querySelector('.VOzbGW_navTitle');
    const box = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; };
    return {
      back: box(back),
      backLabel: back ? back.getAttribute('aria-label') : null,
      closeDisplay: close ? getComputedStyle(close).display : null,
      title: box(title),
      titleText: title ? title.textContent.trim().slice(0, 12) : null,
    };
  })()`);

  console.log(JSON.stringify({ opened, picked, ...geo }, null, 1));
  c.close();
})().catch((e) => {
  console.error('SETTINGS_FAIL', e.message);
  process.exit(1);
});

