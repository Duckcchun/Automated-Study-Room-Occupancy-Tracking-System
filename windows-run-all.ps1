$ErrorActionPreference = "Stop"

if (-not (Test-Path ".venv")) {
  throw "Missing .venv. Run windows-setup.ps1 first."
}

Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", "$(Get-Location)\windows-run-edge.ps1"
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", "$(Get-Location)\windows-run-web.ps1"

Write-Host "Launched edge and web processes in separate PowerShell windows."
