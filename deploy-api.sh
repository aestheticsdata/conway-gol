#!/usr/bin/env bash
set -Eeuo pipefail

######################################
# Configuration
######################################
REMOTE_USER_HOST="${REMOTE_USER_HOST:-debian@ks-b}"

# Local project dir (script location = repo root)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Base dir for conway-gol on the server
APP_ROOT="${APP_ROOT:-/var/www/1991computer/conway-gol}"

# Paths on the server
NEST_DIR="$APP_ROOT/api-nest"
NEST_BACKUP_DIR="$APP_ROOT/.api-nest.bak"
NEST_RELEASES_DIR="$APP_ROOT/.api-nest-releases"

# PM2 process names
PM2_APP_NAME="${PM2_APP_NAME:-conway-gol-api}"
LEGACY_PM2_APP_NAME="${LEGACY_PM2_APP_NAME:-conway-gol-server}"

# Production runtime config
PROD_PORT="${PROD_PORT:-6300}"
PROD_CATALOG_DIR="${PROD_CATALOG_DIR:-$NEST_DIR/data/patterns}"

# Load DATABASE_URL and SESSION_SECRET from api-nest/.env only if they are not already provided by the shell.
# This lets us deploy with prod values without copying a secrets file to the server.
NEST_ENV="$SCRIPT_DIR/api-nest/.env"
if [ -z "${DATABASE_URL:-}" ] && [ -f "$NEST_ENV" ]; then
  set -a
  # shellcheck source=/dev/null
  source "$NEST_ENV"
  set +a
fi
if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set. Required for Nest/Prisma build." >&2
  echo "Add it to api-nest/.env or run: export DATABASE_URL='mysql://...'" >&2
  exit 1
fi
if [ -z "${SESSION_SECRET:-}" ] && [ -f "$NEST_ENV" ]; then
  set -a
  # shellcheck source=/dev/null
  source "$NEST_ENV"
  set +a
fi
if [ -z "${SESSION_SECRET:-}" ]; then
  echo "ERROR: SESSION_SECRET is not set. Required for Nest/Prisma runtime." >&2
  echo "Add it to api-nest/.env or run: export SESSION_SECRET='...'" >&2
  exit 1
fi

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

remote_restore_legacy_pm2() {
  ssh "$REMOTE_USER_HOST" \
    LEGACY_PM2_APP_NAME="$LEGACY_PM2_APP_NAME" \
    'bash -s' << 'EOF'
set -Eeuo pipefail

pm2 restart "$LEGACY_PM2_APP_NAME" >/dev/null 2>&1 || true
EOF
}

remote_restart_pm2() {
  ssh "$REMOTE_USER_HOST" \
    NEST_DIR="$NEST_DIR" \
    PM2_APP_NAME="$PM2_APP_NAME" \
    LEGACY_PM2_APP_NAME="$LEGACY_PM2_APP_NAME" \
    PROD_PORT="$PROD_PORT" \
    PROD_CATALOG_DIR="$PROD_CATALOG_DIR" \
    DATABASE_URL="$DATABASE_URL" \
    SESSION_SECRET="$SESSION_SECRET" \
    'bash -s' << 'EOF'
set -Eeuo pipefail

cd "$NEST_DIR"

export PM2_APP_NAME
export PORT="$PROD_PORT"
export CATALOG_DIR="$PROD_CATALOG_DIR"
export DATABASE_URL
export SESSION_SECRET

pm2 reload "$NEST_DIR/ecosystem.config.js" --env production --update-env 2>/dev/null \
  || pm2 start "$NEST_DIR/ecosystem.config.js" --env production

sleep 2
curl --fail --silent --show-error "http://127.0.0.1:${PROD_PORT}/health" >/dev/null
EOF
}

# Remote rollback helper (used by manual and auto rollback)
remote_rollback() {
  ssh "$REMOTE_USER_HOST" \
    NEST_DIR="$NEST_DIR" \
    NEST_BACKUP_DIR="$NEST_BACKUP_DIR" \
    APP_ROOT="$APP_ROOT" \
    'bash -s' << 'EOF'
set -Eeuo pipefail

cd "$APP_ROOT"

if [ ! -d "$NEST_BACKUP_DIR" ]; then
  echo "ERROR: Backup directory not found" >&2
  exit 1
fi

rm -rf "$NEST_DIR"
mv "$NEST_BACKUP_DIR" "$NEST_DIR"

echo "API rollback done on server (restored from backup)"
EOF
}

