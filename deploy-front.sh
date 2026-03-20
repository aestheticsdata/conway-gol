#!/usr/bin/env bash
set -Eeuo pipefail

######################################
# Configuration
######################################
REMOTE_USER_HOST="${REMOTE_USER_HOST:-debian@ks-b}"
APP_ROOT="${APP_ROOT:-/var/www/1991computer/conway-gol}"
FRONT_DIR="$APP_ROOT/front"
FRONT_BACKUP_DIR="$APP_ROOT/.front.bak"
FRONT_RELEASES_DIR="$APP_ROOT/.front-releases"
FRONT_CURRENT_FILE="$APP_ROOT/.front-current-release"
FRONT_PREVIOUS_FILE="$APP_ROOT/.front-previous-release"
FRONT_HOSTNAME="${FRONT_HOSTNAME:-1991computer.com}"
FRONT_PUBLIC_BASE="${FRONT_PUBLIC_BASE:-/conway-gol/}"
KEEP_RELEASES="${KEEP_RELEASES:-3}"

# Local project dir (script location = repo root)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOCAL_FRONT_DIR="$SCRIPT_DIR/front"
LOCAL_DIST_DIR="$LOCAL_FRONT_DIR/dist"

######################################
# Utility functions
######################################

log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*"
}

remote_delete_release() {
  local release_dir=$1

  if [ -z "$release_dir" ]; then
    return
  fi

  ssh "$REMOTE_USER_HOST" RELEASE_DIR="$release_dir" 'bash -s' << 'EOF'
set -Eeuo pipefail

rm -rf "$RELEASE_DIR"
EOF
}

remote_restore_front_backup() {
  ssh "$REMOTE_USER_HOST" \
    FRONT_DIR="$FRONT_DIR" \
    FRONT_BACKUP_DIR="$FRONT_BACKUP_DIR" \
    FRONT_CURRENT_FILE="$FRONT_CURRENT_FILE" \
    FRONT_PREVIOUS_FILE="$FRONT_PREVIOUS_FILE" \
    'bash -s' << 'EOF'
set -Eeuo pipefail

if [ ! -d "$FRONT_BACKUP_DIR" ]; then
  echo "ERROR: Front backup directory not found" >&2
  exit 1
fi

CURRENT_RELEASE=""
PREVIOUS_RELEASE=""

if [ -f "$FRONT_CURRENT_FILE" ]; then
  CURRENT_RELEASE=$(cat "$FRONT_CURRENT_FILE")
fi

if [ -f "$FRONT_PREVIOUS_FILE" ]; then
  PREVIOUS_RELEASE=$(cat "$FRONT_PREVIOUS_FILE")
fi

rm -rf "$FRONT_DIR"
mv "$FRONT_BACKUP_DIR" "$FRONT_DIR"

if [ -f "$FRONT_DIR/index.html" ] && [ ! -e "$FRONT_DIR/current" ]; then
  ln -s . "$FRONT_DIR/current"
fi

if [ -n "$PREVIOUS_RELEASE" ]; then
  printf '%s\n' "$PREVIOUS_RELEASE" > "$FRONT_CURRENT_FILE"
fi

if [ -n "$CURRENT_RELEASE" ]; then
  printf '%s\n' "$CURRENT_RELEASE" > "$FRONT_PREVIOUS_FILE"
fi
EOF
}

remote_validate_front() {
  ssh "$REMOTE_USER_HOST" \
    FRONT_DIR="$FRONT_DIR" \
    FRONT_HOSTNAME="$FRONT_HOSTNAME" \
    FRONT_PUBLIC_BASE="$FRONT_PUBLIC_BASE" \
    'bash -s' << 'EOF'
set -Eeuo pipefail

if [ ! -f "$FRONT_DIR/index.html" ] && [ ! -f "$FRONT_DIR/current/index.html" ]; then
  echo "ERROR: Front is invalid (missing index.html in front/ or front/current/)" >&2
  exit 1
fi

if command -v curl >/dev/null 2>&1; then
  curl --fail --silent --show-error \
    --resolve "${FRONT_HOSTNAME}:443:127.0.0.1" \
    "https://${FRONT_HOSTNAME}${FRONT_PUBLIC_BASE}" >/dev/null
fi
EOF
}

