"""Generate Darwin Core Archives from pre-built cache tables."""
import csv
import io
import logging
import os
import re
import zipfile

from django.db import connection

from .cache import get_cache_table_name
from .dwca_utils import sanitize_term_name, sanitize_column_name, build_meta_xml, build_eml_xml

logger = logging.getLogger(__name__)


def make_dwca_from_dataset(export_dataset, output_dir=None):
    """Generate a DwCA zip file from an ExportDataSet and its cache tables.

    Returns the path to the generated zip file.
    """
    from django.conf import settings

    if output_dir is None:
        output_dir = os.path.join(settings.DEPOSITORY_DIR, 'export_feed')
    os.makedirs(output_dir, exist_ok=True)

    output_path = os.path.join(output_dir, export_dataset.filename)

    core_mapping = export_dataset.coremapping
    collection = export_dataset.collection
    core_table = get_cache_table_name(core_mapping.id, collection.id)

    extensions = []
    for ext in export_dataset.extensions.all().order_by('sortorder'):
        ext_table = get_cache_table_name(
            ext.schemamapping.id, collection.id,
            prefix=f'dwc_cache_ext{ext.sortorder}'
        )
        extensions.append({
            'mapping': ext.schemamapping,
            'table_name': ext_table,
            'sort_order': ext.sortorder,
        })

    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        core_fields = _get_mapping_fields(core_mapping)
        core_csv = _table_to_csv(core_table, core_fields)
        zf.writestr('occurrence.csv', core_csv)

        ext_filenames = []
        for ext_info in extensions:
            ext_fields = _get_mapping_fields(ext_info['mapping'])
            ext_csv = _table_to_csv(ext_info['table_name'], ext_fields)
            filename = f"extension_{ext_info['sort_order']}.csv"
            zf.writestr(filename, ext_csv)
            ext_filenames.append({
                'filename': filename,
                'terms': [f['term_iri'] for f in ext_fields],
            })

        core_term_iris = [f['term_iri'] for f in core_fields]
        meta_xml = build_meta_xml(core_term_iris, ext_filenames)
        zf.writestr('meta.xml', meta_xml)

        eml_xml = build_eml_xml(export_dataset)
        zf.writestr('eml.xml', eml_xml)

    from django.utils import timezone
    export_dataset.lastexported = timezone.now()
    export_dataset.save(update_fields=['lastexported'])

    logger.info('Generated DwCA: %s', output_path)
    return output_path


def _get_mapping_fields(mapping):
    """Get the query fields for a mapping that have DwC term assignments."""
    result = []
    for f in mapping.query.fields.order_by('position'):
        term = getattr(f, 'term', None)
        if not term:
            continue
        result.append({
            'term_iri': term,
            'column_name': sanitize_term_name(term),
            'cache_column': sanitize_column_name(term),
        })
    return result


def _table_to_csv(table_name, fields):
    """Read a cache table and return CSV string.

    Selects only the mapped columns (skipping the auto-increment id).
    """
    safe_name = re.sub(r'[^a-zA-Z0-9_]', '', table_name)

    output = io.StringIO()
    writer = csv.writer(output)

    headers = [f['column_name'] for f in fields]
    writer.writerow(headers)

    # Select specific columns to skip the auto-increment `id`
    col_names = ', '.join(f"`{f['cache_column']}`" for f in fields)
    try:
        with connection.cursor() as cursor:
            cursor.execute(f'SELECT {col_names} FROM `{safe_name}`')
            while True:
                rows = cursor.fetchmany(2000)
                if not rows:
                    break
                for row in rows:
                    writer.writerow(row)
    except Exception:
        logger.exception('Could not read cache table %s', safe_name)

    return output.getvalue()
