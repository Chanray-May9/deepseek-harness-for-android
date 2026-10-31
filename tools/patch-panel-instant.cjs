// Hide the home chrome in the same tick as the panel toggle instead of waiting
// for the observer's next frame.
const fs = require('node:fs');
const path = require('node:path');

const f = path.join(__dirname, '..', 'mobile', 'phone-shell-ext.js');
let js = fs.readFileSync(f, 'utf8');

js = js.replace(
  `  function togglePanel() {
    var open = panelOpen();
    /* The expand control is mounted at 0x0 while collapsed; the toggle is always
       mounted and reacts on click, so it is the reliable handle here. */
    var btn = q('button[data-sidebar-right-toggle]') || q('button[data-sidebar-right-expand]');
    if (btn) { btn.click(); return !open; }
    return false;
  }`,
  `  function syncPanelChrome(open) {
    /* Same-tick class flip: :has() and MutationObserver both land one frame late,
       which is why the drawer button and capsule were visible for a moment. */
    if (open) {
      document.body.classList.add('hm-panel-open');
    } else {
      document.body.classList.remove('hm-panel-open');
    }
  }
  function togglePanel() {
    var open = panelOpen();
    syncPanelChrome(!open);
    /* The expand control is mounted at 0x0 while collapsed; the toggle is always
       mounted and reacts on click, so it is the reliable handle here. */
    var btn = q('button[data-sidebar-right-toggle]') || q('button[data-sidebar-right-expand]');
    if (btn) { btn.click(); return !open; }
    syncPanelChrome(open);
    return false;
  }`,
);

js = js.replace(
  `    ensureCapsule();
    ensureSettingsBack();`,
  `    syncPanelChrome(panelOpen());
    ensureCapsule();
    ensureSettingsBack();`,
);

fs.writeFileSync(f, js, 'utf8');
try {
  new Function(js);
  console.log(JSON.stringify({ sync: js.includes('syncPanelChrome'), wired: js.includes('syncPanelChrome(panelOpen())'), syntaxOk: true }));
} catch (e) {
  console.error('syntax error:', e.message);
  process.exit(1);
}
