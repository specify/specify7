"""Shared utilities for DwC archive generation."""
import re
from datetime import date
from uuid import uuid4
from xml.etree import ElementTree as ET


def sanitize_term_name(term_iri):
    """Extract the short name from a DwC term IRI.

    'http://rs.tdwg.org/dwc/terms/catalogNumber' -> 'catalogNumber'
    'http://purl.org/dc/terms/type' -> 'type'
    """
    if '/' in term_iri:
        term_iri = term_iri.rsplit('/', 1)[-1]
    if '#' in term_iri:
        term_iri = term_iri.rsplit('#', 1)[-1]
    return term_iri


def sanitize_column_name(name):
    """Sanitize a term IRI into a valid MySQL column name."""
    name = sanitize_term_name(name)
    name = re.sub(r'[^a-zA-Z0-9_]', '_', name)
    return name[:64]


# Known extension rowType URIs
EXTENSION_ROW_TYPES = {
    'MeasurementOrFact': 'http://rs.iobis.org/obis/terms/ExtendedMeasurementOrFact',
    'ResourceRelationship': 'http://rs.tdwg.org/dwc/terms/ResourceRelationship',
    'Identification': 'http://rs.tdwg.org/dwc/terms/Identification',
    'Multimedia': 'http://rs.gbif.org/terms/1.0/Multimedia',
}


def build_meta_xml(core_terms, ext_info_list):
    """Build meta.xml describing the DwC archive structure.

    core_terms: list of full term IRIs for the core file
    ext_info_list: list of dicts with 'filename' and 'terms' (full IRIs)
    """
    archive = ET.Element('archive')
    archive.set('xmlns', 'http://rs.tdwg.org/dwc/text/')
    archive.set('metadata', 'eml.xml')

    # Core
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

    if core_terms:
        id_elem = ET.SubElement(core, 'id')
        id_elem.set('index', '0')

    for idx, term_iri in enumerate(core_terms):
        f = ET.SubElement(core, 'field')
        f.set('index', str(idx))
        f.set('term', term_iri)

    # Extensions
    for ext in ext_info_list:
        extension = ET.SubElement(archive, 'extension')
        extension.set('encoding', 'UTF-8')
        extension.set('fieldsTerminatedBy', ',')
        extension.set('linesTerminatedBy', '\\n')
        extension.set('fieldsEnclosedBy', '"')
        extension.set('ignoreHeaderLines', '1')
        row_type = ext.get('rowType', 'http://rs.tdwg.org/dwc/terms/MeasurementOrFact')
        extension.set('rowType', row_type)

        files = ET.SubElement(extension, 'files')
        location = ET.SubElement(files, 'location')
        location.text = ext['filename']

        coreid = ET.SubElement(extension, 'coreid')
        coreid.set('index', '0')

        for idx, term_iri in enumerate(ext['terms']):
            f = ET.SubElement(extension, 'field')
            f.set('index', str(idx))
            f.set('term', term_iri)

    return ET.tostring(archive, encoding='unicode', xml_declaration=True)


def build_eml_xml(export_dataset):
    """Build EML metadata. Returns custom EML if uploaded, else generates minimal EML."""
    if export_dataset.metadata:
        try:
            from specifyweb.specify.models import Spappresourcedata
            data = Spappresourcedata.objects.filter(
                spappresource=export_dataset.metadata
            ).first()
            if data and data.data:
                content = data.data
                if isinstance(content, bytes):
                    content = content.decode('utf-8')
                return content
        except Exception:
            pass

    eml = ET.Element('eml:eml')
    eml.set('xmlns:eml', 'eml://ecoinformatics.org/eml-2.1.1')
    eml.set('packageId', str(uuid4()))
    eml.set('system', 'http://specify.org')

    dataset = ET.SubElement(eml, 'dataset')
    title = ET.SubElement(dataset, 'title')
    title.text = export_dataset.exportname

    creator = ET.SubElement(dataset, 'creator')
    org = ET.SubElement(creator, 'organizationName')
    org.text = 'Specify Collection'

    pubdate = ET.SubElement(dataset, 'pubDate')
    pubdate.text = date.today().strftime('%Y-%m-%d')

    abstract = ET.SubElement(dataset, 'abstract')
    para = ET.SubElement(abstract, 'para')
    para.text = f'Darwin Core Archive export: {export_dataset.exportname}'

    return ET.tostring(eml, encoding='unicode', xml_declaration=True)
