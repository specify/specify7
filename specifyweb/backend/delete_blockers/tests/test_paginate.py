from functools import partial
from unittest.mock import patch

from specifyweb.backend.delete_blockers import paginate
from specifyweb.backend.delete_blockers.validators import DELETE_BLOCKER_LIMIT
from specifyweb.backend.delete_blockers.utils import blocker_relationships_for_obj
from specifyweb.backend.delete_blockers.field import django_field_to_blocker_field
from specifyweb.backend.delete_blockers.paginate import (
    ReferencePaginator,
    SpLocaleContainerToDisciplinePaginator,
    TreeNodeToDefinitionPaginator,
    TreeRankToDefinitionPaginator,
    TreeTableReferencePaginator,
    resolve_reference_paginator,
)
from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.backend.trees.extras import renumber_tree
from specifyweb.backend.trees.tests.test_trees import TestTreeSetup

class PaginatorTestMixin:
    """
    This class is meant to be an abstract base class for tests on
    ReferencePaginators.
    It provides some simple tests for functionality that all paginators should
    implement, and gets run by UnitTest automatically.

    Subclasses using this Mixin should:
      - define a make_paginator method that returns the desired paginator
      - define a record_ids attribute which is a sorted (ascending) list of all
      record IDs that could be returned by the paginator with a limit of 0
    """
    """
    Other notes:
    Looks like the common 'clean' way of having a class that's inherited but
    NOT run/discovered by UnitTest is to not make it a unit test subclass in
    the first place. Unfourtanetly this means that IDE support is limited
    (there is no assertEqual, setUp, or other methods normally on UnitTest).
    """
    record_ids: list[int]

    def test_default_paginator(self):
        paginator = self.make_paginator()
        count = paginator.count()
        self.assertEqual(count, len(self.record_ids))
        fetched_page = paginator.fetch_page()
        self.assertEqual(fetched_page, self.record_ids[:DELETE_BLOCKER_LIMIT])

    def test_custom_limit(self):
        custom_limit = 5
        paginator = self.make_paginator(limit=custom_limit)
        count = paginator.count()
        self.assertEqual(count, len(self.record_ids))
        fetched_page = paginator.fetch_page()
        self.assertEqual(fetched_page, self.record_ids[:custom_limit])

    def test_zero_limit_returns_all(self):
        paginator = self.make_paginator(limit=0)
        count = paginator.count()
        self.assertEqual(count, len(self.record_ids))
        fetched_page = paginator.fetch_page()
        self.assertEqual(fetched_page, self.record_ids)

    def test_custom_anchor(self):
        fetch_limit = 10
        # The record we choose to anchor from is largely arbitrary
        # Going to try and set the anchor ID to the 11 object
        # If these tests or defaults have been changed and there's less than
        # that number of records that were created for the test, instead try
        # and take the record that's 3 from the end as the anchor
        # This will cause an IndexError if there are no records, but that's
        # probably a good thing (make sure there's records to test!) :)
        anchor_index = min(
            fetch_limit,
            max(0, len(self.record_ids) - 3)
        )
        record_to_anchor = self.record_ids[anchor_index]
        paginator = self.make_paginator(anchor_id=record_to_anchor, limit=fetch_limit)
        fetched_page = paginator.fetch_page()
        self.assertEqual(
            fetched_page,
            self.record_ids[anchor_index + 1: anchor_index + 1 + fetch_limit]
        )

    def test_backwards_fetching(self):
        paginator = self.make_paginator(backwards=True)
        fetched_page = paginator.fetch_page()
        expected_response = sorted(self.record_ids[-DELETE_BLOCKER_LIMIT:], reverse=True)
        self.assertEqual(fetched_page, list(expected_response))

    def make_paginator(self, limit: int = DELETE_BLOCKER_LIMIT, anchor_id: int | None = None, backwards: bool = False) -> ReferencePaginator:
        raise NotImplementedError(f"{self.__class__} must implement make_paginator method")

class ReferencePaginatorTests(PaginatorTestMixin, ApiTests):
    def setUp(self):
        super().setUp()
        self.accession = models.Accession.objects.create(
            accessionnumber="PAGINATOR",
            division=self.division,
        )
        self.make_co(DELETE_BLOCKER_LIMIT * 2)
        models.Collectionobject.objects.update(
            accession=self.accession
        )
        co_to_accession_field = models.Collectionobject._meta.get_field("accession")
        self.blocker_field = django_field_to_blocker_field(co_to_accession_field)
        self.record_ids: list[int] = list(models.Collectionobject.objects.all().order_by("pk").values_list("pk", flat=True))

    def make_paginator(self, limit = DELETE_BLOCKER_LIMIT, anchor_id = None, backwards = False):
        return ReferencePaginator(
            self.accession,
            self.blocker_field,
            limit=limit,
            anchor_id=anchor_id,
            backwards=backwards
        )

