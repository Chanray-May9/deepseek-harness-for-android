const fs=require('fs'),path=require('path');const {chromium}=require('./build-deps/node_modules/playwright-core');
(async()=>{
 const text=fs.readFileSync('work/qa-backend.log','utf8'),url=text.match(/http:\/\/127\.0\.0\.1:3090\/\S+/)[0];
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 let errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url,{waitUntil:'networkidle',timeout:60000});
 await page.waitForTimeout(3000);
 await page.screenshot({path:'outputs/preview-mobile-browser.png',fullPage:true});
 console.log(JSON.stringify({title:await page.title(),text:(await page.locator('body').innerText()).slice(0,5500),errors},null,2));
 fs.writeFileSync('work/browser-dom.html',await page.content());
 await browser.close();
})().catch(e=>{console.error(e.message);process.exit(1)});
