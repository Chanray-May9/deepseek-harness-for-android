// Locate the component that renders the composer overlay palette in the bundle.
const fs = require('node:fs');
const path = require('node:path');

const file = process.argv[2];
const needle = process.argv[3] || 'overlayAnchor';
const src = fs.readFileSync(file, 'utf8');

let count = 0;
let idx = -1;
const hits = [];
while ((idx = src.indexOf(needle, idx + 1)) >= 0) {
  count++;
  if (hits.length < 6) {
    const from = Math.max(0, idx - 180);
    const to = Math.min(src.length, idx + 180);
    hits.push({ at: idx, snippet: src.slice(from, to).replace(/\s+/g, ' ') });
  }
}
console.log(JSON.stringify({ file: path.basename(file), bytes: src.length, occurrences: count, hits }, null, 1));
