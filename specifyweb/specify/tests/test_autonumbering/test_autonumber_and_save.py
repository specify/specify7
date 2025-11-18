

# For this test, we don't care if the autonumbering is correct.
# Actually, we just care if it gets called correctly
# So, the function that performs autonumbering is also mocked.
# This is why ApiTests are used (instead of transactional ones)
from specifyweb.specify.utils.autonumbering import autonumber_and_save
from specifyweb.specify.models import Collectionobject

from unittest.mock import Mock, patch

from specifyweb.specify.tests.test_autonumbering import TestAutonumberingContext
from specifyweb.specify.utils.uiformatters import (
    FormatMismatch,
    NumericField,
    AnyCharField,
    SeparatorField,
    UIFormatter,
)


class TestAutonumberAndSave(TestAutonumberingContext):

    @patch("specifyweb.specify.utils.autonumbering.do_autonumbering")
    @patch("specifyweb.specify.utils.autonumbering.get_uiformatters")
    def test_simple_formatter_case(self, get_formatters: Mock, do_autonumbering: Mock):

        get_formatters.return_value = [self.cnn_ui_formatter]

        test_co = Collectionobject(
            collection=self.collection, catalognumber="#########"
        )

        autonumber_and_save(self.collection, self.specifyuser, test_co)

        do_autonumbering.assert_called_once_with(
            self.collection, test_co, [(self.cnn_ui_formatter, ("#########",))]
        )

        # The CO should technically not have been saved.
        self.assertIsNone(test_co.id)

    @patch("specifyweb.specify.utils.autonumbering.do_autonumbering")
    @patch("specifyweb.specify.utils.autonumbering.get_uiformatters")
    def test_no_formatter_case(self, get_formatters: Mock, do_autonumbering: Mock):
        get_formatters.return_value = []
        test_co = Collectionobject(
            collection=self.collection, catalognumber="#########"
        )
        autonumber_and_save(self.collection, self.specifyuser, test_co)
        # No fields
        do_autonumbering.assert_not_called()

        self.assertIsNotNone(test_co.id)

    @patch("specifyweb.specify.utils.autonumbering.do_autonumbering")
    @patch("specifyweb.specify.utils.autonumbering.get_uiformatters")
    def test_autonumbering_field_but_no_value(
        self, get_formatters: Mock, do_autonumbering: Mock
    ):
        get_formatters.return_value = [
            self.cnn_ui_formatter,
            self.complicated_formatter,
        ]
        test_co = Collectionobject(
            collection=self.collection, catalognumber="#########", text1=None
        )
        autonumber_and_save(self.collection, self.specifyuser, test_co)

        do_autonumbering.assert_called_once_with(
            self.collection, test_co, [(self.cnn_ui_formatter, ("#########",))]
        )

        self.assertIsNone(test_co.id)

    @patch("specifyweb.specify.utils.autonumbering.do_autonumbering")
    @patch("specifyweb.specify.utils.autonumbering.get_uiformatters")
    def test_no_autonumbering_field(self, get_formatters: Mock, do_autonumbering: Mock):
        get_formatters.return_value = [
            UIFormatter(
                model_name="CollectionObject",
                field_name="Text1",
                fields=[
                    AnyCharField(size=2, value="AA", inc=False, by_year=False),
                    SeparatorField(size=1, value="-", inc=False, by_year=False),
                ],
                format_name="TestFormatNoAutonumber",
            )
        ]

        test_co = Collectionobject(collection=self.collection, text1="AB-")
        autonumber_and_save(self.collection, self.specifyuser, test_co)
        # No fields
        do_autonumbering.assert_not_called()

        self.assertIsNotNone(test_co.id)

    @patch("specifyweb.specify.utils.autonumbering.do_autonumbering")
    @patch("specifyweb.specify.utils.autonumbering.get_uiformatters")
    def test_autonumbering_value_exists(
        self, get_formatters: Mock, do_autonumbering: Mock
    ):
        get_formatters.return_value = [self.cnn_ui_formatter]

        test_co = Collectionobject(
            collection=self.collection, catalognumber="000000000"
        )

        autonumber_and_save(self.collection, self.specifyuser, test_co)
        # No fields
        do_autonumbering.assert_not_called()

        self.assertIsNotNone(test_co.id)

    @patch("specifyweb.specify.utils.autonumbering.do_autonumbering")
    @patch("specifyweb.specify.utils.autonumbering.get_uiformatters")
    def test_autonumbering_mismatch(self, get_formatters: Mock, do_autonumbering: Mock):
        get_formatters.return_value = [
            UIFormatter(
                model_name="CollectionObject",
                field_name="Text1",
                fields=[
                    NumericField(
                        size=3,
                        inc=3,
                    ),
                    SeparatorField(size=1, value="-", inc=False, by_year=False),
                ],
                format_name="TestFormatAutonumber",
            )
        ]

        with self.assertRaises(FormatMismatch) as context:

            test_co = Collectionobject(collection=self.collection, text1="AAB-")
            autonumber_and_save(self.collection, self.specifyuser, test_co)
            # No fields
            do_autonumbering.assert_not_called()

            self.assertIsNone(test_co.id)

        self.assertTrue(
            "value 'AAB-' doesn't match formatter ###-" in str(context.exception)
        )

        with self.assertRaises(FormatMismatch) as context:

            test_co = Collectionobject(collection=self.collection, text1="089|")
            autonumber_and_save(self.collection, self.specifyuser, test_co)
            # No fields
            do_autonumbering.assert_not_called()

            self.assertIsNone(test_co.id)

        self.assertTrue(
            "value '089|' doesn't match formatter ###-" in str(context.exception)
        )
