// Remove the native command palette from the DOM instead of hiding it.
const fs = require('node:fs');
const path = require('node:path');

const f = path.join(__dirname, '..', 'mobile', 'phone-shell-ext.js');
let js = fs.readFileSync(f, 'utf8');
if (js.includes('harness-dock-purge-v1')) {
  console.log('already present');
  process.exit(0);
}

const anchor = '  /* ------------------------------------------------------------- loop --- */';
const block = `
  /* harness-dock-purge-v1: the native "添加/指令" dock is not wanted at all, so
     drop the node. React owns it, so failures fall back to hiding. */
  var dockPurgeFailed = false;
  function purgeNativeDock() {
    if (dockPurgeFailed) return;
    var dock = q('.uV2eYG_dock');
    if (!dock) return;
    try {
      if (dock.parentNode) dock.parentNode.removeChild(dock);
    } catch (e) {
      dockPurgeFailed = true;
      dock.style.setProperty('display', 'none', 'important');
    }
  }

`;
js = js.replace(anchor, block + anchor);
js = js.replace('    ensureCapsule();\n    ensureSettingsBack();', '    purgeNativeDock();\n    ensureCapsule();\n    ensureSettingsBack();');

fs.writeFileSync(f, js, 'utf8');
try {
  new Function(js);
  console.log(JSON.stringify({ purge: js.includes('purgeNativeDock'), wired: js.includes('purgeNativeDock();'), syntaxOk: true }));
} catch (e) {
  console.error('syntax error:', e.message);
  process.exit(1);
}