deploy() {
  cd "$SCRIPT_DIR"

  if [ ! -f "$LOCAL_FRONT_DIR/package.json" ]; then
    echo "ERROR: front/package.json not found. Run this script from the repo root." >&2
    exit 1
  fi

  local GIT_HASH
  GIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "no-git")

  local GIT_BRANCH_RAW
  GIT_BRANCH_RAW=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "no-branch")

  local GIT_BRANCH
  GIT_BRANCH=${GIT_BRANCH_RAW//\//-}
  GIT_BRANCH=${GIT_BRANCH// /_}

  local TIMESTAMP
  TIMESTAMP=$(date +'%Y%m%d-%H%M%S')

  local RELEASE_NAME="release-${TIMESTAMP}-${GIT_BRANCH}-${GIT_HASH}"
  local REMOTE_RELEASE_DIR="$FRONT_RELEASES_DIR/$RELEASE_NAME"
  local SWITCH_DONE="false"

  on_error() {
    local lineno=$1
    log "ERROR: Front deployment failed at line $lineno"

    if [[ "$SWITCH_DONE" == "true" ]]; then
      log "Auto rollback: restoring previous front version"
      if remote_restore_front_backup; then
        remote_validate_front || true
        log "Auto rollback succeeded"
      else
        log "Auto rollback failed, manual intervention required"
      fi
    else
      log "No rollback needed: front production was not modified yet"
    fi

    remote_delete_release "$REMOTE_RELEASE_DIR" || true
  }

  trap 'on_error $LINENO' ERR

  ######################################
  # Build local front
  ######################################
  log "Building front locally"

  (
    cd "$LOCAL_FRONT_DIR"
    pnpm build
  )

  if [ ! -f "$LOCAL_DIST_DIR/index.html" ]; then
    echo "ERROR: Local front build is invalid (missing front/dist/index.html)" >&2
    exit 1
  fi

  ######################################
  # Remote: prepare release directory
  ######################################
  log "Preparing front release directory on server"

  ssh "$REMOTE_USER_HOST" \
    APP_ROOT="$APP_ROOT" \
    FRONT_RELEASES_DIR="$FRONT_RELEASES_DIR" \
    REMOTE_RELEASE_DIR="$REMOTE_RELEASE_DIR" \
    'bash -s' << 'EOF'
set -Eeuo pipefail

mkdir -p "$APP_ROOT"
mkdir -p "$FRONT_RELEASES_DIR"
rm -rf "$REMOTE_RELEASE_DIR"
mkdir -p "$REMOTE_RELEASE_DIR"
EOF

  ######################################
  # Rsync build output only
  ######################################
  log "Syncing front build output to release directory (rsync)"

  rsync -az \
    --delete \
    --exclude=".DS_Store" \
    "$LOCAL_DIST_DIR/" \
    "$REMOTE_USER_HOST":"$REMOTE_RELEASE_DIR/"

  ######################################
  # Validate staged release
  ######################################
  log "Validating staged front release"

  ssh "$REMOTE_USER_HOST" RELEASE_DIR="$REMOTE_RELEASE_DIR" 'bash -s' << 'EOF'
set -Eeuo pipefail

if [ ! -f "$RELEASE_DIR/index.html" ]; then
  echo "ERROR: Front release is empty (missing index.html)" >&2
  exit 1
fi
EOF

  ######################################
  # Switch front atomically with hidden backup
  ######################################
  log "Performing atomic front release switch with backup"

  ssh "$REMOTE_USER_HOST" \
    APP_ROOT="$APP_ROOT" \
    FRONT_DIR="$FRONT_DIR" \
    FRONT_BACKUP_DIR="$FRONT_BACKUP_DIR" \
    FRONT_CURRENT_FILE="$FRONT_CURRENT_FILE" \
    FRONT_PREVIOUS_FILE="$FRONT_PREVIOUS_FILE" \
    REMOTE_RELEASE_DIR="$REMOTE_RELEASE_DIR" \
    'bash -s' << 'EOF'
set -Eeuo pipefail

TMP_FRONT_DIR="$APP_ROOT/.front_new"
PREVIOUS_RELEASE=""

if [ -f "$FRONT_CURRENT_FILE" ]; then
  PREVIOUS_RELEASE=$(cat "$FRONT_CURRENT_FILE")
fi

rm -rf "$TMP_FRONT_DIR"
mkdir -p "$TMP_FRONT_DIR"
cp -a "$REMOTE_RELEASE_DIR"/. "$TMP_FRONT_DIR"/

if [ ! -f "$TMP_FRONT_DIR/index.html" ]; then
  echo "ERROR: Prepared front release is invalid (missing index.html)" >&2
  exit 1
fi

rm -rf "$FRONT_BACKUP_DIR"
if [ -d "$FRONT_DIR" ]; then
  mv "$FRONT_DIR" "$FRONT_BACKUP_DIR"
fi

mv "$TMP_FRONT_DIR" "$FRONT_DIR"
ln -sfn . "$FRONT_DIR/current"
printf '%s\n' "$REMOTE_RELEASE_DIR" > "$FRONT_CURRENT_FILE"

if [ -n "$PREVIOUS_RELEASE" ]; then
  printf '%s\n' "$PREVIOUS_RELEASE" > "$FRONT_PREVIOUS_FILE"
fi
EOF

  SWITCH_DONE="true"

  ######################################
  # Validate through nginx
  ######################################
  log "Checking front through nginx"
  remote_validate_front

  ######################################
  # Cleanup old releases
  ######################################
  log "Cleaning old front releases"

  ssh "$REMOTE_USER_HOST" \
    FRONT_RELEASES_DIR="$FRONT_RELEASES_DIR" \
    KEEP_RELEASES="$KEEP_RELEASES" \
    'bash -s' << 'EOF'
set -Eeuo pipefail

if [ -d "$FRONT_RELEASES_DIR" ]; then
  find "$FRONT_RELEASES_DIR" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' \
    | sort -nr \
    | awk -v keep="$KEEP_RELEASES" 'NR > keep { print $2 }' \
    | xargs -r rm -rf
fi
EOF

  trap - ERR

  log "Front deployment completed successfully"
  log "Front directory: $FRONT_DIR"
  log "Manual rollback: ./deploy-front.sh rollback"
}

rollback() {
  log "Manual rollback to previous front version"

  if remote_restore_front_backup; then
    remote_validate_front
    log "Manual front rollback completed"
  else
    log "Rollback failed: no front backup available"
    exit 1
  fi
}

######################################
# Script entry point
######################################

ACTION="${1:-deploy}"

case "$ACTION" in
  deploy)
    deploy
    ;;
  rollback)
    rollback
    ;;
  *)
    echo "Usage: $0 [deploy|rollback]"
    exit 1
    ;;
esac
