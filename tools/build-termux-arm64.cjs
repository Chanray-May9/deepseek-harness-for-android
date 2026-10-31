// Build termux-arm64.tar.gz: bootstrap + proot components + real symlinks.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const WORK = path.join(ROOT, 'build', 'arm64');
const USR = path.join(WORK, 'usr');
const OUT = path.join(WORK, 'termux-arm64.tar.gz');

fs.rmSync(USR, { recursive: true, force: true });
fs.mkdirSync(USR, { recursive: true });

// 1. unpack the bootstrap zip into usr/
const zip = path.join(ROOT, 'build', 'termux', 'bootstrap-aarch64.zip');
const tmp = path.join(WORK, 'bs');
fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(tmp, { recursive: true });
execFileSync('tar', ['-xf', zip, '-C', tmp], { stdio: 'inherit' });
for (const entry of fs.readdirSync(tmp)) {
  fs.renameSync(path.join(tmp, entry), path.join(USR, entry));
}
fs.rmSync(tmp, { recursive: true, force: true });

// 2. recreate the symlinks listed in SYMLINKS.txt
const table = fs.readFileSync(path.join(USR, 'SYMLINKS.txt'), 'utf8').split('\n').map((l) => l.trim()).filter(Boolean);
let made = 0;
let failed = 0;
for (const line of table) {
  const at = line.indexOf('\u2190');
  if (at < 0) continue;
  const target = line.slice(0, at).trim();
  const link = line.slice(at + 1).trim();
  if (!target || !link) continue;
  const abs = path.resolve(USR, link);
  if (!abs.startsWith(USR)) continue;
  try {
    fs.rmSync(abs, { force: true });
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.symlinkSync(target, abs);
    made++;
  } catch (e) {
    failed++;
  }
}

// 3. drop in the aarch64 proot components
const deb = path.join(ROOT, 'build', 'termux', 'deb');
const copy = (from, to) => {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
};
const prootRoot = path.join(deb, 'proot-aarch64', 'data', 'data', 'com.termux', 'files', 'usr');
const tallocRoot = path.join(deb, 'talloc-aarch64', 'data', 'data', 'com.termux', 'files', 'usr');
const shmemRoot = path.join(deb, 'shmem-aarch64', 'data', 'data', 'com.termux', 'files', 'usr');

copy(path.join(prootRoot, 'bin', 'proot'), path.join(USR, 'bin', 'proot'));
copy(path.join(prootRoot, 'libexec', 'proot', 'loader'), path.join(USR, 'libexec', 'proot', 'loader'));
copy(path.join(prootRoot, 'libexec', 'proot', 'loader32'), path.join(USR, 'libexec', 'proot', 'loader32'));
copy(path.join(tallocRoot, 'lib', 'libtalloc.so.2'), path.join(USR, 'lib', 'libtalloc.so.2'));
copy(path.join(shmemRoot, 'lib', 'libandroid-shmem.so'), path.join(USR, 'lib', 'libandroid-shmem.so'));

// 4. pack
execFileSync('tar', ['-czf', OUT, '-C', WORK, 'usr'], { stdio: 'inherit' });

console.log(
  JSON.stringify(
    {
      out: path.basename(OUT),
      mb: +(fs.statSync(OUT).size / 1048576).toFixed(2),
      symlinks: { made, failed },
      prootIncluded: fs.existsSync(path.join(USR, 'bin', 'proot')),
      loaderIncluded: fs.existsSync(path.join(USR, 'libexec', 'proot', 'loader')),
    },
    null,
    1,
  ),
);
