#!/bin/bash

set -euo pipefail

SERVER_USER="debian"
SERVER_HOST="ks-b"
REMOTE_ROOT="/var/www/1991computer"
APP_NAME="conway-gol"
REMOTE_FRONT="$REMOTE_ROOT/$APP_NAME/front"

TIMESTAMP=$(date +"%Y-%m-%d-%Hh%M%S")
RELEASE_DIR="$REMOTE_FRONT/releases/$TIMESTAMP"

GREEN="\033[0;32m"
BLUE="\033[0;34m"
RED="\033[0;31m"
RESET="\033[0m"

log() { printf "${BLUE}%s${RESET}\n" "$1"; }
ok() { printf "${GREEN}%s${RESET}\n" "$1"; }
err() { printf "${RED}%s${RESET}\n" "$1"; }

if [ ! -d "src" ]; then
  err "src/ directory not found. Run this script from the front/ folder."
  exit 1
fi

log "Building project..."
pnpm build
ok "Build complete."

log "Preparing release folder on server..."
ssh "$SERVER_USER@$SERVER_HOST" "mkdir -p '$REMOTE_FRONT/releases'"

log "Uploading build to server..."
rsync -az dist/ "$SERVER_USER@$SERVER_HOST:$RELEASE_DIR/"
ok "Upload complete."

log "Removing existing symlink..."
ssh "$SERVER_USER@$SERVER_HOST" "rm -rf '$REMOTE_FRONT/current'"

log "Switching active release..."
ssh "$SERVER_USER@$SERVER_HOST" "ln -s '$RELEASE_DIR' '$REMOTE_FRONT/current'"
ok "Active release set to $TIMESTAMP."

ok "Deployment complete. Reload nginx manually when ready."