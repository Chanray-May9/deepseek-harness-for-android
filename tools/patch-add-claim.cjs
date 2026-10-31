// Claim the "+" gesture at pointerdown, where the original command palette opens.
const fs = require('node:fs');
const path = require('node:path');

const jsPath = path.join(process.argv[2], 'android-mobile.js');
let js = fs.readFileSync(jsPath, 'utf8');

if (js.includes('/* harness-add-claim-v2 */')) {
  console.log('already patched');
  process.exit(0);
}

const block = `document.addEventListener('pointerdown', function (event) {
 var target = event.target && event.target.closest && event.target.closest('.uV2eYG_add');
 if (!target) return;
 /* harness-add-claim-v2: the original palette opens on pointerdown, so the phone
    sheet has to claim the gesture here; a click-only handler leaves both open. */
 event.preventDefault();
 event.stopPropagation();
 openAttachSheet();
}, true);
document.addEventListener('click', function (event) {
 var target = event.target && event.target.closest && event.target.closest('.uV2eYG_add');
 if (!target) return;
 event.preventDefault();
 event.stopPropagation();
 openAttachSheet();
}, true);`;

const start = js.indexOf("document.addEventListener('pointerdown', function (event) {");
const clickStart = js.indexOf("document.addEventListener('click', function (event) {", start);
const marker = js.indexOf('}, true);', clickStart);
const end = marker < 0 ? -1 : marker + '}, true);'.length;
if (start < 0 || clickStart < 0 || end < 0) {
  console.error('anchor not found');
  process.exit(1);
}
js = js.slice(0, start) + block + js.slice(end);
fs.writeFileSync(jsPath, js, 'utf8');
console.log('patched; changed bytes:', block.length - (end - start));

try {
  new Function(js);
  console.log('syntax ok');
} catch (e) {
  console.error('syntax error:', e.message);
  process.exit(1);
}
