(function(){
 document.documentElement.dataset.harnessAndroid='true';
 var initial=false,readySent=false,queued=false;
 function button(label){return Array.from(document.querySelectorAll('button')).find(function(b){return b.getAttribute('aria-label')===label&&b.getBoundingClientRect().width>0});}
 function hideDrawer(){var b=document.querySelector('.hHd-Xa_root:not(.hHd-Xa_collapsed) .hHd-Xa_toggle');if(b){b.click();return true}return false;}
 window.HarnessMobile={back:function(){
  var panel=document.querySelector('.VOzbGW_panel');if(panel){panel.querySelector('.VOzbGW_close')?.click();return true;}
  var dialog=Array.from(document.querySelectorAll('[role=dialog]')).find(function(d){return d.getBoundingClientRect().width>0});
  if(dialog){var close=dialog.querySelector('button[aria-label="关闭"],button[aria-label="Close"]');if(close){close.click();return true}}
  if(hideDrawer())return true;var r=button('收起右侧边栏')||button('Close right sidebar');if(r){r.click();return true}return false;
 }};
 function reconcile(){
  queued=false;var frame=document.querySelector('.pI_x6G_frame');if(!frame)return;
  if(!initial){initial=true;hideDrawer();}
  var sidebar=frame.querySelector('.pI_x6G_sidebarCol');
  if(sidebar&&!document.getElementById('harness-android-files')){var files=document.createElement('button');files.id='harness-android-files';files.type='button';files.textContent='本地文件与运行';files.onclick=function(){window.HarnessAndroidExport?.openMenu()};sidebar.appendChild(files);}
  if(!document.getElementById('harness-drawer-backdrop')){var backdrop=document.createElement('div');backdrop.id='harness-drawer-backdrop';backdrop.onclick=hideDrawer;document.body.appendChild(backdrop);}
  if(!readySent){var workspace=button('选择工作区')||button('Choose workspace');if(workspace&&workspace.innerText.trim()&&!/^(选择工作区|Choose workspace)$/.test(workspace.innerText.trim())&&!document.body.innerText.includes('重新连接中')){readySent=true;window.HarnessAndroidExport?.ready();}}
 }
 function changed(){if(!queued){queued=true;requestAnimationFrame(reconcile)}}
 function start(){new MutationObserver(changed).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['data-sidebar-collapsed']});changed();}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
