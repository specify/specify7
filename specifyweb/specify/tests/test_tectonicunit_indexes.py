from django.test import TestCase
from django.db import connection


class TectonicUnitIndexTests(TestCase):
    """Verify that TectonicUnit has BTREE indexes on Name, FullName, and GUID."""

    def _get_index_names(self, table: str) -> set[str]:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT index_name FROM information_schema.statistics "
                "WHERE table_schema = DATABASE() AND table_name = %s",
                [table],
            )
            return {row[0] for row in cursor.fetchall()}

    def test_name_index_exists(self):
        indexes = self._get_index_names('tectonicunit')
        self.assertIn('TectonicUnitNameIDX', indexes)

    def test_fullname_index_exists(self):
        indexes = self._get_index_names('tectonicunit')
        self.assertIn('TectonicUnitFullNameIDX', indexes)

    def test_guid_index_exists(self):
        indexes = self._get_index_names('tectonicunit')
        self.assertIn('TectonicUnitGuidIDX', indexes)
