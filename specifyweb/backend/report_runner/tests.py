import json
from unittest.mock import Mock, patch

from django.test import Client, override_settings

from specifyweb.backend.report_runner.views import (
    _expand_rows_by_count,
    _expand_rows_by_field,
    _expand_rows_for_repeat,
    _expand_rows_for_repeat_count,
)
from specifyweb.backend.stored_queries.tests.test_views.raw_query import (
    get_simple_query,
)
from specifyweb.backend.stored_queries.tests.tests import SQLAlchemySetup
from specifyweb.specify.api.crud import post_resource
from specifyweb.specify.models import Spappresourcedir, Spreport
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

    def _make_report(self, **report_kwargs):
        """Create a real SpReport (with app resource) for run-view tests."""
        appdir = Spappresourcedir.objects.create(discipline=self.discipline)
        appresource = appdir.sppersistedappresources.create(
            version=0,
            mimetype='jrxml/label',
            level=0,
            name='Repeat Label',
            description='Repeat Label',
            specifyuser=self.specifyuser,
            metadata='tableid=-1;reporttype=Report;',
        )
        return Spreport.objects.create(
            version=0,
            name='Repeat Label',
            appresource=appresource,
            specifyuser=self.specifyuser,
            **report_kwargs,
        )

    @override_settings(
        REPORT_RUNNER_HOST='report-runner',
        REPORT_RUNNER_PORT='8080',
    )
    @patch('specifyweb.backend.report_runner.views.requests.post')
    @patch('specifyweb.backend.report_runner.views.run_query')
    def test_run_expands_rows_from_repeat_field(
        self,
        run_query: Mock,
        requests_post: Mock,
    ):
        """End-to-end: the run view reads RepeatField from a real SpReport row
        and expands each result row by that field's value before sending the
        data to the report renderer."""
        report = self._make_report(
            repeatfield='1,63-preparations.preparation.countAmt',
        )

        report_data = {
            'fields': ['id', '1,63-preparations.preparation.countAmt'],
            'rows': [
                [self.collectionobjects[0].id, 3],
                [self.collectionobjects[1].id, 2],
            ],
        }
        run_query.return_value = report_data
        requests_post.return_value.status_code = 200
        requests_post.return_value.content = b'%PDF-1.4 test'

        client = Client()
        client.force_login(self.specifyuser)

        response = client.post(
            '/report_runner/run/',
            {
                'query': json.dumps({'name': 'New Query'}),
                'parameters': json.dumps({}),
                'report': '<jasperReport />',
                'reportId': report.id,
            },
        )

        self._assertStatusCodeEqual(response, 200)

        sent = json.loads(requests_post.call_args.kwargs['data']['data'])
        self.assertEqual(len(sent['rows']), 5)  # 3 + 2
        self.assertEqual(sent['rows'][0], [self.collectionobjects[0].id, 3])
        self.assertEqual(sent['rows'][3], [self.collectionobjects[1].id, 2])

    @override_settings(
        REPORT_RUNNER_HOST='report-runner',
        REPORT_RUNNER_PORT='8080',
    )
    @patch('specifyweb.backend.report_runner.views.requests.post')
    @patch('specifyweb.backend.report_runner.views.run_query')
    def test_run_expands_rows_from_repeat_count(
        self,
        run_query: Mock,
        requests_post: Mock,
    ):
        """End-to-end: the run view repeats every row a fixed number of times
        when the SpReport row has RepeatCount but no RepeatField."""
        report = self._make_report(repeatcount=3)

        report_data = {
            'fields': ['id', '1,63-preparations.preparation.countAmt'],
            'rows': [
                [self.collectionobjects[0].id, 9],
                [self.collectionobjects[1].id, 9],
            ],
        }
        run_query.return_value = report_data
        requests_post.return_value.status_code = 200
        requests_post.return_value.content = b'%PDF-1.4 test'

        client = Client()
        client.force_login(self.specifyuser)

        response = client.post(
            '/report_runner/run/',
            {
                'query': json.dumps({'name': 'New Query'}),
                'parameters': json.dumps({}),
                'report': '<jasperReport />',
                'reportId': report.id,
            },
        )

        self._assertStatusCodeEqual(response, 200)

        sent = json.loads(requests_post.call_args.kwargs['data']['data'])
        self.assertEqual(len(sent['rows']), 6)  # 2 rows * 3


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


