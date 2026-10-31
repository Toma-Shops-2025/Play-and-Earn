# Build a sideloadable APK for preview on a physical Android device.
# Requires: Node.js, JDK 17+, Android SDK (install via Android Studio).
#
# Usage:
#   .\build-apk.ps1              # debug APK (recommended for your phone)
#   .\build-apk.ps1 -Release     # release APK (unsigned unless you configured signing)

param(
    [switch]$Release,
    [switch]$SkipNpmInstall
)

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
Set-Location $Root

function Ensure-AndroidSdk {
    $sdk = $env:ANDROID_HOME
    if (-not $sdk) { $sdk = $env:ANDROID_SDK_ROOT }
    if (-not $sdk -and $env:LOCALAPPDATA) {
        $candidate = Join-Path $env:LOCALAPPDATA "Android\Sdk"
        if (Test-Path $candidate) { $sdk = $candidate }
    }
    if (-not $sdk -or -not (Test-Path $sdk)) {
        throw @"
Android SDK not found.
Install Android Studio, open SDK Manager once, then either:
  - set ANDROID_HOME to your SDK folder (e.g. $env:LOCALAPPDATA\Android\Sdk), or
  - re-run this script (it auto-detects the default SDK path).
"@
    }

    $localProps = Join-Path $Root "android\local.properties"
    $sdkDir = ($sdk -replace '\\', '/')
    "sdk.dir=$sdkDir" | Set-Content -Path $localProps -Encoding ASCII -NoNewline
    Write-Host "Using Android SDK: $sdk"
}

Write-Host "==> Syncing web app into Android..."
if (-not $SkipNpmInstall) {
    npm install
    if ($LASTEXITCODE -ne 0) { throw "npm install failed with exit code $LASTEXITCODE" }
}
npm run build:mobile
if ($LASTEXITCODE -ne 0) { throw "npm run build:mobile failed with exit code $LASTEXITCODE" }

Ensure-AndroidSdk

$gradlew = Join-Path $Root "android\gradlew.bat"
if (-not (Test-Path $gradlew)) {
    throw "Missing $gradlew - run this script from the repo root."
}

Set-Location (Join-Path $Root "android")

if ($Release) {
    Write-Host "==> Building release APK (may be unsigned)..."
    & $gradlew assembleRelease
    $apk = Join-Path $Root "android\app\build\outputs\apk\release\app-release-unsigned.apk"
    if (-not (Test-Path $apk)) {
        $apk = Join-Path $Root "android\app\build\outputs\apk\release\app-release.apk"
    }
} else {
    Write-Host "==> Building debug APK..."
    & $gradlew assembleDebug
    $apk = Join-Path $Root "android\app\build\outputs\apk\debug\app-debug.apk"
}

if (-not (Test-Path $apk)) {
    throw "Build finished but APK not found at expected path."
}

$apkFull = (Resolve-Path $apk).Path
Write-Host ""
Write-Host "Done. APK:" -ForegroundColor Green
Write-Host "  $apkFull"
Write-Host ""
Write-Host "Install on your phone:"
Write-Host '  1. Copy the APK to the device via USB, Drive, email, etc.'
Write-Host "  2. Open it and allow Install unknown apps for your file app if prompted."
Write-Host "  Or with USB debugging: adb install -r `"$apkFull`""
