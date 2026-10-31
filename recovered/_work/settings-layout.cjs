const fs=require('fs');const s=fs.readFileSync('work/settings-dom.html','utf8');const i=s.indexOf('role="dialog"'); console.log(s.slice(i,i+9000).replace(/<svg[\s\S]*?<\/svg>/g,'[svg]'));
