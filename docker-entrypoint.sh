 #!/bin/bash
set -e

if [ "$1" = 've/bin/gunicorn' ]; then
    echo "Updating static files in /volumes/static-files/."
    rsync -a --delete specifyweb/frontend/static/ /volumes/static-files/frontend-static
    cd /opt/specify7
    echo "Applying Django migrations."
    ve/bin/python manage.py migrate notifications workbench
fi
exec "$@"
