# Furama Driver App - Build Release APK Script
# Run this after configuring keystore

Write-Host "=== Furama Driver App - Build Release APK ===" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the correct directory
if (!(Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found!" -ForegroundColor Red
    Write-Host "Please run this script from the driver-app directory" -ForegroundColor Yellow
    exit 1
}

# Check if android folder exists
if (!(Test-Path "android")) {
    Write-Host "❌ Error: android folder not found!" -ForegroundColor Red
    Write-Host "Please run 'npm run cap:add:android' first" -ForegroundColor Yellow
    exit 1
}

# Check if keystore exists
$keystorePath = "furama-driver-release.keystore"
if (!(Test-Path $keystorePath)) {
    Write-Host "⚠️  Warning: Keystore not found at $keystorePath" -ForegroundColor Yellow
    Write-Host "Run './generate-keystore.ps1' to create one" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Continue anyway? (yes/no)"
    if ($continue -ne "yes") {
        exit 1
    }
}

Write-Host "Step 1/4: Building web app..." -ForegroundColor Green
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 2/4: Syncing with Android..." -ForegroundColor Green
npm run cap:sync:android
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Sync failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 3/4: Building Release APK..." -ForegroundColor Green
Write-Host "This may take a few minutes..." -ForegroundColor Yellow

Set-Location android
./gradlew assembleRelease
$buildResult = $LASTEXITCODE
Set-Location ..

if ($buildResult -ne 0) {
    Write-Host ""
    Write-Host "❌ APK build failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "1. Keystore not configured properly" -ForegroundColor Yellow
    Write-Host "2. Missing keystore.properties file" -ForegroundColor Yellow
    Write-Host "3. Wrong passwords in keystore.properties" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "See BUILD_RELEASE_APK.md for detailed instructions" -ForegroundColor Cyan
    exit 1
}

Write-Host ""
Write-Host "Step 4/4: Verifying APK..." -ForegroundColor Green

$apkPath = "android\app\build\outputs\apk\release\app-release.apk"
if (Test-Path $apkPath) {
    $apkSize = (Get-Item $apkPath).Length / 1MB
    Write-Host ""
    Write-Host "✅ APK built successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "=== Build Information ===" -ForegroundColor Cyan
    Write-Host "APK Location: $apkPath" -ForegroundColor White
    Write-Host "APK Size: $([math]::Round($apkSize, 2)) MB" -ForegroundColor White
    Write-Host ""
    
    # Try to verify signature
    Write-Host "Verifying signature..." -ForegroundColor Yellow
    try {
        $verifyOutput = jarsigner -verify -verbose -certs $apkPath 2>&1
        if ($verifyOutput -match "jar verified") {
            Write-Host "✅ APK signature verified!" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Could not verify signature" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️  jarsigner not found, skipping verification" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "=== Next Steps ===" -ForegroundColor Cyan
    Write-Host "1. Test APK on device: adb install $apkPath" -ForegroundColor White
    Write-Host "2. Or copy APK to phone and install manually" -ForegroundColor White
    Write-Host "3. Upload to Google Play Store when ready" -ForegroundColor White
    Write-Host ""
    
    # Ask if user wants to open folder
    $openFolder = Read-Host "Open APK folder? (yes/no)"
    if ($openFolder -eq "yes") {
        explorer.exe (Split-Path -Parent $apkPath)
    }
    
} else {
    Write-Host "❌ APK file not found at expected location!" -ForegroundColor Red
    Write-Host "Expected: $apkPath" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
