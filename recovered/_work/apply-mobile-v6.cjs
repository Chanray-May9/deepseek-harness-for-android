const fs=require('fs');const root='outputs/DeepSeekHarness-Android-source';const css=root+'/app/src/main/assets/android-mobile.css';fs.appendFileSync(css,`
/* Session title has its own row; status controls use the full row below. */
html[data-harness-android] .pI_x6G_centerCol:has(.wSkVaW_root[data-phase=active]) { padding-top:112px; }
html[data-harness-android] .wSkVaW_header:not(.wSkVaW_headerBlank) { display:block!important; top:8px!important; left:12px!important; right:12px!important; height:96px!important; padding:0!important; }
html[data-harness-android] .wSkVaW_header:not(.wSkVaW_headerBlank) .wSkVaW_titleRow { display:grid!important; grid-template-columns:minmax(0,1fr) auto; grid-template-rows:48px 44px; gap:4px 8px; height:96px!important; min-width:0; container-type:normal; }
html[data-harness-android] .wSkVaW_titleCluster { grid-column:1/-1; grid-row:1; box-sizing:border-box; padding-left:60px; padding-right:116px; min-width:0; }
html[data-harness-android] .wSkVaW_headerActions { grid-column:1; grid-row:2; min-width:0; overflow-x:auto; gap:8px; }
html[data-harness-android] .wSkVaW_headerUtilities { grid-column:2; grid-row:2; margin-left:0; gap:4px; }
html[data-harness-android] .wSkVaW_headerCorner { display:none; }
html[data-harness-android] .wSkVaW_headerActions button,html[data-harness-android] .wSkVaW_headerUtilities button { min-height:44px; min-width:44px; font-size:16px; }
html[data-harness-android] .wSkVaW_crumbs { min-width:0; max-width:100%; }
html[data-harness-android] .wSkVaW_crumbCurrent { font-size:18px; line-height:26px; }
html[data-harness-android] .wSkVaW_headerActions::-webkit-scrollbar { display:none; }
#harness-android-terminal { position:absolute; left:12px; right:12px; bottom:118px; min-height:48px; padding:10px 12px; border:0; border-radius:8px; background:transparent; color:var(--dsw-alias-label-primary,#222); font:inherit; font-size:16px; text-align:left; }
.pI_x6G_frame[data-sidebar-collapsed] #harness-android-terminal { display:none; }
html[data-harness-android] .hHd-Xa_root:not(.hHd-Xa_collapsed) .hHd-Xa_regionArea { padding-bottom:112px; }
`);
const js=root+'/app/src/main/assets/android-mobile.js';let j=fs.readFileSync(js,'utf8');j=j.replace("  if(sidebar&&!document.getElementById('harness-android-files'))",`  if(sidebar&&!document.getElementById('harness-android-terminal')){var terminal=document.createElement('button');terminal.id='harness-android-terminal';terminal.type='button';terminal.textContent='本地终端 · Termux';terminal.onclick=function(){window.HarnessAndroidExport?.openTerminal()};sidebar.appendChild(terminal);}
  if(sidebar&&!document.getElementById('harness-android-files'))`);fs.writeFileSync(js,j);
console.log('Updated two-row session header and native terminal entry');
