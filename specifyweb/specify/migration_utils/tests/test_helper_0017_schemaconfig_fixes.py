from django.test import TestCase
from unittest.mock import patch, MagicMock

from specifyweb.specify.migration_utils.migration_helpers import helper_0017_schemaconfig_fixes

class SchemaConfigFixesTests(TestCase):

    @patch(
        "specifyweb.specify.migration_utils.migration_helpers.helper_0017_schemaconfig_fixes.fix_table_captions"
    )
    @patch(
        "specifyweb.specify.migration_utils.migration_helpers.helper_0017_schemaconfig_fixes.fix_item_types"
    )
    def test_schemaconfig_fixes(
        self,
        mock_fix_item_types,
        mock_fix_table_captions,
    ):
        mock_apps = MagicMock()

        helper_0017_schemaconfig_fixes.schemaconfig_fixes(mock_apps)

        mock_fix_table_captions.assert_called_once_with(
            mock_apps
        )
        mock_fix_item_types.assert_called_once_with(
            mock_apps
        )