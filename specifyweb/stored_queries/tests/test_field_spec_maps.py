from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.stored_queries.field_spec_maps import apply_specify_user_name
from specifyweb.stored_queries.tests.utils import make_query_fields_test


class TestFieldSpecMaps(ApiTests):
    
    def test_noop_co_table(self):
        
        _, query_field = make_query_fields_test("Collectionobject", [['catalognumber']])
        query_field = query_field[0]
        query_field_new = apply_specify_user_name(query_field, self.specifyuser)
        self.assertEqual(query_field, query_field_new)

    def test_noop_apply_specifyuser(self):
        
        _, query_field = make_query_fields_test("Collectionobject", [['createdbyagent', 'specifyuser', 'name']])
        query_field = query_field[0]
        query_field = query_field._replace(value="DNE")
        query_field_new = apply_specify_user_name(query_field, self.specifyuser)
        self.assertEqual(query_field_new, query_field)

    def test_apply_specifyuser(self):
        
        _, query_field = make_query_fields_test("Collectionobject", [['createdbyagent', 'specifyuser', 'name']])
        query_field = query_field[0]
        query_field = query_field._replace(value="currentSpecifyUserName")
        query_field_new = apply_specify_user_name(query_field, self.specifyuser)
        self.assertEqual(query_field_new.value, self.specifyuser.name)
