# from turtle import mode
from calendar import c
from multiprocessing.pool import CLOSE
import re
from django.db import models
from requests import get

from specifyweb.businessrules.exceptions import AbortSave
from . import model_extras

appname = __name__.split('.')[-2]

orderings = {
    'Picklistitem': ('ordinal', ),
    'Recordsetitem': ('recordid', ),
    'Spqueryfield': ('position', ),
    'Determination': ('-iscurrent',),
    'Author': ('ordernumber',),
    'Collector': ('ordernumber',),
    'AgentSpecialty': ('ordernumber',),
    'Determiner': ('ordernumber',),
    'Extractor': ('ordernumber',),
    'FieldNotebookPageSet': ('ordernumber',),
    'FundingAgent': ('ordernumber',),
    'GroupPerson': ('ordernumber',),
    'PcrPerson': ('ordernumber',),
}

def make_model(module, table, datamodel):
    """Returns a Django model class based on the
    definition of a Specify table.
    """
    attrs = dict(id = make_id_field(table.idColumn),
                 specify_model = table,
                 __module__ = module)

    for field in table.fields:
        fldname = field.name.lower()
        maker = field_type_map[field.type]
        fldargs = {}
        if fldname == 'timestampcreated':
            fldargs['auto_now_add'] = True
        if fldname == 'timestampmodified':
            fldargs['auto_now'] = True
        if fldname == 'version':
            fldargs['default'] = 0
        attrs[fldname] = maker(field, fldargs)

    for rel in table.relationships:
        relname = rel.name.lower()
        relationship = make_relationship(table.django_name, rel, datamodel)
        if relationship is not None:
            attrs[relname] = relationship

    class Meta:
        db_table = table.table
        ordering = tuple()
        if table.django_name in orderings:
            ordering += orderings[table.django_name]
        if 'rankid' in attrs:
            ordering += ('rankid', )

    def save(self, *args, **kwargs):
        try:
            return super(model, self).save(*args, **kwargs)
        except AbortSave:
            return

    attrs['save'] = save
    attrs['Meta'] = Meta

    supercls = getattr(model_extras, table.django_name, models.Model)
    model = type(table.django_name, (supercls,), attrs)

    return model

def make_id_field(column):
    return models.AutoField(primary_key=True, db_column=column.lower())

def protect(collector, field, sub_objs, using):
    if hasattr(collector, 'delete_blockers'):
        collector.delete_blockers.append((field, sub_objs))
    else:
        models.PROTECT(collector, field, sub_objs, using)

SPECIAL_DELETION_RULES = {
    'Agent.specifyuser': models.SET_NULL,
    'Recordsetitem.recordset': models.CASCADE,

    # Handle workbench deletion using raw sql in business rules.
    'Workbenchrow.workbench': models.DO_NOTHING,
    'Workbenchdataitem.workbenchrow': models.DO_NOTHING,
    'Workbenchrowimage.workbenchrow': models.DO_NOTHING,
    'Workbenchrowexportedrelationship.workbenchrow': models.DO_NOTHING,

    'Spappresourcedir.specifyuser': models.CASCADE,
    'Spappresource.specifyuser': models.CASCADE,
    'Spappresource.spappresourcedir': models.CASCADE,
    'Spappresourcedata.spappresource': models.CASCADE,
    'Spappresourcedata.spviewsetobj': models.CASCADE,
    'Spreport.appresource': models.CASCADE,
}

def make_relationship(modelname, rel, datamodel):
    """Return a Django relationship field for the given relationship definition.

    modelname - name of the model this field will be part of
    relname - name of the field
    rel - the relationship definition from the Specify datamodel
    """
    relatedmodel = rel.relatedModelName.capitalize()
    # Usergroupscope breaks things.
    # I think maybe it is a superclass thing and not really a table?
    # Ignore it for now.
    if relatedmodel == 'Usergroupscope':
        return models.IntegerField(db_column=rel.column, null=True)

    if rel.type == 'one-to-many':
        return None # only define the "to" side of the relationship
    if rel.type == 'many-to-many':
        # skip many-to-many fields for now.
        return None

    try:
        on_delete = SPECIAL_DELETION_RULES["%s.%s" % (modelname.capitalize(), rel.name.lower())]
    except KeyError:
        reverse = datamodel.reverse_relationship(rel)

        if reverse and reverse.dependent:
            on_delete = models.CASCADE
        else:
            on_delete = protect

    def make_to_one(Field):
        """Setup a field of the given 'Field' type which can be either
        ForeignKey (many-to-one) or OneToOneField.
        """
        if hasattr(rel, 'otherSideName'):
            related_name = rel.otherSideName.lower()
        else:
            related_name = '+' # magic symbol means don't make reverse field

        return Field('.'.join((appname, relatedmodel)),
                     db_column = rel.column,
                     related_name = related_name,
                     null = not rel.required,
                     on_delete = on_delete)

    if rel.type == 'many-to-one':
        return make_to_one(models.ForeignKey)

    if rel.type == 'one-to-one' and hasattr(rel, 'column'):
        return make_to_one(models.OneToOneField)

