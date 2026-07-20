from unittest.mock import Mock, patch

from django.test import Client

from specifyweb.backend.stored_queries.tests.test_views.raw_query import (
    get_simple_query,
)
from specifyweb.backend.stored_queries.tests.tests import SQLAlchemySetup
from specifyweb.specify.api.crud import post_resource
from specifyweb.specify.models import Spreport


class TestCreateReport(SQLAlchemySetup):

    @patch(
        'specifyweb.backend.report_runner.views.models.session_context'
    )
    def test_create_report_from_existing_query(self, context: Mock):
        context.return_value = TestCreateReport.test_session_context()

        query = post_resource(
            self.collection,
            self.agent,
            'spquery',
            get_simple_query(self.specifyuser),
        )

        client = Client()
        client.force_login(self.specifyuser)

        response = client.post(
            '/report_runner/create/',
            {
                'queryid': query.id,
                'mimetype': 'jrxml/report',
                'name': 'Collection Object Report',
            },
        )

        self._assertStatusCodeEqual(response, 201)

        report = Spreport.objects.get(name='Collection Object Report')

        self.assertEqual(report.query_id, query.id)
        self.assertEqual(report.specifyuser_id, self.specifyuser.id)
        self.assertEqual(report.appresource.mimetype, 'jrxml/report')

        report_data = report.appresource.spappresourcedatas.get()

        self.assertIn(
            '1.collectionobject.catalogNumber',
            report_data.get_decoded_data(),
        )


class TestCreateLabel(SQLAlchemySetup):

    @patch(
        'specifyweb.backend.report_runner.views.models.session_context'
    )
    def test_create_label_from_new_query(self, context: Mock):
        context.return_value = TestCreateLabel.test_session_context()

        query_data = get_simple_query(self.specifyuser)
        query_data['name'] = 'New Label Query'

        query = post_resource(
            self.collection,
            self.agent,
            'spquery',
            query_data,
        )

        client = Client()
        client.force_login(self.specifyuser)

        response = client.post(
            '/report_runner/create/',
            {
                'queryid': query.id,
                'mimetype': 'jrxml/label',
                'name': 'Collection Object Label',
            },
        )

        self._assertStatusCodeEqual(response, 201)

        label = Spreport.objects.get(name='Collection Object Label')

        self.assertEqual(label.query_id, query.id)
        self.assertEqual(label.query.name, 'New Label Query')
        self.assertEqual(label.specifyuser_id, self.specifyuser.id)
        self.assertEqual(label.appresource.mimetype, 'jrxml/label')

        label_data = label.appresource.spappresourcedatas.get()

        self.assertIn(
            '1.collectionobject.catalogNumber',
            label_data.get_decoded_data(),
        )