// Own the compact decision instead of relying on the shipped heuristic.
const fs = require('node:fs');
const path = require('node:path');

const f = path.join(__dirname, '..', 'mobile', 'phone-shell-ext.js');
let js = fs.readFileSync(f, 'utf8');
if (js.includes('/* harness-compact-own-v1 */')) {
  console.log('already present');
  process.exit(0);
}

js = js.replace(
  '  /* ------------------------------------------------------------- loop --- */',
  `  /* --------------------------------------------------------- compact --- */
  /* harness-compact-own-v1: the shipped rule depends on focus and popover state
     that change under us, so decide here and keep the attribute authoritative. */
  function updateCompact() {
    var hero = q('.uV2eYG_hero');
    if (!hero) return;
    var single = document.documentElement.getAttribute('data-harness-composer-style') === 'single';
    var input = hero.querySelector('[data-composer-input]');
    var text = input ? (input.innerText || '').trim() : '';
    var focused = hero.contains(document.activeElement);
    var expanded = !!hero.querySelector('[aria-expanded="true"]');
    var attachments = hero.querySelector('[data-slot="conversation.input.attachments"]');
    var hasFiles = !!(attachments && attachments.childElementCount);
    var want = single && !text && !focused && !expanded && !hasFiles;
    if (hero.hasAttribute('data-harness-compact') !== want) {
      hero.toggleAttribute('data-harness-compact', want);
    }
  }

  /* ------------------------------------------------------------- loop --- */`,
);

js = js.replace('    ensureCapsule();\n    dismissGate();', '    ensureCapsule();\n    updateCompact();\n    dismissGate();');

fs.writeFileSync(f, js, 'utf8');
try {
  new Function(js);
  console.log(JSON.stringify({ installed: js.includes('updateCompact'), wired: js.includes('updateCompact();'), syntaxOk: true }, null, 1));
} catch (e) {
  console.error('syntax error:', e.message);
  process.exit(1);
}