class make_field(object):
    """An abstract "psuedo" metaclass that produces instances of the
    appropriate Django model field type. Utilizes inheritance
    mechanism to factor out common aspects of Field configuration.
    """
    @classmethod
    def get_field_class(cls, fld):
        """Return the Django model field class to be used for
        the given field definition. Defaults to returning the
        'field_class' attribute of the class, but can be overridden
        in subclass for more specific behavior.
        """
        return cls.field_class

    @classmethod
    def make_args(cls, fld):
        """Return a dict of arguments for the field constructor
        based on the XML definition. These are common arguements
        used by most field types.
        """
        return dict(
            db_column = fld.column.lower(),
            db_index = fld.indexed,
            unique = fld.unique,
            null = not fld.required)

    def __new__(cls, fld, fldargs):
        """Override the instance constructor to return configured instances
        of the appropriant Django model field for given parameters.

        flddef - the XML node defining the field
        fldargs - custom arguments for the field. will override any defaults.
        """
        field_class = cls.get_field_class(fld)
        args = cls.make_args(fld)
        args.update(fldargs)
        return field_class(**args)

class make_string_field(make_field):
    """A specialization of make_field that handles string type data."""
    field_class = models.CharField

    @classmethod
    def make_args(cls, fld):
        """Supplement the standard field options with the 'length'
        and 'blank' options supported by the Django CharField type.
        """
        args = super(make_string_field, cls).make_args(fld)
        args.update(dict(
                max_length = fld.length,
                blank = not fld.required))
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
    def make_args(cls, fld):
        """Augment the standard field options with those specific
        to Decimal fields.
        """
        args = super(make_decimal_field, cls).make_args(fld)
        args.update(dict(
            # The precision info is not included in the
            # XML schema def. I don't think it really
            # matters what values are here since
            # the schema is already built.
            max_digits = 22,
            decimal_places = 10,
            blank = not fld.required))
        return args

class make_boolean_field(make_field):
    """A specialization of make_field for Boolean type fields."""
    field_class = models.BooleanField

    @classmethod
    def make_args(cls, fld):
        """Make False the default as it was in Django 1.5"""
        args = super(make_boolean_field, cls).make_args(fld)
        if fld.required:
            args['default'] = False
        return args

# Map the field types used in specify_datamodel.xml to the
# appropriate field constructor functions.
field_type_map = {
    'text': make_text_field,
    'java.lang.String': make_string_field,
    'java.lang.Integer': make_integer_field,
    'java.lang.Long': make_integer_field,
    'java.lang.Byte': make_integer_field,
    'java.lang.Short': make_integer_field,
    'java.util.Calendar': make_datetime_field,
    'java.util.Date': make_date_field,
    'java.lang.Float': make_float_field,
    'java.lang.Double': make_float_field,
    'java.sql.Timestamp': make_datetime_field,
    'java.math.BigDecimal': make_decimal_field,
    'java.lang.Boolean': make_boolean_field,
}

def build_models(module, datamodel):
    return { model.specify_model.tableId: model
             for table in datamodel.tables
             for model in [ make_model(module, table, datamodel) ]}

################################################################################

import logging
from django.db import models
# Import AbortSave if it's defined in another module
from specifyweb.businessrules.exceptions import AbortSave
# Ensure model_extras is accessible from this script's location
from . import model_extras

logger = logging.getLogger(__name__)

SAVE_METHOD_TEMPLATE = """
    def save(self, *args, **kwargs):
        try:
            # Custom save logic here, if necessary
            super().save(*args, **kwargs)
        except AbortSave as e:
            # Handle AbortSave exception as needed
            logger.error("Save operation aborted: %s", e)
            return
"""

def generate_custom_save_method():
    """
    Generates a custom save method, including exception handling.
    """
    return SAVE_METHOD_TEMPLATE


