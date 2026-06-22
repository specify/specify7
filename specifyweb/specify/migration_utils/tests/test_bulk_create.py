import unittest
from unittest.mock import MagicMock

from specifyweb.specify.migration_utils.schema_reader import (
    bulk_create_splocaleitemstr_idempotent,
)


class BulkCreateSplocaleitemstrIdempotentTest(unittest.TestCase):

    def test_bulk_create_splocaleitemstr_idempotent(self):
        # -----------------------
        # Mock model + manager
        # -----------------------
        mock_model = MagicMock()
        mock_manager = MagicMock()
        mock_model.objects = mock_manager

        # -----------------------
        # Mock queryset chain
        # -----------------------
        mock_qs = MagicMock()
        mock_qs.filter.return_value = mock_qs
        mock_qs.order_by.return_value = []
        mock_manager.filter.return_value = mock_qs

        # -----------------------
        # Mock bulk_create
        # -----------------------
        mock_manager.bulk_create = MagicMock()

        # -----------------------
        # Input data
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
        # Execute
        # -----------------------
        result = bulk_create_splocaleitemstr_idempotent(mock_model, rows)

        # -----------------------
        # Assert result
        # -----------------------
        self.assertEqual(result, 2)

        # -----------------------
        # Assert ORM interaction
        # -----------------------
        self.assertTrue(mock_manager.filter.called)
        self.assertTrue(mock_manager.bulk_create.called)

        # -----------------------
        # IMPORTANT: validate call structure
        # -----------------------
        self.assertEqual(mock_manager.bulk_create.call_count, 2)

        # First call (itemname)
        first_args, _ = mock_manager.bulk_create.call_args_list[0]
        first_batch = first_args[0]

        self.assertEqual(len(first_batch), 1)
        self.assertEqual(first_batch[0].text, "Test1")
        self.assertEqual(first_batch[0].language, "en")

        # Second call (itemdesc)
        second_args, _ = mock_manager.bulk_create.call_args_list[1]
        second_batch = second_args[0]

        self.assertEqual(len(second_batch), 1)
        self.assertEqual(second_batch[0].text, "Test2")
        self.assertEqual(second_batch[0].language, "es")


if __name__ == "__main__":
    unittest.main()