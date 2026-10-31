// Remove descriptive filler: the section that describes what each screen looks
// like, and the panel blurb that only restates a visual behaviour.
const fs = require('node:fs');
const path = require('node:path');

const f = path.join(__dirname, '..', 'README.md');
let s = fs.readFileSync(f, 'utf8');
const report = {};

// 1. drop 界面一览 entirely
{
  const a = s.indexOf('## 界面一览');
  const b = s.indexOf('## 快速开始');
  if (a >= 0 && b > a) {
    s = s.slice(0, a) + s.slice(b);
    report.uiSection = true;
  }
}

// 2. drop the right-panel subsection
{
  const a = s.indexOf('### 右侧面板');
  const b = s.indexOf('### 附件');
  if (a >= 0 && b > a) {
    s = s.slice(0, a) + s.slice(b);
    report.panelSection = true;
  }
}

// 3. TOC cleanup
s = s.replace('- [界面一览](#界面一览)\n', '');

// 4. any remaining sentence of the same kind
s = s.replace('面板打开时，顶部按钮自动隐藏，避免误触。', '');

fs.writeFileSync(f, s, 'utf8');
report.lines = s.split('\n').length;
report.panelSentenceGone = !s.includes('避免误触');
console.log(JSON.stringify(report));
