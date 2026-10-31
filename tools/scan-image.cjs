// Scan a screenshot band by band and report dominant colours, so what is on
// screen is described by pixels rather than impression.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const file = process.argv[2];
const bands = Number(process.argv[3] || 40);

const script = `
Add-Type -AssemblyName System.Drawing
$img=[System.Drawing.Bitmap]::FromFile('${file.replace(/\\/g, '\\\\')}')
$h=$img.Height; $w=$img.Width
$rows=[Math]::Max(1,[int]($h/${bands}))
for($y=0;$y -lt $h;$y+=$rows){
  $counts=@{}
  for($x=0;$x -lt $w;$x+=[Math]::Max(1,[int]($w/60))){
    $c=$img.GetPixel($x,[Math]::Min($y,$h-1))
    $k="$($c.R),$($c.G),$($c.B)"
    if($counts.ContainsKey($k)){$counts[$k]++}else{$counts[$k]=1}
  }
  $top=$counts.GetEnumerator()|Sort-Object Value -Descending|Select-Object -First 2
  $desc=($top|ForEach-Object{"$($_.Name) x$($_.Value)"}) -join ' | '
  "{0,5}-{1,5}  {2}" -f $y,[Math]::Min($y+$rows,$h)-1,$desc
}
$img.Dispose()
`;
const out = execFileSync('pwsh', ['-NoProfile', '-Command', script], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
console.log(out);
