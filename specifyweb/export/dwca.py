import os
import errno
import logging
import re
import shutil
from datetime import date
from tempfile import mkdtemp
from collections import namedtuple
from typing import NamedTuple, List, TypeVar, Type, Tuple, Optional
from uuid import uuid4
from datetime import date

from xml.etree import ElementTree as ET
from xml.dom import minidom # type: ignore

from ..specify import models
from ..stored_queries.execution import EphemeralField, query_to_csv, execute
from ..stored_queries.queryfield import QueryField
from ..stored_queries.models import session_context
from ..context.app_resource import get_app_resource

Spappresourcedata = getattr(models, 'Spappresourcedata')
Collection = getattr(models, 'Collection')
Specifyuser = getattr(models, 'Specifyuser')

logger = logging.getLogger(__name__)
ET.register_namespace('eml', 'eml://ecoinformatics.org/eml-2.1.1')

class DwCAException(Exception):
    pass

# from http://stackoverflow.com/a/17402424
def prettify(elem: ET.Element) -> str:
    """Return a pretty-printed XML string for the Element.
    """
    rough_string = ET.tostring(elem, 'utf-8')
    reparsed = minidom.parseString(rough_string)
    return reparsed.toprettyxml(indent="\t")

S = TypeVar('S', bound='Stanza')
class Stanza(NamedTuple):
    "Represents either a core or extension definition."
    is_core: bool
    row_type: str
    constant_fields: List["ConstantField"]
    export_fields: List["ExportField"]
    id_field_idx: int
    queries: List["Query"]


    @classmethod
    def from_xml(cls: Type[S], node: ET.Element) -> S:
        queries = [Query.from_xml(query_node) for query_node in (node.find('queries') or [])]
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
    def get_export_fields(queries: List["Query"]) -> Tuple[List["ExportField"], int]:
        """Returns a representation of the fields in the query result data
        for the meta.xml field information.

        For each query the fields have to match up.
        """
        try:
            export_fields = queries[0].get_export_fields()
        except IndexError:
            raise DwCAException("Definition doesn't include any queries.")

        for q in queries[1:]:
            fields = q.get_export_fields()
            if fields != export_fields:
                raise DwCAException("""
                Query definitions have conflicting fields.
                Offending values: %s vs %s
                """ % (fields, export_fields))

        id_fields = [f.idx for f in export_fields if f.is_core_id]

        if len(id_fields) < 1:
            raise DwCAException("Definition doesn't include id field.")
        elif len(id_fields) > 1:
            raise DwCAException("Definition includes multiple id fields.")

        return export_fields, id_fields[0]

    def to_xml(self) -> ET.Element:
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

        for efield in self.export_fields:
            if efield.term is not None:
                field_node = ET.SubElement(output_node, 'field')
                field_node.set('index', str(efield.idx))
                field_node.set('term', efield.term)

        for cfield in self.constant_fields:
            field_node = ET.SubElement(output_node, 'field')
            field_node.set('term', cfield.term)
            field_node.set('default', cfield.value)

        return output_node

Q = TypeVar('Q', bound='Query')
class Query(NamedTuple):
    "Represents the information about a query that goes into the archive."
    tableid: int # the table the query is over.
    file_name: str # the name of the file in the archive that will contain the data.
    query_fields: List["QueryDefField"] # represents the fields of the query. [QueryDefField(...)]

    @classmethod
    def from_xml(cls: Type[Q], query_node: ET.Element) -> Q:
        return cls(
            tableid = int(query_node.attrib['contextTableId']),

            file_name = query_node.attrib['name'],

            query_fields = [
                QueryDefField.from_xml(field_node)
                for field_node in query_node
            ],
        )

    def get_export_fields(self) -> List["ExportField"]:
        return [
            ExportField(idx=i, term=f.term, is_core_id=f.is_core_id)
            for i, f in enumerate(f for f in self.query_fields if f.field_spec.isDisplay)
        ]

    def get_field_specs(self) -> List[QueryField]:
        return [QueryField.from_spqueryfield(f.field_spec) for f in self.query_fields]