class TreeTableReferencePaginatorTests(PaginatorTestMixin, TestTreeSetup):
    def setUp(self):
        super().setUp()
        # Create the taxon tree and get a list of IDs for all descendents of a
        # node we're testing: the class Actinopterygii
        taxon_ids = self.populate_taxon_tree()
        renumber_tree("taxon")
        # The paginator will use the in memory version of Actinopterygii, so
        # this will update the instance and fetch the nodeNumber and
        # highestChildNodeNumber
        self.initial_parent.refresh_from_db()
        self.populate_determinations()
        determination_ids = models.Determination.objects.filter(
            taxon__id__in=taxon_ids
        ).order_by("pk").values_list("pk", flat=True)
        self.record_ids = list(determination_ids)

    def populate_taxon_tree(self):
        treedef_items = self.taxontreedef.treedefitems.order_by("rankid").all()
        get_rank = partial(TestTreeSetup.get_treedefitem_at_rankid, treedef_items)
        # This will hold the nodes which are descendents of a particular
        # subtree we're testing: everything under Actinopterygii
        # The Paginator should only return these descendents
        records = []
        root = models.Taxon.objects.create(
            name="Life",
            fullname="Life",
            parent=None,
            definition=self.taxontreedef,
            definitionitem=get_rank(0)
        )
        kingdom = models.Taxon.objects.create(
            name="Animalia",
            fullname="Animalia",
            parent=root,
            definition=self.taxontreedef,
            definitionitem=get_rank(10)
        )
        phylum = models.Taxon.objects.create(
            name="Chordata",
            fullname="Chordata",
            parent=kingdom,
            definition=self.taxontreedef,
            definitionitem=get_rank(30)
        )
        # The class Actinopterygii
        self.initial_parent = actinopterygii = models.Taxon.objects.create(
            name="Actinopterygii",
            fullname="Actinopterygii",
            parent=phylum,
            definition=self.taxontreedef,
            definitionitem=get_rank(60)
        )

        # order under Actinopterygii
        amiiformes = models.Taxon.objects.create(
            name="Amiiformes",
            fullname="Amiiformes",
            parent=actinopterygii,
            definition=self.taxontreedef,
            definitionitem=get_rank(100)
        )
        records.append(amiiformes.id)

        # The class Chondrichthyes
        chondrichthyes = models.Taxon.objects.create(
            name="Chondrichthyes",
            fullname="Chondrichthyes",
            parent=phylum,
            definition=self.taxontreedef,
            definitionitem=get_rank(60)
        )

        # order under Actinopterygii
        acipenseriformes = models.Taxon.objects.create(
            name="Acipenseriformes",
            fullname="Acipenseriformes",
            parent=actinopterygii,
            definition=self.taxontreedef,
            definitionitem=get_rank(100)
        )
        records.append(acipenseriformes.id)

        # order under chondrichthyes
        models.Taxon.objects.create(
            name="Chimaeriformes",
            fullname="Chimaeriformes",
            parent=chondrichthyes,
            definition=self.taxontreedef,
            definitionitem=get_rank(100)
        )

        # family under Acipenseriformes
        polyodontidae = models.Taxon.objects.create(
            name="Polyodontidae",
            fullname="Polyodontidae",
            parent=acipenseriformes,
            definition=self.taxontreedef,
            definitionitem=get_rank(140)
        )

        records.append(polyodontidae.id)

        # order under chondrichthyes
        rajiformes = models.Taxon.objects.create(
            name="Rajiformes",
            fullname="Rajiformes",
            parent=chondrichthyes,
            definition=self.taxontreedef,
            definitionitem=get_rank(100)
        )

        # order under Actinopterygii
        lepisosteiformes = models.Taxon.objects.create(
            name="Lepisosteiformes",
            fullname="Lepisosteiformes",
            parent=actinopterygii,
            definition=self.taxontreedef,
            definitionitem=get_rank(100)
        )
        records.append(lepisosteiformes.id)

        # order under chondrichthyes
        models.Taxon.objects.create(
            name="Squaliformes",
            fullname="Squaliformes",
            parent=chondrichthyes,
            definition=self.taxontreedef,
            definitionitem=get_rank(100)
        )

        # family under Rajiformes
        models.Taxon.objects.create(
            name="Rajidae",
            fullname="Rajidae",
            parent=rajiformes,
            definition=self.taxontreedef,
            definitionitem=get_rank(140)
        )
        return records

    def populate_determinations(self):
        all_taxa = list(models.Taxon.objects.all().values_list("pk", flat=True))
        cos = self.make_co(len(all_taxa))
        models.Determination.objects.bulk_create(
            [
                models.Determination(
                    collectionmemberid=self.collection.pk,
                    iscurrent=True,
                    collectionobject=co,
                    taxon_id=all_taxa[co_idx],
                    preferredtaxon_id=all_taxa[co_idx]
                )
                for co_idx, co in enumerate(cos)
            ]
        )



    def _get_blocker_field(self):
        # This can be any relationship to Taxon. We're going to arbitrarily pick
        # one that blocks deletion: Determination -> taxon.
        # REFACTOR: We can make this really generic using
        # blocker_relationships_for_obj to arbitrarily pick a PROTECT
        # relationship, though we would have to modify populate_determinations
        # to add records of that table instead. Do-able, but a little more work.
        # And hopefully Determination -> taxon is pretty stable...
        django_field = models.Determination._meta.get_field("taxon")
        blocker_field = django_field_to_blocker_field(django_field)
        assert not blocker_field.cascades, "Determination -> taxon is set to CASCADE! Please change the field being used in this test"
        return blocker_field


    def make_paginator(self, limit = DELETE_BLOCKER_LIMIT, anchor_id = None, backwards = False):
        blocker_field = self._get_blocker_field()
        return TreeTableReferencePaginator(
            self.initial_parent,
            blocker_field,
            limit=limit,
            anchor_id=anchor_id,
            backwards=backwards
        )


