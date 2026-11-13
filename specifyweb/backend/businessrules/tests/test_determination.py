from specifyweb.specify.tests.test_api import ApiTests

class DeterminationTests(ApiTests):
    def test_only_one_determination_iscurrent(self):
        determinations = self.collectionobjects[0].determinations
        d1 = determinations.create(iscurrent=True)
        d2 = determinations.create(iscurrent=False)
        d3 = determinations.create(iscurrent=True)
        self.assertEqual(determinations.get(iscurrent=True).id, d3.id)
        d2.iscurrent = True
        d2.save()
        self.assertEqual(determinations.get(iscurrent=True).id, d2.id)

    def test_iscurrent_doesnt_interfere_across_colleciton_objects(self):
        for co in self.collectionobjects:
            co.determinations.create(iscurrent=True)

        for co in self.collectionobjects:
            co.determinations.get(iscurrent=True)

    def test_add_existing_taxon_to_determination(self):
        collection_object = self.collectionobjects[0]
        taxon_tree_item = self.taxontreedef.treedefitems.create(
            name="taxonomy_root",
            rankid=0
        )
        taxon = taxon_tree_item.treeentries.create(
            name="Test taxon",
            definition=taxon_tree_item.treedef,
            rankid=taxon_tree_item.rankid
        )
        determination = collection_object.determinations.create(
            taxon=taxon,
            iscurrent=True
        )
        fetched_determination = collection_object.determinations.get(
            id=determination.id
        )
        self.assertEqual(fetched_determination.taxon_id, taxon.id)
