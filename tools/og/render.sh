#!/usr/bin/env bash
# Renders the social preview cards for the AI potential check with headless Chrome.
# Usage: tools/og/render.sh   (from the repo root; needs Google Chrome and an internet connection for the web fonts)
set -euo pipefail
cd "$(dirname "$0")/../.."
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
for lang in en de; do
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --window-size=1200,630 --virtual-time-budget=5000 \
    --screenshot="/tmp/og-check-$lang.png" "file://$PWD/tools/og/check-card.html?lang=$lang"
  # JPEG keeps the preview ~5x smaller than PNG; sips ships with macOS.
  sips -s format jpeg -s formatOptions 86 "/tmp/og-check-$lang.png" --out "static/images/og-check-$lang.jpg" >/dev/null
  rm "/tmp/og-check-$lang.png"
done
