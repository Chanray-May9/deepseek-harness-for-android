// Take over menu dismissal so the popover can animate out before it unmounts.
const fs = require('node:fs');
const path = require('node:path');

const f = path.join(__dirname, '..', 'mobile', 'phone-shell-ext.js');
let js = fs.readFileSync(f, 'utf8');
if (js.includes('harness-menu-out-v1')) {
  console.log('already present');
  process.exit(0);
}

const anchor = '  /* ------------------------------------------------------------- loop --- */';
const block = `
  /* harness-menu-out-v1: React unmounts the menu synchronously, so a CSS exit
     animation would never run. Intercept the dismissing tap, animate, then
     replay the same tap so React closes it as usual. */
  var menuOutReplaying = false;
  function visibleMenus() {
    return Array.prototype.filter.call(
      document.querySelectorAll('[role=menu]'),
      function (m) {
        var r = m.getBoundingClientRect();
        return r.width > 8 && r.height > 8;
      },
    );
  }
  document.addEventListener('pointerdown', function (event) {
    if (menuOutReplaying) { menuOutReplaying = false; return; }
    var menus = visibleMenus();
    if (!menus.length) return;
    var t = event.target;
    if (t && t.closest && t.closest('[role=menu]')) return;   /* inside the menu */
    if (t && t.closest && t.closest('.pXSMma_workspace, .cubgiG_seat')) return; /* own trigger */

    event.preventDefault();
    event.stopPropagation();
    menus.forEach(function (m) { m.classList.add('hm-menu-out'); });

    var replayTarget = t || document.body;
    var opts = {
      bubbles: true,
      cancelable: true,
      pointerType: 'touch',
      clientX: event.clientX,
      clientY: event.clientY,
    };
    setTimeout(function () {
      menus.forEach(function (m) { m.classList.remove('hm-menu-out'); });
      menuOutReplaying = true;
      try {
        replayTarget.dispatchEvent(new PointerEvent('pointerdown', opts));
        replayTarget.dispatchEvent(new PointerEvent('pointerup', opts));
        replayTarget.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: opts.clientX, clientY: opts.clientY }));
      } catch (e) { /* if the replay fails, the next tap will close it */ }
    }, 190);
  }, true);

`;
js = js.replace(anchor, block + anchor);

fs.writeFileSync(f, js, 'utf8');
try {
  new Function(js);
  console.log(JSON.stringify({ exitAnim: js.includes('hm-menu-out'), syntaxOk: true }));
} catch (e) {
  console.error('syntax error:', e.message);
  process.exit(1);
}
