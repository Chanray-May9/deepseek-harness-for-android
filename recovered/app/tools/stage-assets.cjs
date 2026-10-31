const fs=require('node:fs'),path=require('node:path');
const b=process.env.HARNESS_BUILD_DIR,p=process.env.HARNESS_PROJECT_ROOT,abi=process.env.HARNESS_ABI;
const dir=path.join(p,'app/src/main/assets'),out=path.join(b,'assets');fs.mkdirSync(out,{recursive:true});
for(const f of fs.readdirSync(dir)){if(abi!=='universal'&&/(arm64|x64)\.(tar\.gz|json)$/.test(f)&&!f.includes('-'+abi+'.'))continue;fs.copyFileSync(path.join(dir,f),path.join(out,f));}
console.log('Staged',abi,'runtime assets');
