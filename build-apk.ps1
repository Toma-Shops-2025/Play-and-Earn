# Build a sideloadable APK for preview, or a signed Play App Bundle.
# Requires: Node.js, JDK 17+, Android SDK (install via Android Studio).
#
# Usage:
#   .\build-apk.ps1              # debug APK (recommended for your phone)
#   .\build-apk.ps1 -Release     # release APK
#   .\build-apk.ps1 -Bundle      # signed .aab for Play Console (needs keystore.properties)

param(
    [switch]$Release,
    [switch]$Bundle,
    [switch]$SkipNpmInstall
)

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
Set-Location $Root

# GitHub Pages basePath must not be baked into APK assets (breaks auth + loads as github.io).
Remove-Item Env:GITHUB_PAGES_REPOSITORY -ErrorAction SilentlyContinue

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

if ($Bundle) {
    $props = Join-Path $Root "android\keystore.properties"
    if (-not (Test-Path $props)) {
        throw @"
Missing android\keystore.properties — required to sign a Play App Bundle.
1. Create the keystore (one time; back up the file and passwords):
   keytool -genkeypair -alias play-earn-upload -keyalg RSA -keysize 2048 -validity 10000 -keystore `"$Root\play-earn-upload.keystore`"
2. Copy android\keystore.properties.example to android\keystore.properties and fill in passwords.
"@
    }
    Write-Host "==> Building signed Android App Bundle..."
    & $gradlew bundleRelease
    if ($LASTEXITCODE -ne 0) { throw "Gradle bundleRelease failed with exit code $LASTEXITCODE" }
    $apk = Join-Path $Root "android\app\build\outputs\bundle\release\app-release.aab"
} elseif ($Release) {
    Write-Host "==> Building release APK (unsigned unless keystore.properties exists)..."
    & $gradlew assembleRelease
    if ($LASTEXITCODE -ne 0) { throw "Gradle assembleRelease failed with exit code $LASTEXITCODE" }
    $apk = Join-Path $Root "android\app\build\outputs\apk\release\app-release.apk"
    if (-not (Test-Path $apk)) {
        $apk = Join-Path $Root "android\app\build\outputs\apk\release\app-release-unsigned.apk"
    }
} else {
    Write-Host "==> Building debug APK..."
    & $gradlew assembleDebug
    if ($LASTEXITCODE -ne 0) { throw "Gradle assembleDebug failed with exit code $LASTEXITCODE" }
    $apk = Join-Path $Root "android\app\build\outputs\apk\debug\app-debug.apk"
}

if (-not (Test-Path $apk)) {
    throw "Build finished but output not found at expected path."
}

$apkFull = (Resolve-Path $apk).Path
Write-Host ""
Write-Host "Done:" -ForegroundColor Green
Write-Host "  $apkFull"
if ($Bundle) {
    Write-Host ""
    Write-Host "Upload this .aab in Play Console → Testing → Closed testing (or Internal testing first)."
} else {
    Write-Host ""
    Write-Host "Install on your phone:"
    Write-Host '  1. Copy the APK to the device via USB, Drive, email, etc.'
    Write-Host "  2. Open it and allow Install unknown apps for your file app if prompted."
    Write-Host "  Or with USB debugging: adb install -r `"$apkFull`""
}
