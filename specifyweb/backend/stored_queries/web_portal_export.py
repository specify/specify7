import csv
import json
import logging
import os
import re
import uuid
from collections import defaultdict
from io import StringIO
from itertools import zip_longest
from typing import Any, Callable
from urllib.parse import urlsplit, urlunsplit
from xml.sax.saxutils import escape
from zipfile import ZIP_DEFLATED, ZipFile

from django.apps import apps
from django.conf import settings

from specifyweb.backend.context.schema_localization import get_schema_localization
from specifyweb.specify.datamodel import datamodel
from specifyweb.specify.models_utils.models_by_table_id import get_model_by_table_id
from specifyweb.specify.utils.uiformatters import CNNField, get_catalognumber_format


logger = logging.getLogger(__name__)
# Filename used by asset server URLs that should be stripped from portal asset paths.
_ASSET_STORE_FILENAME = 'web_asset_store.xml'


def _build_portal_collection_name(collection) -> str:
    """Return the portal collection name override if configured.

    The export uses either the env var, settings value, or the actual
    collection name.
    """

    return (
        os.getenv('WEB_ATTACHMENT_COLLECTION')
        or settings.WEB_ATTACHMENT_COLLECTION
        or collection.collectionname
    )


def _strip_asset_store_xml(url: str) -> str:
    """Remove the asset store file path from attachment URLs.

    The portal export should expose a clean base asset path, not the
    internal web asset store XML filename itself. 
    """
    if not url:
        return ''

    parsed = urlsplit(url)
    path = parsed.path or ''
    trimmed_path = path.rstrip('/')
    path_parts = trimmed_path.split('/') if trimmed_path else []

    if not path_parts or path_parts[-1].lower() != _ASSET_STORE_FILENAME:
        return url

    base_path = '/'.join(path_parts[:-1]).rstrip('/')
    return urlunsplit((parsed.scheme, parsed.netloc, base_path, parsed.query, parsed.fragment))


def _build_portal_image_base_url() -> str:
    """Build the base URL that portal image attachments should use."""

    raw_url = (os.getenv('ASSET_SERVER_URL') or settings.WEB_ATTACHMENT_URL or '').strip()
    return _strip_asset_store_xml(raw_url)


def _schema_localization_or_empty(collection) -> dict[str, Any]:
    try:
        return get_schema_localization(collection, 0, 'en-us')
    except Exception:
        logger.exception('Failed loading schema localization for web portal export')
        return {}


def _clean_cell(value: Any) -> str:
    return re.sub("\r|\n", " ", str(value if value is not None else ''))


def _clean_portal_attachment_text(value: Any) -> str:
    return re.sub(r'\r|\n|"', ' ', str(value if value is not None else '')).strip()


def _portal_attachment_entry(attachment) -> str:
    attachment_location = _clean_portal_attachment_text(attachment.attachmentlocation)
    title = _clean_portal_attachment_text(
        os.path.basename(
            attachment.title or attachment.origfilename or attachment.attachmentlocation or ''
        )
    )
    return (
        '{'
        f'AttachmentID:{attachment.id},'
        f'AttachmentLocation:"{attachment_location}",'
        f'Title:"{title}"'
        '}'
    )


def _portal_attachment_map(tableid: int, record_ids: list[Any]) -> dict[Any, str]:
    """Collect attachment metadata for portal rows by record id.

    The portal CSV stores image attachments as JSON strings in the "img"
    column, so we prebuild mapping from record IDs to attachments.
    """
    if not record_ids:
        return {}

    table = datamodel.get_table_by_id(tableid, strict=True)
    if table.attachments_field is None:
        return {}

    base_model = get_model_by_table_id(tableid)
    join_model_name = base_model.__name__ + 'attachment'
    join_model = apps.get_model(base_model._meta.app_label, join_model_name)
    record_id_field = f'{base_model.__name__.lower()}_id'

    join_records = join_model.objects.filter(
        **{
            f'{record_id_field}__in': record_ids,
            'attachment__ispublic': True,
        }
    ).select_related('attachment')
    attachment_entries_by_record_id: dict[str, list[str]] = defaultdict(list)

    for join_record in join_records:
        attachment = join_record.attachment
        if attachment.attachmentlocation is None:
            continue
        record_key = str(getattr(join_record, record_id_field))
        attachment_entries_by_record_id[record_key].append(_portal_attachment_entry(attachment))

    return {
        record_id: '[' + ', '.join(entries) + ']'
        for record_id, entries in attachment_entries_by_record_id.items()
    }


