- Ran
param(
 [string]$SdkRoot = $env:ANDROID_HOME,
 [string]$JavaHome = $env:JAVA_HOME,
 [ValidateSet("arm64","x64","universal")][string]$Abi="arm64"
)
$ErrorActionPreference='Stop'
$projectRoot=Split-Path -Parent $PSScriptRoot
if(-not $SdkRoot){throw 'Pass -SdkRoot with an Android SDK containing platform 35 and build-tools 35.0.0.'}
if(-not $JavaHome){throw 'Pass -JavaHome with JDK 21.'}
$buildDir=Join-Path $projectRoot ('build/manual-'+$Abi)
$deps=Join-Path $buildDir 'deps'
New-Item -ItemType Directory -Force $deps,(Join-Path $buildDir 'classes'),(Join-Path $buildDir 'dex'),(Join-Path $buildDir 'generated') | Out-Null
$libs=@(
 @('org/apache/commons/commons-compress/1.27.1/commons-compress-1.27.1.jar','commons-compress.jar'),
 @('commons-io/commons-io/2.16.1/commons-io-2.16.1.jar','commons-io.jar'),
 @('commons-codec/commons-codec/1.17.1/commons-codec-1.17.1.jar','commons-codec.jar'),
 @('org/apache/commons/commons-lang3/3.16.0/commons-lang3-3.16.0.jar','commons-lang3.jar')
)
foreach($lib in $libs){
 $target=Join-Path $deps $lib[1]
 if(-not(Test-Path -LiteralPath $target)){& curl.exe -L --fail --silent --show-error --retry 2 ('https://repo.maven.apache.org/maven2/'+$lib[0]) -o $target;if($LASTEXITCODE){throw 'Dependency download failed'}}
}
$bt=Join-Path $SdkRoot 'build-tools/35.0.0'
$android=Join-Path $SdkRoot 'platforms/android-35/android.jar'
$env:HARNESS_BUILD_DIR=$buildDir
$env:HARNESS_PROJECT_ROOT=$projectRoot
$env:HARNESS_ABI=$Abi
& node (Join-Path $PSScriptRoot 'stage-assets.cjs')
if($LASTEXITCODE){throw 'Asset staging failed'}
$manifestForBuild=Join-Path $buildDir 'AndroidManifest.xml'
$manifestXml=Get-Content -LiteralPath (Join-Path $projectRoot 'app/src/main/AndroidManifest.xml') -Raw
$manifestXml=$manifestXml.Replace('<manifest ','<manifest package="com.deepseek.harness.android" ')
Set-Content -LiteralPath $manifestForBuild -Value $manifestXml -Encoding utf8
function CheckExit([string]$stage){if($LASTEXITCODE){throw "$stage failed ($LASTEXITCODE)"}}
& (Join-Path $bt 'aapt2.exe') compile --dir (Join-Path $projectRoot 'app/src/main/res') -o (Join-Path $buildDir 'resources.zip')
CheckExit 'Resource compile'
& (Join-Path $bt 'aapt2.exe') link --debug-mode -I $android --manifest $manifestForBuild --min-sdk-version 28 --target-sdk-version 28 --version-code 1 --version-name '0.2.1-android.1' --auto-add-overlay --java (Join-Path $buildDir 'generated') -A (Join-Path $buildDir 'assets') -0 gz -0 json -o (Join-Path $buildDir 'unsigned.apk') (Join-Path $buildDir 'resources.zip')
CheckExit 'Resource link'
$jars=@($libs | ForEach-Object {Join-Path $deps $_[1]})
$classPath=(@($android)+$jars) -join ';'
$javaFiles=@(Get-ChildItem -LiteralPath (Join-Path $projectRoot 'app/src/main/java') -Recurse -Filter '*.java' | ForEach-Object {$_.FullName})
& (Join-Path $JavaHome 'bin/javac.exe') -encoding UTF-8 -source 17 -target 17 -classpath $classPath -d (Join-Path $buildDir 'classes') @javaFiles
CheckExit 'Java compilation'
& (Join-Path $JavaHome 'bin/jar.exe') --create --file (Join-Path $buildDir 'app.jar') -C (Join-Path $buildDir 'classes') .
CheckExit 'Classes archive'
$env:JAVA_HOME=$JavaHome
& (Join-Path $bt 'd8.bat') --min-api 28 --lib $android --output (Join-Path $buildDir 'dex') (Join-Path $buildDir 'app.jar') @jars
CheckExit 'DEX compilation'
$env:HARNESS_BUILD_DIR=$buildDir
$env:HARNESS_PROJECT_ROOT=$projectRoot
& node (Join-Path $PSScriptRoot 'package-apk.cjs')
CheckExit 'APK assembly'
$keystore=Join-Path $projectRoot 'app/debug.keystore'
if(-not(Test-Path -LiteralPath $keystore)){
 & (Join-Path $JavaHome 'bin/keytool.exe') -genkeypair -keystore $keystore -storepass android -keypass android -alias androiddebugkey -keyalg RSA -keysize 2048 -validity 10000 -dname 'CN=Android Debug,O=Android,C=US' -storetype JKS
 CheckExit 'Development key generation'
}
& (Join-Path $bt 'zipalign.exe') -f -p 4 (Join-Path $buildDir 'unsigned.apk') (Join-Path $buildDir 'aligned.apk')
CheckExit 'APK alignment'
$apk=Join-Path $projectRoot ('DeepSeekHarness-Android-'+$Abi+'.apk')
& (Join-Path $bt 'apksigner.bat') sign --ks $keystore --ks-key-alias androiddebugkey --ks-pass pass:android --key-pass pass:android --out $apk (Join-Path $buildDir 'aligned.apk')
CheckExit 'APK signing'
& (Join-Path $bt 'apksigner.bat') verify --verbose $apk
CheckExit 'Signature verification'
Write-Output $apk
