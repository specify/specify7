from specifyweb.specify import models
from specifyweb.specify.api_tests import ApiTests, get_table
from specifyweb.specify.tree_stats import get_tree_stats
from specifyweb.stored_queries.tests import SQLAlchemySetup

class TestTreeSetup(ApiTests):
    def setUp(self) -> None:
        super().setUp()
        self.geographytreedef.treedefitems.create(name='Continent', rankid=100)
        self.geographytreedef.treedefitems.create(name='Country', rankid=200)
        self.geographytreedef.treedefitems.create(name='State', rankid=300)
        self.geographytreedef.treedefitems.create(name='County', rankid=400)
        self.geographytreedef.treedefitems.create(name='City', rankid=500)


        self.taxontreedef = models.Taxontreedef.objects.create(name="Test Taxonomy")
        self.taxontreedef.treedefitems.create(name='Taxonomy Root', rankid=0)
        self.taxontreedef.treedefitems.create(name='Kingdom', rankid=10)
        self.taxontreedef.treedefitems.create(name='Phylum', rankid=30)
        self.taxontreedef.treedefitems.create(name='Class', rankid=60)
        self.taxontreedef.treedefitems.create(name='Order', rankid=100)
        self.taxontreedef.treedefitems.create(name='Superfamily', rankid=130)
        self.taxontreedef.treedefitems.create(name='Family', rankid=140)
        self.taxontreedef.treedefitems.create(name='Genus', rankid=180)
        self.taxontreedef.treedefitems.create(name='Subgenus', rankid=190)
        self.taxontreedef.treedefitems.create(name='Species', rankid=220)
        self.taxontreedef.treedefitems.create(name='Subspecies', rankid=230)

class TestTree:
    def setUp(self)->None:
        super().setUp()
        self.earth = get_table('Geography').objects.create(
            name="Earth",
            definitionitem=get_table('Geographytreedefitem').objects.get(name="Planet"),
            definition=self.geographytreedef,
        )

        self.na = get_table('Geography').objects.create(
            name="North America",
            definitionitem=get_table('Geographytreedefitem').objects.get(name="Continent"),
            definition=self.geographytreedef,
            parent=self.earth,
        )

        self.usa = get_table('Geography').objects.create(
            name="USA",
            definitionitem=get_table('Geographytreedefitem').objects.get(name="Country"),
            definition=self.geographytreedef,
            parent=self.na,
        )

        self.kansas = get_table('Geography').objects.create(
            name="Kansas",
            definitionitem=get_table('Geographytreedefitem').objects.get(name="State"),
            definition=self.geographytreedef,
            parent=self.usa,
        )

        self.mo = get_table('Geography').objects.create(
            name="Missouri",
            definitionitem=get_table('Geographytreedefitem').objects.get(name="State"),
            definition=self.geographytreedef,
            parent=self.usa,
        )

        self.ohio = get_table('Geography').objects.create(
            name="Ohio",
            definitionitem=get_table('Geographytreedefitem').objects.get(name="State"),
            definition=self.geographytreedef,
            parent=self.usa,
        )

        self.ill = get_table('Geography').objects.create(
            name="Illinois",
            definitionitem=get_table('Geographytreedefitem').objects.get(name="State"),
            definition=self.geographytreedef,
            parent=self.usa,
        )

        self.doug = get_table('Geography').objects.create(
            name="Douglas",
            definitionitem=get_table('Geographytreedefitem').objects.get(name="County"),
            definition=self.geographytreedef,
            parent=self.kansas,
        )

        self.greene = get_table('Geography').objects.create(
            name="Greene",
            definitionitem=get_table('Geographytreedefitem').objects.get(name="County"),
            definition=self.geographytreedef,
            parent=self.mo,
        )

        self.greeneoh = get_table('Geography').objects.create(
            name="Greene",
            definitionitem=get_table('Geographytreedefitem').objects.get(name="County"),
            definition=self.geographytreedef,
            parent=self.ohio,
        )

        self.sangomon = get_table('Geography').objects.create(
            name="Sangamon",
            definitionitem=get_table('Geographytreedefitem').objects.get(name="County"),
            definition=self.geographytreedef,
            parent=self.ill,
        )

        self.springmo = get_table('Geography').objects.create(
            name="Springfield",
            definitionitem=get_table('Geographytreedefitem').objects.get(name="City"),
            definition=self.geographytreedef,
            parent=self.greene,
        )

        self.springill = get_table('Geography').objects.create(
            name="Springfield",
            definitionitem=get_table('Geographytreedefitem').objects.get(name="City"),
            definition=self.geographytreedef,
            parent=self.sangomon,
        )

