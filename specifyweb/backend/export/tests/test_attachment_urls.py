"""Tests for attachment URL construction."""
from unittest.mock import MagicMock, patch

from django.test import TestCase, override_settings

from specifyweb.backend.export.attachment_urls import (
    construct_attachment_url,
    is_attachment_field,
)


class ConstructAttachmentUrlTests(TestCase):
    """Test construct_attachment_url."""

    @override_settings(WEB_ATTACHMENT_URL='https://assets.example.org/web_asset_store')
    def test_construct_attachment_url(self):
        collection = MagicMock()
        collection.collectionname = 'Ichthyology'
        url = construct_attachment_url(collection, 'specimen_001.jpg')
        self.assertEqual(
            url,
            'https://assets.example.org/web_asset_store/Ichthyology/specimen_001.jpg'
        )

    @override_settings(WEB_ATTACHMENT_URL='https://assets.example.org/store/')
    def test_trailing_slash_stripped(self):
        collection = MagicMock()
        collection.collectionname = 'Botany'
        url = construct_attachment_url(collection, 'photo.png')
        self.assertEqual(url, 'https://assets.example.org/store/Botany/photo.png')

    def test_no_asset_server_configured(self):
        """When WEB_ATTACHMENT_URL is not set, return empty string."""
        collection = MagicMock()
        collection.collectionname = 'Botany'
        # settings may not have WEB_ATTACHMENT_URL at all
        with self.settings(WEB_ATTACHMENT_URL=None):
            url = construct_attachment_url(collection, 'photo.png')
        self.assertEqual(url, '')


class IsAttachmentFieldTests(TestCase):
    """Test is_attachment_field."""

    def test_is_attachment_field(self):
        self.assertTrue(is_attachment_field('AttachmentLocation'))
        self.assertTrue(is_attachment_field('origfilename'))
        self.assertTrue(is_attachment_field('ATTACHMENTIMAGEATTRIBUTE'))

    def test_non_attachment_field(self):
        self.assertFalse(is_attachment_field('catalogNumber'))
        self.assertFalse(is_attachment_field('scientificName'))
