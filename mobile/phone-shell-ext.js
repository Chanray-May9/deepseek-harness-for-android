/* Phone shell extension.
   Appended after the shipped android-mobile.js, which keeps its own drawer,
   composer-style, theme and ready() logic untouched. This file only adds the
   phone chrome: capsule, right-panel toggle/close, and the attachment sheet. */
(function () {
  if (window.__dshPhoneExt) return;
  window.__dshPhoneExt = true;

  var root = document.documentElement;
  var CLOSE_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var PANEL_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="15" rx="3.5"/><path d="M9.2 4.5v15"/></svg>';
  var PLUS_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="8.6"/><path d="M12 8.4v7.2M8.4 12h7.2"/></svg>';
  var SHEET = [
    ['camera', '相机', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M4 8.5h3l1.5-2h7L17 8.5h3a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 20 18.5H4A1.5 1.5 0 0 1 2.5 17v-7A1.5 1.5 0 0 1 4 8.5Z"/><circle cx="12" cy="13" r="3.2"/></svg>'],
    ['photo', '照片', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="15" rx="2.5"/><circle cx="8.5" cy="10" r="1.5"/><path d="M4 17l5-4.5 4 3.5 3-2.5 4 3.5"/></svg>'],
    ['file', '文件', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M15 3.5H7A1.5 1.5 0 0 0 5.5 5v14A1.5 1.5 0 0 0 7 20.5h10A1.5 1.5 0 0 0 18.5 19V7L15 3.5Z"/><path d="M14.5 3.8V7.5h4"/></svg>'],
  ];

  function q(sel) { return document.querySelector(sel); }
  function frame() { return q('.pI_x6G_frame'); }
  function panelOpen() { var f = frame(); return !!(f && f.hasAttribute('data-rightbar-fullscreen')); }
  function closeDrawer() {
    if (!drawerOpen()) return false;
    var btn = q('.hHd-Xa_root:not(.hHd-Xa_collapsed) .hHd-Xa_toggle');
    if (btn) { btn.click(); return true; }
    return false;
  }
  function drawerOpen() { var f = frame(); return !!(f && !f.hasAttribute('data-sidebar-collapsed')); }

  function panelVisible() {
    if (panelOpen()) return true;
    var col = q('.pI_x6G_rightbarCol') || q('.P3OORG_panel');
    if (!col) return false;
    return col.getBoundingClientRect().width > 40;
  }
  function syncPanelChrome(open) {
    document.body.classList.remove('hm-panel-open');
    hideHomeChrome(!!open);
  }
  function togglePanel() {
    var open = panelOpen();
    syncPanelChrome(!open);
    /* The expand control is mounted at 0x0 while collapsed; the toggle is always
       mounted and reacts on click, so it is the reliable handle here. */
    var btn = q('button[data-sidebar-right-toggle]') || q('button[data-sidebar-right-expand]');
    if (btn) { btn.click(); return !open; }
    syncPanelChrome(open);
    return false;
  }

  /* ---------------------------------------------------------- capsule --- */
  function ensureCapsule() {
    var bar = q('#harness-mobile-actions');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'harness-mobile-actions';

      var tools = document.createElement('button');
      tools.id = 'harness-mobile-tools';
      tools.type = 'button';
      tools.setAttribute('aria-label', '工作区文件与终端');
      tools.innerHTML = PANEL_ICON;
      tools.addEventListener('click', togglePanel);
      bar.appendChild(tools);

      var fresh = document.createElement('button');
      fresh.id = 'harness-mobile-new';
      fresh.type = 'button';
      fresh.setAttribute('aria-label', '新建会话');
      fresh.innerHTML = PLUS_ICON;
      fresh.addEventListener('click', function () {
        var src = q('.hHd-Xa_newSession');
        if (src) src.click();
      });
      bar.appendChild(fresh);

      document.body.appendChild(bar);
    }
    bar.hidden = drawerOpen() || panelOpen();

    var close = q('#harness-mobile-tools-close');
    if (panelOpen()) {
      if (!close) {
        close = document.createElement('button');
        close.id = 'harness-mobile-tools-close';
        close.type = 'button';
        close.setAttribute('aria-label', '关闭右侧面板');
        close.innerHTML = CLOSE_ICON;
        close.addEventListener('click', togglePanel);
        document.body.appendChild(close);
      }
    } else if (close) {
      close.remove();
    }

    /* The rail mark is React-owned: never rewrite its children. The panel glyph
       is drawn by CSS (::before) so React's reconciliation stays intact. */

  }

  /* ------------------------------------------------------------ sheet --- */
  var sheetOpenedAt = 0;
  var sheetClosedAt = 0;
  function closeSheet() {
    var s = q('#harness-attach-sheet');
    if (s) s.hidden = true;
    root.removeAttribute('data-phone-sheet');
  }
  function pickFile(kind) {
    var input = q('input[type=file]');
    if (!input) return false;
    if (kind === 'camera') { input.setAttribute('accept', 'image/*'); input.setAttribute('capture', 'environment'); }
    else if (kind === 'photo') { input.setAttribute('accept', 'image/*'); input.removeAttribute('capture'); }
    else { input.removeAttribute('accept'); input.removeAttribute('capture'); }
    input.click();
    return true;
  }
  function ensureSheet() {
    var s = q('#harness-attach-sheet');
    if (s) return s;
    s = document.createElement('div');
    s.id = 'harness-attach-sheet';
    s.hidden = true;
    var scrim = document.createElement('div');
    scrim.className = 'hm-sheet-scrim';
    scrim.addEventListener('click', function (event) {
      /* The pointerup of the opening tap lands on the freshly mounted scrim;
         that click is not a dismissal. */
      if (Date.now() - sheetOpenedAt < 350) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      closeSheet();
    });
    var box = document.createElement('div');
    box.className = 'hm-sheet';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', '添加附件');
    SHEET.forEach(function (item) {
      var b = document.createElement('button');
      b.type = 'button';
      b.dataset.kind = item[0];
      var ico = document.createElement('span');
      ico.className = 'hm-ico';
      ico.innerHTML = item[2];
      var label = document.createElement('span');
      label.textContent = item[1];
      b.appendChild(ico);
      b.appendChild(label);
      b.addEventListener('click', function () { closeSheet(); pickFile(item[0]); });
      box.appendChild(b);
    });
    s.appendChild(scrim);
    s.appendChild(box);
    document.body.appendChild(s);
    return s;
  }
  function openSheet() {
    var s = ensureSheet();
    sheetOpenedAt = Date.now();
    s.hidden = false;
    var box = s.querySelector('.hm-sheet');
    root.style.setProperty('--hm-sheet-h', (box ? box.offsetHeight : 0) + 'px');
    root.setAttribute('data-phone-sheet', 'open');
  }
  function sheetOpen() {
    var s = q('#harness-attach-sheet');
    return !!(s && !s.hidden);
  }
  document.addEventListener('pointerdown', function (event) {
    if (window.__hmDispatch) return;   /* superseded by the dispatcher */
    if (window.__hmClaim === event) return;
    window.__hmClaim = event;
    var hit = event.target && event.target.closest && event.target.closest('.uV2eYG_add');
    if (!hit) return;
    /* The plus is a toggle: a second tap closes what the first one opened. */
    if (sheetOpen()) {
      event.preventDefault();
      event.stopPropagation();
      closeSheet();
      sheetClosedAt = Date.now();
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    openSheet();
  }, true);
  /* Tapping anywhere outside the panel dismisses it, without swallowing that
     tap: the event keeps propagating so the rest of the screen stays usable. */
  document.addEventListener('click', function (event) {
    if (window.__hmDispatch) return;   /* superseded by the dispatcher */
    if (window.__hmClaimClick === event) return;
    window.__hmClaimClick = event;
    if (!sheetOpen()) return;
    if (Date.now() - sheetOpenedAt < 350) return;
    var t = event.target;
    if (t && t.closest && t.closest('.hm-sheet')) return;
    if (t && t.closest && t.closest('.uV2eYG_add')) return;
    closeSheet();
  }, true);
  document.addEventListener('click', function (event) {
    if (window.__hmDispatch) return;   /* superseded by the dispatcher */
    if (window.__hmClaimClick === event) return;
    window.__hmClaimClick = event;
    var hit = event.target && event.target.closest && event.target.closest('.uV2eYG_add');
    if (!hit) return;
    /* If this same gesture just closed the sheet, do not reopen it. */
    if (Date.now() - sheetClosedAt < 400) return;
    event.preventDefault();
    event.stopPropagation();
    openSheet();
  }, true);

  /* ------------------------------------------------------------- gate --- */
  var gateTries = 0;
  function dismissGate() {
    if (gateTries > 6) return;
    var dialogs = document.querySelectorAll('[role=dialog]');
    for (var i = 0; i < dialogs.length; i++) {
      var d = dialogs[i];
      var t = d.innerText || '';
      if (t.indexOf('开始使用') === -1 && t.indexOf('Get started') === -1 && t.indexOf('添加 API Key') === -1) continue;
      var close = d.querySelector('button[aria-label="关闭"],button[aria-label="Close"]');
      if (close) { close.click(); gateTries++; return; }
    }
  }

  /* --------------------------------------------------------- compact --- */
  /* harness-compact-own-v1: the shipped rule depends on focus and popover state
     that change under us, so decide here and keep the attribute authoritative. */
  function updateCompact() {
    var hero = q('.uV2eYG_hero');
    if (!hero) return;
    var single = document.documentElement.getAttribute('data-harness-composer-style') === 'single';
    var input = hero.querySelector('[data-composer-input]');
    var text = input ? (input.innerText || '').trim() : '';
    var focused = hero.contains(document.activeElement);
    var attachments = hero.querySelector('[data-slot="conversation.input.attachments"]');
    var hasFiles = !!(attachments && attachments.childElementCount);
    var holdOpen = Date.now() < holdExpandedUntil;
    var want = single && !text && !focused && !hasFiles && !holdOpen;
    if (hero.hasAttribute('data-harness-compact') !== want) {
      hero.toggleAttribute('data-harness-compact', want);
    }
  }


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

  /* ------------------------------------------------- drawer autoclose --- */
  /* harness-drawer-autoclose-v1: picking any destination inside the drawer
     navigates and then collapses it, which is what a phone drawer should do. */
  document.addEventListener('click', function (event) {
    if (window.__hmDispatch) return;   /* superseded by the dispatcher */
    if (window.__hmClaimClick === event) return;
    window.__hmClaimClick = event;
    var t = event.target;
    if (!t || !t.closest) return;
    var open = q('.hHd-Xa_root:not(.hHd-Xa_collapsed)');
    if (!open) return;
    if (!open.contains(t)) return;
    if (t.closest('.hHd-Xa_toggle')) return;         /* the collapse control itself */
    var target = t.closest('.hHd-Xa_newSession, .hHd-Xa_panelRow, .hHd-Xa_regionArea button, .hHd-Xa_regionArea a');
    if (!target) return;
    setTimeout(function () { closeDrawer(); }, 0);
  }, false);
  /* ---------------------------------------------------------- keep focus --- */
  /* harness-keep-focus-v1: opening the workspace / mode menus must not steal
     focus from the composer, otherwise the caret and keyboard disappear. */
  /* Caret retention. Focus can survive while the selection is cleared, and the
     composer node can be re-created while a menu is open, so restore both. */
  function isComposer(el) {
    return !!(el && el.hasAttribute && el.hasAttribute('data-composer-input'));
  }
  function inMenu(el) {
    return !!(el && el.closest && (el.closest('[role=menu]') || el.closest('.cubgiG_seat') || el.closest('.pXSMma_workspace')));
  }
  function restoreCaret() {
    var input = q('[data-composer-input]');
    if (!input) return false;
    try {
      input.focus();
      var sel = window.getSelection();
      if (sel) {
        var range = document.createRange();
        range.selectNodeContents(input);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
      return true;
    } catch (e) {
      return false;
    }
  }
  var caretWanted = false;
  var triggerTouchedAt = 0;
  document.addEventListener('focusin', function (event) {
    if (isComposer(event.target)) caretWanted = true;
  }, true);
  function menuOpen() {
    var nodes = document.querySelectorAll('[role=menu], .cubgiG_seat, .pXSMma_workspace');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.getAttribute('aria-expanded') === 'true') return true;
      if (el.getAttribute('role') !== 'menu') continue;
      var r = el.getBoundingClientRect();
      if (r.width > 8 && r.height > 8 && getComputedStyle(el).display !== 'none') return true;
    }
    return false;
  }
  document.addEventListener('focusout', function (event) {
    if (!isComposer(event.target)) return;
    setTimeout(function () {
      if (!caretWanted) return;
      /* A menu that is open, or a trigger tapped moments ago, means this blur
         belongs to the composer's own popovers and must not end editing. */
      var fromTrigger = Date.now() - triggerTouchedAt < 800;
      if (!menuOpen() && !fromTrigger) return;
      var active = document.activeElement;
      if (isComposer(active) && window.getSelection().rangeCount > 0) return;
      restoreCaret();
    }, 60);
  }, true);
  /* Opening either menu must not end the editing session. */
  document.addEventListener('pointerdown', function (event) {
    if (window.__hmDispatch) return;   /* superseded by the dispatcher */
    if (window.__hmClaim === event) return;
    window.__hmClaim = event;
    var t = event.target;
    if (!t || !t.closest) return;
    if (t.closest('.pXSMma_workspace') || t.closest('.cubgiG_seat')) {
      var composerInput = q('[data-composer-input]');
      /* Only keep the caret if the user was actually editing when they tapped. */
      caretWanted = !!(composerInput && document.activeElement === composerInput);
      if (caretWanted) triggerTouchedAt = Date.now();
    }
  }, true);
  /* harness-panel-instant-v2: flip the chrome class on the capture phase so the
     drawer button and capsule vanish in the same frame the panel appears. */
  function isPanelToggleTarget(t) {
    if (!t || !t.closest) return false;
    return !!(t.closest('#harness-mobile-tools') ||
      t.closest('[data-sidebar-right-toggle]') ||
      t.closest('[data-sidebar-right-expand]'));
  }
  /* pointerdown, not click: the panel starts rendering before click is
     dispatched, so hiding on click leaves it visible for the first frames. */
  /* Apply the visibility straight to the two nodes. A body class proved
     unreliable (it survived some closes), inline style cannot drift. */
  function hideHomeChrome(hide) {
    var cap = q('#harness-mobile-actions');
    var tg = q('.hHd-Xa_collapsed .hHd-Xa_toggle') || q('.hHd-Xa_toggle');
    [cap, tg].forEach(function (el) {
      if (!el) return;
      if (hide) {
        el.style.setProperty('display', 'none', 'important');
      } else {
        el.style.removeProperty('display');
      }
    });
  }
  var panelFlipAt = 0;
  document.addEventListener('pointerdown', function (event) {
    if (window.__hmDispatch) return;   /* superseded by the dispatcher */
    if (window.__hmClaim === event) return;
    window.__hmClaim = event;
    if (!isPanelToggleTarget(event.target)) return;
    panelFlipAt = Date.now();
    var willOpen = !panelOpen();
    hideHomeChrome(willOpen);
  }, true);
  document.addEventListener('click', function (event) {
    if (window.__hmDispatch) return;   /* superseded by the dispatcher */
    if (window.__hmClaimClick === event) return;
    window.__hmClaimClick = event;
    if (!isPanelToggleTarget(event.target)) return;
    setTimeout(function () { syncPanelChrome(panelVisible()); }, 400);
  }, true);

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
    if (window.__hmDispatch) return;   /* superseded by the dispatcher */
    if (window.__hmClaim === event) return;
    window.__hmClaim = event;
    var t = event.target;
    if (!t || !t.closest) return;
    /* Every composer entry point dismisses whatever else is on screen first:
       workspace, mode, permission, model, and the "+" sheet. */
    var trigger = t.closest('.pXSMma_workspace') ||
      t.closest('.cubgiG_seat') ||
      t.closest('.iWlSmW_trigger') ||
      t.closest('._7KE1Ra_trigger') ||
      t.closest('#hm-add-shield') ||
      t.closest('.uV2eYG_add');
    if (!trigger) return;
    closeOtherPopovers(null);
  }, true);


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


  /* harness-add-shield-v1: the shipped "+" opens its own palette on a gesture we
     cannot reliably cancel. Put our own transparent layer on top of it, so the
     original handler receives nothing at all. */
  function bindAddButton() {
    var add = q('.uV2eYG_add');
    if (!add || add.__hmBound) return;
    add.__hmBound = true;
    var handler = function (event) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      if (sheetOpen()) {
        closeSheet();
        sheetClosedAt = Date.now();
      } else {
        closeOtherPopovers(null);
        openSheet();
      }
    };
    add.addEventListener('pointerdown', handler, true);
    add.addEventListener('click', handler, true);
  }
  function ensureAddShield() {
    /* The element-level binding is the reliable path; the floating hotspot is a
       fallback for cases where React replaces the button node. */
    bindAddButton();
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
    if (window.__hmDispatch) return;   /* superseded by the dispatcher */
    if (window.__hmClaim === event) return;
    window.__hmClaim = event;
    if (menuOutReplaying) { menuOutReplaying = false; return; }
    var menus = visibleMenus();
    if (!menus.length) return;
    var t = event.target;
    if (t && t.closest && t.closest('[role=menu]')) return;   /* inside the menu */
    if (t && t.closest && t.closest('.pXSMma_workspace, .cubgiG_seat, .iWlSmW_trigger, ._7KE1Ra_trigger')) return;
    /* Never intercept the "+" hotspot: replaying that tap would reopen the
       shipped palette. The shield owns it. */
    if (t && t.closest && t.closest('#hm-add-shield, .uV2eYG_add')) {
      closeOtherPopovers(null);
      return;
    }

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


  /* harness-trigger-toggle-v1: a second tap on the trigger that opened a popover
     collapses it instead of re-opening. */
  var lastTrigger = null;
  var holdExpandedUntil = 0;
  document.addEventListener('pointerdown', function (event) {
    if (window.__hmDispatch) return;   /* superseded by the dispatcher */
    if (window.__hmClaim === event) return;
    window.__hmClaim = event;
    var t = event.target;
    if (!t || !t.closest) return;
    var trigger = t.closest('.cubgiG_seat') || t.closest('.pXSMma_workspace') || t.closest('.iWlSmW_trigger') || t.closest('._7KE1Ra_trigger');
    if (!trigger) { lastTrigger = null; return; }
    var open = visibleMenus();
    var expandedNow = trigger.getAttribute('aria-expanded') === 'true';
    if ((open.length || expandedNow) && lastTrigger && trigger.contains(lastTrigger)) {
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

  /* harness-evt-claim-v1: one handler per event; siblings on document must not
     all fire for the same tap. */

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

    /* 2. right panel switch. The capsule control is expand-only, so when the
       panel is already open this tap has to be redirected to the real toggle. */
    if (isPanelToggleTarget(t)) {
      if (panelOpen()) {
        event.preventDefault();
        event.stopPropagation();
        var closer = q('button[data-sidebar-right-toggle]');
        if (closer) closer.click();
        setTimeout(function () { hideHomeChrome(panelOpen()); }, 80);
      } else {
        setTimeout(function () { hideHomeChrome(panelOpen()); }, 80);
      }
      return;
    }

    /* 2b. drawer destinations collapse the drawer once the click lands */
    if (t.closest('.hHd-Xa_newSession') || t.closest('.hHd-Xa_panelRow') ||
        t.closest('.hHd-Xa_regionArea button') || t.closest('.hHd-Xa_regionArea a')) {
      setTimeout(function () { closeDrawer(); }, 450);
      return;
    }

    /* 3. composer triggers */
    /* Only controls that React opens without being able to close themselves
       belong here. The model picker does its own toggle (it reads `open` and
       calls close/show), and .cubgiG_seat/.pXSMma_workspace cover the whole
       composer — treating them as triggers made the picker close 44ms after
       it opened. */
    var trigger = t.closest('.iWlSmW_trigger');
    if (trigger) {
      var composerInput = q('[data-composer-input]');
      caretWanted = !!(composerInput && document.activeElement === composerInput);
      if (caretWanted) triggerTouchedAt = Date.now();
      /* Only preserve the expanded card when it was expanded to begin with
         (either focused, or already in the two-row layout). A resting single
         line must never grow just because a popover opened. */
      var heroNow = q('.uV2eYG_hero');
      var wasExpanded = !!(heroNow && !heroNow.hasAttribute('data-harness-compact'));
      if (caretWanted || wasExpanded) holdExpandedUntil = Date.now() + 900;

      var openMenus = visibleMenus();
      var sameTrigger = lastTrigger && trigger.contains(lastTrigger);
      if (openMenus.length && sameTrigger) {
        /* second tap on the same trigger collapses it. React only opens on this
           control, so close it explicitly instead of replaying the tap. */
        event.preventDefault();
        event.stopPropagation();
        animatePopovers(openMenus);
        setTimeout(function () {
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true }));
          setTimeout(function () {
            if (!visibleMenus().length) return;
            window.__hmSkipEvent = true;
            try {
              document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerType: 'touch' }));
              document.body.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
            } finally {
              window.__hmSkipEvent = false;
            }
          }, 70);
        }, 190);
        lastTrigger = null;
        return;
      }
      /* a different trigger: dismiss everything else, then let React open it */
      closeOtherPopovers(null);
      lastTrigger = trigger;
      return;
    }

    /* 4. inside a popover or anywhere in the composer: leave it alone. The model
       picker is one of these controls and must not be treated as "outside". */
    if (t.closest('[role=menu]') || t.closest('[role=listbox]') || t.closest('.P3OORG_panel') ||
        t.closest('.uV2eYG_row') || t.closest('.wSkVaW_heroWorkspaceRow') ||
        t.closest('.uV2eYG_card')) {
      return;
    }

    /* 5. outside: dismiss the sheet and any popover */
    if (sheetOpen() && !t.closest('#harness-attach-sheet')) {
      closeSheet();
      sheetClosedAt = Date.now();
    }
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

  /* harness-ready-fallback-v1: the shipped ready() gate looks for
     button[aria-label="选择工作区"], which does not exist in this build (the
     entry is named 添加工作区), so the native loading overlay was never removed
     and the app reported "connection is slow" after 45s. Signal readiness from
     the composer instead. */
  var readySignalled = false;
  function ensureReadySignal() {
    if (readySignalled) return;
    var bridge = window.HarnessAndroidExport;
    if (!bridge || typeof bridge.ready !== 'function') return;
    var composer = q('.uV2eYG_card') || q('.pXSMma_root') || q('.uV2eYG_root');
    if (!composer) return;
    /* Only mark as done once the call actually goes through: marking first
       would burn the single attempt if the bridge is not ready yet. */
    try {
      bridge.ready();
      readySignalled = true;
    } catch (e) {
      readySignalled = false;
    }
  }
  /* harness-ready-poll-v1: pass() only runs on DOM mutations, so once the page
     settles there is no further retry. Poll independently until the native
     overlay is dismissed, whatever the timing of the first paints. */
  var readyTimer = setInterval(function () {
    ensureReadySignal();
    if (readySignalled) clearInterval(readyTimer);
  }, 200);
  setTimeout(function () { ensureReadySignal(); }, 1500);
  setTimeout(function () { ensureReadySignal(); }, 4000);
  /* ------------------------------------------------------------- loop --- */
  var queued = false;
  var wasOpen = false;
  var drawerOpenedAt = 0;
  function pass() {
    queued = false;
    if (document.readyState === 'loading') return;
    var nowOpen = drawerOpen();
    if (nowOpen && !wasOpen) drawerOpenedAt = Date.now();
    wasOpen = nowOpen;
    ensureReadySignal();
    hideHomeChrome(panelOpen());
    purgeNativeDock();
    ensureAddShield();
    ensureCapsule();
    ensureSettingsBack();
    updateCompact();
    dismissGate();
  }
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(pass);
  }
  /* harness-panel-geometry-v1: watch the right column's size directly. */
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
    watchPanelGeometry();
    new MutationObserver(schedule).observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['data-sidebar-collapsed', 'data-rightbar-fullscreen', 'data-theme', 'data-ds-dark-theme'],
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();














































