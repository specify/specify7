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
  ./sp7_db_setup_check.sh # Setup db users and run mirgations
  # ve/bin/python manage.py base_specify_migration
  # ve/bin/python manage.py migrate
  if [ "${RUN_KEY_MIGRATION_FUNCTIONS_ON_STARTUP:-0}" = "1" ]; then
    echo "Running key migration functions."
    ve/bin/python manage.py run_key_migration_functions
  fi
  set -e
fi
exec "$@"
