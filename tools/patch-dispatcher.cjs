// Neutralise the scattered listeners and install one dispatcher.
const fs = require('node:fs');
const path = require('node:path');

const f = path.join(__dirname, '..', 'mobile', 'phone-shell-ext.js');
let js = fs.readFileSync(f, 'utf8');
if (js.includes('harness-dispatcher-v1')) {
  console.log('already present');
  process.exit(0);
}

// 1. disable every existing document-level pointerdown/click listener by an
//    immediate early-return; the bodies stay for their helper definitions.
let disabled = 0;
js = js.replace(/(document\.addEventListener\('(?:pointerdown|click)', function \(event\) \{\n)/g, (m) => {
  disabled++;
  return m + '    if (window.__hmDispatch) return;   /* superseded by the dispatcher */\n';
});

// 2. one dispatcher with an explicit priority order
const dispatcher = `
  /* harness-dispatcher-v1: a single capture-phase entry point. Every previous
     listener above is inert so exactly one actor handles a given tap. */
  window.__hmDispatch = true;
  var lastTrigger = null;

  function replayTap(target, event) {
    if (!target) return;
    var opts = { bubbles: true, cancelable: true, pointerType: 'touch', clientX: event.clientX, clientY: event.clientY };
    window.__hmSkipEvent = true;
    try {
      target.dispatchEvent(new PointerEvent('pointerdown', opts));
      target.dispatchEvent(new PointerEvent('pointerup', opts));
      target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: opts.clientX, clientY: opts.clientY }));
    } finally {
      window.__hmSkipEvent = false;
    }
  }
  function animatePopovers(menus) {
    menus.forEach(function (m) { m.classList.add('hm-menu-out'); });
    setTimeout(function () {
      menus.forEach(function (m) { m.classList.remove('hm-menu-out'); });
    }, 190);
  }

  document.addEventListener('pointerdown', function (event) {
    if (window.__hmSkipEvent === true) return;
    var t = event.target;
    if (!t || !t.closest) return;

    /* 1. the plus button owns its own sheet */
    if (t.closest('.uV2eYG_add') || t.closest('#hm-add-shield')) return;

    /* 2. right panel switches: only manage the chrome, never cancel the tap */
    if (isPanelToggleTarget(t)) {
      hideHomeChrome(!panelOpen());
      return;
    }

    /* 3. composer triggers */
    var trigger = t.closest('.pXSMma_workspace') || t.closest('.cubgiG_seat') ||
      t.closest('.iWlSmW_trigger') || t.closest('._7KE1Ra_trigger');
    if (trigger) {
      var composerInput = q('[data-composer-input]');
      caretWanted = !!(composerInput && document.activeElement === composerInput);
      if (caretWanted) triggerTouchedAt = Date.now();

      var openMenus = visibleMenus();
      var sameTrigger = lastTrigger && trigger.contains(lastTrigger);
      if (openMenus.length && sameTrigger) {
        /* second tap on the same trigger collapses it */
        event.preventDefault();
        event.stopPropagation();
        animatePopovers(openMenus);
        setTimeout(function () { replayTap(trigger, event); }, 195);
        lastTrigger = null;
        return;
      }
      /* a different trigger: dismiss everything else, then let React open it */
      closeOtherPopovers(null);
      lastTrigger = trigger;
      return;
    }

    /* 4. inside a popover: leave it alone */
    if (t.closest('[role=menu]') || t.closest('[role=listbox]') || t.closest('.P3OORG_panel')) return;

    /* 5. outside: dismiss with the exit animation, then replay the tap */
    var menus = visibleMenus();
    if (menus.length) {
      event.preventDefault();
      event.stopPropagation();
      animatePopovers(menus);
      setTimeout(function () { replayTap(t, event); }, 195);
      return;
    }
    lastTrigger = null;
  }, true);

`;

js = js.replace('  /* ------------------------------------------------------------- loop --- */', dispatcher + '  /* ------------------------------------------------------------- loop --- */');

fs.writeFileSync(f, js, 'utf8');
try {
  new Function(js);
  console.log(JSON.stringify({ disabledListeners: disabled, dispatcher: js.includes('harness-dispatcher-v1'), syntaxOk: true }));
} catch (e) {
  console.error('syntax error:', e.message);
  process.exit(1);
}
