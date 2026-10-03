# SYSTEM — Solo Leveling-style life RPG (PWA)

Live: https://carlosperez232310.github.io/system/

Static, client-side PWA for Carlos Perez. All state is in `localStorage` (`system.save.v1`).

- `src/` — source (index.html, css/app.css, js/app.js, sw.js, manifest.json, fonts/, icons/)
- `public/` — build output (`tools/build.sh` copies src and stamps a cache-busting version into `__VER__`)
- `tools/make_assets.py` — regenerates subsetted woff2 fonts (Orbitron/Rajdhani) and glowing app icons
- `tools/publish-pages.sh` — builds and force-pushes public/ to the `gh-pages` branch → https://carlosperez232310.github.io/system/
- `tools/deploy.sh "<proxy-path>"` — (unused: Netlify credits exhausted) builds and deploys to Netlify site `system-carlos`
  (get a fresh proxy-path from the Netlify connector: `netlify-deploy-services-updater` → `deploy-site`, siteId `817b0fcf-a80d-4b29-9ee0-77f2a9e57e30`)
- `tests/test_app.py` — Playwright suite at 390x844 and 430x932 (simulated iPhone safe areas): layout checks
  (no h-overflow, tap targets >= 38px, screens fill the viewport) + quest/loot/level-up/shop/side-quest/penalty/potion/export-import flows.
  `tests/layout.py <tabs>` — quick layout screenshots. `tests/offline.py` — service-worker offline check.
  Run: `python3 -m http.server 8765 --directory public` then `python3 tests/test_app.py`.

Game rules: daily Strength quest (reps = 20 + 4/level up to 100, walk = 15 + 2 min/level up to 60, 8 glasses water),
reward 30 G (+5/level) + streak bonus, 50 XP (+5/level), +1 STR, 80% loot roll (PER raises it). XP to next level = 100 + 40*(lv-1);
level up = +3 stat points. Ranks: E 1-4, D 5-9, C 10-19, B 20-34, A 35-49, S 50+. Day rolls over at midnight America/Los_Angeles;
a missed quest => -15% Gold (min 10, x days up to 3), streak reset, Penalty Quest (unless a Penalty Ward is held).
