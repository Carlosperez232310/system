#!/usr/bin/env bash
# Build and publish public/ to the gh-pages branch (GitHub Pages serves it at https://carlosperez232310.github.io/system/).
set -euo pipefail
cd "$(dirname "$0")/.."
./tools/build.sh
STAGE=$(mktemp -d /tmp/system-pages.XXXX)
cp -r public/. "$STAGE/" && touch "$STAGE/.nojekyll"
cd "$STAGE"
git init -q -b gh-pages
git -c user.name="Carlos Perez" -c user.email="90338236+Carlosperez232310@users.noreply.github.com" add -A
git -c user.name="Carlos Perez" -c user.email="90338236+Carlosperez232310@users.noreply.github.com" commit -qm "Deploy SYSTEM $(date +%Y-%m-%dT%H:%M)"
git push -f "https://github.com/Carlosperez232310/system.git" gh-pages
