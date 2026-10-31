const fs=require('fs'),path=require('path'),{chromium}=require('./build-deps/node_modules/playwright-core');
(async()=>{
 const root=path.resolve('outputs/DeepSeekHarness-Android-source/app/src/main/assets');
 const url=fs.readFileSync('work/screenshot-server.log','utf8').match(/http:\/\/127\.0\.0\.1:3095\/\S+/)[0];
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const c=await browser.newContext({viewport:{width:412,height:860},deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:'zh-CN'});
 await c.addInitScript(()=>{document.documentElement?.setAttribute('data-harness-android','true');});
 await c.route('**/android-mobile.js',r=>r.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(root,'android-mobile.js'),'utf8')}));
 await c.route('**/android-mobile.css',r=>r.fulfill({contentType:'text/css',body:fs.readFileSync(path.join(root,'android-mobile.css'),'utf8')}));
 await c.route('**/*',async r=>{if(r.request().resourceType()!=='document')return r.fallback(); const res=await r.fetch();let body=await res.text();body=body.replace('</head>','<link rel="stylesheet" href="/android-mobile.css"><script defer src="/android-mobile.js"></script></head>');await r.fulfill({response:res,body});});
 const p=await c.newPage();await p.goto(url,{waitUntil:'domcontentloaded'});await p.waitForTimeout(3500);
 if(await p.getByRole('button',{name:'继续',exact:true}).count()){await p.getByRole('button',{name:'继续',exact:true}).click();await p.waitForTimeout(2500);}
 console.log((await p.locator('body').innerText()).slice(0,5000));
 console.log(JSON.stringify(await p.getByRole('button').evaluateAll(es=>es.map(e=>({text:e.innerText,label:e.getAttribute('aria-label')})))));
 fs.mkdirSync('outputs/recovery-preview',{recursive:true});await p.screenshot({path:'outputs/recovery-preview/initial.png'});await c.storageState({path:'work/screenshot-state.json'});fs.writeFileSync('work/screenshot-dom.html',await p.content());await browser.close();
})().catch(e=>{console.error(e.message.replace(/token=[^\s"]+/g,'token=[REDACTED_SECRET]'));process.exit(1)});
