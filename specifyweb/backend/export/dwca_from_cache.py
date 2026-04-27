"""Generate Darwin Core Archives from pre-built cache tables."""
import csv
import io
import logging
import os
import re
import zipfile
from datetime import datetime
from xml.etree import ElementTree as ET

from django.conf import settings
from django.db import connection

from .cache import get_cache_table_name

logger = logging.getLogger(__name__)


def make_dwca_from_dataset(export_dataset, output_dir=None):
    """Generate a DwCA zip file from an ExportDataSet and its cache tables.

    Returns the path to the generated zip file.
    """
    if output_dir is None:
        output_dir = os.path.join(settings.DEPOSITORY_DIR, 'export_feed')
    os.makedirs(output_dir, exist_ok=True)

    output_path = os.path.join(output_dir, export_dataset.filename)

    core_mapping = export_dataset.coremapping
    collection = export_dataset.collection
    core_table = get_cache_table_name(core_mapping.id, collection.id)

    # Get extension mappings
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
        # Write core CSV
        core_fields = _get_mapping_fields(core_mapping)
        core_csv = _table_to_csv(core_table, core_fields)
        zf.writestr('occurrence.csv', core_csv)

        # Write extension CSVs
        ext_filenames = []
        for ext_info in extensions:
            ext_fields = _get_mapping_fields(ext_info['mapping'])
            ext_csv = _table_to_csv(ext_info['table_name'], ext_fields)
            filename = f"extension_{ext_info['sort_order']}.csv"
            zf.writestr(filename, ext_csv)
            ext_filenames.append({
                'filename': filename,
                'fields': ext_fields,
                'mapping': ext_info['mapping'],
            })

        # Write meta.xml
        meta_xml = _build_meta_xml(core_fields, ext_filenames)
        zf.writestr('meta.xml', meta_xml)

        # Write eml.xml
        eml_xml = _build_eml_xml(export_dataset)
        zf.writestr('eml.xml', eml_xml)

    # Update last exported timestamp
    from django.utils import timezone
    export_dataset.lastexported = timezone.now()
    export_dataset.save(update_fields=['lastexported'])

    logger.info('Generated DwCA: %s', output_path)
    return output_path


def _get_mapping_fields(mapping):
    """Get the query fields for a mapping, ordered by position."""
    fields = mapping.query.fields.filter(isdisplay=True).order_by('position')
    result = []
    for f in fields:
        # Use columnalias as the term if set, otherwise fall back to fieldname
        term = f.columnalias or ''
        col_name = _sanitize_column_name_for_csv(term or f.fieldname)
        result.append({
            'term': term,
            'column_name': col_name,
            'field_name': f.fieldname,
        })
    return result


def _sanitize_column_name_for_csv(name):
    """Get a display name from a term IRI or field name."""
    if '/' in name:
        name = name.rsplit('/', 1)[-1]
    if '#' in name:
        name = name.rsplit('#', 1)[-1]
    return name


def _table_to_csv(table_name, fields):
    """Read a cache table and return CSV string."""
    safe_name = re.sub(r'[^a-zA-Z0-9_]', '', table_name)

    output = io.StringIO()
    writer = csv.writer(output)

    # Header row using DwC term names
    headers = [f['column_name'] for f in fields]
    writer.writerow(headers)

    # Try to read from cache table
    try:
        with connection.cursor() as cursor:
            cursor.execute(f'SELECT * FROM `{safe_name}`')
            for row in cursor.fetchall():
                writer.writerow(row)
    except Exception:
        # Cache table may not exist or be empty — write headers only
        logger.warning('Could not read cache table %s', safe_name)

    return output.getvalue()


def _build_meta_xml(core_fields, ext_filenames):
    """Build meta.xml describing the archive structure."""
    archive = ET.Element('archive')
    archive.set('xmlns', 'http://rs.tdwg.org/dwc/text/')
    archive.set('metadata', 'eml.xml')

    # Core element
    core = ET.SubElement(archive, 'core')
    core.set('encoding', 'UTF-8')
    core.set('fieldsTerminatedBy', ',')
    core.set('linesTerminatedBy', '\\n')
    core.set('fieldsEnclosedBy', '"')
    core.set('ignoreHeaderLines', '1')
    core.set('rowType', 'http://rs.tdwg.org/dwc/terms/Occurrence')

    files = ET.SubElement(core, 'files')
    location = ET.SubElement(files, 'location')
    location.text = 'occurrence.csv'

    # ID field (first field = occurrenceID)
    if core_fields:
        id_elem = ET.SubElement(core, 'id')
        id_elem.set('index', '0')

    for idx, field in enumerate(core_fields):
        if field['term']:
            f = ET.SubElement(core, 'field')
            f.set('index', str(idx))
            f.set('term', field['term'])

    # Extension elements
    for ext_info in ext_filenames:
        extension = ET.SubElement(archive, 'extension')
        extension.set('encoding', 'UTF-8')
        extension.set('fieldsTerminatedBy', ',')
        extension.set('linesTerminatedBy', '\\n')
        extension.set('fieldsEnclosedBy', '"')
        extension.set('ignoreHeaderLines', '1')
        extension.set('rowType', 'http://rs.tdwg.org/dwc/terms/MeasurementOrFact')

        files = ET.SubElement(extension, 'files')
        location = ET.SubElement(files, 'location')
        location.text = ext_info['filename']

        coreid = ET.SubElement(extension, 'coreid')
        coreid.set('index', '0')

        for idx, field in enumerate(ext_info['fields']):
            if field['term']:
                f = ET.SubElement(extension, 'field')
                f.set('index', str(idx))
                f.set('term', field['term'])

    return ET.tostring(archive, encoding='unicode', xml_declaration=True)


def _build_eml_xml(export_dataset):
    """Build minimal EML metadata for the archive."""
    # Try to load custom metadata from the app resource
    if export_dataset.metadata:
        try:
            from specifyweb.specify.models import Spappresourcedata
            data = Spappresourcedata.objects.filter(
                spappresource=export_dataset.metadata
            ).first()
            if data and data.data:
                return data.data
        except Exception:
            pass

    # Generate minimal EML
    eml = ET.Element('eml:eml')
    eml.set('xmlns:eml', 'eml://ecoinformatics.org/eml-2.1.1')
    eml.set('packageId', export_dataset.filename)
    eml.set('system', 'http://specify.org')

    dataset = ET.SubElement(eml, 'dataset')
    title = ET.SubElement(dataset, 'title')
    title.text = export_dataset.exportname

    creator = ET.SubElement(dataset, 'creator')
    org = ET.SubElement(creator, 'organizationName')
    org.text = 'Specify Collection'

    pubdate = ET.SubElement(dataset, 'pubDate')
    pubdate.text = datetime.now().strftime('%Y-%m-%d')

    abstract = ET.SubElement(dataset, 'abstract')
    para = ET.SubElement(abstract, 'para')
    para.text = f'Darwin Core Archive export: {export_dataset.exportname}'

    return ET.tostring(eml, encoding='unicode', xml_declaration=True)
