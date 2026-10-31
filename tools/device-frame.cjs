// Frame-accurate capture: screencap to a file on the device, then pull it.
// The exec-out pipe can return a stale composited frame for hardware-rendered WebView.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ADB = process.env.HARNESS_ADB || 'D:/Program Files/Netease/MuMu/nx_main/adb.exe';
const DEV = process.env.HARNESS_DEVICE || '127.0.0.1:16416';
const OUT = path.resolve(__dirname, '..', 'build', 'device');
const name = process.argv[2] || 'frame';

const remote = '/sdcard/hm-shot.png';
const local = path.join(OUT, name + '.png');
fs.mkdirSync(OUT, { recursive: true });

// Two captures: the first one primes the layer, the second is written.
execFileSync(ADB, ['-s', DEV, 'shell', 'screencap', '-p', remote], { stdio: 'ignore' });
execFileSync(ADB, ['-s', DEV, 'shell', 'rm', '-f', remote], { stdio: 'ignore' });
execFileSync(ADB, ['-s', DEV, 'shell', 'screencap', '-p', remote], { stdio: 'ignore' });
execFileSync(ADB, ['-s', DEV, 'pull', remote, local], { stdio: 'ignore' });
execFileSync(ADB, ['-s', DEV, 'shell', 'rm', '-f', remote], { stdio: 'ignore' });

const buf = fs.readFileSync(local);
console.log(JSON.stringify({ file: path.basename(local), bytes: buf.length, png: buf[0] === 0x89 && buf[1] === 0x50 }));
