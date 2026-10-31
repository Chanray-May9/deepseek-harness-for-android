// Prefix the home-screen layout rules with :has(.pXSMma_root) so the shipped
// conversation layout is left completely untouched.
const fs = require('node:fs');
const path = require('node:path');

const f = path.join(__dirname, '..', 'mobile', 'phone-shell.rc2.css');
let css = fs.readFileSync(f, 'utf8');
if (css.includes('/* harness-home-scope-v1 */')) {
  console.log('already present');
  process.exit(0);
}

const targets = [
  '.wSkVaW_header',
  '.wSkVaW_scrollBody',
  '.wSkVaW_composerSeat',
  '.wSkVaW_composerStack',
  '.wSkVaW_composerHero',
  '.pXSMma_root',
  '.pXSMma_headline',
  '.pXSMma_fish',
  '.pXSMma_workspace',
  '.wSkVaW_heroWorkspaceRow',
];

let changed = 0;
for (const sel of targets) {
  const pattern = new RegExp(`^(html\\[data-harness-android\\])(\\s+)${sel.replace('.', '\\.')}\\s*\\{`, 'gm');
  css = css.replace(pattern, (m, a, sp, ...rest) => {
    changed++;
    return `${a}:has(.pXSMma_root) ${sel} {`;
  });
}

css += `
/* harness-home-scope-v1: the rules above now only apply to the welcome screen;
   conversations keep the shipped layout. */
`;

fs.writeFileSync(f, css, 'utf8');
console.log(JSON.stringify({ rewritten: changed, bytes: css.length }));
