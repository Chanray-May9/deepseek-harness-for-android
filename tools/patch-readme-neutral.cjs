// State facts only: no invitation, no requirements on anyone.
const fs = require('node:fs');
const path = require('node:path');

const f = path.join(__dirname, '..', 'README.md');
let s = fs.readFileSync(f, 'utf8');

// 1. remove the invitation banner under the intro
s = s.replace(/\n> 项目仍在早期，欢迎一起贡献：\[参与这个项目\]\(#参与这个项目\)\n/, '\n');

// 2. replace the whole contribution section with a factual map
const start = s.indexOf('## 参与这个项目');
const end = s.indexOf('## 致谢');
if (start < 0 || end <= start) {
  console.error('markers not found', start, end);
  process.exit(1);
}

const replacement = `## 代码位置

改东西的时候大致是这几个入口：

| 想改什么 | 改哪个文件 |
| --- | --- |
| 界面观感 | \`mobile/phone-shell.rc2.css\` |
| 交互逻辑 | \`mobile/phone-shell-ext.js\` |
| 运行环境 | \`RuntimeInstaller.java\` |
| 安卓能力 | \`MainActivity.java\` |

界面改动用 \`tools/sync-shell.cjs\` 推到设备上看效果，看完记得冷启动。

## 还没解决的问题

上面「已知限制」里列的都没解决。其中这三项改起来相对独立：

1. 把 \`$PREFIX\` 和手机共享存储挂进 PRoot（改 \`RuntimeInstaller\` 的挂载参数）
2. 横屏与大屏的布局适配（改 CSS 的媒体查询）
3. 首次启动速度（分析解包耗时分布，找可压缩的部分）

`;

s = s.slice(0, start) + replacement + s.slice(end);

// 3. TOC entry rename
s = s.replace('- [参与这个项目](#参与这个项目)', '- [代码位置](#代码位置)');

fs.writeFileSync(f, s, 'utf8');
console.log(JSON.stringify({
  lines: s.split('\n').length,
  bannerGone: !s.includes('欢迎一起贡献'),
  inviteGone: !s.includes('欢迎大家一起来贡献'),
  oldSectionGone: !s.includes('## 参与这个项目'),
}));
