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
  # The following command is prone to failing
  # See https://github.com/specify/specify7/issues/789
  # and https://github.com/specify/docker-compositions/issues/7
  ve/bin/python manage.py base_specify_migration
  ve/bin/python manage.py migrate
  set -e
fi
exec "$@"
