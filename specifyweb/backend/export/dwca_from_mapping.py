"""Generate Darwin Core Archives directly from SchemaMapping queries.

Bypasses cache tables — executes queries directly and writes CSV output.
"""
import csv
import logging
import os
import re
import shutil
from tempfile import mkdtemp

from specifyweb.backend.stored_queries.execution import query_to_csv, BuildQueryProps
from specifyweb.backend.stored_queries.queryfield import QueryField
from specifyweb.backend.stored_queries.models import session_context

from .dwca_utils import sanitize_term_name, build_meta_xml, build_eml_xml
from .field_adapter import EphemeralFieldAdapter

DWCA_DATE_FORMAT = '%Y-%m-%d'

logger = logging.getLogger(__name__)


def make_dwca_from_dataset(export_dataset, user=None):
    """Generate a DwCA zip file from an ExportDataSet.

    Executes the backing SpQuery for each mapping (core + extensions)
    and writes the results as CSV into a DwC Archive ZIP.

    Returns the path to the generated zip file.
    """
    from django.conf import settings

    output_dir_base = os.path.join(settings.DEPOSITORY_DIR, 'export_feed')
    os.makedirs(output_dir_base, exist_ok=True)
    output_path = os.path.join(output_dir_base, export_dataset.filename)

    collection = export_dataset.collection

    core_mapping = export_dataset.coremapping
    core_query = core_mapping.query

    ext_mappings = [
        ext.schemamapping
        for ext in export_dataset.extensions.all().order_by('sortorder')
    ]

    temp_dir = mkdtemp()
    try:
        core_ids = set()

        def collect_core_ids(row):
            core_ids.add(row[1])
            return True

        core_fields = _get_query_fields(core_query)
        core_field_specs = [QueryField.from_spqueryfield(f['adapter'])
                            for f in core_fields]
        core_csv_headers = [sanitize_term_name(f['term_iri']) for f in core_fields]
        core_csv_path = os.path.join(temp_dir, 'occurrence.csv')

        with session_context() as session:
            query_to_csv(
                session, collection, user,
                core_query.contexttableid,
                core_field_specs,
                core_csv_path,
                captions=core_csv_headers,
                strip_id=True,
                row_filter=collect_core_ids,
                date_format_override=DWCA_DATE_FORMAT,
            )

            ext_info = []
            for i, ext_mapping in enumerate(ext_mappings):
                ext_query = ext_mapping.query
                ext_fields = _get_query_fields(ext_query)
                ext_field_specs = [QueryField.from_spqueryfield(f['adapter'])
                                   for f in ext_fields]
                ext_csv_headers = [sanitize_term_name(f['term_iri']) for f in ext_fields]
                ext_filename = f'extension_{i}.csv'
                ext_csv_path = os.path.join(temp_dir, ext_filename)

                def filter_by_core(row, _ids=core_ids):
                    return row[1] in _ids

                query_to_csv(
                    session, collection, user,
                    ext_query.contexttableid,
                    ext_field_specs,
                    ext_csv_path,
                    captions=ext_csv_headers,
                    strip_id=True,
                    row_filter=filter_by_core,
                    date_format_override=DWCA_DATE_FORMAT,
                )

                ext_info.append({
                    'filename': ext_filename,
                    'terms': [f['term_iri'] for f in ext_fields],
                })

        _rewrite_attachment_urls(core_csv_path, core_fields, collection)

        # Write meta.xml (pass full IRIs — shared util handles them correctly)
        core_term_iris = [f['term_iri'] for f in core_fields]
        meta_xml = build_meta_xml(core_term_iris, ext_info)
        with open(os.path.join(temp_dir, 'meta.xml'), 'w') as f:
            f.write(meta_xml)

        eml_xml = build_eml_xml(export_dataset)
        with open(os.path.join(temp_dir, 'eml.xml'), 'w') as f:
            f.write(eml_xml)

        basename = re.sub(r'\.zip$', '', output_path)
        shutil.make_archive(basename, 'zip', temp_dir, logger=logger)

    finally:
        shutil.rmtree(temp_dir)

    from django.utils import timezone
    export_dataset.lastexported = timezone.now()
    export_dataset.save(update_fields=['lastexported'])

    logger.info('Generated DwCA: %s', output_path)
    return output_path


def _rewrite_attachment_urls(csv_path, fields, collection):
    """Post-process a CSV file to rewrite attachment filenames as full URLs."""
    from django.conf import settings
    from .attachment_urls import construct_attachment_url, is_attachment_field

    base_url = getattr(settings, 'WEB_ATTACHMENT_URL', None)
    if not base_url:
        logger.warning('No WEB_ATTACHMENT_URL configured — attachment fields will be blank in export')

    attachment_cols = set()
    for i, f in enumerate(fields):
        adapter = f.get('adapter')
        if adapter:
            fname = getattr(adapter, 'stringId', '')
            if 'attachment' in fname.lower() or is_attachment_field(f.get('term_iri', '')):
                attachment_cols.add(i)

    if not attachment_cols:
        return

    with open(csv_path, 'r', newline='') as infile:
        reader = csv.reader(infile)
        rows = list(reader)

    if len(rows) < 2:
        return

    for row in rows[1:]:
        for col_idx in attachment_cols:
            if col_idx < len(row) and row[col_idx]:
                row[col_idx] = construct_attachment_url(collection, row[col_idx])

    with open(csv_path, 'w', newline='') as outfile:
        writer = csv.writer(outfile)
        writer.writerows(rows)


def _get_query_fields(spquery):
    """Get fields from a SpQuery that have DwC term assignments.

    Returns list of dicts with 'adapter' (EphemeralFieldAdapter) and 'term_iri' (full IRI).
    """
    result = []
    for f in spquery.fields.order_by('position'):
        term = getattr(f, 'term', None)
        if not term:
            continue
        result.append({
            'adapter': EphemeralFieldAdapter(f, force_display=True),
            'term_iri': term,
        })
    return result
