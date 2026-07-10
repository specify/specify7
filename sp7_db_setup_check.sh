#!/bin/bash
set -euo pipefail

echo "Starting MariaDB database and user creation script..."

DB_HOST="${DATABASE_HOST}"
DB_PORT="${DATABASE_PORT}"
MASTER_USER_NAME="${MASTER_NAME:-${MASTER_USER_NAME:-}}"
MASTER_USER_PASSWORD="${MASTER_PASSWORD:-${MASTER_USER_PASSWORD:-}}"
MIGRATOR_NAME="${MIGRATOR_NAME:-}"
MIGRATOR_PASSWORD="${MIGRATOR_PASSWORD:-}"
DB_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-}"
DB_NAME="${DATABASE_NAME}"
APP_USER_NAME="${APP_USER_NAME:-}"
APP_USER_PASSWORD="${APP_USER_PASSWORD:-}"

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
  printf "%s" "$value"
}

sql_identifier() {
  local value="$1"
  local escape_for_like="${2:-false}"
  value=$(printf '%s' "$value" | sed -e 's/`/``/g')
  if [[ "$escape_for_like" == "true" ]]; then
    value=$(printf '%s' "$value" | sed -E -e 's/\\/\\\\/g' -e 's/_|%/\\&/g')
  fi
  printf '%s' "$value"
}

regex_escape() {
  local value="$1"
  printf '%s' "$value" | sed -e 's/[][\/.^$*+?{}()|\\]/\\&/g'
}

grant_line_has_required_privs() {
  local line="$1"
  shift
  local privileges=("$@")

  local regex_scoped_to_database="ON[[:space:]]+(\*\.\*|\`$SQL_DB_IDENTIFIER_ESCAPED_FOR_LIKE\`\.\*[[:space:]]+TO)"

  # We first make sure this grant line is even scoped to the right database
  # Specifically, we make sure the line is scoped to *.* or DB_NAME.*
  if [[ ! $line =~ $regex_scoped_to_database ]]; then
    return 1
  fi

  # The trivial case for when the user is granted all privileges
  if [[ $line =~ GRANT[[:space:]]ALL[[:space:]]PRIVILEGES ]]; then
    return 0
  fi

  local privs_to_match=${#privileges[@]}
  local found_privs=0

  for priv in "${privileges[@]}"; do
    # The privelege can be in the list of priveleges, or it can be the last
    # privelege.
    # We match with the comma or the last with ON to prevent general priveleges
    # like SELECT, INSERT, etc. matching against more specific priveleges (like
    # those scoped to a specific table or column)
    local to_match="$priv,|$priv[[:space:]]$regex_scoped_to_database"
    if [[ $line =~ $to_match ]]; then
      found_privs=$((found_privs+1))
    fi
  done

  if [[ $found_privs -eq $privs_to_match ]]; then
    return 0
  fi

  return 1
}

SQL_DB_NAME=$(sql_string_literal "$DB_NAME")
SQL_DB_IDENTIFIER=$(sql_identifier "$DB_NAME")
SQL_DB_IDENTIFIER_ESCAPED_FOR_LIKE=$(sql_identifier "$DB_NAME" "true")
SQL_MIGRATOR_NAME=$(sql_string_literal "$MIGRATOR_NAME")
SQL_MIGRATOR_PASSWORD=$(sql_string_literal "$MIGRATOR_PASSWORD")
SQL_APP_USER_NAME=$(sql_string_literal "$APP_USER_NAME")
SQL_APP_USER_PASSWORD=$(sql_string_literal "$APP_USER_PASSWORD")
APP_REQUIRED_PRIVS=("SELECT" "INSERT" "UPDATE" "DELETE" "CREATE TEMPORARY TABLES" "LOCK TABLES" "EXECUTE")
MIGRATION_REQUIRED_PRIVS=("${APP_REQUIRED_PRIVS[@]}" "CREATE" "ALTER" "INDEX" "DROP")

echo "--------------------------------------------------"
echo "DB Configuration:"
echo "  DB Host: $DB_HOST"
echo "  DB Port: $DB_PORT"
echo "  DB Name: $DB_NAME"
echo "  Master User:    $MASTER_USER_NAME"
echo "  Migrator User:  $MIGRATOR_NAME"
echo "  App User:       $APP_USER_NAME"
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
  echo "Error: Unable to connect to MariaDB with provided master user credentials ($MASTER_USER_NAME)."
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
"SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = '$SQL_DB_NAME';")