def _dedupe_name(name: str, used_names: set[str]) -> str:
    candidate = name
    suffix = 2
    while candidate in used_names:
        candidate = f"{name}_{suffix}"
        suffix += 1
    used_names.add(candidate)
    return candidate


def _normalize_portal_column_name(name: Any, query_field=None) -> str:
    """Normalize portal column captions for export.

    Removes names and full name field labels which are not useful
    in the portal.
    """
    normalized = str(name if name is not None else '').strip()

    if query_field is not None:
        fieldspec = query_field.fieldspec
        field = fieldspec.get_field()
        if (
            fieldspec.tree_rank is not None
            and field is not None
            and field.name in {'name', 'fullName'}
            and ' - ' in normalized
        ):
            return normalized.rsplit(' - ', 1)[0].rstrip()

    return normalized


def _portal_solr_type(query_field, collection, user) -> str:
    """Map a query field to the Solr field type used in portal metadata."""
    fieldspec = query_field.fieldspec
    field = fieldspec.get_field()

    # Relationship fields are always emitted as strings for portal search.
    if field is None or field.is_relationship:
        return 'string'

    if fieldspec.table.name == 'CollectionObject' and field.name == 'catalogNumber':
        formatter = get_catalognumber_format(collection, query_field.format_name, user)
        if (
            formatter is not None
            and len(formatter.fields) == 1
            and isinstance(formatter.fields[0], CNNField)
        ):
            return 'pint'
        return 'string'

    if field.type in ('java.lang.String', 'text'):
        return 'string'
    if field.type in ('java.util.Date', 'java.sql.Timestamp'):
        return 'string'
    if field.type == 'java.util.Calendar':
        return 'pint' if fieldspec.date_part in {'Day', 'Month', 'Year'} else 'string'
    if field.type in ('java.lang.Integer', 'java.lang.Byte', 'java.lang.Short'):
        return 'pint'
    if field.type == 'java.lang.Long':
        return 'plong'
    if field.type == 'java.lang.Float':
        return 'pfloat'
    if field.type in ('java.lang.Double', 'java.math.BigDecimal'):
        return 'pdouble'
    if field.type == 'java.lang.Boolean':
        return 'string'
    return 'string'


def _portal_field_metadata(
    query_field,
    caption: str,
    colname: str,
    index: int,
    schema_localization: dict[str, Any],
    collection,
    user,
) -> dict[str, Any]:
    """Build the metadata row for one exported portal field.

    This metadata is written to flds.json and is consumed by the portal
    frontend to build field definitions, sorting, display labels, and linkification.
    """
    fieldspec = query_field.fieldspec
    table = fieldspec.table
    field = fieldspec.get_field()

    table_key = table.name.lower()
    table_localization = schema_localization.get(table_key, {})
    item_localization = (
        table_localization.get('items', {}).get(field.name.lower(), {})
        if field is not None
        else {}
    )

    spfld = field.name if field is not None else table.idFieldName
    if field is not None and field.is_relationship:
        field_type = 'java.lang.String'
    else:
        field_type = field.type if field is not None else 'java.lang.String'
    field_length = field.length if field is not None and field.length is not None else 255
    solr_type = _portal_solr_type(query_field, collection, user)
    is_linkified = solr_type == 'string' and field_type in ('java.lang.String', 'text')

    return {
        'colname': colname,
        'solrname': spfld,
        'solrtype': solr_type,
        'title': caption,
        'type': field_type,
        'width': field_length,
        'concept': colname,
        'concepturl': 'http://rs.tdwg.org/dwc/terms/',
        'sptable': table_key,
        'sptabletitle': table_localization.get('name', table.name),
        'spfld': spfld,
        'spfldtitle': item_localization.get('name', spfld),
        'spdescription': item_localization.get('desc', spfld),
        'colidx': index,
        'linkify': is_linkified,
        'advancedsearch': True,
        'displaycolidx': index,
    }


