// Rebuild the CSS bundle and push it, without going through aapt2.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const A = path.join(ROOT, 'restored', 'installed-0.2.1-android.5', 'app', 'src', 'main', 'assets');
const ADB = process.env.HARNESS_ADB || 'D:/Program Files/Netease/MuMu/nx_main/adb.exe';
const DEV = process.env.HARNESS_DEVICE || '127.0.0.1:16416';
const PKG = 'com.deepseek.harness.rebuild';
const DIST = `/data/user/0/${PKG}/files/linux/opt/harness/node_modules/@deepseek-ai/dsh-web-frontend/dist/assets`;

const shippedCss = fs.readFileSync(path.join(__dirname, '..', 'build', 'apk-unpack', 'assets', 'android-mobile.css'), 'utf8');
const shell = fs.readFileSync(path.join(ROOT, 'mobile', 'phone-shell.rc2.css'), 'utf8');
const css = shippedCss + '\n' + shell;
fs.writeFileSync(path.join(A, 'android-mobile.css'), css, 'utf8');

const shippedJs = fs.readFileSync(path.join(__dirname, '..', 'build', 'apk-unpack', 'assets', 'android-mobile.js'), 'utf8');
const ext = fs.readFileSync(path.join(ROOT, 'mobile', 'phone-shell-ext.js'), 'utf8');
const js = shippedJs + '\n' + ext;
fs.writeFileSync(path.join(A, 'android-mobile.js'), js, 'utf8');

for (const [name, body] of [
  ['android-mobile.css', css],
  ['android-mobile.js', js],
]) {
  execFileSync(ADB, ['-s', DEV, 'shell', 'run-as', PKG, 'tee', `${DIST}/${name}`], {
    input: Buffer.from(body, 'utf8'),
    stdio: ['pipe', 'ignore', 'inherit'],
  });
}

console.log(JSON.stringify({ css: css.length, js: js.length, pushed: true }));
