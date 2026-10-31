// Enumerate workspace / directory RPC method names used by the client bundles.
const fs = require('node:fs');
const path = require('node:path');

const base = process.argv[2];
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.js')) files.push(p);
  }
})(base);

const methods = new Set();
for (const f of files) {
  const s = fs.readFileSync(f, 'utf8');
  for (const m of s.matchAll(/['"`](workspace\/[A-Za-z]+)['"`]/g)) methods.add(m[1]);
  for (const m of s.matchAll(/['"`](directoryPicker\/[A-Za-z]+)['"`]/g)) methods.add(m[1]);
  for (const m of s.matchAll(/['"`](session\/create)['"`]/g)) methods.add(m[1]);
}
console.log('methods:\n  ' + [...methods].sort().join('\n  '));

// Where is initializeDefault referenced at all?
const hits = [];
for (const f of files) {
  const s = fs.readFileSync(f, 'utf8');
  const i = s.indexOf('initializeDefault');
  if (i >= 0) hits.push({ file: path.relative(base, f), at: i });
}
console.log('\ninitializeDefault references:', JSON.stringify(hits, null, 1));
