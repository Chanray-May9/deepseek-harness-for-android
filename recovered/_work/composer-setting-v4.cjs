const fs=require('fs');const root='outputs/DeepSeekHarness-Android-source';const js=root+'/app/src/main/assets/android-mobile.js';let j=fs.readFileSync(js,'utf8');j=j.replace(" var initial=false,readySent=false,queued=false,lastDark;",` var initial=false,readySent=false,queued=false,lastDark;
 var composerStyle='card';try{if(localStorage.getItem('harness.android.composerStyle')==='single')composerStyle='single';}catch(e){}
 document.documentElement.dataset.harnessComposerStyle=composerStyle;
 function setComposerStyle(value){composerStyle=value;try{localStorage.setItem('harness.android.composerStyle',value);}catch(e){}document.documentElement.dataset.harnessComposerStyle=value;changed();}
 function composerSetting(){
  var options=document.querySelector('.VOzbGW_options'),nav=document.querySelector('.VOzbGW_navList');
  var general=options&&nav&&nav.querySelector('.VOzbGW_navCell')===nav.querySelector('.VOzbGW_navCell[aria-current="true"]');
  var row=document.getElementById('harness-composer-setting');
  if(!general){if(row)row.remove();return;}
  if(!row){
   row=document.createElement('div');row.id='harness-composer-setting';
   var text=document.createElement('div'),title=document.createElement('div'),desc=document.createElement('div');title.id='harness-composer-setting-title';title.textContent='输入框样式';desc.className='harness-setting-description';desc.textContent='单行输入在编辑时自动展开，选择会保存在本机。';text.appendChild(title);text.appendChild(desc);row.appendChild(text);
   var choices=document.createElement('div');choices.className='harness-composer-choices';choices.setAttribute('role','group');choices.setAttribute('aria-labelledby',title.id);
   [['card','双层卡片'],['single','单行输入']].forEach(function(choice){var b=document.createElement('button');b.type='button';b.dataset.composerStyle=choice[0];b.textContent=choice[1];b.onclick=function(){setComposerStyle(choice[0])};choices.appendChild(b)});row.appendChild(choices);options.insertBefore(row,options.firstChild);
  }
  row.querySelectorAll('button').forEach(function(b){var pressed=String(b.dataset.composerStyle===composerStyle);if(b.getAttribute('aria-pressed')!==pressed)b.setAttribute('aria-pressed',pressed)});
 }`);
j=j.replace("  ['content','code','terminal'].forEach", "  composerSetting();\n  ['content','code','terminal'].forEach");j=j.replace("   if(!input)return;",`   if(!input)return;
   var attachments=composer.querySelector('[data-slot="conversation.input.attachments"]');
   var compact=composerStyle==='single'&&!input.innerText.trim()&&!composer.contains(document.activeElement)&&!composer.querySelector('[aria-expanded="true"]')&&!(attachments&&attachments.childElementCount);
   composer.toggleAttribute('data-harness-compact',compact);`);j=j.replace("function start(){new MutationObserver", "function start(){document.addEventListener('focusin',changed);document.addEventListener('focusout',changed);new MutationObserver");fs.writeFileSync(js,j);
fs.appendFileSync(root+'/app/src/main/assets/android-mobile.css',`
/* Optional single-row composer, enabled from General settings. */
html[data-harness-android][data-harness-composer-style=single] .uV2eYG_hero[data-harness-compact] .uV2eYG_card { display:grid; grid-template-columns:44px minmax(0,1fr) 44px; gap:0; min-height:64px; padding:8px; border-radius:34px; align-items:center; }
html[data-harness-android][data-harness-composer-style=single] .uV2eYG_hero[data-harness-compact] .uV2eYG_scroll { grid-column:2; grid-row:1; margin:0; min-width:0; overflow:hidden; }
html[data-harness-android][data-harness-composer-style=single] .uV2eYG_hero[data-harness-compact] .uV2eYG_input { min-height:44px; padding:8px 4px; }
html[data-harness-android][data-harness-composer-style=single] .uV2eYG_hero[data-harness-compact] .uV2eYG_placeholder { top:8px; left:4px; right:4px; white-space:nowrap; display:block; text-overflow:ellipsis; }
html[data-harness-android][data-harness-composer-style=single] .uV2eYG_hero[data-harness-compact] .uV2eYG_row,html[data-harness-android][data-harness-composer-style=single] .uV2eYG_hero[data-harness-compact] .uV2eYG_tools,html[data-harness-android][data-harness-composer-style=single] .uV2eYG_hero[data-harness-compact] .uV2eYG_trailing { display:contents; }
html[data-harness-android][data-harness-composer-style=single] .uV2eYG_hero[data-harness-compact] .uV2eYG_add { grid-column:1; grid-row:1; background:transparent; }
html[data-harness-android][data-harness-composer-style=single] .uV2eYG_hero[data-harness-compact] .uV2eYG_primary { grid-column:3; grid-row:1; }
html[data-harness-android][data-harness-composer-style=single] .uV2eYG_hero[data-harness-compact] .uV2eYG_modes,html[data-harness-android][data-harness-composer-style=single] .uV2eYG_hero[data-harness-compact] .uV2eYG_standardControls,html[data-harness-android][data-harness-composer-style=single] .uV2eYG_hero[data-harness-compact] .uV2eYG_activity { display:none; }
#harness-composer-setting { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:12px 20px; padding:0 0 20px; margin-bottom:20px; border-bottom:1px solid var(--dsw-alias-border-l3,#eee); color:var(--dsw-alias-label-primary,#222); font-size:16px; }
#harness-composer-setting>div:first-child { flex:1 1 200px; min-width:0; }
.harness-setting-description { color:var(--dsw-alias-label-secondary,#666); font-size:14px; line-height:22px; margin-top:6px; }
.harness-composer-choices { display:flex; gap:8px; flex-wrap:wrap; }
.harness-composer-choices button { min-height:48px; border:1px solid var(--dsw-alias-border-l3,#ddd); border-radius:12px; padding:10px 14px; background:transparent; color:inherit; font:inherit; cursor:pointer; }
.harness-composer-choices button[aria-pressed=true] { background:var(--dsw-alias-interactive-bg-hover,#eef0f4); border-color:var(--dsw-alias-label-secondary,#697382); }
.harness-composer-choices button:focus-visible { outline:2px solid #4d6bfe; outline-offset:2px; }
`);console.log('Added persistent composer style option to General settings');
