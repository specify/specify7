#!/bin/bash
set -e
if [ -z "$(ls -A /volumes/static-files/specify-config)" ]; then
  mkdir -p /volumes/static-files/specify-config/config/
  rsync -a config/ /volumes/static-files/specify-config/config/
fi
if [ "$1" = 've/bin/gunicorn' ] || [ "$1" = 've/bin/python' ]; then
  echo "Updating static files in /volumes/static-files/."
  rsync -a --delete specifyweb/frontend/static/ /volumes/static-files/frontend-static
  cd /opt/specify7
  echo "Applying Django migrations."
  if ./sp7_db_setup_check.sh; then
    # sp7_db_setup_check.sh intentionally runs manage.py base_specify_migration and manage.py migrate;
    # only manage.py run_key_migration_functions is invoked here afterward.
    ve/bin/python manage.py run_key_migration_functions # Runs after sp7_db_setup_check.sh succeeds.
  else
    echo "Database setup failed; skipping startup migrations."
    exit 1
  fi
fi
exec "$@"
