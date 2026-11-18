from django.test import TestCase
from specifyweb.specify.datamodel import datamodel
from specifyweb.specify.models_utils.sp7_build_models import build_model_code, generate_build_model_functions_code, \
    generate_build_model_imports_code

class DatamodelTests(TestCase):
    
    def test_specify_gen_models_code(self):
        model_code = generate_build_model_imports_code()
        model_code += generate_build_model_functions_code()
        for table in datamodel.tables:
            table_name = table.name
            model_code += build_model_code(__name__, datamodel, table_name) or ''
        # Uncomment this code if you want generate the models code
        # with open('./specifyweb/specify/specify_models.py', 'w') as f:
        #     f.write(model_code)

        
def make_attachments_field_dependent_test(table):
    def test(self):
        self.assertTrue(table.attachments_field.dependent,
                        table.name + '.' + table.attachments_field.name +
                        ' should be dependent')
    return test

for table in datamodel.tables:
    if table.attachments_field:
        setattr(DatamodelTests,
                'test_attachments_field_dependent_in_' + table.name,
                make_attachments_field_dependent_test(table))
