from json import load
from django.test import TestCase
# from specifyweb.specify import load_datamodel
# from specifyweb.specify.models import datamodel as sp6_datamodel #models_by_tableid as sp6_models_by_tableid
from specifyweb.specify.specify_build_datamodel import build_datamodel_code_from_xml, gen_datamodel_code
from specifyweb.specify.specify_build_models import build_model_code, generate_build_model_functions_code, generate_build_model_imports_code, compare_models
from .specify_datamodel import datamodel as django_datamodel
from .datamodel import datamodel as sp6_datamodel

# import specifyweb.specify.specify_models as django_models
# import specifyweb.specify.models as sp6_models
# from .build_models import build_models

def java_type_to_python(java_type):
    """
    Simplistic conversion from Java types to Python types for demonstration purposes.
    You may need to adjust these mappings based on your specific use case.
    """
    mappings = {
        "java.lang.String": "str",
        "java.util.Calendar": "datetime.datetime",
        "java.lang.Integer": "int",
        "java.math.BigDecimal": "decimal.Decimal",
        "java.lang.Boolean": "bool",
        "java.sql.Timestamp": "datetime.datetime",
        "text": "str",  # Assuming custom handling for text types
    }
    return mappings.get(java_type, "object")

def generate_class_definition(class_name, fields, relationships):
    """
    Generates Python class definition from given fields and relationships.
    """
    class_def = f"class {class_name}:\n"
    class_def += "    def __init__(self):\n"
    for field_name, field_type in fields:
        class_def += f"        self.{field_name}: {field_type} = None\n"
    for rel_name, rel_type in relationships:
        if "List" in rel_type:
            class_def += f"        self.{rel_name}: {rel_type} = []\n"
        else:
            class_def += f"        self.{rel_name}: {rel_type} = None\n"
    return class_def

def prtab(output):
    return output + '    '
    # output += f"    "

def declare_specify_field(field, output, table_name):
    # output += f"\nclass {field.name}:\n"
    # column: str # title
    # output += f"    column = '{field.column}'\n"
    # indexed: bool
    # is_relationship: bool
    # length: int
    # name: str # cammel case
    # required: bool
    # type: str # java type
    # unique: bool

    output += f"{table_name}_{field.name} = Field()\n"
    output += f"{table_name}_{field.name}.column = '{field.column}'\n"
    output += f"{table_name}_{field.name}.indexed = {field.indexed}\n"
    output += f"{table_name}_{field.name}.is_relationship = {field.is_relationship}\n"
    output += f"{table_name}_{field.name}.length = {field.length}\n" if hasattr(field, 'length') else ""
    output += f"{table_name}_{field.name}.name = '{field.name}'\n"
    output += f"{table_name}_{field.name}.required = {field.required}\n"
    output += f"{table_name}_{field.name}.type = '{field.type}'\n"
    output += f"{table_name}_{field.name}.unique = {field.unique}\n"
    output += "\n"
    return output

def declare_specify_idfield(field, output, table_name):
    # column: str # title
    # indexed: bool
    # is_relationship: bool
    # length: int
    # name: str # cammel case
    # required: bool
    # type: str # java type
    # unique: bool
    
    output += f"{table_name}_{field.name} = IdField()\n"
    output += f"{table_name}_{field.name}.column = '{field.column}'\n"
    output += f"{table_name}_{field.name}.indexed = {field.indexed}\n" if hasattr(field, 'indexed') else ""
    output += f"{table_name}_{field.name}.is_relationship = {field.is_relationship}\n" if hasattr(field, 'is_relationship') else ""
    output += f"{table_name}_{field.name}.length = {field.length}\n" if hasattr(field, 'length') else ""
    output += f"{table_name}_{field.name}.name = '{field.name}'\n"
    output += f"{table_name}_{field.name}.required = {field.required}\n"
    output += f"{table_name}_{field.name}.type = '{field.type}'\n"
    output += f"{table_name}_{field.name}.unique = {field.unique}\n" if hasattr(field, 'unique') else ""
    output += "\n"
    return output

