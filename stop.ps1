# PowerShell script to stop all services

Write-Host "==> Stopping all services..." -ForegroundColor Yellow

# Kill processes on ports 3001, 3000, and 5173
$ports = @(3001, 3000, 5173)

foreach ($port in $ports) {
    $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    if ($process) {
        Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
        Write-Host "Stopped process on port $port" -ForegroundColor Green
    }
}

Write-Host "Done!" -ForegroundColor Green

