const fs=require('fs');const p='outputs/DeepSeekHarness-Android-source/tools/prepare-assets.cjs';let s=fs.readFileSync(p,'utf8');let start=s.indexOf(' const token='[REDACTED_SECRET]" const nodeVersion=",start);
s=s.slice(0,start)+` const release='24.04.5', filename='ubuntu-base-'+release+'-base-'+(arch==='arm64'?'arm64':'amd64')+'.tar.gz';
 const baseUrl='https://cdimage.ubuntu.com/ubuntu-base/releases/24.04/release/';
 const rootfs=await download(baseUrl+filename,path.join(ASSETS,'rootfs-'+arch+'.tar.gz'));
 const rootSums=fetchText(baseUrl+'SHA256SUMS');
 const rootExpected=rootSums.split('\\n').find(x=>x.endsWith(filename)).split(/\\s/)[0];
 if(crypto.createHash('sha256').update(fs.readFileSync(rootfs)).digest('hex')!==rootExpected)throw Error('Rootfs checksum');
`+s.slice(end);s=s.replace('ubuntuManifest:digest,rootfsDigest:layer.digest',"ubuntuRelease:release,rootfsSha256:rootExpected");s=s.replace("console.error(e);process.exit(1)","console.error(e.message.replace(/Bearer [^ ]+/g,'Bearer [redacted]'));process.exit(1)");fs.writeFileSync(p,s);
