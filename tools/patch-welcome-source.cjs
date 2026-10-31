// Change the welcome copy at its real source: the shipped android-mobile.js
// rewrites "探索未至之境" into the greeting. Also drop the post-render patch.
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const shippedPath = path.join(ROOT, 'build', 'apk-unpack', 'assets', 'android-mobile.js');
let shipped = fs.readFileSync(shippedPath, 'utf8');
const before = shipped;
shipped = shipped.split('你好，让我们开始聊天吧').join('你好，让我们开始构建吧');
if (shipped === before) {
  console.error('shipped copy string not found');
  process.exit(1);
}
fs.writeFileSync(shippedPath, shipped, 'utf8');

// remove the post-render rewrite from the extension
const extPath = path.join(ROOT, 'mobile', 'phone-shell-ext.js');
let ext = fs.readFileSync(extPath, 'utf8');
const fnStart = ext.indexOf('  /* harness-welcome-copy-v1:');
const fnEnd = ext.indexOf('  /* ------------------------------------------------------------- loop --- */');
if (fnStart >= 0 && fnEnd > fnStart) {
  ext = ext.slice(0, fnStart) + ext.slice(fnEnd);
}
ext = ext.replace('    fixWelcomeCopy();\n', '');

fs.writeFileSync(extPath, ext, 'utf8');
try {
  new Function(ext);
  console.log(
    JSON.stringify({
      shippedUpdated: shipped.includes('让我们开始构建吧'),
      postPatchRemoved: !ext.includes('fixWelcomeCopy'),
      syntaxOk: true,
    }),
  );
} catch (e) {
  console.error('syntax error:', e.message);
  process.exit(1);
}
