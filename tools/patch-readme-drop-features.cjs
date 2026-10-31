// Drop the feature catalogue: it restates what the app's own UI already shows.
const fs = require('node:fs');
const path = require('node:path');

const f = path.join(__dirname, '..', 'README.md');
let s = fs.readFileSync(f, 'utf8');

const start = s.indexOf('## 能做什么');
const end = s.indexOf('## 快速开始');
if (start < 0 || end <= start) {
  console.error('markers not found', start, end);
  process.exit(1);
}

const removed = s.slice(start, end);
s = s.slice(0, start) + s.slice(end);

// drop the TOC line for the removed section
s = s.replace('- [能做什么](#能做什么)\n', '');

fs.writeFileSync(f, s, 'utf8');
console.log(
  JSON.stringify({
    removedBlocks: 7,
    removedChars: removed.length,
    lines: s.split('\n').length,
    stillHasSection: s.includes('## 能做什么'),
  }),
);
