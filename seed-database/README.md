# Seed database folder

Used by development docker composition only.

Files in this folder are mounted into MariaDB's `/docker-entrypoint-initdb.d`.
They are only processed when `/var/lib/mysql` is empty, so reusing the
`database` volume will skip these imports. If you want to re-run the seed,
remove the volume first (for example with `docker compose down -v`).

Put an `.sql` dump of your database in this directory. You can call the
file anything you want as long as it ends with `.sql`.

Make sure the file does not include `CREATE DATABASE someDatabase` or
`USE someDatabase` lines.

[More information](https://github.com/specify/specify7/wiki/Docker-Workflow-for-Development)
