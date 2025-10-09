#!/bin/bash

# This script sets up a master user for Specify 7 to use in MySQL/MariaDB using env vars from the Linux environment.

APP_USER_HOST='%'

echo "Starting MariaDB database and user creation script..."

# Read variables from environment
DB_HOST="${DATABASE_HOST}"
DB_PORT="${DATABASE_PORT}"
MASTER_USER_NAME="${MASTER_NAME:-$MASTER_USER_NAME}"
MASTER_USER_PASSWORD="${MASTER_PASSWORD:-$MASTER_USER_PASSWORD}"
MIGRATOR_NAME="${MIGRATOR_NAME}"
MIGRATOR_PASSWORD="${MIGRATOR_PASSWORD}"
MIGRATOR_USER_HOST="%"
DB_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD}"
DB_NAME="${DATABASE_NAME}"
APP_USER_NAME="${APP_USER_NAME}"
APP_USER_PASSWORD="${APP_USER_PASSWORD}"
APP_USER_HOST="%"

# Use fallback values if needed
MIGRATOR_PASSWORD=${MIGRATOR_PASSWORD:-$DB_ROOT_PASSWORD}

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
if [[ -z "$DB_HOST" || -z "$DB_PORT" || -z "$MIGRATOR_PASSWORD" || -z "$DB_NAME" || -z "$APP_USER_NAME" || -z "$APP_USER_PASSWORD" ]]; then
  echo "Error: One or more required environment variables are missing or empty."
  exit 1
fi

echo "Read configuration:"
echo "  DB Host: $DB_HOST"
echo "  DB Port: $DB_PORT"
echo "  DB Name: $DB_NAME"
echo "  Master User: $MASTER_USER_NAME"
echo "  Migrator User: $MIGRATOR_NAME"
echo "  App User: $APP_USER_NAME"

NEW_DATABASE_CREATED=0
NEW_MIGRATOR_USER_CREATED=0
NEW_APP_USER_CREATED=0

# Wait for MariaDB to be up and running
echo "Checking if MariaDB instance is up and running..."
until (exec 3<>/dev/tcp/"$DB_HOST"/"$DB_PORT") 2>/dev/null; do
  echo "MariaDB is not available yet. Retrying in 5 seconds..."
  sleep 5
done
echo "MariaDB is up and running."

# Check that the root login works
if ! mysql -h "$DB_HOST" -P "$DB_PORT" -u "$MASTER_USER_NAME" --password="$MASTER_USER_PASSWORD" -e "SELECT 1;" &> /dev/null; then
  echo "Error: Unable to connect to MariaDB with provided master user credentials."
  exit 1
fi

# Create database if it doesn't exist
DB_EXISTS=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$MASTER_USER_NAME" --password="$MASTER_USER_PASSWORD" -sse "SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = '$DB_NAME';")
if [[ "$DB_EXISTS" -eq 0 ]]; then
  echo "Creating database '$DB_NAME'..."
  echo "Executing: mysql -h \"$DB_HOST\" -P \"$DB_PORT\" -u \"$MASTER_USER_NAME\" --password=\"<hidden>\" -e \"CREATE DATABASE \`$DB_NAME\`;\""
  if mysql -h "$DB_HOST" -P "$DB_PORT" -u "$MASTER_USER_NAME" --password="$MASTER_USER_PASSWORD" -e "CREATE DATABASE \`$DB_NAME\`;"; then
    NEW_DATABASE_CREATED=1
  else
    echo "Error: Failed to create database."
    exit 1
  fi
else
  echo "Database '$DB_NAME' already exists."
fi

# Create migrator user if it doesn't exist
USER_EXISTS=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$MASTER_USER_NAME" --password="$MASTER_USER_PASSWORD" -sse "SELECT COUNT(*) FROM mysql.user WHERE user = '$MIGRATOR_NAME' AND host = '$MIGRATOR_USER_HOST';")
if [[ "$USER_EXISTS" -eq 0 && "$APP_USER_NAME" != "root" ]]; then
  echo "Creating user '$MIGRATOR_NAME'..."
  echo "Executing: mysql -h \"$DB_HOST\" -P \"$DB_PORT\" -u \"$MASTER_USER_NAME\" --password=\"<hidden>\" -e \"CREATE USER '${MIGRATOR_NAME}'@'${MIGRATOR_USER_HOST}' IDENTIFIED BY '<hidden>';\""
  if mysql -h "$DB_HOST" -P "$DB_PORT" -u "$MASTER_USER_NAME" --password="$MASTER_USER_PASSWORD" -e "CREATE USER '${MIGRATOR_NAME}'@'${MIGRATOR_USER_HOST}' IDENTIFIED BY '<hidden>';"; then
    NEW_MIGRATOR_USER_CREATED=1
  else
    echo "Error: Failed to create user."
    exit 1
  fi
