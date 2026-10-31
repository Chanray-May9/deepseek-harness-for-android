// Patch the Android shell assets: right-panel toggle + close button, menu/panel motion,
// and a readiness signal that does not depend on a workspace being chosen.
const fs = require('node:fs');
const path = require('node:path');

const assets = process.argv[2];
const cssPath = path.join(assets, 'android-mobile.css');
const jsPath = path.join(assets, 'android-mobile.js');

/* ----------------------------- CSS ----------------------------- */
let css = fs.readFileSync(cssPath, 'utf8');

// Responsive scale: the layout must hold from 320 px phones to tablets and
// landscape, so sizes are clamped rather than fixed.
if (!css.includes('/* harness-android-responsive-v1 */')) {
  css += `
/* harness-android-responsive-v1 */
html[data-harness-android] {
  --hm-gutter: clamp(12px, 3.6vw, 20px);
  --hm-body: clamp(15px, 3.7vw, 17px);
  --hm-title: clamp(19px, 5.2vw, 26px);
  --hm-hit: clamp(44px, 11vw, 52px);
  --hm-radius: clamp(22px, 6vw, 30px);
}
html[data-harness-android] .pXSMma_headline { font-size: var(--hm-title) !important; }
html[data-harness-android] .uV2eYG_input,
html[data-harness-android] .uV2eYG_placeholder,
html[data-harness-android] .VOzbGW_options { font-size: var(--hm-body) !important; }
html[data-harness-android] .uV2eYG_add,
html[data-harness-android] .uV2eYG_primary,
html[data-harness-android] .hHd-Xa_toggle,
#harness-mobile-actions,
#harness-mobile-actions > button,
#harness-mobile-tools-close {
  min-width: var(--hm-hit);
  min-height: var(--hm-hit);
}
html[data-harness-android] .hHd-Xa_toggle {
  width: var(--hm-hit) !important;
  height: var(--hm-hit) !important;
}
#harness-mobile-actions { height: var(--hm-hit); }
#harness-mobile-tools-close { width: var(--hm-hit); height: var(--hm-hit); }
html[data-harness-android] .uV2eYG_card { border-radius: var(--hm-radius) !important; }

/* Narrow phones: tighter gutters, single scrollable settings tab row. */
@media (max-width: 380px) {
  html[data-harness-android] { --hm-gutter: 12px; }
  html[data-harness-android] .VOzbGW_options { padding-left: 14px !important; padding-right: 14px !important; }
  html[data-harness-android] .VOzbGW_navCell { padding: 0 11px !important; }
  html[data-harness-android] .pXSMma_workspace,
  html[data-harness-android] .cubgiG_seat { font-size: 16px !important; }
}
@media (max-width: 340px) {
  html[data-harness-android] .pXSMma_headline { font-size: 18px !important; gap: 16px; }
  html[data-harness-android] .pXSMma_workspace svg,
  html[data-harness-android] .cubgiG_seat svg { width: 20px; height: 20px; }
}

/* Tablets / tablet-foldables: keep the drawer out of the way and centre content. */
@media (min-width: 600px) {
  html[data-harness-android] .wSkVaW_body,
  html[data-harness-android] .an3WzG_body { max-width: 780px; margin: 0 auto; width: 100%; }
  html[data-harness-android] .VOzbGW_panel { width: min(720px, 92vw) !important; height: min(880px, 92dvh) !important; margin: auto !important; border-radius: 20px !important; }
  html[data-harness-android] .VOzbGW_overlay { align-items: center !important; justify-content: center !important; }
  html[data-harness-android] .VOzbGW_navList { padding-right: 12px !important; }
}
@media (min-width: 900px) {
  html[data-harness-android] .wSkVaW_body,
  html[data-harness-android] .an3WzG_body { max-width: 860px; }
}

/* Landscape / short viewports: give the height back to the conversation. */
@media (max-height: 520px) and (orientation: landscape) {
  html[data-harness-android] .pXSMma_root { display: none !important; }
  html[data-harness-android] .uV2eYG_card { min-height: 92px; }
  html[data-harness-android] .VOzbGW_navTitle { height: 34px !important; }
  html[data-harness-android] .VOzbGW_navCell { height: 38px !important; }
}
`;
  fs.writeFileSync(cssPath, css, 'utf8');
  console.log('responsive css patched');
}

