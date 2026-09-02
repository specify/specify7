from django.test import Client

from specifyweb.specify.tests.test_api import ApiTests
from unittest.mock import Mock, patch

from specifyweb.backend.context.app_resource import get_data_view_queries_resource


FOUND_RESOURCE = ('<resource><text>"Value"</text></resource>', "text/xml", 4)


class TestAppResource(ApiTests):

    @patch("specifyweb.backend.context.app_resource.load_resource_at_level")
    @patch("specifyweb.backend.context.app_resource.get_app_resource_from_db")
    def test_data_view_queries_inherit_by_table(
        self, get_from_db: Mock, load_from_filesystem: Mock
    ):
        discipline = ('{"version": 1, "queries": {"Agent": {"fields": [1]}, "Loan": {"fields": [2]}}}', 'application/json', 1)
        personal = ('{"version": 1, "queries": {"Agent": {"fields": [3]}}}', 'application/json', 2)
        get_from_db.side_effect = lambda _collection, _user, level, _name: {
            'Discipline': discipline,
            'Personal': personal,
        }.get(level)
        load_from_filesystem.return_value = None

        result = get_data_view_queries_resource(self.specify_collection, self.specifyuser)

        self.assertIsNotNone(result)
        self.assertEqual(
            result[0],
            '{"version": 1, "queries": {"Agent": {"fields": [3]}, "Loan": {"fields": [2]}}}',
        )
        self.assertEqual(result[1:], ('application/json', 2))

    def test_no_name(self):
        c = Client()
        c.force_login(self.specifyuser)
        response = c.get("/context/app.resource")
        self._assertStatusCodeEqual(response, 404)

    @patch("specifyweb.backend.context.views.get_app_resource")
    def test_found(self, get_app_resource: Mock):
        c = Client()
        c.force_login(self.specifyuser)
        get_app_resource.return_value = FOUND_RESOURCE

        response = c.get("/context/app.resource?name='simple'")
        self._assertStatusCodeEqual(response, 200)
        self._assertContentEqual(response, FOUND_RESOURCE[0])
        self.assertEqual(response["content-type"], FOUND_RESOURCE[1])
        self.assertEqual(response["X-Record-ID"], str(FOUND_RESOURCE[2]))

    @patch("specifyweb.backend.context.views.get_app_resource")
    def test_not_found_not_quiet(self, get_app_resource: Mock):
        c = Client()
        c.force_login(self.specifyuser)
        get_app_resource.return_value = None

        response = c.get("/context/app.resource?name='simple'")
        self._assertStatusCodeEqual(response, 404)

    @patch("specifyweb.backend.context.views.get_app_resource")
    def test_not_found_quiet(self, get_app_resource: Mock):
        c = Client()
        c.force_login(self.specifyuser)
        get_app_resource.return_value = None

        response = c.get("/context/app.resource?name='simple'&quiet='true'")
        self._assertStatusCodeEqual(response, 204)
