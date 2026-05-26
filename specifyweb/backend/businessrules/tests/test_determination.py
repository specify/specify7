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

