#!/usr/bin/env bash
# Same as build-apk.ps1 for macOS / Linux / WSL.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

RELEASE=false
BUNDLE=false
SKIP_NPM=false
for arg in "$@"; do
  case "$arg" in
    --release|-Release) RELEASE=true ;;
    --bundle|-Bundle) BUNDLE=true ;;
    --skip-npm-install|-SkipNpmInstall) SKIP_NPM=true ;;
  esac
done

echo "==> Syncing web app into Android..."
if [[ "$SKIP_NPM" != true ]]; then
  npm install
fi
npm run build:mobile

SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"
if [[ -z "$SDK" && -d "$HOME/Android/Sdk" ]]; then
  SDK="$HOME/Android/Sdk"
fi
if [[ -z "$SDK" || ! -d "$SDK" ]]; then
  echo "Android SDK not found. Set ANDROID_HOME or install Android Studio." >&2
  exit 1
fi
printf 'sdk.dir=%s\n' "$SDK" > "$ROOT/android/local.properties"
echo "Using Android SDK: $SDK"

cd "$ROOT/android"
if [[ "$BUNDLE" == true ]]; then
  PROPS="$ROOT/android/keystore.properties"
  if [[ ! -f "$PROPS" ]]; then
    echo "Missing android/keystore.properties — required to sign a Play App Bundle." >&2
    echo "1. Create the upload keystore once and back up the file and passwords:" >&2
    echo "   keytool -genkeypair -alias play-earn-upload -keyalg RSA -keysize 2048 -validity 10000 \\" >&2
    echo "     -keystore \"$ROOT/play-earn-upload.keystore\"" >&2
    echo "2. Copy android/keystore.properties.example to android/keystore.properties and fill in passwords." >&2
    exit 1
  fi
  echo "==> Building signed Android App Bundle..."
  ./gradlew bundleRelease --no-daemon
  OUT="$ROOT/android/app/build/outputs/bundle/release/app-release.aab"
elif [[ "$RELEASE" == true ]]; then
  echo "==> Building release APK (unsigned unless keystore.properties exists)..."
  ./gradlew assembleRelease --no-daemon
  OUT="$ROOT/android/app/build/outputs/apk/release/app-release.apk"
  [[ -f "$OUT" ]] || OUT="$ROOT/android/app/build/outputs/apk/release/app-release-unsigned.apk"
else
  echo "==> Building debug APK..."
  ./gradlew assembleDebug --no-daemon
  OUT="$ROOT/android/app/build/outputs/apk/debug/app-debug.apk"
fi

if [[ ! -f "$OUT" ]]; then
  echo "Build finished but output not found at $OUT" >&2
  exit 1
fi

echo ""
echo "Done:"
echo "  $OUT"
if [[ "$BUNDLE" == true ]]; then
  echo ""
  echo "Upload this .aab in Play Console → Testing → Internal testing, then promote it to Closed testing."
else
  echo ""
  echo "Install: adb install -r \"$OUT\""
fi