// Phone typography + settings density. One scale: 18 title / 16 body / 14 hint.
if (!css.includes('/* harness-android-typography-v1 */')) {
  css += `
/* harness-android-typography-v1 */
html[data-harness-android] {
  --dsh-content-font-size: 16px;
  --dsh-code-font-size: 14px;
  --dsh-terminal-font-size: 14px;
}
html[data-harness-android] body,
html[data-harness-android] button,
html[data-harness-android] input,
html[data-harness-android] textarea,
html[data-harness-android] select {
  font-size: 16px;
}
html[data-harness-android] [class$='_rowTitle'],
html[data-harness-android] [class$='_rowLabel'],
html[data-harness-android] [class$='_title'],
html[data-harness-android] [class$='_itemLabel'] {
  font-size: 16px !important;
  line-height: 24px !important;
}
html[data-harness-android] [class$='_rowDescription'],
html[data-harness-android] [class$='_rowDesc'],
html[data-harness-android] [class$='_hint'],
html[data-harness-android] [class$='_caption'] {
  font-size: 14px !important;
  line-height: 21px !important;
}

/* Settings panel: full screen, one scrollable category row, roomy rows. */
html[data-harness-android] .VOzbGW_overlay {
  padding: 0 !important;
  align-items: stretch !important;
  justify-content: stretch !important;
}
html[data-harness-android] .VOzbGW_panel {
  width: 100vw !important;
  max-width: 100vw !important;
  height: 100dvh !important;
  max-height: 100dvh !important;
  margin: 0 !important;
  border-radius: 0 !important;
  box-sizing: border-box;
  display: flex !important;
  flex-direction: column !important;
}
html[data-harness-android] .VOzbGW_nav {
  position: relative;
  box-sizing: border-box;
  flex: none;
  width: 100% !important;
  padding: 10px 0 8px 12px !important;
  gap: 6px !important;
  border-bottom: 1px solid var(--dsw-alias-border-l3, #ececf0);
}
html[data-harness-android] .VOzbGW_navTitle {
  height: 40px !important;
  padding: 0 12px 0 4px !important;
  font-size: 20px !important;
  font-weight: 600;
  display: flex !important;
  align-items: center;
}
html[data-harness-android] .VOzbGW_navList {
  display: flex !important;
  flex-direction: row !important;
  flex-wrap: nowrap !important;
  gap: 4px !important;
  overflow-x: auto !important;
  overflow-y: hidden !important;
  padding: 0 72px 2px 0 !important;
  scroll-padding-right: 72px;
  scrollbar-width: none;
}
html[data-harness-android] .VOzbGW_navList::-webkit-scrollbar { display: none; height: 0; }
html[data-harness-android] .VOzbGW_navCell {
  flex: 0 0 auto !important;
  height: 44px !important;
  padding: 0 14px !important;
  gap: 8px !important;
  font-size: 16px !important;
  border-radius: 12px !important;
  white-space: nowrap;
}
html[data-harness-android] .VOzbGW_content {
  flex: 1 1 auto !important;
  min-height: 0 !important;
  width: 100% !important;
}
html[data-harness-android] .VOzbGW_header {
  position: absolute !important;
  top: 8px !important;
  right: 8px !important;
  height: 44px !important;
  padding: 0 !important;
  display: flex;
  align-items: center;
  gap: 4px;
  z-index: 3;
}
html[data-harness-android] .VOzbGW_header button {
  min-height: 44px;
  padding: 0 10px;
  font-size: 15px;
  white-space: nowrap;
}
html[data-harness-android] .VOzbGW_close {
  min-width: 44px !important;
  min-height: 44px !important;
}
html[data-harness-android] .VOzbGW_options {
  flex: 1 1 auto !important;
  min-height: 0 !important;
  overflow-y: auto !important;
  padding: 8px 20px calc(32px + env(safe-area-inset-bottom)) !important;
  font-size: 16px !important;
  line-height: 1.6;
}
html[data-harness-android] .VOzbGW_options > * + * {
  margin-top: 4px;
}
html[data-harness-android] .VOzbGW_options [class$='_row'] {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px 16px;
  padding: 16px 0 !important;
  border-bottom: 1px solid var(--dsw-alias-border-l3, #f0f1f4);
  box-sizing: border-box;
}
html[data-harness-android] .VOzbGW_options [class$='_row']:last-child {
  border-bottom: 0;
}
html[data-harness-android] .VOzbGW_options [class$='_rowText'] {
  min-width: 0;
  flex: 1 1 180px;
}
html[data-harness-android] .VOzbGW_options button,
html[data-harness-android] .VOzbGW_options [role=combobox] {
  min-height: 44px;
  padding: 0 14px;
  font-size: 16px;
  border-radius: 12px;
}
`;
  fs.writeFileSync(cssPath, css, 'utf8');
  console.log('typography + settings css patched');
}

