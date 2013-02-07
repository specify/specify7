from django.conf import settings
from xml.etree import ElementTree
import os

from sqlalchemy import Column, ForeignKey, types, orm
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

def make_model(module, tabledef):
    classname = tabledef.attrib['classname'].split('.')[-1].capitalize()


    attrs = dict(__tablename__ = tabledef.attrib['table'],
                 tableid       = int(tabledef.attrib['tableid']),
                 id            = make_id_field(tabledef.find('id')))

    for flddef in tabledef.findall('field'):
        fldname = flddef.attrib['name'].lower()
        fldtype = flddef.attrib['type']
        maker = field_type_map[fldtype]
        attrs[fldname.lower()] = maker(flddef)

    for reldef in tabledef.findall('relationship'):
        relname = reldef.attrib['relationshipname'].lower()
        relationship = make_relationship(classname, relname, reldef)
        if relationship is not None:
            attrs.update(relationship)

    return type(classname, (Base,), attrs)

def make_id_field(flddef):
    """Returns a primary key 'id' field based on the XML field definition
    from specify_datamodel.xml.
    """
    assert flddef.attrib['type'] == 'java.lang.Integer'
    db_column = flddef.attrib['column']
    return Column(db_column, types.Integer, primary_key=True)

def make_relationship(classname, relname, reldef):
    related_class = reldef.attrib['classname'].split('.')[-1].capitalize()
    # Usergroupscope breaks things.
    # I think maybe it is a superclass thing and not really a table?
    # Ignore it for now.
    if related_class == 'Usergroupscope':
        return None

    reltype = reldef.attrib['type']
    nullable = reldef.attrib['required'] == 'false'

    if reltype == 'one-to-many':
        return None # only define the "to" side of the relationship

    if reltype == 'many-to-many':
        # skip many-to-many fields for now.
        return None


    try:
        column_name = reldef.attrib['columnname']
    except KeyError:
        return None

    one_to_one = (reltype == 'one-to-one')

    relationship_args = dict(uselist = not one_to_one)

    try:
        related_name = reldef.attrib['othersidename'].lower()
    except KeyError:
        pass
    else:
        relationship_args['backref'] = orm.backref(related_name)

    fk = Column(column_name,
                ForeignKey(related_class + ".id", link_to_name=True),
                nullable=nullable,
                unique=one_to_one)

    return {column_name.lower(): fk,
            relname: orm.relationship(related_class, **relationship_args)}

def make_field(flddef):
    args = dict(index    = (flddef.attrib['indexed'] == 'true'),
                unique   = (flddef.attrib['unique'] == 'true'),
                nullable = (flddef.attrib['required'] == 'false'))

    field_type = field_type_map[ flddef.attrib['type'] ]
    if 'length' in flddef.attrib:
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

def build_models(module):
    """Parse the specify_datamodel.xml file and generate the Django model definitions."""
    datamodel = ElementTree.parse(os.path.join(settings.SPECIFY_CONFIG_DIR, 'specify_datamodel.xml'))

    return dict((model.tableid, model)
                for table in datamodel.findall('table')
                for model in [ make_model(module, table) ])
