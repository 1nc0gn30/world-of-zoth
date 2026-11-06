#!/bin/bash
# Build World of Zoth: assets -> bundle (game.js) -> single-file HTML -> zip. Everything local, no CDN at runtime.
set -e
cd "$(dirname "$0")/.."
[ "$1" == "--assets" ] && python3 tools/build_assets.py
npx esbuild src/main.js --bundle --format=iife --target=es2019,chrome74 --inject:tools/polyfill.js --minify --legal-comments=none --outfile=game.js --log-level=warning
node -e "
const fs=require('fs'); const html=fs.readFileSync('index.html','utf8'); const js=fs.readFileSync('game.js','utf8').replace(/<\/script/gi,'<\\\\/script');
fs.writeFileSync('world-of-zoth.html', html.replace('<script src=\"game.js\"></script>', ()=>'<script>'+js+'</script>'));"
mkdir -p dist && rm -f dist/world-of-zoth.zip
python3 - <<'PY'
import zipfile, os
with zipfile.ZipFile('dist/world-of-zoth.zip','w',zipfile.ZIP_DEFLATED) as z:
    for f in ['index.html','game.js','world-of-zoth.html','DESIGN.md','STORY.md','README.md','package.json']:
        if os.path.exists(f): z.write(f,'world-of-zoth/'+f)
    for d in ['src','tools','assets','tests']:
        for root,_,files in os.walk(d):
            for f in files:
                if f.endswith('.json') and 'snapshot' in f: continue
                z.write(os.path.join(root,f),'world-of-zoth/'+os.path.join(root,f))
PY
ls -la game.js world-of-zoth.html dist/world-of-zoth.zip
