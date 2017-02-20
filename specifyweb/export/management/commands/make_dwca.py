import os
import errno
import logging
import subprocess
import shutil
from uuid import uuid4
from collections import namedtuple

from xml.etree import ElementTree
from xml.dom import minidom

from django.core.management.base import BaseCommand, CommandError

from specifyweb.context.app_resource import get_app_resource
from specifyweb.specify.models import Specifyuser, Collection
from specifyweb.stored_queries.execution import EphemeralField, query_to_csv
from specifyweb.stored_queries.queryfield import QueryField
from specifyweb.stored_queries.models import session_context

logger = logging.getLogger(__name__)

# from http://stackoverflow.com/a/17402424
def prettify(elem):
    """Return a pretty-printed XML string for the Element.
    """
    rough_string = ElementTree.tostring(elem, 'utf-8')
    reparsed = minidom.parseString(rough_string)
    return reparsed.toprettyxml(indent="\t")

ExportField = namedtuple('ExportField', 'field_spec term is_core_id')

def parse_fields(query_node):
    return [
        ExportField(
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
        for node in query_node
    ]

def validate_fields(field_sets):
    try:
        field_set = field_sets[0]
    except IndexError:
        raise DwCAException("Definition doesn't include any fields.")

    try:
        id_field_idx, id_field = (
            (i, f) for i, f in enumerate(field_set)
            if f.is_core_id
        ).next()
    except StopIteration:
        raise DwCAException("Definition doesn't include id field.")

    for fs in field_sets[1:]:
        for f1, f2 in zip(field_set, fs):
            if f1.is_core_id:
                if not f2.is_core_id:
                    raise DwCAException("""
                    Corresponding fields in queries don't match.
                    (id field vs. non id field)
                    Offending values: %s vs %s
                    """ % (f1, f2))
            elif f1.term != f2.term:
                raise DwCAException("""
                Corresponding fields in queries have different terms.
                Offending values: %s vs %s
                """ % (f1, f2))

    return namedtuple('ValidatedFields', 'field_set id_field_idx id_field')(
        field_set, id_field_idx, id_field)

def run_query(collection, user, tableid, fields, path):
    field_specs = [
        QueryField.from_spqueryfield(f.field_spec)
        for f in fields
    ]
    with session_context() as session:
        query_to_csv(session, collection, user, tableid, field_specs, path, strip_id=True)

def process_stanza(node):
    field_sets = {
        query_node.attrib['name']: parse_fields(query_node)
        for query_node in node.find('queries')
    }

    query_tableids = {
        query_node.attrib['name']: int(query_node.attrib['contextTableId'])
        for query_node in node.find('queries')
    }

    validated_fields = validate_fields(field_sets.values())

    output_node = ElementTree.Element(node.tag)
    output_node.set('rowType', node.attrib['rowType'])
    output_node.set('fieldsEnclosedBy', '"')
    output_node.set('fieldsTerminatedBy', ',')
    output_node.set('linesTerminatedBy', '\\r\\n')

    files = ElementTree.SubElement(output_node, 'files')
    for name, fs in field_sets.items():
        location = ElementTree.SubElement(files, 'location')
        location.text = name

    ElementTree.SubElement(output_node, 'id' if node.tag == 'core' else 'coreid') \
               .set('index', str(validated_fields.id_field_idx))

    for i, field in enumerate([f for f in validated_fields.field_set if f.field_spec.isDisplay]):
        if field.term is not None:
            field_node = ElementTree.SubElement(output_node, 'field')
            field_node.set('index', str(i))
            field_node.set('term', field.term)

    return namedtuple('ProcessedStanza', 'output_node field_sets query_tableids')(
        output_node, field_sets, query_tableids)


class Command(BaseCommand):

    def add_arguments(self, parser):
        definition = parser.add_mutually_exclusive_group(required=True)
        definition.add_argument('--resource', help='DwCA definition resource name')
        definition.add_argument('--definition', help='DwCA definition file')

        metadata = parser.add_mutually_exclusive_group()
        metadata.add_argument('--metadata', help='Metadata resource name')
        metadata.add_argument('--eml', help='Metadata eml file')

        parser.add_argument('collection_id', type=int)
        parser.add_argument('specifyuser_id', type=int)
        parser.add_argument('output_file')

    def handle(self, *args, **kwargs):
        try:
            os.remove(kwargs['output_file'])
        except OSError as e:
            if e.errno != errno.ENOENT:
                raise

        collection = Collection.objects.get(id=kwargs['collection_id'])
        user = Specifyuser.objects.get(id=kwargs['specifyuser_id'])
        if kwargs['definition'] != None:
            with open(kwargs['definition'], 'r') as f:
                definition = f.read()
        else:
            definition, _ = get_app_resource(collection, user, kwargs['resource'])

        element_tree = ElementTree.fromstring(definition)

        core_stanza = process_stanza(element_tree.find('core'))
        extension_stanzas = [process_stanza(node) for node in element_tree.findall('extension')]

        output_dir = '/tmp/dwca_%s' % uuid4()
        os.makedirs(output_dir)

        output_node = ElementTree.Element('archive')
        output_node.set('xmlns', "http://rs.tdwg.org/dwc/text/")
        output_node.set('xmlns:xsi', "http://www.w3.org/2001/XMLSchema-instance")
        output_node.set('xmlns:xs', "http://www.w3.org/2001/XMLSchema")
        output_node.set('xsi:schemaLocation', "http://rs.tdwg.org/dwc/text/ http://rs.tdwg.org/dwc/text/tdwg_dwc_text.xsd")

        if kwargs['eml'] != None:
            shutil.copyfile(kwargs['eml'], os.path.join(output_dir, 'eml.xml'))
            output_node.set('metadata', 'eml.xml')
        elif kwargs['metadata'] != None:
            metadata, _ = get_app_resource(collection, user, kwargs['metadata'])
            with open(os.path.join(output_dir, 'eml.xml'), 'wb') as f:
                f.write(metadata.encode('utf-8'))
            output_node.set('metadata', 'eml.xml')

        output_node.append(core_stanza.output_node)
        for stanza in extension_stanzas:
            output_node.append(stanza.output_node)

        with open(os.path.join(output_dir, 'meta.xml'), 'w') as meta_xml:
            meta_xml.write(prettify(output_node))

        for stanza in [core_stanza] + extension_stanzas:
            for name in stanza.query_tableids.keys():
                field_set = stanza.field_sets[name]
                tableid = stanza.query_tableids[name]
                run_query(collection, user, tableid, field_set, os.path.join(output_dir, name))

        subprocess.check_call(['zip', '-r', '-j', kwargs['output_file'], output_dir])
        shutil.rmtree(output_dir)
