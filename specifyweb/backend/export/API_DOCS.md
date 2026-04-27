# DwC Export API

All endpoints are under `/export/`.

## GET /export/schema_terms/

Return the DwC schema terms vocabulary as JSON.

```bash
curl -b cookies.txt https://specify.example.org/export/schema_terms/
```

## GET /export/list_mappings/

List all schema mappings. Requires `schema_mapping.read` permission.

```bash
curl -b cookies.txt https://specify.example.org/export/list_mappings/
```

Response:
```json
[
  {
    "id": 1,
    "name": "Occurrence Core",
    "mappingType": "Core",
    "isDefault": true,
    "queryId": 42
  }
]
```

## GET /export/list_export_datasets/

List all export packages (datasets). Requires `export_package.read` permission.

```bash
curl -b cookies.txt https://specify.example.org/export/list_export_datasets/
```

Response:
```json
[
  {
    "id": 1,
    "exportName": "CAS Ichthyology",
    "fileName": "cas_ich.zip",
    "isRss": true,
    "frequency": 7,
    "coreMappingId": 1,
    "collectionId": 4,
    "lastExported": "2026-03-20T10:00:00+00:00"
  }
]
```

## POST /export/clone_mapping/{id}/

Deep-copy a schema mapping and its underlying query. Requires `schema_mapping.create` permission.

```bash
curl -X POST -b cookies.txt https://specify.example.org/export/clone_mapping/1/
```

Response:
```json
{
  "id": 2,
  "name": "Copy of Occurrence Core",
  "mappingType": "Core",
  "isDefault": false,
  "queryId": 43
}
```

## POST /export/build_cache/{id}/

Build or rebuild cache tables for an export dataset. Requires `export_package.execute` permission.

```bash
curl -X POST -b cookies.txt https://specify.example.org/export/build_cache/1/
```

Success response:
```json
{
  "status": "ok",
  "datasetId": 1,
  "exportName": "CAS Ichthyology"
}
```

Error response (400):
```json
{
  "error": "Error description"
}
```

## POST /export/make_dwca/

Generate a DwCA export from a legacy definition app resource. Requires `dwca.execute` permission. Runs asynchronously; a notification is sent on completion.

```bash
curl -X POST -b cookies.txt \
  -d "definition=DwCADefinition" \
  -d "metadata=EmlMetadata" \
  https://specify.example.org/export/make_dwca/
```

## POST /export/force_update/

Force-update all export feed items (both legacy and v2 datasets). Requires `feed.force_update` permission. Runs asynchronously.

```bash
curl -X POST -b cookies.txt https://specify.example.org/export/force_update/
```

## GET /export/rss/

RSS feed of all published DwC-A exports. Includes items from both the legacy ExportFeed app resource and ExportDataSet records where `isRss=True`.

```bash
curl https://specify.example.org/export/rss/
```

Returns XML in RSS 2.0 format with `ipt:eml` extensions for GBIF compatibility.

## GET /export/extract_eml/{filename}

Extract EML metadata from a hosted DwCA zip file.

```bash
curl https://specify.example.org/export/extract_eml/cas_ich.zip
```

## GET /export/extract_query/{id}/

Return an XML snippet for creating a DwCA definition from a saved query.

```bash
curl -b cookies.txt https://specify.example.org/export/extract_query/42/
```

## Management Commands

### update_feed_v2

Update all RSS-enabled ExportDataSet records that are due for refresh.

```bash
python manage.py update_feed_v2
python manage.py update_feed_v2 --force
```
