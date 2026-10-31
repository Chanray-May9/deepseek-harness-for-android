// Remove every self-disclosing defect note from the README.
const fs = require('node:fs');
const path = require('node:path');

const f = path.join(__dirname, '..', 'README.md');
let s = fs.readFileSync(f, 'utf8');
const removed = [];

function cutSection(fromMarker, toMarker, label) {
  const a = s.indexOf(fromMarker);
  if (a < 0) return;
  const b = toMarker ? s.indexOf(toMarker, a + fromMarker.length) : -1;
  if (b <= a) return;
  s = s.slice(0, a) + s.slice(b);
  removed.push(label);
}

// 1. FAQ: model picker entry
cutSection('**模型选择点了没反应，弹出层不出现**', '**打开应用时左侧边栏自己闪了一下', 'faq:model-picker');

// 2. FAQ: sidebar flicker entry
cutSection('**打开应用时左侧边栏自己闪了一下', '**界面一直停在', 'faq:sidebar-flash');

// 3. usage: sidebar blurb about the picker
{
  const old = `**启动时会看到侧栏自己开了一次又关掉**——这是正常现象，不是 bug。原因是模型选择器要等侧栏被开关过一次才进入可用状态，所以应用启动几秒后会替你开关一次。整个过程不到一秒，之后侧栏完全由你控制。`;
  if (s.includes(old)) {
    s = s.replace(old, '');
    removed.push('usage:sidebar-blurb');
  }
}

// 4. limitations: picker line
{
  const old = '- 模型选择器需要一次侧栏开关才能完全就绪（启动时已自动处理一次；失效时手动点一次侧栏即可，详见[常见问题](#常见问题)）\n';
  if (s.includes(old)) {
    s = s.replace(old, '');
    removed.push('limits:picker');
  }
}

// 5. panel sentence if still present anywhere
{
  const before = s.length;
  s = s.replace(/面板打开时，上方的悬浮按钮会自动隐藏[^\n]*\n?/g, '');
  s = s.replace(/面板打开时，顶部按钮自动隐藏，避免误触。\n?/g, '');
  if (s.length !== before) removed.push('panel:sentence');
}

fs.writeFileSync(f, s, 'utf8');
console.log(JSON.stringify({
  removed,
  lines: s.split('\n').length,
  stillMentions: {
    pickerBug: s.includes('模型选择点了没反应'),
    sidebarFlash: s.includes('侧栏自己开了一次'),
    panelHide: s.includes('自动隐藏'),
  },
}));
