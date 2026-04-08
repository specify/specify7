# DwC Export API Documentation

## Endpoints

### Schema Mappings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/export/list_mappings/` | List all schema mappings |
| POST | `/export/create_mapping/` | Create a new mapping |
| PUT | `/export/update_mapping/<id>/` | Update a mapping |
| DELETE | `/export/delete_mapping/<id>/` | Delete a mapping (fails if referenced by packages) |
| POST | `/export/clone_mapping/<id>/` | Clone a mapping |
| POST | `/export/save_mapping_fields/<id>/` | Save DwC term assignments |

### Export Packages

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/export/list_export_datasets/` | List all export packages |
| POST | `/export/create_dataset/` | Create a new package |
| PUT | `/export/update_dataset/<id>/` | Update a package |
| DELETE | `/export/delete_dataset/<id>/` | Delete a package |
| POST | `/export/clone_dataset/<id>/` | Clone a package |
| POST | `/export/generate_dwca/<id>/` | Generate and download DwCA ZIP |

### RSS Feed

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/export/rss/` | RSS feed of published exports |
| POST | `/export/force_update/` | Rebuild legacy RSS feed |
| POST | `/export/force_update_packages/` | Rebuild all RSS-enabled export packages |

### Vocabulary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/export/schema_terms/` | Get DwC vocabulary terms |

## Scripted/Cron Usage

To automate DwC archive generation on a schedule, call the export API:

```bash
# Generate a DwCA for a specific export package
curl -X POST \
  -b cookies.txt \
  -H "X-CSRFToken: TOKEN" \
  -o output.zip \
  http://localhost:8001/export/generate_dwca/PACKAGE_ID/

# Rebuild all RSS-enabled packages
curl -X POST \
  -b cookies.txt \
  -H "X-CSRFToken: TOKEN" \
  http://localhost:8001/export/force_update_packages/
```

### Authentication

All endpoints require an authenticated session. For scripted access:

1. POST to `/accounts/login/` with username/password
2. Extract `csrftoken` and `sessionid` cookies
3. Include both cookies and `X-CSRFToken` header in subsequent requests

### Example cron script

```bash
#!/bin/bash
# Export DwC archives nightly at 2 AM
# crontab: 0 2 * * * /path/to/export_dwca.sh

SPECIFY_URL="http://localhost:8001"
USERNAME="admin"
PASSWORD="password"
PACKAGE_ID=1

# Login
COOKIES=$(mktemp)
curl -s -c "$COOKIES" "$SPECIFY_URL/accounts/login/" > /dev/null
CSRF=$(grep csrftoken "$COOKIES" | awk '{print $NF}')
curl -s -c "$COOKIES" -b "$COOKIES" \
  -d "username=$USERNAME&password=$PASSWORD&csrfmiddlewaretoken=$CSRF" \
  -H "Referer: $SPECIFY_URL/accounts/login/" \
  "$SPECIFY_URL/accounts/login/" > /dev/null

# Generate archive
CSRF=$(grep csrftoken "$COOKIES" | awk '{print $NF}')
curl -s -b "$COOKIES" \
  -H "X-CSRFToken: $CSRF" \
  -X POST \
  -o "/path/to/exports/archive_$(date +%Y%m%d).zip" \
  "$SPECIFY_URL/export/generate_dwca/$PACKAGE_ID/"

rm "$COOKIES"
```

### Idempotency

`generate_dwca` is safe to call repeatedly. Each call regenerates from current data. `lastExported` is updated on success.

### Automatic RSS Scheduling

The management command `update_feed_v2` checks all Export Packages with `RSS = true` and rebuilds those whose `lastExported + frequency` has passed:

```bash
# Run manually
python manage.py update_feed_v2

# Add to system cron for automatic scheduling (e.g., check every hour)
0 * * * * cd /path/to/specify7 && python manage.py update_feed_v2

# Force update all RSS packages regardless of schedule
python manage.py update_feed_v2 --force
```

A `Frequency` of 0 or null means the package is manual-only (never auto-updated).

The "Update RSS Feed" button in the Export Packages UI triggers the same process via `POST /export/force_update_packages/`.
