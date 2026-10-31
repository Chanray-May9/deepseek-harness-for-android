// Compare the rebuilt APK against the installed original, entry by entry.
const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');
const zip = require(path.join(__dirname, 'node_modules', 'fflate'));

const original = process.argv[2];
const rebuilt = process.argv[3];
const out = process.argv[4];

const a = zip.unzipSync(fs.readFileSync(original));
const b = zip.unzipSync(fs.readFileSync(rebuilt));
const sha = (buf) => crypto.createHash('sha256').update(Buffer.from(buf)).digest('hex');

const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort();
const rows = keys.map((k) => {
  const A = a[k] ? sha(a[k]) : null;
  const B = b[k] ? sha(b[k]) : null;
  return { entry: k, inOriginal: !!a[k], inRebuilt: !!b[k], bytesA: a[k] ? a[k].length : 0, bytesB: b[k] ? b[k].length : 0, identical: A && B ? A === B : false };
});

const group = (prefix) => rows.filter((r) => r.entry.startsWith(prefix));
const summary = (prefix) => {
  const g = group(prefix);
  return { entries: g.length, identical: g.filter((r) => r.identical).length, differing: g.filter((r) => !r.identical && r.inOriginal && r.inRebuilt).length };
};

const report = {
  original: path.basename(original),
  rebuilt: path.basename(rebuilt),
  assets: summary('assets/'),
  nativeLibs: summary('lib/'),
  resources: summary('res/'),
  overall: {
    entriesOriginal: Object.keys(a).length,
    entriesRebuilt: Object.keys(b).length,
    identical: rows.filter((r) => r.identical).length,
    onlyInOriginal: rows.filter((r) => r.inOriginal && !r.inRebuilt).map((r) => r.entry),
    onlyInRebuilt: rows.filter((r) => !r.inOriginal && r.inRebuilt).map((r) => r.entry),
    differing: rows.filter((r) => r.inOriginal && r.inRebuilt && !r.identical).map((r) => ({ entry: r.entry, bytesA: r.bytesA, bytesB: r.bytesB })),
  },
};
fs.writeFileSync(out, JSON.stringify(report, null, 1));
console.log(JSON.stringify(report, null, 2));
