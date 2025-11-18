from specifyweb.specify.utils.autonumbering import get_tables_from_field_path
from specifyweb.specify.tests.test_api import ApiTests


class TestGetTablesFromFieldPath(ApiTests):

    def test_simple_path(self):
        tables = get_tables_from_field_path("Collectionobject", "cataloger")
        self.assertEqual(tables, ["agent"])

    def test_complex_path(self):
        tables = get_tables_from_field_path(
            "Collectionobject",
            "collectingevent__locality__geography__parent__definition__discipline",
        )
        self.assertEqual(
            tables,
            [
                "collectingevent",
                "locality",
                "geography",
                "geography",
                "geographytreedef",
                "discipline",
            ],
        )
