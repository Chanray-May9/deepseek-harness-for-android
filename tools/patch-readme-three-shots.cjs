// Three screenshots at a fixed display height so they line up.
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const readme = path.join(root, 'README.md');
let s = fs.readFileSync(readme, 'utf8');

const start = s.indexOf('## 界面');
const end = s.indexOf('## 快速开始');
if (start < 0 || end <= start) {
  console.error('markers not found');
  process.exit(1);
}

const section = `## 界面

<div align="center">

<img src="docs/screenshots/home.png" height="430" alt="欢迎页" />
<img src="docs/screenshots/plugins.png" height="430" alt="插件" />
<img src="docs/screenshots/drawer.png" height="430" alt="侧栏" />

</div>

**左**：打开应用的样子——标志、开场白、工作区与模式，输入框贴在底部。
**中**：插件页。内置插件（子智能体、网页搜索、Agent 循环、终端）可以直接调参，实验性插件用开关启用。
**右**：从左侧滑出的侧栏，新建会话、插件、自动化任务与工作区都在这里。

`;

s = s.slice(0, start) + section + s.slice(end);
fs.writeFileSync(readme, s, 'utf8');
console.log(JSON.stringify({
  shots: ['home.png', 'plugins.png', 'drawer.png'],
  lines: s.split('\n').length,
}));
