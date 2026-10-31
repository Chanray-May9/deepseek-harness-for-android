// Scan the exported Codex transcript for recoverable source artifacts (read-only).
const fs = require('node:fs');
const path = require('node:path');

const SRC = process.argv[2] || 'C:/Users/Powersharp/Desktop/上下文.txt';
const OUT = process.argv[3] || path.join(__dirname, '..', 'build', 'context-scan');
fs.mkdirSync(OUT, { recursive: true });

const text = fs.readFileSync(SRC, 'utf8');
const lines = text.split(/\r?\n/);

const stats = {
  bytes: Buffer.byteLength(text),
  lines: lines.length,
  hereStrings: 0,
  setContentWrites: 0,
  nodeInline: 0,
  javaBlocks: 0,
  cssBlocks: 0,
  jsBlocks: 0,
  kotlinBlocks: 0,
  ymlBlocks: 0,
  powershellBlocks: 0,
};

// 1) PowerShell here-strings piped into Set-Content: the main source channel.
const writeRe = /@'\r?\n([\s\S]*?)\r?\n'@\s*\|\s*Set-Content\s+(?:-LiteralPath\s+)?(?:'([^']+)'|"([^"]+)"|(\S+))/g;
const writes = [];
let m;
while ((m = writeRe.exec(text))) {
  const body = m[1];
  const rel = m[2] || m[3] || m[4];
  stats.hereStrings++;
  stats.setContentWrites++;
  const kind = /^\s*(package |import java|public |class |final class )/m.test(body)
    ? 'java'
    : /^[^{]*\{[\s\S]*[\w-]+\s*:.*;/m.test(body) && /@media|--[a-z-]+:|#[0-9a-f]{3,8}/i.test(body)
      ? 'css'
      : /function |=>|const |let |var |require\(|document\./m.test(body)
        ? 'js'
        : 'other';
  if (kind === 'java') stats.javaBlocks++;
  if (kind === 'css') stats.cssBlocks++;
  if (kind === 'js') stats.jsBlocks++;
  writes.push({ rel, kind, bytes: Buffer.byteLength(body), firstLine: body.split(/\r?\n/)[0].slice(0, 120) });
}

// 2) node -e "..." and node <<heredoc inline scripts (JS/Node logic, not files).
stats.nodeInline = (text.match(/node -e "/g) || []).length;

// 3) ``` fenced blocks, by language.
const fenceRe = /```([a-zA-Z]*)\r?\n([\s\S]*?)```/g;
const fences = [];
while ((m = fenceRe.exec(text))) {
  fences.push({ lang: m[1] || '(none)', bytes: Buffer.byteLength(m[2]) });
  if (m[1] === 'kotlin') stats.kotlinBlocks++;
  if (m[1] === 'yaml' || m[1] === 'yml') stats.ymlBlocks++;
  if (m[1] === 'powershell' || m[1] === 'ps1') stats.powershellBlocks++;
}

// 4) Tool-write log lines ("Wrote `./path`").
const wroteRe = /Wrote\s+`([^`]+)`/g;
const wrote = [];
while ((m = wroteRe.exec(text))) wrote.push(m[1]);

const byExt = {};
for (const w of writes) {
  const ext = (w.rel.match(/\.[a-z0-9]+$/i) || ['(none)'])[0].toLowerCase();
  byExt[ext] = byExt[ext] || { count: 0, bytes: 0 };
  byExt[ext].count++;
  byExt[ext].bytes += w.bytes;
}

fs.writeFileSync(path.join(OUT, 'writes.json'), JSON.stringify(writes, null, 1));
fs.writeFileSync(path.join(OUT, 'stats.json'), JSON.stringify({ stats, byExt, fences: fences.slice(0, 40), wrote: wrote.slice(0, 60) }, null, 1));

console.log('FILE', SRC, stats.bytes, 'bytes /', stats.lines, 'lines');
console.log('here-string writes:', stats.setContentWrites);
console.log('detected kinds: java=' + stats.javaBlocks, 'css=' + stats.cssBlocks, 'js=' + stats.jsBlocks);
console.log('node -e inline:', stats.nodeInline, ' fenced blocks:', fences.length);
console.log('\nBY EXTENSION');
for (const [k, v] of Object.entries(byExt).sort((a, b) => b[1].bytes - a[1].bytes)) {
  console.log(`  ${k.padEnd(10)} count=${String(v.count).padStart(3)} bytes=${v.bytes}`);
}
console.log('\nTOP 40 ARTIFACTS BY SIZE');
for (const w of writes.slice().sort((a, b) => b.bytes - a.bytes).slice(0, 40)) {
  console.log(`  ${String(w.bytes).padStart(7)}  ${w.kind.padEnd(5)}  ${w.rel}`);
}
console.log('\nWROTE-LOG PATHS (first 20)');
console.log(wrote.slice(0, 20).join('\n'));
