from specifyweb.specify.tests.test_api import ApiTransactionTests
from specifyweb.specify.uiformatters import (
    AnyCharField,
    CNNField,
    NumericField,
    SeparatorField,
    UIFormatter,
)


class TestAutonumberingContext(ApiTransactionTests):

    def setUp(self):
        super().setUp()
        self.cnn_ui_formatter = UIFormatter(
            model_name="CollectionObject",
            field_name="CatalogNumber",
            fields=[CNNField()],
            format_name="CatalogNumberNumeric",
        )
        self.complicated_formatter = UIFormatter(
            model_name="CollectionObject",
            field_name="Text1",
            fields=[
                AnyCharField(size=2, value="AA", inc=False, by_year=False),
                SeparatorField(size=1, value="-", inc=False, by_year=False),
                NumericField(
                    size=3,
                    inc=3,
                ),
            ],
            format_name="TestFormatter",
        )
