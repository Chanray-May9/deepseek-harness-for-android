// Build a device-side symlink script from the bootstrap's SYMLINKS.txt.
// Format is "<target>\u2190<link>", one per line (Termux uses U+2190).
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const zip = process.argv[2];
const out = process.argv[3];
if (!zip || !out) {
  console.error('usage: build-symlinks.cjs <bootstrap.zip> <out.sh>');
  process.exit(1);
}

const work = path.join(path.dirname(out), 'symlinks-tmp');
fs.rmSync(work, { recursive: true, force: true });
fs.mkdirSync(work, { recursive: true });
execFileSync('tar', ['-xf', zip, '-C', work, 'SYMLINKS.txt'], { stdio: 'inherit' });

const table = fs.readFileSync(path.join(work, 'SYMLINKS.txt'), 'utf8');
const lines = table.split('\n').map((l) => l.trim()).filter(Boolean);

const sh = ["#!/system/bin/sh", 'cd "$(pwd)/files/usr" || exit 1', 'n=0'];
let parsed = 0;
for (const line of lines) {
  const idx = line.indexOf('\u2190');
  if (idx < 0) continue;
  const target = line.slice(0, idx).trim();
  const link = line.slice(idx + 1).trim();
  if (!target || !link) continue;
  parsed++;
  const q = (s) => `'${s.replace(/'/g, "'\\''")}'`;
  sh.push(`ln -sf ${q(target)} ${q(link)} && n=$((n+1))`);
}
sh.push('echo "links=$n of ' + parsed + '"');
fs.writeFileSync(out, sh.join('\n') + '\n', 'utf8');
fs.rmSync(work, { recursive: true, force: true });
console.log(JSON.stringify({ tableLines: lines.length, parsed, scriptBytes: fs.statSync(out).size }));
