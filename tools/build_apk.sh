#!/bin/bash
# Builds dist/world-of-zoth.apk without Gradle: aapt2 -> javac -> d8 -> zipalign -> apksigner (self-signed debug key).
set -e
cd "$(dirname "$0")/.."
export JAVA_HOME=${JAVA_HOME:-/usr/lib/jvm/default-java} PATH=$JAVA_HOME/bin:$PATH
SDK=${SDK:-$HOME/Android/Sdk} BT=$SDK/build-tools/35.0.0 PLAT=$SDK/platforms/android-34/android.jar
B=android/build; rm -rf $B; mkdir -p $B/gen $B/obj $B/apk/assets
python3 tools/make_icons.py android/res
$BT/aapt2 compile --dir android/res -o $B/res.zip
cp world-of-zoth.html $B/apk/assets/index.html
$BT/aapt2 link -o $B/base.apk -I $PLAT --manifest android/AndroidManifest.xml -R $B/res.zip --java $B/gen -A $B/apk/assets --auto-add-overlay
javac -source 8 -target 8 -nowarn -classpath $PLAT -d $B/obj $(find android/src $B/gen -name '*.java') 2>&1 | grep -v "bootstrap\|warning" || true
$BT/d8 --release --min-api 24 --lib $PLAT --output $B $(find $B/obj -name '*.class')
cd $B && cp base.apk unsigned.apk && zip -q -j unsigned.apk classes.dex 2>/dev/null || python3 -c "import zipfile;z=zipfile.ZipFile('unsigned.apk','a');z.write('classes.dex','classes.dex');z.close()"; cd - >/dev/null
$BT/zipalign -f -p 4 $B/unsigned.apk $B/aligned.apk
KS=android/zoth-debug.keystore
[ -f $KS ] || keytool -genkeypair -keystore $KS -storepass zothdebug -keypass zothdebug -alias zoth -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=World of Zoth debug,O=local" >/dev/null 2>&1
$BT/apksigner sign --ks $KS --ks-pass pass:zothdebug --key-pass pass:zothdebug --ks-key-alias zoth --out dist/world-of-zoth.apk $B/aligned.apk
$BT/apksigner verify --print-certs dist/world-of-zoth.apk | head -3
ls -la dist/world-of-zoth.apk
