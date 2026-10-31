// Settings gets a back arrow at the left of the title instead of a close cross.
const fs = require('node:fs');
const path = require('node:path');

const f = path.join(__dirname, '..', 'mobile', 'phone-shell-ext.js');
let js = fs.readFileSync(f, 'utf8');
if (js.includes('harness-settings-back')) {
  console.log('already present');
  process.exit(0);
}

const block = `
  /* ---------------------------------------------------------- settings --- */
  var BACK_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 5.5 8 12l6.5 6.5"/></svg>';
  function ensureSettingsBack() {
    var panel = q('.VOzbGW_panel');
    var existing = q('#harness-settings-back');
    if (!panel) {
      if (existing) existing.remove();
      return;
    }
    if (existing) return;
    var back = document.createElement('button');
    back.id = 'harness-settings-back';
    back.type = 'button';
    back.setAttribute('aria-label', '返回');
    back.innerHTML = BACK_ICON;
    back.addEventListener('click', function () {
      var close = q('.VOzbGW_close');
      if (close) close.click();
    });
    panel.appendChild(back);
  }
`;

js = js.replace('  /* ------------------------------------------------------------- loop --- */', block + '\n  /* ------------------------------------------------------------- loop --- */');
js = js.replace('    ensureCapsule();\n    updateCompact();', '    ensureCapsule();\n    ensureSettingsBack();\n    updateCompact();');

fs.writeFileSync(f, js, 'utf8');
try {
  new Function(js);
  console.log(JSON.stringify({ added: js.includes('ensureSettingsBack'), wired: js.includes('ensureSettingsBack();'), syntaxOk: true }));
} catch (e) {
  console.error('syntax error:', e.message);
  process.exit(1);
}
