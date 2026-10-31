// Add classes.dex and native libraries into the linked APK, keeping stored entries intact.
const fs = require('node:fs');
const path = require('node:path');

let zip;
try {
  zip = require('fflate');
} catch {
  zip = require(path.join(__dirname, 'node_modules', 'fflate'));
}

const apk = process.env.REBUILD_APK;
const dexDir = process.env.REBUILD_DEX;
const libRoot = process.env.REBUILD_LIB;
const abiSetting = process.env.REBUILD_ABI || 'x64';
const abis = abiSetting === 'both' ? ['arm64-v8a', 'x86_64'] : (abiSetting === 'x64' ? ['x86_64'] : ['arm64-v8a']);

const entries = zip.unzipSync(fs.readFileSync(apk));

for (const f of fs.readdirSync(dexDir)) {
  if (f.endsWith('.dex')) entries[f] = fs.readFileSync(path.join(dexDir, f));
}

for (const abi of abis) {
  const abiDir = path.join(libRoot, abi);
  if (!fs.existsSync(abiDir)) continue;
  for (const f of fs.readdirSync(abiDir)) {
    entries[`lib/${abi}/${f}`] = fs.readFileSync(path.join(abiDir, f));
  }
}

// Stored (level 0): the runtime archives must stay byte-identical and streamable.
fs.writeFileSync(apk, zip.zipSync(entries, { level: 0 }));

const dexCount = Object.keys(entries).filter((k) => k.endsWith('.dex')).length;
const soCount = Object.keys(entries).filter((k) => k.startsWith('lib/')).length;
console.log(
  JSON.stringify(
    { apk: path.basename(apk), entries: Object.keys(entries).length, dex: dexCount, nativeLibs: soCount, abis },
    null,
    1,
  ),
);


