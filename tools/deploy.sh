#!/usr/bin/env bash
# Usage: tools/deploy.sh "<proxy-path URL from the Netlify connector's deploy-site operation>"
# Builds src/ -> public/, stages only the static site (no screenshots/tests), and deploys to system-carlos.
set -euo pipefail
cd "$(dirname "$0")/.."
SITE_ID=817b0fcf-a80d-4b29-9ee0-77f2a9e57e30
./tools/build.sh
STAGE=$(mktemp -d /tmp/system-deploy.XXXX)
cp -r public/. "$STAGE/"
sed 's#publish = "public"#publish = "."#' netlify.toml > "$STAGE/netlify.toml"
cd "$STAGE" && npx -y @netlify/mcp@latest --site-id "$SITE_ID" --proxy-path "$1"
