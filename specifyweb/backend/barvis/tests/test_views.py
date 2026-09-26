from specifyweb.specify.models import Collection, Determination, Taxon, Taxontreedefitem
from specifyweb.specify.tests.test_api import ApiTests

from specifyweb.backend.barvis.views import get_taxon_bar_data


class TaxonBarTests(ApiTests):
    def setUp(self):
        super().setUp()
        self.discipline.taxontreedef = self.taxontreedef
        self.discipline.save()
        self.taxontreedef.discipline = self.discipline
        self.taxontreedef.save()

        root_rank = Taxontreedefitem.objects.create(
            name='Root', rankid=0, treedef=self.taxontreedef
        )
        species_rank = Taxontreedefitem.objects.create(
            name='Species', rankid=220, parent=root_rank, treedef=self.taxontreedef
        )
        self.root = Taxon.objects.create(
            name='Root', rankid=0, definition=self.taxontreedef,
            definitionitem=root_rank,
        )
        self.taxon = Taxon.objects.create(
            name='Test species', rankid=220, parent=self.root,
            definition=self.taxontreedef, definitionitem=species_rank,
        )

    def test_returns_current_determination_counts_without_changing_rows(self):
        collection_2 = Collection.objects.create(
            catalognumformatname='test',
            collectionname='TestCollection2',
            isembeddedcollectingevent=False,
            discipline=self.discipline,
        )
        Determination.objects.create(
            collectionobject=self.collectionobjects[0], taxon=self.taxon,
            collectionmemberid=self.collection.id, iscurrent=True,
            createdbyagent=self.agent, modifiedbyagent=self.agent,
        )
        Determination.objects.create(
            collectionobject=self.collectionobjects[1], taxon=self.taxon,
            collectionmemberid=self.collection.id, iscurrent=True,
            createdbyagent=self.agent, modifiedbyagent=self.agent,
        )
        Determination.objects.create(
            collectionobject=self.collectionobjects[2], taxon=self.taxon,
            collectionmemberid=self.collection.id, iscurrent=False,
            createdbyagent=self.agent, modifiedbyagent=self.agent,
        )
        Determination.objects.create(
            collectionobject=self.collectionobjects[2], taxon=self.taxon,
            collectionmemberid=collection_2.id, iscurrent=True,
            createdbyagent=self.agent, modifiedbyagent=self.agent,
        )

        self.assertCountEqual(
            get_taxon_bar_data(self.collection),
            [
                (self.root.id, 0, None, 'Root', 0),
                (self.taxon.id, 220, self.root.id, 'Test species', 2),
            ],
        )
