const fs = require('node:fs');
const path = require('node:path');

const f = path.join(
  __dirname, '..', 'restored', 'installed-0.2.1-android.5', 'app', 'src', 'main', 'java',
  'com', 'deepseek', 'harness', 'android', 'RuntimeService.java',
);
const lines = fs.readFileSync(f, 'utf8').split(/\r?\n/);

// locate by content, then rewrite the whole line
let patIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Pattern compile = Pattern.compile') && lines[i].includes('dsh') === false) {
    patIdx = i;
    break;
  }
}
if (patIdx < 0) {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Pattern compile = Pattern.compile')) { patIdx = i; break; }
  }
}
if (patIdx < 0) {
  console.error('pattern line not found');
  process.exit(1);
}
lines[patIdx] = '                        Pattern compile = Pattern.compile("https?://127\\\\.0\\\\.0\\\\.1:(\\\\d+)/[^\\\\s\\\\u001B]*");';

// insert the port sync after "launchUrl = matcher.group();"
let asgIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === 'launchUrl = matcher.group();') { asgIdx = i; break; }
}
if (asgIdx < 0) {
  console.error('launchUrl assignment not found');
  process.exit(1);
}
const indent = lines[asgIdx].match(/^\s*/)[0];
lines.splice(
  asgIdx + 1,
  0,
  `${indent}try {`,
  `${indent}    if (matcher.groupCount() >= 1) {`,
  `${indent}        port = Integer.parseInt(matcher.group(1));`,
  `${indent}    }`,
  `${indent}} catch (NumberFormatException ignored) {`,
  `${indent}}`,
);

fs.writeFileSync(f, lines.join('\n'), 'utf8');
const out = fs.readFileSync(f, 'utf8');
console.log(JSON.stringify({ lineNo: patIdx + 1, anyPort: out.includes('(\\\\d+)/['), portSync: out.includes('Integer.parseInt(matcher.group(1))') }));
