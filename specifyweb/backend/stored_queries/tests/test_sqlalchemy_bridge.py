from unittest import TestCase
from unittest.mock import patch

import sqlalchemy

from .tests import setup_sqlalchemy


class TestSQLAlchemyBridge(TestCase):
    def setUp(self):
        self.engine = sqlalchemy.create_engine('sqlite://')
        self.addCleanup(self.engine.dispose)
        # MySQL adds its single-row DUAL table to a SELECT with no source table.
        with self.engine.begin() as connection:
            connection.exec_driver_sql('CREATE TABLE DUAL (dummy INTEGER)')
            connection.exec_driver_sql('INSERT INTO DUAL VALUES (1)')

    def execute_bridge(self, rows):
        with patch(
            'specifyweb.backend.stored_queries.tests.tests.sqlalchemy.create_engine',
            return_value=self.engine,
        ), patch(
            'specifyweb.backend.stored_queries.tests.tests.connection',
        ) as django_connection:
            cursor = django_connection.cursor.return_value
            cursor.fetchall.return_value = rows
            cursor.description = [('recordId',), ('displayName',)]
            setup_sqlalchemy('mysql://unused')
            with self.engine.connect() as connection:
                result = connection.execute(sqlalchemy.text('SELECT original_query'))
                columns = list(result.keys())
                fetched = result.fetchall()
            cursor.execute.assert_called_once_with('SELECT original_query', ())
            return columns, fetched

    def test_zero_rows_preserves_columns_without_building_a_union(self):
        with patch(
            'specifyweb.backend.stored_queries.tests.tests.sqlalchemy.union_all',
        ) as union_all:
            columns, rows = self.execute_bridge([])
        union_all.assert_not_called()
        self.assertEqual(columns, ['recordId', 'displayName'])
        self.assertEqual(rows, [])

    def test_nonempty_results_preserve_values_and_duplicate_rows(self):
        expected = [(17, 'Darwin'), (17, 'Darwin'), (91, 'Wallace')]
        columns, rows = self.execute_bridge(expected)
        self.assertEqual(columns, ['recordId', 'displayName'])
        self.assertEqual(rows, expected)