class TreeNodeToDefinitionPaginatorTests(PaginatorTestMixin, TestTreeSetup):
    def setUp(self):
        super().setUp()
        other_definition = models.Taxontreedef.objects.create(
            discipline=self.discipline,
            name="Other Taxon Tree"
        )
        self.make_taxon_ranks(other_definition)
        self.populate_tree(other_definition)
        self.record_ids = self.populate_tree(self.taxontreedef)
        renumber_tree("Taxon")

    def populate_tree(self, treedef):
        treedef_items = treedef.treedefitems.order_by("rankid").all()
        get_rank = partial(TestTreeSetup.get_treedefitem_at_rankid, treedef_items)
        root = models.Taxon.objects.create(
            name="Life",
            fullname="Life",
            parent=None,
            definition=treedef,
            definitionitem=get_rank(0)
        )
        kingdom = models.Taxon.objects.create(
            name="Animalia",
            fullname="Animalia",
            parent=root,
            definition=treedef,
            definitionitem=get_rank(10)
        )
        models.Taxon.objects.create(
            name="Chordata",
            fullname="Chordata",
            parent=kingdom,
            definition=treedef,
            definitionitem=get_rank(30)
        )
        return [root.pk]

    def _get_blocker_field(self):
        django_field = models.Taxon._meta.get_field("definition")
        blocker_field = django_field_to_blocker_field(django_field)
        return blocker_field

    def make_paginator(self, limit = DELETE_BLOCKER_LIMIT, anchor_id = None, backwards = False):
        blocker_field = self._get_blocker_field()
        return TreeNodeToDefinitionPaginator(
            self.taxontreedef,
            blocker_field,
            limit=limit,
            anchor_id=anchor_id,
            backwards=backwards
        )


class TreeRankToDefinitionPaginatorTests(PaginatorTestMixin, TestTreeSetup):
    def setUp(self):
        super().setUp()
        other_definition = models.Taxontreedef.objects.create(
            discipline=self.discipline,
            name="Other Taxon Tree"
        )
        self.make_taxon_ranks(other_definition)
        self.populate_tree(other_definition)
        self.populate_tree(self.taxontreedef)
        renumber_tree("Taxon")
        first_rank = models.Taxontreedefitem.objects.get(
            treedef=self.taxontreedef,
            rankid=0,
            parent__isnull=True
        )
        self.record_ids = [first_rank.pk]

    def populate_tree(self, treedef):
        # This isn't strictly needed for this test, but keeping it here in case
        # there's ever some side-effects with having tree records
        treedef_items = treedef.treedefitems.order_by("rankid").all()
        get_rank = partial(TestTreeSetup.get_treedefitem_at_rankid, treedef_items)
        root = models.Taxon.objects.create(
            name="Life",
            fullname="Life",
            parent=None,
            definition=self.taxontreedef,
            definitionitem=get_rank(0)
        )
        kingdom = models.Taxon.objects.create(
            name="Animalia",
            fullname="Animalia",
            parent=root,
            definition=self.taxontreedef,
            definitionitem=get_rank(10)
        )
        models.Taxon.objects.create(
            name="Chordata",
            fullname="Chordata",
            parent=kingdom,
            definition=self.taxontreedef,
            definitionitem=get_rank(30)
        )
        return [root.pk]

    def _get_blocker_field(self):
        django_field = models.Taxontreedefitem._meta.get_field("treedef")
        blocker_field = django_field_to_blocker_field(django_field)
        return blocker_field

    def make_paginator(self, limit = DELETE_BLOCKER_LIMIT, anchor_id = None, backwards = False):
        blocker_field = self._get_blocker_field()
        return TreeRankToDefinitionPaginator(
            self.taxontreedef,
            blocker_field,
            limit=limit,
            anchor_id=anchor_id,
            backwards=backwards
        )


# TODO: ReferencePaginator resolution and SpLocaleContainer -> Discipline optimized paginaotr