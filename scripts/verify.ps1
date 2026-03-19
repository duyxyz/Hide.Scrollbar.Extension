param()

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot

& (Join-Path $PSScriptRoot 'build.ps1')
& (Join-Path $PSScriptRoot 'check.ps1')

Write-Host ''
Write-Host 'Ready to load unpacked from:' -ForegroundColor Green
Write-Host ' - test-builds/chromium' -ForegroundColor Green
Write-Host ' - test-builds/firefox' -ForegroundColor Green