if [[ "$DB_EXISTS" -eq 0 ]]; then
  echo "Creating database '$DB_NAME'..."
  echo "Executing: mysql -h \"$DB_HOST\" -P \"$DB_PORT\" -u \"$MASTER_USER_NAME\" --password=\"<hidden>\" -e \"CREATE DATABASE \`${SQL_DB_IDENTIFIER}\`;\""
  if mysql -h "$DB_HOST" -P "$DB_PORT" -u "$MASTER_USER_NAME" --password="$MASTER_USER_PASSWORD" \
    -e "CREATE DATABASE \`${SQL_DB_IDENTIFIER}\`;"; then
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
"SELECT COUNT(*) FROM mysql.user WHERE user = '$SQL_MIGRATOR_NAME' AND host = '$CLIENT_HOST';")

if [[ "$USER_EXISTS" -eq 0 && "$MIGRATOR_NAME" != "root" ]]; then
  echo "Creating migrator user '$MIGRATOR_NAME'..."
  echo "Executing: mysql -h \"$DB_HOST\" -P \"$DB_PORT\" -u \"$MASTER_USER_NAME\" --password=\"<hidden>\" -e \"CREATE USER '${SQL_MIGRATOR_NAME}'@'${CLIENT_HOST}' IDENTIFIED BY '<hidden>';\""
  if mysql -h "$DB_HOST" -P "$DB_PORT" -u "$MASTER_USER_NAME" --password="$MASTER_USER_PASSWORD" \
    -e "CREATE USER '$SQL_MIGRATOR_NAME'@'$CLIENT_HOST' IDENTIFIED BY '$SQL_MIGRATOR_PASSWORD';"; then
    NEW_MIGRATOR_USER_CREATED=1
  else
    echo "Error: Failed to create user."
    exit 1
  fi
else
  echo "User '$SQL_MIGRATOR_NAME' already exists."
fi

if [[ "$NEW_MIGRATOR_USER_CREATED" -eq 1 ]]; then
  echo "Granting privileges to new user..."
  echo "Executing: mysql -h \"$DB_HOST\" -P \"$DB_PORT\" -u \"$MASTER_USER_NAME\" --password=\"<hidden>\" -e \"GRANT ALL PRIVILEGES ON \`${SQL_DB_IDENTIFIER_ESCAPED_FOR_LIKE}\`.* TO '${SQL_MIGRATOR_NAME}'@'${CLIENT_HOST}'; FLUSH PRIVILEGES;\""

  if ! mysql -h "$DB_HOST" -P "$DB_PORT" -u "$MASTER_USER_NAME" --password="$MASTER_USER_PASSWORD" -e "GRANT ALL PRIVILEGES ON \`${SQL_DB_IDENTIFIER_ESCAPED_FOR_LIKE}\`.* TO '${SQL_MIGRATOR_NAME}'@'${CLIENT_HOST}'; FLUSH PRIVILEGES;"; then
    echo "Error: Failed to grant privileges to new user."
    exit 1
  fi
else
  echo "Skipping privilege grant for migrator user: user already exists. Verifying privileges on '${DB_NAME}'..."
fi

GRANTS_OUTPUT="$(mysql -N -B --raw -h "$DB_HOST" -P "$DB_PORT" \
  -u "$MASTER_USER_NAME" --password="$MASTER_USER_PASSWORD" \
  -e "SHOW GRANTS FOR '${SQL_MIGRATOR_NAME}'@'${CLIENT_HOST}';" 2>/dev/null || true)"

if [[ -z "$GRANTS_OUTPUT" ]]; then
  echo "Error: Could not retrieve grants for '${SQL_MIGRATOR_NAME}'@'${CLIENT_HOST}'."
  exit 1
fi

mapfile -t MIGRATOR_GRANTS_LINES <<< "$GRANTS_OUTPUT"

migrator_has_required_permissions=false

for g in "${MIGRATOR_GRANTS_LINES[@]}"; do
  if grant_line_has_required_privs "$g" "${MIGRATION_REQUIRED_PRIVS[@]}"; then
    migrator_has_required_permissions=true; break
  fi
done

if [[ "$migrator_has_required_permissions" == true ]]; then
  echo "Verified: '${SQL_MIGRATOR_NAME}'@'${CLIENT_HOST}' has migration privileges on '${DB_NAME}'."
