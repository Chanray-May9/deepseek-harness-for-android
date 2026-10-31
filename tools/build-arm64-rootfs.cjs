// Build the arm64 runtime rootfs: Ubuntu base + glibc Node 24.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const WORK = path.join(ROOT, 'build', 'arm64');
const ROOTFS = path.join(WORK, 'rootfs');
const OUT = path.join(WORK, 'rootfs-arm64.tar.gz');

fs.rmSync(ROOTFS, { recursive: true, force: true });
fs.mkdirSync(ROOTFS, { recursive: true });

console.log('1/4 extract ubuntu base (arm64)');
execFileSync('tar', ['-xzf', path.join(WORK, 'ubuntu-base-arm64.tar.gz'), '-C', ROOTFS], { stdio: 'inherit' });

console.log('2/4 extract node (arm64)');
const nodeDir = path.join(WORK, 'node');
fs.rmSync(nodeDir, { recursive: true, force: true });
fs.mkdirSync(nodeDir, { recursive: true });
execFileSync('tar', ['-xJf', path.join(WORK, 'node-arm64.tar.xz'), '-C', nodeDir, '--strip-components=1'], { stdio: 'inherit' });

console.log('3/4 install node into the rootfs');
const dest = path.join(ROOTFS, 'usr', 'local');
for (const sub of ['bin', 'lib', 'include', 'share']) {
  fs.mkdirSync(path.join(dest, sub), { recursive: true });
}
execFileSync('tar', ['-cJf', path.join(WORK, 'node-stage.tar.xz'), '-C', nodeDir, '.'], { stdio: 'inherit' });
execFileSync('tar', ['-xJf', path.join(WORK, 'node-stage.tar.xz'), '-C', dest], { stdio: 'inherit' });
fs.rmSync(path.join(WORK, 'node-stage.tar.xz'), { force: true });

// make sure npm/npx links resolve inside the image
const link = path.join(ROOTFS, 'usr', 'bin', 'node');
try {
  fs.mkdirSync(path.dirname(link), { recursive: true });
  fs.symlinkSync('/usr/local/bin/node', link);
} catch (e) {
  console.log('symlink note:', e.message);
}

console.log('4/4 repack rootfs-arm64.tar.gz');
execFileSync('tar', ['-czf', OUT, '-C', ROOTFS, '.'], { stdio: 'inherit' });

const nodeBin = path.join(ROOTFS, 'usr', 'local', 'bin', 'node');
const stat = fs.statSync(OUT);
console.log(
  JSON.stringify(
    {
      rootfs: path.basename(OUT),
      mb: +(stat.size / 1048576).toFixed(2),
      nodePresent: fs.existsSync(nodeBin),
      nodeMb: +(fs.statSync(nodeBin).size / 1048576).toFixed(1),
    },
    null,
    1,
  ),
);
