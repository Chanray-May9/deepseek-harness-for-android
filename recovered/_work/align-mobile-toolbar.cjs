const fs=require('fs'),p='outputs/DeepSeekHarness-Android-source/app/src/main/assets/android-mobile.js';let s=fs.readFileSync(p,'utf8');const needle="  if(!readySent){";s=s.replace(needle,`  var originalTools=document.querySelector('button[data-sidebar-right-expand]');
  var tools=document.getElementById('harness-mobile-tools');
  if(originalTools&&!tools){tools=document.createElement('button');tools.id='harness-mobile-tools';tools.type='button';tools.setAttribute('aria-label','工作区文件与终端');var svg=originalTools.querySelector('svg');if(svg)tools.appendChild(svg.cloneNode(true));else tools.textContent='▥';tools.onclick=function(){document.querySelector('button[data-sidebar-right-expand]')?.click()};document.body.appendChild(tools);}
  if(tools)tools.hidden=!originalTools;
`+needle);s=s.replace("if(tools)tools.hidden=!originalTools;","if(tools)tools.style.display=originalTools?'flex':'none';");fs.writeFileSync(p,s);
