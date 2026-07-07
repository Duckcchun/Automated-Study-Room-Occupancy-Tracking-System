$ErrorActionPreference = "Stop"

Write-Host "Starting Next.js web app in a new window..."
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", "$(Get-Location)\windows-run-web.ps1"

Write-Host "Starting edge tracker in a new window..."
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", "$(Get-Location)\windows-run-edge.ps1"

Write-Host "Both services are launching."