def _simplify_portal_field_metadata(field_meta: dict[str, Any]) -> dict[str, Any]:
    """Create the metadata for portal fields."""
    simplified = {
        'colname': field_meta['colname'],
        'solrname': field_meta['solrname'],
        'solrtype': field_meta['solrtype'],
    }

    for key in (
        'title',
        'type',
        'width',
        'concept',
        'sptable',
        'sptabletitle',
        'spfld',
        'spfldtitle',
        'colidx',
        'linkify',
        'advancedsearch',
        'displaycolidx',
        'treeid',
        'treerank',
    ):
        if key in field_meta:
            simplified[key] = field_meta[key]

    return simplified


def _make_solr_schema_xml(fields: list[dict[str, Any]]) -> str:
    """Create a minimal Solr schema for exported portal fields.

    It defines the fields that the portal will index and search.
    """
    lines = [
        '<!-- solr field definitions for SpecifyWebportal1 web portal -->',
        '<!-- Paste the contents of this file into the solr/conf/schema.xml file. -->',
    ]

    lines.append(
        '<field name="contents" type="text_general" indexed="true" stored="false" required="true"/>'
    )
    lines.append(
        '<field name="geoc" type="string" indexed="true" stored="true" required="false"/>'
    )
    lines.append(
        '<field name="img" type="string" indexed="true" stored="true" required="false"/>'
    )

    emitted: set[str] = {'contents', 'geoc', 'img'}
    for field in fields:
        name = str(field['solrname'])
        if name in emitted:
            continue
        emitted.add(name)

        escaped_name = escape(name)
        solr_type = 'string' if name == 'spid' else escape(str(field['solrtype']))
        required = 'true' if name == 'spid' else 'false'
        lines.append(
            f'<field name="{escaped_name}" type="{solr_type}" indexed="true" stored="true" required="{required}"/>'
        )
    return "\n".join(lines) + "\n"


def _image_info_fields_from_column_defs(
    column_defs: list[tuple[str, str, str, dict[str, Any]]],
) -> list[str]:
    """Grab the best image info fields."""
    image_info_fields: list[str] = []
    target_spflds = {
        'catalognumber',
        'fieldnumber',
        'stationfieldnumber',
    }
    for _, solrname, _, metadata in column_defs:
        if str(metadata.get('spfld', '')).lower() in target_spflds:
            image_info_fields.append(solrname)
    return image_info_fields


def _serialize_portal_data(
    rows: list[list[str]],
    header: list[str],
) -> str:
    """Output rows to CSV.

    The web portal expects a standard CSV file with a header row followed by
    one row per portal record.
    """
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(header)
    writer.writerows(rows)
    return output.getvalue()


def _find_geoc_field_indexes(
    column_defs: list[tuple[str, str, str, dict[str, Any]]],
) -> tuple[int | None, int | None, int | None, int | None]:
    """Locate latitude/longitude columns for geocoding the portal row."""
    lat1_idx = None
    lon1_idx = None
    lat2_idx = None
    lon2_idx = None

    for index, (_, __, ___, metadata) in enumerate(column_defs):
        # Only locality fields are relevant for geocoding.
        if str(metadata.get('sptable', '')).lower() != 'locality':
            continue

        spfld = str(metadata.get('spfld', '')).lower()
        if spfld == 'latitude1' and lat1_idx is None:
            lat1_idx = index
        elif spfld == 'longitude1' and lon1_idx is None:
            lon1_idx = index
        elif spfld == 'latitude2' and lat2_idx is None:
            lat2_idx = index
        elif spfld == 'longitude2' and lon2_idx is None:
            lon2_idx = index

    return lat1_idx, lon1_idx, lat2_idx, lon2_idx


