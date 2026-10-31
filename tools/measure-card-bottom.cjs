// Find the composer card's bottom border line in a screenshot by scanning a column.
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const files = process.argv.slice(2);
if (!files.length) {
  console.error('usage: measure-card-bottom.cjs <png> [png...]');
  process.exit(1);
}

const ps = `
Add-Type -AssemblyName System.Drawing
$files = @(${files.map((f) => "'" + f.replace(/\\/g, '\\\\').replace(/'/g, "''") + "'").join(',')})
foreach($f in $files){
  $img = [System.Drawing.Bitmap]::FromFile($f)
  $w = $img.Width; $h = $img.Height
  $x = [int]($w/2)
  $found = -1
  for($y = $h - 1; $y -gt [int]($h*0.6); $y--){
    $c = $img.GetPixel($x, $y)
    $sum = $c.R + $c.G + $c.B
    if($sum -lt 735 -and $sum -gt 0){
      $found = $y
      break
    }
  }
  # also scan the left border column to catch the rounded corner
  $xl = 20
  $foundL = -1
  for($y = $h - 1; $y -gt [int]($h*0.6); $y--){
    $c = $img.GetPixel($xl, $y)
    if(($c.R + $c.G + $c.B) -lt 735){ $foundL = $y; break }
  }
  "{0}: size={1}x{2} bottomInkCenterY={3} bottomInkLeftY={4} logicalCenter={5}" -f [System.IO.Path]::GetFileName($f), $w, $h, $found, $foundL, [math]::Round($found/3,1)
  $img.Dispose()
}
`;

console.log(execFileSync('pwsh', ['-NoProfile', '-Command', ps], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }));
