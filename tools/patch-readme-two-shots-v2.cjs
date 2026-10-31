// Two shots with matching proportions, side by side in a table so they top-align.
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

<table>
<tr>
<td width="50%"><img src="docs/screenshots/home.png" width="100%" alt="欢迎页" /></td>
<td width="50%"><img src="docs/screenshots/plugins.png" width="100%" alt="插件" /></td>
</tr>
<tr>
<td align="center"><sub>打开应用：标志、开场白、工作区与模式，输入框贴底</sub></td>
<td align="center"><sub>插件页：内置插件可调参，实验性插件用开关启用</sub></td>
</tr>
</table>

`;

s = s.slice(0, start) + section + s.slice(end);
fs.writeFileSync(readme, s, 'utf8');

const drawer = path.join(root, 'docs', 'screenshots', 'drawer.png');
if (fs.existsSync(drawer)) fs.unlinkSync(drawer);

console.log(JSON.stringify({
  shots: ['home.png', 'plugins.png'],
  drawerDeleted: !fs.existsSync(drawer),
  lines: s.split('\n').length,
}));
