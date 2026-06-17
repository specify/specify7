import unittest
from unittest.mock import patch, MagicMock

from specifyweb.specify.migration_utils.schema_reader import (
    _has_explicit_hidden_override,
    _schema_override_hidden_values_for_discipline,
    _schema_override_hidden_fields_for_discipline,
    _fields_without_explicit_hidden_override,
    datamodel_type_to_schematype,
    camel_to_spaced_title_case,
    uncapitilize,
    bulk_create_splocaleitemstr_idempotent,
    find_missing_schema_config_fields,
)


# -----------------------------
# Pure function tests
# -----------------------------
class SchemaPureFunctionTests(unittest.TestCase):

    def test_has_explicit_hidden_override(self):
        self.assertTrue(_has_explicit_hidden_override({"isHidden": True}))
        self.assertTrue(_has_explicit_hidden_override({"ISHIDDEN": False}))
        self.assertFalse(_has_explicit_hidden_override({"other": "value"}))

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


# -----------------------------
# Schema override tests
# -----------------------------
class SchemaOverrideTests(unittest.TestCase):

    @patch("specifyweb.specify.migration_utils.schema_reader.Path")
    @patch("specifyweb.specify.migration_utils.schema_reader.settings")
    @patch("specifyweb.specify.migration_utils.schema_reader.json.load")
    def test_schema_override_hidden_values_for_discipline(
        self,
        mock_json_load,
        mock_settings,
        mock_path,
    ):
        mock_settings.SPECIFY_CONFIG_DIR = "/config"

        mock_path.return_value.exists.return_value = True

        mock_json_load.return_value = {
            "collectionobject": {
                "items": [
                    {
                        "catalogNumber": {"isHidden": True},
                        "otherField": {"otherSetting": "value"},
                    }
                ]
            }
        }

        result = _schema_override_hidden_values_for_discipline("bird")

        self.assertEqual(
            result,
            {"collectionobject": {"catalognumber": True}},
        )

    def test_schema_override_hidden_fields_for_discipline(self):
        with patch(
            "specifyweb.specify.migration_utils.schema_reader._schema_override_hidden_values_for_discipline"
        ) as mock_hidden_values:

            mock_hidden_values.return_value = {
                "accession": {"accessionnumber": True, "status": False},
                "collectingtrip": {"collectingtripname": True},
            }

            result = _schema_override_hidden_fields_for_discipline("biology")

            self.assertEqual(
                result,
                {
                    "accession": {"accessionnumber", "status"},
                    "table2": {"collectingtripname"},
                },
            )


# -----------------------------
# Field filtering logic tests
# -----------------------------
class SchemaFieldFilterTests(unittest.TestCase):

    def test_fields_without_explicit_hidden_override(self):
        with patch(
            "specifyweb.specify.migration_utils.schema_reader._schema_override_hidden_fields_for_discipline"
        ) as mock_hidden_fields:

            mock_hidden_fields.return_value = {
                "collectionobject": {"catalognumber", "availability"}
            }

            result = _fields_without_explicit_hidden_override(
                "CollectionObject",
                ["catalogNumber", "availability", "name"],
                "bird",
            )

            self.assertEqual(result, ["availability", "name"])


# -----------------------------
# Bulk create tests
# -----------------------------
class BulkCreateTests(unittest.TestCase):

    def test_bulk_create_splocaleitemstr_idempotent(self):

        Splocaleitemstr = MagicMock()

        # mock queryset chain
        qs = MagicMock()
        Splocaleitemstr.objects.filter.return_value = qs
        qs.filter.return_value.order_by.return_value = []

        fake_fk = MagicMock()
        fake_fk.pk = 1

        rows = [
            {
                "language": "en",
                "itemname": fake_fk,
            }
        ]

        result = bulk_create_splocaleitemstr_idempotent(Splocaleitemstr, rows)

        self.assertEqual(result, 1)
        Splocaleitemstr.objects.bulk_create.assert_called_once()


# -----------------------------
# Missing schema fields tests
# -----------------------------
class MissingSchemaFieldsTests(unittest.TestCase):

    @patch("specifyweb.specify.migration_utils.schema_reader.datamodel")
    @patch("specifyweb.specify.migration_utils.schema_reader.global_apps")
    def test_find_missing_schema_config_fields(self, mock_apps, mock_datamodel):

        mock_container = MagicMock()
        mock_item = MagicMock()

        mock_apps.get_model.side_effect = [mock_container, mock_item]

        mock_container.objects.filter.return_value = []
        mock_item.objects.filter.return_value.values_list.return_value = []

        mock_table = MagicMock()
        mock_table.name = "CollectionObject"
        mock_table._all_fields.return_value = [
            MagicMock(name="date1"),
            MagicMock(name="date2"),
        ]

        mock_datamodel.tables = [mock_table]

        missing_tables, missing_fields = find_missing_schema_config_fields(1)

        self.assertEqual(missing_tables, [])
        self.assertEqual(
            missing_fields,
            {"CollectionObject": ["date1", "date2"]},
        )


if __name__ == "__main__":
    unittest.main()