if (!css.includes('/* harness-android-motion-v1 */')) {
  css += `
/* harness-android-motion-v1 */
html[data-harness-android] .P3OORG_panel {
  animation: hm-slide-right .22s cubic-bezier(.2,.8,.2,1);
}
html[data-harness-android] [role=menu] {
  animation: hm-pop .16s cubic-bezier(.2,.8,.2,1);
  transform-origin: 50% 100%;
}
html[data-harness-android] [role=dialog],
html[data-harness-android] [role=listbox] {
  animation: hm-fade .18s ease-out;
}
html[data-harness-android] .VOzbGW_overlay {
  animation: hm-fade .18s ease-out;
}
html[data-harness-android] .VOzbGW_panel {
  animation: hm-pop-large .22s cubic-bezier(.2,.8,.2,1);
}
html[data-harness-android] .pI_x6G_sidebarCol,
html[data-harness-android] .wwbglG_regionArea {
  transition: width .2s cubic-bezier(.2,.8,.2,1), opacity .18s ease;
}
html[data-harness-android] #harness-drawer-backdrop {
  transition: opacity .18s ease;
}
#harness-mobile-actions,
#harness-mobile-tools-close {
  transition: opacity .16s ease, transform .16s cubic-bezier(.2,.8,.2,1);
}
@keyframes hm-fade {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes hm-pop {
  from { opacity: 0; transform: translateY(8px) scale(.97); }
  to   { opacity: 1; transform: none; }
}
@keyframes hm-pop-large {
  from { opacity: 0; transform: translateY(14px) scale(.985); }
  to   { opacity: 1; transform: none; }
}
@keyframes hm-slide-right {
  from { opacity: 0; transform: translateX(20px); }
  to   { opacity: 1; transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  html[data-harness-android] .P3OORG_panel,
  html[data-harness-android] [role=menu],
  html[data-harness-android] [role=dialog],
  html[data-harness-android] [role=listbox],
  html[data-harness-android] .VOzbGW_overlay,
  html[data-harness-android] .VOzbGW_panel {
    animation: none !important;
  }
}
/* Close affordance for the right panel: the original control lives in a chrome
   header this phone layout hides, so the panel gets its own round button. */
#harness-mobile-tools-close {
  position: fixed;
  top: 12px;
  right: 12px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid var(--dsw-alias-border-l3, #ececf0);
  border-radius: 50%;
  background: var(--dsw-alias-bg-base, #fff);
  color: var(--dsw-alias-label-primary, #12131a);
  box-shadow: 0 2px 10px #00000014;
  z-index: 200;
  cursor: pointer;
}
#harness-mobile-tools-close svg { width: 20px; height: 20px; }
#harness-mobile-tools-close:active { background: #0000000a; }
body:has(.hHd-Xa_root:not(.hHd-Xa_collapsed)) #harness-mobile-tools-close { display: none; }
`;
  fs.writeFileSync(cssPath, css, 'utf8');
  console.log('css patched');
} else {
  console.log('css already patched');
}

/* ------------------------------ JS ------------------------------ */
let js = fs.readFileSync(jsPath, 'utf8');
const CLOSE_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';

