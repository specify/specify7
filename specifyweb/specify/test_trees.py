import json
from django.test import Client
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

class AddDeleteRanksTest(ApiTests):
    def setUp(self) -> None:
        super().setUp()
    
    def test_add_ranks_without_defaults(self):
        c = Client()
        c.force_login(self.specifyuser)

        treedef_geo = models.Geographytreedef.objects.create(name='Geography')

        # Test adding non-default rank on empty heirarchy
        response = c.post(
            '/api/specify_tree/geography/add_tree_rank/',
            data=json.dumps({
                'newRankName': 'Universe',
                'targetRankName': 'root'
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(100, models.Geographytreedefitem.objects.get(name='Universe').rankid)

        # Test adding non-default rank to the end of the heirarchy
        response = c.post(
            '/api/specify_tree/geography/add_tree_rank/',
            data=json.dumps({
                'newRankName': 'Galaxy',
                'targetRankName': 'Universe'
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(200, models.Geographytreedefitem.objects.get(name='Galaxy').rankid)

        # Test adding non-default rank to the front of the heirarchy
        response = c.post(
            '/api/specify_tree/geography/add_tree_rank/',
            data=json.dumps({
                'newRankName': 'Multiverse',
                'targetRankName': 'root'
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(50, models.Geographytreedefitem.objects.get(name='Multiverse').rankid)

        # Test adding non-default rank in the middle of the heirarchy
        response = c.post(
            '/api/specify_tree/geography/add_tree_rank/',
            data=json.dumps({
                'newRankName': 'Dimension',
                'targetRankName': 'Universe'
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(150, models.Geographytreedefitem.objects.get(name='Multiverse').rankid)

        # Test foreign keys
        for rank in models.Geographytreedefitem.objects.all():
            self.assertEqual(treedef_geo.id, rank.geographytreedefitem.id)

    def test_add_ranks_with_defaults(self):
        c = Client()
        c.force_login(self.specifyuser)

        treedef_taxon = models.Taxontreedef.objects.create(name='Taxon')

        # Test adding default rank on empty heirarchy
        response = c.post(
            '/api/specify_tree/taxon/add_tree_rank/',
            data=json.dumps({
                'newRankName': 'Taxonomy Root',
                'targetRankName': 'root'
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(0, models.Taxontreedefitem.objects.get(name='Taxonomy Root').rankid)

        # Test adding non-default rank in front of rank 0
        response = c.post(
            '/api/specify_tree/taxon/add_tree_rank/',
            data=json.dumps({
                'newRankName': 'Invalid',
                'targetRankName': 'root'
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 500)
        self.assertEqual(None, models.Taxontreedefitem.objects.get(name='Invalid'))

        # Test adding default rank to the end of the heirarchy
        response = c.post(
            '/api/specify_tree/taxon/add_tree_rank/',
            data=json.dumps({
                'newRankName': 'Division',
                'targetRankName': 'Taxon Root'
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(30, models.Taxontreedefitem.objects.get(name='Division').rankid)

        # Test adding default rank to the middle of the heirarchy
        response = c.post(
            '/api/specify_tree/taxon/add_tree_rank/',
            data=json.dumps({
                'newRankName': 'Kingdom',
                'targetRankName': 'Taxon Root'
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(10, models.Taxontreedefitem.objects.get(name='Division').rankid)
        self.assertEqual(models.Taxontreedefitem.objects.get(name='Kingdom').parentid,
                         models.Taxontreedefitem.objects.get(name='Division').id)
        self.assertEqual(models.Taxontreedefitem.objects.get(name='Division').parentid,
                         models.Taxontreedefitem.objects.get(name='Taxon Root').id)

        # Test foreign keys
        for rank in models.Taxontreedefitem.objects.all():
            self.assertEqual(treedef_taxon.id, rank.taxontreedefitem.id)

    def test_delete_ranks(self):
        c = Client()
        c.force_login(self.specifyuser)

        treedef_geotimeperiod = models.Geologictimeperiodtreedef.objects.create(name='GeographyTimePeriod')
        era_ranks = models.Geologictimeperiodtreedefitem.objects.create(
            name='Era',
            rankid=100,
            geologictimeperiodtreedefitem=treedef_geotimeperiod
        )
        period_rank = models.Geologictimeperiodtreedefitem.objects.create(
            name='Period',
            rankid=200,
            geologictimeperiodtreedefitem=treedef_geotimeperiod
        )
        epoch_rank = models.Geologictimeperiodtreedefitem.objects.create(
            name='Epoch',
            rankid=300,
            geologictimeperiodtreedefitem=treedef_geotimeperiod
        )
        age_rank = models.Geologictimeperiodtreedefitem.objects.create(
            name='Age',
            rankid=400,
            geologictimeperiodtreedefitem=treedef_geotimeperiod
        )

        # Test deleting a rank in the middle of the heirarchy
        response = c.post(
            '/api/specify_tree/geologictimeperiod/delete_tree_rank/',
            data= json.dumps({'rankName': 'Epoch'}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(None, models.Geologictimeperiodtreedefitem.objects.get(name='Epoch'))
        self.assertEqual(age_rank.id, models.Geologictimeperiodtreedefitem.objects.get(name='Age').parentitem.id)

        # Test deleting a rank at the end of the heirarchy
        response = c.post(
            '/api/specify_tree/geologictimeperiod/delete_tree_rank/',
            data= json.dumps({'rankName': 'Age'}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(None, models.Geologictimeperiodtreedefitem.objects.get(name='Age'))

        # Test deleting a rank at the head of the heirarchy
        response = c.post(
            '/api/specify_tree/geologictimeperiod/delete_tree_rank/',
            data= json.dumps({'rankName': 'Era'}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(None, models.Geologictimeperiodtreedefitem.objects.get(name='Era'))
        self.assertEqual(None, models.Geologictimeperiodtreedefitem.objects.get(name='Period').parentitem)

