// Second tap on a composer trigger closes one menu and opens another; the
// focusout lands inside that gap, so a recent-trigger timestamp decides.
const fs = require('node:fs');
const path = require('node:path');

const f = path.join(__dirname, '..', 'mobile', 'phone-shell-ext.js');
let js = fs.readFileSync(f, 'utf8');

js = js.replace(
  `  var caretWanted = false;`,
  `  var caretWanted = false;
  var triggerTouchedAt = 0;`,
);

js = js.replace(
  `  document.addEventListener('focusout', function (event) {
    if (!isComposer(event.target)) return;
    setTimeout(function () {
      /* Only the two composer menus must not end the editing session; tapping
         anywhere else is allowed to blur as usual. */
      if (!menuOpen()) return;
      var active = document.activeElement;
      if (isComposer(active) && window.getSelection().rangeCount > 0) return;
      restoreCaret();
    }, 0);
  }, true);`,
  `  document.addEventListener('focusout', function (event) {
    if (!isComposer(event.target)) return;
    setTimeout(function () {
      /* A menu that is open, or a trigger tapped moments ago, means this blur
         belongs to the composer's own popovers and must not end editing. */
      var fromTrigger = Date.now() - triggerTouchedAt < 800;
      if (!menuOpen() && !fromTrigger) return;
      var active = document.activeElement;
      if (isComposer(active) && window.getSelection().rangeCount > 0) return;
      restoreCaret();
    }, 60);
  }, true);`,
);

js = js.replace(
  `    if (t.closest('.pXSMma_workspace') || t.closest('.cubgiG_seat')) caretWanted = true;`,
  `    if (t.closest('.pXSMma_workspace') || t.closest('.cubgiG_seat')) {
      caretWanted = true;
      triggerTouchedAt = Date.now();
    }`,
);

fs.writeFileSync(f, js, 'utf8');
try {
  new Function(js);
  console.log(
    JSON.stringify({
      triggerStamp: js.includes('triggerTouchedAt = Date.now()'),
      gapTolerant: js.includes('fromTrigger'),
      syntaxOk: true,
    }),
  );
} catch (e) {
  console.error('syntax error:', e.message);
  process.exit(1);
}
