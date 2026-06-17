import unittest
from unittest.mock import MagicMock, patch

from specifyweb.specify.migration_utils.schema_reader import (
    bulk_create_splocaleitemstr_idempotent
)


class BulkCreateSplocaleitemstrIdempotentTest(unittest.TestCase):

    @patch("specifyweb.specify.migration_utils.schema_reader.bulk_create_splocaleitemstr_idempotent")
    def test_bulk_create_splocaleitemstr_idempotent(self, mock_bulk_create):
        # -----------------------
        # Mock model + queryset
        # -----------------------
        mock_model = MagicMock()
        mock_model.objects = MagicMock()

        # Simulate existing DB rows (empty = nothing exists yet)
        mock_qs = MagicMock()
        mock_qs.filter.return_value.order_by.return_value = []
        mock_model.objects.filter.return_value = mock_qs

        # -----------------------
        # Input rows
        # -----------------------
        item1 = MagicMock()
        item1.pk = 1

        item2 = MagicMock()
        item2.pk = 2

        rows = [
            {"itemname": item1, "text": "Test1", "language": "en"},
            {"itemdesc": item2, "text": "Test2", "language": "es"},
        ]

        # -----------------------
        # Call function
        # -----------------------
        result = bulk_create_splocaleitemstr_idempotent(mock_model, rows)

        # -----------------------
        # Assertions
        # -----------------------
        self.assertEqual(result, 2)
        mock_model.objects.filter.assert_called()

        # Should have attempted bulk create once
        self.assertTrue(mock_bulk_create.called)


if __name__ == "__main__":
    unittest.main()