import csv
from pathlib import Path
from tempfile import TemporaryDirectory
from types import SimpleNamespace
from unittest.mock import Mock, patch

from django.test import SimpleTestCase, override_settings
from sqlalchemy import String, create_engine, sql

from specifyweb.backend.attachment_gw import views as attachment_gw
from specifyweb.backend.stored_queries.execution import execute, query_to_csv
from specifyweb.backend.stored_queries.queryfieldspec import QueryFieldSpec
from specifyweb.backend.stored_queries.tests.tests import SQLAlchemySetup
from specifyweb.backend.stored_queries.tests.utils import make_query_fields_test
from specifyweb.specify.models import Attachment


@override_settings(WEB_ATTACHMENT_COLLECTION="Test Collection & Images")
class TestAttachmentResourceURLProjection(SimpleTestCase):
    def project(self, resource_url, location, path=None):
        spec = QueryFieldSpec.from_path(path or ["Attachment", "resourceURL"])
        attachment = sql.select([
            sql.literal(resource_url, type_=String).label("resourceURL"),
            sql.literal(location, type_=String).label("attachmentLocation"),
        ]).alias("attachment")
        orm_model = SimpleNamespace(**attachment.c)
        query = Mock()
        query.collection = SimpleNamespace(collectionname="Separate Collection")
        query.build_join.return_value = (
            query, orm_model, spec.table, spec.get_field()
        )
        returned_query, projection, field, table = spec.add_spec_to_query(query)
        self.assertIs(returned_query, query)
        self.assertIs(field, spec.get_field())
        self.assertIs(table, spec.table)

        engine = create_engine("sqlite://")
        try:
            with engine.connect() as connection:
                return connection.execute(sql.select([projection])).scalar()
        finally:
            engine.dispose()

    def test_projection(self):
        with patch.object(
            attachment_gw, "server_urls", {"read": "https://assets.example/fileget"}
        ):
            for resource_url, location, expected in [
                ("https://external.example/image.jpg", "image.jpg",
                 "https://external.example/image.jpg"),
                ("https://external.example/image.jpg", None,
                 "https://external.example/image.jpg"),
                ("", "image.jpg", ""),
                (None, "image.jpg",
                 "https://assets.example/fileget"
                 "?coll=Test+Collection+%26+Images&type=O&filename=image.jpg"),
                (None, None, None),
            ]:
                with self.subTest(resource_url=resource_url, location=location):
                    self.assertEqual(self.project(resource_url, location), expected)

    def test_unconfigured_asset_server(self):
        with patch.object(attachment_gw, "server_urls", None):
            self.assertEqual(
                self.project("https://external.example/image.jpg", None),
                "https://external.example/image.jpg",
            )
            self.assertIsNone(self.project(None, "image.jpg"))

    def test_joined_attachment(self):
        with patch.object(
            attachment_gw, "server_urls", {"read": "https://assets.example/fileget"}
        ):
            self.assertEqual(
                self.project(None, "joined.jpg", [
                    "CollectionObject", "collectionObjectAttachments",
                    "attachment", "resourceURL"
                ]),
                "https://assets.example/fileget"
                "?coll=Test+Collection+%26+Images&type=O&filename=joined.jpg",
            )

    def test_read_endpoint_with_query_parameters(self):
        with patch.object(attachment_gw, "server_urls", {
            "read": "https://assets.example/fileget?existing=value"
        }):
            self.assertEqual(
                self.project(None, "image.jpg"),
                "https://assets.example/fileget?existing=value"
                "&coll=Test+Collection+%26+Images&type=O&filename=image.jpg",
            )

    def test_other_attachment_fields_are_unchanged(self):
        with patch.object(
            attachment_gw, "server_urls", {"read": "https://assets.example/fileget"}
        ):
            self.assertEqual(
                self.project(None, "image.jpg", ["Attachment", "attachmentLocation"]),
                "image.jpg",
            )

    @override_settings(
        WEB_ATTACHMENT_COLLECTION=None, SEPARATE_WEB_ATTACHMENT_FOLDERS=True
    )
    def test_separate_collection_folder(self):
        with patch.object(
            attachment_gw, "server_urls", {"read": "https://assets.example/fileget"}
        ):
            self.assertEqual(
                self.project(None, "image.jpg"),
                "https://assets.example/fileget"
                "?coll=Separate+Collection&type=O&filename=image.jpg",
            )


@override_settings(WEB_ATTACHMENT_COLLECTION="Test Collection")
class TestAttachmentResourceURLResults(SQLAlchemySetup):
    def setUp(self):
        super().setUp()
        server_urls = patch.object(
            attachment_gw, "server_urls", {"read": "https://assets.example/fileget"}
        )
        server_urls.start()
        self.addCleanup(server_urls.stop)
        self.attachments = [
            Attachment.objects.create(resourceurl=url, attachmentlocation=location)
            for url, location in [
                ("https://external.example/image.jpg", "external.jpg"),
                (None, "image.jpg"),
                ("", "blank.jpg"),
                (None, None),
            ]
        ]
        self.expected = [
            (self.attachments[0].id, "https://external.example/image.jpg"),
            (self.attachments[1].id,
             "https://assets.example/fileget"
             "?coll=Test+Collection&type=O&filename=image.jpg"),
            (self.attachments[2].id, ""),
            (self.attachments[3].id, None),
        ]
        self.table, self.fields = make_query_fields_test(
            "Attachment", [["resourceURL"]]
        )

    def test_query_results(self):
        with TestAttachmentResourceURLResults.test_session_context() as session:
            result = execute(
                session, self.collection, self.specifyuser, self.table.tableId,
                search_synonymy=False, distinct=False, series=False,
                count_only=False, query_fields=self.fields, limit=0, offset=0,
            )
        self.assertCountEqual(result["results"], self.expected)

    def test_csv_export(self):
        with TemporaryDirectory() as directory:
            path = Path(directory) / "attachments.csv"
            with TestAttachmentResourceURLResults.test_session_context() as session:
                query_to_csv(
                    session, self.collection, self.specifyuser,
                    self.table.tableId, self.fields, path,
                )
            with path.open(newline="") as exported:
                rows = list(csv.reader(exported))
        self.assertCountEqual(
            rows,
            [[str(record_id), url if url is not None else ""]
             for record_id, url in self.expected],
        )
