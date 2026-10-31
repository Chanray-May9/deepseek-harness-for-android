// Repack the extracted Harness runtime back into assets/harness-x64.tar.gz.
// Same entry filter the original packer used: drop other-platform node-pty
// prebuilds and Windows shell shims, keep paths and modes stable.
const fs = require('node:fs');
const path = require('node:path');

const tar = require(path.join(__dirname, 'node_modules', 'tar'));

const runtimeDir = process.argv[2];
const outFile = process.argv[3];
const arch = process.argv[4] || 'x64';

(async () => {
  const tmp = outFile + '.tmp';
  await tar.c(
    {
      file: tmp,
      gzip: true,
      cwd: runtimeDir,
      portable: true,
      noMtime: true,
      filter: (p) => {
        if (p.includes('node-pty/prebuilds/')) {
          const keep = p.includes(`prebuilds/linux-${arch}`) || p.endsWith('prebuilds/');
          if (!keep) return false;
        }
        if (p.endsWith('.cmd') || p.endsWith('.ps1')) return false;
        if (p.includes('node_modules/.bin')) return false;
        return true;
      },
      onWriteEntry: (e) => {
        if (/\/(landlock-run|spawn-helper)$/.test(e.path)) e.mode = 0o755;
      },
    },
    ['node_modules', 'package.json', 'package-lock.json'],
  );
  fs.renameSync(tmp, outFile);
  console.log(JSON.stringify({ out: path.basename(outFile), mb: +(fs.statSync(outFile).size / 1048576).toFixed(1) }));
})().catch((e) => {
  console.error('PACK_FAIL', e.message);
  process.exit(1);
});
