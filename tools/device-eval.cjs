// Evaluate an expression inside the running WebView and report JS errors.
const BASE = process.env.HARNESS_CDP_URL || 'http://127.0.0.1:19223';

function connect(url, onEvent) {
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
        close: () => ws.close(),
      }),
    );
    ws.addEventListener('message', (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id && pending.has(msg.id)) {
        const p = pending.get(msg.id);
        pending.delete(msg.id);
        msg.error ? p.rej(new Error(JSON.stringify(msg.error))) : p.res(msg.result);
      } else if (onEvent) onEvent(msg);
    });
    ws.addEventListener('error', reject);
  });
}

(async () => {
  const list = await (await fetch(BASE + '/json/list')).json();
  const page = list.find((t) => t.type === 'page');
  const events = [];
  const c = await connect(page.webSocketDebuggerUrl, (m) => {
    if (m.method === 'Runtime.exceptionThrown') {
      events.push('EXC ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).slice(0, 400));
    }
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
      events.push('CONSOLE ' + m.params.args.map((a) => a.value ?? a.description).join(' ').slice(0, 300));
    }
  });
  await c.send('Runtime.enable');
  await c.send('Log.enable');
  const expr = process.argv[2] || `({ mobile: typeof window.HarnessMobile, bridge: typeof window.HarnessAndroidExport, actions: !!document.getElementById('harness-mobile-actions'), readySentHint: !!document.getElementById('harness-mobile-tools') })`;
  const r = await c.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  console.log('RESULT', JSON.stringify(r.result?.value ?? r.exceptionDetails, null, 1));
  await new Promise((res) => setTimeout(res, 800));
  console.log('EVENTS', JSON.stringify(events, null, 1));
  c.close();
})().catch((e) => {
  console.error('EVAL_FAIL', e.message);
  process.exit(1);
});
