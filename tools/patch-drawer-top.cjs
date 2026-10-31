// Tighten the drawer's top spacing so the logo sits right under the status bar.
const fs = require('node:fs');
const path = require('node:path');

const f = path.join(__dirname, '..', 'mobile', 'phone-shell.rc2.css');
let css = fs.readFileSync(f, 'utf8');
const before = css;

css = css.replace(
  'padding: calc(var(--hm-inset-top, 0px) + 8px) 10px var(--hm-inset-bottom, 0px) !important;',
  'padding: calc(var(--hm-inset-top, 0px) - 16px) 10px var(--hm-inset-bottom, 0px) !important;',
);
css = css.replace(
  'right: 10px !important;\n  top: calc(var(--hm-inset-top, 0px) + 10px) !important;',
  'right: 10px !important;\n  top: calc(var(--hm-inset-top, 0px) - 10px) !important;',
);

if (css === before) {
  console.error('no replacements applied');
  process.exit(1);
}
fs.writeFileSync(f, css, 'utf8');
console.log(
  JSON.stringify({
    navPad: css.includes('inset-top, 0px) - 16px'),
    toggleTop: css.includes('inset-top, 0px) - 10px'),
    balanced: (css.match(/\{/g) || []).length === (css.match(/\}/g) || []).length,
  }),
);
