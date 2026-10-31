// The conversation body text resolves to 16px by default; lift it one step.
const fs = require('node:fs');
const path = require('node:path');

const f = path.join(__dirname, '..', 'mobile', 'phone-shell.rc2.css');
let css = fs.readFileSync(f, 'utf8');
if (css.includes('/* harness-body-text-v1 */')) {
  console.log('already present');
  process.exit(0);
}
css += `
/* harness-body-text-v1: the default conversation body size reads small on a
   phone; raise it one step without touching layout metrics. */
html[data-harness-android] {
  --dsh-content-font-size: 17px;
}
html[data-harness-android] .wSkVaW_scrollBody {
  font-size: 17px;
}
`;
fs.writeFileSync(f, css, 'utf8');
console.log(JSON.stringify({ added: true, bytes: css.length }));
