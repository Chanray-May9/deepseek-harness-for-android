// Remove the content/code/terminal font-size overrides so dsh keeps its own.
const fs = require('node:fs');
const path = require('node:path');

const f = path.join(__dirname, '..', 'mobile', 'phone-shell.rc2.css');
let css = fs.readFileSync(f, 'utf8');
const before = css.length;

css = css.replace(
  `html[data-harness-android] .wSkVaW_root {
  --dsh-content-font-size: 16px;
  --dsh-code-font-size: 14px;
  --dsh-terminal-font-size: 14px;
}`,
  `/* content / code / terminal font sizes are left to dsh defaults */`,
);

fs.writeFileSync(f, css, 'utf8');
console.log(JSON.stringify({ changed: css.length !== before, stillThere: css.includes('--dsh-content-font-size') }));
