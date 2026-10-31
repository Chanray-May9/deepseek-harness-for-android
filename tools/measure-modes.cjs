// Measure the composer card bottom in both modes, so the two can be aligned.
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

const probe = `(() => {
  const b = (s) => { const el = document.querySelector(s); if (!el) return null; const r = el.getBoundingClientRect(); return { y: Math.round(r.y), h: Math.round(r.height), bottom: Math.round(r.y + r.height) }; };
  return {
    mode: document.documentElement.getAttribute('data-harness-composer-style'),
    vh: innerHeight,
    seat: b('.wSkVaW_composerSeat'),
    hero: b('.wSkVaW_composerHero'),
    card: b('.uV2eYG_card'),
    row: b('.uV2eYG_row'),
    gapToBottom: (() => { const el = document.querySelector('.uV2eYG_card'); if (!el) return null; const r = el.getBoundingClientRect(); return Math.round(innerHeight - (r.y + r.height)); })(),
  };
})()`;

(async () => {
  const list = await (await fetch(BASE + '/json/list')).json();
  const c = await connect(list.find((t) => t.type === 'page').webSocketDebuggerUrl);

  const setMode = async (mode) => {
    await c.eval(`(() => {
      localStorage.setItem('harness.android.composerStyle', ${JSON.stringify(mode)});
      document.documentElement.setAttribute('data-harness-composer-style', ${JSON.stringify(mode)});
      document.dispatchEvent(new Event('harness-mode-change'));
      window.dispatchEvent(new Event('resize'));
      return true;
    })()`);
    await new Promise((r) => setTimeout(r, 900));
  };

  await setMode('card');
  const card = await c.eval(probe);
  await setMode('single');
  const single = await c.eval(probe);
  await setMode('card');

  console.log(JSON.stringify({ card, single, deltaBottom: (card.card?.bottom ?? 0) - (single.card?.bottom ?? 0) }, null, 1));
  c.close();
})().catch((e) => {
  console.error('MEASURE_FAIL', e.message);
  process.exit(1);
});
