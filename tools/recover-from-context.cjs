// Recover source files verbatim from the exported Codex transcript.
// The transcript renders every PowerShell here-string write as:
//   > - Ran `@'
//   > <code line>
//   > '@ | Set-Content -LiteralPath 'outputs/.../File.java' -Encoding utf8
// This parser reverses exactly that, with no invented content: a block is only
// written when both boundaries are present, otherwise it is reported as partial.
const fs = require('node:fs');
const path = require('node:path');

const SRC = process.argv[2] || 'C:/Users/Powersharp/Desktop/上下文.txt';
const DEST = process.argv[3] || path.join(__dirname, '..', 'recovered');
const MAP = [
  ['outputs/DeepSeekHarness-Android-source/', 'app/'],
  ['work/', '_work/'],
];

const raw = fs.readFileSync(SRC, 'utf8').split(/\r?\n/);
const strip = (line) => line.replace(/^>\s?/, '');

const files = [];
const partials = [];
let cur = null;

const START = /`?`?@'\s*$/; // `@'  or  ``@'
const END = /'@\s*\|\s*Set-Content\s+(?:-LiteralPath\s+)?(?:'([^']+)'|"([^"]+)"|(\S+))/;

function target(rel) {
  let out = rel.replace(/\\/g, '/').replace(/^\.\//, '');
  for (const [from, to] of MAP) {
    if (out.startsWith(from)) return to + out.slice(from.length);
  }
  return '_misc/' + out.replace(/[:*?"<>|]/g, '_');
}

for (let i = 0; i < raw.length; i++) {
  const line = strip(raw[i]);
  const mEnd = line.match(END);
  if (cur) {
    if (mEnd) {
      const rel = mEnd[1] || mEnd[2] || mEnd[3];
      cur.rel = rel;
      files.push(cur);
      cur = null;
      continue;
    }
    // A new here-string starting before the previous one closed: previous was truncated.
    if (START.test(line)) {
      partials.push({ startLine: cur.startLine, rel: '(none)', reason: 'unterminated' });
      cur = null;
    } else {
      cur.lines.push(line);
      continue;
    }
  }
  if (START.test(line)) {
    // Keep only what follows the here-string opener, so the "- Ran `@'" wrapper
    // never leaks into the recovered source.
    const at = line.lastIndexOf("@'");
    const inline = at >= 0 ? line.slice(at + 2) : '';
    cur = { startLine: i + 1, lines: inline.trim() ? [inline] : [] };
  }
}

const results = [];
const seen = new Map();
for (const f of files) {
  const rel = target(f.rel);
  const dest = path.join(DEST, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const body = f.lines.join('\n');
  fs.writeFileSync(dest, body.endsWith('\n') ? body : body + '\n', 'utf8');
  const prev = seen.get(rel);
  seen.set(rel, (prev || 0) + 1);
  results.push({ rel, sourceLine: f.startLine, bytes: Buffer.byteLength(body), version: seen.get(rel) });
}

fs.writeFileSync(path.join(DEST, '_recovery-index.json'), JSON.stringify({ source: SRC, count: results.length, files: results, partials }, null, 1));

console.log('blocks recovered:', results.length);
console.log('partial/truncated:', partials.length);
const byExt = {};
for (const r of results) {
  const ext = (r.rel.match(/\.[A-Za-z0-9]+$/) || ['(none)'])[0].toLowerCase();
  byExt[ext] = byExt[ext] || { n: 0, bytes: 0 };
  byExt[ext].n++;
  byExt[ext].bytes += r.bytes;
}
console.log('by extension:', JSON.stringify(byExt));
console.log('\nlast write wins per path — distinct files: ' + seen.size);
const multi = [...seen.entries()].filter(([, n]) => n > 1);
console.log('paths written more than once:', multi.length);
for (const [rel, n] of multi.slice(0, 20)) console.log(`  ${n}x  ${rel}`);
console.log('\nlargest artifacts:');
for (const r of results.slice().sort((a, b) => b.bytes - a.bytes).slice(0, 25)) {
  console.log(`  ${String(r.bytes).padStart(7)}  line ${String(r.sourceLine).padStart(5)}  ${r.rel}`);
}
