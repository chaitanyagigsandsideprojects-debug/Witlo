#!/bin/bash
# Installs the APK on the emulator, opens it and reports a crash (as a GitHub annotation) if it stops.
APK=$(ls Witlo-test-*.apk | head -1)
adb install -r "$APK" || { echo "::warning title=Install failed::adb install failed"; exit 0; }
adb logcat -c
adb shell monkey -p com.loganapps.witlo -c android.intent.category.LAUNCHER 1
sleep 30
adb logcat -d > logcat.txt
enc() { local m="$1"; m="${m//'%'/'%25'}"; m="${m//$'\r'/}"; m="${m//$'\n'/'%0A'}"; printf '%s' "$m"; }
CRASH=$(grep -A 40 "FATAL EXCEPTION" logcat.txt | head -60)
[ -n "$CRASH" ] && echo "::error title=Crash::$(enc "$CRASH")"
JS=$(grep -E "ReactNativeJS.*(Error|TypeError|ReferenceError|Invariant)" logcat.txt | head -20)
[ -n "$JS" ] && echo "::error title=JS error::$(enc "$JS")"
if [ -z "$(adb shell pidof com.loganapps.witlo | tr -d '\r')" ]; then echo "::error title=Smoke test::App is not running 30 s after launch"; exit 1; fi
echo "::notice title=Smoke test::App opened and is still running after 30 s"
