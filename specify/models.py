from django.db import models
from django.conf import settings
from xml.etree import ElementTree
import os
import re

from specify_jar import specify_jar

appname = __name__.split('.')[-2]

orderings = {
    'Recordsetitem': ('recordid', ),
}

cascade_delete = set([
        'Recordsetitem.recordset',
        'Determination.collectionobject',
])

def make_model(tabledef):
    modelname = tabledef.attrib['classname'].split('.')[-1].capitalize()
    attrs = dict(id=make_id_field(tabledef.find('id')),
                 tableid=int(tabledef.attrib['tableid']),
                 __module__=__name__)
    for flddef in tabledef.findall('field'):
        fldname = flddef.attrib['name'].lower()
        fldtype = flddef.attrib['type']
        maker = field_type_map[fldtype]
        fldargs = {}
        if fldname == 'timestampcreated':
            fldargs['auto_now_add'] = True
        if fldname == 'timestampmodified':
            fldargs['auto_now'] = True
        if fldname == 'version':
            fldargs['default'] = 0
        attrs[fldname.lower()] = maker(flddef, fldargs)
    for reldef in tabledef.findall('relationship'):
        relname = reldef.attrib['relationshipname'].lower()
        relationship = make_relationship(modelname, relname, reldef)
        if relationship is not None:
            attrs[relname] = relationship

    class Meta:
        db_table = tabledef.attrib['table']
        ordering = tuple()
        if modelname in orderings:
            ordering += orderings[modelname]
        if 'rankid' in attrs:
            ordering += ('rankid', )

    attrs['Meta'] = Meta
    return type(modelname, (models.Model,), attrs)

def make_id_field(flddef):
    assert flddef.attrib['type'] == 'java.lang.Integer'
    return models.AutoField(primary_key=True, db_column=flddef.attrib['column'])

def make_relationship(modelname, relname, reldef):
    relatedmodel = reldef.attrib['classname'].split('.')[-1].capitalize()
    # Usergroupscope breaks things.
    # I think maybe it is a superclass thing and not really a table?
    # Ignore it for now.
    if relatedmodel == 'Usergroupscope':
        return None
    reltype = reldef.attrib['type']
    null = reldef.attrib['required'] == 'false'
    editable = reldef.attrib['updatable'] == 'true'

    if reltype == 'one-to-many':
        return None # only define the to side of the relationship
    if reltype == 'many-to-many':
        return None
        try:
            jointable = reldef.attrib['jointable']
        except KeyError:
            return None # define the m2m on the side that names the jointable
        related_name = reldef.attrib['othersidename'].lower()
        return models.ManyToManyField('.'.join((appname, relatedmodel)),
                                      db_table=jointable,
                                      related_name=related_name,
                                      null=null, editable=editable)

    if '.'.join((modelname, relname)) in cascade_delete:
        on_delete = models.CASCADE
    else:
        on_delete = models.SET_NULL if null else models.DO_NOTHING

    def make_to_one(Field):
        try:
            related_name = reldef.attrib['othersidename'].lower()
        except KeyError:
            related_name = '+' # magic symbol means don't make reverse field
        column = reldef.attrib['columnname']
        return Field('.'.join((appname, relatedmodel)),
                     db_column=column, related_name=related_name,
                     null=null, on_delete=on_delete,
                     editable=editable)

    if reltype == 'many-to-one':
        return make_to_one(models.ForeignKey)

    if reltype == 'one-to-one' and 'columnname' in reldef.attrib:
        return make_to_one(models.OneToOneField)

class make_field(object):
    @classmethod
    def get_field_class(cls, flddef): return cls.field_class

    @classmethod
    def make_args(cls, flddef):
        return dict(
            db_column=flddef.attrib['column'],
            db_index=(flddef.attrib['indexed'] == 'true'),
            # For some reason setting unique makes
            # django complain mysql CharField
            # field length even when it is legal (<256).
            # So, just ignoring that option for now.
            #
            # unique=(flddef.attrib['unique'] == 'true'),
            editable=(flddef.attrib['updatable'] == 'true'),
            null=(flddef.attrib['required'] == 'false'),
            )

    def __new__(cls, flddef, fldargs):
        field_class = cls.get_field_class(flddef)
        args = cls.make_args(flddef)
        args.update(fldargs)
        return field_class(**args)

class make_string_field(make_field):
    field_class = models.CharField

    @classmethod
    def make_args(cls, flddef):
        args = super(make_string_field, cls).make_args(flddef)
        args.update(dict(
                max_length=flddef.attrib['length'],
                blank=(flddef.attrib['required'] == 'false'),
                ))
        return args

class make_text_field(make_field):
    field_class = models.TextField

class make_integer_field(make_field):
    field_class = models.IntegerField

class make_date_field(make_field):
    field_class = models.DateField

class make_float_field(make_field):
    field_class = models.FloatField

class make_datetime_field(make_field):
    field_class = models.DateTimeField

class make_decimal_field(make_field):
    field_class = models.DecimalField

    @classmethod
    def make_args(cls, flddef):
        args = super(make_decimal_field, cls).make_args(flddef)
        args.update(dict(
                # The precision info is not included in the
                # XML schema def. I don't think it really
                # matters what values are here since
                # the schema is already built.
                max_digits=22, decimal_places=10,
                blank=(flddef.attrib['required'] == 'false'),
                ))
        return args

class make_boolean_field(make_field):
    @classmethod
    def get_field_class(cls, flddef):
        if flddef.attrib['required'] == 'true':
            return models.BooleanField
        else:
            return models.NullBooleanField

field_type_map = {
    'text': make_text_field,
    'java.lang.String': make_string_field,
    'java.lang.Integer': make_integer_field,
    'java.lang.Long': make_integer_field,
    'java.lang.Byte': make_integer_field,
    'java.lang.Short': make_integer_field,
    'java.util.Calendar': make_date_field,
    'java.util.Date': make_date_field,
    'java.lang.Float': make_float_field,
    'java.lang.Double': make_float_field,
    'java.sql.Timestamp': make_datetime_field,
    'java.math.BigDecimal': make_decimal_field,
    'java.lang.Boolean': make_boolean_field,
    }

datamodel = ElementTree.parse(os.path.join(settings.SPECIFY_CONFIG_DIR, 'specify_datamodel.xml'))

models_by_tableid = dict((model.tableid, model) for model in map(make_model, datamodel.findall('table')))

globals().update((model.__name__, model) for model in models_by_tableid.values())


SPECIFY_VERSION = re.findall(r'SPECIFY_VERSION=(.*)',
                             specify_jar.read('resources_en.properties'))[0]

SCHEMA_VERSION = ElementTree.parse(os.path.join(settings.SPECIFY_CONFIG_DIR, 'schema_version.xml')).getroot().text

spversion = Spversion.objects.get()
assert spversion.appversion == SPECIFY_VERSION and spversion.schemaversion == SCHEMA_VERSION, """
       Specify version: %s, Schema Version: %s do not match database values: %s, %s
       Please update and/or run the host thickclient installation at %s
       to update the database.""" % (
       SPECIFY_VERSION, SCHEMA_VERSION, spversion.appversion, spversion.schemaversion,
       settings.SPECIFY_THICK_CLIENT)
