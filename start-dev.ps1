# Record Management System - Development Server Startup Script

Write-Host "Starting Record Management System..." -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Check if Laravel backend is ready
if (-not (Test-Path "backend\database\database.sqlite")) {
    Write-Host "Database not found. Setting up database..." -ForegroundColor Yellow
    Set-Location "backend"
    php artisan migrate:fresh --seed
    Set-Location ".."
}

# Start Laravel backend server in background
Write-Host "Starting Laravel backend server on http://localhost:8000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location 'backend'; php artisan serve --host=0.0.0.0 --port=8000"

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start React frontend server
Write-Host "Starting React frontend server on http://localhost:5173..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Demo Accounts (Frontend + Backend Unified):" -ForegroundColor Yellow
Write-Host "Minister: minister@ministry.gov / minister123" -ForegroundColor White
Write-Host "Record Office (Admin): admin@ministry.gov / admin123" -ForegroundColor White
Write-Host "Department User: dit@ministry.gov / dept123" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop all servers" -ForegroundColor Red
Write-Host ""

npm run dev