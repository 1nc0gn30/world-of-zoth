#!/bin/bash
# Sync built game bundle, offline neural voice-overs, screenshots & Android APK into site/ for Netlify publish.
set -e
cd "$(dirname "$0")/.."
mkdir -p site/play/assets/voice site/assets site/downloads
cp game.js site/play/game.js
cp assets/voice/*.mp3 site/play/assets/voice/
cp assets/woz_v04_title.jpg site/assets/woz_v04_title.jpg 2>/dev/null || true
cp assets/woz_v04_codex.jpg site/assets/woz_v04_codex.jpg 2>/dev/null || true
cp assets/woz_v04_party_copy.jpg site/assets/woz_v04_party_copy.jpg 2>/dev/null || true
if [ -f /home/zoth/NullAITech/nullai2026/public/DarkMode-NullAI-Icon.png ]; then
  cp /home/zoth/NullAITech/nullai2026/public/DarkMode-NullAI-Icon.png site/assets/ghostbyte-icon.png
fi
if [ -f dist/world-of-zoth.apk ]; then
  cp dist/world-of-zoth.apk site/downloads/world-of-zoth.apk
fi
if [ -f world-of-zoth.html ]; then
  cp world-of-zoth.html site/downloads/world-of-zoth.html
fi
echo "Synced site/ publish directory:"
du -sh site site/play site/downloads