SPECIAL_DELETION_RULES_CODE = {
    'Agent.specifyuser': 'models.SET_NULL',
    'Recordsetitem.recordset': 'models.CASCADE',

    # Handle workbench deletion using raw sql in business rules.
    'Workbenchrow.workbench': 'models.DO_NOTHING',
    'Workbenchdataitem.workbenchrow': 'models.DO_NOTHING',
    'Workbenchrowimage.workbenchrow': 'models.DO_NOTHING',
    'Workbenchrowexportedrelationship.workbenchrow': 'models.DO_NOTHING',

    'Spappresourcedir.specifyuser': 'models.CASCADE',
    'Spappresource.specifyuser': 'models.CASCADE',
    'Spappresource.spappresourcedir': 'models.CASCADE',
    'Spappresourcedata.spappresource': 'models.CASCADE',
    'Spappresourcedata.spviewsetobj': 'models.CASCADE',
    'Spreport.appresource': 'models.CASCADE',
}

FIELD_TYPE_CODE_MAP = {
        'java.lang.String': 'models.CharField(max_length={})',
        'java.util.Calendar': 'models.DateTimeField()',
        'java.sql.Timestamp': 'models.DateTimeField()',
        'java.lang.Integer': 'models.IntegerField()',
        'java.lang.Long': 'models.BigIntegerField()',
        'java.lang.Byte': 'models.SmallIntegerField()',
        'java.lang.Short': 'models.SmallIntegerField()',
        'java.math.BigDecimal': 'models.DecimalField(max_digits=22, decimal_places=10)',
        'java.lang.Boolean': 'models.BooleanField(default=False)',
        'text': 'models.TextField()',
    }


def get_on_delete_action(model_name, relation_name):
    """Determines the on_delete action for a relationship based on special rules."""
    key = f"{model_name}.{relation_name}"
    return SPECIAL_DELETION_RULES_CODE.get(key, "models.PROTECT")

def generate_field_code(field):
    """Generates Django model field declarations from field specifications."""
    field_type_mapping = {
        'java.lang.String': 'models.CharField(max_length={})',
        'java.util.Calendar': 'models.DateTimeField()',
        'java.sql.Timestamp': 'models.DateTimeField()',
        'java.lang.Integer': 'models.IntegerField()',
        'java.lang.Long': 'models.BigIntegerField()',
        'java.lang.Byte': 'models.SmallIntegerField()',
        'java.lang.Short': 'models.SmallIntegerField()',
        'java.math.BigDecimal': 'models.DecimalField(max_digits=22, decimal_places=10)',
        'java.lang.Boolean': 'models.BooleanField(default=False)',
        'text': 'models.TextField()',
    }

    field_type = field_type_mapping.get(field['type'], 'models.CharField(max_length=255)')
    field_args = f"db_column='{field['column']}'"
    if '{}' in field_type:
        field_type = field_type.format(field['length'])
    if not field['required']:
        field_args += ", blank=True, null=True"
    if field['unique']:
        field_args += ", unique=True"
    if field['name'].lower() in ['timestampcreated', 'timestampmodified']:
        auto_now = 'auto_now_add=True' if field['name'].lower() == 'timestampcreated' else 'auto_now=True'
        field_type = 'models.DateTimeField(' + auto_now + ')'

    return f"{field['name']} = {field_type}({field_args})"

def generate_relationship_code(rel, model_name):
    """Generates Django model relationship field declarations."""
    on_delete_action = get_on_delete_action(model_name, rel['name'])
    related_name_option = f"related_name='{rel['related_name']}'" if 'related_name' in rel else ""
    field_line = f"{rel['name']} = models.{rel['type']}('{rel['related_model']}', on_delete={on_delete_action}, {related_name_option}, db_column='{rel['column']}')"
    return field_line

def generate_model_class(model_spec, model_name, app_label):
    """Generates a complete Django model class definition from specifications."""
    fields = [generate_field_code(field) for field in model_spec['fields']]
    relationships = [generate_relationship_code(rel, model_name) for rel in model_spec.get('relationships', [])]

    base_class = "models.Model"
    if model_name in dir(model_extras):
        base_class = f"model_extras.{model_name}"

    model_lines = [
        f"from django.db import models",
        f"from {app_label} import model_extras",
        f"from specifyweb.businessrules.exceptions import AbortSave",
        f"import logging",
        f"",
        f"logger = logging.getLogger(__name__)",
        f"",
        f"class {model_name}({base_class}):"
    ] + fields + relationships + [
        f"    class Meta:",
        f"        db_table = '{model_spec['db_table']}'",
        SAVE_METHOD_TEMPLATE
    ]

    return "\n".join(["    " + line if line else line for line in model_lines])

