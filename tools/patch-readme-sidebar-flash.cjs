// Tell readers that the sidebar opens and closes once by itself on startup.
const fs = require('node:fs');
const path = require('node:path');

const f = path.join(__dirname, '..', 'README.md');
let s = fs.readFileSync(f, 'utf8');
let changed = 0;

const oldUsage = `### 打开侧栏

点左上角的图标展开，再点一次收起。

如果发现侧栏收起后模型选择点不动，点一下侧栏图标再关掉，就能恢复。这是上游组件的一个状态问题，当前版本已在启动时自动处理过一次。`;

const newUsage = `### 打开侧栏

点左上角的图标展开，再点一次收起。

**启动时会看到侧栏自己开了一次又关掉**——这是正常现象，不是 bug。原因是模型选择器要等侧栏被开关过一次才进入可用状态，所以应用启动几秒后会替你开关一次。整个过程不到一秒，之后侧栏完全由你控制。`;

if (s.includes(oldUsage)) {
  s = s.replace(oldUsage, newUsage);
  changed++;
}

const anchor = '**界面一直停在"连接较慢"**';
const faq = `**打开应用时左侧边栏自己闪了一下，正常吗？**

正常。应用启动几秒后会自动开关一次侧栏，你在屏幕上看到的是一次快速的展开与收起。

这么做是为了让模型选择器进入可用状态——它需要侧栏被开关过一次才能工作。替你做了这一步，你就不用每次开机手动点一遍。

` + anchor;

if (s.includes(anchor) && !s.includes('左侧边栏自己闪了一下')) {
  s = s.replace(anchor, faq);
  changed++;
}

fs.writeFileSync(f, s, 'utf8');
console.log(JSON.stringify({ replacements: changed, lines: s.split('\n').length }));
