const fs=require('node:fs'), path=require('node:path'), zlib=require('node:zlib'), crypto=require('node:crypto');
const {pipeline}=require('node:stream/promises'); const {Readable}=require('node:stream');
const tar=require('../../../work/build-deps/node_modules/tar');
const ROOT=path.resolve(__dirname,'..'), CACHE=path.resolve(ROOT,'../../work/downloads');
fs.mkdirSync(CACHE,{recursive:true});
const ASSETS=path.join(ROOT,'app/src/main/assets'); fs.mkdirSync(ASSETS,{recursive:true});
async function json(url,headers={}){const r=await fetch(url,{headers});if(!r.ok)throw Error(`${r.status} ${url}`); return r.json()}
async function download(url,file,headers={}){if(fs.existsSync(file)&&fs.statSync(file).size>100)return file; console.log('Downloading',path.basename(file));const r=await fetch(url,{headers});if(!r.ok)throw Error(`${r.status} ${url}`);await pipeline(Readable.fromWeb(r.body),fs.createWriteStream(file+'.part'));fs.renameSync(file+'.part',file);return file}
function debMembers(file){const b=fs.readFileSync(file),out={};if(b.subarray(0,8).toString()!=='!<arch>\n')throw Error('not ar');for(let o=8;o+60<=b.length;){const name=b.subarray(o,o+16).toString().trim().replace(/\/$/,'');const size=Number(b.subarray(o+48,o+58).toString().trim());out[name]=b.subarray(o+60,o+60+size);o+=60+size+(size%2)}return out}
async function extractDeb(file,dest){fs.mkdirSync(dest,{recursive:true});const m=debMembers(file);const n=Object.keys(m).find(n=>n.startsWith('data.tar'));if(!n.endsWith('.xz'))throw Error('Expected xz');const xz=path.join(CACHE,path.basename(file)+'.tar.xz');fs.writeFileSync(xz,m[n]);const {spawnSync}=require('node:child_process');const r=spawnSync('tar',['-xf',xz,'-C',dest],{encoding:'utf8'});if(r.status)throw Error(r.stderr)}
async function prepare(arch){
 const abi=arch==='arm64'?'arm64-v8a':'x86_64',ta=arch==='arm64'?'aarch64':'x86_64';
 const packages=zlib.gunzipSync(fs.readFileSync(path.resolve(ROOT,`../../work/termux-packages-${ta}.gz`))).toString();
 const libDir=path.join(ROOT,'app/src/main/jniLibs',abi);fs.mkdirSync(libDir,{recursive:true});
 for(const name of ['proot','libtalloc','libandroid-shmem']){
  const stanza=packages.split('\n\n').find(x=>x.startsWith('Package: '+name+'\n'));if(!stanza)throw Error(name);
  const field=k=>stanza.match(new RegExp('^'+k+': (.+)$','m'))?.[1].trim();
  const file=await download('https://packages.termux.dev/apt/termux-main/'+field('Filename'),path.join(CACHE,path.basename(field('Filename'))));
  if(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')!==field('SHA256'))throw Error('checksum '+name);
  const dest=path.join(CACHE,ta+'-'+name);await extractDeb(file,dest);
  const base=path.join(dest,'data/data/com.termux/files/usr');
  if(name==='proot'){
   fs.copyFileSync(path.join(base,'bin/proot'),path.join(libDir,'libproot.so'));
   for(const n of fs.readdirSync(path.join(base,'libexec/proot'))){fs.copyFileSync(path.join(base,'libexec/proot',n),path.join(libDir,'lib'+n+'.so'))}
  }else for(const n of fs.readdirSync(path.join(base,'lib'))){if(n.endsWith('.so'))fs.copyFileSync(path.join(base,'lib',n),path.join(libDir,n))}
 }
 const token=(await json('https://auth.docker.io/token?service=registry.docker.io&scope=repository:library/ubuntu:pull')).token;
 const headers={Authorization:'Bearer '+token,Accept:'application/vnd.oci.image.index.v1+json, application/vnd.docker.distribution.manifest.list.v2+json, application/vnd.oci.image.manifest.v1+json'};
 const index=await json('https://registry-1.docker.io/v2/library/ubuntu/manifests/24.04',headers);
 const digest=index.manifests.find(x=>x.platform.os==='linux'&&x.platform.architecture===(arch==='arm64'?'arm64':'amd64')).digest;
 const manifest=await json('https://registry-1.docker.io/v2/library/ubuntu/manifests/'+digest,headers);
 if(manifest.layers.length!==1)throw Error('Expected a single Ubuntu rootfs layer');
 const layer=manifest.layers[0];
 const rootfs=await download('https://registry-1.docker.io/v2/library/ubuntu/blobs/'+layer.digest,path.join(ASSETS,`rootfs-${arch}.tar.gz`),headers);
 if('sha256:'+crypto.createHash('sha256').update(fs.readFileSync(rootfs)).digest('hex')!==layer.digest)throw Error('Docker layer checksum');
 const nodeVersion='v24.16.0';
 const node=await download(`https://nodejs.org/dist/${nodeVersion}/node-${nodeVersion}-linux-${arch==='arm64'?'arm64':'x64'}.tar.gz`,path.join(ASSETS,`node-${arch}.tar.gz`));
 const sums=await (await fetch(`https://nodejs.org/dist/${nodeVersion}/SHASUMS256.txt`)).text();
 const expected=sums.split('\n').find(x=>x.endsWith(`node-${nodeVersion}-linux-${arch==='arm64'?'arm64':'x64'}.tar.gz`)).split(/\s/)[0];
 if(crypto.createHash('sha256').update(fs.readFileSync(node)).digest('hex')!==expected)throw Error('Node checksum');
 const files=[]; await tar.t({file:rootfs,onReadEntry:e=>{if(/libstdc\+\+|libgcc_s|libc\.so|resolv.conf/.test(e.path))files.push(e.path)}});
 console.log('Rootfs libraries:',files);
 fs.writeFileSync(path.join(ASSETS,`runtime-${arch}.json`),JSON.stringify({arch,abi,ubuntuManifest:digest,rootfsDigest:layer.digest,nodeVersion,nodeSha256:expected,prootVersion:'5.1.107.101',harnessVersion:'0.2.1-rc.2'},null,2));
 console.log('Prepared',arch);
}
prepare(process.argv[2]||'arm64').catch(e=>{console.error(e);process.exit(1)});
