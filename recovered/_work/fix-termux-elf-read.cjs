const fs=require('fs');let p='work/check-termux-native.cjs',s=fs.readFileSync(p,'utf8').replace('b=files[name]','b=files[name]&&Buffer.from(files[name])');fs.writeFileSync(p,s)
