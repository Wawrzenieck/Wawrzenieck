#!/usr/bin/env bash
# Builds NatalHome.apk without Gradle: aapt2 -> javac -> d8 -> zipalign -> apksigner.
set -euo pipefail
cd "$(dirname "$0")"
SDK=${ANDROID_HOME:?}; BT=$SDK/build-tools/34.0.0; AJ=$SDK/platforms/android-34/android.jar
KS=${KEYSTORE:?keystore}; rm -rf out && mkdir -p out/classes out/res
"$BT/aapt2" compile --dir app/res -o out/res.zip
"$BT/aapt2" link -o out/base.apk -I "$AJ" --manifest app/AndroidManifest.xml -A app/assets out/res.zip \
  --min-sdk-version 21 --target-sdk-version 28 --java out/gen -0 ttf -0 woff2
javac -nowarn -source 8 -target 8 -bootclasspath "$AJ:$BT/core-lambda-stubs.jar" -classpath "$AJ" -encoding UTF-8 -d out/classes $(find app/src out/gen -name '*.java') 2>&1 | grep -v "warning" || true
"$BT/d8" --release --min-api 21 --lib "$AJ" --output out $(find out/classes -name '*.class')
(cd out && zip -qj base.apk classes.dex)
"$BT/zipalign" -f -p 4 out/base.apk out/aligned.apk
"$BT/apksigner" sign --ks "$KS" --ks-pass pass:freemytv --key-pass pass:freemytv --out NatalHome.apk out/aligned.apk
echo "Built NatalHome.apk ($(du -h NatalHome.apk | cut -f1))"
