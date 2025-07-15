# Seed database folder

Used by development docker composition only.

Put an `.sql` dump of your database in this directory. You can call the
file anything you want as long as it ends with `.sql`.

Make sure the file does not include `CREATE DATABASE someDatabase` or
`USE someDatabase` lines.

[More information](https://github.com/specify/specify7/wiki/Docker-Workflow-for-Development)
