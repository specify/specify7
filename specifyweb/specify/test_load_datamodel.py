from django.test import TestCase
from specifyweb.specify.models import datamodel

class DatamodelTests(TestCase):
    pass


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
