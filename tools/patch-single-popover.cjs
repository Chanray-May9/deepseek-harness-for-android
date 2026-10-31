// Only one composer popover may be open at a time: opening one closes the others.
const fs = require('node:fs');
const path = require('node:path');

const f = path.join(__dirname, '..', 'mobile', 'phone-shell-ext.js');
let js = fs.readFileSync(f, 'utf8');
if (js.includes('harness-single-popover-v1')) {
  console.log('already present');
  process.exit(0);
}

const anchor = '  /* ------------------------------------------------------------- loop --- */';
const block = `
  /* harness-single-popover-v1: two popovers must never stack. Opening a menu
     dismisses whatever else is on screen first. */
  function closeOtherPopovers(except) {
    var nodes = document.querySelectorAll('[role=menu], [role=listbox]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el === except) continue;
      var r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) continue;
      try {
        el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      } catch (e) { /* ignore */ }
    }
    var sheet = q('#harness-attach-sheet');
    if (sheet && !sheet.hidden) {
      sheet.hidden = true;
      root.removeAttribute('data-phone-sheet');
    }
  }
  document.addEventListener('pointerdown', function (event) {
    var t = event.target;
    if (!t || !t.closest) return;
    var trigger = t.closest('.pXSMma_workspace') || t.closest('.cubgiG_seat');
    if (!trigger) return;
    closeOtherPopovers(null);
  }, true);

`;
js = js.replace(anchor, block + anchor);

fs.writeFileSync(f, js, 'utf8');
try {
  new Function(js);
  console.log(JSON.stringify({ singlePopover: js.includes('closeOtherPopovers'), syntaxOk: true }));
} catch (e) {
  console.error('syntax error:', e.message);
  process.exit(1);
}
