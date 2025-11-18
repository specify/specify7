#!/bin/bash

# This script sets up a master user for Specify 7 to use in MySQL/MariaDB using env vars from the Linux environment.

echo "Starting MariaDB database and user creation script..."

# Read variables from environment
DB_HOST="${DATABASE_HOST}"
DB_PORT="${DATABASE_PORT}"

DB_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD}"

MASTER_USER_NAME="${MASTER_NAME:-root}"
MASTER_USER_PASSWORD="${MASTER_PASSWORD:-$DB_ROOT_PASSWORD}"
MASTER_USER_HOST="${MASTER_HOST}"

MIGRATOR_NAME="${MIGRATOR_NAME}"
MIGRATOR_PASSWORD="${MIGRATOR_PASSWORD}"
MIGRATOR_USER_HOST="${MIGRATOR_HOST}"

DB_NAME="${DATABASE_NAME}"

APP_USER_NAME="${APP_USER_NAME}"
APP_USER_PASSWORD="${APP_USER_PASSWORD}"
APP_USER_HOST="${APP_HOST}"

# Host defaults (use '%' if not provided)
MASTER_USER_HOST="${MASTER_USER_HOST:-%}"
MIGRATOR_USER_HOST="${MIGRATOR_USER_HOST:-%}"
APP_USER_HOST="${APP_USER_HOST:-%}"

# If no explicit migrator password, fall back to DB root password
MIGRATOR_PASSWORD="${MIGRATOR_PASSWORD:-$DB_ROOT_PASSWORD}"

# If migrator user name is not set, set it to master
if [[ -z "$MIGRATOR_NAME" ]]; then
  MIGRATOR_NAME="$MASTER_USER_NAME"
  MIGRATOR_PASSWORD="$MASTER_USER_PASSWORD"
fi

# If migrator name is still not set, set it to root
if [[ -z "$MIGRATOR_NAME" ]]; then
  MIGRATOR_NAME="root"
  MIGRATOR_PASSWORD="$DB_ROOT_PASSWORD"
fi

# If app user name is not set, set it to migrator
if [[ -z "$APP_USER_NAME" ]]; then
  APP_USER_NAME="$MIGRATOR_NAME"
  APP_USER_PASSWORD="$MIGRATOR_PASSWORD"
fi

# Validate required variables
if [[ -z "$DB_HOST" || -z "$DB_PORT" || -z "$DB_NAME" ]]; then
  echo "Error: DB_HOST, DB_PORT, and DB_NAME must be set."
  exit 1
fi

if [[ -z "$MASTER_USER_NAME" || -z "$MASTER_USER_PASSWORD" ]]; then
  echo "Error: MASTER_USER_NAME and MASTER_USER_PASSWORD (or MYSQL_ROOT_PASSWORD) must be set."
  exit 1
fi

if [[ -z "$MIGRATOR_PASSWORD" || -z "$APP_USER_NAME" || -z "$APP_USER_PASSWORD" ]]; then
  echo "Error: One or more required user-related environment variables are missing or empty."
  exit 1
fi

echo "--------------------------------------------------"
echo "DB Configuration:"
echo "  DB Host: $DB_HOST"
echo "  DB Port: $DB_PORT"
echo "  DB Name: $DB_NAME"
echo "  Master User:    $MASTER_USER_NAME@$MASTER_USER_HOST"
echo "  Migrator User:  $MIGRATOR_NAME@$MIGRATOR_USER_HOST"
echo "  App User:       $APP_USER_NAME@$APP_USER_HOST"
echo "--------------------------------------------------"

NEW_DATABASE_CREATED=0
NEW_MIGRATOR_USER_CREATED=0
NEW_APP_USER_CREATED=0
MIGRATION_DB_ALIAS="migrations"

# Wait for MariaDB to be up and running
echo "Checking if MariaDB instance is up and running..."
until (exec 3<>/dev/tcp/"$DB_HOST"/"$DB_PORT") 2>/dev/null; do
  echo "MariaDB is not available yet. Retrying in 5 seconds..."
  sleep 5
