// Switch the composer style through the real settings UI, then measure and capture.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const BASE = process.env.HARNESS_CDP_URL;
const ADB = process.env.HARNESS_ADB || 'D:/Program Files/Netease/MuMu/nx_main/adb.exe';
const DEV = process.env.HARNESS_DEVICE || '127.0.0.1:16416';
const OUT = path.resolve(__dirname, '..', 'build', 'device');
const want = process.argv[2] || 'single';
const tag = process.argv[3] || want;

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

  const openSettings = async () => {
    await c.eval(`(() => { const b = document.querySelector('button[aria-label="账号菜单"]'); if (b) b.click(); return true; })()`);
    await sleep(600);
    await c.eval(`(() => {
      const t = [...document.querySelectorAll('[role=menuitem],button,span')].find(e => (e.textContent || '').trim() === '设置');
      const target = t && (t.closest('[role=menuitem],button') || t);
      if (target) target.click();
      return !!target;
    })()`);
    await sleep(1200);
  };
  const pick = async (label) => {
    const ok = await c.eval(`(() => {
      const btns = [...document.querySelectorAll('button')];
      const hit = btns.find(b => (b.textContent || '').trim() === ${JSON.stringify(label)});
      if (!hit) return false;
      hit.click();
      return true;
    })()`);
    await sleep(800);
    return ok;
  };
  const closeSettings = async () => {
    await c.eval(`(() => { const b = document.querySelector('.VOzbGW_close'); if (b) b.click(); return true; })()`);
    await sleep(800);
  };
  const probe = () =>
    c.eval(`(() => {
      const el = document.querySelector('.uV2eYG_card');
      const r = el ? el.getBoundingClientRect() : null;
      return {
        mode: document.documentElement.getAttribute('data-harness-composer-style'),
        compact: !!(document.querySelector('.uV2eYG_hero') || {}).hasAttribute && document.querySelector('.uV2eYG_hero').hasAttribute('data-harness-compact'),
        card: r ? { y: Math.round(r.y), h: Math.round(r.height), bottom: Math.round(r.y + r.height) } : null,
        gap: r ? Math.round(innerHeight - (r.y + r.height)) : null,
        vh: innerHeight,
      };
    })()`);

  await openSettings();
  const label = want === 'single' ? '单行输入' : '双层卡片';
  const picked = await pick(label);
  await closeSettings();
  await sleep(700);
  const geo = await probe();

  // real frame: bounce off the app so the WebView surface is rebuilt
  execFileSync(ADB, ['-s', DEV, 'shell', 'input', 'keyevent', 'KEYCODE_HOME'], { stdio: 'ignore' });
  await sleep(1800);
  execFileSync(ADB, ['-s', DEV, 'shell', 'am', 'start', '-n', 'com.deepseek.harness.rebuild/com.deepseek.harness.android.MainActivity'], { stdio: 'ignore' });
  await sleep(2600);
  const remote = '/sdcard/hm-shot.png';
  execFileSync(ADB, ['-s', DEV, 'shell', 'screencap', '-p', remote], { stdio: 'ignore' });
  execFileSync(ADB, ['-s', DEV, 'shell', 'rm', '-f', remote], { stdio: 'ignore' });
  execFileSync(ADB, ['-s', DEV, 'shell', 'screencap', '-p', remote], { stdio: 'ignore' });
  const file = path.join(OUT, 'm-' + tag + '.png');
  execFileSync(ADB, ['-s', DEV, 'pull', remote, file], { stdio: 'ignore' });
  execFileSync(ADB, ['-s', DEV, 'shell', 'rm', '-f', remote], { stdio: 'ignore' });

  console.log(JSON.stringify({ picked, ...geo, file: path.basename(file), bytes: fs.statSync(file).size }, null, 1));
  c.close();
})().catch((e) => {
  console.error('SWITCH_FAIL', e.message);
  process.exit(1);
});
