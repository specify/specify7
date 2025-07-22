from specifyweb.specify.models import (
    Collection,
    Collectionobjecttype,
    Discipline,
    Division,
    Geographytreedef,
    Institution,
    Storage,
    Storagetreedef,
    Taxontreedef,
)

from unittest import skip

from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.specify.tests.test_tree_utils import TestMultipleTaxonTreeContext
from specifyweb.specify.tree_utils import get_search_filters


class TestGetSearchFilters(TestMultipleTaxonTreeContext, ApiTests):

    @skip("storage case cannot be tested since there can only be 1 institution")
    def test_storage(self):
        storage_tree_def_1 = Storagetreedef.objects.create(name="Test Storage tree def")
        storage_tree_def_2 = Storagetreedef.objects.create(
            name="Test Storage tree def2"
        )

        institution_2 = Institution.objects.create(
            name="Test Institution2",
            isaccessionsglobal=True,
            issecurityon=False,
            isserverbased=False,
            issharinglocalities=True,
            issinglegeographytree=True,
        )

        division_2 = Division.objects.create(
            institution=institution_2, name="Test Division"
        )

        discipline_2 = Discipline.objects.create(
            geologictimeperiodtreedef=self.geologictimeperiodtreedef,
            geographytreedef=self.geographytreedef,
            division=division_2,
            datatype=self.datatype,
            type="paleobotany",
        )

        self._update(self.institution, dict(storagetreedef=storage_tree_def_1))

        self._update(institution_2, dict(storagetreedef=storage_tree_def_2))

    def test_geography(self):

        geotreedef_2 = Geographytreedef.objects.create(name="Test gtd")

        discipline_2 = Discipline.objects.create(
            geologictimeperiodtreedef=self.geologictimeperiodtreedef,
            geographytreedef=geotreedef_2,
            division=self.division,
            datatype=self.datatype,
            type="paleobotany",
        )

        collection_2 = Collection.objects.create(
            catalognumformatname="test",
            collectionname="TestCollection2",
            isembeddedcollectingevent=False,
            discipline=discipline_2,
        )

        self.assertEqual(
            list(
                Geographytreedef.objects.filter(
                    get_search_filters(self.collection, "geography")
                ).values_list("id", flat=True)
            ),
            [self.geographytreedef.id],
        )

        self.assertEqual(
            list(
                Geographytreedef.objects.filter(
                    get_search_filters(collection_2, "geography")
                ).values_list("id", flat=True)
            ),
            [geotreedef_2.id],
        )

    def test_taxon_simple(self):

        (collection_2, taxontreedef_1, taxontreedef_2) = self._create_simple_taxon()

        self.assertEqual(
            list(
                Taxontreedef.objects.filter(
                    get_search_filters(self.collection, "taxon")
                ).values_list("id", flat=True)
            ),
            [taxontreedef_1.id],
        )

        self.assertEqual(
            list(
                Taxontreedef.objects.filter(
                    get_search_filters(collection_2, "taxon")
                ).values_list("id", flat=True)
            ),
            [taxontreedef_2.id],
        )

    def test_taxon_collection_object_types(self):

        (collection_2, taxontreedef_1, taxontreedef_2) = self._create_multiple_taxon()

        self.assertEqual(
            set(
                list(
                    Taxontreedef.objects.filter(
                        get_search_filters(self.collection, "taxon")
                    ).values_list("id", flat=True)
                )
            ),
            set([taxontreedef_1.id]),
        )

        self.assertEqual(
            set(
                list(
                    Taxontreedef.objects.filter(
                        get_search_filters(collection_2, "taxon")
                    ).values_list("id", flat=True)
                )
            ),
            set([taxontreedef_1.id, taxontreedef_2.id]),
        )
