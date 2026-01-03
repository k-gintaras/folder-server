# Mount G: drive in WSL and start Docker containers
Write-Host "🔧 Mounting G: drive in WSL..." -ForegroundColor Yellow
wsl -u root sh -c "mkdir -p /mnt/g && mount -t drvfs G: /mnt/g"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ G: drive mounted successfully" -ForegroundColor Green
    Write-Host "🚀 Starting Docker containers..." -ForegroundColor Yellow
    Set-Location "C:\Users\Ubaby\Desktop\folder-server"
    docker-compose up -d
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker containers started!" -ForegroundColor Green
        Write-Host "📡 Server available at http://localhost:4001" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Failed to start Docker containers" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️  WSL mount had issues, trying Docker anyway..." -ForegroundColor Yellow
    docker-compose down; docker-compose up -d
}