def test_model_code():
    model_spec = {
        "db_table": "my_model_table",
        "fields": [
            {"name": "id", "type": "java.lang.Integer", "column": "id", "length": 0, "required": True, "unique": True},
            # Add more field specs here
        ],
        "relationships": [
            # Define relationships here if any
        ]
    }

    # Generate the model class code
    model_code = generate_model_class(model_spec, "MyModel", "my_app")

################################################################################

def compare_models(dynamic_model, static_model):
    """
    Compares two Django model classes for equivalence in fields, Meta options, and inheritance.

    :param dynamic_model: The model class generated dynamically.
    :param static_model: The model class generated statically.
    :return: True if models are equivalent, False otherwise.
    """
    # Compare fields
    dynamic_fields = {f.name: f for f in dynamic_model._meta.get_fields()}
    static_fields = {f.name: f for f in static_model._meta.get_fields()}

    if set(dynamic_fields.keys()) != set(static_fields.keys()):
        print("Field names differ.")
        return False

    for field_name, dynamic_field in dynamic_fields.items():
        static_field = static_fields[field_name]
        if type(dynamic_field) != type(static_field):
            print(f"Field types for '{field_name}' differ: {type(dynamic_field)} != {type(static_field)}")
            return False

    # Compare Meta db_table
    if dynamic_model._meta.db_table != static_model._meta.db_table:
        print(f"Meta db_table differs: {dynamic_model._meta.db_table} != {static_model._meta.db_table}")
        return False

    # Compare inheritance
    dynamic_bases = set([base.__name__ for base in dynamic_model.__bases__])
    static_bases = set([base.__name__ for base in static_model.__bases__])

    if dynamic_bases != static_bases:
        print(f"Inheritance differs: {dynamic_bases} != {static_bases}")
        return False

    print("Models appear to be equivalent.")
    return True

################################################################################
# build models 2

TAB = '    '
NEXT = ', '
CLOSE = ')\n'

FIELD_TYPE_CODE_MAP = {
    'java.lang.String': 'models.CharField',
    'java.util.Calendar': 'models.DateTimeField',
    'java.util.Date': 'models.DateTimeField', # This mapping wasn't in the original code
    'java.sql.Timestamp': 'models.DateTimeField',
    'java.lang.Integer': 'models.IntegerField',
    'java.lang.Long': 'models.BigIntegerField',
    'java.lang.Byte': 'models.SmallIntegerField',
    'java.lang.Short': 'models.SmallIntegerField',
    'java.math.BigDecimal': 'models.DecimalField',
    'java.lang.Double': 'models.FloatField', # This mapping wasn't in the original code
    'java.lang.Boolean': 'models.BooleanField',
    'text': 'models.TextField'
}

def meta_class_code(table, attrs, indexes=[]):
    db_table = table.table
    ordering = tuple()
    if table.django_name in orderings:
        ordering += orderings[table.django_name]
    if 'rankid' in attrs:
        ordering += ('rankid', )
    # _meta 
    code = (
        f"{TAB}class Meta:\n"
        f"{TAB}{TAB}db_table = '{db_table}'\n"
        f"{TAB}{TAB}ordering = {ordering}\n"
    )
    if indexes:
        code += f"{TAB}{TAB}indexes = [\n"
        for index in indexes:
            fields = ', '.join(f"'{field}'" for field in index.column_names)
            code += f"{TAB}{TAB}{TAB}models.Index(fields=[{fields}], name='{index.name}'),\n"
        code = code[:-2] + code[-1] # remove trailing comma
        code += f"{TAB}{TAB}]\n"
    return code

def save_func_code(table) -> str:
    return (
        f"{TAB}def save(self, *args, **kwargs):\n"
        f"{TAB}{TAB}try:\n"
        f"{TAB}{TAB}{TAB}return super({table.django_name}, self).save(*args, **kwargs)\n"
        f"{TAB}{TAB}except AbortSave:\n"
        f"{TAB}{TAB}{TAB}return\n"
    )

def save_method_code() -> str:
    return f"{TAB}save = partialmethod(custom_save)\n"

