import unittest
from unittest.mock import MagicMock
from specifyweb.specify.migration_utils.schema_reader import bulk_create_splocaleitemstr_idempotent

class BulkCreateSplocaleitemstrIdempotentTest(unittest.TestCase):
    def test_bulk_create_splocaleitemstr_idempotent(self):
        mock_model = MagicMock()
        mock_model.objects = MagicMock()
        
        # Setup filter chain
        mock_filter = MagicMock()
        mock_filter.filter.return_value.order_by.return_value = []
        mock_model.objects.filter.return_value = mock_filter
        
        rows = [
            {"itemname": MagicMock(pk=1), "text": "Test1", "language": "en"},
            {"itemdesc": MagicMock(pk=2), "text": "Test2", "language": "es"}
        ]
        
        result = bulk_create_splocaleitemstr_idempotent(mock_model, rows)
        self.assertEqual(result, 2)
        mock_model.objects.filter.assert_called()
        self.assertEqual(mock_model.objects.bulk_create.call_count, 2)

if __name__ == '__main__':
    unittest.main()