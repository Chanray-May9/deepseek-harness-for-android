const fs=require('node:fs');
class Cdp {
 constructor(ws){this.ws=ws;this.id=0;this.pending=new Map();this.events=[];ws.addEventListener('message',e=>{const x=JSON.parse(e.data);if(x.id){const p=this.pending.get(x.id);if(p){this.pending.delete(x.id);clearTimeout(p.timer);x.error?p.reject(Error(JSON.stringify(x.error))):p.resolve(x.result);}}else this.events.push(x);});}
 static async connect(){const pages=await(await fetch('http://127.0.0.1:9316/json/list')).json();const page=pages.find(p=>p.type==='page'&&p.url.startsWith('http://127.0.0.1:3080/'));if(!page)throw Error('Harness WebView not found');const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.addEventListener('open',r,{once:true});ws.addEventListener('error',j,{once:true});});return new Cdp(ws);}
 send(method,params={}){return new Promise((resolve,reject)=>{const id=++this.id;const timer=setTimeout(()=>{this.pending.delete(id);reject(Error('CDP timeout: '+method));},20000);this.pending.set(id,{resolve,reject,timer});this.ws.send(JSON.stringify({id,method,params}));});}
 async eval(expression){const r=await this.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;}
 async shot(file){const r=await this.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(file,Buffer.from(r.data,'base64'));}
 close(){this.ws.close();}
}
module.exports={Cdp};
if(require.main===module)(async()=>{const c=await Cdp.connect();await c.send('Runtime.enable');console.log(JSON.stringify(await c.eval('({title:document.title,body:document.body.innerText,width:innerWidth,height:innerHeight,dpr:devicePixelRatio})'),null,2));await c.shot('outputs/mumu-first-launch.png');fs.writeFileSync('work/mumu-dom.html',await c.eval('document.documentElement.outerHTML'));c.close();})().catch(e=>{console.error(e.message);process.exit(1)});
