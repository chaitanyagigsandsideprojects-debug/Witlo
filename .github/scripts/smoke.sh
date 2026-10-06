#!/bin/bash
# Installs the APK on the emulator, launches it and reports crashes as GitHub annotations.
APK=$(ls Witlo-test-*.apk | head -1)
adb install -r "$APK" || { echo "::error title=Install failed::adb install failed"; exit 1; }
adb logcat -c
adb shell monkey -p com.loganapps.witlo -c android.intent.category.LAUNCHER 1
sleep 40
adb logcat -d > logcat.txt
adb exec-out screencap -p > screen.png || true
PID=$(adb shell pidof com.loganapps.witlo | tr -d '\r')
enc() { local m="$1"; m="${m//'%'/'%25'}"; m="${m//$'\r'/}"; m="${m//$'\n'/'%0A'}"; printf '%s' "$m"; }
CRASH=$( (grep -A 45 "FATAL EXCEPTION" logcat.txt; grep -E "ReactNativeJS|AndroidRuntime|libc.*Fatal signal|DEBUG   :|SoLoader|Unable to load script|Invariant|TypeError|ReferenceError" logcat.txt | grep -v "^.*D ReactNativeJS" | head -60) | head -120 )
if [ -n "$CRASH" ]; then echo "::error title=App log::$(enc "$CRASH")"; fi
if [ -z "$PID" ]; then
  echo "::error title=Smoke test::App is NOT running after launch (crashed)"
  tail -150 logcat.txt | grep -iE "witlo|react|expo|fatal|exception|error" | head -60 > tailerr.txt
  echo "::error title=Log tail::$(enc "$(cat tailerr.txt)")"
  exit 1
fi
echo "::notice title=Smoke test::App is running (pid $PID) after 40s"
