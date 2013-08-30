from django.db import models
from django.conf import settings
from xml.etree import ElementTree
import os

from businessrules import deletion_policies
from businessrules.exceptions import AbortSave

import model_extras

appname = __name__.split('.')[-2]

orderings = {
    'Picklistitem': ('ordinal', ),
    'Recordsetitem': ('recordid', ),
    'Spqueryfield': ('position', ),
}

def make_model(module, tabledef):
    """Returns a Django model class based on the specify_datamodel.xml
    definition of a Specify table.
    """
    modelname = tabledef.attrib['classname'].split('.')[-1].capitalize()
    attrs = dict(id=make_id_field(tabledef.find('id')),
                 table_id=int(tabledef.attrib['tableid']),
                 __module__=module)
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

    def save(self, *args, **kwargs):
        try:
            return super(model, self).save(*args, **kwargs)
        except AbortSave:
            return

    attrs['save'] = save
    attrs['Meta'] = Meta

    supercls = getattr(model_extras, modelname, models.Model)
    model = type(modelname, (supercls,), attrs)

    return model

def make_id_field(flddef):
    """Returns a primary key 'id' field based on the XML field definition
    from specify_datamodel.xml.
    """
    assert flddef.attrib['type'] == 'java.lang.Integer'
    return models.AutoField(primary_key=True, db_column=flddef.attrib['column'].lower())

def make_relationship(modelname, relname, reldef):
    """Return a Django relationship field for the given relationship definition.

    modelname - name of the model this field will be part of
    relname - name of the field
    reldef - the definition XML node
    """
    relatedmodel = reldef.attrib['classname'].split('.')[-1].capitalize()
    # Usergroupscope breaks things.
    # I think maybe it is a superclass thing and not really a table?
    # Ignore it for now.
    if relatedmodel == 'Usergroupscope':
        return None
    reltype = reldef.attrib['type']
    nullable = reldef.attrib['required'] == 'false'
    editable = reldef.attrib['updatable'] == 'true'

    if reltype == 'one-to-many':
        return None # only define the "to" side of the relationship
    if reltype == 'many-to-many':
        # skip many-to-many fields for now.
        return None
        try:
            jointable = reldef.attrib['jointable']
        except KeyError:
            return None # define the m2m on the side that names the jointable
        related_name = reldef.attrib['othersidename'].lower()
        return models.ManyToManyField('.'.join((appname, relatedmodel)),
                                      db_table=jointable,
                                      related_name=related_name,
                                      null=nullable, editable=editable)

    fieldname = '.'.join((modelname, relname))
    if  fieldname in deletion_policies.cascade:
        on_delete = models.CASCADE
    elif fieldname in deletion_policies.protect:
        on_delete = models.PROTECT
    else:
        on_delete = models.SET_NULL if nullable else models.DO_NOTHING

    def make_to_one(Field):
        """Setup a field of the given 'Field' type which can be either
        ForeignKey (many-to-one) or OneToOneField.
        """
        try:
            related_name = reldef.attrib['othersidename'].lower()
        except KeyError:
            related_name = '+' # magic symbol means don't make reverse field
        column = reldef.attrib['columnname'].lower()
        return Field('.'.join((appname, relatedmodel)),
                     db_column=column, related_name=related_name,
                     null=nullable, on_delete=on_delete,
                     editable=editable)

    if reltype == 'many-to-one':
        return make_to_one(models.ForeignKey)

    if reltype == 'one-to-one' and 'columnname' in reldef.attrib:
        return make_to_one(models.OneToOneField)

class make_field(object):
    """An abstract "psuedo" metaclass that produces instances of the
    appropriate Django model field type. Utilizes inheritance
    mechanism to factor out common aspects of Field configuration.
    """
    @classmethod
    def get_field_class(cls, flddef):
        """Return the Django model field class to be used for
        the given field definition. Defaults to returning the
        'field_class' attribute of the class, but can be overridden
        in subclass for more specific behavior.
        """
        return cls.field_class

    @classmethod
    def make_args(cls, flddef):
        """Return a dict of arguments for the field constructor
        based on the XML definition. These are common arguements
        used by most field types.
        """
        return dict(
            db_column=flddef.attrib['column'].lower(),
            db_index=(flddef.attrib['indexed'] == 'true'),
            unique=(flddef.attrib['unique'] == 'true'),
            editable=(flddef.attrib['updatable'] == 'true'),
            null=(flddef.attrib['required'] == 'false'),
            )

    def __new__(cls, flddef, fldargs):
        """Override the instance constructor to return configured instances
        of the appropriant Django model field for given parameters.

        flddef - the XML node defining the field
        fldargs - custom arguments for the field. will override any defaults.
        """
        field_class = cls.get_field_class(flddef)
        args = cls.make_args(flddef)
        args.update(fldargs)
        return field_class(**args)

class make_string_field(make_field):
    """A specialization of make_field that handles string type data."""
    field_class = models.CharField

    @classmethod
    def make_args(cls, flddef):
        """Supplement the standard field options with the 'length'
        and 'blank' options supported by the Django CharField type.
        """
        args = super(make_string_field, cls).make_args(flddef)
        args.update(dict(
                max_length=int( flddef.attrib['length'] ),
                blank=(flddef.attrib['required'] == 'false'),
                ))
        return args

class make_text_field(make_field):
    """A specialization of make_field for Text fields."""
    field_class = models.TextField

class make_integer_field(make_field):
    """A specialization of make_field for Integer fields."""
    field_class = models.IntegerField

class make_date_field(make_field):
    """A specialization of make_field for Date fields."""
    field_class = models.DateField

class make_float_field(make_field):
    """A specialization of make_field for Floating point number fields."""
    field_class = models.FloatField

class make_datetime_field(make_field):
    """A specialization of make_field for timestamp fields."""
    field_class = models.DateTimeField

class make_decimal_field(make_field):
    """A specialization of make_field for Decimal fields."""
    field_class = models.DecimalField

    @classmethod
    def make_args(cls, flddef):
        """Augment the standard field options with those specific
        to Decimal fields.
        """
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
    """A specialization of make_field for Boolean type fields."""
    @classmethod
    def get_field_class(cls, flddef):
        """Django differentiates between boolean fields which
        can contain nulls and those that cannot with different
        types.
        """
        if flddef.attrib['required'] == 'true':
            return models.BooleanField
        else:
            return models.NullBooleanField

# Map the field types used in specify_datamodel.xml to the
# appropriate field constructor functions.
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

def build_models(module):
    """Parse the specify_datamodel.xml file and generate the Django model definitions."""
    datamodel = ElementTree.parse(os.path.join(settings.SPECIFY_CONFIG_DIR, 'specify_datamodel.xml'))

    return dict((model.table_id, model)
                for table in datamodel.findall('table')
                for model in [ make_model(module, table) ])
