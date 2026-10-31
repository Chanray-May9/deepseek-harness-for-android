// Stream a sandbox directory out through adb exec-out and save it locally.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ADB = process.env.HARNESS_ADB || 'D:/Program Files/Netease/MuMu/nx_main/adb.exe';
const DEV = process.env.HARNESS_DEVICE || '127.0.0.1:16416';
const PKG = 'com.deepseek.harness.rebuild';

const dir = process.argv[2] || 'usr';
const out = process.argv[3];
if (!out) {
  console.error('usage: stream-tree.cjs <dirUnderFiles> <outTarGz>');
  process.exit(1);
}

const buf = execFileSync(
  ADB,
  ['-s', DEV, 'exec-out', 'run-as', PKG, 'tar', '-czf', '-', '-C', 'files', dir],
  { maxBuffer: 1024 * 1024 * 1024 },
);

fs.writeFileSync(out, buf);
console.log(JSON.stringify({ dir, out: path.basename(out), mb: +(buf.length / 1048576).toFixed(2) }));
