// Replay one recovered scaffolding script inside a path-remapped sandbox.
// Only fs/path are exposed, and every write must stay inside the project root.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const script = path.resolve(process.argv[2]);
const projectRoot = path.resolve(process.argv[3]);
let code = fs.readFileSync(script, 'utf8');

// Remap the historical working paths onto this project.
code = code
  .replaceAll("'outputs/DeepSeekHarness-Android-source'", JSON.stringify(projectRoot))
  .replaceAll('"outputs/DeepSeekHarness-Android-source"', JSON.stringify(projectRoot));

const guard = (p) => {
  const abs = path.resolve(p);
  if (!abs.startsWith(projectRoot + path.sep) && abs !== projectRoot) {
    throw new Error('write outside project root: ' + abs);
  }
  return abs;
};

const safeFs = new Proxy(fs, {
  get(target, key) {
    if (key === 'writeFileSync' || key === 'appendFileSync' || key === 'mkdirSync' || key === 'rmSync' || key === 'rmdirSync') {
      return (p, ...rest) => {
        guard(p);
        return target[key](p, ...rest);
      };
    }
    if (key === 'copyFileSync' || key === 'cpSync' || key === 'renameSync') {
      return (from, to, ...rest) => {
        if (typeof to === 'string') guard(to);
        return target[key](from, to, ...rest);
      };
    }
    return target[key];
  },
});

const sandbox = {
  require: (m) => {
    if (m === 'fs' || m === 'node:fs') return safeFs;
    if (m === 'path' || m === 'node:path') return path;
    throw new Error('dependency not allowed: ' + m);
  },
  console,
  process: { cwd: () => projectRoot, argv: [process.argv[0], script] },
  Buffer,
  JSON,
  Math,
  Date,
};

try {
  vm.runInNewContext(code, sandbox, { filename: path.basename(script), timeout: 15000 });
  console.log('REPLAY_OK', path.basename(script));
} catch (e) {
  console.error('REPLAY_FAIL', path.basename(script), e.message);
  process.exit(1);
}
