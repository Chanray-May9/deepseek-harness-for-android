// 1) caret retention only when the composer really had focus at tap time
// 2) tapping the same trigger again collapses its popover
const fs = require('node:fs');
const path = require('node:path');

const f = path.join(__dirname, '..', 'mobile', 'phone-shell-ext.js');
let js = fs.readFileSync(f, 'utf8');

// --- fix 1: caret intent must reflect the tap, not history -------------------
js = js.replace(
  `    if (t.closest('.pXSMma_workspace') || t.closest('.cubgiG_seat')) {
      caretWanted = true;
      triggerTouchedAt = Date.now();
    }`,
  `    if (t.closest('.pXSMma_workspace') || t.closest('.cubgiG_seat')) {
      var composerInput = q('[data-composer-input]');
      /* Only keep the caret if the user was actually editing when they tapped. */
      caretWanted = !!(composerInput && document.activeElement === composerInput);
      if (caretWanted) triggerTouchedAt = Date.now();
    }`,
);

// also drop the intent when the composer loses focus to somewhere else
js = js.replace(
  `    setTimeout(function () {
      /* A menu that is open, or a trigger tapped moments ago, means this blur
         belongs to the composer's own popovers and must not end editing. */
      var fromTrigger = Date.now() - triggerTouchedAt < 800;`,
  `    setTimeout(function () {
      if (!caretWanted) return;
      /* A menu that is open, or a trigger tapped moments ago, means this blur
         belongs to the composer's own popovers and must not end editing. */
      var fromTrigger = Date.now() - triggerTouchedAt < 800;`,
);

// --- fix 2: same trigger toggles its popover closed --------------------------
if (!js.includes('harness-trigger-toggle-v1')) {
  const anchor = '  /* ------------------------------------------------------------- loop --- */';
  const block = `
  /* harness-trigger-toggle-v1: a second tap on the trigger that opened a popover
     collapses it instead of re-opening. */
  var lastTrigger = null;
  document.addEventListener('pointerdown', function (event) {
    var t = event.target;
    if (!t || !t.closest) return;
    var trigger = t.closest('.cubgiG_seat') || t.closest('.pXSMma_workspace');
    if (!trigger) { lastTrigger = null; return; }
    var open = visibleMenus();
    if (open.length && lastTrigger && trigger.contains(lastTrigger)) {
      event.preventDefault();
      event.stopPropagation();
      open.forEach(function (m) { m.classList.add('hm-menu-out'); });
      setTimeout(function () {
        open.forEach(function (m) { m.classList.remove('hm-menu-out'); });
        menuOutReplaying = true;
        try {
          trigger.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerType: 'touch' }));
          trigger.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, pointerType: 'touch' }));
          trigger.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        } catch (e) { /* nothing */ }
        lastTrigger = null;
      }, 190);
      return;
    }
    lastTrigger = trigger;
  }, true);

`;
  js = js.replace(anchor, block + anchor);
}

fs.writeFileSync(f, js, 'utf8');
try {
  new Function(js);
  console.log(
    JSON.stringify({
      caretScoped: js.includes('Only keep the caret if the user was actually editing'),
      earlyReturn: js.includes('if (!caretWanted) return;'),
      triggerToggle: js.includes('harness-trigger-toggle-v1'),
      syntaxOk: true,
    }),
  );
} catch (e) {
  console.error('syntax error:', e.message);
  process.exit(1);
}
