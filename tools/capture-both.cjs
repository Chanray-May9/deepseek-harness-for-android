// Capture both composer modes from the same build, with the card's bottom edge
// measured from the pixels as well as from the DOM.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const BASE = process.env.HARNESS_CDP_URL;
const ADB = process.env.HARNESS_ADB || 'D:/Program Files/Netease/MuMu/nx_main/adb.exe';
const DEV = process.env.HARNESS_DEVICE || '127.0.0.1:16416';
const OUT = path.resolve(__dirname, '..', 'build', 'device');

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

const frame = (name) => {
  const remote = '/sdcard/hm-shot.png';
  execFileSync(ADB, ['-s', DEV, 'shell', 'input', 'keyevent', 'KEYCODE_HOME'], { stdio: 'ignore' });
  execFileSync(ADB, ['-s', DEV, 'shell', 'am', 'start', '-n', 'com.deepseek.harness.rebuild/com.deepseek.harness.android.MainActivity'], { stdio: 'ignore' });
  execFileSync(ADB, ['-s', DEV, 'shell', 'screencap', '-p', remote], { stdio: 'ignore' });
  execFileSync(ADB, ['-s', DEV, 'shell', 'screencap', '-p', remote], { stdio: 'ignore' });
  const file = path.join(OUT, name + '.png');
  execFileSync(ADB, ['-s', DEV, 'pull', remote, file], { stdio: 'ignore' });
  execFileSync(ADB, ['-s', DEV, 'shell', 'rm', '-f', remote], { stdio: 'ignore' });
  return file;
};

(async () => {
  const list = await (await fetch(BASE + '/json/list')).json();
  const c = await connect(list.find((t) => t.type === 'page').webSocketDebuggerUrl);

  const probe = () =>
    c.eval(`(() => {
      const el = document.querySelector('.uV2eYG_card');
      const hero = document.querySelector('.uV2eYG_hero');
      const r = el.getBoundingClientRect();
      return {
        mode: document.documentElement.getAttribute('data-harness-composer-style'),
        compact: hero ? hero.hasAttribute('data-harness-compact') : null,
        card: { y: Math.round(r.y), h: Math.round(r.height), bottom: Math.round(r.y + r.height) },
        gap: Math.round(innerHeight - (r.y + r.height)),
        vh: innerHeight,
      };
    })()`);

  const setMode = async (mode) => {
    await c.eval(`(() => {
      const i = document.querySelector('[data-composer-input]');
      if (i) { i.focus(); document.execCommand('selectAll'); document.execCommand('delete'); i.blur(); }
      localStorage.setItem('harness.android.composerStyle', ${JSON.stringify(mode)});
      location.reload();
      return true;
    })()`);
    await sleep(9000);
  };

  await setMode('single');
  await sleep(1500);
  const single = await probe();
  const singleFile = frame('n-single');

  await setMode('card');
  await sleep(1500);
  const card = await probe();
  const cardFile = frame('n-card');

  console.log(JSON.stringify({ single, singleFile: path.basename(singleFile), card, cardFile: path.basename(cardFile), sameBottom: single.card.bottom === card.card.bottom }, null, 1));
  c.close();
})().catch((e) => {
  console.error('BOTH_FAIL', e.message);
  process.exit(1);
});
