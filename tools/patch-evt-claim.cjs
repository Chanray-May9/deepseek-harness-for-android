// Several capture-phase pointerdown listeners were executing for the same event
// because stopPropagation does not stop siblings on the same node. Install a
// shared claim guard so exactly one of them acts per event.
const fs = require('node:fs');
const path = require('node:path');

const f = path.join(__dirname, '..', 'mobile', 'phone-shell-ext.js');
let js = fs.readFileSync(f, 'utf8');
if (js.includes('harness-evt-claim-v1')) {
  console.log('already present');
  process.exit(0);
}

const guard = '    if (window.__hmClaim === event) return;\n    window.__hmClaim = event;\n';
const pattern = /document\.addEventListener\('pointerdown', function \(event\) \{\n/g;
let count = 0;
js = js.replace(pattern, (m) => {
  count++;
  return m + guard;
});

// same for the click listeners, which had the same problem
const clickPattern = /document\.addEventListener\('click', function \(event\) \{\n/g;
let clickCount = 0;
js = js.replace(clickPattern, (m) => {
  clickCount++;
  return m + '    if (window.__hmClaimClick === event) return;\n    window.__hmClaimClick = event;\n';
});

js = js.replace(
  '  /* ------------------------------------------------------------- loop --- */',
  `  /* harness-evt-claim-v1: one handler per event; siblings on document must not
     all fire for the same tap. */
  /* ------------------------------------------------------------- loop --- */`,
);

fs.writeFileSync(f, js, 'utf8');
try {
  new Function(js);
  console.log(JSON.stringify({ pointerGuards: count, clickGuards: clickCount, syntaxOk: true }));
} catch (e) {
  console.error('syntax error:', e.message);
  process.exit(1);
}
