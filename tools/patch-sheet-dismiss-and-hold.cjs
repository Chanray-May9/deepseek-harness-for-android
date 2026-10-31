// 1) outside taps must also dismiss the attachment sheet
// 2) trigger taps must not let the composer flicker into compact
const fs = require('node:fs');
const path = require('node:path');

const f = path.join(__dirname, '..', 'mobile', 'phone-shell-ext.js');
let js = fs.readFileSync(f, 'utf8');

// --- 1. sheet dismissal on outside tap --------------------------------------
js = js.replace(
  `    /* 5. outside: dismiss with the exit animation, then replay the tap */
    var menus = visibleMenus();
    if (menus.length) {`,
  `    /* 5. outside: dismiss the sheet and any popover */
    if (sheetOpen() && !t.closest('#harness-attach-sheet')) {
      closeSheet();
      sheetClosedAt = Date.now();
    }
    var menus = visibleMenus();
    if (menus.length) {`,
);

// --- 2. hold the expanded layout across a trigger tap ------------------------
js = js.replace(
  `  var lastTrigger = null;`,
  `  var lastTrigger = null;
  var holdExpandedUntil = 0;`,
);

js = js.replace(
  `      var composerInput = q('[data-composer-input]');
      caretWanted = !!(composerInput && document.activeElement === composerInput);
      if (caretWanted) triggerTouchedAt = Date.now();`,
  `      var composerInput = q('[data-composer-input]');
      caretWanted = !!(composerInput && document.activeElement === composerInput);
      if (caretWanted) {
        triggerTouchedAt = Date.now();
        /* Keep the expanded card while the popover is opening: blur happens
           before focus returns, and the compact switch was the visible flash. */
        holdExpandedUntil = Date.now() + 900;
      }`,
);

js = js.replace(
  `    var want = single && !text && !focused && !hasFiles;`,
  `    var holdOpen = Date.now() < holdExpandedUntil;
    var want = single && !text && !focused && !hasFiles && !holdOpen;`,
);

fs.writeFileSync(f, js, 'utf8');
try {
  new Function(js);
  console.log(
    JSON.stringify({
      sheetDismiss: js.includes('dismiss the sheet and any popover'),
      holdExpanded: js.includes('holdExpandedUntil = Date.now() + 900'),
      compactGuard: js.includes('var holdOpen = Date.now() < holdExpandedUntil'),
      syntaxOk: true,
    }),
  );
} catch (e) {
  console.error('syntax error:', e.message);
  process.exit(1);
}
