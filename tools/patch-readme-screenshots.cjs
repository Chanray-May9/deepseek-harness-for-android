// Add a screenshots section right after the intro.
const fs = require('node:fs');
const path = require('node:path');

const f = path.join(__dirname, '..', 'README.md');
let s = fs.readFileSync(f, 'utf8');
if (s.includes('docs/screenshots')) {
  console.log('already present');
  process.exit(0);
}

const section = `## 界面

<div align="center">

<img src="docs/screenshots/home.png" width="30%" alt="欢迎页" />
<img src="docs/screenshots/model-picker.png" width="30%" alt="模型选择" />
<img src="docs/screenshots/drawer.png" width="30%" alt="侧栏" />

</div>

左：打开应用时的欢迎页。中：输入框上方的模型与推理等级选择。右：从左侧滑出的侧栏。

`;

const anchor = '## 快速开始';
if (!s.includes(anchor)) {
  console.error('anchor not found');
  process.exit(1);
}
s = s.replace(anchor, section + anchor);
s = s.replace('- [快速开始](#快速开始)', '- [界面](#界面)\n- [快速开始](#快速开始)');

fs.writeFileSync(f, s, 'utf8');
console.log(JSON.stringify({ added: s.includes('docs/screenshots'), lines: s.split('\n').length }));
