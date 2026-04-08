"""Tests for the v2 RSS feed update logic."""
from datetime import timedelta
from unittest.mock import patch, MagicMock

from django.test import TestCase
from django.utils import timezone


class UpdateFeedV2Tests(TestCase):
    """Test update_feed_v2 scheduling logic."""

    @patch('specifyweb.backend.export.dwca_from_cache.make_dwca_from_dataset')
    @patch('specifyweb.backend.export.cache.build_cache_tables')
    @patch('specifyweb.backend.export.models.ExportDataSet')
    def test_skips_fresh(self, MockModel, mock_build, mock_dwca):
        """Dataset updated recently should be skipped."""
        dataset = MagicMock()
        dataset.frequency = 7
        dataset.lastexported = timezone.now() - timedelta(days=1)
        dataset.exportname = 'test_fresh'

        MockModel.objects.filter.return_value = [dataset]
        from specifyweb.backend.export.feed import update_feed_v2
        updated = update_feed_v2()

        mock_build.assert_not_called()
        self.assertEqual(updated, [])

    @patch('specifyweb.backend.export.dwca_from_cache.make_dwca_from_dataset')
    @patch('specifyweb.backend.export.cache.build_cache_tables')
    @patch('specifyweb.backend.export.models.ExportDataSet')
    def test_updates_stale(self, MockModel, mock_build, mock_dwca):
        """Dataset overdue for update should be rebuilt."""
        dataset = MagicMock()
        dataset.frequency = 7
        dataset.lastexported = timezone.now() - timedelta(days=10)
        dataset.exportname = 'test_stale'

        MockModel.objects.filter.return_value = [dataset]
        from specifyweb.backend.export.feed import update_feed_v2
        updated = update_feed_v2()

        mock_build.assert_called_once_with(dataset)
        self.assertIn('test_stale', updated)
