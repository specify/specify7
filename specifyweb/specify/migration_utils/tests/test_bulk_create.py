import unittest
from unittest.mock import MagicMock, call

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

        # Simulate queryset chain:
        # objects.filter(...).order_by(...)
        mock_queryset = MagicMock()
        mock_queryset.order_by.return_value = []  # no existing rows
        mock_manager.filter.return_value = mock_queryset

        # bulk_create should be called on manager
        mock_manager.bulk_create = MagicMock()

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
        # Call function under test
        # -----------------------
        result = bulk_create_splocaleitemstr_idempotent(mock_model, rows)

        # -----------------------
        # Assertions: result
        # -----------------------
        self.assertEqual(result, 2)

        # -----------------------
        # Assertions: ORM behavior
        # -----------------------
        self.assertTrue(mock_manager.filter.called)

        # Ensure filter was called at least once
        mock_manager.filter.assert_called()

        # Ensure bulk_create was used (core behavior of idempotent insert)
        self.assertTrue(mock_manager.bulk_create.called)

        # Inspect bulk_create payload
        args, kwargs = mock_manager.bulk_create.call_args

        created_objects = args[0]
        self.assertEqual(len(created_objects), 2)

        # Optional: verify structure of created objects
        self.assertEqual(created_objects[0].text, "Test1")
        self.assertEqual(created_objects[0].language, "en")
        self.assertEqual(created_objects[1].text, "Test2")
        self.assertEqual(created_objects[1].language, "es")