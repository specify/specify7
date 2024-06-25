from django.test import TestCase
import sqlalchemy
from specifyweb.specify.build_models import build_models
from specifyweb.specify.datamodel import datamodel as sp7_datamodel
from specifyweb.specify.load_datamodel import load_datamodel
from specifyweb.specify.sp7_build_datamodel import build_datamodel_code_from_xml
from specifyweb.specify.sp7_build_models import build_model_code, generate_build_model_functions_code, \
    generate_build_model_imports_code
from specifyweb.specify.models_by_table_id import get_model_by_table_id as sp7_get_model_by_table_id
from specifyweb.stored_queries.sp7_build_models import gen_sqlalchemy_table_classes_code

class DatamodelTests(TestCase):
    
    def setUp(self):
        self.sp6_datamodel = load_datamodel()

    def test_specify_gen_models_code(self):
        if self.sp6_datamodel is None:
            return
        model_code = generate_build_model_imports_code()
        model_code += generate_build_model_functions_code()
        for table in self.sp6_datamodel.tables:
            table_name = table.name
            model_code += build_model_code(__name__, self.sp6_datamodel, table_name) or ''
        # Uncomment this code if you want generate the models code
        # with open('./specifyweb/specify/specify_models.py', 'w') as f:
        #     f.write(model_code)

    def test_specify_gen_datamodel_code(self):
        datamodel_code = build_datamodel_code_from_xml()
        # Uncomment this code if you want to generate the datamodel code
        # with open('./specifyweb/specify/specify_datamodel.py', 'w') as f:
        #     f.write(datamodel_code)

    def test_specify_gen_sqlalchemy_table_classes_code(self):
        datamodel = sp7_datamodel
        if self.sp6_datamodel is not None:
            datamodel = self.sp6_datamodel
        # Uncomment this code if you want generate the sqlalchemy models code
        # sqlalchemy_code = gen_sqlalchemy_table_classes_code(datamodel)
        # with open('/opt/specify7/specifyweb/stored_queries/specify_models.py', 'w') as f:
        #     f.write(sqlalchemy_code)

    def test_datamodel_equivalence(self):
        # sp7_datamodel = build_datamodel_code_from_xml()
        # sp6_datamodel = load_datamodel()
        if self.sp6_datamodel is None:
            return
        for sp6_table in self.sp6_datamodel.tables:
            django_table = sp7_datamodel.get_table(sp6_table.name)
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

for table in sp7_datamodel.tables:
    if table.attachments_field:
        setattr(DatamodelTests,
                'test_attachments_field_dependent_in_' + table.name,
                make_attachments_field_dependent_test(table))

def compare_models(dynamic_model, static_model):
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

def build_sp6_models(datamodel):
    model_by_tableid = build_models(__name__, datamodel)
    return model_by_tableid
