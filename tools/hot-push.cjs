// Hot-update the phone shell inside the running app (no APK rebuild).
// `run-as <pkg> tee <abs path>` receives the bytes on stdin; no shell redirection,
// so the write happens with the app uid, not the adb shell uid.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ADB = process.env.HARNESS_ADB || 'D:/Program Files/Netease/MuMu/nx_main/adb.exe';
const DEV = process.env.HARNESS_DEVICE || '127.0.0.1:16416';
const PKG = 'com.deepseek.harness.rebuild';
const DIST =
  '/data/user/0/' + PKG + '/files/linux/opt/harness/node_modules/@deepseek-ai/dsh-web-frontend/dist/assets';
const ROOT = path.resolve(__dirname, '..');
const ASSETS = path.join(ROOT, 'restored', 'installed-0.2.1-android.5', 'app', 'src', 'main', 'assets');

const files = process.argv.slice(2).length ? process.argv.slice(2) : ['android-mobile.css', 'android-mobile.js'];
const done = [];
for (const name of files) {
  const buf = fs.readFileSync(path.join(ASSETS, name));
  execFileSync(ADB, ['-s', DEV, 'shell', 'run-as', PKG, 'tee', `${DIST}/${name}`], {
    input: buf,
    stdio: ['pipe', 'ignore', 'inherit'],
  });
  done.push({ name, bytes: buf.length });
}

const listing = execFileSync(
  ADB,
  ['-s', DEV, 'shell', 'run-as', PKG, 'ls', '-l', `${DIST}/android-mobile.css`, `${DIST}/android-mobile.js`],
  { encoding: 'utf8' },
);
console.log(listing.trim());
console.log(JSON.stringify({ pushed: done }));
