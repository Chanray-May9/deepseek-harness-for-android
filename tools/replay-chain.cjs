// Replay the recovered patch chain, verbatim, in transcript order.
// Only fs/path are exposed. Reads may reach the historical work/ tree; every
// write is confined to this project. Side-effecting scripts are skipped and
// reported, never silently approximated.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const REC = path.join(ROOT, 'recovered');
const PROJECT = path.join(ROOT, 'android-app');
const WORK_MIRROR = path.join(ROOT, 'build', 'work-mirror');
const WORK_REAL = 'D:/MigratedFromC/Powersharp/Documents/Codex/2026-10-28/deepseek-harness/work';

// Chain entries actually used by the project build, in transcript order.
const CHAIN = [
  'create-project',
  'fix-java',
  'enable-development-diagnostics',
  'mobile-startup-v2',
  'finish-mobile-v2',
  'use-android-network',
  'install-web-compat',
  'bind-standard-streams',
  'fix-soname',
  'fix-loader-packaging',
  'fix-native-menu',
  'add-devtools',
  'add-native-smoke',
  'use-original-icon',
  'apply-mobile-v2',
  'apply-mobile-v3',
  'apply-mobile-v4',
  'readable-text-v4',
  'final-input-layout-v4',
  'fix-welcome-v4',
  'composer-setting-v4',
  'align-mobile-toolbar',
  'mobile-back-visibility',
  'fix-restored-panel-startup',
  'package-compat-licenses',
  'install-termux-terminal',
  'apply-edge-v5',
  'fix-gradle-manifest',
  'adapt-android-runtime',
];

const index = JSON.parse(fs.readFileSync(path.join(REC, '_recovery-index.json'), 'utf8'));
const byBase = new Map();
for (const f of index.files) {
  const base = path.basename(f.rel, '.cjs');
  if (!byBase.has(base)) byBase.set(base, f);
}

fs.mkdirSync(WORK_MIRROR, { recursive: true });

/** Map a historical path string onto a real, writable location. */
function mapPath(p, forWrite) {
  const s = String(p).replace(/\\/g, '/');
  if (s.startsWith('outputs/DeepSeekHarness-Android-source')) {
    return path.join(PROJECT, s.slice('outputs/DeepSeekHarness-Android-source'.length).replace(/^\//, ''));
  }
  if (s.startsWith('work/')) {
    const rest = s.slice('work/'.length);
    if (!forWrite) {
      const real = path.join(WORK_REAL.replace(/\//g, path.sep), rest);
      if (fs.existsSync(real)) return real;
    }
    return path.join(WORK_MIRROR, rest);
  }
  return path.resolve(ROOT, s);
}

const guardWrite = (p) => {
  const abs = path.resolve(p);
  const ok = abs.startsWith(PROJECT + path.sep) || abs.startsWith(WORK_MIRROR + path.sep) || abs.startsWith(path.join(ROOT, 'build') + path.sep);
  if (!ok) throw new Error('write outside sandbox: ' + abs);
  return abs;
};

const rewrite = (code) => {
  let out = code;
  const pairs = [
    ['outputs/DeepSeekHarness-Android-source', PROJECT.split(path.sep).join('/')],
    ['work/', WORK_MIRROR.split(path.sep).join('/') + '/'],
  ];
  for (const [from, to] of pairs) {
    out = out.split("'" + from).join("'" + to);
    out = out.split('"' + from).join('"' + to);
    out = out.split('`' + from).join('`' + to);
  }
  return out;
};

const safeFs = new Proxy(fs, {
  get(target, key) {
    if (key === 'writeFileSync' || key === 'appendFileSync') {
      return (p, ...rest) => target[key](guardWrite(mapPath(p, true)), ...rest);
    }
    if (key === 'mkdirSync') {
      return (p, ...rest) => target[key](guardWrite(mapPath(p, true)), ...rest);
    }
    if (key === 'copyFileSync' || key === 'cpSync' || key === 'renameSync') {
      return (from, to, ...rest) => {
        const src = typeof from === 'string' ? mapPath(from, false) : from;
        const dst = typeof to === 'string' ? guardWrite(mapPath(to, true)) : to;
        return target[key](src, dst, ...rest);
      };
    }
    if (key === 'readFileSync' || key === 'readdirSync' || key === 'existsSync' || key === 'statSync') {
      return (p, ...rest) => target[key](typeof p === 'string' ? mapPath(p, false) : p, ...rest);
    }
    return target[key];
  },
});

const run = (name) => {
  const entry = byBase.get(name);
  if (!entry) return { name, status: 'missing' };
  const file = path.join(REC, entry.rel);
  const code = rewrite(fs.readFileSync(file, 'utf8'));
  const sandbox = {
    require: (m) => {
      if (m === 'fs' || m === 'node:fs') return safeFs;
      if (m === 'path' || m === 'node:path') return path;
      if (m === 'crypto' || m === 'node:crypto') return require('node:crypto');
      throw new Error('dependency not allowed: ' + m);
    },
    console,
    process: { cwd: () => PROJECT, argv: [process.argv[0], file], env: {} },
    Buffer,
    JSON,
    Math,
    Date,
    RegExp,
  };
  try {
    vm.runInNewContext(code, sandbox, { filename: name + '.cjs', timeout: 20000 });
    return { name, status: 'ok', line: entry.sourceLine };
  } catch (e) {
    return { name, status: 'fail', line: entry.sourceLine, error: e.message.split('\n')[0] };
  }
};

const results = [];
for (const name of CHAIN) results.push(run(name));
fs.writeFileSync(path.join(ROOT, 'build', 'replay-report.json'), JSON.stringify(results, null, 1));
for (const r of results) {
  console.log(`${r.status.toUpperCase().padEnd(7)} ${String(r.line ?? '-').padStart(5)}  ${r.name}${r.error ? '  <- ' + r.error : ''}`);
}