def _build_geoc_value(
    cleaned_values: list[str],
    lat1_idx: int | None,
    lon1_idx: int | None,
    lat2_idx: int | None,
    lon2_idx: int | None,
) -> str:
    """Build the 'geoc' column value for portal mapping.

    The portal uses the first valid latitude/longitude pair it finds.
    """
    def _pair_value(lat_idx: int | None, lon_idx: int | None) -> str:
        if lat_idx is None or lon_idx is None:
            return ''
        if lat_idx >= len(cleaned_values) or lon_idx >= len(cleaned_values):
            return ''

        latitude = cleaned_values[lat_idx].strip()
        longitude = cleaned_values[lon_idx].strip()
        if not latitude or not longitude:
            return ''
        return f'{latitude} {longitude}'

    primary = _pair_value(lat1_idx, lon1_idx)
    if primary:
        return primary
    return _pair_value(lat2_idx, lon2_idx)


def query_to_web_portal_zip(
    session,
    collection,
    user,
    tableid,
    field_specs,
    path,
    captions,
    build_query_fn: Callable[..., tuple[Any, Any]],
    build_query_props_cls,
    apply_special_post_query_processing_fn: Callable[..., Any],
    set_group_concat_max_len_fn: Callable[[Any], None],
    recordsetid=None,
    distinct=False,
):
    """Export a stored query as a web portal ZIP package.

    This writes PortalData.csv, flds.json, PortalInstanceSetting.json, and
    SolrFldSchema.xml into the destination ZIP file.
    """
    set_group_concat_max_len_fn(session.connection())
    query, __ = build_query_fn(
        session,
        collection,
        user,
        tableid,
        field_specs,
        build_query_props_cls(recordsetid=recordsetid, replace_nulls=True, distinct=distinct),
    )
    query = apply_special_post_query_processing_fn(
        query,
        tableid,
        field_specs,
        collection,
        user,
        should_list_query=False,
    )

    display_fields = [field_spec for field_spec in field_specs if field_spec.display]

    # Match the exported captions to the actual displayed fields. Captions may
    # be provided for all query fields, but only display fields are exported.
    if captions and isinstance(captions, list):
        if len(captions) == len(display_fields):
            effective_captions = captions
        elif len(captions) == len(field_specs):
            effective_captions = [
                caption
                for field_spec, caption in zip(field_specs, captions)
                if field_spec.display
            ]
        else:
            effective_captions = captions[: len(display_fields)]
    else:
        effective_captions = []

    if len(effective_captions) != len(display_fields):
        effective_captions = [
            (
                field_spec.fieldspec.get_field().name
                if field_spec.fieldspec.get_field() is not None
                else field_spec.fieldspec.table.name
            )
            for field_spec in display_fields
        ]

    schema_localization = _schema_localization_or_empty(collection)

    used_colnames: set[str] = {'spid'}
    used_solrnames: set[str] = {'spid'}
    column_defs: list[tuple[str, str, str, dict[str, Any]]] = []
    for index, (field_spec, caption) in enumerate(
        zip_longest(display_fields, effective_captions, fillvalue=''),
        start=0,
    ):
        trimmed_caption = _normalize_portal_column_name(caption, field_spec)
        base_name = trimmed_caption if trimmed_caption else f'column_{index + 1}'
        colname = _dedupe_name(base_name, used_colnames)

        field = field_spec.fieldspec.get_field()
        if field is not None:
            base_solrname = field.name
            table_prefix = field_spec.fieldspec.table.name.lower()
        else:
            base_solrname = field_spec.fieldspec.table.idFieldName
            table_prefix = field_spec.fieldspec.table.name.lower()

        if base_solrname in used_solrnames:
            solrname = _dedupe_name(f'{table_prefix}_{base_solrname}', used_solrnames)
        else:
            solrname = _dedupe_name(base_solrname, used_solrnames)

        metadata = _portal_field_metadata(
            field_spec,
            trimmed_caption if trimmed_caption else colname,
            colname,
            index,
            schema_localization,
            collection,
            user,
        )
        metadata['solrname'] = solrname
        column_defs.append((colname, solrname, metadata['title'], metadata))

    # Build the JSON metadata rows used by the portal's field definition store.
    # The fixed fields spid and img are always included, plus one row per display field.
    metadata_rows: list[dict[str, Any]] = [
        {
            'colname': 'spid',
            'solrname': 'spid',
            'solrtype': 'int',
            'title': 'spid',
            'linkify': False,
            'colidx': 0,
            'displaycolidx': 0,
        },
        *[
            _simplify_portal_field_metadata(column_def[3])
            for column_def in column_defs
        ],
        {
            'colname': 'img',
            'solrname': 'img',
            'solrtype': 'string',
            'title': 'image',
        },
    ]

    output_rows: list[list[str]] = []
    geoc_lat1_idx, geoc_lon1_idx, geoc_lat2_idx, geoc_lon2_idx = _find_geoc_field_indexes(column_defs)
    data_rows = query if isinstance(query, list) else list(query.yield_per(1))
    portal_attachments = _portal_attachment_map(tableid, [row[0] for row in data_rows])
    # The portal frontend expects each row to have the same number of values as the field metadata.
    # If the query returns too few values, pad with empty strings; if it returns too many,
    # truncate extras so the CSV header and row data remain aligned.
    expected_values = len(column_defs)
    for row in data_rows:
        raw_id = row[0] if len(row) > 0 else ''
        spid = str(uuid.uuid5(uuid.NAMESPACE_URL, f'{tableid}:{raw_id}'))
        display_values = list(row[1:] if len(row) > 1 else [])
        if len(display_values) < expected_values:
            display_values.extend([''] * (expected_values - len(display_values)))
        elif len(display_values) > expected_values:
            display_values = display_values[:expected_values]
        cleaned_values = [_clean_cell(value) for value in display_values]
        contents = '\t'.join(cleaned_values)
        img = portal_attachments.get(str(raw_id), '')
        geoc = _build_geoc_value(
            cleaned_values,
            geoc_lat1_idx,
            geoc_lon1_idx,
            geoc_lat2_idx,
            geoc_lon2_idx,
        )
        output_rows.append([spid, contents, img, geoc, *cleaned_values])

    header = ['spid', 'contents', 'img', 'geoc', *[column_def[1] for column_def in column_defs]]
    portal_data = _serialize_portal_data(output_rows, header)
    # flds.json drives the portal's field definitions and display metadata.
    flds_json = json.dumps(metadata_rows, indent=2)
    # SolrFldSchema.xml is a minimal schema fragment for the portal's Solr index.
    solr_schema = _make_solr_schema_xml(metadata_rows)

    image_info_fields = _image_info_fields_from_column_defs(column_defs)
    portal_instance_settings = json.dumps(
        {
            'portalInstance': str(uuid.uuid4()),
            'collectionName': _build_portal_collection_name(collection),
            'imageBaseUrl': _build_portal_image_base_url(),
            'imageInfoFlds': ' '.join(image_info_fields),
        },
        indent=2,
    )

    with ZipFile(path, 'w', compression=ZIP_DEFLATED) as archive:
        archive.writestr('PortalFiles/PortalData.csv', portal_data)
        archive.writestr('PortalFiles/flds.json', flds_json)
        archive.writestr(
            'PortalFiles/PortalInstanceSetting.json',
            portal_instance_settings,
        )
        archive.writestr('PortalFiles/SolrFldSchema.xml', solr_schema)
