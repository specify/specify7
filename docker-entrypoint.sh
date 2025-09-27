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
  set +e
  ./sp7_db_setup_check.sh
  ve/bin/python manage.py migrate --database=migrations
  # ve/bin/python manage.py base_specify_migration
  # ve/bin/python manage.py migrate
  # ve/bin/python manage.py run_key_migration_functions # Uncomment if you want the key migration functions to run on startup.
  set -e
fi
exec "$@"
