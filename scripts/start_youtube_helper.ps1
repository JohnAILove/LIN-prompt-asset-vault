$OutputEncoding = [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$root = Split-Path -Parent $PSScriptRoot
$python = Join-Path $root ".venv\\Scripts\\python.exe"
$script = Join-Path $PSScriptRoot "youtube_helper.py"

Start-Process -FilePath $python -ArgumentList $script -WorkingDirectory $root -WindowStyle Hidden
Write-Output "YouTube helper started."
