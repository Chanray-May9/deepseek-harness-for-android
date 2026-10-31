const fs=require('fs');fs.writeFileSync('work/mumu-cold-start-v5.cjs',fs.readFileSync('work/mumu-cold-start-v4.cjs','utf8').replaceAll('startup-v4','startup-v5'));
