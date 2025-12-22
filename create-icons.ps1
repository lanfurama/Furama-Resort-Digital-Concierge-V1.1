# PowerShell script to open icon generator
Write-Host "🎨 Opening Furama Concierge Icon Generator..." -ForegroundColor Green
Write-Host ""
Write-Host "Instructions:" -ForegroundColor Yellow
Write-Host "1. The HTML file will open in your browser" -ForegroundColor White
Write-Host "2. Click the download buttons to save the icons" -ForegroundColor White
Write-Host "3. Save them in the 'public' folder as:" -ForegroundColor White
Write-Host "   - icon-192x192.png" -ForegroundColor Cyan
Write-Host "   - icon-512x512.png" -ForegroundColor Cyan
Write-Host ""

$htmlPath = Join-Path $PSScriptRoot "create-icons-simple.html"
if (Test-Path $htmlPath) {
    Start-Process $htmlPath
    Write-Host "✅ Icon generator opened!" -ForegroundColor Green
} else {
    Write-Host "❌ Error: create-icons-simple.html not found!" -ForegroundColor Red
}























