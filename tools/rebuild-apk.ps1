param(
  [Parameter(Mandatory = $true)][string]$SdkRoot,
  [Parameter(Mandatory = $true)][string]$JavaHome,
  [string]$ProjectRoot = (Join-Path $PSScriptRoot '..'),
  [string]$Abi = 'x64',
  # Non-empty values install side by side with the original package instead of replacing it.
  [string]$PackageSuffix = ''
)
$ErrorActionPreference = 'Stop'
$ProjectRoot = (Resolve-Path $ProjectRoot).Path
$bt = Join-Path $SdkRoot 'build-tools/35.0.0'
$android = Join-Path $SdkRoot 'platforms/android-35/android.jar'
$build = Join-Path $ProjectRoot 'build/rebuild'
$deps = Join-Path $ProjectRoot 'tools/deps'

if (Test-Path $build) { Remove-Item -LiteralPath $build -Recurse -Force }
New-Item -ItemType Directory -Force $build, "$build/classes", "$build/dex", "$build/gen" | Out-Null

function CheckExit([string]$stage) { if ($LASTEXITCODE) { throw "$stage failed ($LASTEXITCODE)" } }

# The recovered manifest keeps the framework theme as the numeric id aapt2 printed.
# For a real build it is swapped for the equivalent platform style; the original
# binary and the xmltree dump stay in artifacts/ and tools/axml/ as evidence.
$manifestSrc = Join-Path $ProjectRoot 'app/src/main/AndroidManifest.xml'
$manifestForBuild = Join-Path $build 'AndroidManifest.xml'
$xml = Get-Content -LiteralPath $manifestSrc -Raw
$xml = $xml.Replace('android:theme="@0x01030241"', 'android:theme="@android:style/Theme.Material.Light.NoActionBar"')
# aapt2 prints these flags as raw bit values; the build needs the symbolic form.
#   0x000004a0 = keyboardHidden(0x20) | orientation(0x80) | screenSize(0x400)
#   0x00000010 = adjustResize
$xml = $xml.Replace('android:configChanges="0x000004a0"', 'android:configChanges="keyboardHidden|orientation|screenSize"')
$xml = $xml.Replace('android:windowSoftInputMode="0x00000010"', 'android:windowSoftInputMode="adjustResize"')
Set-Content -LiteralPath $manifestForBuild -Value $xml -Encoding utf8

Write-Output '--- resources ---'
& (Join-Path $bt 'aapt2.exe') compile --dir (Join-Path $ProjectRoot 'app/src/main/res') -o "$build/res.zip"
CheckExit 'Resource compile'

$linkArgs = @(
  '-I', $android,
  '--manifest', $manifestForBuild,
  '--min-sdk-version', '28', '--target-sdk-version', '28',
  '--version-code', '6', '--version-name', '0.2.1-android.5'
)
if ($PackageSuffix) { $linkArgs += @('--rename-manifest-package', "com.deepseek.harness.$PackageSuffix") }
$linkArgs += @(
  '--java', "$build/gen",
  '-A', (Join-Path $ProjectRoot 'app/src/main/assets'),
  '-0', 'gz', '-0', 'bin',
  '-o', "$build/unsigned.apk", "$build/res.zip"
)
& (Join-Path $bt 'aapt2.exe') link @linkArgs
CheckExit 'Resource link'
Write-Output ("unsigned.apk " + [math]::Round((Get-Item "$build/unsigned.apk").Length / 1MB, 1) + ' MB')

Write-Output '--- java ---'
$jars = @(Get-ChildItem -LiteralPath $deps -Filter '*.jar' | ForEach-Object FullName)
$cp = (@($android) + $jars) -join ';'
$javaFiles = @(Get-ChildItem -LiteralPath (Join-Path $ProjectRoot 'app/src/main/java') -Recurse -Filter '*.java' | ForEach-Object FullName)
& (Join-Path $JavaHome 'bin/javac.exe') -encoding UTF-8 -nowarn -classpath $cp -d "$build/classes" @javaFiles
CheckExit 'Java compile'

& (Join-Path $JavaHome 'bin/jar.exe') --create --file "$build/app.jar" -C "$build/classes" .
CheckExit 'Jar'

$env:JAVA_HOME = $JavaHome
& (Join-Path $bt 'd8.bat') --min-api 28 --lib $android --output "$build/dex" "$build/app.jar" @jars
CheckExit 'DEX'

Write-Output '--- assemble ---'
$env:REBUILD_APK = "$build/unsigned.apk"
$env:REBUILD_DEX = "$build/dex"
$env:REBUILD_LIB = (Join-Path $ProjectRoot "app/src/main/jniLibs")
$env:REBUILD_ABI = $Abi
& node (Join-Path $PSScriptRoot 'assemble-apk.cjs')
CheckExit 'Assemble'

$keystore = Join-Path $ProjectRoot 'tools/rebuild.keystore'
# Reuse one key: regenerating it on every build breaks over-install of the test package.
if (-not (Test-Path $keystore)) {
  & (Join-Path $JavaHome 'bin/keytool.exe') -genkeypair -keystore $keystore -storepass android -keypass android `
    -alias rebuildkey -keyalg RSA -keysize 2048 -validity 10000 -dname 'CN=Rebuild,O=Recovery,C=CN' -storetype JKS
  CheckExit 'Key generation'
}

& (Join-Path $bt 'zipalign.exe') -f -P 16 4 "$build/unsigned.apk" "$build/aligned.apk"
CheckExit 'Align'

$apk = Join-Path $ProjectRoot 'DeepSeekHarness-Android-0.2.1-android.5-rebuilt.apk'
& (Join-Path $bt 'apksigner.bat') sign --ks $keystore --ks-key-alias rebuildkey --ks-pass pass:android --key-pass pass:android --out $apk "$build/aligned.apk"
CheckExit 'Sign'
& (Join-Path $bt 'apksigner.bat') verify --verbose $apk
CheckExit 'Verify'
Write-Output $apk


