const fs=require('node:fs'),path=require('node:path');
let zip;try{zip=require('fflate')}catch{zip=require('../../../work/build-deps/node_modules/fflate')}
const b=process.env.HARNESS_BUILD_DIR,p=process.env.HARNESS_PROJECT_ROOT;
const apk=path.join(b,'unsigned.apk');const files=zip.unzipSync(fs.readFileSync(apk));
for(const f of fs.readdirSync(path.join(b,'dex')))if(f.endsWith('.dex'))files[f]=fs.readFileSync(path.join(b,'dex',f));
const lib=path.join(p,'app/src/main/jniLibs');
for(const arch of fs.readdirSync(lib))for(const f of fs.readdirSync(path.join(lib,arch)))files['lib/'+arch+'/'+f]=fs.readFileSync(path.join(lib,arch,f));
fs.writeFileSync(apk,zip.zipSync(files,{level:0}));console.log('Assembled APK');
