#!/usr/bin/env bash
set -euo pipefail

APP=/var/www/listacross.eu/app
DB=/var/www/listacross.eu/shared/db/db.sqlite3
BACKUPS=/var/www/listacross.eu/backups
BACKEND_SERVICE=listacrosseu-backend.service
FRONTEND_SERVICE=listacrosseu-frontend.service
RELEASE_REF="${1:?Usage: production-release.sh <git-ref-or-package> [--import]}"
DO_IMPORT=false
[[ "${2:-}" == "--import" ]] && DO_IMPORT=true

stamp=$(date -u +%Y%m%dT%H%M%SZ)
mkdir -p "$BACKUPS"
cp -p "$DB" "$BACKUPS/db.sqlite3.$stamp"

cd "$APP"
git fetch --tags --prune
git checkout --detach "$RELEASE_REF"

python3 -m venv --clear /tmp/listacrosseu-release-venv
/tmp/listacrosseu-release-venv/bin/pip install -r backend/requirements.txt
/tmp/listacrosseu-release-venv/bin/python backend/manage.py check --deploy --settings=config.settings.production
/tmp/listacrosseu-release-venv/bin/python backend/manage.py test listings --settings=config.settings.production
(cd frontend && npm ci && npm run lint && npx tsc --noEmit && npm run build)
/tmp/listacrosseu-release-venv/bin/python backend/manage.py makemigrations --check --dry-run --settings=config.settings.production

grep -Eq '^NEXT_PUBLIC_ENABLE_PUBLIC_CLAIM_CTA=1([[:space:]]*#.*)?$' /etc/listacross.eu/frontend.env

DATA_FILES=(
  backend/imports/review/osm-city-seed/combined/final-approved.json
)
/tmp/listacrosseu-release-venv/bin/python backend/manage.py import_reviewed_osm --country-code BE $(printf -- '--file %q ' "${DATA_FILES[@]}") --dry-run --settings=config.settings.production
if $DO_IMPORT; then
  /tmp/listacrosseu-release-venv/bin/python backend/manage.py migrate --noinput --settings=config.settings.production
  /tmp/listacrosseu-release-venv/bin/python backend/manage.py import_reviewed_osm --country-code BE $(printf -- '--file %q ' "${DATA_FILES[@]}") --confirm-import --settings=config.settings.production
fi

systemctl restart "$BACKEND_SERVICE"
systemctl restart "$FRONTEND_SERVICE"
curl --fail --silent --show-error http://127.0.0.1:8004/healthz/ >/dev/null
curl --fail --silent --show-error http://127.0.0.1:3004/ >/dev/null
echo "Release $RELEASE_REF is healthy; database backup: $BACKUPS/db.sqlite3.$stamp"
