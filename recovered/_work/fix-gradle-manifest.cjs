const fs=require('fs');const root='outputs/DeepSeekHarness-Android-source';let p=root+'/app/src/main/AndroidManifest.xml',s=fs.readFileSync(p,'utf8');s=s.replace(' package="com.deepseek.harness.android"','');fs.writeFileSync(p,s);p=root+'/tools/build.ps1';s=fs.readFileSync(p,'utf8');s=s.replace("function CheckExit([string]$stage)",`$manifestForBuild=Join-Path $buildDir 'AndroidManifest.xml'
$manifestXml=Get-Content -LiteralPath (Join-Path $projectRoot 'app/src/main/AndroidManifest.xml') -Raw
$manifestXml=$manifestXml.Replace('<manifest ','<manifest package="com.deepseek.harness.android" ')
Set-Content -LiteralPath $manifestForBuild -Value $manifestXml -Encoding utf8
function CheckExit([string]$stage)`);s=s.replace("--manifest (Join-Path $projectRoot 'app/src/main/AndroidManifest.xml')","--manifest $manifestForBuild");fs.writeFileSync(p,s);
p=root+'/tools/adapt-mobile.cjs';s=fs.readFileSync(p,'utf8');s=s.replace(/const manifest=path.resolve[\s\S]*?fs.writeFileSync\(manifest,m\);\n/,'');fs.writeFileSync(p,s);
