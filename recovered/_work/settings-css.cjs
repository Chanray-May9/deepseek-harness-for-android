const fs=require('fs');const s=fs.readFileSync('work/settings-dom.html','utf8');console.log(s.match(/\.VOzbGW_(?:panel|nav|options|content|header|navList|navTitle)[^{]*\{[^}]+\}/g)?.join('\n'));
