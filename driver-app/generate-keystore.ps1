# Script to generate Android Keystore for signing APK
# Run this script in PowerShell

Write-Host "=== Furama Driver App - Generate Keystore ===" -ForegroundColor Cyan
Write-Host ""

# Keystore configuration
$keystoreName = "furama-driver-release.keystore"
$keystorePath = Join-Path $PSScriptRoot $keystoreName
$alias = "furama-driver"
$validity = 10000  # days (about 27 years)

Write-Host "Keystore will be created at: $keystorePath" -ForegroundColor Yellow
Write-Host ""

# Check if keystore already exists
if (Test-Path $keystorePath) {
    Write-Host "⚠️  Keystore already exists!" -ForegroundColor Red
    $overwrite = Read-Host "Do you want to overwrite it? (yes/no)"
    if ($overwrite -ne "yes") {
        Write-Host "Aborted." -ForegroundColor Yellow
        exit
    }
    Remove-Item $keystorePath -Force
}

Write-Host "Please enter keystore information:" -ForegroundColor Green
Write-Host ""

# Get keystore password (secure input)
$keystorePassword = Read-Host "Keystore Password (min 6 characters)" -AsSecureString
$keystorePasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($keystorePassword)
)

if ($keystorePasswordPlain.Length -lt 6) {
    Write-Host "❌ Password must be at least 6 characters!" -ForegroundColor Red
    exit
}

# Get key password
$keyPassword = Read-Host "Key Password (min 6 characters, can be same as keystore password)" -AsSecureString
$keyPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($keyPassword)
)

if ($keyPasswordPlain.Length -lt 6) {
    Write-Host "❌ Password must be at least 6 characters!" -ForegroundColor Red
    exit
}

# Get certificate information
Write-Host ""
Write-Host "Certificate Information (press Enter to use defaults):" -ForegroundColor Green
$firstName = Read-Host "First and Last Name [Furama Resort]"
if ([string]::IsNullOrWhiteSpace($firstName)) { $firstName = "Furama Resort" }

$orgUnit = Read-Host "Organizational Unit [IT Department]"
if ([string]::IsNullOrWhiteSpace($orgUnit)) { $orgUnit = "IT Department" }

$org = Read-Host "Organization [Furama Resort Da Nang]"
if ([string]::IsNullOrWhiteSpace($org)) { $org = "Furama Resort Da Nang" }

$city = Read-Host "City or Locality [Da Nang]"
if ([string]::IsNullOrWhiteSpace($city)) { $city = "Da Nang" }

$state = Read-Host "State or Province [Da Nang]"
if ([string]::IsNullOrWhiteSpace($state)) { $state = "Da Nang" }

$country = Read-Host "Two-letter Country Code [VN]"
if ([string]::IsNullOrWhiteSpace($country)) { $country = "VN" }

# Build DN string
$dn = "CN=$firstName, OU=$orgUnit, O=$org, L=$city, ST=$state, C=$country"

Write-Host ""
Write-Host "Generating keystore..." -ForegroundColor Yellow

# Generate keystore using keytool
$keytoolCmd = "keytool"
$arguments = @(
    "-genkeypair",
    "-v",
    "-keystore", "`"$keystorePath`"",
    "-alias", $alias,
    "-keyalg", "RSA",
    "-keysize", "2048",
    "-validity", $validity,
    "-storepass", $keystorePasswordPlain,
    "-keypass", $keyPasswordPlain,
    "-dname", "`"$dn`""
)

try {
    $process = Start-Process -FilePath $keytoolCmd -ArgumentList $arguments -NoNewWindow -Wait -PassThru
    
    if ($process.ExitCode -eq 0) {
        Write-Host ""
        Write-Host "✅ Keystore created successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "=== IMPORTANT: Save this information ===" -ForegroundColor Cyan
        Write-Host "Keystore Path: $keystorePath" -ForegroundColor White
        Write-Host "Keystore Password: $keystorePasswordPlain" -ForegroundColor White
        Write-Host "Key Alias: $alias" -ForegroundColor White
        Write-Host "Key Password: $keyPasswordPlain" -ForegroundColor White
        Write-Host ""
        Write-Host "⚠️  Keep this information secure! You'll need it to:" -ForegroundColor Yellow
        Write-Host "   - Sign release APKs" -ForegroundColor Yellow
        Write-Host "   - Update your app on Google Play Store" -ForegroundColor Yellow
        Write-Host "   - If you lose the keystore, you cannot update your app!" -ForegroundColor Red
        Write-Host ""
        
        # Save credentials to a file (optional)
        $saveCredentials = Read-Host "Save credentials to keystore-info.txt? (yes/no)"
        if ($saveCredentials -eq "yes") {
            $credFile = Join-Path $PSScriptRoot "keystore-info.txt"
            @"
=== Furama Driver App Keystore Information ===
Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

Keystore Path: $keystorePath
Keystore Password: $keystorePasswordPlain
Key Alias: $alias
Key Password: $keyPasswordPlain

Certificate DN: $dn

⚠️  KEEP THIS FILE SECURE AND PRIVATE!
⚠️  Add keystore-info.txt to .gitignore
"@ | Out-File -FilePath $credFile -Encoding UTF8
            
            Write-Host "Credentials saved to: $credFile" -ForegroundColor Green
            Write-Host "⚠️  Remember to add this file to .gitignore!" -ForegroundColor Yellow
        }
        
    } else {
        Write-Host "❌ Failed to create keystore!" -ForegroundColor Red
        Write-Host "Make sure Java JDK is installed and keytool is in PATH" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure Java JDK is installed:" -ForegroundColor Yellow
    Write-Host "Download from: https://www.oracle.com/java/technologies/downloads/" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
