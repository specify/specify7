from django.conf import settings
from xml.etree import ElementTree
import os

from sqlalchemy import Table, Column, ForeignKey, types, orm, MetaData

metadata = MetaData()

def make_table(datamodel, tabledef):
    columns = [make_id_field(tabledef.find('id'))]

    columns.extend(make_column(field) for field in tabledef.findall('field'))

    for reldef in tabledef.findall('relationship'):
        if reldef.attrib['type'] in ('many-to-one', 'one-to-one') \
               and 'columnname' in reldef.attrib:
            fk = make_foreign_key(datamodel, reldef)
            if fk is not None: columns.append(fk)

    return Table(get_table_name(tabledef), metadata, *columns)

def make_id_field(flddef):
    """Returns a primary key 'id' field based on the XML field definition
    from specify_datamodel.xml.
    """
    assert flddef.attrib['type'] == 'java.lang.Integer'
    db_column = flddef.attrib['column']
    return Column(db_column, types.Integer, primary_key=True)

def make_foreign_key(datamodel, reldef):
    reltype = reldef.attrib['type']
    nullable = reldef.attrib['required'] == 'false'

    column_name = reldef.attrib['columnname']
    one_to_one = (reltype == 'one-to-one')

    remote_tabledef = get_tabledef_for_class(datamodel, reldef.attrib['classname'])
    if remote_tabledef is None:
        return

    remote_table_id_column = remote_tabledef.find('id').attrib['column']
    fk_target = '.'.join((get_table_name(remote_tabledef), remote_table_id_column))

    return Column(column_name,
                  ForeignKey(fk_target),
                  nullable=nullable,
                  unique=one_to_one)

def make_column(flddef):
    args = dict(index    = (flddef.attrib['indexed'] == 'true'),
                unique   = (flddef.attrib['unique'] == 'true'),
                nullable = (flddef.attrib['required'] == 'false'))

    field_type = field_type_map[ flddef.attrib['type'] ]
    if 'length' in flddef.attrib and field_type in (types.Text, types.String):
        field_type = field_type(flddef.attrib['length'])

    return Column(flddef.attrib['column'], field_type, **args)

field_type_map = {'text'                 : types.Text,
                  'java.lang.String'     : types.String,
                  'java.lang.Integer'    : types.Integer,
                  'java.lang.Long'       : types.Integer,
                  'java.lang.Byte'       : types.Integer,
                  'java.lang.Short'      : types.Integer,
                  'java.util.Calendar'   : types.Date,
                  'java.util.Date'       : types.Date,
                  'java.lang.Float'      : types.Float,
                  'java.lang.Double'     : types.Float,
                  'java.sql.Timestamp'   : types.DateTime,
                  'java.math.BigDecimal' : types.Numeric,
                  'java.lang.Boolean'    : types.Boolean}

def get_class_name(tabledef):
    return tabledef.attrib['classname'].split('.')[-1]

def get_table_name(tabledef):
    return tabledef.attrib['table']

def get_datamodel():
    return ElementTree.parse(os.path.join(settings.SPECIFY_CONFIG_DIR, 'specify_datamodel.xml'))

def get_tabledef_for_class(datamodel, class_name):
    return datamodel.find('table[@classname="%s"]' % class_name)

def make_tables(datamodel):
    tabledefs = datamodel.findall('table')
    return dict((get_table_name(td), make_table(datamodel, td)) for td in tabledefs)

def make_classes(datamodel):
    tabledefs = datamodel.findall('table')
    return dict((class_name, type(class_name, (object,), { 'tableid': tableid, '_id': id_field }))
                for td in tabledefs
                for class_name in [ get_class_name(td) ]
                for tableid in [ int(td.attrib['tableid']) ]
                for id_field in [ td.find('id').attrib['name'] ])

def map_classes(datamodel, tables, classes):

    def map_class(tabledef):
        cls = classes[ get_class_name(tabledef) ]
        table = tables[ get_table_name(tabledef) ]

        def make_relationship(definition):
            name = definition.attrib['relationshipname']
            relationship_type = definition.attrib['type']

            try:
                remote_class = classes[
                    definition.attrib['classname'].split('.')[-1]]

                column = getattr(table.c, definition.attrib['columnname'])
            except KeyError:
                return

            relationship_args = {'foreign_keys': column}

            try:
                other_side_name = definition.attrib['othersidename']
            except KeyError:
                pass
            else:
                backref_args = {'uselist': relationship_type != 'one-to-one'}
                if remote_class is cls:
                    backref_args['remote_side'] = table.c[tabledef.find('id').attrib['column']]

                relationship_args['backref'] = orm.backref(other_side_name, **backref_args)

            return name, orm.relationship(remote_class, **relationship_args)

        properties = dict(relationship
                          for definition in tabledef.findall('relationship')
                          for relationship in [ make_relationship(definition) ]
                          if relationship is not None)

        properties.update((definition.attrib['name'], getattr(table.c, definition.attrib['column']))
                          for definition in tabledef.findall('id') + tabledef.findall('field'))


        orm.mapper(cls, table, properties=properties)

    tabledefs = datamodel.findall('table')
    for td in tabledefs:
        map_class(td)


