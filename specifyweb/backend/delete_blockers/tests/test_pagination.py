"""
Tests for paginated delete blockers (#7515).

The old implementation used Django's Collector.collect() which loads ALL
related objects into memory.  For a Taxon like "Life" with 900K+
determinations this causes OOM kills.

The fix replaces Collector with targeted COUNT + limited-ID queries per
PROTECT relationship, returning total_count alongside a capped ids list.
"""

from django.test import TestCase

from specifyweb.specify.models import (
    Collection,
    Collectionobject,
    Datatype,
    Determination,
    Discipline,
    Division,
    Geographytreedef,
    Geographytreedefitem,
    Geologictimeperiodtreedef,
    Institution,
    Taxon,
    Taxontreedef,
    Taxontreedefitem,
)
from specifyweb.backend.delete_blockers.views import _collect_delete_blockers


class TestDeleteBlockerPagination(TestCase):
    """Verify that _collect_delete_blockers returns total_count and caps ids."""

    @classmethod
    def setUpTestData(cls):
        """Build a minimal Specify object graph with many determinations."""
        cls.institution = Institution.objects.create(
            name='Test Institution',
            isaccessionsglobal=True,
            issecurityon=False,
            isserverbased=False,
            issharinglocalities=True,
            issinglegeographytree=True,
        )
        cls.division = Division.objects.create(
            institution=cls.institution, name='Test Division',
        )
        cls.geographytreedef = Geographytreedef.objects.create(name='Test gtd')
        cls.geographytreedefitem = Geographytreedefitem.objects.create(
            treedef=cls.geographytreedef, name='Planet', rankid=0,
        )
        cls.geologictimeperiodtreedef = Geologictimeperiodtreedef.objects.create(
            name='Test gtptd',
        )
        cls.taxontreedef = Taxontreedef.objects.create(name='Test ttd')
        cls.taxontreedefitem = Taxontreedefitem.objects.create(
            treedef=cls.taxontreedef, name='Life', rankid=0,
        )
        cls.datatype = Datatype.objects.create(name='Test datatype')
        cls.discipline = Discipline.objects.create(
            division=cls.division,
            datatype=cls.datatype,
            geologictimeperiodtreedef=cls.geologictimeperiodtreedef,
            geographytreedef=cls.geographytreedef,
            taxontreedef=cls.taxontreedef,
            type='fish',
        )
        cls.collection = Collection.objects.create(
            catalognumformatname='test',
            collectionname='TestCollection',
            discipline=cls.discipline,
            isembeddedcollectingevent=False,
        )

        # The taxon we will try to "delete" -- has many determinations
        cls.taxon = Taxon.objects.create(
            definition=cls.taxontreedef,
            definitionitem=cls.taxontreedefitem,
            name='Life',
            rankid=0,
        )

        # Create 150 collection objects each with a determination pointing
        # to cls.taxon.  This exceeds the id_limit of 100 so we can verify
        # pagination.
        cos = Collectionobject.objects.bulk_create([
            Collectionobject(
                catalognumber=str(i).zfill(9),
                collection=cls.collection,
                collectionmemberid=cls.collection.id,
            )
            for i in range(150)
        ])
        Determination.objects.bulk_create([
            Determination(
                collectionobject=co,
                collectionmemberid=cls.collection.id,
                taxon=cls.taxon,
                iscurrent=True,
            )
            for co in cos
        ])

    def test_total_count_present(self):
        """Every blocker entry must include total_count."""
        using = 'default'
        result = _collect_delete_blockers(self.taxon, using)
        for entry in result:
            self.assertIn(
                'total_count', entry,
                f"Missing total_count in blocker for "
                f"{entry.get('table')}.{entry.get('field')}",
            )

    def test_total_count_reflects_true_count(self):
        """total_count must reflect the real number of blocking rows."""
        using = 'default'
        result = _collect_delete_blockers(self.taxon, using)
        det_blocker = next(
            (e for e in result
             if e['table'] == 'Determination' and e['field'] == 'taxon'),
            None,
        )
        self.assertIsNotNone(det_blocker, 'Expected a Determination/taxon blocker')
        self.assertEqual(det_blocker['total_count'], 150)

    def test_ids_capped_at_limit(self):
        """ids list must not exceed the default limit of 100."""
        using = 'default'
        result = _collect_delete_blockers(self.taxon, using)
        det_blocker = next(
            (e for e in result
             if e['table'] == 'Determination' and e['field'] == 'taxon'),
            None,
        )
        self.assertIsNotNone(det_blocker)
        self.assertLessEqual(len(det_blocker['ids']), 100)

    def test_small_blocker_has_exact_ids(self):
        """When blocker count is below limit, ids lists all of them and
        total_count equals len(ids)."""
        taxon2 = Taxon.objects.create(
            definition=self.taxontreedef,
            definitionitem=self.taxontreedefitem,
            name='SmallTaxon',
            rankid=0,
        )
        cos = Collectionobject.objects.bulk_create([
            Collectionobject(
                catalognumber=str(i + 9000).zfill(9),
                collection=self.collection,
                collectionmemberid=self.collection.id,
            )
            for i in range(3)
        ])
        Determination.objects.bulk_create([
            Determination(
                collectionobject=co,
                collectionmemberid=self.collection.id,
                taxon=taxon2,
                iscurrent=True,
            )
            for co in cos
        ])

        using = 'default'
        result = _collect_delete_blockers(taxon2, using)
        det_blocker = next(
            (e for e in result
             if e['table'] == 'Determination' and e['field'] == 'taxon'),
            None,
        )
        self.assertIsNotNone(det_blocker)
        self.assertEqual(det_blocker['total_count'], 3)
        self.assertEqual(len(det_blocker['ids']), 3)

    def test_backward_compatible_keys(self):
        """Response must still contain table, field, and ids."""
        using = 'default'
        result = _collect_delete_blockers(self.taxon, using)
        self.assertGreater(len(result), 0, 'Expected at least one blocker')
        for entry in result:
            self.assertIn('table', entry)
            self.assertIn('field', entry)
            self.assertIn('ids', entry)
