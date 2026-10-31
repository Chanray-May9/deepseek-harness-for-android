// Show only the two shots we can publish: the welcome screen and the cropped
// drawer. Drop the model picker shot — it advertises a stock feature.
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
<img src="docs/screenshots/drawer.png" height="430" alt="侧栏" />

</div>

左：打开应用时的样子——标志、开场白、工作区与模式选择，输入框贴在底部。
右：从左侧滑出的侧栏，新建会话、插件、自动化任务和工作区都在这里。

`;

s = s.slice(0, start) + section + s.slice(end);
fs.writeFileSync(readme, s, 'utf8');

// remove the unused shot
const picker = path.join(root, 'docs', 'screenshots', 'model-picker.png');
if (fs.existsSync(picker)) fs.unlinkSync(picker);

console.log(JSON.stringify({
  referenced: ['home.png', 'drawer.png'],
  pickerDeleted: !fs.existsSync(picker),
  lines: s.split('\n').length,
}));
