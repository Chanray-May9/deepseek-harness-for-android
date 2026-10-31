// Raise the three top controls by another 20px (inset - 10  ->  inset - 30).
const fs = require('node:fs');
const path = require('node:path');

const f = path.join(__dirname, '..', 'mobile', 'phone-shell.rc2.css');
let css = fs.readFileSync(f, 'utf8');
const before = (css.match(/- 10px\)/g) || []).length;
css = css.split('calc(var(--hm-inset-top, 0px) - 10px)').join('calc(var(--hm-inset-top, 0px) - 30px)');
const after = (css.match(/- 30px\)/g) || []).length;
fs.writeFileSync(f, css, 'utf8');
console.log(JSON.stringify({ replaced: before, nowAt30: after }));