done
echo "MariaDB is up and running."

# Check master (admin) login
if ! mariadb -h "$DB_HOST" -P "$DB_PORT" -u "$MASTER_USER_NAME" --password="$MASTER_USER_PASSWORD" -e "SELECT 1;" &> /dev/null; then
  echo "Error: Unable to connect to MariaDB with provided master user credentials ($MASTER_USER_NAME@$MASTER_USER_HOST)."
  echo "       Check that MYSQL_ROOT_PASSWORD / MASTER_* env vars match the actual DB root user."
  exit 1
fi

# Detect client host as seen by MariaDB
CLIENT_HOST="$(mariadb -N -B -h "$DB_HOST" -P "$DB_PORT" \
  -u "$MASTER_USER_NAME" --password="$MASTER_USER_PASSWORD" \
  -sse "SELECT SUBSTRING_INDEX(USER(),'@',-1);")" || CLIENT_HOST=""
CLIENT_HOST="${CLIENT_HOST%% *}"

if [[ -n "$CLIENT_HOST" ]]; then
  echo "Client host as seen by MariaDB: '$CLIENT_HOST'"
else
  echo "Warning: Could not detect client host via USER(); will only create users for explicit *_HOST values."
fi

# Create database if it doesn't exist
DB_EXISTS=$(mariadb -h "$DB_HOST" -P "$DB_PORT" -u "$MASTER_USER_NAME" --password="$MASTER_USER_PASSWORD" \
  -sse "SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = '$DB_NAME';")

if [[ "$DB_EXISTS" -eq 0 ]]; then
  echo "Creating database '$DB_NAME'..."
  echo "Executing: mariadb -h \"$DB_HOST\" -P \"$DB_PORT\" -u \"$MASTER_USER_NAME\" --password=\"<hidden>\" -e \"CREATE DATABASE \`$DB_NAME\`;\""
  if mariadb -h "$DB_HOST" -P "$DB_PORT" -u "$MASTER_USER_NAME" --password="$MASTER_USER_PASSWORD" \
       -e "CREATE DATABASE \`$DB_NAME\`;"; then
    NEW_DATABASE_CREATED=1
  else
    echo "Error: Failed to create database."
    exit 1
  fi
else
  echo "Database '$DB_NAME' already exists."
fi

########################################
# MIGRATOR USER
########################################

