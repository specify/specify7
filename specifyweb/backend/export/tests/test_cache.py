from django.db import connection
from django.test import TestCase, TransactionTestCase

from specifyweb.backend.export.cache import (
    create_cache_table, drop_cache_table, get_cache_table_name,
    _build_single_cache,
)
from specifyweb.backend.export.dwca_utils import sanitize_column_name


class CacheTableNameTests(TestCase):

    def test_cache_table_name_generation(self):
        name = get_cache_table_name(5, 4)
        self.assertEqual(name, 'dwc_cache_5_4')

    def test_cache_table_name_sanitization(self):
        # Special chars in prefix are not stripped by get_cache_table_name,
        # but create_cache_table sanitizes the full name.
        name = get_cache_table_name(1, 2, prefix='bad;prefix')
        # create_cache_table will strip the semicolon
        self.assertIn('bad', name)


class CacheTableOperationsTests(TransactionTestCase):

    def _table_exists(self, name):
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT COUNT(*) FROM information_schema.tables "
                "WHERE table_name = %s", [name]
            )
            return cursor.fetchone()[0] > 0

    def test_create_and_drop_cache_table(self):
        table_name = 'dwc_cache_test_99'
        # create_cache_table auto-prepends an `id` PK; only pass user columns.
        columns = [('val', 'VARCHAR(128)')]
        create_cache_table(table_name, columns)
        self.assertTrue(self._table_exists(table_name))

        drop_cache_table(table_name)
        self.assertFalse(self._table_exists(table_name))

    def test_cache_table_name_sanitization_in_create(self):
        # Semicolons and other special chars are stripped from table name.
        dirty_name = 'test;drop--table'
        columns = [('val', 'INT')]
        create_cache_table(dirty_name, columns)
        safe_name = 'testdroptable'
        self.assertTrue(self._table_exists(safe_name))
        drop_cache_table(safe_name)


class SanitizeColumnNameTests(TestCase):

    def test_simple_name(self):
        self.assertEqual(sanitize_column_name('catalogNumber'), 'catalogNumber')

    def test_uri_with_slash(self):
        self.assertEqual(
            sanitize_column_name('http://rs.tdwg.org/dwc/terms/catalogNumber'),
            'catalogNumber',
        )

    def test_uri_with_hash(self):
        self.assertEqual(
            sanitize_column_name('http://purl.org/dc/terms#modified'),
            'modified',
        )

    def test_special_chars_replaced(self):
        self.assertEqual(sanitize_column_name('some-field.name'), 'some_field_name')

    def test_truncation_at_64(self):
        long_name = 'a' * 100
        self.assertEqual(len(sanitize_column_name(long_name)), 64)


class BuildSingleCacheTests(TransactionTestCase):

    def _table_exists(self, name):
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT COUNT(*) FROM information_schema.tables "
                "WHERE table_name = %s AND table_schema = DATABASE()", [name]
            )
            return cursor.fetchone()[0] > 0

    def _get_columns(self, table_name):
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_name = %s AND table_schema = DATABASE() "
                "ORDER BY ordinal_position", [table_name]
            )
            return [row[0] for row in cursor.fetchall()]

    def test_build_creates_table_with_columns(self):
        """Verify cache table creation with correct columns from field terms."""
        table_name = 'dwc_cache_build_test'
        columns = [
            ('occurrence_id', 'VARCHAR(256)'),
            ('catalogNumber', 'TEXT'),
            ('locality', 'TEXT'),
        ]
        try:
            create_cache_table(table_name, columns)
            self.assertTrue(self._table_exists(table_name))

            db_columns = self._get_columns(table_name)
            self.assertIn('occurrence_id', db_columns)
            self.assertIn('catalogNumber', db_columns)
            self.assertIn('locality', db_columns)
            # 3 user columns + auto-prepended `id` primary key
            self.assertEqual(len(db_columns), 4)
            self.assertIn('id', db_columns)
        finally:
            drop_cache_table(table_name)

