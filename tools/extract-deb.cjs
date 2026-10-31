// Extract data.tar.* from a .deb (ar archive) without external tools.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const file = process.argv[2];
const outDir = process.argv[3];
if (!file || !outDir) {
  console.error('usage: extract-deb.cjs <deb> <outDir>');
  process.exit(1);
}

const buf = fs.readFileSync(file);
if (buf.toString('ascii', 0, 8) !== '!<arch>\n') {
  console.error('not an ar archive');
  process.exit(1);
}

let off = 8;
let dataMember = null;
while (off + 60 <= buf.length) {
  const name = buf.toString('ascii', off, off + 16).trim();
  const size = parseInt(buf.toString('ascii', off + 48, off + 58).trim(), 10);
  const start = off + 60;
  if (!Number.isFinite(size) || size < 0) break;
  if (name.startsWith('data.tar')) {
    dataMember = { name, start, size };
    break;
  }
  off = start + size + (size % 2);
}
if (!dataMember) {
  console.error('no data.tar member');
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });
const tarPath = path.join(outDir, 'data.tar');
fs.writeFileSync(tarPath, buf.subarray(dataMember.start, dataMember.start + dataMember.size));

// decompress with the platform tar (handles .xz/.gz transparently)
execFileSync('tar', ['-xf', tarPath, '-C', outDir], { stdio: 'inherit' });
fs.unlinkSync(tarPath);

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
const files = walk(outDir).map((p) => path.relative(outDir, p).split(path.sep).join('/'));
console.log(JSON.stringify({ deb: path.basename(file), member: dataMember.name, entries: files.length, sample: files.slice(0, 8) }, null, 1));