if [[ "$MIGRATOR_NAME" != "root" ]]; then
  echo "Ensuring migrator user '$MIGRATOR_NAME' exists for relevant hosts..."

  MIGRATOR_HOSTS_SEEN=""
  # We'll ensure the user exists for both MIGRATOR_USER_HOST and CLIENT_HOST
  for h in "$MIGRATOR_USER_HOST" "$CLIENT_HOST"; do
    [[ -z "$h" ]] && continue
    # avoid duplicates
    if [[ " $MIGRATOR_HOSTS_SEEN " == *" $h "* ]]; then
      continue
    fi
    MIGRATOR_HOSTS_SEEN+=" $h"

    USER_EXISTS_HOST=$(mariadb -h "$DB_HOST" -P "$DB_PORT" \
      -u "$MASTER_USER_NAME" --password="$MASTER_USER_PASSWORD" \
      -sse "SELECT COUNT(*) FROM mysql.user WHERE user = '$MIGRATOR_NAME' AND host = '$h';")

    if [[ "$USER_EXISTS_HOST" -eq 0 ]]; then
      echo "Creating user '${MIGRATOR_NAME}'@'${h}'..."
      echo "Executing: CREATE USER '${MIGRATOR_NAME}'@'${h}' IDENTIFIED BY '<hidden>'"
      if mariadb -h "$DB_HOST" -P "$DB_PORT" \
           -u "$MASTER_USER_NAME" --password="$MASTER_USER_PASSWORD" \
           -e "CREATE USER '${MIGRATOR_NAME}'@'${h}' IDENTIFIED BY '${MIGRATOR_PASSWORD}';"; then
        NEW_MIGRATOR_USER_CREATED=1
      else
        echo "Error: Failed to create migrator user '${MIGRATOR_NAME}'@'${h}'."
        exit 1
      fi
    else
      echo "Migrator user '${MIGRATOR_NAME}'@'${h}' already exists."
    fi
  done

  echo "Existing hosts for '$MIGRATOR_NAME' in mysql.user:"
  mariadb -h "$DB_HOST" -P "$DB_PORT" \
    -u "$MASTER_USER_NAME" --password="$MASTER_USER_PASSWORD" \
    -sse "SELECT CONCAT(\"'\", user, \"'@'\", host, \"'\") FROM mysql.user WHERE user = '$MIGRATOR_NAME';"

  # Grant privileges on DB_NAME for all relevant migrator hosts
  echo "Granting privileges to migrator user '$MIGRATOR_NAME'"
  MIGRATOR_GRANT_HOSTS_SEEN=""
  for h in "$MIGRATOR_USER_HOST" "$CLIENT_HOST"; do
    [[ -z "$h" ]] && continue
    if [[ " $MIGRATOR_GRANT_HOSTS_SEEN " == *" $h "* ]]; then
      continue
    fi
    MIGRATOR_GRANT_HOSTS_SEEN+=" $h"

    echo "Granting ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${MIGRATOR_NAME}'@'${h}'..."
    if ! mariadb -h "$DB_HOST" -P "$DB_PORT" \
          -u "$MASTER_USER_NAME" --password="$MASTER_USER_PASSWORD" \
          -e "GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${MIGRATOR_NAME}'@'${h}';"; then
      echo "Error: Failed to grant privileges to migrator user '${MIGRATOR_NAME}'@'${h}'."
      exit 1
    fi
  done

  if ! mariadb -h "$DB_HOST" -P "$DB_PORT" \
        -u "$MASTER_USER_NAME" --password="$MASTER_USER_PASSWORD" \
        -e "FLUSH PRIVILEGES;"; then
    echo "Error: Failed to FLUSH PRIVILEGES for migrator user."
    exit 1
  fi
else
  echo "Migrator user is 'root'; skipping creation/grant steps for separate migrator account."
fi

# Verify migrator access (for the configured MIGRATOR_USER_HOST)
GRANTS_OUTPUT="$(mariadb -N -B -h "$DB_HOST" -P "$DB_PORT" \
                  -u "$MASTER_USER_NAME" --password="$MASTER_USER_PASSWORD" \
                  -e "SHOW GRANTS FOR '${MIGRATOR_NAME}'@'${MIGRATOR_USER_HOST}';" 2>/dev/null || true)"

if [[ -z "$GRANTS_OUTPUT" ]]; then
  echo "Error: Could not retrieve grants for '${MIGRATOR_NAME}'@'${MIGRATOR_USER_HOST}'."
  echo "Check whether this user exists with a different host (e.g. 'localhost' instead of '$MIGRATOR_USER_HOST')."
  exit 1
fi

migrator_has_access=false

while IFS= read -r raw_line; do
  line="$(echo "$raw_line" | tr -s '[:space:]' ' ')"
  if echo "$line" | grep -Eiq " ON (\*\.\*|(\`?${DB_NAME}\`?)\.\*) "; then
    privs="$(echo "$line" | sed -E 's/^GRANT (.+) ON .+$/\1/I')"
    if echo "$privs" | grep -Eiq '^[[:space:]]*USAGE[[:space:]]*$'; then
      continue
    fi
    migrator_has_access=true
    break
  fi
done <<< "$GRANTS_OUTPUT"

if [[ "$migrator_has_access" == true ]]; then
  echo "Verified: '${MIGRATOR_NAME}'@'${MIGRATOR_USER_HOST}' has usable access to '${DB_NAME}'."
