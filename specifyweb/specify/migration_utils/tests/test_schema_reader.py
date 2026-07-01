import unittest
from unittest.mock import patch, MagicMock
from types import SimpleNamespace
from collections import defaultdict

from ..schema_reader import (
    _has_explicit_hidden_override,
    _schema_override_hidden_values_for_discipline,
    _schema_override_hidden_fields_for_discipline,
    _fields_without_explicit_hidden_override,
    datamodel_type_to_schematype,
    camel_to_spaced_title_case,
    uncapitilize,
    find_missing_schema_config_fields,
)


class SchemaReaderTests(unittest.TestCase):
    def setUp(self):
        _schema_override_hidden_values_for_discipline.cache_clear()

    def tearDown(self):
        _schema_override_hidden_values_for_discipline.cache_clear()

    def test_has_explicit_hidden_override(self):
        self.assertTrue(_has_explicit_hidden_override({"isHidden": True}))
        self.assertTrue(_has_explicit_hidden_override({"ISHIDDEN": False}))
        self.assertFalse(_has_explicit_hidden_override({"other": "value"}))

    @patch('specifyweb.specify.migration_utils.schema_reader.logger')
    @patch('specifyweb.specify.migration_utils.schema_reader.json')
    @patch('specifyweb.specify.migration_utils.schema_reader.Path')
    @patch('specifyweb.specify.migration_utils.schema_reader.settings')
    def test_schema_override_hidden_values_for_discipline(
        self,
        mock_settings,
        mock_path,
        mock_json,
        mock_logger,
    ):
        mock_settings.SPECIFY_CONFIG_DIR = "/config"

        fake_json_data = {
            "collectionobject": {
                "items": [
                    {
                        "catalogNumber": {"isHidden": True},
                        "availability": {"otherSetting": "value"}
                    }
                ]
            }
        }

        mock_path_instance = MagicMock()
        mock_path.return_value = mock_path_instance
        mock_path_instance.__truediv__.return_value = mock_path_instance
        mock_path_instance.exists.return_value = True

        with patch(
            "specifyweb.specify.migration_utils.schema_reader.json.load",
            return_value=fake_json_data,
        ):
            result = _schema_override_hidden_values_for_discipline("bird")

        self.assertEqual(result, {
            "collectionobject": {"catalognumber": True}
        })

    def test_schema_override_hidden_fields_for_discipline(self):
        with patch(
            'specifyweb.specify.migration_utils.schema_reader._schema_override_hidden_values_for_discipline'
        ) as mock_hidden_values:

            mock_hidden_values.return_value = {
                "table1": {"field1": True, "field2": False},
                "table2": {"field3": True}
            }

            result = _schema_override_hidden_fields_for_discipline("biology")

            self.assertEqual(result, {
                "table1": {"field1", "field2"},
                "table2": {"field3"}
            })

    def test_fields_without_explicit_hidden_override(self):
        with patch(
            'specifyweb.specify.migration_utils.schema_reader._schema_override_hidden_fields_for_discipline'
        ) as mock_hidden_fields:

            mock_hidden_fields.return_value = {
                "collectionobject": {"catalognumber", "availability"}
            }

            result = _fields_without_explicit_hidden_override(
                "CollectionObject",
                ["catalogNumber", "field1", "field2"],
                "bird"
            )

            self.assertEqual(result, ["field1", "field2"])

    def test_datamodel_type_to_schematype(self):
        self.assertEqual(datamodel_type_to_schematype("many-to-one"), "ManyToOne")
        self.assertEqual(datamodel_type_to_schematype("one-to-many"), "OneToMany")
        self.assertEqual(datamodel_type_to_schematype("many-to-many"), "ManyToMany")

    def test_camel_to_spaced_title_case(self):
        self.assertEqual(camel_to_spaced_title_case("catalogNumber"), "Catalog Number")
        self.assertEqual(camel_to_spaced_title_case("modifiedByAgent"), "Modified By Agent")
        self.assertEqual(camel_to_spaced_title_case("yesNo6"), "Yes No6")
        self.assertEqual(camel_to_spaced_title_case("cojo"), "Cojo")

    def test_uncapitilize(self):
        self.assertEqual(uncapitilize("Test"), "test")
        self.assertEqual(uncapitilize("tEST"), "tEST")
        self.assertEqual(uncapitilize("A"), "a")
        self.assertEqual(uncapitilize("AB"), "aB")

    #TODO
    # @patch('specifyweb.specify.migration_utils.schema_reader.global_apps') 
    # @patch('specifyweb.specify.migration_utils.schema_reader.datamodel')
    # def test_find_missing_schema_config_fields(self, mock_datamodel, mock_apps):
    #     MockContainer = MagicMock()
    #     MockContainerItem = MagicMock()
    #     mock_apps.get_model.side_effect = [MockContainer, MockContainerItem]

    #     # Setup container query - return ALL container names being checked
    #     mock_containers_qs = MagicMock()
    #     MockContainer.objects.filter.return_value = mock_containers_qs
    #     mock_containers_qs.values_list.return_value = [('CollectionObject',)]

    #     # Setup items query to return existing fields for CollectionObject
    #     mock_items_qs = MagicMock()
    #     MockContainerItem.objects.filter.return_value = mock_items_qs
        
    #     mock_items_qs.values_list.return_value = [
    #         'catalogNumber',
    #         'fieldNumber'
    #     ]

    #     # Setup test table
    #     mock_table = MagicMock()
    #     mock_table.name = "CollectionObject" 
    #     mock_table._all_fields.return_value = [
    #         SimpleNamespace(name="catalogNumber"),
    #         SimpleNamespace(name="fieldNumber"),
    #         SimpleNamespace(name="date1"),
    #         SimpleNamespace(name="date2")
    #     ]
    #     mock_datamodel.tables = [mock_table]

    #     missing_tables, missing_fields = find_missing_schema_config_fields(1)

    #     # Assertions
    #     self.assertEqual(missing_tables, [])
    #     self.assertEqual(missing_fields, {
    #         "CollectionObject": ["date1", "date2"] 
    #     })


if __name__ == '__main__':
    unittest.main()