// Remove every rule that targets the conversation screen. The shipped layout for
// it was fine; my patches were the regression.
const fs = require('node:fs');
const path = require('node:path');

const f = path.join(__dirname, '..', 'mobile', 'phone-shell.rc2.css');
let css = fs.readFileSync(f, 'utf8');

// split into top-level rule blocks and drop those mentioning the conversation selector
const blocks = css.split(/\n(?=[^\s@}][^\n]*\{|@media|@keyframes)/);
let kept = [];
let dropped = 0;
for (const block of blocks) {
  if (block.includes(':not(:has(.pXSMma_root))')) {
    dropped++;
    continue;
  }
  kept.push(block);
}
css = kept.join('\n');
fs.writeFileSync(f, css, 'utf8');

const stillThere = (css.match(/:not\(:has\(\.pXSMma_root\)\)/g) || []).length;
console.log(JSON.stringify({ droppedBlocks: dropped, remaining: stillThere, bytes: css.length }));
