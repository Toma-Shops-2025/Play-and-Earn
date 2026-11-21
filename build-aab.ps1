# Play N' Earn - Build signed AAB for Google Play
# Usage: cd $env:USERPROFILE\Desktop\Play-and-Earn ; .\build-aab.ps1

$ProjectPath  = $PSScriptRoot
$KeystorePath = "C:\Keys\play-and-earn.jks"
$KeyAlias     = "alias"
$AabPath      = Join-Path $ProjectPath "android\app\build\outputs\bundle\release\app-release.aab"
$Password     = "Custom.247"

$ErrorActionPreference = "Stop"

function Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }

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

    $localProps = Join-Path $ProjectPath "android\local.properties"
    $sdkDir = ($sdk -replace '\\', '/')
    "sdk.dir=$sdkDir" | Set-Content -Path $localProps -Encoding ASCII
    Write-Host "    Using Android SDK: $sdk"
}

if (-not (Test-Path -LiteralPath $KeystorePath -PathType Leaf)) {
    Write-Host "`n  Keystore file not found: $KeystorePath" -ForegroundColor Red
    Write-Host "  Create it once, with alias '$KeyAlias' and the same password as your other apps:" -ForegroundColor Yellow
    Write-Host "`n  New-Item -ItemType Directory -Force -Path C:\Keys" -ForegroundColor Gray
    Write-Host "  keytool -genkeypair -alias $KeyAlias -keyalg RSA -keysize 2048 -validity 10000 -keystore `"$KeystorePath`"`n" -ForegroundColor Gray
    Write-Error "Missing release signing keystore. Expected: $KeystorePath"
}

Step "Switching to project: $ProjectPath"
Set-Location $ProjectPath

Step "Cleaning old web build"
if (Test-Path "out") { Remove-Item "out" -Recurse -Force }
if (Test-Path $AabPath) { Remove-Item $AabPath -Force }

Ensure-AndroidSdk

Step "npm install"
npm install
if ($LASTEXITCODE -ne 0) { throw "npm install failed with exit code $LASTEXITCODE" }

Step "Building web app"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "    Web build stopped; retrying once" -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Web build failed" }
}

Step "Regenerating Android launcher icon + splash"
npm run assets:generate
if ($LASTEXITCODE -ne 0) { throw "Asset generation failed" }

Step "Capacitor sync (fresh public assets)"
$publicAssets = Join-Path $ProjectPath "android\app\src\main\assets\public"
if (Test-Path $publicAssets) { Remove-Item $publicAssets -Recurse -Force }
npx cap sync android
if ($LASTEXITCODE -ne 0) { throw "cap sync failed" }

Step "Bumping versionCode"
$gradle = Join-Path $ProjectPath "android\app\build.gradle"
$content = Get-Content $gradle -Raw
if ($content -match 'versionCode\s+(\d+)') {
    $old = [int]$Matches[1]
    $new = $old + 1
    $content = $content -replace "versionCode\s+$old", "versionCode $new"
    Set-Content $gradle $content -NoNewline
    Write-Host "    versionCode: $old -> $new" -ForegroundColor Green
} else {
    throw "versionCode not found in android\app\build.gradle"
}

Step "Building signed release AAB"
$gradlew = Join-Path $ProjectPath "android\gradlew.bat"
if (-not (Test-Path $gradlew)) { throw "gradlew.bat not found." }

Set-Location (Join-Path $ProjectPath "android")
& .\gradlew.bat clean
if ($LASTEXITCODE -ne 0) { throw "Gradle clean failed with exit code $LASTEXITCODE" }

$gradleArgs = @(
    "bundleRelease",
    "-Pandroid.injected.signing.store.file=$KeystorePath",
    "-Pandroid.injected.signing.store.password=$Password",
    "-Pandroid.injected.signing.key.alias=$KeyAlias",
    "-Pandroid.injected.signing.key.password=$Password"
)
& .\gradlew.bat @gradleArgs
$gradleExit = $LASTEXITCODE

Set-Location $ProjectPath

if ($gradleExit -eq 0 -and (Test-Path $AabPath)) {
    Write-Host "`n  SUCCESS" -ForegroundColor Green
    Write-Host "  Signed AAB: $AabPath" -ForegroundColor Green
    Write-Host "  Upload to Play Console -> Testing -> Internal testing, then promote that release to Closed testing.`n"
    Start-Process explorer.exe "/select,`"$AabPath`""
} else {
    Write-Host "`n  Build FAILED. Scroll up for the Gradle error." -ForegroundColor Red
    exit 1
}