else
  echo "User '$MIGRATOR_NAME' already exists."
fi

# Grant privileges only if a migrator new user was created
if [[ "$NEW_MIGRATOR_USER_CREATED" -eq 1 ]]; then
  echo "Granting privileges to new user..."
  echo "Executing: mysql -h \"$DB_HOST\" -P \"$DB_PORT\" -u \"$MASTER_USER_NAME\" --password=\"<hidden>\" -e \"GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${MIGRATOR_NAME}'@'${MIGRATOR_USER_HOST}'; FLUSH PRIVILEGES;\""
  if ! mysql -h "$DB_HOST" -P "$DB_PORT" -u "$MASTER_USER_NAME" --password="$MASTER_USER_PASSWORD" -e "GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${MIGRATOR_NAME}'@'${MIGRATOR_USER_HOST}'; FLUSH PRIVILEGES;"; then
    echo "Error: Failed to grant privileges to new user."
    exit 1
  fi
else
  echo "Skipping privilege grant: user already exists."
fi

# Create app user if it doesn't exist
USER_EXISTS=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$MASTER_USER_NAME" --password="$MASTER_USER_PASSWORD" -sse "SELECT COUNT(*) FROM mysql.user WHERE user = '$APP_USER_NAME' AND host = '$APP_USER_HOST';")
if [[ "$USER_EXISTS" -eq 0 && "$APP_USER_NAME" != "root" ]]; then
  echo "Creating user '$APP_USER_NAME'..."
  echo "Executing: mysql -h \"$DB_HOST\" -P \"$DB_PORT\" -u \"$MASTER_USER_NAME\" --password=\"<hidden>\" -e \"CREATE USER '${APP_USER_NAME}'@'${APP_USER_HOST}' IDENTIFIED BY '<hidden>';\""
  if mysql -h "$DB_HOST" -P "$DB_PORT" -u "$MASTER_USER_NAME" --password="$MASTER_USER_PASSWORD" -e "CREATE USER '${APP_USER_NAME}'@'${APP_USER_HOST}' IDENTIFIED BY '<hidden>';"; then
    NEW_APP_USER_CREATED=1
  else
    echo "Error: Failed to create user."
    exit 1
  fi
else
  echo "User '$APP_USER_NAME' already exists."
fi

# Grant privileges only if a new app user was created
if [[ "$NEW_APP_USER_CREATED" -eq 1 ]]; then
  echo "Granting privileges to new user..."
  echo "Executing: mysql -h \"$DB_HOST\" -P \"$DB_PORT\" -u \"$MASTER_USER_NAME\" --password=\"<hidden>\" -e \"GRANT SELECT, INSERT, UPDATE, DELETE, CREATE TEMPORARY TABLES, LOCK TABLES, EXECUTE ON \`${DB_NAME}\`.* TO '${APP_USER_NAME}'@'${APP_USER_HOST}'; FLUSH PRIVILEGES;\""
  if ! mysql -h "$DB_HOST" -P "$DB_PORT" -u "$MASTER_USER_NAME" --password="$MASTER_USER_PASSWORD" -e "GRANT SELECT, INSERT, UPDATE, ALTER, INDEX, DELETE, CREATE TEMPORARY TABLES, LOCK TABLES, EXECUTE ON \`${DB_NAME}\`.* TO '${APP_USER_NAME}'@'${APP_USER_HOST}'; FLUSH PRIVILEGES;"; then
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
echo "New migrator user created: $NEW_MIGRATOR_USER_CREATED"
echo "New app user created: $NEW_APP_USER_CREATED"
echo "Passing flag $CREATED_FLAG to migration script..."
echo "--------------------------------------------------"

# Run the Python migration script with the flag
ve/bin/python manage.py base_specify_migration --database=migrations "$CREATED_FLAG"
