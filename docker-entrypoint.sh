#!/bin/bash

# This entry point script implements a multi-mode image as described in
# https://aws.amazon.com/blogs/opensource/demystifying-entrypoint-cmd-docker/
#
# It supports the following commands:
#
#  sp7start -- This is the default CMD. When the container is invoked
#    this way it checks if any Django migrations need to be
#    performed. If so it refuses to start and issues instructions to
#    do the migrations. Otherwise it performs a normal Specify 7 start
#    up.
#
#  sp7migrate -- When the container is invoked with this command it
#    executes any outstanding migrations.
#
#  sp7migrate-and-start -- This command executes any migrations and
#    then starts Specify 7. It is less safe than doing the migrations
#    independently but is convenient in testing scenarios.
#
#  sp7worker -- This command starts the container in worker mode and
#    is intended to simplify docker-compose.yml files.
#
# Any other command is executed as is.
#
# For the sp7start and sp7worker commands, any arguments are passed through to
# the underlying gunicorn or celery command, respectively.


set -euf -o pipefail

sp7start () {
    echo "Updating static files in /volumes/static-files/."
    rsync -a --delete specifyweb/frontend/static/ /volumes/static-files/frontend-static

    echo "Starting Specify 7."
    exec ve/bin/gunicorn -w 3 -b 0.0.0.0:8000 -t 300 specifyweb_wsgi "$@"
}

sp7migrate () {
    echo "Applying Django migrations."
    ve/bin/python manage.py migrate notifications
    ve/bin/python manage.py migrate workbench
}

case "$1" in
    "sp7start" )
        shift

        if (ve/bin/python manage.py showmigrations notifications workbench | grep -q '\[ \]'); then
            printf "\n\nSpecify 7 cannot start because Django migrations need to be applied.\n\n"
            printf "Apply the migrations by:\n"
            printf "1. Stopping any process that could be accessing your database \"$DATABASE_NAME\".\n"
            printf "2. Backing up the database \"$DATABASE_NAME\".\n"
            printf "3. Applying the migrations by running \"docker-compose run --rm THIS-CONTAINER sp7migrate\".\n"
        else
            sp7start "$@"
        fi
        ;;

    "sp7migrate" )
        shift

        sp7migrate
        ;;

    "sp7migrate-and-start" )
        shift

        sp7migrate
        sp7start "$@"
        ;;

    "sp7worker" )
        shift

        echo "Starting Specify 7 Worker."
        exec ve/bin/celery -A specifyweb worker -l INFO --concurrency=1 "$@"
        ;;

    *)
        exec "$@"
        ;;
esac
