// Rebuild plain XML from `aapt2 dump xmltree` output (tree-first, then render).
// Every tag, attribute name and value comes from the dump; nothing is added.
const fs = require('node:fs');

const src = process.argv[2];
const dest = process.argv[3];
const ANDROID_NS = 'http://schemas.android.com/apk/res/android';
// Application-package resource ids resolved from `aapt2 dump resources`.
const REF = {
  '@0x7f010000': '@drawable/ic_harness',
  '@0x7f010001': '@drawable/ic_whale',
  '@0x7f010002': '@drawable/launcher',
};

const NODE = /^(\s*)E: ([A-Za-z0-9_.-]+)(?:\s+\(line=\d+\))?\s*$/;
// aapt2 prints the full namespace URI as the prefix, e.g.
//   A: http://schemas.android.com/apk/res/android:versionCode(0x0101021b)=5
const ATTR = /^(\s*)A: (?:(.+?):([A-Za-z0-9_]+)\((0x[0-9a-f]+)\)|([A-Za-z0-9_]+))=(.*)$/;
const NSLINE = /^\s*N: (?:(?:([A-Za-z0-9_]+)=)?(\S+))?(?:\s+\(line=\d+\))?\s*$/;

const root = { tag: null, attrs: [], children: [], ns: {} };
const stack = [{ node: root, indent: -1 }];

let nsPrefixForAndroid = 'android';

function parseValue(raw) {
  let v = raw.trim();
  const rawMatch = v.match(/^"?(.*?)"?\s*\(Raw:\s*"(.*)"\)$/s);
  if (rawMatch) return { value: rawMatch[2], raw: true };
  if (/^".*"$/s.test(v)) return { value: v.slice(1, -1), raw: true };
  return { value: v, raw: false };
}

for (const line of fs.readFileSync(src, 'utf8').split(/\r?\n/)) {
  let m = line.match(NODE);
  if (m) {
    const indent = m[1].length;
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) stack.pop();
    const node = { tag: m[2], attrs: [], children: [] };
    stack[stack.length - 1].node.children.push(node);
    stack.push({ node, indent });
    continue;
  }
  m = line.match(ATTR);
  if (m) {
    const prefix = m[2];
    const name = m[3] || m[5];
    const parsed = parseValue(m[6]);
    node_attrs(stack[stack.length - 1].node).push({ prefix, name, ...parsed });
    continue;
  }
  m = line.match(NSLINE);
  if (m && m[2]) {
    const alias = m[1] || 'default';
    if (!root.ns) root.ns = {};
    root.ns[alias] = m[2];
    if (m[2] === ANDROID_NS) nsPrefixForAndroid = alias;
  }
}

function node_attrs(node) {
  return node.attrs;
}

function esc(v) {
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function render(node, indent) {
  if (!node.tag) return node.children.map((c) => render(c, indent)).join('\n');
  const pad = '  '.repeat(indent);
  const attrs = node.attrs
    .map((a) => {
      const key = a.prefix === ANDROID_NS ? 'android:' + a.name : a.name;
      return ` ${key}="${esc(REF[a.value] || a.value)}"`;
    })
    .join('');
  if (!node.children.length) return `${pad}<${node.tag}${attrs}/>`;
  const inner = node.children.map((c) => render(c, indent + 1)).join('\n');
  return `${pad}<${node.tag}${attrs}>\n${inner}\n${pad}</${node.tag}>`;
}

let body = root.children.map((c) => render(c, 0)).join('\n');
if (root.ns && Object.keys(root.ns).length) {
  const decls = Object.entries(root.ns)
    .map(([alias, uri]) => ` xmlns:${alias === 'default' ? nsPrefixForAndroid : alias}="${uri}"`)
    .join('');
  // Namespace declarations belong on whichever element is the document root.
  const firstTag = root.children[0] && root.children[0].tag;
  if (firstTag) body = body.replace(new RegExp('^(\\s*<' + firstTag + '\\b)'), `$1${decls}`);
}
fs.writeFileSync(dest, '<?xml version="1.0" encoding="utf-8"?>\n' + body + '\n', 'utf8');
console.log('wrote', dest, Buffer.byteLength(body), 'bytes; root children:', root.children.length);
