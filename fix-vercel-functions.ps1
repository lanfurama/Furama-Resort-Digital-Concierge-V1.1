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
    
    if (Test-Path $oldPath) {
        try {
            Rename-Item -Path $oldPath -NewName "_$folder" -Force -ErrorAction Stop
            Write-Host "  [OK] Renamed $folder to _$folder" -ForegroundColor Green
        } catch {
            Write-Host "  [ERROR] Failed to rename $folder : $_" -ForegroundColor Red
            Write-Host "  Please close your IDE and try again!" -ForegroundColor Yellow
            exit 1
        }
    } else {
        Write-Host "  [WARN] $folder not found (may already be renamed)" -ForegroundColor Yellow
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
    $content = $content -replace "from '\.\./config/", "from '../_config/"
    $content = $content -replace 'from "\.\./config/', 'from "../_config/'
    $content = $content -replace "from '\.\./controllers/", "from '../_controllers/"
    $content = $content -replace 'from "\.\./controllers/', 'from "../_controllers/'
    $content = $content -replace "from '\.\./models/", "from '../_models/"
    $content = $content -replace 'from "\.\./models/', 'from "../_models/'
    $content = $content -replace "from '\.\./routes/", "from '../_routes/"
    $content = $content -replace 'from "\.\./routes/', 'from "../_routes/'
    
    # Update imports: ./config/ -> ./_config/
    $replacement1 = "from './_config/"
    $replacement2 = 'from "./_config/'
    $replacement3 = "from './_controllers/"
    $replacement4 = 'from "./_controllers/'
    $replacement5 = "from './_models/"
    $replacement6 = 'from "./_models/'
    $replacement7 = "from './_routes/"
    $replacement8 = 'from "./_routes/'
    
    $content = $content -replace "from '\./config/", $replacement1
    $content = $content -replace 'from "\./config/', $replacement2
    $content = $content -replace "from '\./controllers/", $replacement3
    $content = $content -replace 'from "\./controllers/', $replacement4
    $content = $content -replace "from '\./models/", $replacement5
    $content = $content -replace 'from "\./models/', $replacement6
    $content = $content -replace "from '\./routes/", $replacement7
    $content = $content -replace 'from "\./routes/', $replacement8
    
    if ($content -ne $original) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "  [OK] Updated $($file.Name)" -ForegroundColor Green
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