class ExportField(NamedTuple):
    "Represents a field in a query in terms of how it will appear in the meta.xml"
    idx: int # the column of the field in the query output (zero-based).
    term: Optional[str] # the Darwin core or extension term the field contains. can be None.
    is_core_id: bool # whether the field represents the coreId field.


QDF = TypeVar('QDF', bound="QueryDefField")
class QueryDefField(NamedTuple):
    "Represents the fields of a query and what Darwin core or extension term the represents."

    field_spec: EphemeralField # the internal query information.
    term: Optional[str] # the darwin core/extension term. can be None for e.g. filtering fields.
    is_core_id: bool # whether the field represents the coreId field.

    @classmethod
    def from_xml(cls: Type[QDF], node: ET.Element) -> QDF:
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

            term = node.attrib.get('term'),

            is_core_id = node.tag == 'id',
        )

CF = TypeVar('CF', bound="ConstantField")
class ConstantField(NamedTuple):
    """Represents a field that will be included in the meta.xml
    with a default value and no index into the query results data.
    """
    value: str
    term: str

    @classmethod
    def from_xml(cls: Type[CF], node: ET.Element) -> CF:
        return cls(value=node.attrib['value'], term=node.attrib['term'])


def make_dwca(collection, user, definition: str, output_file: str , eml: Optional[str]=None) -> None:
    output_dir = mkdtemp()
    try:
        element_tree = ET.fromstring(definition)

        core_xml = element_tree.find('core')
        assert core_xml is not None
        core_stanza = Stanza.from_xml(core_xml)
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

def by_core_id(collection_id: int, user_id: int, definition: str, core_id: str):
    collection = Collection.objects.get(id=collection_id)
    user = Specifyuser.objects.get(id=user_id)
    dwca_def, _ = get_app_resource(collection, user, definition)

    element_tree = ET.fromstring(dwca_def)

    core_xml = element_tree.find('core')
    assert core_xml is not None
    core_stanza = Stanza.from_xml(core_xml)
    extension_stanzas = [Stanza.from_xml(node) for node in element_tree.findall('extension')]

    with session_context() as session:
        core_rows = []
        core_export_fields, _ = Stanza.get_export_fields(core_stanza.queries)
        core_terms = [f.term for f in core_export_fields]
        for query in core_stanza.queries:
            query_ = limit_query_by_core_id(query, core_id)
            core_rows.extend(
                execute(session, collection, user, query.tableid, False, False, query_.get_field_specs(), 2, 0)['results']
            )
        if len(core_rows) > 1:
            raise Exception('DwCA definition returns multiple records for a given id.')

        if not core_rows:
            return None

        core_result = list(zip(core_terms, core_rows[0][1:]))

        extensions = []
        for stanza in extension_stanzas:
            ext_rows = []
            ext_export_fields, _ = Stanza.get_export_fields(stanza.queries)
            ext_terms = [f.term for f in ext_export_fields]
            for query in stanza.queries:
                query_ = limit_query_by_core_id(query, core_id)
                ext_rows.extend(
                    execute(session, collection, user, query.tableid, False, False, query_.get_field_specs(), 0, 0)['results']
                )
            extensions.append({'class': stanza.row_type, 'records': [list(zip(ext_terms, row[1:])) for row in ext_rows]})

    return {'core': core_result, 'extensions': extensions}


def limit_query_by_core_id(query: Query, core_id: str) -> Query:
    def limit_core_id(f: QueryDefField) -> QueryDefField:
        return f._replace(field_spec=f.field_spec._replace(
            startValue=core_id,
            operStart=1, # equality
            isNot=False,
        ))

    return query._replace(
        query_fields=[
            limit_core_id(f) if f.is_core_id else f
            for f in query.query_fields
        ]
    )

def write_eml(source: str, output_path: str, pub_date: Optional[date]=None, package_id: Optional[str]=None) -> None:
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
    assert dataset is not None
    for e in dataset.findall('pubDate'):
        dataset.remove(e)

    pubDate = ET.SubElement(dataset, 'pubDate')
    pubDate.text = pub_date.isoformat()
    ET.ElementTree(eml).write(output_path, encoding='utf-8')
