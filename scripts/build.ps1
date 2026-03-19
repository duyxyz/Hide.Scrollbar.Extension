param()

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$outputRoot = Join-Path $root 'test-builds'
$targets = @(
  @{
    Name = 'chromium'
    Manifest = Join-Path $root 'platform\chromium\manifest.json'
  },
  @{
    Name = 'firefox'
    Manifest = Join-Path $root 'platform\firefox\manifest.json'
  }
)

$copyItems = @(
  '_locales',
  'assets',
  'src'
)

if (Test-Path $outputRoot) {
  Remove-Item $outputRoot -Recurse -Force
}

New-Item -ItemType Directory -Path $outputRoot | Out-Null

foreach ($target in $targets) {
  $destination = Join-Path $outputRoot $target.Name
  New-Item -ItemType Directory -Path $destination | Out-Null

  foreach ($item in $copyItems) {
    Copy-Item -Path (Join-Path $root $item) -Destination $destination -Recurse
  }

  Copy-Item -Path $target.Manifest -Destination (Join-Path $destination 'manifest.json')
}

Write-Host 'Test builds refreshed:'
foreach ($target in $targets) {
  Write-Host " - test-builds/$($target.Name)"
}
