param(
    [string]$ProjectPath = "C:\Users\Ubaby\Desktop\folder-server"
)

Write-Host "Waiting for Docker Desktop to be ready..."
$maxAttempts = 30
$attempt = 0
while ($attempt -lt $maxAttempts) {
    try {
        docker info | Out-Null
        break
    } catch {
        Start-Sleep -Seconds 5
        $attempt++
    }
}

if ($attempt -ge $maxAttempts) {
    Write-Error "Docker Desktop did not become ready in time."
    exit 1
}

Push-Location $ProjectPath

# Prefer docker-compose if present; otherwise use docker compose
$dockerComposeExe = Get-Command docker-compose -ErrorAction SilentlyContinue
if ($dockerComposeExe) {
    Write-Host "Starting stack with docker-compose..."
    & $dockerComposeExe.Path 'up' '-d'
} else {
    Write-Host "Starting stack with docker compose..."
    & 'docker' 'compose' 'up' '-d'
}

Pop-Location

Write-Host "Folder server stack started."