def declare_specify_relationship(relationship, output, table_name):
    # dependent: bool
    # is_relationship: bool
    # name: str # cammel case
    # otherSideName: str # cammel case
    # relatedModelName: str # title
    # required: bool
    # type: str # relationship type 'one-to-one', 'one-to-many', 'many-to-one', 'many-to-many'
    
    output += f"{table_name}_{relationship.name} = Relationship()\n"
    output += f"{table_name}_{relationship.name}.dependent = {relationship.dependent}\n"
    output += f"{table_name}_{relationship.name}.is_relationship = {relationship.is_relationship}\n"
    output += f"{table_name}_{relationship.name}.name = '{relationship.name}'\n"
    output += f"{table_name}_{relationship.name}.otherSideName = '{relationship.otherSideName}'\n" if hasattr(relationship, 'otherSideName') else ""
    output += f"{table_name}_{relationship.name}.relatedModelName = '{relationship.relatedModelName}'\n" if hasattr(relationship, 'relatedModelName') else ""
    output += f"{table_name}_{relationship.name}.required = {relationship.required}\n"
    output += f"{table_name}_{relationship.name}.type = '{relationship.type}'\n"
    output += "\n"
    return output

def declare_specify_table(table, output):
    # all_fields: List[Field]
    # attachments_field:
    # classname # specify 6 class name
    # django_name: str # title
    # fieldAliases: List[Dict[str, str]]
    # fields: List[Field]
    # relationships: List[Relationship]
    # idColumn: str
    # idField: IdField
    # idFieldName: str # cammel case
    # is_attachment_jointable: bool
    # name: str # title
    # searchDialog: str # title
    # system: bool
    # table: str # cammel case
    # tableid: int
    # view: str # title

    output += "##################################################\n"
    output += f"# Table: {table.name}\n"
    output += "##################################################\n\n"
    
    output += f"{table.name}: Table = Table()\n"
    output += f"{table.name}.system = False\n"
    output += f"{table.name}.classname = \"{table.classname}\"\n"
    output += f"{table.name}.table = '{table.table}'\n"
    output += f"{table.name}.tableId = {table.tableId}\n"
    output += f"{table.name}.idColumn = '{table.idColumn}'\n"
    output += f"{table.name}.idFieldName = '{table.idFieldName}'\n"
    output += f"{table.name}.name = '{table.name}'\n"
    output += f"{table.name}.django_name = '{table.django_name}'\n"
    output += f"{table.name}.searchDialog = '{table.searchDialog}'\n" if hasattr(table, 'searchDialog') else ""
    output += f"{table.name}.view = '{table.view}'\n" if hasattr(table, 'view') else ""
    output += f"{table.name}.is_attachment_jointable = {table.is_attachment_jointable}\n"

    output += f"\n# {table.name} Fields\n"
    for field in table.fields:
        output = declare_specify_field(field, output, table.name)
    output += f"{table.name}.fields = ["
    for field in table.fields:
        output += f"{table.name}_{field.name}, "
    output += f"]\n"

    output += f"\n# {table.name} Relationships\n"
    for relationship in table.relationships:
        output = declare_specify_relationship(relationship, output, table.name)
    output += f"{table.name}.relationships = ["
    for relationship in table.relationships:
        output += f"{table.name}_{relationship.name}, "
    output += f"]\n"

    output += f"\n# {table.name} ID Field\n"
    output = declare_specify_idfield(table.idField, output, table.name)
    output += f"{table.name}.idField = {table.name}_{table.idField.name}\n"

    output += f"\n# {table.name} Attachments Field\n"
    output += f"{table.name}.attachments_field = {table.name}_{table.attachments_field.name}\n" if hasattr(table, 'attachments_field') and table.attachments_field is not None else ""

    output += f"\n# {table.name} All Fields\n"
    output += f"{table.name}.all_fields = ["
    for field in table.all_fields:
        output += f"{table.name}_{field.name}, "
    output += f"]\n"
    
    output += f"{table.name}.fieldAliases = [\n"
    for fieldAlias in table.fieldAliases:
        output += f"    {fieldAlias},\n"
    output += f"]\n"

    output += f"\n"
    for field in table.fields:
        output += f"del {table.name}_{field.name}; "
    for relationship in table.relationships:
        output += f"del {table.name}_{relationship.name}; "
    output += f"del {table.name}_{table.idField.name}; "

    output += f"\n\n"

    return output

