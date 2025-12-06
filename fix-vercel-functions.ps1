# PowerShell script to rename api folders and update imports
# Run this script AFTER closing your IDE

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fixing Vercel Serverless Functions Limit" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$apiPath = Join-Path $PSScriptRoot "api"

if (-not (Test-Path $apiPath)) {
    Write-Host "ERROR: api folder not found!" -ForegroundColor Red
    exit 1
}

Write-Host "Step 1: Renaming folders..." -ForegroundColor Yellow

$folders = @("config", "controllers", "models", "routes")

foreach ($folder in $folders) {
    $oldPath = Join-Path $apiPath $folder
    $newPath = Join-Path $apiPath "_$folder"
    
    if (Test-Path $oldPath) {
        try {
            # Force rename by closing any handles first
            Rename-Item -Path $oldPath -NewName "_$folder" -Force -ErrorAction Stop
            Write-Host "  ✓ Renamed $folder to _$folder" -ForegroundColor Green
        } catch {
            Write-Host "  ✗ Failed to rename $folder : $_" -ForegroundColor Red
            Write-Host "  Please close your IDE and try again!" -ForegroundColor Yellow
            exit 1
        }
    } else {
        Write-Host "  ⚠ $folder not found (may already be renamed)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Step 2: Updating imports..." -ForegroundColor Yellow

$files = Get-ChildItem -Path $apiPath -Recurse -Filter "*.ts" -File
$updatedCount = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $original = $content
    
    # Update imports: ../config/ -> ../_config/
    $content = $content -replace "from ['`"]\.\./(config)/", "from '../_$1/"
    $content = $content -replace "from ['`"]\.\./(controllers)/", "from '../_$1/"
    $content = $content -replace "from ['`"]\.\./(models)/", "from '../_$1/"
    $content = $content -replace "from ['`"]\.\./(routes)/", "from '../_$1/"
    
    # Update imports: ./config/ -> ./_config/
    $content = $content -replace "from ['`"]\./(config)/", "from './_$1/"
    $content = $content -replace "from ['`"]\./(controllers)/", "from './_$1/"
    $content = $content -replace "from ['`"]\./(models)/", "from './_$1/"
    $content = $content -replace "from ['`"]\./(routes)/", "from './_$1/"
    
    if ($content -ne $original) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "  ✓ Updated $($file.Name)" -ForegroundColor Green
        $updatedCount++
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Done! Updated $updatedCount files" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Commit the changes: git add ." -ForegroundColor White
Write-Host "2. Commit: git commit -m 'Fix Vercel function limit'" -ForegroundColor White
Write-Host "3. Push: git push" -ForegroundColor White
Write-Host ""
