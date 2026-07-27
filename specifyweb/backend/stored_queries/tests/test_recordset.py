from unittest import TestCase
from unittest.mock import Mock, patch

from specifyweb.backend.stored_queries.execution import BuildQueryProps, recordset

class TestRecordSet(TestCase):
    @patch("specifyweb.backend.stored_queries.execution.insert")
    @patch("specifyweb.backend.stored_queries.execution.build_query")
    @patch("specifyweb.backend.stored_queries.execution.fields_from_json")
    @patch("specifyweb.backend.stored_queries.execution.models.session_context")
    @patch("specifyweb.backend.stored_queries.execution.models.RecordSet")
    def test_query_is_scoped_to_source_recordset(
        self,
        recordset_model,
        session_context,
        fields_from_json,
        build_query,
        _insert,
    ):
        collection = Mock(id=1)
        user = Mock(id=2)
        user_agent = Mock(id=3)
        source_recordset_id = 4
        field_specs = [Mock()]
        query = Mock()

        session = session_context.return_value.__enter__.return_value
        recordset_model.return_value.recordSetId = 5
        fields_from_json.return_value = field_specs
        build_query.return_value = (query, Mock())

        recordset(
            collection,
            user,
            user_agent,
            {
                "name": "Filtered Record Set",
                "fromquery": {
                    "contexttableid": 1,
                    "fields": [],
                    "recordsetid": source_recordset_id,
                },
            },
        )

        build_query.assert_called_once_with(
            session,
            collection,
            user,
            1,
            field_specs,
            BuildQueryProps(recordsetid=source_recordset_id),
        )