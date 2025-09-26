#!/bin/bash

# This script sets up a master user for Specify 7 to use in MySQL/MariaDB using env vars from the Linux environment.

TARGET_USER_HOST='%'

echo "Starting MariaDB database and user creation script..."

# Read variables from environment
DB_HOST="${DATABASE_HOST}"
DB_PORT="${DATABASE_PORT}"
MASTER_USER_NAME="${MASTER_NAME}"
MASTER_USER_PASSWORD="${MASTER_PASSWORD}"
SUPER_USER_NAME="${SUPER_USER_NAME}"
SUPER_USER_PASSWORD="${SUPER_USER_PASSWORD}"
DB_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD}"
DB_NAME="${DATABASE_NAME}"
TARGET_USER_NAME="${TARGET_NAME}"
TARGET_USER_PASSWORD="${TARGET_PASSWORD}"

# Use fallback values if needed
SUPER_USER_PASSWORD=${SUPER_USER_PASSWORD:-$DB_ROOT_PASSWORD}

# If super user name is not set, set it to master
if [[ -z "$SUPER_USER_NAME" ]]; then
  SUPER_USER_NAME="$MASTER_USER_NAME"
  SUPER_USER_PASSWORD="$MASTER_USER_PASSWORD"
fi
# If super user name is still not set, set it to root
if [[ -z "$SUPER_USER_NAME" ]]; then
  SUPER_USER_NAME="root"
  SUPER_USER_PASSWORD="$DB_ROOT_PASSWORD"
fi
# If target user name is not set, set it to super
if [[ -z "$TARGET_USER_NAME" ]]; then
  TARGET_USER_NAME="$SUPER_USER_NAME"
  TARGET_USER_PASSWORD="$SUPER_USER_PASSWORD"
fi

# Validate required variables
if [[ -z "$DB_HOST" || -z "$DB_PORT" || -z "$SUPER_USER_PASSWORD" || -z "$DB_NAME" || -z "$TARGET_USER_NAME" || -z "$TARGET_USER_PASSWORD" ]]; then
  echo "Error: One or more required environment variables are missing or empty."
  exit 1
fi

echo "Read configuration:"
echo "  DB Host: $DB_HOST"
echo "  DB Port: $DB_PORT"
echo "  DB Name: $DB_NAME"
echo "  Super User: $SUPER_USER_NAME"
echo "  Target User: $TARGET_USER_NAME"

NEW_DATABASE_CREATED=0
NEW_USER_CREATED=0

# Wait for MariaDB to be up and running
echo "Checking if MariaDB instance is up and running..."
until (exec 3<>/dev/tcp/"$DB_HOST"/"$DB_PORT") 2>/dev/null; do
  echo "MariaDB is not available yet. Retrying in 5 seconds..."
  sleep 5
done
echo "MariaDB is up and running."

# Check if the database exists
DB_EXISTS=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$SUPER_USER_NAME" --password="$SUPER_USER_PASSWORD" -sse "SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = '$DB_NAME';")
if [[ "$DB_EXISTS" -eq 0 ]]; then
  echo "Creating database '$DB_NAME'..."
  echo "Executing: mysql -h \"$DB_HOST\" -P \"$DB_PORT\" -u \"$SUPER_USER_NAME\" --password=\"<hidden>\" -e \"CREATE DATABASE \`$DB_NAME\`;\""
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
  echo "Executing: mysql -h \"$DB_HOST\" -P \"$DB_PORT\" -u \"$SUPER_USER_NAME\" --password=\"<hidden>\" -e \"CREATE USER '${TARGET_USER_NAME}'@'${TARGET_USER_HOST}' IDENTIFIED BY '${TARGET_USER_PASSWORD}';\""
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
  echo "Executing: mysql -h \"$DB_HOST\" -P \"$DB_PORT\" -u \"$SUPER_USER_NAME\" --password=\"<hidden>\" -e \"GRANT SELECT, INSERT, UPDATE, DELETE, CREATE TEMPORARY TABLES, LOCK TABLES, EXECUTE ON \`${DB_NAME}\`.* TO '${TARGET_USER_NAME}'@'${TARGET_USER_HOST}'; FLUSH PRIVILEGES;\""
  if ! mysql -h "$DB_HOST" -P "$DB_PORT" -u "$SUPER_USER_NAME" --password="$SUPER_USER_PASSWORD" -e "GRANT SELECT, INSERT, UPDATE, DELETE, CREATE TEMPORARY TABLES, LOCK TABLES, EXECUTE ON \`${DB_NAME}\`.* TO '${TARGET_USER_NAME}'@'${TARGET_USER_HOST}'; FLUSH PRIVILEGES;"; then
    echo "Error: Failed to grant privileges to new user."
    exit 1
  fi
else
  echo "Skipping privilege grant: user already exists."
fi

# Determine overall result
CREATED_FLAG=$([[ "$NEW_DATABASE_CREATED" -eq 1 ]] && echo 1 || echo 0)

echo "--------------------------------------------------"
echo "Database and user setup complete."
echo "New database created: $NEW_DATABASE_CREATED"
echo "New user created: $NEW_USER_CREATED"
echo "Passing flag $CREATED_FLAG to migration script..."
echo "--------------------------------------------------"

# Run the Python migration script with the flag
ve/bin/python manage.py base_specify_migration --database=migrations "$CREATED_FLAG"