def generate_sp_field_code(field) -> str:
    field_type = FIELD_TYPE_CODE_MAP.get(field.type)
    common_args = []
    code = f"{TAB}{field.name.lower()} = {field_type}("

    if field.name.lower() == 'timestampcreated':
        common_args.append("auto_now_add=True")
    elif field.name.lower() == 'timestampmodified':
        common_args.append("auto_now=True")
    elif field.name.lower() == 'timestampversion':
        pass # NOTE: should this be like timestampmodified?
    elif field.name.lower() == 'version':
        common_args.append("default=0")

    common_args = [
        f"blank={not field.required}",
        f"null={not field.required}",
        f"unique={field.unique}",
        f"db_column='{field.column}'",
        f"db_index='{field.column.lower()}'",
    ]

    if field.type == 'java.lang.String':
        common_args.insert(1, f"max_length={field.length}")
    elif field.type == 'java.math.BigDecimal':
        common_args.insert(1, "max_digits=22")
        common_args.insert(2, "decimal_places=10")

    if field.type == 'java.lang.Boolean' and field.required:
        common_args.insert(1, "default=False")

    code += NEXT.join(common_args) + CLOSE
    return code
    

def protect_code(collector, field, sub_objs, using) -> str:
    pass
    # # TODO: implement this
    # if hasattr(collector, 'delete_blockers'):
    #     # collector.delete_blockers.append((field, sub_objs))
    #     return ''
    # else:
    #     # models.PROTECT(collector, field, sub_objs, using)
    #     return 'models.PROTECT'

def generate_sp_relationship_field_code(modelname, rel, datamodel) -> str:
    relatedmodel = rel.relatedModelName.capitalize()
    if relatedmodel == 'Usergroupscope':
        return f"{TAB}{rel.column} = models.IntegerField(blank=True, null=True, db_column='{rel.column}')\n"
    
    if rel.type == 'one-to-many' or rel.type == 'many-to-many':
        return None
    
    try:
        on_delete = SPECIAL_DELETION_RULES_CODE["%s.%s" % (modelname.capitalize(), rel.name.lower())]
    except KeyError:
        reverse = datamodel.reverse_relationship(rel)

        if reverse and reverse.dependent:
            on_delete = 'models.CASCADE'
        else:
            # on_delete = 'protect'
            on_delete = 'protect_with_blockers'

    def generate_rel_to_one_code(field_type_name, related_model_name) -> str:
        """Setup a field of the given 'Field' type which can be either
        ForeignKey (many-to-one) or OneToOneField.
        """
        if hasattr(rel, 'otherSideName'):
            related_name = rel.otherSideName.lower()
        else:
            related_name = '+' # magic symbol means don't make reverse field

        # foreign_table_name = getattr(sp_models, relatedmodel)
        foreign_table_name = related_model_name

        # return f"{rel.name} = {field_type_name}('{foreign_table_name}', db_column='{rel.column}', related_name='{related_name}', null={not rel.required}, on_delete={on_delete})\n"
        return (
            f"{TAB}{rel.name} = {field_type_name}("
            f"'{foreign_table_name}'{NEXT}"
            f"db_column='{rel.column}'{NEXT}"
            f"related_name='{related_name}'{NEXT}"
            f"null={not rel.required}{NEXT}"
            f"on_delete={on_delete})\n"
        )

    if rel.type == 'many-to-one':
        return generate_rel_to_one_code('models.ForeignKey', rel.relatedModelName)
    if rel.type == 'one-to-one' and hasattr(rel, 'column'):
        return generate_rel_to_one_code('models.OneToOneField', rel.relatedModelName)

def generate_id_field_code(column) -> str:
    # return f"{column.name.lower()} = models.AutoField(primary_key=True, db_column='{column.column}')\n"
    return f"{TAB}id = models.AutoField(primary_key=True, db_column='{column.column.lower()}')\n"

