"""
Tests that performance-critical indexes exist on tree tables and large lookup tables.

These indexes are added by migration 0048_add_tree_performance_indexes.
The tests query information_schema.statistics to verify index existence,
so they work against any MySQL/MariaDB backend (including the test DB).
"""

from django.db import connection
from django.test import TransactionTestCase


def index_exists(table_name: str, column_names: list[str]) -> bool:
    """Check if an index exists covering the given column(s) on a table.

    For compound indexes, verifies all columns are part of the same index
    in the correct positional order.
    """
    db_name = connection.settings_dict['NAME']
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT INDEX_NAME, SEQ_IN_INDEX, COLUMN_NAME
            FROM information_schema.statistics
            WHERE TABLE_SCHEMA = %s
              AND LOWER(TABLE_NAME) = LOWER(%s)
              AND LOWER(COLUMN_NAME) IN ({})
            ORDER BY INDEX_NAME, SEQ_IN_INDEX
            """.format(','.join(['LOWER(%s)'] * len(column_names))),
            [db_name, table_name] + column_names,
        )
        rows = cursor.fetchall()

    if len(column_names) == 1:
        return len(rows) > 0

    # For compound indexes, group by index name and check column order
    from collections import defaultdict
    indexes = defaultdict(list)
    for idx_name, seq, col in rows:
        indexes[idx_name].append((seq, col.lower()))

    target = [c.lower() for c in column_names]
    for cols in indexes.values():
        cols_sorted = [c for _, c in sorted(cols)]
        if cols_sorted[:len(target)] == target:
            return True
    return False


# -- Tree node indexes (NodeNumber, HighestChildNodeNumber) --

class TestTaxonIndexes(TransactionTestCase):
    def test_nodenumber_index(self):
        self.assertTrue(
            index_exists('taxon', ['NodeNumber']),
            "Missing index on taxon.NodeNumber",
        )

    def test_highestchildnodenumber_index(self):
        self.assertTrue(
            index_exists('taxon', ['HighestChildNodeNumber']),
            "Missing index on taxon.HighestChildNodeNumber",
        )

    def test_rankid_index(self):
        self.assertTrue(
            index_exists('taxon', ['RankID']),
            "Missing index on taxon.RankID",
        )


class TestGeographyIndexes(TransactionTestCase):
    def test_nodenumber_index(self):
        self.assertTrue(
            index_exists('geography', ['NodeNumber']),
            "Missing index on geography.NodeNumber",
        )

    def test_highestchildnodenumber_index(self):
        self.assertTrue(
            index_exists('geography', ['HighestChildNodeNumber']),
            "Missing index on geography.HighestChildNodeNumber",
        )


class TestStorageIndexes(TransactionTestCase):
    def test_nodenumber_index(self):
        self.assertTrue(
            index_exists('storage', ['NodeNumber']),
            "Missing index on storage.NodeNumber",
        )

    def test_highestchildnodenumber_index(self):
        self.assertTrue(
            index_exists('storage', ['HighestChildNodeNumber']),
            "Missing index on storage.HighestChildNodeNumber",
        )


class TestGeologictimeperiodIndexes(TransactionTestCase):
    def test_nodenumber_index(self):
        self.assertTrue(
            index_exists('geologictimeperiod', ['NodeNumber']),
            "Missing index on geologictimeperiod.NodeNumber",
        )

    def test_highestchildnodenumber_index(self):
        self.assertTrue(
            index_exists('geologictimeperiod', ['HighestChildNodeNumber']),
            "Missing index on geologictimeperiod.HighestChildNodeNumber",
        )


class TestLithostratIndexes(TransactionTestCase):
    def test_nodenumber_index(self):
        self.assertTrue(
            index_exists('lithostrat', ['NodeNumber']),
            "Missing index on lithostrat.NodeNumber",
        )

    def test_highestchildnodenumber_index(self):
        self.assertTrue(
            index_exists('lithostrat', ['HighestChildNodeNumber']),
            "Missing index on lithostrat.HighestChildNodeNumber",
        )


class TestTectonicunitIndexes(TransactionTestCase):
    def test_nodenumber_index(self):
        self.assertTrue(
            index_exists('tectonicunit', ['NodeNumber']),
            "Missing index on tectonicunit.NodeNumber",
        )

    def test_highestchildnodenumber_index(self):
        self.assertTrue(
            index_exists('tectonicunit', ['HighestChildNodeNumber']),
            "Missing index on tectonicunit.HighestChildNodeNumber",
        )


# -- GUID indexes --

class TestLocalityGuidIndex(TransactionTestCase):
    def test_guid_index(self):
        self.assertTrue(
            index_exists('locality', ['GUID']),
            "Missing index on locality.GUID",
        )


class TestCollectionobjectGuidIndex(TransactionTestCase):
    def test_guid_index(self):
        self.assertTrue(
            index_exists('collectionobject', ['GUID']),
            "Missing index on collectionobject.GUID",
        )


# -- Compound and boolean indexes --

class TestDeterminationCompoundIndex(TransactionTestCase):
    def test_iscurrent_collectionmemberid_index(self):
        self.assertTrue(
            index_exists('determination', ['IsCurrent', 'CollectionMemberID']),
            "Missing compound index on determination(IsCurrent, CollectionMemberID)",
        )


class TestCollectionobjectgroupjoinIsPrimaryIndex(TransactionTestCase):
    def test_isprimary_index(self):
        self.assertTrue(
            index_exists('collectionobjectgroupjoin', ['IsPrimary']),
            "Missing index on collectionobjectgroupjoin.IsPrimary",
        )
