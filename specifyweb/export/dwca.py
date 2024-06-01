import os
import errno
import logging
import re
import shutil
from tempfile import mkdtemp
from collections import namedtuple
from uuid import uuid4
from datetime import date
from django.utils.translation import gettext as _

from xml.etree import ElementTree as ET
from xml.dom import minidom

from specifyweb.stored_queries.execution import query_to_csv
from specifyweb.stored_queries.queryfield import QueryField, EphemeralField
from specifyweb.stored_queries.models import session_context

logger = logging.getLogger(__name__)
ET.register_namespace('eml', 'eml://ecoinformatics.org/eml-2.1.1')

class DwCAException(Exception):
    pass

# from https://stackoverflow.com/a/17402424
def prettify(elem):
    """Return a pretty-printed XML string for the Element.
    """
    rough_string = ET.tostring(elem, 'utf-8')
    reparsed = minidom.parseString(rough_string)
    return reparsed.toprettyxml(indent="\t")

class Stanza(namedtuple('Stanza', 'is_core row_type constant_fields export_fields id_field_idx queries')):
    "Represents either a core or extension definition."
    @classmethod
    def from_xml(cls, node):
        queries = [Query.from_xml(query_node) for query_node in node.find('queries')]
        export_fields, id_field_idx = cls.get_export_fields(queries)
        constant_fields = [ConstantField.from_xml(fn) for fn in node.findall('field')]

        return cls(
            is_core = node.tag == 'core',
            row_type = node.attrib['rowType'],
            queries = queries,
            constant_fields = constant_fields,
            export_fields = export_fields,
            id_field_idx = id_field_idx,
        )

    @staticmethod
    def get_export_fields(queries):
        """Returns a representation of the fields in the query result data
        for the meta.xml field information.

        For each query the fields have to match up.
        """
        try:
            export_fields = queries[0].get_export_fields()
        except IndexError:
            raise DwCAException(_("Definition doesn't include any queries."))

        for q in queries[1:]:
            fields = q.get_export_fields()
            if fields != export_fields:
                raise DwCAException(_(
                "Query definitions have conflicting fields. "
                "Offending values: %(fields)s vs %(export_fields)s"
                ) % {'fields':fields, 'export_fields':export_fields})

        id_fields = [f.index for f in export_fields if f.is_core_id]

        if len(id_fields) < 1:
            raise DwCAException(_("Definition doesn't include id field."))
        elif len(id_fields) > 1:
            raise DwCAException(_("Definition includes multiple id fields."))

        return export_fields, id_fields[0]

    def to_xml(self):
        output_node = ET.Element('core' if self.is_core else 'extension')
        output_node.set('rowType', self.row_type)
        output_node.set('fieldsEnclosedBy', '"')
        output_node.set('fieldsTerminatedBy', ',')
        output_node.set('linesTerminatedBy', '\\r\\n')

        files_node = ET.SubElement(output_node, 'files')
        for query in self.queries:
            location = ET.SubElement(files_node, 'location')
            location.text = query.file_name

        id_node = ET.SubElement(output_node, 'id' if self.is_core else 'coreid')
        id_node.set('index', str(self.id_field_idx))

        for field in self.export_fields:
            if field.term is not None:
                field_node = ET.SubElement(output_node, 'field')
                field_node.set('index', str(field.index))
                field_node.set('term', field.term)

        for field in self.constant_fields:
            field_node = ET.SubElement(output_node, 'field')
            field_node.set('term', field.term)
            field_node.set('default', field.value)

        return output_node

class Query(namedtuple('Query', 'tableid file_name query_fields')):
    """Represents the information about a query that goes into the archive.

    tableid -- the table the query is over.
    file_name -- the name of the file in the archive that will contain the data.
    query_fields -- represents the fields of the query. [QueryDefField(...)]
    """
    @classmethod
    def from_xml(cls, query_node):
        return cls(
            tableid = int(query_node.attrib['contextTableId']),

            file_name = query_node.attrib['name'],

            query_fields = [
                QueryDefField.from_xml(field_node)
                for field_node in query_node
            ],
        )

    def get_export_fields(self):
        return tuple(
            ExportField(index=i, term=f.term, is_core_id=f.is_core_id)
            for i, f in enumerate(f for f in self.query_fields if f.field_spec.isDisplay)
        )

    def get_field_specs(self):
        return [QueryField.from_spqueryfield(f.field_spec) for f in self.query_fields]


