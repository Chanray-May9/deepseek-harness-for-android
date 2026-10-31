const fs=require('fs'),p=require('path');const avd=p.resolve('work/avd'), image=p.resolve('work/emulator-sdk/system-images/android-35/default/x86_64');fs.writeFileSync(avd+'/HarnessQA.ini','avd.ini.encoding=UTF-8\npath='+avd+'/HarnessQA.avd\ntarget=android-35\n');fs.writeFileSync(avd+'/HarnessQA.avd/config.ini',`AvdId=HarnessQA
avd.ini.encoding=UTF-8
abi.type=x86_64
hw.cpu.arch=x86_64
hw.cpu.ncore=2
hw.device.name=pixel_2
hw.lcd.width=1080
hw.lcd.height=1920
hw.lcd.density=420
hw.gpu.enabled=yes
hw.gpu.mode=swiftshader_indirect
hw.ramSize=2048
disk.dataPartition.size=4G
image.sysdir.1=${image}
tag.id=default
tag.display=Default Android System Image
target=android-35
`);
