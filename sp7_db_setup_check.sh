#!/bin/bash
set -euo pipefail

echo "Starting MariaDB database and user creation script..."

DB_HOST="${DATABASE_HOST}"
DB_PORT="${DATABASE_PORT}"
MASTER_USER_NAME="${MASTER_NAME:-${MASTER_USER_NAME:-}}"
MASTER_USER_PASSWORD="${MASTER_PASSWORD:-${MASTER_USER_PASSWORD:-}}"
MIGRATOR_NAME="${MIGRATOR_NAME:-}"
MIGRATOR_PASSWORD="${MIGRATOR_PASSWORD:-}"
MIGRATOR_USER_HOST="%"
DB_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-}"
DB_NAME="${DATABASE_NAME}"
APP_USER_NAME="${APP_USER_NAME:-}"
APP_USER_PASSWORD="${APP_USER_PASSWORD:-}"
APP_USER_HOST="%"

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

# If target user name is not set, set it to migrator
if [[ -z "$APP_USER_NAME" ]]; then
  APP_USER_NAME="$MIGRATOR_NAME"
  APP_USER_PASSWORD="$MIGRATOR_PASSWORD"
fi

# Validate required variables
if [[ -z "$DB_HOST" || -z "$DB_PORT" || -z "$MASTER_USER_NAME" || -z "$MASTER_USER_PASSWORD" || -z "$MIGRATOR_PASSWORD" || -z "$DB_NAME" || -z "$APP_USER_NAME" || -z "$APP_USER_PASSWORD" ]]; then
  echo "Error: One or more required environment variables are missing or empty."
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

# Relationship flags between the three users
SAME_MASTER_AND_MIGRATOR=false
SAME_MASTER_AND_APP=false
SAME_MIGRATOR_AND_APP=false
if [[ "$MIGRATOR_NAME" == "$MASTER_USER_NAME" && "$MIGRATOR_PASSWORD" == "$MASTER_USER_PASSWORD" ]]; then
  SAME_MASTER_AND_MIGRATOR=true
fi
if [[ "$APP_USER_NAME" == "$MASTER_USER_NAME" && "$APP_USER_PASSWORD" == "$MASTER_USER_PASSWORD" ]]; then
  SAME_MASTER_AND_APP=true
fi
if [[ "$APP_USER_NAME" == "$MIGRATOR_NAME" && "$APP_USER_PASSWORD" == "$MIGRATOR_PASSWORD" ]]; then
  SAME_MIGRATOR_AND_APP=true
fi

sql_string_literal() {
  local value="$1"
  value=$(printf '%s' "$value" | sed -e 's/\\/\\\\/g' -e "s/'/''/g")
  printf "'%s'" "$value"
}

sql_identifier() {
  local value="$1"
  value=$(printf '%s' "$value" | sed -e 's/`/``/g')
  printf "\`%s\`" "$value"
}

regex_escape() {
  local value="$1"
  printf '%s' "$value" | sed -e 's/[][\/.^$*+?{}()|\\]/\\&/g'
}