class TestExpandRowsByField(ApiTests):

    def _data(self, rows):
        return {
            'fields': ['id', '1,63-preparations.preparation.countAmt'],
            'rows': rows,
        }

    def test_rows_expanded_by_field_value(self):
        data = self._data([[1, 3], [2, 2]])
        result = _expand_rows_by_field(
            data, '1,63-preparations.preparation.countAmt'
        )
        self.assertEqual(len(result['rows']), 5)
        self.assertEqual(result['rows'][0], [1, 3])
        self.assertEqual(result['rows'][3], [2, 2])

    def test_null_zero_and_invalid_default_to_one(self):
        data = self._data([[1, None], [2, 0], [3, 'x']])
        result = _expand_rows_by_field(
            data, '1,63-preparations.preparation.countAmt'
        )
        self.assertEqual(len(result['rows']), 3)

    def test_missing_field_returns_data_unchanged(self):
        data = self._data([[1, 3]])
        result = _expand_rows_by_field(data, 'not.a.field')
        self.assertEqual(result, data)

    def test_empty_field_returns_data_unchanged(self):
        data = self._data([[1, 3]])
        result = _expand_rows_by_field(data, None)
        self.assertEqual(result, data)


class TestExpandRowsByCount(ApiTests):

    def _data(self, rows):
        return {'fields': ['id'], 'rows': rows}

    def test_every_row_repeated_fixed_count(self):
        data = self._data([[1], [2]])
        result = _expand_rows_by_count(data, 3)
        self.assertEqual(len(result['rows']), 6)
        self.assertEqual(result['rows'][:3], [[1], [1], [1]])

    def test_count_of_one_returns_data_unchanged(self):
        data = self._data([[1], [2]])
        result = _expand_rows_by_count(data, 1)
        self.assertEqual(result, data)

    def test_invalid_count_returns_data_unchanged(self):
        data = self._data([[1]])
        self.assertEqual(_expand_rows_by_count(data, None), data)
        self.assertEqual(_expand_rows_by_count(data, 'x'), data)


class TestExpandRowsForRepeat(ApiTests):

    def _data(self, rows):
        return {
            'fields': ['id', '1,63-preparations.preparation.countAmt'],
            'rows': rows,
        }

    @patch('specifyweb.backend.report_runner.views.Spreport.objects.get')
    def test_repeat_field_takes_precedence(self, get: Mock):
        get.return_value = Mock(
            repeatfield='1,63-preparations.preparation.countAmt',
            repeatcount=99,
        )
        data = self._data([[1, 3], [2, 2]])
        result = _expand_rows_for_repeat(_make_jrxml(), data, report_id=1)
        self.assertEqual(len(result['rows']), 5)

    @patch('specifyweb.backend.report_runner.views.Spreport.objects.get')
    def test_repeat_count_used_when_no_field(self, get: Mock):
        get.return_value = Mock(repeatfield=None, repeatcount=3)
        data = self._data([[1, 9], [2, 9]])
        result = _expand_rows_for_repeat(_make_jrxml(), data, report_id=1)
        self.assertEqual(len(result['rows']), 6)

    @patch('specifyweb.backend.report_runner.views.Spreport.objects.get')
    def test_falls_back_to_jrxml_when_report_has_no_config(self, get: Mock):
        get.return_value = Mock(repeatfield=None, repeatcount=None)
        data = self._data([[1, 3]])
        result = _expand_rows_for_repeat(
            _make_jrxml('1,63-preparations.preparation.countAmt'),
            data,
            report_id=1,
        )
        self.assertEqual(len(result['rows']), 3)

    def test_no_report_id_uses_jrxml(self):
        data = self._data([[1, 3]])
        result = _expand_rows_for_repeat(
            _make_jrxml('1,63-preparations.preparation.countAmt'), data
        )
        self.assertEqual(len(result['rows']), 3)

    @patch('specifyweb.backend.report_runner.views.Spreport.objects.get')
    def test_missing_report_falls_back_to_jrxml(self, get: Mock):
        get.side_effect = Spreport.DoesNotExist
        data = self._data([[1, 3]])
        result = _expand_rows_for_repeat(
            _make_jrxml('1,63-preparations.preparation.countAmt'),
            data,
            report_id=999,
        )
        self.assertEqual(len(result['rows']), 3)