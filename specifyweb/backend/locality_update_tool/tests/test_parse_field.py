from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.specify.utils.uiformatters import CNNField, UIFormatter
from specifyweb.backend.locality_update_tool.update_locality import ParseError, ParseSuccess, parse_field
from unittest.mock import patch, Mock


class TestParseField(ApiTests):

    def test_no_ui_formatter(self):
        parsed_no_value = parse_field(
            self.collection, "CollectionObject", "text1", "", 1, 2
        )

        parsed_no_value_result = ParseSuccess(
            payload={"text1": ""},
            model="CollectionObject",
            locality_id=1,
            row_number=2,
        )

        self.assertEqual(parsed_no_value_result, parsed_no_value)

        parsed_with_value = parse_field(
            self.collection, "CollectionObject", "text1", "Some Value", None, 10
        )

        parsed_with_value_result = ParseSuccess(
            payload={"text1": "Some Value"},
            model="CollectionObject",
            locality_id=None,
            row_number=10,
        )

        self.assertEqual(parsed_with_value, parsed_with_value_result)

    @patch("specifyweb.specify.update_locality.get_uiformatter")
    def test_cnn_formatter(self, get_uiformatter: Mock):

        get_uiformatter.return_value = UIFormatter(
            model_name="CollectionObject",
            field_name="CatalogNumber",
            fields=[CNNField()],
            format_name="CatalogNumberNumeric",
        )

        parsed_no_value = parse_field(
            self.collection, "CollectionObject", "catalognumber", "", 1, 2
        )

        parsed_no_value_result = ParseSuccess(
            payload={"catalognumber": "000000000"},
            model="CollectionObject",
            locality_id=1,
            row_number=2,
        )

        self.assertEqual(parsed_no_value_result, parsed_no_value)

        parsed_with_value = parse_field(
            self.collection, "CollectionObject", "catalognumber", "10", None, 10
        )

        parsed_with_value_result = ParseSuccess(
            payload={"catalognumber": "000000010"},
            model="CollectionObject",
            locality_id=None,
            row_number=10,
        )

        self.assertEqual(parsed_with_value, parsed_with_value_result)

        parsed_with_invalid_value = parse_field(
            self.collection, "CollectionObject", "catalognumber", "AB", 90, 20
        )

        parsed_with_invalid_value_result = ParseError(
            message="formatMismatch",
            field="catalognumber",
            payload={"value": "'AB'", "formatter": "#########"},
            row_number=20,
        )

        self.assertEqual(parsed_with_invalid_value, parsed_with_invalid_value_result)
