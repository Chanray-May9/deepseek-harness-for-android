const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {unzipSync}=require('fflate');
const apk=path.resolve(process.argv[2]||path.join(__dirname,'../DeepSeekHarness-Android-arm64.apk'));
const root=path.resolve(__dirname,'..'), entries=unzipSync(fs.readFileSync(apk));
function assert(b,m){if(!b)throw Error(m)}
const required=['AndroidManifest.xml','classes.dex','assets/rootfs-arm64.tar.gz','assets/node-arm64.tar.gz','assets/harness-arm64.tar.gz','assets/runtime-arm64.json','assets/android-smoke.mjs','assets/loader32-arm64.bin','lib/arm64-v8a/libproot.so','lib/arm64-v8a/libloader.so','lib/arm64-v8a/libtalloc.so','lib/arm64-v8a/libandroid-shmem.so'];
for(const n of required)assert(entries[n],'Missing APK component: '+n);
for(const n of Object.keys(entries))assert(!n.includes('x86_64')&&!n.includes('-x64.'),'Unexpected x64 component in ARM64 APK: '+n);
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const assets={};for(const n of required.filter(n=>n.startsWith('assets/'))){const source=fs.readFileSync(path.join(root,'app/src/main',n));assert(sha(source)===sha(entries[n]),'Stale APK asset: '+n);assets[n]={sha256:sha(source),bytes:source.length};}
const native={};for(const n of Object.keys(entries).filter(n=>n.startsWith('lib/'))){const b=Buffer.from(entries[n]);assert(b.subarray(0,4).toString('hex')==='7f454c46','Invalid ELF: '+n);assert(b[4]===2&&b.readUInt16LE(18)===183,'Incorrect native ELF architecture: '+n);native[n]={sha256:sha(b),machine:183,bits:64};}
const report={apk:path.basename(apk),sha256:sha(fs.readFileSync(apk)),bytes:fs.statSync(apk).size,requiredComponents:required.length,assets,native,validationScope:'Static APK component, freshness, SHA256 and native architecture checks only; Android execution is not verified.'};
fs.writeFileSync(path.join(root,'APK-VERIFICATION.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({apk:report.apk,bytes:report.bytes,sha256:report.sha256,requiredComponents:required.length,nativeLibraries:Object.keys(native).length,staticChecks:'passed'},null,2));
