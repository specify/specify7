from unittest.mock import patch
from django.apps import apps

from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.specify.migration_utils.schema_reader import SchemaReader, MissingRecordError
from specifyweb.specify.migration_utils.migration_helpers.helper_0013_collectionobjectgroup_parentcog import (
    update_cog_schema_config
)

class UpdateCogSchemaConfigTests(ApiTests):
    def test_update_cog_schema_config(self):
        # This won't actually create any new Schema Config records, as those
        # fields don't exist in the newest datamodel
        update_cog_schema_config(apps)
        schema_reader = SchemaReader(self.discipline.pk)
        # FEATURE: update_cog_schema_config also removes any previous
        # COG -> parentCog entry before creating the new defaults based on the
        # datamodel

        # schema_reader.get_field("CollectionObjectGroup", "parentCog")
        with self.assertRaises(MissingRecordError):
            schema_reader.get_field("CollectionObjectGroup", "parentCojo")
