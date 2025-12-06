@echo off
echo Renaming api folders to prevent Vercel from detecting them as separate functions...
echo.

cd /d "%~dp0api"

if exist "config" (
    ren "config" "_config"
    echo Renamed config to _config
) else (
    echo config folder not found or already renamed
)

if exist "controllers" (
    ren "controllers" "_controllers"
    echo Renamed controllers to _controllers
) else (
    echo controllers folder not found or already renamed
)

if exist "models" (
    ren "models" "_models"
    echo Renamed models to _models
) else (
    echo models folder not found or already renamed
)

if exist "routes" (
    ren "routes" "_routes"
    echo Renamed routes to _routes
) else (
    echo routes folder not found or already renamed
)

echo.
echo Done! Now updating imports...
cd /d "%~dp0"

powershell -Command "$files = Get-ChildItem -Path api -Recurse -Filter *.ts; foreach ($file in $files) { $content = Get-Content $file.FullName -Raw; $original = $content; $content = $content -replace \"from ['\\\"]\\.\\./(config)/\", \"from '../_`$1/'; $content = $content -replace \"from ['\\\"]\\.\\./(controllers)/\", \"from '../_`$1/'; $content = $content -replace \"from ['\\\"]\\.\\./(models)/\", \"from '../_`$1/'; $content = $content -replace \"from ['\\\"]\\.\\./(routes)/\", \"from '../_`$1/'; $content = $content -replace \"from ['\\\"]\\./(config)/\", \"from './_`$1/'; $content = $content -replace \"from ['\\\"]\\./(controllers)/\", \"from './_`$1/'; $content = $content -replace \"from ['\\\"]\\./(models)/\", \"from './_`$1/'; $content = $content -replace \"from ['\\\"]\\./(routes)/\", \"from './_`$1/'; if ($content -ne $original) { Set-Content -Path $file.FullName -Value $content -NoNewline; Write-Host \"Updated $($file.Name)\" } }"

echo.
echo All done! Please commit and push the changes.
