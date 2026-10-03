#!/usr/bin/env bash
# Build src/ -> public/ with a cache-busting version stamp.
set -euo pipefail
cd "$(dirname "$0")/.."
VER="${VER:-$(date +%Y%m%d%H%M)}"
rm -rf public && cp -r src public
for f in public/index.html public/sw.js public/js/app.js; do sed -i "s/__VER__/$VER/g" "$f"; done
echo "built public/ version $VER"
