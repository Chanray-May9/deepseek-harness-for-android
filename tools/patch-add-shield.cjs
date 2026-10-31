// Cover the "+" with a transparent hotspot so the shipped palette never opens.
const fs = require('node:fs');
const path = require('node:path');

const f = path.join(__dirname, '..', 'mobile', 'phone-shell-ext.js');
let js = fs.readFileSync(f, 'utf8');
if (js.includes('harness-add-shield-v1')) {
  console.log('already present');
  process.exit(0);
}

const anchor = '  /* ------------------------------------------------------------- loop --- */';
const block = `
  /* harness-add-shield-v1: the shipped "+" opens its own palette on a gesture we
     cannot reliably cancel. Put our own transparent layer on top of it, so the
     original handler receives nothing at all. */
  function ensureAddShield() {
    var add = q('.uV2eYG_add');
    var shield = q('#hm-add-shield');
    if (!add) {
      if (shield) shield.remove();
      return;
    }
    if (!shield) {
      shield = document.createElement('div');
      shield.id = 'hm-add-shield';
      shield.style.cssText = 'position:fixed;z-index:255;background:transparent;border-radius:50%;';
      shield.addEventListener('pointerdown', function (event) {
        event.preventDefault();
        event.stopPropagation();
        if (sheetOpen()) {
          closeSheet();
          sheetClosedAt = Date.now();
        } else {
          openSheet();
        }
      }, true);
      shield.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
      }, true);
      document.body.appendChild(shield);
    }
    var r = add.getBoundingClientRect();
    shield.style.left = r.left + 'px';
    shield.style.top = r.top + 'px';
    shield.style.width = r.width + 'px';
    shield.style.height = r.height + 'px';
    shield.style.display = r.width > 0 && r.height > 0 ? 'block' : 'none';
  }

`;
js = js.replace(anchor, block + anchor);
js = js.replace('    purgeNativeDock();\n    ensureCapsule();', '    purgeNativeDock();\n    ensureAddShield();\n    ensureCapsule();');

fs.writeFileSync(f, js, 'utf8');
try {
  new Function(js);
  console.log(JSON.stringify({ shield: js.includes('ensureAddShield'), wired: js.includes('ensureAddShield();'), syntaxOk: true }));
} catch (e) {
  console.error('syntax error:', e.message);
  process.exit(1);
}
