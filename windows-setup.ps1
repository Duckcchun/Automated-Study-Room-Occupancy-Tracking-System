$ErrorActionPreference = "Stop"

Write-Host "[1/3] Creating Python virtual environment if needed..."
if (-not (Test-Path ".venv")) {
  py -3.10 -m venv .venv
}

Write-Host "[2/3] Installing Python dependencies..."
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install opencv-python ultralytics requests

Write-Host "[3/3] Installing web dependencies..."
npm install

Write-Host "Setup complete. Copy .env.example to .env.local and fill in your values before running the app."
