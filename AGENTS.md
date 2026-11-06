# Specify 7 — agent instructions

## Running backend tests

Always run backend (Django) tests inside the running Specify Docker application
container, using its virtual environment. Never run tests against a host Python
environment, install host dependencies, or create a new virtual environment.

- Find the application container with `docker ps` (service defined in
  `docker-compose.yml`; currently named `specify7`).
- The container's working directory is `/opt/specify7`, with the source mounted
  from this workspace, so code changes are picked up without rebuilding.
- Always pass `--keepdb` to preserve the test database between runs.

Interactive workflow:

```sh
docker exec -it CONTAINER_ID_NAME /bin/bash
source ve/bin/activate
python manage.py test TEST_MODULE --keepdb
```

Non-interactive (preferred for automation):

```sh
docker exec specify7 /bin/bash -c 'source ve/bin/activate && python manage.py test TEST_MODULE --keepdb -v3'
```

Replace `TEST_MODULE` with the relevant dotted module path, for example
`specifyweb.backend.workbench.tests` or `specifyweb.backend.stored_queries`.
Omit `TEST_MODULE` to run the full suite. Add `-v3` for verbose output.