class ExportField(namedtuple('ExportField', 'index term is_core_id')):
    """Represents a field in a query in terms of how it will appear in the meta.xml

    index -- the column of the field in the query output (zero-based).
    term -- the Darwin core or extension term the field contains. can be None.
    is_core_id -- whether the field represents the coreId field.
    """
    pass

class QueryDefField(namedtuple('QueryDefField', 'field_spec term is_core_id')):
    """Represents the fields of a query and what Darwin core or extension term the represents.

    field_spec -- the internal query information.
    term -- the darwin core/extension term. can be None for e.g. filtering fields.
    is_core_id -- whether the field represents the coreId field.
    """
    @classmethod
    def from_xml(cls, node):
        return cls(
            field_spec = EphemeralField(
                stringId   = node.attrib['stringId'],
                isRelFld   = node.attrib['isRelFld'] == 'true',
                operStart  = int(node.attrib['oper']),
                startValue = node.attrib['value'],
                isNot      = node.attrib['isNot'] == 'true',
                isDisplay  = 'term' in node.attrib or node.tag == 'id',
                formatName = node.attrib.get('formatName', None),
                sortType   = 0,
            ),

            term = node.attrib.get('term', None),

            is_core_id = node.tag == 'id',
        )

class ConstantField(namedtuple('ConstantField', 'value term')):
    """Represents a field that will be included in the meta.xml
    with a default value and no index into the query results data.
    """
    @classmethod
    def from_xml(cls, node):
        return cls(value=node.attrib['value'], term=node.attrib['term'])


def make_dwca(collection, user, definition, output_file, eml=None):
    output_dir = mkdtemp()
    try:
        element_tree = ET.fromstring(definition)

        core_stanza = Stanza.from_xml(element_tree.find('core'))
        extension_stanzas = [Stanza.from_xml(node) for node in element_tree.findall('extension')]

        output_node = ET.Element('archive')
        output_node.set('xmlns', "http://rs.tdwg.org/dwc/text/")
        output_node.set('xmlns:xsi', "http://www.w3.org/2001/XMLSchema-instance")
        output_node.set('xmlns:xs', "http://www.w3.org/2001/XMLSchema")
        output_node.set('xsi:schemaLocation', "http://rs.tdwg.org/dwc/text/ http://rs.tdwg.org/dwc/text/tdwg_dwc_text.xsd")

        if eml is not None:
            output_node.set('metadata', 'eml.xml')
            write_eml(eml, os.path.join(output_dir, 'eml.xml'))

        output_node.append(core_stanza.to_xml())
        for stanza in extension_stanzas:
            output_node.append(stanza.to_xml())

        with open(os.path.join(output_dir, 'meta.xml'), 'w') as meta_xml:
            meta_xml.write(prettify(output_node))

        core_ids = set()
        def collect_ids(row):
            core_ids.add(row[core_stanza.id_field_idx + 1])
            return True

        with session_context() as session:
            for query in core_stanza.queries:
                path = os.path.join(output_dir, query.file_name)
                query_to_csv(session, collection, user, query.tableid, query.get_field_specs(), path,
                             strip_id=True, row_filter=collect_ids)

            for stanza in extension_stanzas:
                def filter_ids(row):
                    return row[stanza.id_field_idx + 1] in core_ids

                for query in stanza.queries:
                    path = os.path.join(output_dir, query.file_name)
                    query_to_csv(session, collection, user, query.tableid, query.get_field_specs(), path,
                                 strip_id=True, row_filter=filter_ids)

        basename = re.sub(r'\.zip$', '', output_file)
        shutil.make_archive(basename, 'zip', output_dir, logger=logger)
    finally:
        shutil.rmtree(output_dir)

def write_eml(source, output_path, pub_date=None, package_id=None):
    if pub_date is None:
        pub_date = date.today()

    if package_id is None:
        package_id = str(uuid4())

    eml = ET.fromstring(source.encode('utf-8') if isinstance(source, str) else source)
    eml.attrib.update({
        'system': 'Specify',
        'scope': 'system',
        'packageId': package_id,
    })

    dataset = eml.find('dataset')

    for e in dataset.findall('pubDate'):
        dataset.remove(e)

    pubDate = ET.SubElement(dataset, 'pubDate')
    pubDate.text = pub_date.isoformat()
    ET.ElementTree(eml).write(output_path, encoding='utf-8')
