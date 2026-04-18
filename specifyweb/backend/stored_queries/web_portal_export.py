import csv
import json
import logging
import os
import re
import uuid
from collections import defaultdict
from io import StringIO
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
_ASSET_STORE_FILENAME = 'web_asset_store.xml'


def _build_portal_collection_name(collection) -> str:
    return (
        os.getenv('WEB_ATTACHMENT_COLLECTION')
        or settings.WEB_ATTACHMENT_COLLECTION
        or collection.collectionname
    )


def _strip_asset_store_xml(url: str) -> str:
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
        os.path.basename(attachment.origfilename or attachment.attachmentlocation or '')
    )
    return (
        '{'
        f'AttachmentID:{attachment.id},'
        f'AttachmentLocation:"{attachment_location}",'
        f'Title:"{title}"'
        '}'
    )


def _portal_attachment_map(tableid: int, record_ids: list[Any]) -> dict[Any, str]:
    if not record_ids:
        return {}

    table = datamodel.get_table_by_id(tableid, strict=True)
    if table.attachments_field is None:
        return {}

    base_model = get_model_by_table_id(tableid)
    join_model_name = base_model.__name__ + 'attachment'
    join_model = apps.get_model(base_model._meta.app_label, join_model_name)
    record_id_field = f'{base_model.__name__.lower()}_id'

    join_records = join_model.objects.filter(**{f'{record_id_field}__in': record_ids}).select_related('attachment')
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


def _portal_solr_type(query_field, collection, user) -> str:
    fieldspec = query_field.fieldspec
    field = fieldspec.get_field()

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


def _serialize_portal_data(
    rows: list[list[str]],
    header: list[str],
) -> str:
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(header)
    writer.writerows(rows)
    return output.getvalue()


def _find_geoc_field_indexes(
    column_defs: list[tuple[str, str, str, dict[str, Any]]],
) -> tuple[int | None, int | None, int | None, int | None]:
    lat1_idx = None
    lon1_idx = None
    lat2_idx = None
    lon2_idx = None

    for index, (_, __, ___, metadata) in enumerate(column_defs):
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
    effective_captions = captions if captions else [
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
        zip(display_fields, effective_captions, strict=False),
        start=0,
    ):
        trimmed_caption = str(caption).strip()
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

    metadata_rows: list[dict[str, Any]] = [
        {'colname': 'spid', 'solrname': 'spid', 'solrtype': 'int'},
        *[
            _simplify_portal_field_metadata(column_def[3])
            for column_def in column_defs
        ],
        {'colname': 'img', 'solrname': 'img', 'solrtype': 'string', 'title': 'image'},
    ]

    output_rows: list[list[str]] = []
    geoc_lat1_idx, geoc_lon1_idx, geoc_lat2_idx, geoc_lon2_idx = _find_geoc_field_indexes(column_defs)
    data_rows = query if isinstance(query, list) else list(query.yield_per(1))
    portal_attachments = _portal_attachment_map(tableid, [row[0] for row in data_rows])
    for row in data_rows:
        raw_id = row[0] if len(row) > 0 else ''
        spid = str(uuid.uuid5(uuid.NAMESPACE_URL, f'{tableid}:{raw_id}'))
        display_values = row[1:] if len(row) > 1 else []
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
    flds_json = json.dumps(metadata_rows, indent=2)
    solr_schema = _make_solr_schema_xml(metadata_rows)

    image_info_fields = [column_def[1] for column_def in column_defs[:2]]
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
