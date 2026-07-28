import json
from unittest.mock import Mock, patch

from django.test import Client, override_settings

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