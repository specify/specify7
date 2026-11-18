from django.apps import apps

from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.specify.migration_utils.schema_reader import SchemaReader, MissingRecordError
from specifyweb.specify.migration_utils.migration_helpers.helper_0015_add_version_to_ages import revert_update_age_schema_config


class AddVersionToAgesTests(ApiTests):
    def test_revert_update_age_schema_config(self):
        revert_update_age_schema_config(apps)
        schema_reader = SchemaReader(self.discipline.pk)
        with self.assertRaises(MissingRecordError):
            schema_reader.get_field("AbsoluteAge", "version")
        with self.assertRaises(MissingRecordError):
            schema_reader.get_field("RelativeAge", "version")
