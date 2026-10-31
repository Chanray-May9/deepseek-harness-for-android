// Ship the Termux userland inside the APK and unpack it on first run.
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const assets = path.join(ROOT, 'restored', 'installed-0.2.1-android.5', 'app', 'src', 'main', 'assets');
const javaPath = path.join(ROOT, 'restored', 'installed-0.2.1-android.5', 'app', 'src', 'main', 'java', 'com', 'deepseek', 'harness', 'android', 'RuntimeInstaller.java');

// 1. copy the packed termux tree into assets
const src = path.join(ROOT, 'build', 'termux', 'termux-x64.tar.gz');
const dst = path.join(assets, 'termux-x64.tar.gz');
fs.copyFileSync(src, dst);

// 2. unpack it during install, right after the rootfs
let java = fs.readFileSync(javaPath, 'utf8');
if (!java.includes('termux-" + arch')) {
  const anchor = `        progress.update("正在安装 Node.js 24…");`;
  const insert = `        progress.update("正在安装 Termux 环境…");
        try {
            extract(context, "termux-" + arch + ".tar.gz", root.getParentFile(), 0, progress);
        } catch (Exception e) {
            progress.update("Termux 环境安装失败：" + e.getMessage());
        }
`;
  if (!java.includes(anchor)) {
    console.error('installer anchor not found');
    process.exit(1);
  }
  java = java.replace(anchor, insert + anchor);
  fs.writeFileSync(javaPath, java, 'utf8');
}

console.log(
  JSON.stringify({
    assetMb: +(fs.statSync(dst).size / 1048576).toFixed(2),
    javaPatched: java.includes('termux-" + arch'),
  }),
);
