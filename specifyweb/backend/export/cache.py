from __future__ import annotations

from typing import Any


def _field_to_cache_entry(field) -> dict[str, Any]:
    return {
        'id': field.id,
        'exported_field_name': field.exportedfieldname,
        'extension_item': field.extensionitem,
        'remarks': field.remarks,
        'row_type': field.rowtype,
        'export_schema_item_id': field.exportschemaitem_id,
        'query_field_id': field.queryfield_id,
    }


def _build_single_cache(extension, fields=None) -> dict[str, Any]:
    if fields is None:
        fields = extension.mappings

    return {
        'id': extension.id,
        'mapping_name': extension.mappingname,
        'description': extension.description,
        'collection_member_id': extension.collectionmemberid,
        'timestamp_exported': extension.timestampexported,
        'fields': [
            _field_to_cache_entry(field)
            for field in fields.all().iterator(chunk_size=2000)
        ],
    }


def build_cache_tables(extensions) -> list[dict[str, Any]]:
    return [
        _build_single_cache(extension)
        for extension in extensions.all().iterator(chunk_size=2000)
    ]
