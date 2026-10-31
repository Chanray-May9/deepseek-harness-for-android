// Pack a directory inside the app sandbox and pull it back as bytes.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ADB = process.env.HARNESS_ADB || 'D:/Program Files/Netease/MuMu/nx_main/adb.exe';
const DEV = process.env.HARNESS_DEVICE || '127.0.0.1:16416';
const PKG = 'com.deepseek.harness.rebuild';

const remoteName = process.argv[2] || 'termux-x64.tar.gz';
const localOut = process.argv[3];
const srcDir = process.argv[4] || 'usr';

execFileSync(ADB, ['-s', DEV, 'shell', 'run-as', PKG, 'sh', '-c', `cd files && tar -czf ${remoteName} ${srcDir}`], {
  stdio: 'inherit',
});

const buf = execFileSync(ADB, ['-s', DEV, 'exec-out', 'run-as', PKG, 'cat', `files/${remoteName}`], {
  maxBuffer: 512 * 1024 * 1024,
});
fs.writeFileSync(localOut, buf);
execFileSync(ADB, ['-s', DEV, 'shell', 'run-as', PKG, 'rm', '-f', `files/${remoteName}`], { stdio: 'ignore' });

console.log(JSON.stringify({ out: path.basename(localOut), mb: +(buf.length / 1048576).toFixed(2) }));
