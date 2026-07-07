$ErrorActionPreference = "Stop"

if (-not (Test-Path ".venv")) {
  throw "Missing .venv. Run windows-setup.ps1 first."
}

.\.venv\Scripts\python.exe phase1_edge_counter.py
