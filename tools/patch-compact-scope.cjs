// Scope the single-line pill rules back to the compact state, so focusing the
// composer expands it to the two-row card again (the shipped behaviour).
const fs = require('node:fs');
const path = require('node:path');

const f = path.join(__dirname, '..', 'mobile', 'phone-shell.rc2.css');
let css = fs.readFileSync(f, 'utf8');

const from = /\[data-harness-composer-style=single\] \.uV2eYG_(?!hero)/g;
const before = (css.match(from) || []).length;
css = css.replace(from, '[data-harness-composer-style=single] .uV2eYG_hero[data-harness-compact] .uV2eYG_');
const after = (css.match(/\[data-harness-compact\] \.uV2eYG_/g) || []).length;

fs.writeFileSync(f, css, 'utf8');
console.log(
  JSON.stringify({
    retargeted: before,
    compactScoped: after,
    balanced: (css.match(/\{/g) || []).length === (css.match(/\}/g) || []).length,
  }),
);
