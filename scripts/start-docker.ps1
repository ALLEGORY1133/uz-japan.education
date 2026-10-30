# Docker Desktop'ni eski socket fayllarisiz ishga tushiradi.
# Sabab: bu Windows'da (10.0.26300) Docker to'g'ri yopilmasa (qayta yoqish, yiqilish) AF_UNIX socketlari
# qulflanib qoladi ("The file cannot be accessed by the system"), Docker ularni almashtira olmay yiqiladi.
# Yechim: socket papkalarini chetga surish — Docker yangisini yaratadi. Ishlatish: .\scripts\start-docker.ps1

Get-Process "Docker Desktop", "com.docker.backend", "com.docker.build" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep 2

$la = $env:LOCALAPPDATA
$stamp = Get-Date -Format "MMddHHmmss"
foreach ($d in "$la\Docker\run", "$la\docker-secrets-engine") {
  if (Test-Path $d) { Rename-Item $d "$(Split-Path $d -Leaf).old-$stamp" -ErrorAction Stop }
}

# Eski nusxalarni o'chirishga urinish (qulflangani qoladi — zarari yo'q)
Get-ChildItem "$la\Docker" -Directory -Filter "run.old-*" -ErrorAction SilentlyContinue |
  ForEach-Object { Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue }
Get-ChildItem $la -Directory -Filter "docker-secrets-engine.old-*" -ErrorAction SilentlyContinue |
  ForEach-Object { Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue }

Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
Write-Host "Docker Desktop ishga tushirildi; 1-2 daqiqada tayyor bo'ladi (docker version bilan tekshiring)."
