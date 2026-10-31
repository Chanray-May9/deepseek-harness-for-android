// Replace the composer "+" panel with a phone-style attachment sheet:
// 相机 / 照片 / 文件. The original command palette stays reachable by long-press.
const fs = require('node:fs');
const path = require('node:path');

const assets = process.argv[2];
const cssPath = path.join(assets, 'android-mobile.css');
const jsPath = path.join(assets, 'android-mobile.js');

let css = fs.readFileSync(cssPath, 'utf8');
if (!css.includes('/* harness-attach-sheet-v1 */')) {
  css += `
/* harness-attach-sheet-v1 */
#harness-attach-sheet {
  position: fixed;
  inset: 0;
  z-index: 320;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}
#harness-attach-sheet[hidden] { display: none; }
#harness-attach-sheet .hm-sheet-scrim {
  position: absolute;
  inset: 0;
  background: #0b0d1240;
  animation: hm-fade .18s ease-out;
}
#harness-attach-sheet .hm-sheet {
  position: relative;
  margin: 0 var(--hm-gutter, 16px) calc(env(safe-area-inset-bottom) + 12px);
  padding: 10px;
  border-radius: 26px;
  background: var(--dsw-alias-bg-base, #fff);
  box-shadow: 0 -2px 40px #0b0d1224;
  animation: hm-sheet-in .22s cubic-bezier(.2,.8,.2,1);
  display: flex;
  flex-direction: column;
  gap: 2px;
}
#harness-attach-sheet .hm-sheet > button {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  min-height: 64px;
  padding: 8px 12px;
  border: 0;
  border-radius: 18px;
  background: transparent;
  color: var(--dsw-alias-label-primary, #12131a);
  font-size: 17px;
  line-height: 24px;
  text-align: left;
}
#harness-attach-sheet .hm-sheet > button:active { background: #0000000a; }
#harness-attach-sheet .hm-sheet > button .hm-ico {
  flex: none;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #00000008;
  color: var(--dsw-alias-label-primary, #12131a);
}
#harness-attach-sheet .hm-sheet > button .hm-ico svg { width: 22px; height: 22px; }
@keyframes hm-sheet-in {
  from { opacity: 0; transform: translateY(24px) scale(.98); }
  to   { opacity: 1; transform: none; }
}
`;
  fs.writeFileSync(cssPath, css, 'utf8');
  console.log('attach sheet css added');
}

const ICONS = {
  camera:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M4 8.5h3l1.5-2h7L17 8.5h3a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 20 18.5H4A1.5 1.5 0 0 1 2.5 17v-7A1.5 1.5 0 0 1 4 8.5Z"/><circle cx="12" cy="13" r="3.2"/></svg>',
  photo:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="15" rx="2.5"/><circle cx="8.5" cy="10" r="1.5"/><path d="M4 17l5-4.5 4 3.5 3-2.5 4 3.5"/></svg>',
  file:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M15 3.5H7A1.5 1.5 0 0 0 5.5 5v14A1.5 1.5 0 0 0 7 20.5h10A1.5 1.5 0 0 0 18.5 19V7L15 3.5Z"/><path d="M14.5 3.8V7.5h4"/></svg>',
};

let js = fs.readFileSync(jsPath, 'utf8');
if (!js.includes('/* harness-attach-sheet-v1 */')) {
  js = js.replace(
    ' function rightPanelOpen(){',
    ` /* harness-attach-sheet-v1 */
 var hmPressAt = 0;
 var hmSheetLabels = [['camera','相机'],['photo','照片'],['file','文件']];
 var hmSheetIcons = ${JSON.stringify(ICONS)};
 function closeAttachSheet(){
  var sheet = document.getElementById('harness-attach-sheet');
  if (sheet) sheet.hidden = true;
 }
 function openFilePicker(kind){
  var input = document.querySelector('input[type=file]');
  if (!input) return false;
  if (kind === 'camera') { input.setAttribute('accept', 'image/*'); input.setAttribute('capture', 'environment'); }
  else if (kind === 'photo') { input.setAttribute('accept', 'image/*'); input.removeAttribute('capture'); }
  else { input.removeAttribute('accept'); input.removeAttribute('capture'); }
  input.click();
  return true;
 }
 function ensureAttachSheet(){
  var sheet = document.getElementById('harness-attach-sheet');
  if (sheet) return sheet;
  sheet = document.createElement('div');
  sheet.id = 'harness-attach-sheet';
  sheet.hidden = true;
  var scrim = document.createElement('div');
  scrim.className = 'hm-sheet-scrim';
  scrim.onclick = closeAttachSheet;
  var box = document.createElement('div');
  box.className = 'hm-sheet';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', '添加附件');
  hmSheetLabels.forEach(function (entry) {
   var b = document.createElement('button');
   b.type = 'button';
   b.dataset.hmKind = entry[0];
   var ico = document.createElement('span');
   ico.className = 'hm-ico';
   ico.innerHTML = hmSheetIcons[entry[0]];
   var label = document.createElement('span');
   label.textContent = entry[1];
   b.appendChild(ico);
   b.appendChild(label);
   b.addEventListener('click', function () { closeAttachSheet(); openFilePicker(entry[0]); });
   box.appendChild(b);
  });
  sheet.appendChild(scrim);
  sheet.appendChild(box);
  document.body.appendChild(sheet);
  return sheet;
 }
 function openAttachSheet(){
  var sheet = ensureAttachSheet();
  sheet.hidden = false;
 }
 function rightPanelOpen(){`,
  );

  // Capture phase: short tap opens our sheet, long press falls through to the original palette.
  js = js.replace(
    ' function changed(){',
    ` document.addEventListener('pointerdown', function (event) {
  var target = event.target && event.target.closest && event.target.closest('.uV2eYG_add');
  if (target) hmPressAt = Date.now();
 }, true);
 document.addEventListener('click', function (event) {
  var target = event.target && event.target.closest && event.target.closest('.uV2eYG_add');
  if (!target) return;
  if (Date.now() - hmPressAt > 500) return;
  event.preventDefault();
  event.stopPropagation();
  openAttachSheet();
 }, true);
 document.addEventListener('click', function (event) {
  var target = event.target;
  if (target && target.id === 'harness-attach-sheet') closeAttachSheet();
 }, true);
 function changed(){`,
  );

  fs.writeFileSync(jsPath, js, 'utf8');
  console.log('attach sheet js added');
}

const out = fs.readFileSync(jsPath, 'utf8');
console.log(
  JSON.stringify(
    {
      sheet: out.includes('harness-attach-sheet'),
      camera: out.includes("'camera'"),
      capturePhase: out.includes("closest('.uV2eYG_add')"),
      syntaxOk: (() => {
        try {
          new Function(out);
          return true;
        } catch (e) {
          return e.message;
        }
      })(),
    },
    null,
    1,
  ),
);
