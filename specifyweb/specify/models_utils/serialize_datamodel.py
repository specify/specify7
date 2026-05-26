from collections import OrderedDict
import json

from django.conf import settings

def table_to_dict(table):
    data = OrderedDict()
    data['classname'] = table.classname
    data['table'] = table.table
    data['tableId'] = table.tableId
    if hasattr(table, 'view') and table.view is not None:
        data['view'] = table.view
    if hasattr(table, 'searchDialog') and table.searchDialog is not None:
        data['searchDialog'] = table.searchDialog
    data['system'] = table.system
    data['idColumn'] = table.idColumn
    data['idFieldName'] = table.idFieldName
    data['fields'] = [field_to_dict(field) for field in table.fields]
    data['relationships'] = [rel_to_dict(table, rel) for rel in table.relationships]
    data['fieldAliases'] = table.fieldAliases
    return data

def field_to_dict(field):
    data = OrderedDict()
    data['name'] = field.name
    data['column'] = field.column
    data['indexed'] = field.indexed
    data['unique'] = field.unique
    data['required'] = field.required
    data['type'] = field.type
    if hasattr(field, 'length') and field.length is not None:
        data['length'] = field.length
    return data

def rel_to_dict(table, rel):
    data = OrderedDict()
    data['name'] = rel.name
    data['type'] = rel.type
    data['required'] = rel.required
    data['dependent'] = rel.dependent
    data['relatedModelName'] = rel.relatedModelName
    if hasattr(rel, 'column') and rel.column is not None and rel.column != '':
        data['column'] =  rel.column
    if hasattr(rel, 'otherSideName') and rel.otherSideName is not None and rel.otherSideName != '':
        data['otherSideName'] = rel.otherSideName
    return data

def datamodel_to_seq(datamodel):
    return [table_to_dict(table) for table in datamodel.tables]

def datamodel_to_json(datamodel):
    indent = {'indent': 2} if settings.DEBUG else {}
    return json.dumps(datamodel_to_seq(datamodel), **indent)
