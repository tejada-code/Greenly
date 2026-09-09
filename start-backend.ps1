$port = 8080
$listener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue

if ($listener) {
    try {
        $health = Invoke-RestMethod -Uri "http://localhost:$port/api/health" -Method Get
        if ($health.service -eq 'greenly-backend' -and $health.status -eq 'UP') {
            Write-Host "Greenly backend ya esta ejecutandose en http://localhost:$port" -ForegroundColor Green
            exit 0
        }
    } catch {
        throw "El puerto $port esta ocupado por otro proceso. Libera el puerto o cambia server.port."
    }
}

$userApiKey = [Environment]::GetEnvironmentVariable('PLANTNET_API_KEY', 'User')
if (-not $env:PLANTNET_API_KEY -and $userApiKey) {
    $env:PLANTNET_API_KEY = $userApiKey
}

if (-not $env:PLANTNET_API_KEY) {
    Write-Warning "PLANTNET_API_KEY no esta definida. La identificacion botanica devolvera un error hasta configurarla."
}

Push-Location (Join-Path $PSScriptRoot 'backend')
try {
    & .\mvnw.cmd spring-boot:run
} finally {
    Pop-Location
}