else
  echo "Notice: '${MIGRATOR_NAME}'@'${MIGRATOR_USER_HOST}' lacks usable access to '${DB_NAME}'."
  echo "Make corrections to the intended MIGRATOR user permissions to resolve."
  echo "  GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${MIGRATOR_NAME}'@'${MIGRATOR_USER_HOST}'; FLUSH PRIVILEGES;"
  MIGRATOR_NAME="$MASTER_USER_NAME"
  MIGRATOR_PASSWORD="$MASTER_USER_PASSWORD"
  MIGRATION_DB_ALIAS="master"
fi

########################################
# APP USER
########################################

echo "Ensuring app user '$APP_USER_NAME' exists for relevant hosts..."

APP_HOSTS_SEEN=""
for h in "$APP_USER_HOST" "$CLIENT_HOST"; do
  [[ -z "$h" ]] && continue
  if [[ " $APP_HOSTS_SEEN " == *" $h "* ]]; then
    continue
  fi
  APP_HOSTS_SEEN+=" $h"

  USER_EXISTS_HOST=$(mariadb -h "$DB_HOST" -P "$DB_PORT" \
    -u "$MASTER_USER_NAME" --password="$MASTER_USER_PASSWORD" \
    -sse "SELECT COUNT(*) FROM mysql.user WHERE user = '$APP_USER_NAME' AND host = '$h';")

  if [[ "$USER_EXISTS_HOST" -eq 0 && "$APP_USER_NAME" != "root" ]]; then
    echo "Creating user '${APP_USER_NAME}'@'${h}'..."
    echo "Executing: CREATE USER '${APP_USER_NAME}'@'${h}' IDENTIFIED BY '<hidden>'"
    if mariadb -h "$DB_HOST" -P "$DB_PORT" \
         -u "$MASTER_USER_NAME" --password="$MASTER_USER_PASSWORD" \
         -e "CREATE USER '${APP_USER_NAME}'@'${h}' IDENTIFIED BY '${APP_USER_PASSWORD}';"; then
      NEW_APP_USER_CREATED=1
    else
      echo "Error: Failed to create app user '${APP_USER_NAME}'@'${h}'."
      exit 1
    fi
  else
    echo "App user '${APP_USER_NAME}'@'${h}' already exists (or is 'root')."
  fi
done

echo "Existing hosts for '$APP_USER_NAME' in mysql.user:"
mariadb -h "$DB_HOST" -P "$DB_PORT" \
  -u "$MASTER_USER_NAME" --password="$MASTER_USER_PASSWORD" \
  -sse "SELECT CONCAT(\"'\", user, \"'@'\", host, \"'\") FROM mysql.user WHERE user = '$APP_USER_NAME';"

# Grant app privileges to all relevant app hosts
REQUIRED_PRIVS=("SELECT" "INSERT" "UPDATE" "ALTER" "INDEX" "DELETE" "CREATE TEMPORARY TABLES" "LOCK TABLES" "EXECUTE")

echo "Granting required privileges to app user '$APP_USER_NAME' for relevant hosts..."
APP_GRANT_HOSTS_SEEN=""
for h in "$APP_USER_HOST" "$CLIENT_HOST"; do
  [[ -z "$h" ]] && continue
  if [[ " $APP_GRANT_HOSTS_SEEN " == *" $h "* ]]; then
    continue
  fi
  APP_GRANT_HOSTS_SEEN+=" $h"

  echo "Granting app privileges on \`${DB_NAME}\`.* to '${APP_USER_NAME}'@'${h}'..."
  if ! mariadb -h "$DB_HOST" -P "$DB_PORT" \
        -u "$MASTER_USER_NAME" --password="$MASTER_USER_PASSWORD" \
        -e "GRANT SELECT, INSERT, UPDATE, ALTER, INDEX, DELETE, CREATE TEMPORARY TABLES, LOCK TABLES, EXECUTE ON \`${DB_NAME}\`.* TO '${APP_USER_NAME}'@'${h}';"; then
    echo "Error: Failed to grant privileges to app user '${APP_USER_NAME}'@'${h}'."
    exit 1
  fi
