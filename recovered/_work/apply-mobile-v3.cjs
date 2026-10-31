const fs=require('fs'),path=require('path');const root='outputs/DeepSeekHarness-Android-source';const java=root+'/app/src/main/java/com/deepseek/harness/android/MainActivity.java';let s=fs.readFileSync(java,'utf8');s=s.replace('    private ProgressBar loadingProgress;\r\n    private int startupPhase=0;\r\n','');
const start=s.indexOf('        loading=new LinearLayout(this);'),end=s.indexOf('        frame.addView(loading',start);
if(start<0||end<0)throw Error('startup bounds');
s=s.slice(0,start)+`        loading=new LinearLayout(this);loading.setOrientation(LinearLayout.VERTICAL);loading.setGravity(Gravity.CENTER);loading.setPadding(dp(28),dp(28),dp(28),dp(28));loading.setBackgroundColor(0xffffffff);
        ImageView mark=new ImageView(this);mark.setImageResource(getResources().getIdentifier("ic_whale","drawable",getPackageName()));mark.setContentDescription("DeepSeek");loading.addView(mark,new LinearLayout.LayoutParams(dp(64),dp(64)));
        status=new TextView(this);status.setGravity(Gravity.CENTER);status.setTextSize(14);status.setTextColor(0xff697382);status.setVisibility(View.GONE);LinearLayout.LayoutParams message=new LinearLayout.LayoutParams(-2,-2);message.topMargin=dp(24);loading.addView(status,message);
        loadingActions=new LinearLayout(this);loadingActions.setGravity(Gravity.CENTER);loadingActions.setVisibility(View.GONE);
        Button retry=new Button(this,null,android.R.attr.borderlessButtonStyle);retry.setText("重试");retry.setTextColor(0xff4d6bfe);retry.setOnClickListener(v->{loadedUrl=null;loadingActions.setVisibility(View.GONE);status.setVisibility(View.GONE);startRuntime();});loadingActions.addView(retry);
        Button logs=new Button(this,null,android.R.attr.borderlessButtonStyle);logs.setText("查看详情");logs.setTextColor(0xff697382);logs.setOnClickListener(v->showLogs());loadingActions.addView(logs);loading.addView(loadingActions);
`+s.slice(end);
s=s.replace('int bg=dark?0xff111215:0xfffafbfc','int bg=dark?0xff111215:0xffffffff').replace('i==1?(dark?0xfff0f1f4:0xff202124):(dark?0xffa9afb9:0xff697382)','dark?0xffa9afb9:0xff697382');
s=s.replace('dark?flags&~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR:flags|View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR','dark?flags&~(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR|View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR):flags|View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR|View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR');
s=s.replace('loadingProgress.setVisibility(View.GONE);loadingActions.setVisibility(View.VISIBLE);status.setText(text);','loadingActions.setVisibility(View.VISIBLE);status.setVisibility(View.VISIBLE);status.setText(text);');
const updateStart=s.indexOf('        String text="正在启动…";'),updateEnd=s.indexOf('\n    }',updateStart);if(updateStart<0)throw Error('update block');s=s.slice(0,updateStart)+s.slice(updateEnd);
s=s.replace('loading.setVisibility(View.VISIBLE);status.setText("已停止，可通过菜单启动。");','showStartupFailure("运行环境已停止");');s=s.replaceAll('0.2.1-android.2','0.2.1-android.3');fs.writeFileSync(java,s);
const svg=fs.readFileSync('work/payload-x64/node_modules/@deepseek-ai/dsh-web-frontend/dist/favicon.svg','utf8');const d=svg.match(/ d="([^"]+)"/)[1];fs.writeFileSync(root+'/app/src/main/res/drawable/ic_whale.xml',`<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="64dp" android:height="64dp" android:viewportWidth="50" android:viewportHeight="50"><path android:fillColor="#4D6BFE" android:pathData="${d}"/></vector>\n`);
for(const f of ['app/build.gradle','tools/build.ps1']){let t=fs.readFileSync(root+'/'+f,'utf8').replaceAll('0.2.1-android.2','0.2.1-android.3').replace('versionCode 2','versionCode 3').replace('--version-code 2','--version-code 3');fs.writeFileSync(root+'/'+f,t)}
const css=root+'/app/src/main/assets/android-mobile.css';fs.appendFileSync(css,`
/* Mobile welcome: the original composer stays in the flex layout above the keyboard. */
html[data-harness-android] .wSkVaW_root[data-phase=hero] .wSkVaW_scrollBody { justify-content:flex-start!important; margin-right:0; scrollbar-gutter:auto; }
html[data-harness-android] .wSkVaW_root[data-phase=hero] .wSkVaW_composerSeat { flex:1; min-height:0; }
html[data-harness-android] .wSkVaW_composerHero { flex:1; min-height:0; width:100%; padding-bottom:max(12px,env(safe-area-inset-bottom)); gap:8px; }
html[data-harness-android] .wSkVaW_composerHero>.pXSMma_root { flex:1; height:auto; min-height:128px; padding:12px 20px; }
html[data-harness-android] .pXSMma_headline { flex-direction:column; gap:24px; font-size:22px; line-height:32px; font-weight:600; text-align:center; }
html[data-harness-android] .pXSMma_fish { width:52px; height:auto; color:#4d6bfe; }
html[data-harness-android] .pXSMma_previewBadge { display:none; }
html[data-harness-android] .wSkVaW_heroWorkspaceRow { flex:none; margin-top:0; padding:0 16px; }
html[data-harness-android] .uV2eYG_hero { flex:none; }
html[data-harness-android] .uV2eYG_card { border-radius:26px; border:1px solid var(--dsw-alias-border-l3,#e5e5e5); box-shadow:0 6px 24px #0000000b; }
html[data-harness-android] .uV2eYG_hero .uV2eYG_input { min-height:60px; }
html[data-harness-android] .uV2eYG_row { gap:8px; padding:2px 10px 8px; }
html[data-harness-android] .uV2eYG_add { width:34px; height:34px; }
html[data-harness-android] .hHd-Xa_collapsed .hHd-Xa_toggle { border-radius:50%!important; border:1px solid var(--dsw-alias-border-l3,#eee)!important; background:var(--dsw-alias-bg-base,#fff)!important; }
#harness-mobile-actions { position:fixed; top:6px; right:12px; height:44px; display:flex; align-items:center; padding:0 4px; z-index:80; border:1px solid var(--dsw-alias-border-l3,#eee); border-radius:24px; background:var(--dsw-alias-bg-base,#fff); }
#harness-mobile-actions>button { position:static; width:40px; height:42px; display:flex; align-items:center; justify-content:center; padding:0; border:0; border-radius:50%; color:var(--dsw-alias-label-primary,#222); background:transparent; cursor:pointer; }
#harness-mobile-actions>button:focus-visible { outline:2px solid #4d6bfe; outline-offset:-4px; }
#harness-mobile-actions svg { width:20px; height:20px; }
body:has(.VOzbGW_panel) #harness-mobile-actions,body:has(.pI_x6G_frame:not([data-sidebar-collapsed])) #harness-mobile-actions { display:none; }
html[data-harness-android] .wSkVaW_header:not(.wSkVaW_headerBlank) { right:108px; }
@media(max-height:500px) {
 html[data-harness-android] .wSkVaW_composerHero>.pXSMma_root { display:none; }
 html[data-harness-android] .wSkVaW_composerHero { justify-content:flex-end; }
 html[data-harness-android] .wSkVaW_body { --dsh-composer-text-max-height:120px; }
}
@media(max-width:360px) {
 html[data-harness-android] .pXSMma_headline { font-size:20px; }
 html[data-harness-android] .uV2eYG_row .uV2eYG_tools { gap:4px; }
}
`);
const js=root+'/app/src/main/assets/android-mobile.js';let j=fs.readFileSync(js,'utf8');j=j.replace("  var originalTools=document.querySelector('button[data-sidebar-right-expand]');",`  var title=document.querySelector('.pXSMma_titleGroup>span:first-child');
  if(title&&title.textContent==='探索未至之境')title.textContent='你好，让我们开始聊天吧';
  if(title&&title.textContent==='Into the Unknown')title.textContent="Hi, let's start chatting";
  var actions=document.getElementById('harness-mobile-actions');
  if(!actions){actions=document.createElement('div');actions.id='harness-mobile-actions';document.body.appendChild(actions);}
  var originalNew=document.querySelector('.hHd-Xa_newSession');
  if(originalNew&&!document.getElementById('harness-mobile-new')){var newChat=document.createElement('button');newChat.id='harness-mobile-new';newChat.type='button';newChat.setAttribute('aria-label','新建会话');var newSvg=originalNew.querySelector('svg');if(newSvg)newChat.appendChild(newSvg.cloneNode(true));else newChat.textContent='+';newChat.onclick=function(){document.querySelector('.hHd-Xa_newSession')?.click();hideDrawer()};actions.appendChild(newChat);}
  var originalTools=document.querySelector('button[data-sidebar-right-expand]');`);
j=j.replace('document.body.appendChild(tools);','actions.insertBefore(tools,actions.firstChild);');fs.writeFileSync(js,j);
console.log('Updated native splash, mobile welcome, real header actions and version 3');
