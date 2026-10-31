// Align the shell with the measured reference: whale 45x34 logical at 42% height,
// round controls ~42 logical instead of 48.
const fs = require('node:fs');
const path = require('node:path');

const cssPath = path.join(__dirname, '..', 'mobile', 'phone-shell.rc2.css');
let css = fs.readFileSync(cssPath, 'utf8');
const before = css;

css = css.replace('--hm-hit: 48px;', '--hm-hit: 42px;');
css = css.replace(/(\.pXSMma_fish \{[^}]*?width:\s*)54px/, '$145px');
css = css.replace(/margin-top:\s*15vh;/, 'margin-top: 25vh;');
// whale height follows its aspect ratio; make sure no fixed height fights it
css = css.replace(/(\.pXSMma_fish \{[^}]*?height:\s*)auto/, '$1auto');

if (css === before) {
  console.error('no rule changed');
  process.exit(1);
}
fs.writeFileSync(cssPath, css, 'utf8');

const check = (re) => (css.match(re) || ['(missing)'])[0];
console.log(
  JSON.stringify(
    {
      hit: check(/--hm-hit:\s*\d+px/),
      fish: check(/\.pXSMma_fish \{[^}]*?width:\s*\d+px/).replace(/\s+/g, ' '),
      heroOffset: check(/margin-top:\s*\d+vh/),
      balanced: (css.match(/\{/g) || []).length === (css.match(/\}/g) || []).length,
    },
    null,
    1,
  ),
);
