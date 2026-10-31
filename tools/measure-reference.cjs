// Measure the reference screenshot: whale bounding box and the top controls,
// reported in logical pixels (image is @3x).
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const file = process.argv[2];
const dpr = Number(process.argv[3] || 3);

const ps = `
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Bitmap]::FromFile('${file.replace(/'/g, "''")}')
$w = $img.Width; $h = $img.Height
function Box { param($x0,$y0,$x1,$y1,$test)
  $minX=99999; $minY=99999; $maxX=-1; $maxY=-1
  for($y=$y0;$y -lt [Math]::Min($y1,$h);$y+=2){
    for($x=$x0;$x -lt [Math]::Min($x1,$w);$x+=2){
      $c=$img.GetPixel($x,$y)
      if(& $test $c){
        if($x -lt $minX){$minX=$x}; if($x -gt $maxX){$maxX=$x}
        if($y -lt $minY){$minY=$y}; if($y -gt $maxY){$maxY=$y}
      }
    }
  }
  if($maxX -lt 0){ return $null }
  return @{ x=$minX; y=$minY; w=($maxX-$minX); h=($maxY-$minY) }
}
$blue = { param($c) $c.B -gt 150 -and $c.R -lt 140 -and $c.G -lt 140 }
$ink  = { param($c) ($c.R + $c.G + $c.B) -lt 720 }
$whale = Box 0 ([int]($h*0.2)) $w ([int]($h*0.6)) $blue
$left  = Box 0 0 ([int]($w*0.3)) ([int]($h*0.12)) $ink
$right = Box ([int]($w*0.5)) 0 $w ([int]($h*0.12)) $ink
"W=$w H=$h"
if($whale){ "whale px={{x=$($whale.x);y=$($whale.y);w=$($whale.w);h=$($whale.h)}} logical={{x=$([math]::Round($whale.x/${dpr},1));y=$([math]::Round($whale.y/${dpr},1));w=$([math]::Round($whale.w/${dpr},1));h=$([math]::Round($whale.h/${dpr},1))}}" }
if($left){ "leftPx={{x=$($left.x);y=$($left.y);w=$($left.w);h=$($left.h)}} logical={{x=$([math]::Round($left.x/${dpr},1));y=$([math]::Round($left.y/${dpr},1));w=$([math]::Round($left.w/${dpr},1));h=$([math]::Round($left.h/${dpr},1))}}" }
if($right){ "rightPx={{x=$($right.x);y=$($right.y);w=$($right.w);h=$($right.h)}} logical={{x=$([math]::Round($right.x/${dpr},1));y=$([math]::Round($right.y/${dpr},1));w=$([math]::Round($right.w/${dpr},1));h=$([math]::Round($right.h/${dpr},1))}}" }
$img.Dispose()
`;

const out = execFileSync('pwsh', ['-NoProfile', '-Command', ps], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
console.log(out);