class GeographyTree(TestTree, TestTreeSetup): pass

class SqlTreeSetup(SQLAlchemySetup, GeographyTree): pass

class TreeStatsTest(SqlTreeSetup):

    def setUp(self):
        super().setUp()
        locality_1 = models.Locality.objects.create(
            localityname="somewhere1",
            srclatlongunit=0,
            discipline=self.discipline,
            geography=self.usa
        )
        locality_2 = models.Locality.objects.create(
            localityname="somewhere2",
            srclatlongunit=0,
            discipline=self.discipline,
            geography=self.springill
        )
        locality_3 = models.Locality.objects.create(
            localityname="somewhere3",
            srclatlongunit=0,
            discipline=self.discipline,
            geography=self.ill
        )
        collecting_event_1 = models.Collectingevent.objects.create(
            discipline=self.discipline,
            locality=locality_1
        )
        collecting_event_2 = models.Collectingevent.objects.create(
            discipline=self.discipline,
            locality=locality_2
        )
        collecting_event_3 = models.Collectingevent.objects.create(
            discipline=self.discipline,
            locality=locality_3
        )
        self.collectionobjects[0].collectingevent = collecting_event_1
        self.collectionobjects[1].collectingevent = collecting_event_2
        self.collectionobjects[2].collectingevent = collecting_event_3
        self.collectionobjects[3].collectingevent = collecting_event_3
        self.collectionobjects[4].collectingevent = collecting_event_3

        _saved = [co.save() for co in self.collectionobjects]

        second_collection = models.Collection.objects.create(
            catalognumformatname='test',
            collectionname='TestCollection2',
            isembeddedcollectingevent=False,
            discipline=self.discipline)

        collection_object_another_collection = models.Collectionobject.objects.create(
            collection=second_collection,
            catalognumber="num-5"
        )

        def _run_nn_and_cte(*args, **kwargs):
            cte_results = get_tree_stats(*args, **kwargs, session_context=TreeStatsTest.test_session_context, using_cte=True)
            node_number_results = get_tree_stats(*args, **kwargs, session_context=TreeStatsTest.test_session_context, using_cte=False)
            self.assertCountEqual(cte_results, node_number_results)
            return cte_results

        self.validate_tree_stats = lambda *args, **kwargs: (
            lambda true_results: self.assertCountEqual(_run_nn_and_cte(*args, **kwargs), true_results))

    def test_counts_correctness(self):
        correct_results = {
            self.earth.id: [(self.na.id, 0, 5)],
            self.na.id: [(self.usa.id, 1, 5)],
            self.usa.id: [
                (self.kansas.id, 0, 0),
                (self.mo.id, 0, 0),
                (self.ohio.id, 0, 0),
                (self.ill.id, 3, 4),
            ],
            self.ill.id: [
                (self.sangomon.id, 0, 1),
            ],
            self.sangomon.id: [
                (self.springill.id, 1, 1)
            ]
        }

        _results = [
            self.validate_tree_stats(self.geographytreedef.id, 'geography', parent_id, self.collection)(correct)
            for parent_id, correct in correct_results.items()
        ]