done

if ! mariadb -h "$DB_HOST" -P "$DB_PORT" \
      -u "$MASTER_USER_NAME" --password="$MASTER_USER_PASSWORD" \
      -e "FLUSH PRIVILEGES;"; then
  echo "Error: Failed to FLUSH PRIVILEGES for app user."
  exit 1
fi

APP_GRANTS_RAW="$(mariadb -N -B -h "$DB_HOST" -P "$DB_PORT" -u "$MASTER_USER_NAME" --password="$MASTER_USER_PASSWORD" \
                  -e "SHOW GRANTS FOR '${APP_USER_NAME}'@'${APP_USER_HOST}';" 2>/dev/null || true)"

if [[ -z "$APP_GRANTS_RAW" ]]; then
  echo "Error: Could not retrieve grants for '${APP_USER_NAME}'@'${APP_USER_HOST}'."
  echo "Check whether this user exists only with different hosts (e.g. 'localhost' instead of '$APP_USER_HOST')."
  exit 1
fi

mapfile -t APP_GRANTS_LINES < <(printf '%s\n' "$APP_GRANTS_RAW" | sed 's/[[:space:]]\+/ /g')

app_has_required_permissions=false

has_all_privs_in_line() {
  local line="$1"
  local missing=()
  for p in "${REQUIRED_PRIVS[@]}"; do
    if ! grep -qiE "(^|[, ])${p}(,| |$)" <<<"$line"; then
      missing+=("$p")
    fi
  done
  [[ ${#missing[@]} -eq 0 ]]
}

for g in "${APP_GRANTS_LINES[@]}"; do
  if grep -qiE "^GRANT .*ALL PRIVILEGES.* ON \*\.\* TO " <<<"$g"; then
    app_has_required_permissions=true; break
  fi
  if grep -qiE " ON \*\.\* TO " <<<"$g" && has_all_privs_in_line "$g"; then
    app_has_required_permissions=true; break
  fi
  if grep -qiE " ON (\`?${DB_NAME}\`?)\.\* TO " <<<"$g" && has_all_privs_in_line "$g"; then
    app_has_required_permissions=true; break
  fi
done

if [[ "$app_has_required_permissions" == true ]]; then
  echo "Verified: '${APP_USER_NAME}'@'${APP_USER_HOST}' has required privileges on '${DB_NAME}'."
else
  echo "Error: '${APP_USER_NAME}'@'${APP_USER_HOST}' lacks required privileges on '${DB_NAME}'."
  echo "Required (any one GRANT must include all of): ${REQUIRED_PRIVS[*]}"
  echo "Grants found:"
  echo "$APP_GRANTS_RAW"
  APP_USER_NAME="$MIGRATOR_NAME"
  APP_USER_PASSWORD="$MIGRATOR_PASSWORD"
fi

echo "--------------------------------------------------"
echo "Database and user setup complete."
echo "New database created: $([[ "$NEW_DATABASE_CREATED" -eq 1 ]] && echo True || echo False)"
echo "New migrator user created: $([[ "$NEW_MIGRATOR_USER_CREATED" -eq 1 ]] && echo True || echo False)"
echo "New app user created: $([[ "$NEW_APP_USER_CREATED" -eq 1 ]] && echo True || echo False)"
echo "--------------------------------------------------"

# Run the base_specify_migration script
if [[ "$NEW_DATABASE_CREATED" -eq 0 ]]; then
  echo "Existing database detected."
  ve/bin/python manage.py base_specify_migration --use-override --database=${MIGRATION_DB_ALIAS}
else
  echo "New database detected."
  ve/bin/python manage.py base_specify_migration --database=${MIGRATION_DB_ALIAS}
fi

# Run Django migrations
ve/bin/python manage.py migrate --database=${MIGRATION_DB_ALIAS}
