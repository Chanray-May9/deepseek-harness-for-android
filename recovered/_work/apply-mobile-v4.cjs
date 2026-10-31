const fs=require('fs');const root='outputs/DeepSeekHarness-Android-source';const css=root+'/app/src/main/assets/android-mobile.css';fs.appendFileSync(css,`
/* Readable mobile controls and a bottom-aligned work area. */
html[data-harness-android] { -webkit-text-size-adjust:100%; }
html[data-harness-android] .pI_x6G_centerCol { padding-top:68px; }
html[data-harness-android] .wSkVaW_composerHero { justify-content:flex-end; gap:12px; padding-bottom:max(16px,env(safe-area-inset-bottom)); }
html[data-harness-android] .wSkVaW_composerHero>.pXSMma_root { display:none; }
html[data-harness-android] .wSkVaW_heroWorkspaceRow { flex-direction:column; align-items:flex-start; gap:4px; padding:0 24px; }
html[data-harness-android] .pXSMma_workspace,html[data-harness-android] .cubgiG_seat { box-sizing:border-box; min-height:48px; max-width:100%; padding:4px 8px; gap:10px; font-size:18px; line-height:28px; }
html[data-harness-android] .pXSMma_workspace svg,html[data-harness-android] .cubgiG_seat svg { width:24px; height:24px; flex:none; }
html[data-harness-android] .pXSMma_workspace .pXSMma_chevron,html[data-harness-android] .cubgiG_seat .cubgiG_chevron { width:20px; height:20px; }
html[data-harness-android] .wSkVaW_heroWorkspaceRow [data-slot='conversation.hero.agentPreset'] { display:block!important; min-width:0; max-width:100%; }
html[data-harness-android] .wSkVaW_heroOptions:empty { display:none; }
html[data-harness-android] .uV2eYG_card { font-size:18px; line-height:28px; gap:12px; padding-top:12px; }
html[data-harness-android] .uV2eYG_input { font-size:18px; line-height:28px; padding:4px 12px 0 16px; }
html[data-harness-android] .uV2eYG_placeholder { font-size:18px; line-height:28px; left:16px; right:12px; }
html[data-harness-android] .uV2eYG_hero .uV2eYG_input { min-height:56px; }
html[data-harness-android] .uV2eYG_row { padding:0 10px 10px; gap:8px; }
html[data-harness-android] .uV2eYG_add,html[data-harness-android] .uV2eYG_primary { width:44px; height:44px; min-width:44px; transform:none; }
html[data-harness-android] .uV2eYG_add svg,html[data-harness-android] .uV2eYG_primary svg { width:24px; height:24px; }
html[data-harness-android] .iWlSmW_trigger,html[data-harness-android] ._7KE1Ra_trigger { box-sizing:border-box; min-height:44px; min-width:44px; font-size:16px; line-height:24px; }
html[data-harness-android] .iWlSmW_triggerIcon svg,html[data-harness-android] ._7KE1Ra_triggerIcon { width:22px; height:22px; }
html[data-harness-android] .uV2eYG_standardControls,html[data-harness-android] .uV2eYG_tools,html[data-harness-android] .uV2eYG_trailing { gap:8px; }
html[data-harness-android] .wSkVaW_body { --dsh-composer-text-max-height:min(200px,30dvh); }
/* Empty and unfocused: keep the real editor in a single comfortable row. */
html[data-harness-android] .uV2eYG_hero[data-harness-compact] .uV2eYG_card { display:grid; grid-template-columns:44px minmax(0,1fr) 44px; grid-template-rows:auto; gap:0; min-height:64px; padding:8px; border-radius:34px; align-items:center; }
html[data-harness-android] .uV2eYG_hero[data-harness-compact] .uV2eYG_scroll { grid-column:2; grid-row:1; margin:0; min-width:0; overflow:hidden; }
html[data-harness-android] .uV2eYG_hero[data-harness-compact] .uV2eYG_input { min-height:44px; padding:8px 4px; }
html[data-harness-android] .uV2eYG_hero[data-harness-compact] .uV2eYG_placeholder { top:8px; left:4px; right:4px; white-space:nowrap; display:block; text-overflow:ellipsis; }
html[data-harness-android] .uV2eYG_hero[data-harness-compact] .uV2eYG_row,html[data-harness-android] .uV2eYG_hero[data-harness-compact] .uV2eYG_tools,html[data-harness-android] .uV2eYG_hero[data-harness-compact] .uV2eYG_trailing { display:contents; }
html[data-harness-android] .uV2eYG_hero[data-harness-compact] .uV2eYG_add { grid-column:1; grid-row:1; background:transparent; }
html[data-harness-android] .uV2eYG_hero[data-harness-compact] .uV2eYG_primary { grid-column:3; grid-row:1; }
html[data-harness-android] .uV2eYG_hero[data-harness-compact] .uV2eYG_modes,html[data-harness-android] .uV2eYG_hero[data-harness-compact] .uV2eYG_standardControls,html[data-harness-android] .uV2eYG_hero[data-harness-compact] .uV2eYG_activity { display:none; }
html[data-harness-android] .hHd-Xa_collapsed .hHd-Xa_toggle { width:48px!important; height:48px!important; top:8px!important; }
html[data-harness-android] .hHd-Xa_toggle svg { width:24px; height:24px; }
#harness-mobile-actions { top:8px; height:48px; border-radius:26px; }
#harness-mobile-actions>button { width:48px; height:48px; }
#harness-mobile-actions svg { width:24px; height:24px; }
html[data-harness-android] .wSkVaW_header:not(.wSkVaW_headerBlank) { top:8px; left:72px; right:124px; height:48px; }
html[data-harness-android] .wSkVaW_header:not(.wSkVaW_headerBlank) .wSkVaW_titleRow { height:48px; }
html[data-harness-android] .wSkVaW_crumb { font-size:16px; min-height:44px; }
html[data-harness-android] .hHd-Xa_root { font-size:16px; }
html[data-harness-android] .hHd-Xa_newSession { min-height:48px; font-size:16px; }
html[data-harness-android] .hHd-Xa_panelRow { min-height:48px; padding:10px 8px; }
html[data-harness-android] .hHd-Xa_panelGlyph svg { width:22px; height:22px; }
#harness-android-files { min-height:48px; font-size:16px; }
html[data-harness-android] .VOzbGW_navTitle { height:44px!important; font-size:20px!important; }
html[data-harness-android] .VOzbGW_navCell { height:48px!important; padding:10px 12px!important; font-size:16px!important; }
html[data-harness-android] .VOzbGW_options { font-size:16px!important; line-height:1.6; }
html[data-harness-android] .VOzbGW_options [class$='_rowTitle'],html[data-harness-android] .VOzbGW_options [class$='_rowLabel'] { font-size:16px!important; }
html[data-harness-android] .VOzbGW_options [class$='_rowDescription'],html[data-harness-android] .VOzbGW_options [class$='_rowDesc'] { font-size:14px!important; line-height:22px; }
html[data-harness-android] .VOzbGW_options button { min-height:44px; font-size:16px; }
html[data-harness-android] .VOzbGW_close { min-width:44px; min-height:44px; }
html[data-harness-android] [role=menuitem],html[data-harness-android] [role=option] { min-height:44px; box-sizing:border-box; font-size:16px; }
html[data-harness-android] input:not([type=checkbox]):not([type=radio]):not([type=range]),html[data-harness-android] textarea { font-size:16px; }
@media(max-height:500px) {
 html[data-harness-android] .wSkVaW_heroWorkspaceRow { gap:0; }
 html[data-harness-android] .pXSMma_workspace,html[data-harness-android] .cubgiG_seat { min-height:44px; }
 html[data-harness-android] .wSkVaW_composerHero { gap:8px; padding-bottom:8px; }
 html[data-harness-android] .wSkVaW_body { --dsh-composer-text-max-height:88px; }
}
`);
const js=root+'/app/src/main/assets/android-mobile.js';let j=fs.readFileSync(js,'utf8');j=j.replace("  var title=document.querySelector('.pXSMma_titleGroup>span:first-child');",`  document.querySelectorAll('.uV2eYG_root').forEach(function(composer){
   var input=composer.querySelector('[data-composer-input]');
   if(!input)return;
   var attachments=composer.querySelector('[data-slot="conversation.input.attachments"]');
   var compact=!input.innerText.trim()&&!composer.contains(document.activeElement)&&!composer.querySelector('[aria-expanded="true"]')&&!(attachments&&attachments.childElementCount);
   composer.toggleAttribute('data-harness-compact',compact);
   var placeholder=composer.querySelector('[data-composer-placeholder]');
   if(placeholder&&placeholder.textContent.indexOf('描述你想要构建的内容')===0)placeholder.textContent='发消息，/ 指令，@ 文件';
  });
  var title=document.querySelector('.pXSMma_titleGroup>span:first-child');`);j=j.replace("function start(){new MutationObserver(changed).observe(document.body,{subtree:true,childList:true,attributes:true,", "function start(){document.addEventListener('focusin',changed);document.addEventListener('focusout',changed);new MutationObserver(changed).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,");j=j.replace("'data-theme']","'data-theme','aria-expanded']");fs.writeFileSync(js,j);
for(const f of ['app/build.gradle','tools/build.ps1','app/src/main/java/com/deepseek/harness/android/MainActivity.java']){let s=fs.readFileSync(root+'/'+f,'utf8').replaceAll('0.2.1-android.3','0.2.1-android.4').replace('versionCode 3','versionCode 4').replace('--version-code 3','--version-code 4');fs.writeFileSync(root+'/'+f,s)}console.log('Updated mobile controls to 44/48px, text to 16/18px, vertical context rows and compact/expanded editor');
