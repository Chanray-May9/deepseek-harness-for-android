/* Android phone shell injector.
   Baseline is the shipped android-mobile.js; this file adds only what the phone
   needs and keeps every original handler intact. One observer, one RAF pass. */
(function () {
  if (window.__dshPhoneShell) return;
  window.__dshPhoneShell = true;

  var root = document.documentElement;
  root.setAttribute('data-harness-android', '');

  var WELCOME = { '探索未至之境': '你好，让我们开始聊天吧', 'Into the Unknown': "Hi, let's start chatting" };
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

  function q(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function shown(el) {
    if (!el) return false;
    var r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    var cs = getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0';
  }
  function frame() { return q('.pI_x6G_frame'); }
  function panelOpen() {
    var f = frame();
    return !!(f && f.hasAttribute('data-rightbar-fullscreen'));
  }
  function drawerOpen() {
    var f = frame();
    return !!(f && !f.hasAttribute('data-sidebar-collapsed'));
  }

  /* ------------------------------------------------------------ drawer --- */
  function closeDrawer() {
    if (!drawerOpen()) return false;
    var b = q('.wtg9ga_root:not(.wtg9ga_collapsed) .wtg9ga_toggle');
    if (b) { b.click(); return true; }
    return false;
  }
  function ensureScrim() {
    if (q('#harness-drawer-backdrop')) return;
    var s = document.createElement('div');
    s.id = 'harness-drawer-backdrop';
    s.addEventListener('click', closeDrawer);
    document.body.appendChild(s);
  }

  /* ------------------------------------------------------------- panel --- */
  function togglePanel() {
    var open = panelOpen();
    var btn = q(open ? 'button[data-sidebar-right-toggle]' : 'button[data-sidebar-right-expand]');
    if (!btn) btn = q('button[data-sidebar-right-toggle]') || q('button[data-sidebar-right-expand]');
    if (btn) { btn.click(); return !open; }
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
        var src = q('.wtg9ga_newSession');
        if (src) src.click();
        closeDrawer();
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

    var mark = q('.wtg9ga_collapsed .wtg9ga_railMark');
    if (mark && mark.getAttribute('data-phone-icon') !== 'panel') {
      mark.innerHTML = PANEL_ICON;
      mark.setAttribute('data-phone-icon', 'panel');
    }
  }

  /* ------------------------------------------------------------ sheet --- */
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
    scrim.addEventListener('click', closeSheet);
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
    s.hidden = false;
    var box = s.querySelector('.hm-sheet');
    root.style.setProperty('--hm-sheet-h', (box ? box.offsetHeight : 0) + 'px');
    root.setAttribute('data-phone-sheet', 'open');
  }
  /* The original "+" palette opens on pointerdown, so claim the gesture there. */
  document.addEventListener('pointerdown', function (event) {
    var hit = event.target && event.target.closest && event.target.closest('.uV2eYG_add');
    if (!hit) return;
    event.preventDefault();
    event.stopPropagation();
    openSheet();
  }, true);
  document.addEventListener('click', function (event) {
    var hit = event.target && event.target.closest && event.target.closest('.uV2eYG_add');
    if (!hit) return;
    event.preventDefault();
    event.stopPropagation();
    openSheet();
  }, true);

  /* ------------------------------------------------------------- copy --- */
  function ensureCopy() {
    qa('.WOwLGG_titleGroup > span, .pXSMma_titleGroup > span').forEach(function (el) {
      var text = (el.textContent || '').trim();
      if (WELCOME[text]) el.textContent = WELCOME[text];
    });
  }

  /* ------------------------------------------------------------- gate --- */
  var gateTries = 0;
  function dismissGate() {
    if (gateTries > 6) return;
    var dialogs = qa('[role=dialog]');
    for (var i = 0; i < dialogs.length; i++) {
      var d = dialogs[i];
      var t = d.innerText || '';
      if (t.indexOf('开始使用') === -1 && t.indexOf('Get started') === -1 && t.indexOf('添加 API Key') === -1) continue;
      var close = d.querySelector('button[aria-label="关闭"],button[aria-label="Close"]');
      if (close) { close.click(); gateTries++; return; }
    }
  }

  /* ------------------------------------------------------------- back --- */
  window.PhoneShell = {
    back: function () {
      var sheet = q('#harness-attach-sheet');
      if (sheet && !sheet.hidden) { closeSheet(); return true; }
      var dialog = qa('[role=dialog]').filter(shown)[0];
      if (dialog) {
        var c = dialog.querySelector('button[aria-label="关闭"],button[aria-label="Close"]');
        if (c) { c.click(); return true; }
      }
      if (panelOpen()) { togglePanel(); return true; }
      if (closeDrawer()) return true;
      return false;
    },
  };

  /* ------------------------------------------------------------- loop --- */
  var queued = false;
  function pass() {
    queued = false;
    if (document.readyState === 'loading') return;
    ensureScrim();
    ensureCapsule();
    ensureCopy();
    dismissGate();
    if (!drawerOpen() && !panelOpen()) closeSheetIfStray();
  }
  function closeSheetIfStray() {
    var s = q('#harness-attach-sheet');
    if (s && !s.hidden && !q('.uV2eYG_add')) closeSheet();
  }
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(pass);
  }
  function start() {
    pass();
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
