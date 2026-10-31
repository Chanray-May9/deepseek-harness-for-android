// Auto-dismiss the first-run "开始使用" gate so the phone opens straight into the
// workspace, and keep modal scrims from dimming the system-bar strips.
const fs = require('node:fs');
const path = require('node:path');

const assets = process.argv[2];
const cssPath = path.join(assets, 'android-mobile.css');
const jsPath = path.join(assets, 'android-mobile.js');

let css = fs.readFileSync(cssPath, 'utf8');
if (!css.includes('/* harness-android-gate-v1 */')) {
  css += `
/* harness-android-gate-v1 */
/* A modal scrim should dim the page, not the status/navigation strips. */
html[data-harness-android] [role=presentation] > [role=dialog],
html[data-harness-android] [role=presentation]::before {
  outline: none;
}
html[data-harness-android] .mP3x-q_overlayLayer {
  top: var(--hm-inset-top) !important;
  bottom: var(--hm-inset-bottom) !important;
  height: auto !important;
}
`;
  fs.writeFileSync(cssPath, css, 'utf8');
  console.log('gate css added');
}

let js = fs.readFileSync(jsPath, 'utf8');
if (!js.includes('/* harness-android-gate-v1 */')) {
  js = js.replace(
    ' function rightPanelOpen(){',
    ` /* harness-android-gate-v1 */
 var hmGateClosed = 0;
 function dismissStartGate(){
  if (hmGateClosed > 5) return;
  var dialogs = document.querySelectorAll('[role=dialog]');
  for (var i = 0; i < dialogs.length; i++) {
   var dialog = dialogs[i];
   var text = (dialog.innerText || '');
   if (text.indexOf('开始使用') === -1 && text.indexOf('Get started') === -1 && text.indexOf('添加 API Key') === -1) continue;
   var close = dialog.querySelector('button[aria-label="关闭"],button[aria-label="Close"]');
   if (close) { close.click(); hmGateClosed++; return; }
  }
 }
 function rightPanelOpen(){`,
  );
  js = js.replace(
    ' function changed(){',
    ` function changed(){`,
  );
  // run it from the reconcile pass
  js = js.replace('  pruneAddMenu();', '  dismissStartGate();\n  pruneAddMenu();');
  fs.writeFileSync(jsPath, js, 'utf8');
  console.log('gate js added');
}

const out = fs.readFileSync(jsPath, 'utf8');
console.log(
  JSON.stringify(
    {
      gate: out.includes('dismissStartGate'),
      wired: out.includes('dismissStartGate();'),
      syntaxOk: (() => {
        try {
          new Function(out);
          return true;
        } catch (e) {
          return e.message;
        }
      })(),
    },
    null,
    1,
  ),
);
