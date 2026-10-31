// Panel chrome visibility must follow the panel's real geometry, not the
// data-rightbar-fullscreen attribute (which lands late on the phone).
const fs = require('node:fs');
const path = require('node:path');

const f = path.join(__dirname, '..', 'mobile', 'phone-shell-ext.js');
let js = fs.readFileSync(f, 'utf8');

// 1. drop the per-frame correction that was fighting the click handler
js = js.replace(`    syncPanelChrome(panelOpen());
    ensureCapsule();`, `    syncPanelChrome(panelVisible());
    ensureCapsule();`);

// 2. add the geometry probe next to syncPanelChrome
js = js.replace(
  `  function syncPanelChrome(open) {`,
  `  function panelVisible() {
    if (panelOpen()) return true;
    var col = q('.pI_x6G_rightbarCol') || q('.P3OORG_panel');
    if (!col) return false;
    return col.getBoundingClientRect().width > 40;
  }
  function syncPanelChrome(open) {`,
);

// 3. correct with the same probe, later, so the animation cannot mislead it
js = js.replace(
  `    document.body.classList.toggle('hm-panel-open');
    setTimeout(function () { syncPanelChrome(panelOpen()); }, 120);`,
  `    document.body.classList.toggle('hm-panel-open');
    setTimeout(function () { syncPanelChrome(panelVisible()); }, 500);`,
);

// 4. keep it in sync when the panel opens or closes from anywhere else
if (!js.includes('harness-panel-geometry-v1')) {
  js = js.replace(
    `  function start() {
    pass();`,
    `  /* harness-panel-geometry-v1: watch the right column's size directly. */
  function watchPanelGeometry() {
    var col = q('.pI_x6G_rightbarCol') || q('.P3OORG_panel');
    if (!col || col.__hmWatched === true) return;
    col.__hmWatched = true;
    if (typeof ResizeObserver === 'undefined') return;
    new ResizeObserver(function () {
      syncPanelChrome(panelVisible());
    }).observe(col);
  }
  function start() {
    pass();
    watchPanelGeometry();`,
  );
}

fs.writeFileSync(f, js, 'utf8');
try {
  new Function(js);
  console.log(
    JSON.stringify({
      geometryProbe: js.includes('function panelVisible()'),
      resizeWatch: js.includes('watchPanelGeometry'),
      noPerFramePanelOpen: !js.includes('syncPanelChrome(panelOpen())'),
      syntaxOk: true,
    }),
  );
} catch (e) {
  console.error('syntax error:', e.message);
  process.exit(1);
}
