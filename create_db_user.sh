#!/bin/bash

# Assuming MySQL/MariaDB database is already setup and has root user.
# This script setups a master user for Specify 7 to use.

ENV_FILE=".env"
TARGET_USER_HOST='%'

echo "Starting MariaDB master user creation script..."

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

# Read necessary variables from .env
DB_HOST=$(get_env_var "DATABASE_HOST" "$ENV_FILE")
DB_PORT=$(get_env_var "DATABASE_PORT" "$ENV_FILE")
DB_ROOT_PASSWORD=$(get_env_var "MYSQL_ROOT_PASSWORD" "$ENV_FILE")
DB_NAME=$(get_env_var "DATABASE_NAME" "$ENV_FILE")
TARGET_USER_NAME=$(get_env_var "MASTER_NAME" "$ENV_FILE")
TARGET_USER_PASSWORD=$(get_env_var "MASTER_PASSWORD" "$ENV_FILE")

# Validate required variables
if [[ -z "$DB_HOST" || -z "$DB_PORT" || -z "$DB_ROOT_PASSWORD" || -z "$DB_NAME" || -z "$TARGET_USER_NAME" || -z "$TARGET_USER_PASSWORD" ]]; then
  echo "Error: One or more required variables are missing or empty in '$ENV_FILE'."
  echo "Required: DATABASE_HOST, DATABASE_PORT, MYSQL_ROOT_PASSWORD, DATABASE_NAME, MASTER_NAME, MASTER_PASSWORD"
  exit 1
fi

# Prevent accidentally using 'root' as the target user name for this script's purpose
if [[ "$TARGET_USER_NAME" == "root" ]]; then
   echo "Error: MASTER_NAME is set to 'root'. This script is intended to create a *new*, non-root user."
   echo "Please update MASTER_NAME and MASTER_PASSWORD in '$ENV_FILE' to the desired credentials for the new application user."
   exit 1
fi

echo "Read configuration:"
echo "  DB Host: $DB_HOST"
echo "  DB Port: $DB_PORT"
echo "  DB Name: $DB_NAME"
echo "  Target User: $TARGET_USER_NAME"
echo "  Target User Host: $TARGET_USER_HOST"

# User creation SQL commands
SQL_COMMAND=$(cat <<-EOF
CREATE USER IF NOT EXISTS '${TARGET_USER_NAME}'@'${TARGET_USER_HOST}' IDENTIFIED BY '${TARGET_USER_PASSWORD}';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE TEMPORARY TABLES, LOCK TABLES, EXECUTE ON \`${DB_NAME}\`.* TO '${TARGET_USER_NAME}'@'${TARGET_USER_HOST}';
FLUSH PRIVILEGES;
EOF
)

# Execute SQL using the mysql client
# Connect using the ROOT credentials to create the new user
if mysql -h "$DB_HOST" -P "$DB_PORT" -u root --password="$DB_ROOT_PASSWORD" <<< "$SQL_COMMAND"; then
  echo "--------------------------------------------------"
  echo "Success!"
  echo "MariaDB user '$TARGET_USER_NAME'@'$TARGET_USER_HOST' created (or already existed)."
  echo "Granted necessary operational privileges on database '$DB_NAME'."
  echo "--------------------------------------------------"
  echo "IMPORTANT: Ensure your application uses the following credentials now:"
  echo "  User: $TARGET_USER_NAME"
  echo "  Password: $TARGET_USER_PASSWORD"
  echo "  Database: $DB_NAME"
  echo "You might need to update MASTER_NAME and MASTER_PASSWORD in your .env file"
  echo "if they were previously set to root credentials for migrations."
  echo "--------------------------------------------------"
  exit 0
else
  echo "--------------------------------------------------"
  echo "Error: Failed to execute MariaDB commands."
  echo "Please check:"
  echo "  - MariaDB server ($DB_HOST:$DB_PORT) is running and accessible."
  echo "  - Root credentials (user 'root', password in MYSQL_ROOT_PASSWORD) are correct."
  echo "  - The database '$DB_NAME' exists."
  echo "  - Network connectivity and firewalls."
  echo "--------------------------------------------------"
  exit 1
fi
