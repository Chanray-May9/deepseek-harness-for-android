const fs=require('fs'),path=require('path');
function exactly(source,before,after,label){const count=source.split(before).length-1;if(count!==1)throw Error(label+' expected 1 match, found '+count);return source.replace(before,after)}
function adaptPayload(root){
 const dist=path.join(root,'node_modules/@deepseek-ai/dsh-web-frontend/dist/assets');
 const file=fs.readdirSync(dist).find(n=>/^index-.*\.js$/.test(n));if(!file)throw Error('Frontend entry missing');const f=path.join(dist,file);let code=fs.readFileSync(f,'utf8');
 if(!code.includes('/* harness-android-menu-v1 */')){
  const first=code.indexOf('function k_({open:'),a=code.indexOf('const O=()=>{let we;',first),b=code.indexOf('};O();const ee=()=>{O(),ve=requestAnimationFrame(ee)}',a);
  if(first<0||a<0||b<0)throw Error('Pinned menu function not found');
  const position=`const O=()=>{/* harness-android-menu-v1 */let we=E!==void 0?E():D.current?.getBoundingClientRect()??null;if(we===null)return;const X=12,Ie=window.innerWidth,ne=window.innerHeight,Ce=L.current,android=document.documentElement.hasAttribute('data-harness-android'),above=android&&we.top>120&&m!=='right',gap=android?8:4;if(Ce&&android){const max=Math.max(44,above?we.top-Ws(X)-gap:ne-we.bottom-X-gap),value=max+'px';if(Ce.style.maxHeight!==value)Ce.style.maxHeight=value;if(Ce.style.overflowY!=='auto')Ce.style.overflowY='auto';}const He=Ce?.offsetWidth??0,dt=Ce?.offsetHeight??0;let nt=m==='right'?we.right+gap:h==='start'?we.left:we.right-He,qe=m==='right'?we.top:above||m==='top'?we.top-dt-gap:we.bottom+gap;if(He>0)nt=Math.max(X,Math.min(nt,Ie-He-X));if(dt>0)qe=Math.max(Ws(X),Math.min(qe,ne-dt-X));re(gt=>gt?.left===nt&&gt.top===qe?gt:{left:nt,top:qe})`;
  code=code.slice(0,a)+position+code.slice(b);
  code=exactly(code,'ee=ne=>{ne.target instanceof Node&&D.current?.contains(ne.target)!==!0&&L.current?.contains(ne.target)!==!0&&d()}','ee=ne=>{if(!(ne.target instanceof Node)||D.current?.contains(ne.target)===!0||L.current?.contains(ne.target)===!0)return;const anchor=E?.();if(document.documentElement.hasAttribute("data-harness-android")&&anchor&&ne.clientX>=anchor.left&&ne.clientX<=anchor.right&&ne.clientY>=anchor.top&&ne.clientY<=anchor.bottom)return;d()}','external-anchor dismissal');
  fs.writeFileSync(f,code);
 }
 console.log('Adapted Android menu positioning and anchor toggle:',root);
}
if(require.main===module){for(const arg of process.argv.slice(2))adaptPayload(path.resolve(arg));}module.exports={adaptPayload};
