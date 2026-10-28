#!/usr/bin/env bash
# Same as build-apk.ps1 for macOS / Linux / WSL.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

RELEASE=false
SKIP_NPM=false
for arg in "$@"; do
  case "$arg" in
    --release) RELEASE=true ;;
    --skip-npm-install) SKIP_NPM=true ;;
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
if [[ "$RELEASE" == true ]]; then
  ./gradlew assembleRelease
  APK="$ROOT/android/app/build/outputs/apk/release/app-release-unsigned.apk"
  [[ -f "$APK" ]] || APK="$ROOT/android/app/build/outputs/apk/release/app-release.apk"
else
  ./gradlew assembleDebug
  APK="$ROOT/android/app/build/outputs/apk/debug/app-debug.apk"
fi

echo ""
echo "Done. APK:"
echo "  $APK"
echo ""
echo "Install: adb install -r \"$APK\""
