const fs=require('fs');const script='outputs/DeepSeekHarness-Android-source/tools/adapt-mobile.cjs';let s=fs.readFileSync(script,'utf8');const old=s.match(/const css=`([\s\S]*?)`;/)[1];
const extra=`
 .VOzbGW_panel { flex-direction:column; min-width:0!important; }
 .VOzbGW_nav { width:auto; gap:12px; padding:16px 12px 8px; }
 .VOzbGW_navTitle { padding:0 8px; height:24px; }
 .VOzbGW_navList { flex-direction:row; flex-wrap:nowrap; overflow-x:auto; overflow-y:hidden; }
 .VOzbGW_navCell { flex:0 0 auto; padding:8px 12px; }
 .VOzbGW_content { min-height:0; }
 .VOzbGW_header { position:absolute; top:0; right:0; height:44px; padding:12px 12px 0; }
 .VOzbGW_options { padding:12px 16px 24px; }
 .VOzbGW_options [class$='_row'] { flex-wrap:wrap; row-gap:12px; }
 .VOzbGW_options [class$='_rowText'] { min-width:0; flex:1 1 150px; }
 .VOzbGW_options ._8HJdBW_cubeRow { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; }
 .VOzbGW_options ._8HJdBW_themeCube { min-width:0; width:auto; }
`;
const css=old.replace('\n}',extra+'\n}');s=s.replace(old,css);fs.writeFileSync(script,s);
for(const root of ['work/payload-arm64','work/payload-x64','work/qa-backend']){const p=root+'/node_modules/@deepseek-ai/dsh-client-ui-layout/lib/client.js';let t=fs.readFileSync(p,'utf8');if(!t.includes(JSON.stringify(old)))throw Error('Unexpected mobile CSS');t=t.replace(JSON.stringify(old),JSON.stringify(css));fs.writeFileSync(p,t);}
fs.writeFileSync('work/mobile.css',css);
const pack='outputs/DeepSeekHarness-Android-source/tools/pack-harness.cjs';s=fs.readFileSync(pack,'utf8').replace('await tar.c({file:out,','await tar.c({file:out+".tmp",').replace("console.log(out,fs.statSync(out).size);","fs.renameSync(out+'.tmp',out);console.log(out,fs.statSync(out).size);");fs.writeFileSync(pack,s);
