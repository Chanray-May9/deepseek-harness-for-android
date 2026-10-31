import {createRequire} from 'node:module';
import {openSync,closeSync,unlinkSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
const require=createRequire('/opt/harness/package.json');
require('node-addon-require-builtin');
require('koffi');
const {tryLockExclusive}=await import('/opt/harness/node_modules/@deepseek-ai/node-addon-system/lib/flock.js');
const fd=openSync('/tmp/harness-native-probe.lock','w');
try{await tryLockExclusive(fd);}finally{closeSync(fd);unlinkSync('/tmp/harness-native-probe.lock');}
const db=new DatabaseSync(':memory:');
if(db.prepare('select 1 as ok').get().ok!==1)throw Error('SQLite probe failed');
db.close();
const pty=require('node-pty');
await new Promise((resolve,reject)=>{
 const timeout=setTimeout(()=>reject(Error('PTY probe timed out')),15000);
 const terminal=pty.spawn('/bin/bash',['--noprofile','--norc','-c','printf harness-pty-ok'],{cwd:'/root/workspace',env:process.env});
 let result='';terminal.onData(s=>result+=s);
 terminal.onExit(({exitCode})=>{clearTimeout(timeout);if(exitCode===0&&result.includes('harness-pty-ok'))resolve();else reject(Error('PTY probe failed: '+exitCode));});
});
console.log('ANDROID_NATIVE_PREFLIGHT_OK '+JSON.stringify({node:process.version,platform:process.platform,arch:process.arch,flock:true,sqlite:true,pty:true}));
