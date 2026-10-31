// Capture device screenshots as raw PNG bytes (no shell redirection damage).
// Read-only: never installs, uninstalls, clears data or force-stops the package.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ADB = process.env.HARNESS_ADB || 'D:/Program Files/Netease/MuMu/nx_main/adb.exe';
const DEV = process.env.HARNESS_DEVICE || '127.0.0.1:16416';
const OUT = path.resolve(__dirname, '..', 'build', 'device');
fs.mkdirSync(OUT, { recursive: true });

const name = process.argv[2] || 'shot';
const file = path.join(OUT, name + '.png');
const buf = execFileSync(ADB, ['-s', DEV, 'exec-out', 'screencap', '-p'], { maxBuffer: 64 * 1024 * 1024 });
fs.writeFileSync(file, buf);
console.log('saved', file, buf.length, 'bytes', 'png=' + (buf[0] === 0x89 && buf[1] === 0x50));
