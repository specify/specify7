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

        # Allow: filter().filter().order_by()
        mock_qs.filter.return_value = mock_qs
        mock_qs.order_by.return_value = []

        mock_manager.filter.return_value = mock_qs

        # Mock bulk_create on manager
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
        # Inspect bulk_create payload
        # -----------------------
        args, _kwargs = mock_manager.bulk_create.call_args
        created_objects = args[0]

        self.assertEqual(len(created_objects), 2)

        # -----------------------
        # Validate mapping correctness
        # -----------------------
        self.assertEqual(created_objects[0].text, "Test1")
        self.assertEqual(created_objects[0].language, "en")

        self.assertEqual(created_objects[1].text, "Test2")
        self.assertEqual(created_objects[1].language, "es")


if __name__ == "__main__":
    unittest.main()