def generate_model_class_code(table, datamodel) -> str:
    supercls = 'models.Model'
    if hasattr(model_extras, table.django_name):
        supercls = getattr(model_extras, table.django_name).__name__
    
    code = f"class {table.django_name}(model_extras.{supercls}):\n"

    # for field in table.fields:
    #     fldname = field.name.lower()
    #     maker_code = FIELD_TYPE_CODE_MAP[field.type]
    #     field_code_line = TAB + f"{fldname} = {maker_code}("
    #     fldargs = {}
    #     if fldname == 'timestampcreated':
    #         fldargs['auto_now_add'] = True
    #     if fldname == 'timestampmodified':
    #         fldargs['auto_now'] = True
    #     if fldname == 'version':
    #         fldargs['default'] = 0
    #     # code += TAB + f"{fldname} = {maker_code(field, fldargs)}\n"
    #     # code += TAB + f"{fldname} = {maker_code}({field}, fldargs)}\n"

    # Add code for ID field
    code += f"{TAB}# ID Field\n"
    code += generate_id_field_code(table.idField)
    
    # Add code for fields
    code += "\n" + TAB + "# Fields\n"
    for field in table.fields:
        code += generate_sp_field_code(field)
    
    # Add code for relationships
    one_to_one_rels = list(filter(lambda r: r.type == "one-to-one", table.relationships))
    if one_to_one_rels:
        code += "\n" + TAB + "# Relationships: One-to-One\n"
        for rel in one_to_one_rels:
            rel_code_line = generate_sp_relationship_field_code(table.django_name, rel, datamodel)
            if rel_code_line is not None:
                code += rel_code_line

    many_to_one_rels = list(filter(lambda r: r.type == "many-to-one", table.relationships))
    if many_to_one_rels:
        code += "\n" + TAB + "# Relationships: Many-to-One\n"
        for rel in many_to_one_rels:
            rel_code_line = generate_sp_relationship_field_code(table.django_name, rel, datamodel)
            if rel_code_line is not None:
                code += rel_code_line

    code += '\n'

    # Add code for Meta class
    code += meta_class_code(table, table.fields, table.indexes) + "\n"

    # Add code for save method, if needed
    # code += save_func_code(table)
    code += save_method_code()

    code += '\n'
    return code

def generate_build_model_imports_code() -> str:
    return (
        "from functools import partialmethod\n"
        "from django.db import models\n"
        "#from specifyweb.specify.test_load_datamodel import model_extras\n"
        "from specifyweb.businessrules.exceptions import AbortSave\n"
        "from . import model_extras\n"
        "import logging\n\n"
        "logger = logging.getLogger(__name__)\n"
    )

def generate_build_model_functions_code() -> str:
    protect_with_blockers_code = (
        "def protect_with_blockers(collector, field, sub_objs, using):\n"
        "    if hasattr(collector, 'delete_blockers'):\n"
        "        collector.delete_blockers.append((field, sub_objs))\n"
        "    else:\n"
        "        return models.PROTECT(collector, field, sub_objs, using)\n"
    )
    custom_save_code = (
        "def custom_save(self, *args, **kwargs):\n"
        "    try:\n"
        "        # Custom save logic here, if necessary\n"
        "        super(self.__class__, self).save(*args, **kwargs)\n"
        "    except AbortSave as e:\n"
        "        # Handle AbortSave exception as needed\n"
        "        logger.error(\"Save operation aborted: %s\", e)\n"
        "        return\n"
    )
    return f"\n{protect_with_blockers_code}\n{custom_save_code}"

################################################################################

# from specify_tables import datamodel as specify_datamodel

# import inspect
# print(inspect.getsource(sp_models.Accession.save))

# def build_model(module):
#     table = specify_datamodel.tables[0]

from . import models as sp_models

def build_model_spec(table):
    # id_field = [f for f in table.fields if f.name == 'id'][0]
    model_spec = {
        "db_table": table.name,
        "fields": [
            {"name": f.name,
             "type": f.type,
             "column": f.column,
             "length": f.length if hasattr(f, 'length') else None,
             "required": f.required, "unique": f.unique}
            for f in table.fields
            if f.name != 'id'
        ],
        "relationships": [
            {"name": f.name,
             "type": f.type,
             "related_model": getattr(sp_models. f.relatedModelName),
             "related_name": f.relatedModelName}
            for f in table.relationships
            if hasattr(f, 'is_relation') and f.is_relation and f.name != 'id'
        ],
        "id_field": {
            "name": table.idField.name,
            "type": table.idField.type,
            "column": table.idField.column,
            "required": table.idField.required,
        },
    }
    return model_spec

def build_model_code(module, datamodel, table_name):
    table = datamodel.get_table(table_name)
    # model = make_model(module, table, datamodel)
    # model = getattr(sp_models, table_name)
    model_spec = build_model_spec(table)
    model_code_1 = generate_model_class(model_spec, table_name, module)
    model_code_2 = generate_model_class_code(table, datamodel)
    return model_code_2
