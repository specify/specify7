#!/bin/bash
set -e

if [ "$1" = 've/bin/gunicorn' ] || [ "$1" = 've/bin/python' ]; then
  echo "Updating static files in /volumes/static-files/."
  rsync -a --delete specifyweb/frontend/static/ /volumes/static-files/frontend-static
  cd /opt/specify7
  echo "Applying Django migrations."
  set +e
  # The following command is prone to failing
  ve/bin/python manage.py migrate notifications
  set -e
  ve/bin/python manage.py migrate workbench
fi
exec "$@"