if (!js.includes('/* harness-android-panel-toggle-v1 */')) {
  // 1. A single place that decides whether the right panel is currently showing.
  js = js.replace(
    " function hideDrawer(){",
    ` /* harness-android-panel-toggle-v1 */
 function rightPanelOpen(){
  var frame=document.querySelector('.pI_x6G_frame');
  if(frame)return !frame.hasAttribute('data-rightbar-collapsed');
  return false;
 }
 function toggleRightPanel(){
  var close=button('收起右侧边栏')||button('Close right sidebar');
  if(close){close.click();return false;}
  var open=document.querySelector('button[data-sidebar-right-expand]');
  if(open){open.click();return true;}
  return false;
 }
 /* The phone composer's "+" only offers capture, photos and files. */
 function pruneAddMenu(){
  document.querySelectorAll('[role=menu]').forEach(function(menu){
   if(menu.getAttribute('data-hm-pruned')==='true')return;
   var items=Array.prototype.slice.call(menu.querySelectorAll('[role=menuitem]'));
   if(!items.length)return;
   var plain=items.map(function(item){return (item.innerText||'').replace(/\\s+/g,' ').trim();});
   var isAdd=plain.some(function(text){return /^(插件|方案模式|追求目标|Plugin|Plan|Goal)/.test(text);});
   if(!isAdd)return;
   items.forEach(function(item){
    var text=(item.innerText||'').replace(/\\s+/g,' ').trim();
    var keep=/^(相机|照片|文件|Camera|Photo|Photos|File|Files)/.test(text);
    if(!keep)item.style.display='none';
   });
   menu.setAttribute('data-hm-pruned','true');
  });
 }
 function hideDrawer(){`,
  );

  // 2. The capsule tool button becomes a real toggle.
  js = js.replace(
    "tools.onclick=function(){document.querySelector('button[data-sidebar-right-expand]')?.click()};",
    'tools.onclick=function(){toggleRightPanel()};',
  );

  // 3. Panel close button, mounted only while the panel is open.
  js = js.replace(
    '  if(tools)tools.style.display=originalTools?\'flex\':\'none\';',
    `  if(tools)tools.style.display=originalTools?'flex':'none';
  var panelClose=document.getElementById('harness-mobile-tools-close');
  if(rightPanelOpen()){
   if(!panelClose){panelClose=document.createElement('button');panelClose.id='harness-mobile-tools-close';panelClose.type='button';panelClose.setAttribute('aria-label','关闭右侧面板');panelClose.innerHTML='${CLOSE_ICON}';panelClose.onclick=function(){toggleRightPanel()};document.body.appendChild(panelClose);}
  }else if(panelClose){panelClose.remove();}`,
  );

  // 4. Back gesture: panel first, then drawer.
  js = js.replace(
    "  if(hideDrawer())return true;var r=button('收起右侧边栏')||button('Close right sidebar');if(r){r.click();return true}return false;",
    '  if(rightPanelOpen()){toggleRightPanel();return true}\n  if(hideDrawer())return true;return false;',
  );

  // 5. Readiness must not wait for a workspace choice; a rendered composer is enough.
  js = js.replace(
    "  if(!readySent){var workspace=document.querySelector('button[aria-label=\"选择工作区\"],button[aria-label=\"Choose workspace\"]');if(workspace&&workspace.innerText.trim()&&!/^(选择工作区|Choose workspace)$/.test(workspace.innerText.trim())&&!document.body.innerText.includes('重新连接中')){readySent=true;window.HarnessAndroidExport?.ready();}}",
    "  if(!readySent){var composer=document.querySelector('.uV2eYG_root,.pXSMma_root');var shell=document.querySelector('.pI_x6G_frame');if(composer||(shell&&document.querySelector('.hHd-Xa_root'))){readySent=true;window.HarnessAndroidExport?.ready();}}",
  );

  // 6. Run the add-menu pruning on every reconcile pass.
  if (!js.includes('pruneAddMenu();')) {
    js = js.replace('  composerSetting();', '  pruneAddMenu();\n  composerSetting();');
  }

  fs.writeFileSync(jsPath, js, 'utf8');
  console.log('js patched');
} else {
  console.log('js already patched');
}

const check = fs.readFileSync(jsPath, 'utf8');
console.log(
  JSON.stringify(
    {
      toggleInstalled: check.includes('toggleRightPanel'),
      closeButton: check.includes('harness-mobile-tools-close'),
      readinessRelaxed: check.includes('var composer=document.querySelector(\'.uV2eYG_root'),
      motionCss: fs.readFileSync(cssPath, 'utf8').includes('harness-android-motion-v1'),
    },
    null,
    1,
  ),
);
