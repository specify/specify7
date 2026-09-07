import json
from unittest.mock import Mock, patch

from django.test import Client, override_settings

from specifyweb.backend.report_runner.views import _expand_rows_for_repeat_count
from specifyweb.backend.stored_queries.tests.test_views.raw_query import (
    get_simple_query,
)
from specifyweb.backend.stored_queries.tests.tests import SQLAlchemySetup
from specifyweb.specify.api.crud import post_resource
from specifyweb.specify.models import Spreport
from specifyweb.specify.tests.test_api import ApiTests


class TestRunReport(ApiTests):

    @override_settings(
        REPORT_RUNNER_HOST='report-runner',
        REPORT_RUNNER_PORT='8080',
    )
    @patch('specifyweb.backend.report_runner.views.requests.post')
    @patch('specifyweb.backend.report_runner.views.run_query')
    def test_run_returns_pdf(
        self,
        run_query: Mock,
        requests_post: Mock,
    ):
        query_json = json.dumps({'name': 'New Query'})
        parameters_json = json.dumps(
            {'title': 'Collection Object Report'}
        )
        report_jrxml = '<jasperReport />'
        pdf_content = b'%PDF-1.4 test report'

        report_data = {
            'fields': [
                'id',
                '1.collectionobject.catalogNumber',
            ],
            'rows': [
                [
                    self.collectionobjects[0].id,
                    'num-0',
                ],
            ],
        }

        run_query.return_value = report_data
        requests_post.return_value.status_code = 200
        requests_post.return_value.content = pdf_content

        client = Client()
        client.force_login(self.specifyuser)

        response = client.post( # calls the real specify endpoint
            '/report_runner/run/',
            {
                'query': query_json,
                'parameters': parameters_json,
                'report': report_jrxml,
            },
        )

        self._assertStatusCodeEqual(response, 200)
        self.assertEqual(response['Content-Type'], 'application/pdf') ## it checks if user receives the pdf
        self.assertEqual(response.content, pdf_content)

        run_query.assert_called_once_with(
            self.collection,
            self.specifyuser,
            query_json,
        )

        requests_post.assert_called_once()
        request_url = requests_post.call_args.args[0]
        request_data = requests_post.call_args.kwargs['data']

        self.assertEqual(
            request_url,
            'http://report-runner:8080/report',
        )
        self.assertEqual(request_data['report'], report_jrxml)
        self.assertEqual(
            request_data['parameters'],
            parameters_json,
        )
        self.assertEqual(
            json.loads(request_data['data']),
            report_data,
        )


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


_JASPER_NS = 'http://jasperreports.sourceforge.net/jasperreports'

def _make_jrxml(repeat_field=None):
    """Build a minimal jrxml string, optionally with a repeat-count property."""
    prop = (
        f'<property xmlns="{_JASPER_NS}" name="specify.repeat.count.field"'
        f' value="{repeat_field}"/>'
        if repeat_field else ''
    )
    return (
        f'<jasperReport xmlns="{_JASPER_NS}">'
        f'{prop}'
        f'</jasperReport>'
    )


class TestExpandRowsForRepeatCount(ApiTests):

    def _data(self, rows):
        return {
            'fields': ['id', '1,63-preparations.preparation.countAmt'],
            'rows': rows,
        }

    def test_no_property_returns_data_unchanged(self):
        data = self._data([[1, 3], [2, 2]])
        result = _expand_rows_for_repeat_count(_make_jrxml(), data)
        self.assertEqual(result, data)

    def test_rows_expanded_by_count_field(self):
        data = self._data([[1, 3], [2, 2]])
        result = _expand_rows_for_repeat_count(
            _make_jrxml('1,63-preparations.preparation.countAmt'), data
        )
        self.assertEqual(result['fields'], data['fields'])
        self.assertEqual(len(result['rows']), 5)  # 3 + 2
        self.assertEqual(result['rows'][0], [1, 3])
        self.assertEqual(result['rows'][3], [2, 2])

    def test_count_of_one_does_not_duplicate(self):
        data = self._data([[1, 1]])
        result = _expand_rows_for_repeat_count(
            _make_jrxml('1,63-preparations.preparation.countAmt'), data
        )
        self.assertEqual(len(result['rows']), 1)

    def test_null_count_defaults_to_one(self):
        data = self._data([[1, None]])
        result = _expand_rows_for_repeat_count(
            _make_jrxml('1,63-preparations.preparation.countAmt'), data
        )
        self.assertEqual(len(result['rows']), 1)

    def test_zero_count_defaults_to_one(self):
        data = self._data([[1, 0]])
        result = _expand_rows_for_repeat_count(
            _make_jrxml('1,63-preparations.preparation.countAmt'), data
        )
        self.assertEqual(len(result['rows']), 1)

    def test_field_not_in_result_set_returns_data_unchanged(self):
        data = self._data([[1, 3]])
        result = _expand_rows_for_repeat_count(
            _make_jrxml('1,63-preparations.preparation.nonexistent'), data
        )
        self.assertEqual(result, data)

    def test_invalid_jrxml_returns_data_unchanged(self):
        data = self._data([[1, 3]])
        result = _expand_rows_for_repeat_count('not valid xml', data)
        self.assertEqual(result, data)