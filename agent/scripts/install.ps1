$BaseUrl = "https://tu-servidor-o-bucket.com/downloads"
$BinaryName = "nocturne-agent-windows.exe"
$TargetName = "nocturne-agent.exe"

Write-Host "⬇️  Descargando Nocturne Agent..." -ForegroundColor Cyan

# En un caso real, descomentar:
# Invoke-WebRequest -Uri "$BaseUrl/$BinaryName" -OutFile $TargetName

# Simulación local
if (Test-Path "..\dist\$BinaryName") {
    Copy-Item "..\dist\$BinaryName" -Destination $TargetName
}

if (-not (Test-Path $TargetName)) {
    Write-Host "❌ Error: No se encontró el binario." -ForegroundColor Red
    exit 1
}

Write-Host "🚀 Ejecutando agente..." -ForegroundColor Green
Write-Host "⚠️  Asegúrate de correr esto como Administrador para instalar el servicio." -ForegroundColor Yellow
Start-Process -FilePath ".\$TargetName" -Wait
