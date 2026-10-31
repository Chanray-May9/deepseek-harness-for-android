const fs=require('node:fs'),path=require('node:path');
const tar=require('../../../work/build-deps/node_modules/tar');
(async()=>{for(const arch of ['arm64','x64']){
 const dir=path.resolve('work/payload-'+arch), out=path.resolve(__dirname,'../app/src/main/assets/harness-'+arch+'.tar.gz');
 console.log('Packing original Harness',arch);
 await tar.c({file:out,gzip:true,cwd:dir,portable:true,noMtime:true,filter:(p)=>{
  if(p.includes('node-pty/prebuilds/')&&!p.includes('prebuilds/linux-'+arch)&&!p.endsWith('prebuilds/'))return false;
  return !p.endsWith('.cmd')&&!p.endsWith('.ps1')&&!p.includes('node_modules/.bin');
 },onWriteEntry:e=>{if(/\/(landlock-run|spawn-helper)$/.test(e.path))e.mode=0o755;}},['node_modules','package.json','package-lock.json']);
 console.log(out,fs.statSync(out).size);
}})().catch(e=>{console.error(e);process.exit(1)});
