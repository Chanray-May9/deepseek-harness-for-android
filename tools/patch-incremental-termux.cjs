// Insert the incremental Termux install into the guard block, line-based so
// whitespace differences cannot break the match.
const fs = require('node:fs');
const path = require('node:path');

const f = path.join(__dirname, '..', 'restored', 'installed-0.2.1-android.5', 'app', 'src', 'main', 'java', 'com', 'deepseek', 'harness', 'android', 'RuntimeInstaller.java');
const lines = fs.readFileSync(f, 'utf8').split(/\r?\n/);

if (lines.some((l) => l.includes('Termux 环境后加入'))) {
  console.log('already patched');
  process.exit(0);
}

const idx = lines.findIndex((l) => l.includes('if (file.isFile()) {'));
if (idx < 0) {
  console.error('guard not found');
  process.exit(1);
}
const ret = lines.findIndex((l, i) => i > idx && l.trim() === 'return;');
if (ret < 0) {
  console.error('return not found');
  process.exit(1);
}

const insert = [
  '            // Termux 环境后加入：标记存在时也确保它已安装（幂等、增量）。',
  '            File termuxBash = new File(context.getFilesDir(), "usr/bin/bash");',
  '            if (!termuxBash.isFile()) {',
  '                progress.update("正在安装 Termux 环境…");',
  '                try {',
  '                    extract(context, "termux-" + arch + ".tar.gz", context.getFilesDir(), 0, progress);',
  '                } catch (Exception e) {',
  '                    progress.update("Termux 环境安装失败：" + e.getMessage());',
  '                }',
  '            }',
];

lines.splice(ret, 0, ...insert);
fs.writeFileSync(f, lines.join('\n'), 'utf8');
console.log(JSON.stringify({ patchedAt: ret + 1, hasIncremental: true }));
