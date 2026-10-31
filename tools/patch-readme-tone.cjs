// Reword the contribution section: invite, do not prescribe.
const fs = require('node:fs');
const path = require('node:path');

const f = path.join(__dirname, '..', 'README.md');
let s = fs.readFileSync(f, 'utf8');

const start = s.indexOf('### 提 Issue 时请带上');
const end = s.indexOf('### 已知待办');
if (start < 0 || end <= start) {
  console.error('markers not found', start, end);
  process.exit(1);
}

const replacement = `### 反馈问题

没有格式要求，不用填模板。觉得哪里别扭、卡住、或者和你预期不一样，直接说就行。

如果方便的话，下面这些信息能让定位快一点——不方便也没关系，能描述清楚现象就已经很有用了：

- 手机型号、系统版本、CPU 架构
- 出问题前你做了什么，点到了哪里
- 应用菜单 → 查看运行日志，最后十几行
- 界面问题的话，一张截图

### 提交改动

想怎么改都行，一次改一件事会好 review 一些。

界面改动的话，附一张改动前后的截图，别人一眼就能看出差别。

如果动到了原生层，说明一下有没有在自己的手机上验证过，这样合进去更放心。

`;

s = s.slice(0, start) + replacement + s.slice(end);

fs.writeFileSync(f, s, 'utf8');
console.log(JSON.stringify({
  lines: s.split('\n').length,
  hasOldIssueHeading: s.includes('提 Issue 时请带上'),
  hasOldPrHeading: s.includes('提 Pull Request 时'),
}));
