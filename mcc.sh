#!/usr/bin/env bash
# Malibu Coffee Company — Shopify helpers

# 👉 Set these to your theme IDs:
FEATURE_ID="147203096731"      # your working sandbox (hot reload)
# STAGING_ID="149960327323"      # your staging/QA theme (commented out - causing errors)

set -e

case "$1" in
  dev)
    echo "→ Hot preview on FEATURE ($FEATURE_ID)…"
    echo "→ File watcher enabled (detects agent changes automatically)"
    
    # Background process to ensure file changes are detected (including from agent)
    (
      LAST_CHECK=$(date +%s)
      while true; do
        sleep 2
        # Find files modified in the last 10 seconds
        NOW=$(date +%s)
        find assets snippets sections -type f -newermt "@$((NOW - 10))" 2>/dev/null | while read file; do
          # Only touch if file was modified recently (avoid infinite loop)
          if [ -f "$file" ]; then
            touch "$file" 2>/dev/null || true
            echo "[Watcher] Detected change: $file" >&2
          fi
        done
      done
    ) &
    WATCHER_PID=$!
    
    # Trap to cleanup watcher on exit
    trap "kill $WATCHER_PID 2>/dev/null || true" EXIT INT TERM
    
    # Start shopify dev
    shopify theme dev --theme "$FEATURE_ID"
    ;;

  open:feature)
    shopify theme open --theme "$FEATURE_ID"
    ;;

  # open:staging)
  #   shopify theme open --theme "$STAGING_ID"
  #   ;;

  editor:feature)
    shopify theme open --theme "$FEATURE_ID" --editor
    ;;

  # editor:staging)
  #   shopify theme open --theme "$STAGING_ID" --editor
  #   ;;

  push:feature)
    echo "→ Pushing local snapshot → FEATURE ($FEATURE_ID)…"
    shopify theme push --theme "$FEATURE_ID"
    ;;

  # push:staging)
  #   echo "→ Pushing local snapshot → STAGING ($STAGING_ID)…"
  #   shopify theme push --theme "$STAGING_ID"
  #   ;;

  pull:feature)
    echo "→ Pulling server → local from FEATURE ($FEATURE_ID)…"
    shopify theme pull --theme "$FEATURE_ID"
    ;;

  # pull:staging)
  #   echo "→ Pulling server → local from STAGING ($STAGING_ID)…"
  #   shopify theme pull --theme "$STAGING_ID"
  #   ;;

  # settings:copy-staging-to-feature)
  #   echo "→ Copying Staging settings into Feature (config/settings_data.json)…"
  #   shopify theme pull --theme "$STAGING_ID" --path .tmp-staging
  #   cp .tmp-staging/config/settings_data.json config/settings_data.json
  #   rm -rf .tmp-staging
  #   echo "✓ Copied. Push to Feature to apply:"
  #   echo "  ./mcc.sh push:feature"
  #   ;;

  *)
    echo "Commands:
  ./mcc.sh dev                         # hot-preview Feature (auto-detects agent changes)
  ./mcc.sh open:feature                # open Feature preview
  # ./mcc.sh open:staging                # open Staging preview (commented out)
  ./mcc.sh editor:feature              # open Feature in Theme Editor
  # ./mcc.sh editor:staging              # open Staging in Theme Editor (commented out)
  ./mcc.sh push:feature                # push local → Feature
  # ./mcc.sh push:staging                # push local → Staging (QA) (commented out)
  ./mcc.sh pull:feature                # pull server Feature → local
  # ./mcc.sh pull:staging                # pull server Staging → local (commented out)
  # ./mcc.sh settings:copy-staging-to-feature  # copy Staging settings → Feature (commented out)"
    ;;
esac
