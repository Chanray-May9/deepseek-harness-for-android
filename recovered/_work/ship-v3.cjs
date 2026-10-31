const fs=require('fs');const root='outputs/DeepSeekHarness-Android-source';
fs.copyFileSync('outputs/MUMU-VALIDATION.json',root+'/MUMU-VALIDATION.json');
for(const n of ['mumu-startup-v3.png','mumu-home-v3.png','mumu-home-320-v3.png','mumu-drawer-v3.png','mumu-settings-v3.png','mumu-settings-dark.png','mumu-native-final-v3.png','mumu-short-viewport-v3.png'])fs.copyFileSync('outputs/'+n,root+'/docs/previews/'+n);
for(const abi of ['arm64','x64'])fs.copyFileSync(root+'/DeepSeekHarness-Android-'+abi+'.apk','outputs/DeepSeekHarness-Android-'+abi+'.apk');fs.copyFileSync(root+'/APK-VERIFICATION-arm64.json',root+'/APK-VERIFICATION.json');
console.log('Copied final APKs, report and selected real MuMu screenshots');
