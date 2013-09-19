from collections import OrderedDict
from xml.etree import ElementTree
import os

from django.utils import simplejson
from django.conf import settings

from specifyweb.specify.dependent_fields import dependent_fields

def table_to_json(table):
    data = OrderedDict()
    data['classname'] = table.attrib['classname']
    data['tableId'] = int(table.attrib['tableid'])

    display = table.find('display')
    if display is not None:
        data['view'] = display.attrib.get('view', None)
        data['searchDialog'] = display.attrib.get('searchdlg', None)

    data['fields'] = [field_to_json(field) for field in table.findall('field')]
    data['relationships'] = [rel_to_json(table, rel) for rel in table.findall('relationship')]
    data['fieldAliases'] = [alias_to_json(alias) for alias in table.findall('fieldalias')]

    return data

def field_to_json(field):
    data = OrderedDict()
    data['name'] = field.attrib['name']
    data['required'] = (field.attrib['required'] == "true")
    data['type'] = field.attrib['type']

    if 'length' in field.attrib:
        data['length'] = int(field.attrib['length'])

    return data

def rel_to_json(table, rel):
    table_name = table.attrib['classname'].split('.')[-1].capitalize()
    name = rel.attrib['relationshipname'].lower()

    data = OrderedDict()
    data['name'] = rel.attrib['relationshipname']
    data['type'] = rel.attrib['type']
    data['required'] = (rel.attrib['required'] == "true")
    data['dependent'] = ('.'.join((table_name, name)) in dependent_fields)
    data['relatedModelName'] = rel.attrib['classname'].split('.')[-1]

    if 'othersidename' in rel.attrib:
        data['otherSideName'] = rel.attrib['othersidename']

    return data

def alias_to_json(alias):
    return dict(alias.attrib)

def build_datamodel_json():
    datamodel = ElementTree.parse(os.path.join(settings.SPECIFY_CONFIG_DIR, 'specify_datamodel.xml'))

    indent = {'indent': 2} if settings.DEBUG else {}
    return simplejson.dumps([table_to_json(table) for table in datamodel.findall('table')], **indent)
