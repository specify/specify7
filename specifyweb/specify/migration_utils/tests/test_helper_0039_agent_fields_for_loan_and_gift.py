from unittest.mock import patch, MagicMock
from django.apps import apps as django_apps

from specifyweb.specify.tests.test_api import ApiTests
import specifyweb.specify.migration_utils.migration_helpers.helper_0039_agent_fields_for_loan_and_gift as helper


class UpdateLoanAndGiftAgentFieldsTests(ApiTests):

    @patch(
        "specifyweb.specify.migration_utils.migration_helpers."
        "helper_0039_agent_fields_for_loan_and_gift.update_table_field_schema_config_with_defaults"
    )
    def test_calls_schema_writer_for_all_fields(self, mock_update):

        helper.update_loan_and_gift_agent_fields(django_apps)

        self.assertEqual(mock_update.call_count, 10)

        for _, kwargs in mock_update.call_args_list:
            self.assertEqual(kwargs["defaults"], {"ishidden": True})