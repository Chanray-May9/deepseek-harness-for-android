$ErrorActionPreference='Stop'
$projectRoot=Split-Path -Parent $PSScriptRoot
$cache=Join-Path $PSScriptRoot '.cache'
& npm ci --prefix $PSScriptRoot --ignore-scripts --no-audit --no-fund
if($LASTEXITCODE){throw 'Build tool installation failed'}
foreach($arch in @('arm64','x64')){
 $payload=Join-Path $cache ('payload-'+$arch)
 New-Item -ItemType Directory -Force $payload | Out-Null
 Copy-Item -LiteralPath (Join-Path $PSScriptRoot "locks/$arch/package.json"),(Join-Path $PSScriptRoot "locks/$arch/package-lock.json") -Destination $payload -Force
 & npm ci --prefix $payload --ignore-scripts --os=linux --cpu=$arch --libc=glibc --no-audit --no-fund
 if($LASTEXITCODE){throw "Harness installation failed: $arch"}
 & node (Join-Path $PSScriptRoot 'prepare-assets.cjs') $arch
 if($LASTEXITCODE){throw "Runtime download failed: $arch"}
}
& node (Join-Path $PSScriptRoot 'adapt-mobile.cjs') $cache
if($LASTEXITCODE){throw 'Mobile layout adaptation failed'}
& node (Join-Path $PSScriptRoot 'pack-harness.cjs') $cache
if($LASTEXITCODE){throw 'Harness packaging failed'}