class DatamodelTests(TestCase):
    def test_specify_tables(self):
        output = "from .load_datamodel import *\n\n"
        for table in sp6_datamodel.tables:
            print(table.name)
            output += declare_specify_table(table, "")
        output += "datamodel: Datamodel = Datamodel()\n"
        output += "datamodel.tables = ["
        for table in sp6_datamodel.tables:
            output += f"{table.name}, "
        output += "]\n"

        with open('/opt/specify7/specifyweb/specify/specify_tables.py', 'w') as f:
            f.write(output)

    def test_single_specify_table(self):
        table = sp6_datamodel.tables[4]
        print(table.name)
        output = declare_specify_table(table, "")
        print(output)

    def test_specify_models(self):
        # models_by_tableid = build_models(__name__, sp6_datamodel)
        # for table_id, model_class in models_by_tableid.items():
        #     pass
        pass

    def test_specify_model_code(self):
        # table_name = 'Accession'
        table_name = 'Spprincipal' # userGroupScopeID is in relations and not indented
        # table_name = 'SpTimestampedModel'
        # table_name = 'Storage' # inherits itself instead of models.Model, also happing with Geography, Geologictimeperiod, Lithostrat, Preparation, Specifyuser, Taxon
        model_code = ""
        # model_code += generate_build_model_imports_code()
        # model_code += generate_build_model_functions_code()
        model_code += build_model_code(__name__, sp6_datamodel, table_name)
        print(model_code)
        # with open('./specifyweb/specify/specify_models.py', 'w') as f:
        #     f.write(model_code)

    def test_specify_models_code(self):
        model_code = generate_build_model_imports_code()
        model_code += generate_build_model_functions_code()
        for table in sp6_datamodel.tables:
            table_name = table.name
            model_code += build_model_code(__name__, sp6_datamodel, table_name)

        with open('./specifyweb/specify/specify_models.py', 'w') as f:
            f.write(model_code)
            
    # def test_compare_models(self): # TODO: get the imports correct and get the test working
    #     # sp6_models_by_tableid = build_models(__name__, sp6_datamodel)
    #     # for sp6_table_id, sp6_model_class in sp6_models_by_tableid.items():
    #     for sp6_table_id, sp6_model_class in sp6_models.models_by_tableid.items():
    #         dynamic_model = sp6_model_class
    #         # static_model = models_by_tableid[sp6_table_id]
    #         # static_model = django_models_by_tableid[sp6_table_id]
    #         static_model = getattr(django_models, sp6_model_class.__name__)
    #         compare_models(dynamic_model, static_model)
    #     pass
    
    def test_models_equivalence(self):
        pass

    def test_specify_gen_datamodel_code(self):
        datamodel_code = build_datamodel_code_from_xml()
        # print(datamodel_code)
        print("writing to specify_datamodel.py")
        with open('./specifyweb/specify/specify_datamodel.py', 'w') as f:
            f.write(datamodel_code)

    def test_datamodel_equivalence(self):
        # django_datamodel = build_datamodel_code_from_xml()
        # sp6_datamodel = load_datamodel()
        for sp6_table in sp6_datamodel.tables:
            django_table = django_datamodel.get_table(sp6_table.name)
            self.assertIsNotNone(django_table)
            self.assertEqual(sp6_table.name, django_table.name)
            self.assertEqual(sp6_table.table, django_table.table)
            self.assertEqual(sp6_table.tableId, django_table.tableId)
            self.assertEqual(sp6_table.idColumn, django_table.idColumn)
            self.assertEqual(sp6_table.idFieldName, django_table.idFieldName)
            self.assertEqual(sp6_table.classname, django_table.classname)
            self.assertEqual(sp6_table.django_name, django_table.django_name)
            self.assertEqual(sp6_table.system, django_table.system)
            if hasattr(sp6_table, 'searchDialog'):
                self.assertEqual(sp6_table.searchDialog, django_table.searchDialog)
            else:
                self.assertIsNone(django_table.searchDialog)
            if hasattr(sp6_table, 'view'):    
                self.assertEqual(sp6_table.view, django_table.view)
            else:
                self.assertIsNone(django_table.view)
            self.assertEqual(sp6_table.is_attachment_jointable, django_table.is_attachment_jointable)
            self.assertEqual(len(sp6_table.fieldAliases), len(django_table.fieldAliases))
            if sp6_table.attachments_field is not None:
                self.assertEqual(sp6_table.attachments_field.name, django_table.attachments_field.name)
                self.assertEqual(sp6_table.attachments_field.otherSideName, django_table.attachments_field.otherSideName)

            sp6_idfield = sp6_table.idField
            django_idfield = django_table.idField
            self.assertEqual(sp6_idfield.column, django_idfield.column)
            self.assertEqual(sp6_idfield.type, django_idfield.type)
            self.assertEqual(sp6_idfield.name, django_idfield.name)
            self.assertEqual(sp6_idfield.required, django_idfield.required)

            for sp6_index in sp6_table.indexes:
                django_index = django_table.get_index(sp6_index.name)
                self.assertEqual(sp6_index.name, django_index.name)
                self.assertEqual(sp6_index.column_names, django_index.column_names)

            for sp6_field in sp6_table.fields:
                django_field = django_table.get_field(sp6_field.name)
                self.assertIsNotNone(django_field)
                self.assertEqual(sp6_field.column, django_field.column)
                self.assertEqual(sp6_field.indexed, django_field.indexed)
                self.assertEqual(sp6_field.is_relationship, django_field.is_relationship)
                if hasattr(sp6_field, 'length'):
                    self.assertEqual(sp6_field.length, django_field.length)
                else:
                    self.assertIsNone(django_field.length)
                self.assertEqual(sp6_field.name, django_field.name)
                self.assertEqual(sp6_field.required, django_field.required)
                self.assertEqual(sp6_field.type, django_field.type)
                self.assertEqual(sp6_field.unique, django_field.unique)

            for sp6_relationship in sp6_table.relationships:
                django_relationship = django_table.get_relationship(sp6_relationship.name)
                self.assertIsNotNone(django_relationship)
                self.assertEqual(sp6_relationship.dependent, django_relationship.dependent)
                self.assertEqual(sp6_relationship.is_relationship, django_relationship.is_relationship)
                self.assertEqual(sp6_relationship.name, django_relationship.name)
                if hasattr(sp6_relationship, 'otherSideName'):
                    self.assertEqual(sp6_relationship.otherSideName, django_relationship.otherSideName)
                else:
                    self.assertIsNone(django_relationship.otherSideName)
                self.assertEqual(sp6_relationship.relatedModelName, django_relationship.relatedModelName)
                self.assertEqual(sp6_relationship.required, django_relationship.required)
                self.assertEqual(sp6_relationship.type, django_relationship.type)
                # for sp6_relationship_2 in sp6_table.relationships:
                #     django_relationship_2 = django_table.get_relationship(sp6_relationship_2.name)
                #     self.assertEqual(sp6_relationship.reverse_relationship(sp6_relationship_2),
                #                      django_relationship.reverse_relationship(django_relationship_2))


def make_attachments_field_dependent_test(table):
    def test(self):
        self.assertTrue(table.attachments_field.dependent,
                        table.name + '.' + table.attachments_field.name +
                        ' should be dependent')
    return test

for table in sp6_datamodel.tables:
    if table.attachments_field:
        setattr(DatamodelTests,
                'test_attachments_field_dependent_in_' + table.name,
                make_attachments_field_dependent_test(table))
