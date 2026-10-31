// Focus the composer and verify the real input path: caret, text entry, keyboard insets.
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
            setTimeout(() => { if (pending.has(mid)) { pending.delete(mid); rej(new Error('timeout ' + method)); } }, 15000);
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
  const page = list.find((t) => t.type === 'page');
  const c = await connect(page.webSocketDebuggerUrl);
  fs.mkdirSync(OUT, { recursive: true });
  const shot = (n) => {
    const b = execFileSync(ADB, ['-s', DEV, 'exec-out', 'screencap', '-p'], { maxBuffer: 64 * 1024 * 1024 });
    fs.writeFileSync(path.join(OUT, n + '.png'), b);
  };

  const before = await c.eval(`(() => {
    const input = document.querySelector('[data-composer-input]');
    const r = input ? input.getBoundingClientRect() : null;
    return {
      found: !!input,
      rect: r ? [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] : null,
      contentEditable: input ? input.getAttribute('contenteditable') : null,
      tag: input ? input.tagName : null,
      placeholder: document.querySelector('[data-composer-placeholder]')?.textContent,
      active: document.activeElement ? document.activeElement.tagName + '.' + String(document.activeElement.className).slice(0, 30) : null,
      vh: innerHeight,
    };
  })()`);
  console.log('BEFORE', JSON.stringify(before, null, 1));

  const tapped = await c.eval(`(() => {
    const input = document.querySelector('[data-composer-input]');
    if (!input) return 'missing';
    input.focus();
    const r = input.getBoundingClientRect();
    input.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: r.x + 10, clientY: r.y + 10 }));
    input.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: r.x + 10, clientY: r.y + 10 }));
    input.click();
    return document.activeElement === input ? 'focused' : 'not-focused:' + document.activeElement.tagName;
  })()`);
  console.log('TAP', tapped);
  await sleep(900);
  shot('81-input-focused');

  const ime = execFileSync(ADB, ['-s', DEV, 'shell', 'dumpsys', 'input_method'], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  const imeLines = ime.split('\n').filter((l) => /mInputShown|mShowRequested|mIsInputViewShown|mServedView|mCurFocusedWindow/.test(l)).slice(0, 6);
  console.log('IME', JSON.stringify(imeLines, null, 1));

  // type through CDP
  await c.send('Input.insertText', { text: '输入测试' });
  await sleep(400);
  const after = await c.eval(`(() => {
    const input = document.querySelector('[data-composer-input]');
    return {
      text: input ? input.innerText : null,
      vh: innerHeight,
      card: (() => { const el = document.querySelector('.uV2eYG_card'); const r = el && el.getBoundingClientRect(); return r ? [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] : null; })(),
      addBtn: (() => { const el = document.querySelector('.uV2eYG_add'); const r = el && el.getBoundingClientRect(); return r ? [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] : null; })(),
      sendBtn: (() => { const el = document.querySelector('.uV2eYG_primary'); const r = el && el.getBoundingClientRect(); return r ? [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] : null; })(),
    };
  })()`);
  console.log('AFTER_TYPING', JSON.stringify(after, null, 1));
  shot('82-input-typed');
  c.close();
})().catch((e) => {
  console.error('INPUT_FAIL', e.message);
  process.exit(1);
});
