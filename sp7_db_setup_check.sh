#!/bin/bash

# Assuming MySQL/MariaDB is runninger and is already setup with root/super user.
# This script setups a master user for Specify 7 to use.

ENV_FILE=".env"
TARGET_USER_HOST='%'

echo "Starting MariaDB database and user creation script..."

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
  echo "Error: Environment file '$ENV_FILE' not found."
  exit 1
fi

# Read variable from .env file
get_env_var() {
  local var_name="$1"
  local env_file="$2"
  grep -E "^\s*${var_name}\s*=" "$env_file" | grep -v '^\s*#' | sed -e 's/^\s*[^=]*=\s*//' -e 's/\s*$//' | head -n 1
}

# Read variables
DB_HOST=$(get_env_var "DATABASE_HOST" "$ENV_FILE")
DB_PORT=$(get_env_var "DATABASE_PORT" "$ENV_FILE")
SUPER_USER_NAME=$(get_env_var "SUPER_USER_NAME" "$ENV_FILE")
SUPER_USER_NAME=${SUPER_USER_NAME:-root}
SUPER_USER_PASSWORD=$(get_env_var "SUPER_USER_PASSWORD" "$ENV_FILE")
DB_ROOT_PASSWORD=$(get_env_var "MYSQL_ROOT_PASSWORD" "$ENV_FILE")
SUPER_USER_PASSWORD=${SUPER_USER_PASSWORD:-$DB_ROOT_PASSWORD}
DB_NAME=$(get_env_var "DATABASE_NAME" "$ENV_FILE")
TARGET_USER_NAME=$(get_env_var "MASTER_NAME" "$ENV_FILE")
TARGET_USER_PASSWORD=$(get_env_var "MASTER_PASSWORD" "$ENV_FILE")

# Validate variables
if [[ -z "$DB_HOST" || -z "$DB_PORT" || -z "$DB_ROOT_PASSWORD" || -z "$DB_NAME" || -z "$TARGET_USER_NAME" || -z "$TARGET_USER_PASSWORD" ]]; then
  echo "Error: One or more required variables are missing or empty in '$ENV_FILE'."
  exit 1
fi

if [[ "$TARGET_USER_NAME" == "root" ]]; then
   echo "Error: MASTER_NAME is set to 'root'."
   exit 1
fi

echo "Read configuration:"
echo "  DB Host: $DB_HOST"
echo "  DB Port: $DB_PORT"
echo "  DB Name: $DB_NAME"
echo "  Target User: $TARGET_USER_NAME"
echo "  Target User Host: $TARGET_USER_HOST"

NEW_DATABASE_CREATED=0
NEW_USER_CREATED=0

# Check if the database exists
DB_EXISTS=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$SUPER_USER_NAME" --password="$SUPER_USER_PASSWORD" -sse "SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = '$DB_NAME';")
if [[ "$DB_EXISTS" -eq 0 ]]; then
  echo "Creating database '$DB_NAME'..."
  if mysql -h "$DB_HOST" -P "$DB_PORT" -u "$SUPER_USER_NAME" --password="$SUPER_USER_PASSWORD" -e "CREATE DATABASE \`$DB_NAME\`;"; then
    NEW_DATABASE_CREATED=1
  else
    echo "Error: Failed to create database."
    exit 1
  fi
else
  echo "Database '$DB_NAME' already exists."
fi

# Check if user exists
USER_EXISTS=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$SUPER_USER_NAME" --password="$SUPER_USER_PASSWORD" -sse "SELECT COUNT(*) FROM mysql.user WHERE user = '$TARGET_USER_NAME' AND host = '$TARGET_USER_HOST';")
if [[ "$USER_EXISTS" -eq 0 ]]; then
  echo "Creating user '$TARGET_USER_NAME'..."
  if mysql -h "$DB_HOST" -P "$DB_PORT" -u "$SUPER_USER_NAME" --password="$SUPER_USER_PASSWORD" -e "CREATE USER '${TARGET_USER_NAME}'@'${TARGET_USER_HOST}' IDENTIFIED BY '${TARGET_USER_PASSWORD}';"; then
    NEW_USER_CREATED=1
  else
    echo "Error: Failed to create user."
    exit 1
  fi
else
  echo "User '$TARGET_USER_NAME' already exists."
fi

# Grant privileges only if a new user was created
if [[ "$NEW_USER_CREATED" -eq 1 ]]; then
  echo "Granting privileges to new user..."
  if ! mysql -h "$DB_HOST" -P "$DB_PORT" -u "$SUPER_USER_NAME" --password="$SUPER_USER_PASSWORD" -e "GRANT SELECT, INSERT, UPDATE, DELETE, CREATE TEMPORARY TABLES, LOCK TABLES, EXECUTE ON \`${DB_NAME}\`.* TO '${TARGET_USER_NAME}'@'${TARGET_USER_HOST}'; FLUSH PRIVILEGES;"; then
    echo "Error: Failed to grant privileges to new user."
    exit 1
  fi
else
  echo "Skipping privilege grant: user already exists."
fi

# Determine overall result
if [[ "$NEW_DATABASE_CREATED" -eq 1 ]]; then
  CREATED_FLAG=1
else
  CREATED_FLAG=0
fi

echo "--------------------------------------------------"
echo "Database and user setup complete."
echo "New database created: $NEW_DATABASE_CREATED"
echo "New user created: $NEW_USER_CREATED"
echo "Passing flag $CREATED_FLAG to migration script..."
echo "--------------------------------------------------"

# Run the Python migration script with the flag
ve/bin/python manage.py base_specify_migration "$CREATED_FLAG"
