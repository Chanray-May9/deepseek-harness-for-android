// Smaller images, no captions.
const fs = require('node:fs');
const path = require('node:path');

const readme = path.join(__dirname, '..', 'README.md');
let s = fs.readFileSync(readme, 'utf8');

const start = s.indexOf('## 界面');
const end = s.indexOf('## 快速开始');
if (start < 0 || end <= start) {
  console.error('markers not found');
  process.exit(1);
}

const section = `## 界面

<p align="center">
<img src="docs/screenshots/home.png" width="28%" />
<img src="docs/screenshots/plugins.png" width="28%" />
</p>

`;

s = s.slice(0, start) + section + s.slice(end);
fs.writeFileSync(readme, s, 'utf8');
console.log(JSON.stringify({ lines: s.split('\n').length, captions: s.includes('<sub>') }));
