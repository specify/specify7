from django.db.models import Q

from specifyweb.specify.models import Splocaleitemstr, Splocalecontainer, Splocalecontaineritem, Discipline
from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.specify.migration_utils.schema_writer import (
    update_table_schema_config_with_defaults,
    update_table_field_schema_config_with_defaults,
    revert_table_field_schema_config,
)
from specifyweb.backend.setup_tool.schema_defaults import read_schema_config_defaults

class MultipleRecordsError(Exception):
    ...

class MissingRecordError(Exception):
    ...

def _ensure_one(queryset):
    if len(queryset) > 1:
        raise MultipleRecordsError(f"Expected one {queryset.model.__name__}. Got: {queryset}")
    first_record = queryset.first()
    if first_record is None:
        raise MissingRecordError(f"Expected one {queryset.model.__name__}. None found")
    return first_record

def _get_table_information(table_name: str, discipline_id: int):
    tables = Splocalecontainer.objects.filter(
        name=table_name.lower(),
        discipline_id=discipline_id,
        schematype=0
    )
    return _ensure_one(tables)

# REFACTOR: It would be nice if the backend had a SchemaReader helper to
# encapsulate this behavior
def _get_localized_table_information(table_name: str, discipline_id: int):
    table = _get_table_information(table_name, discipline_id)

    table_labels = Splocaleitemstr.objects.filter(
        containername_id=table.pk,
        language="en"
    )
    table_label = _ensure_one(table_labels)

    table_descriptions = Splocaleitemstr.objects.filter(
        containerdesc_id=table.pk,
        language="en"
    )
    table_desc = _ensure_one(table_descriptions)

    return table, table_label.text, table_desc.text


def _get_field_information(table_name: str, field_name: str, discipline_id: int):
    table = _get_table_information(table_name, discipline_id)

    fields = Splocalecontaineritem.objects.filter(
        name=field_name,
        container_id=table.pk
    )
    field = _ensure_one(fields)

    field_labels = Splocaleitemstr.objects.filter(
        itemname_id=field.pk,
        language="en"
    )
    field_label = _ensure_one(field_labels)

    field_descriptions = Splocaleitemstr.objects.filter(
        itemdesc_id=field.pk,
        language="en"
    )
    field_desc = _ensure_one(field_descriptions)
    return field, field_label.text, field_desc.text


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
        table, table_label, table_desc = _get_localized_table_information("Paleocontext", self.discipline.pk)

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
        table, table_label, table_desc = _get_localized_table_information("Paleocontext", self.discipline.pk)

        table_schema_defaults = overridden_defaults["paleocontext"]
        self.assertEqual(table_label, new_table_label)
        # Splocaleitemstr.text can not be NULL, so this would handle the edge
        # case where both are not set
        self.assertEqual(table_desc, table_schema_defaults.get("desc"))
        # BUG: Table -> IsHidden (and others) is not being respected as a
        # default from the json
        self.assertTrue(table.ishidden)

        field_defaults = table_schema_defaults.get("items", {}).get("text1", {})
        field, field_label, field_desc = _get_field_information("Paleocontext", "text1", self.discipline.pk)
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
        field, field_label, field_desc = _get_field_information("collectionobjectattribute", "text8", self.fish.pk)
        self.assertNotEqual(field_label, "Text8")
        self.assertEqual(field.ishidden, field_defaults.get("ishidden"))
        self.assertEqual(field_label, schema_defaults.get("name"))
        self.assertEqual(field_desc, schema_defaults.get("desc"))
