import logging
from . import model_extras
from specifyweb.specify.config import orderings

appname = __name__.split('.')[-2]
logger = logging.getLogger(__name__)

TAB = '    '
NEXT = ', '
CLOSE = ')\n'

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
    'text': 'models.TextField',
    'json': 'models.JSONField',
    'blob': 'models.BinaryField'
}

DJANGO_TO_MARIADB_MAP = {
    'models.CharField': 'VARCHAR',
    'models.TextField': 'TEXT',
    'models.DateTimeField': 'DATETIME',
    'models.IntegerField': 'INT',
    'models.BigIntegerField': 'BIGINT',
    'models.SmallIntegerField': 'SMALLINT',
    'models.DecimalField': 'DECIMAL',
    'models.FloatField': 'FLOAT',
    'models.BooleanField': 'TINYINT(1)',
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
            fields = ', '.join(f"'{field.lower()}'" for field in index.column_names)
            # code += f"{TAB}{TAB}{TAB}# models.Index(fields=[{fields}], name='{index.name}'),\n"
            code += f"{TAB}{TAB}{TAB}# models.Index(fields=[{fields}]),\n"
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
        f"db_index={field.indexed}",
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
        if hasattr(rel, 'otherSideName') and rel.otherSideName is not None:
            related_name = rel.otherSideName.lower()
        else:
            related_name = '+' # magic symbol means don't make reverse field

        foreign_table_name = related_model_name
        return (
            # f"{TAB}{rel.name} = {field_type_name}("
            f"{TAB}{rel.name.lower()} = {field_type_name}("
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
    return f"{TAB}id = models.AutoField(primary_key=True, db_column='{column.column.lower()}')\n"

def generate_model_class_code(table, datamodel) -> str:
    code = ''
    supercls = 'models.Model'
    if hasattr(table, 'sp7_only') and table.sp7_only != 'specify':
        return
    if hasattr(model_extras, table.django_name):
        supercls = getattr(model_extras, table.django_name).__name__
        code = f"class {table.django_name}(model_extras.{supercls}):\n"
    else:
        code = f"class {table.django_name}({supercls}):\n"

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
    if table.table not in ['specifyuser']:
        code += save_method_code()

    # code += f"{TAB}specify_model = '{table.table}'\n"
    code += f"{TAB}specify_model = datamodel.get_table('{table.table}')\n"

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

def build_model_code(module, datamodel, table_name):
    table = datamodel.get_table(table_name)
    model_code = generate_model_class_code(table, datamodel)
    return model_code