else
  echo "Error: '${SQL_MIGRATOR_NAME}'@'${CLIENT_HOST}' lacks migration privileges on '${DB_NAME}'."
  echo "Required for migrations (any one GRANT must include all of): ${MIGRATION_REQUIRED_PRIVS[*]}"
  echo "Grants found:"
  echo "$GRANTS_OUTPUT"
  exit 1
fi

# Create app user if it doesn't exist
USER_EXISTS=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$MASTER_USER_NAME" --password="$MASTER_USER_PASSWORD" -sse \
"SELECT COUNT(*) FROM mysql.user WHERE user = '$SQL_APP_USER_NAME' AND host = '$CLIENT_HOST';")

if [[ "$USER_EXISTS" -eq 0 && "$APP_USER_NAME" != "root" ]]; then
  echo "Creating app user '$SQL_APP_USER_NAME'..."
  echo "Executing: mysql -h \"$DB_HOST\" -P \"$DB_PORT\" -u \"$MASTER_USER_NAME\" --password=\"<hidden>\" -e \"CREATE USER '${SQL_APP_USER_NAME}'@'${CLIENT_HOST}' IDENTIFIED BY '<hidden>';\""
  if mysql -h "$DB_HOST" -P "$DB_PORT" -u "$MASTER_USER_NAME" --password="$MASTER_USER_PASSWORD" \
    -e "CREATE USER '$SQL_APP_USER_NAME'@'$CLIENT_HOST' IDENTIFIED BY '$SQL_APP_USER_PASSWORD';"; then
    NEW_APP_USER_CREATED=1
  else
    echo "Error: Failed to create app user '${APP_USER_NAME}'@'${CLIENT_HOST}'."
    echo "Falling back to migrator credentials for app user."
    APP_USER_NAME="$MIGRATOR_NAME"
    APP_USER_PASSWORD="$MIGRATOR_PASSWORD"
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
  echo "Executing: mysql -h \"$DB_HOST\" -P \"$DB_PORT\" -u \"$MASTER_USER_NAME\" --password=\"<hidden>\" -e \"GRANT SELECT, INSERT, UPDATE, DELETE, CREATE TEMPORARY TABLES, LOCK TABLES, EXECUTE ON \`${SQL_DB_IDENTIFIER_ESCAPED_FOR_LIKE}\`.* TO ${SQL_APP_USER_NAME}@'${CLIENT_HOST}'; FLUSH PRIVILEGES;\""
  if ! mysql -h "$DB_HOST" -P "$DB_PORT" -u "$MASTER_USER_NAME" --password="$MASTER_USER_PASSWORD" -e "GRANT SELECT, INSERT, UPDATE, DELETE, CREATE TEMPORARY TABLES, LOCK TABLES, EXECUTE ON \`${SQL_DB_IDENTIFIER_ESCAPED_FOR_LIKE}\`.* TO '${SQL_APP_USER_NAME}'@'${CLIENT_HOST}'; FLUSH PRIVILEGES;"; then
    echo "Error: Failed to grant privileges to new user."
    exit 1
  fi
else
  echo "Skipping privilege grant for app user: user already exists. Verifying privileges on '${DB_NAME}'..."
fi

APP_GRANTS_RAW="$(mysql -N -B -h "$DB_HOST" -P "$DB_PORT" -u "$MASTER_USER_NAME" --password="$MASTER_USER_PASSWORD" \
                  -e "SHOW GRANTS FOR '${SQL_APP_USER_NAME}'@'${CLIENT_HOST}';" 2>/dev/null || true)"

if [[ -z "$APP_GRANTS_RAW" ]]; then
  echo "Error: Could not retrieve grants for '${SQL_APP_USER_NAME}'@'${CLIENT_HOST}'."
  exit 1
fi

mapfile -t APP_GRANTS_LINES <<< "$APP_GRANTS_RAW"

app_has_required_permissions=false

# Evaluate each grant line
for g in "${APP_GRANTS_LINES[@]}"; do
  if grant_line_has_required_privs "$g" "${APP_REQUIRED_PRIVS[@]}"; then
    app_has_required_permissions=true; break
  fi
done

if [[ "$app_has_required_permissions" == true ]]; then
  echo "Verified: '${APP_USER_NAME}'@'${CLIENT_HOST}' has required privileges on '${DB_NAME}'."
else
  echo "Error: '${APP_USER_NAME}'@'${CLIENT_HOST}' lacks required privileges on '${DB_NAME}'."
  echo "Required (any one GRANT must include all of): ${APP_REQUIRED_PRIVS[*]}"
  echo "Grants found:"
  echo "$APP_GRANTS_RAW"
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
