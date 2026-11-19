# Specify 7 — agent instructions

## Running backend tests

Always run backend (Django) tests inside the running Specify Docker application
container, using its virtual environment. Never run tests against a host Python
environment, install host dependencies, or create a new virtual environment.

- Find the application container with `docker ps` (service defined in
  `docker-compose.yml`; currently named `specify7`).
- The container's working directory is `/opt/specify7`. Compose mounts only this
  workspace's `specifyweb` directory at `/opt/specify7/specifyweb`; it does not
  mount the workspace root. Changes under `specifyweb` are picked up without
  rebuilding, but `manage.py` is copied into the image. After changing
  `manage.py`, ensure `mariadb`, `redis`, and `webpack` are running, rebuild the
  image, then recreate only the `specify7` service before running tests so they
  use the updated file:

  ```sh
  set -e
  docker compose -p specify7 up -d mariadb redis webpack
  attempt=0
  until docker compose -p specify7 exec -T mariadb mariadb-admin ping --protocol=tcp --host=127.0.0.1 --silent >/dev/null 2>&1; do
    attempt=$((attempt + 1))
    if [ "$attempt" -ge 30 ]; then
      echo "MariaDB did not accept connections within 30 seconds; specify7 was not recreated" >&2
      exit 1
    fi
    sleep 1
  done
  docker compose -p specify7 build specify7
  docker compose -p specify7 up -d --force-recreate --no-deps specify7
  ```
- Before every backend test run, start the required dependencies and explicitly
  wait for MariaDB to accept TCP connections and Redis to respond to `PING`.
  Stop with an error if either service is not ready within 30 seconds:

  ```sh
  docker compose -p specify7 up -d mariadb redis webpack
  attempt=0
  until docker compose -p specify7 exec -T mariadb mariadb-admin ping --protocol=tcp --host=127.0.0.1 --silent >/dev/null 2>&1; do
    attempt=$((attempt + 1))
    if [ "$attempt" -ge 30 ]; then
      echo "MariaDB did not accept connections within 30 seconds" >&2
      exit 1
    fi
    sleep 1
  done
  attempt=0
  until [ "$(docker compose -p specify7 exec -T redis redis-cli ping 2>/dev/null)" = "PONG" ]; do
    attempt=$((attempt + 1))
    if [ "$attempt" -ge 30 ]; then
      echo "Redis did not become ready within 30 seconds" >&2
      exit 1
    fi
    sleep 1
  done
  ```
- For ordinary test runs, pass `--keepdb` to preserve the test database
  between runs. After applying a migration, omit `--keepdb` so Django recreates
  the test database with the updated schema. If Django asks whether to delete
  the existing test database, answer `yes` (or type `yes` at the prompt) to
  allow recreation.

Interactive workflow:

```sh
docker exec -it CONTAINER_ID_NAME /bin/bash
source ve/bin/activate
python manage.py test TEST_MODULE --keepdb
```

Replace `CONTAINER_ID_NAME` with the application container name found using
`docker ps`.

Non-interactive (preferred for automation):

```sh
docker exec CONTAINER_ID_NAME /bin/bash -c 'source ve/bin/activate && python manage.py test TEST_MODULE --keepdb -v3'
```

Replace `TEST_MODULE` with the relevant dotted module path, for example
`specifyweb.backend.workbench.tests` or `specifyweb.backend.stored_queries`.
Omit `TEST_MODULE` to run the full suite. Add `-v3` for verbose output.