has_all_privs_in_line() {
  local line="$1"
  shift
  local missing=()
  local p
  for p in "$@"; do
    # match whole words; spaces already canonicalized
    if ! grep -qiE "(^|[, ])${p}(,| |$)" <<<"$line"; then
      missing+=("$p")
    fi
  done
  if [[ ${#missing[@]} -eq 0 ]]; then
    return 0
  else
    return 1
  fi
}

grant_line_has_required_privs() {
  local line="$1"
  shift

  if grep -qiE "^GRANT .*ALL PRIVILEGES.* ON \*\.\* TO " <<<"$line"; then
    return 0
  fi

  if grep -qiE "^GRANT .*ALL PRIVILEGES.* ON (${SQL_DB_IDENTIFIER_REGEX}|${DB_NAME_REGEX})\.\* TO " <<<"$line"; then
    return 0
  fi

  if grep -qiE " ON \*\.\* TO " <<<"$line" && has_all_privs_in_line "$line" "$@"; then
    return 0
  fi

  if grep -qiE " ON (${SQL_DB_IDENTIFIER_REGEX}|${DB_NAME_REGEX})\.\* TO " <<<"$line" && has_all_privs_in_line "$line" "$@"; then
    return 0
  fi

  return 1
}

SQL_DB_NAME=$(sql_string_literal "$DB_NAME")
SQL_DB_IDENTIFIER=$(sql_identifier "$DB_NAME")
SQL_MIGRATOR_NAME=$(sql_string_literal "$MIGRATOR_NAME")
SQL_MIGRATOR_PASSWORD=$(sql_string_literal "$MIGRATOR_PASSWORD")
SQL_MIGRATOR_USER_HOST=$(sql_string_literal "$MIGRATOR_USER_HOST")
SQL_APP_USER_NAME=$(sql_string_literal "$APP_USER_NAME")
SQL_APP_USER_PASSWORD=$(sql_string_literal "$APP_USER_PASSWORD")
SQL_APP_USER_HOST=$(sql_string_literal "$APP_USER_HOST")
DB_NAME_REGEX=$(regex_escape "$DB_NAME")
SQL_DB_IDENTIFIER_REGEX=$(regex_escape "$SQL_DB_IDENTIFIER")
MIGRATION_REQUIRED_PRIVS=("SELECT" "INSERT" "UPDATE" "DELETE" "CREATE" "ALTER" "INDEX" "DROP")
APP_REQUIRED_PRIVS=("SELECT" "INSERT" "UPDATE" "DELETE" "CREATE TEMPORARY TABLES" "LOCK TABLES" "EXECUTE")

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
  echo "       Check that MYSQL_ROOT_PASSWORD / MASTER_* env vars match the actual DB root/master user."
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
DB_EXISTS=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$MASTER_USER_NAME" --password="$MASTER_USER_PASSWORD" -sse \
"SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = '$DB_NAME';")

if [[ "$DB_EXISTS" -eq 0 ]]; then
  echo "Creating database '$DB_NAME'..."
  echo "Executing: mysql -h \"$DB_HOST\" -P \"$DB_PORT\" -u \"$MASTER_USER_NAME\" --password=\"<hidden>\" -e \"CREATE DATABASE \`$DB_NAME\`;\""
  if mysql -h "$DB_HOST" -P "$DB_PORT" -u "$MASTER_USER_NAME" --password="$MASTER_USER_PASSWORD" \
    -e "CREATE DATABASE \`$DB_NAME\`;"; then
    NEW_DATABASE_CREATED=1
  else
    echo "Error: Failed to create database."
    exit 1
  fi
else
  echo "Database '$DB_NAME' already exists."
fi

# Create migrator user if it doesn't exist
USER_EXISTS=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$MASTER_USER_NAME" --password="$MASTER_USER_PASSWORD" -sse \
"SELECT COUNT(*) FROM mysql.user WHERE user = $SQL_MIGRATOR_NAME AND host = $SQL_MIGRATOR_USER_HOST;")

if [[ "$USER_EXISTS" -eq 0 && "$MIGRATOR_NAME" != "root" ]]; then
  echo "Creating migrator user '$MIGRATOR_NAME'..."
  echo "Executing: mysql -h \"$DB_HOST\" -P \"$DB_PORT\" -u \"$MASTER_USER_NAME\" --password=\"<hidden>\" -e \"CREATE USER '${MIGRATOR_NAME}'@'${MIGRATOR_USER_HOST}' IDENTIFIED BY '<hidden>';\""
  if mysql -h "$DB_HOST" -P "$DB_PORT" -u "$MASTER_USER_NAME" --password="$MASTER_USER_PASSWORD" \
    -e "CREATE USER $SQL_MIGRATOR_NAME@$SQL_MIGRATOR_USER_HOST IDENTIFIED BY $SQL_MIGRATOR_PASSWORD;"; then    
    NEW_MIGRATOR_USER_CREATED=1
  else
    echo "Error: Failed to create user."
    exit 1
  fi
else
  echo "User '$MIGRATOR_NAME' already exists."
fi

if [[ "$NEW_MIGRATOR_USER_CREATED" -eq 1 ]]; then
  echo "Granting privileges to new user..."
  echo "Executing: mysql -h \"$DB_HOST\" -P \"$DB_PORT\" -u \"$MASTER_USER_NAME\" --password=\"<hidden>\" -e \"GRANT ALL PRIVILEGES ON ${SQL_DB_IDENTIFIER}.* TO ${SQL_MIGRATOR_NAME}@${SQL_MIGRATOR_USER_HOST}; FLUSH PRIVILEGES;\""
  if ! mysql -h "$DB_HOST" -P "$DB_PORT" -u "$MASTER_USER_NAME" --password="$MASTER_USER_PASSWORD" -e "GRANT ALL PRIVILEGES ON ${SQL_DB_IDENTIFIER}.* TO ${SQL_MIGRATOR_NAME}@${SQL_MIGRATOR_USER_HOST}; FLUSH PRIVILEGES;"; then    
    echo "Error: Failed to grant privileges to new user."
    exit 1
  fi
else
  echo "Skipping privilege grant for migrator user: user already exists. Verifying privileges on '${DB_NAME}'..."
fi

GRANTS_OUTPUT="$(mysql -N -B -h "$DB_HOST" -P "$DB_PORT" \
  -u "$MASTER_USER_NAME" --password="$MASTER_USER_PASSWORD" \
  -e "SHOW GRANTS FOR '${MIGRATOR_NAME}'@'${MIGRATOR_USER_HOST}';" 2>/dev/null || true)"

if [[ -z "$GRANTS_OUTPUT" ]]; then
  echo "Error: Could not retrieve grants for '${MIGRATOR_NAME}'@'${MIGRATOR_USER_HOST}'."
  exit 1
fi

mapfile -t MIGRATOR_GRANTS_LINES < <(echo "$GRANTS_OUTPUT" | tr -s '[:space:]' ' ')

migrator_has_required_permissions=false

for g in "${MIGRATOR_GRANTS_LINES[@]}"; do
  if grant_line_has_required_privs "$g" "${MIGRATION_REQUIRED_PRIVS[@]}"; then
    migrator_has_required_permissions=true; break
  fi
done

if [[ "$migrator_has_required_permissions" == true ]]; then
  echo "Verified: '${MIGRATOR_NAME}'@'${MIGRATOR_USER_HOST}' has migration privileges on '${DB_NAME}'."
else
  echo "Error: '${MIGRATOR_NAME}'@'${MIGRATOR_USER_HOST}' lacks migration privileges on '${DB_NAME}'."
  echo "Required for migrations (any one GRANT must include all of): ${MIGRATION_REQUIRED_PRIVS[*]}"
  echo "Grants found:"
  echo "$GRANTS_OUTPUT"
  exit 1
fi

# Create app user if it doesn't exist
USER_EXISTS=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$MASTER_USER_NAME" --password="$MASTER_USER_PASSWORD" -sse \
"SELECT COUNT(*) FROM mysql.user WHERE user = $SQL_APP_USER_NAME AND host = $SQL_APP_USER_HOST;")

if [[ "$USER_EXISTS" -eq 0 && "$APP_USER_NAME" != "root" ]]; then
  echo "Creating app user '$APP_USER_NAME'..."
  echo "Executing: mysql -h \"$DB_HOST\" -P \"$DB_PORT\" -u \"$MASTER_USER_NAME\" --password=\"<hidden>\" -e \"CREATE USER '${APP_USER_NAME}'@'${APP_USER_HOST}' IDENTIFIED BY '<hidden>';\""
  if mysql -h "$DB_HOST" -P "$DB_PORT" -u "$MASTER_USER_NAME" --password="$MASTER_USER_PASSWORD" \
    -e "CREATE USER $SQL_APP_USER_NAME@$SQL_APP_USER_HOST IDENTIFIED BY $SQL_APP_USER_PASSWORD;"; then
    NEW_APP_USER_CREATED=1
  else
    echo "Notice: Migrator user '${MIGRATOR_NAME}' lacks usable access to '${DB_NAME}'."
    echo "Make corrections to the intended MIGRATOR user permissions to resolve."
    echo "  GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${MIGRATOR_NAME}'@'${MIGRATOR_USER_HOST}'; FLUSH PRIVILEGES;"
    MIGRATOR_NAME="$MASTER_USER_NAME"
    MIGRATOR_PASSWORD="$MASTER_USER_PASSWORD"
    MIGRATION_DB_ALIAS="master"
  fi
fi

########################################
# APP USER
########################################

if [[ "$SAME_MASTER_AND_APP" == true ]]; then
  echo "App user '$APP_USER_NAME' uses the same credentials as master."
  echo "Skipping creation/grant steps for a separate app account."
  echo "Relying on master privileges for runtime connections."

elif [[ "$SAME_MIGRATOR_AND_APP" == true ]]; then
  echo "App user '$APP_USER_NAME' uses the same credentials as migrator."
  echo "Skipping creation/grant steps for a separate app account."
  echo "Relying on migrator privileges for runtime connections."

else
  echo "Ensuring app user '$APP_USER_NAME' exists for relevant hosts..."

if [[ "$NEW_APP_USER_CREATED" -eq 1 ]]; then
  echo "Granting privileges to new user..."
  echo "Executing: mysql -h \"$DB_HOST\" -P \"$DB_PORT\" -u \"$MASTER_USER_NAME\" --password=\"<hidden>\" -e \"GRANT SELECT, INSERT, UPDATE, DELETE, CREATE TEMPORARY TABLES, LOCK TABLES, EXECUTE ON ${SQL_DB_IDENTIFIER}.* TO ${SQL_APP_USER_NAME}@${SQL_APP_USER_HOST}; FLUSH PRIVILEGES;\""
  if ! mysql -h "$DB_HOST" -P "$DB_PORT" -u "$MASTER_USER_NAME" --password="$MASTER_USER_PASSWORD" -e "GRANT SELECT, INSERT, UPDATE, DELETE, CREATE TEMPORARY TABLES, LOCK TABLES, EXECUTE ON ${SQL_DB_IDENTIFIER}.* TO ${SQL_APP_USER_NAME}@${SQL_APP_USER_HOST}; FLUSH PRIVILEGES;"; then    
    echo "Error: Failed to grant privileges to new user."
    exit 1
  fi
else
  echo "Skipping privilege grant for app user: user already exists. Verifying privileges on '${DB_NAME}'..."
fi

APP_GRANTS_RAW="$(mysql -N -B -h "$DB_HOST" -P "$DB_PORT" -u "$MASTER_USER_NAME" --password="$MASTER_USER_PASSWORD" \
                  -e "SHOW GRANTS FOR '${APP_USER_NAME}'@'${APP_USER_HOST}';" 2>/dev/null || true)"

if [[ -z "$APP_GRANTS_RAW" ]]; then
  echo "Error: Could not retrieve grants for '${APP_USER_NAME}'@'${APP_USER_HOST}'."
  exit 1
fi

mapfile -t APP_GRANTS_LINES < <(echo "$APP_GRANTS_RAW" | tr -s '[:space:]' ' ')

app_has_required_permissions=false

# Evaluate each grant line
for g in "${APP_GRANTS_LINES[@]}"; do
  if grant_line_has_required_privs "$g" "${APP_REQUIRED_PRIVS[@]}"; then
    app_has_required_permissions=true; break
  fi
done

if [[ "$app_has_required_permissions" == true ]]; then
  echo "Verified: '${APP_USER_NAME}'@'${APP_USER_HOST}' has required privileges on '${DB_NAME}'."
else
  echo "Error: '${APP_USER_NAME}'@'${APP_USER_HOST}' lacks required privileges on '${DB_NAME}'."
  echo "Required (any one GRANT must include all of): ${APP_REQUIRED_PRIVS[*]}"
  echo "Grants found:"
  echo "$APP_GRANTS_RAW"
  APP_USER_NAME="$MIGRATOR_NAME"
  APP_USER_PASSWORD="$MIGRATOR_PASSWORD"
fi
fi

echo "--------------------------------------------------"
echo "Database and user setup complete."
echo "New database created: $([[ "$NEW_DATABASE_CREATED" -eq 1 ]] && echo True || echo False)"
echo "New migrator user created: $([[ "$NEW_MIGRATOR_USER_CREATED" -eq 1 ]] && echo True || echo False)"
echo "New app user created: $([[ "$NEW_APP_USER_CREATED" -eq 1 ]] && echo True || echo False)"
echo "--------------------------------------------------"

# Run the base_specify_migration script
echo "Running base_specify_migration..."

if [[ "$NEW_DATABASE_CREATED" -eq 0 ]]; then
  set +e
  ve/bin/python manage.py base_specify_migration --use-override --database=${MIGRATION_DB_ALIAS}
  BASE_MIGRATION_EXIT_CODE=$?
  set -e
else
  set +e
  ve/bin/python manage.py base_specify_migration --database=${MIGRATION_DB_ALIAS}
  BASE_MIGRATION_EXIT_CODE=$?
  set -e
fi

if [[ $BASE_MIGRATION_EXIT_CODE -ne 0 ]]; then
  echo "Error: base_specify_migration failed (exit code $BASE_MIGRATION_EXIT_CODE). Aborting."
  exit 1
fi

echo "Running Django migrations..."
ve/bin/python manage.py migrate --database=${MIGRATION_DB_ALIAS}
