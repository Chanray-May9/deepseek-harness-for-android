// Remove the body-class mechanism entirely: it could stick and hide the chrome
// permanently. Inline styles plus a per-frame correction cannot get stuck.
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

// 1. drop the CSS that turns the class into display:none
const cssPath = path.join(ROOT, 'mobile', 'phone-shell.rc2.css');
let css = fs.readFileSync(cssPath, 'utf8');
const before = css.length;
css = css.replace(
  /\/\* Same-tick hiding of the home chrome while the right panel is open\. \*\/\nhtml\[data-harness-android\] body\.hm-panel-open #harness-mobile-actions,\nhtml\[data-harness-android\] body\.hm-panel-open \.hHd-Xa_collapsed \.hHd-Xa_toggle \{\n  display: none !important;\n\}\n/,
  '/* panel chrome is handled inline by the extension, never by a body class */\n',
);
fs.writeFileSync(cssPath, css, 'utf8');
const cssChanged = css.length !== before;

// 2. syncPanelChrome becomes a pure inline-style wrapper
const jsPath = path.join(ROOT, 'mobile', 'phone-shell-ext.js');
let js = fs.readFileSync(jsPath, 'utf8');

js = js.replace(
  `  function syncPanelChrome(open) {
    /* Same-tick class flip: :has() and MutationObserver both land one frame late,
       which is why the drawer button and capsule were visible for a moment. */
    if (open) {
      document.body.classList.add('hm-panel-open');
    } else {
      document.body.classList.remove('hm-panel-open');
    }
  }`,
  `  function syncPanelChrome(open) {
    document.body.classList.remove('hm-panel-open');
    hideHomeChrome(!!open);
  }`,
);

// 3. per-frame correction, no 400ms window
js = js.replace(
  `    if (Date.now() - panelFlipAt > 400) hideHomeChrome(panelOpen());`,
  `    hideHomeChrome(panelOpen());`,
);

fs.writeFileSync(jsPath, js, 'utf8');
try {
  new Function(js);
  console.log(JSON.stringify({ cssRuleRemoved: cssChanged, classGone: !js.includes("classList.add('hm-panel-open')"), perFrame: js.includes('    hideHomeChrome(panelOpen());'), syntaxOk: true }));
} catch (e) {
  console.error('syntax error:', e.message);
  process.exit(1);
}