deploy() {
  cd "$SCRIPT_DIR"

  ######################################
  # Git metadata for release naming
  ######################################

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
  local NEST_RELEASE_REMOTE="$NEST_RELEASES_DIR/$RELEASE_NAME"
  local SWITCH_DONE="false"

  ######################################
  # Error handler (rollback if needed)
  ######################################
  on_error() {
    local lineno=$1
    log "ERROR: API deployment failed at line $lineno"

    if [[ "$SWITCH_DONE" == "true" ]]; then
      log "Auto rollback: switching API back to previous version"
      if remote_rollback; then
        log "Auto rollback succeeded"
        log "Reloading API with pm2 after rollback"
        remote_restart_pm2
      else
        log "No Nest backup available. Attempting to restore legacy PM2 app"
        remote_restore_legacy_pm2
        log "Legacy PM2 app restore attempted. Manual intervention may still be required"
      fi
    else
      log "No rollback needed: API production was not modified yet"
    fi

    remote_delete_release "$NEST_RELEASE_REMOTE" || true
  }

  trap 'on_error $LINENO' ERR

  ######################################
  # Remote: prepare release directory
  ######################################
  log "Preparing release directory on server"

  ssh "$REMOTE_USER_HOST" \
    NEST_RELEASES_DIR="$NEST_RELEASES_DIR" \
    NEST_RELEASE_REMOTE="$NEST_RELEASE_REMOTE" \
    APP_ROOT="$APP_ROOT" \
    'bash -s' << 'EOF'
set -Eeuo pipefail

mkdir -p "$APP_ROOT"
mkdir -p "$NEST_RELEASES_DIR"

rm -rf "$NEST_RELEASE_REMOTE"
mkdir -p "$NEST_RELEASE_REMOTE"
EOF

  ######################################
  # Rsync Nest API
  ######################################
  log "Syncing Nest API source to release directory (rsync)"

  rsync -az \
    --delete \
    --exclude=".git" \
    --exclude=".env" \
    --exclude=".env.*" \
    --exclude="node_modules" \
    --exclude="dist" \
    --exclude=".DS_Store" \
    "$SCRIPT_DIR/api-nest/" \
    "$REMOTE_USER_HOST":"$NEST_RELEASE_REMOTE/"

  ######################################
  # Fresh install + build in staged release
  ######################################
  log "Installing dependencies and building staged release on server"

  ssh "$REMOTE_USER_HOST" \
    NEST_RELEASE_REMOTE="$NEST_RELEASE_REMOTE" \
    DATABASE_URL="$DATABASE_URL" \
    SESSION_SECRET="$SESSION_SECRET" \
    'bash -s' << 'EOF'
set -Eeuo pipefail

export PATH="$HOME/.local/share/pnpm:$HOME/.npm-global/bin:$PATH"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "ERROR: pnpm is not installed on this server (required for API deploy)" >&2
  exit 1
fi

cd "$NEST_RELEASE_REMOTE"
rm -rf node_modules dist
pnpm --version
pnpm install --frozen-lockfile
export DATABASE_URL
export SESSION_SECRET
pnpm prisma migrate deploy
pnpm build
EOF

  ######################################
  # Switch current ↔ backup (atomic)
  ######################################
  log "Performing atomic API release switch with backup"

  ssh "$REMOTE_USER_HOST" \
    NEST_DIR="$NEST_DIR" \
    NEST_BACKUP_DIR="$NEST_BACKUP_DIR" \
    NEST_RELEASE_REMOTE="$NEST_RELEASE_REMOTE" \
    APP_ROOT="$APP_ROOT" \
    'bash -s' << 'EOF'
set -Eeuo pipefail

cd "$APP_ROOT"

if [ ! -d "$NEST_RELEASE_REMOTE" ]; then
  echo "ERROR: Release directory does not exist" >&2
  exit 1
fi

if [ ! -f "$NEST_RELEASE_REMOTE/package.json" ]; then
  echo "ERROR: Nest release is empty (no package.json in $NEST_RELEASE_REMOTE)" >&2
  exit 1
fi

if [ ! -f "$NEST_RELEASE_REMOTE/dist/src/main.js" ]; then
  echo "ERROR: Nest release is invalid (missing dist/src/main.js)" >&2
  exit 1
fi

rm -rf "$NEST_BACKUP_DIR"

if [ -d "$NEST_DIR" ]; then
  if [ -f "$NEST_DIR/package.json" ] && [ -f "$NEST_DIR/dist/src/main.js" ]; then
    mv "$NEST_DIR" "$NEST_BACKUP_DIR"
  else
    rm -rf "$NEST_DIR"
  fi
fi

mv "$NEST_RELEASE_REMOTE" "$NEST_DIR"

echo "New API release activated"
EOF

  SWITCH_DONE="true"

  log "Restarting API with pm2"
  remote_restart_pm2

  trap - ERR

  log "API deployment completed successfully"
  log "Nest API is running on port $PROD_PORT"
  log "Previous version is available in: $NEST_BACKUP_DIR"
  log "Manual rollback: ./deploy-api.sh rollback"
}

rollback() {
  log "Manual rollback to previous API version"
  if remote_rollback; then
    log "Reloading API with pm2 after rollback"
    remote_restart_pm2
    log "Manual API rollback completed. Previous version is now live."
  else
    log "Rollback failed. Check server state manually."
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
