from specifyweb.specify.models import Agentspecialty
from specifyweb.specify.record_merging import add_ordering_to_key
from specifyweb.specify.tests.test_api import ApiTests

new_key_fields = ('timestampcreated', 'timestampmodified', 'id')

class TestAddOrderingToKey(ApiTests):

    def assertObjIdMatch(self, base, compare):
        self.assertEqual(
            [obj.id for obj in base],
            [obj.id for obj in compare]
        )

    def test_no_ordering(self):
        get_key = add_ordering_to_key('Collectionobject')
        # Here, collection object has no ordering field.
        key_function = lambda obj: get_key(obj, new_key_fields)
        collection_objects = [self.collectionobjects[i] for i in [3, 1, 2, 0, 4]]

        sorted_co = sorted(collection_objects, key=key_function)
    
        expected = sorted(self.collectionobjects, key=lambda obj: obj.id)

        self.assertObjIdMatch(sorted_co, expected)

    def test_with_ordering(self):
        get_key = add_ordering_to_key("AgentSpecialty")

        key_function = lambda obj: get_key(obj, new_key_fields)
        ags_1 = Agentspecialty.objects.create(
            agent=self.agent,
            ordernumber=0,
            specialtyname="TestSpecialtyFirst",
            id=1
        )
        ags_2 = Agentspecialty.objects.create(
            agent=self.agent,
            ordernumber=1,
            specialtyname="TestSpecialtySecond",
            id=2
        )
        
        # Between these 
        ags_3 = Agentspecialty.objects.create(
            agent=self.agent,
            ordernumber=3,
            specialtyname="TestSpecialtyThird",
            id=3
        )
        ags_4 = Agentspecialty.objects.create(
            agent=self.agent,
            ordernumber=2,
            specialtyname="TestSpecialtyThird(second)",
            id=4
        )

        computed_order = sorted([ags_1, ags_2, ags_3, ags_4], key=key_function)

        expected_order = [
            ags_3, ags_4, ags_2, ags_1
        ]

        self.assertObjIdMatch(computed_order, expected_order)