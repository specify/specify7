from unittest.mock import Mock, patch

from django.test import SimpleTestCase

from ..column_options import ExtendedColumnOptions
from ..parse import ParseFailure, ParseSucess, parse_field
from ..parsing import ParseResult, WorkBenchParseFailure, filter_and_upload, parse_value


class AttachmentResourceURLTests(SimpleTestCase):
    options = ExtendedColumnOptions(
        column='Image URL',
        matchBehavior='ignoreNever',
        nullAllowed=True,
        default=None,
        disambiguationBehavior='ask',
        uiformatter=None,
        schemaitem=None,
        picklist=None,
        dateformat=None,
    )

    def test_accepts_http_and_https(self):
        for value in (
            'http://example.org/image.jpg',
            'https://example.org/resource?id=123#image',
        ):
            with self.subTest(value=value):
                self.assertEqual(
                    parse_field('Attachment', 'resourceURL', value),
                    ParseSucess({'resourceurl': value}),
                )

    def test_reports_invalid_urls_against_mapped_column(self):
        for value in (
            'not a URL',
            '/relative/path',
            'javascript:alert(1)',
            'ftp://example.org/image.jpg',
            'https://',
            'https://example.org:invalid/image.jpg',
        ):
            with self.subTest(value=value):
                self.assertEqual(
                    parse_value('Attachment', 'resourceurl', value, self.options),
                    WorkBenchParseFailure(
                        'failedParsingURL', {'value': value}, 'Image URL'
                    ),
                )

    def test_trims_surrounding_whitespace(self):
        result = parse_value(
            'Attachment', 'resourceurl', ' https://example.org/image.jpg ', self.options
        )
        self.assertIsInstance(result, ParseResult)
        self.assertEqual(result.upload, {'resourceurl': 'https://example.org/image.jpg'})

    def test_validates_default_url(self):
        self.assertEqual(
            parse_value(
                'Attachment', 'resourceurl', '',
                self.options._replace(default='ftp://example.org/image.jpg'),
            ),
            WorkBenchParseFailure(
                'failedParsingURL', {'value': 'ftp://example.org/image.jpg'}, 'Image URL'
            ),
        )

    def test_formatter_cannot_bypass_url_validation(self):
        formatter = Mock(return_value='javascript:alert(1)')
        self.assertEqual(
            parse_field('Attachment', 'resourceurl', 'image', formatter),
            ParseFailure('failedParsingURL', {'value': 'javascript:alert(1)'}),
        )

    @patch('specifyweb.backend.workbench.upload.parsing.parse_with_picklist')
    def test_picklist_cannot_bypass_url_validation(self, parse_picklist):
        parse_picklist.return_value = filter_and_upload(
            {'resourceurl': 'javascript:alert(1)'}, 'Image URL'
        )
        self.assertEqual(
            parse_value(
                'Attachment', 'resourceurl', 'image',
                self.options._replace(picklist=Mock()),
            ),
            WorkBenchParseFailure(
                'failedParsingURL', {'value': 'javascript:alert(1)'}, 'Image URL'
            ),
        )

    def test_allows_blank_optional_url(self):
        result = parse_value('Attachment', 'resourceurl', '  ', self.options)
        self.assertIsInstance(result, ParseResult)
        self.assertEqual(result.upload, {'resourceurl': None})

    def test_preserves_length_limit(self):
        value = 'https://example.org/' + 'a' * 1024
        self.assertEqual(
            parse_field('Attachment', 'resourceurl', value),
            ParseFailure('valueTooLong', {'field': 'resourceurl', 'maxLength': 1024}),
        )

    def test_does_not_validate_unrelated_text_fields(self):
        self.assertEqual(
            parse_field('Attachment', 'remarks', 'not a URL'),
            ParseSucess({'remarks': 'not a URL'}),
        )
