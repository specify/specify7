from django.db.models import Q

from specifyweb.specify.models import Discipline
from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.specify.migration_utils.schema_reader import SchemaReader
from specifyweb.specify.migration_utils.schema_writer import (
    update_table_schema_config_with_defaults,
    update_table_field_schema_config_with_defaults,
    revert_table_field_schema_config,
)
from specifyweb.backend.setup_tool.schema_defaults import read_schema_config_defaults


class SchemaWriterTests(ApiTests):
    def setUp(self):
        super().setUp()
        self._schema_defaults = read_schema_config_defaults()
        self.fish = Discipline.objects.create(
            geologictimeperiodtreedef=self.geologictimeperiodtreedef,
            geographytreedef=self.geographytreedef,
            division=self.division,
            datatype=self.datatype,
            type="fish",
            name="Ichthyology"
        )

    def test_schema_localization_file_respected(self):
        overridden_defaults = read_schema_config_defaults(self.discipline.type)
        update_table_schema_config_with_defaults(
            "Paleocontext",
            self.discipline.pk
        )
        schema_reader = SchemaReader(self.discipline.pk)
        table, table_label, table_desc = schema_reader.get_table("Paleocontext")

        schema_defaults = overridden_defaults["paleocontext"]
        # Splocaleitemstr.text can not be NULL, so this would handle the edge
        # case where both are not set
        self.assertEqual(table_label, schema_defaults.get("name"))
        self.assertEqual(table_desc, schema_defaults.get("desc"))
        # BUG: Table -> IsHidden (and others) is not being respected as a
        # default from the json
        self.assertTrue(table.ishidden)

    def test_passed_in_defaults_override_file_defaults(self):
        overridden_defaults = read_schema_config_defaults(self.discipline.type)
        new_table_label = "PaleoFooText"
        new_text1_hidden = False
        new_text1_desc = "NotBioStrat"
        new_text1_picklist = "BioStrats"
        update_table_schema_config_with_defaults(
            "Paleocontext",
            self.discipline.pk,
            table_defaults={
                "name": new_table_label,
                "items": {
                    "text1": {
                        "desc": new_text1_desc,
                        "ishidden": new_text1_hidden,
                        "picklistname": new_text1_picklist
                    }
                }
            }
        )
        schema_reader = SchemaReader(self.discipline.pk)
        table, table_label, table_desc = schema_reader.get_table("Paleocontext")

        table_schema_defaults = overridden_defaults["paleocontext"]
        self.assertEqual(table_label, new_table_label)
        # Splocaleitemstr.text can not be NULL, so this would handle the edge
        # case where both are not set
        self.assertEqual(table_desc, table_schema_defaults.get("desc"))
        # BUG: Table -> IsHidden (and others) is not being respected as a
        # default from the json
        self.assertTrue(table.ishidden)

        field_defaults = table_schema_defaults.get("items", {}).get("text1", {})
        field, field_label, field_desc = schema_reader.get_field("Paleocontext", "text1")
        self.assertEqual(field_label, field_defaults.get("name"))
        self.assertEqual(field_desc, new_text1_desc)
        self.assertEqual(field.isrequired, field_defaults.get("isrequired"))
        self.assertEqual(field.ishidden, new_text1_hidden)
        self.assertEqual(field.picklistname, new_text1_picklist)

    def test_default_overrides_being_set(self):
        update_table_schema_config_with_defaults(
            table_name="collectionobjectattribute",
            discipline_id=self.fish.pk,
            discipline_type=self.fish.type
        )
        schema_defaults = read_schema_config_defaults(self.fish.type)
        table_schema_defaults = schema_defaults["collectionobjectattribute"]
        field_defaults = table_schema_defaults.get("items", {}).get("text8", {})
        schema_reader = SchemaReader(self.fish.pk)
        field, field_label, field_desc = schema_reader.get_field("collectionobjectattribute", "text8")
        self.assertNotEqual(field_label, "Text8")
        self.assertEqual(field.ishidden, field_defaults.get("ishidden"))
        self.assertEqual(field_label, field_defaults.get("name"))
        self.assertEqual(field_desc, field_defaults.get("desc"))
