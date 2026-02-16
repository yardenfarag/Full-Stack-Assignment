# PowerShell script to run all services

Write-Host "==> Starting all services..." -ForegroundColor Blue
Write-Host ""

# Create logs directory if it doesn't exist
if (-not (Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" | Out-Null
}

# Start data-server
Write-Host "Starting data-server on port 3001..." -ForegroundColor Green
$dataServerJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    Set-Location data-server
    npm run dev *> "../logs/data-server.log"
}

# Start server
Write-Host "Starting server on port 3000..." -ForegroundColor Green
$serverJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    Set-Location server
    npm run dev *> "../logs/server.log"
}

# Start client
Write-Host "Starting client on port 5173..." -ForegroundColor Green
$clientJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    Set-Location client
    npm run dev *> "../logs/client.log"
}

# Wait a bit for services to start
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "============================================" -ForegroundColor Blue
Write-Host "  All services are running!"
Write-Host ""
Write-Host "  Data Server: http://localhost:3001"
Write-Host "  API Server:  http://localhost:3000"
Write-Host "  Frontend:    http://localhost:5173"
Write-Host ""
Write-Host "  Logs are being written to:"
Write-Host "    - logs/data-server.log"
Write-Host "    - logs/server.log"
Write-Host "    - logs/client.log"
Write-Host ""
Write-Host "  Press Ctrl+C to stop all services"
Write-Host "============================================" -ForegroundColor Blue
Write-Host ""

# Function to cleanup on exit
function Cleanup {
    Write-Host ""
    Write-Host "==> Stopping all services..." -ForegroundColor Yellow
    Stop-Job $dataServerJob, $serverJob, $clientJob -ErrorAction SilentlyContinue
    Remove-Job $dataServerJob, $serverJob, $clientJob -ErrorAction SilentlyContinue
}

# Register cleanup on exit
Register-EngineEvent PowerShell.Exiting -Action { Cleanup }

# Wait for user interrupt
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
}
finally {
    Cleanup
}

