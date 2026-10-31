const fs=require('fs'),path=require('path');
const css=`
@media (max-width: 600px) {
 .pI_x6G_frame { grid-template-columns:56px minmax(0,1fr) 0!important; }
 .pI_x6G_frame:not([data-sidebar-collapsed])>.pI_x6G_sidebarCol { position:absolute; inset:0 auto 0 0; width:min(86vw,320px); z-index:120; box-shadow:16px 0 40px #0002; }
 .pI_x6G_frame:not([data-rightbar-collapsed]) .pI_x6G_rightbarCol { position:fixed; inset:12% 0 0 0; width:auto!important; max-width:none!important; height:auto; z-index:110; background:var(--dsw-alias-bg-base); border-radius:16px 16px 0 0; box-shadow:0 -12px 48px #0003; }
 .pI_x6G_handle { display:none; }
 [role=dialog] { max-width:calc(100vw - 16px)!important; max-height:calc(100dvh - 24px)!important; }
 [role=tablist] { overflow-x:auto; }
 pre { max-width:100%; overflow-x:auto; }
}
`;
for(const arch of ['arm64','x64']){
 const base=path.resolve('work/payload-'+arch+'/node_modules');
 const file=path.join(base,'@deepseek-ai/dsh-client-ui-layout/lib/client.js');
 let text=fs.readFileSync(file,'utf8');
 if(!text.includes('HARNESS_ANDROID_MOBILE')){
  const needle='const s = sidebar === 0 ? collapsedWidth : clampWidth(sidebar, 264, 420);';
  if(!text.includes(needle))throw Error('Unsupported original layout version');
  text=text.replace(needle,needle+'\n\t\t\t// HARNESS_ANDROID_MOBILE: keep every tool panel accessible as an overlay.\n\t\t\tif (viewport < 600) return { sidebar: s, center: Math.max(0, viewport - 56), rightbar: rightbar === 0 ? 0 : Math.max(0, viewport - 16) };');
  text=text.replace('tag.textContent = css;', 'tag.textContent = css + '+JSON.stringify(css)+';');
  fs.writeFileSync(file,text);
 }
}
const manifest='outputs/DeepSeekHarness-Android-source/app/src/main/AndroidManifest.xml';let m=fs.readFileSync(manifest,'utf8');if(!m.includes('package='))m=m.replace('<manifest ','<manifest package="com.deepseek.harness.android" ');fs.writeFileSync(manifest,m);
console.log('Applied narrow-screen layout without removing functionality.');
