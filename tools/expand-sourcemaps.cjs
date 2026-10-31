// Expand every bundled source map back into the original source files.
// Only maps that actually carry `sourcesContent` can be inverted; those are
// written out verbatim. Maps without embedded content are reported, not guessed.
const fs = require('node:fs');
const path = require('node:path');

const ROOT = process.argv[2];
const OUT = process.argv[3];
const LIMIT = Number(process.argv[4] || 0);

fs.mkdirSync(OUT, { recursive: true });

const maps = [];
(function walk(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.map')) maps.push(p);
  }
})(ROOT);

const stats = { maps: maps.length, withContent: 0, withoutContent: 0, written: 0, bytes: 0, failed: 0 };
const skipped = [];
const writtenDirs = new Map();

const sanitize = (s) =>
  s
    .replace(/^webpack:\/\//, '')
    .replace(/^\.\.\//g, '')
    .replace(/^\/+/, '')
    .split(/[\\/]+/)
    .filter((x) => x && x !== '..' && x !== '.')
    .join(path.sep);

for (const mapFile of maps) {
  if (LIMIT && stats.maps > LIMIT) break;
  let map;
  try {
    map = JSON.parse(fs.readFileSync(mapFile, 'utf8'));
  } catch {
    stats.failed++;
    continue;
  }
  const relDir = path.dirname(path.relative(ROOT, mapFile));
  if (!Array.isArray(map.sourcesContent) || !map.sourcesContent.length) {
    stats.withoutContent++;
    if (skipped.length < 25) skipped.push(path.relative(ROOT, mapFile));
    continue;
  }
  stats.withContent++;
  const base = path.join(OUT, relDir);
  for (let i = 0; i < map.sources.length; i++) {
    const content = map.sourcesContent[i];
    if (typeof content !== 'string') continue;
    const rel = sanitize(map.sources[i] || `unnamed_${i}.txt`);
    if (!rel) continue;
    const dest = path.join(base, rel);
    if (!dest.startsWith(OUT + path.sep)) continue;
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, content, 'utf8');
    stats.written++;
    stats.bytes += Buffer.byteLength(content);
    writtenDirs.set(relDir, (writtenDirs.get(relDir) || 0) + 1);
  }
}

const report = {
  ...stats,
  bytesMB: +(stats.bytes / 1048576).toFixed(1),
  mapsWithoutEmbeddedContent: skipped,
  topDirs: [...writtenDirs.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15),
};
fs.writeFileSync(path.join(OUT, '_expand-report.json'), JSON.stringify(report, null, 1));
console.log(JSON.stringify({ ...report, mapsWithoutEmbeddedContent: undefined }, null, 2));
console.log('examples without content:', skipped.slice(0, 10));
