from unittest.mock import patch
from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.specify.update_locality import ParseError, ParsedRow
from specifyweb.specify.views import parse_locality_set_foreground


class TestParseLocalitySetForeground(ApiTests):
    
    @patch("specifyweb.specify.views._parse_locality_set")
    def test_fail(self, parse_locality):

        errors = ParseError(message="guidHeaderNotProvided", field='guid', payload=None, row_number=0)
        parse_locality.return_value = ([], [errors])

        status, rows = parse_locality_set_foreground(self.collection, ['guid'], [])

        self.assertEqual(status, 422)
        self.assertEqual(rows, [errors])

    @patch("specifyweb.specify.views._parse_locality_set")
    def test_success(self, parse_locality):

        parsed = [ParsedRow(row_number=0, locality=dict(localityname="Test"), geocoorddetail=None, locality_id=4)]

        parse_locality.return_value = (parsed, [])

        status, rows = parse_locality_set_foreground(self.collection, ['localityname'], [])

        self.assertEqual(status, 200)
        self.assertEqual(rows, parsed)