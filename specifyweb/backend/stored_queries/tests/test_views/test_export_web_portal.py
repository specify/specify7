from unittest.mock import MagicMock, Mock, patch

from django.test import Client

from specifyweb.backend.stored_queries.tests.tests import SQLAlchemySetup

from .raw_query import get_simple_query


class TestExportWebPortal(SQLAlchemySetup):
    @patch("specifyweb.backend.stored_queries.views.Thread")
    def test_export(self, thread: Mock):
        c = Client()
        c.force_login(self.specifyuser)

        response = c.post(
            "/stored_query/exportwebportal/",
            get_simple_query(self.specifyuser),
            content_type="application/json",
        )

        self._assertStatusCodeEqual(response, 200)
        thread.assert_called_once()
        self.assertTrue(thread.return_value.daemon)
        thread.return_value.start.assert_called_once()
        self._assertContentEqual(response, "OK")

    def test_portal_attachment_map(self):
        from specifyweb.backend.stored_queries import execution

        class FakeAttachment:
            id = 5291
            attachmentlocation = "sp6896513492722436219.att.JPG"
            origfilename = "29432.JPG"
            title = "Figure 1"

        class FakeJoinRecord:
            collectionobject_id = 123
            attachment = FakeAttachment()

        class FakeJoinQuery:
            def select_related(self, *_args, **_kwargs):
                return [FakeJoinRecord()]

        class FakeJoinManager:
            def __init__(self):
                self.filter_kwargs = None

            def filter(self, **kwargs):
                self.filter_kwargs = kwargs
                return FakeJoinQuery()

        fake_join_manager = FakeJoinManager()
        fake_base_model = type("Collectionobject", (), {"_meta": MagicMock(app_label="specifyweb")})
        fake_table = MagicMock()
        fake_table.attachments_field = MagicMock()

        with patch.object(execution.datamodel, "get_table_by_id", return_value=fake_table), patch.object(
            execution, "get_model_by_table_id", return_value=fake_base_model
        ), patch.object(execution.apps, "get_model", return_value=type("Collectionobjectattachment", (), {"objects": fake_join_manager})):
            result = execution._portal_attachment_map(1, [123])

        self.assertEqual(
            fake_join_manager.filter_kwargs,
            {"collectionobject_id__in": [123], "attachment__ispublic": True},
        )
        self.assertEqual(
            result["123"],
            '[{AttachmentID:5291,AttachmentLocation:"sp6896513492722436219.att.JPG",Title:"Figure 1"}]',
        )
