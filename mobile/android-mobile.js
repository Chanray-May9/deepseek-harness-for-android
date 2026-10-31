/* DeepSeek Harness — Android phone shell behaviour.
   Adds only what CSS cannot: the right-side capsule, the drawer scrim, the
   back-gesture contract and the host theme bridge. Original components, handlers
   and data flow are reused as-is. */
(function () {
  if (window.__harnessAndroidMobile) return;
  window.__harnessAndroidMobile = true;

  var root = document.documentElement;
  root.setAttribute('data-harness-android', '');

  var WELCOME = { '探索未至之境': '你好，让我们开始聊天吧', 'Into the Unknown': "Hi, let's start chatting" };

  function q(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function visible(el) {
    if (!el) return false;
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }
  function svgOf(el) {
    var s = el && el.querySelector('svg');
    return s ? s.cloneNode(true) : null;
  }
  function setLabel(btn, label) {
    btn.setAttribute('aria-label', label);
    btn.title = label;
  }

  /* ---------- drawer ---------- */
  function drawerOpen() {
    return !!q('.wtg9ga_root:not(.wtg9ga_collapsed)');
  }
  function closeDrawer() {
    var t = q('.wtg9ga_root:not(.wtg9ga_collapsed) .wtg9ga_toggle');
    if (t) t.click();
    return !!t;
  }
  function openDrawer() {
    var t = q('.wtg9ga_root.wtg9ga_collapsed .wtg9ga_toggle');
    if (t) t.click();
    return !!t;
  }
  function ensureScrim() {
    if (q('#harness-drawer-scrim')) return;
    var s = document.createElement('div');
    s.id = 'harness-drawer-scrim';
    s.addEventListener('click', closeDrawer);
    document.body.appendChild(s);
  }

  /* ---------- top capsule ---------- */
  var ICON_PANEL =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round">' +
    '<rect x="3" y="4.5" width="18" height="15" rx="3.5"/><path d="M9.2 4.5v15"/></svg>';
  var ICON_PLUS =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">' +
    '<circle cx="12" cy="12" r="8.6"/><path d="M12 8.4v7.2M8.4 12h7.2"/></svg>';

  function ensureActions() {
    var bar = q('#harness-mobile-actions');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'harness-mobile-actions';

      var tools = document.createElement('button');
      tools.id = 'harness-mobile-tools';
      tools.type = 'button';
      setLabel(tools, '工作区文件与终端');
      tools.innerHTML = ICON_PANEL;
      tools.addEventListener('click', function () {
        var src = q('button[aria-label="打开右侧边栏"],button[aria-label="Open right sidebar"]');
        if (src) src.click();
      });
      bar.appendChild(tools);

      var newChat = document.createElement('button');
      newChat.id = 'harness-mobile-new';
      newChat.type = 'button';
      setLabel(newChat, '新建会话');
      newChat.innerHTML = ICON_PLUS;
      newChat.addEventListener('click', function () {
        var src = q('.wtg9ga_newSession');
        if (src) src.click();
        closeDrawer();
      });
      bar.appendChild(newChat);

      document.body.appendChild(bar);
    }

    // Collapsed rail: the original mark is the product logo; the phone uses the
    // same panel glyph as the capsule so the two controls read as one pair.
    var mark = q('.wtg9ga_collapsed .wtg9ga_railMark');
    if (mark && mark.getAttribute('data-hm-icon') !== 'panel') {
      mark.innerHTML = ICON_PANEL;
      mark.setAttribute('data-hm-icon', 'panel');
    }

    var expanded = drawerOpen() || !!qa('[role=dialog]').filter(visible)[0];
    bar.hidden = !!expanded;
  }

  /* ---------- welcome copy ---------- */
  function ensureCopy() {
    qa('.WOwLGG_titleGroup > span').forEach(function (s) {
      var t = (s.textContent || '').trim();
      if (WELCOME[t]) s.textContent = WELCOME[t];
    });
  }

  /* ---------- theme bridge ---------- */
  var lastDark;
  function ensureTheme() {
    var dark = !!q('[data-ds-dark-theme]');
    if (dark === lastDark) return;
    lastDark = dark;
    root.setAttribute('data-hm-dark', dark ? 'true' : 'false');
    try {
      if (window.HarnessAndroidExport && window.HarnessAndroidExport.theme) {
        window.HarnessAndroidExport.theme(dark);
      }
    } catch (e) {}
  }

  /* ---------- back gesture contract ---------- */
  window.HarnessMobile = {
    back: function () {
      var dialog = qa('[role=dialog]').filter(visible)[0];
      if (dialog) {
        var close = dialog.querySelector('button[aria-label="关闭"],button[aria-label="Close"]');
        if (close) { close.click(); return true; }
      }
      if (drawerOpen()) return closeDrawer();
      var right = q('button[aria-label="收起右侧边栏"],button[aria-label="Close right sidebar"]');
      if (right) { right.click(); return true; }
      return false;
    },
    closeDrawer: closeDrawer,
    openDrawer: openDrawer,
  };

  /* ---------- reactive pass ---------- */
  var queued = false;
  function reconcile() {
    queued = false;
    if (document.readyState === 'loading') return;
    ensureScrim();
    ensureActions();
    ensureCopy();
    ensureTheme();
  }
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(reconcile);
  }

  function start() {
    reconcile();
    new MutationObserver(schedule).observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['class', 'data-sidebar-collapsed', 'data-ds-dark-theme', 'data-theme'],
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
