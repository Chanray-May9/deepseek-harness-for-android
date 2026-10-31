const {VdiReader}=require('./read-vdi.cjs'),{Ext4}=require('./read-ext4.cjs');
const v=new VdiReader('D:/Program Files/Netease/MuMu/vms/MuMuPlayer-15.0-1/data.vdi'),e=new Ext4(v);
for(const p of [['user','0','com.deepseek.harness.android'],['data','com.deepseek.harness.android']]){try{let n=e.find(p);console.log(p.join('/'), e.list(n));}catch(x){console.log(x.message)}}v.close();
