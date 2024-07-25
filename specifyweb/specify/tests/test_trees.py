from django.test import Client
from specifyweb.businessrules.exceptions import TreeBusinessRuleException
from specifyweb.specify import api, models
from specifyweb.specify.tests.test_api import ApiTests, get_table
from specifyweb.specify.tree_stats import get_tree_stats
from specifyweb.specify.tree_extras import set_fullnames
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

        self.collectionobjecttype.taxontreedef = self.taxontreedef
        self.collectionobjecttype.save()
        self.collection.collectionobjecttype = self.collectionobjecttype
        self.collection.save()

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

class AddDeleteRankResourcesTest(ApiTests):
    def test_add_ranks_without_defaults(self):
        c = Client()
        c.force_login(self.specifyuser)

        treedef_geo = models.Geographytreedef.objects.create(name='GeographyTest')

        # Test adding non-default rank on empty heirarchy
        data = {
            'name': 'Universe',
            'parent': None,
            'treedef': treedef_geo,
            'rankid': 100
        }
        universe_rank = api.create_obj(self.collection, self.agent, 'geographytreedefitem', data)
        self.assertEqual(100, models.Geographytreedefitem.objects.get(name='Universe').rankid)

        # Test adding non-default rank to the end of the heirarchy
        data = {
            'name': 'Galaxy',
            'parent': api.uri_for_model(models.Geographytreedefitem, universe_rank.id),
            'treedef': treedef_geo,
            'rankid': 200
        }
        galaxy_rank = api.create_obj(self.collection, self.agent, 'geographytreedefitem', data)
        self.assertEqual(200, models.Geographytreedefitem.objects.get(name='Galaxy').rankid)

        # Test adding non-default rank to the front of the heirarchy
        data = {
            'name': 'Multiverse',
            'parent': None,
            'treedef': treedef_geo,
            'rankid': 50
        }
        multiverse_rank = api.create_obj(self.collection, self.agent, 'geographytreedefitem', data)
        self.assertEqual(50, models.Geographytreedefitem.objects.get(name='Multiverse').rankid)

        # Test adding non-default rank in the middle of the heirarchy
        data = {
            'name': 'Dimension',
            'parent': api.uri_for_model(models.Geographytreedefitem, universe_rank.id),
            'treedef': treedef_geo,
            'rankid': 150
        }
        dimersion_rank = api.create_obj(self.collection, self.agent, 'geographytreedefitem', data)
        self.assertEqual(150, models.Geographytreedefitem.objects.get(name='Dimension').rankid)

        # Test foreign keys
        self.assertEqual(4, models.Geographytreedefitem.objects.filter(treedef=treedef_geo).count())

        # Create test nodes
        cfc = models.Geography.objects.create(name='Central Finite Curve', rankid=50, definition=treedef_geo,
                                              definitionitem=models.Geographytreedefitem.objects.get(name='Multiverse'))
        c137 = models.Geography.objects.create(name='C137', rankid=100, parent=cfc, definition=treedef_geo,
                                               definitionitem=models.Geographytreedefitem.objects.get(name='Universe'))
        d3 = models.Geography.objects.create(name='3D', rankid=150, parent=c137, definition=treedef_geo,
                                             definitionitem=models.Geographytreedefitem.objects.get(name='Dimension'))
        milky_way = models.Geography.objects.create(name='Milky Way', parent=d3, rankid=200, definition=treedef_geo,
                                                    definitionitem=models.Geographytreedefitem.objects.get(
                                                        name='Galaxy'))
        
        # Test full name reconstruction
        set_fullnames(treedef_geo, null_only=False, node_number_range=None)
        if cfc.fullname is not None:
            self.assertEqual('Central Finite Curve', cfc.fullname)
        if c137.fullname is not None:
            self.assertEqual('C137', c137.fullname)
        if d3.fullname is not None:
            self.assertEqual('3D', d3.fullname)
        if milky_way.fullname is not None:
            self.assertEqual('Milky Way', milky_way.fullname)
            
        # Test parents of child nodes
        self.assertEqual(cfc.id, c137.parent.id)
        self.assertEqual(c137.id, d3.parent.id)
        self.assertEqual(d3.id, milky_way.parent.id)


    def test_add_ranks_with_defaults(self):
        c = Client()
        c.force_login(self.specifyuser)

        treedef_taxon = models.Taxontreedef.objects.create(name='TaxonTest')

        # Test adding default rank on empty heirarchy
        data = {
            'name': 'Taxonomy Root',
            'parent': None,
            'treedef': treedef_taxon
        }
        taxon_root_rank = api.create_obj(self.collection, self.agent, 'taxontreedefitem', data)
        self.assertEqual(0, models.Taxontreedefitem.objects.get(name='Taxonomy Root').rankid)

        # Test adding non-default rank in front of rank 0
        data = {
            'name': 'Invalid',
            'parent': None,
            'treedef': treedef_taxon
        }
        with self.assertRaises(TreeBusinessRuleException):
            api.create_obj(self.collection, self.agent, 'taxontreedefitem', data)
        self.assertEqual(0, models.Taxontreedefitem.objects.filter(name='Invalid').count())

        # Test adding default rank to the end of the heirarchy
        data = {
            'name': 'Division',
            'parent': api.uri_for_model(models.Taxontreedefitem, taxon_root_rank.id),
            'treedef': treedef_taxon
        }
        division_rank = api.create_obj(self.collection, self.agent, 'taxontreedefitem', data)
        self.assertEqual(30, models.Taxontreedefitem.objects.get(name='Division').rankid)

        # Test adding default rank to the middle of the heirarchy
        data = {
            'name': 'Kingdom',
            'parent': api.uri_for_model(models.Taxontreedefitem, taxon_root_rank.id),
            'treedef': treedef_taxon
        }
        kingdom_rank = api.create_obj(self.collection, self.agent, 'taxontreedefitem', data)
        self.assertEqual(10, models.Taxontreedefitem.objects.get(name='Kingdom').rankid)
        self.assertEqual(models.Taxontreedefitem.objects.get(name='Division').parent.id,
                         models.Taxontreedefitem.objects.get(name='Kingdom').id)
        self.assertEqual(models.Taxontreedefitem.objects.get(name='Kingdom').parent.id,
                         models.Taxontreedefitem.objects.get(name='Taxonomy Root').id)

        # Test foreign keys
        for rank in models.Taxontreedefitem.objects.filter(treedef=treedef_taxon):
            self.assertEqual(treedef_taxon.id, rank.treedef.id)

        # Create test nodes
        pokemon = models.Taxon.objects.create(name='Pokemon', rankid=50, definition=treedef_taxon,
                                              definitionitem=models.Taxontreedefitem.objects.get(name='Taxonomy Root'))
        water = models.Taxon.objects.create(name='Water', rankid=100, parent=pokemon, definition=treedef_taxon,
                                            definitionitem=models.Taxontreedefitem.objects.get(name='Kingdom'))
        squirtle = models.Taxon.objects.create(name='Squirtle', rankid=150, parent=water, definition=treedef_taxon,
                                               definitionitem=models.Taxontreedefitem.objects.get(name='Division'))
        blastoise = models.Taxon.objects.create(name='Blastoise', parent=water, rankid=200, definition=treedef_taxon,
                                                definitionitem=models.Taxontreedefitem.objects.get(name='Division'))
        
        # Test full name reconstruction
        set_fullnames(treedef_taxon, null_only=False, node_number_range=None)
        if pokemon.fullname is not None:
            self.assertEqual('Pokemon', pokemon.fullname)
        if water.fullname is not None:
            self.assertEqual('Water', water.fullname)
        if squirtle.fullname is not None:
            self.assertEqual('Squirtle', squirtle.fullname)
        if blastoise.fullname is not None:
            self.assertEqual('Blastoise', blastoise.fullname)

    def test_delete_ranks(self):
        c = Client()
        c.force_login(self.specifyuser)

        treedef_geotimeperiod = models.Geologictimeperiodtreedef.objects.create(name='GeographyTimePeriodTest')
        era_rank = models.Geologictimeperiodtreedefitem.objects.create(
            name='Era',
            rankid=100,
            treedef=treedef_geotimeperiod
        )
        period_rank = models.Geologictimeperiodtreedefitem.objects.create(
            name='Period',
            rankid=200,
            treedef=treedef_geotimeperiod,
            parent=era_rank
        )
        epoch_rank = models.Geologictimeperiodtreedefitem.objects.create(
            name='Epoch',
            rankid=300,
            treedef=treedef_geotimeperiod,
            parent=period_rank
        )
        age_rank = models.Geologictimeperiodtreedefitem.objects.create(
            name='Age',
            rankid=400,
            treedef=treedef_geotimeperiod,
            parent=epoch_rank
        )

        # Test deleting a rank in the middle of the heirarchy
        api.delete_resource(self.collection, self.agent, 'Geologictimeperiodtreedefitem', epoch_rank.id, epoch_rank.version)
        self.assertEqual(None, models.Geologictimeperiodtreedefitem.objects.filter(name='Epoch').first())
        self.assertEqual(period_rank.id, models.Geologictimeperiodtreedefitem.objects.get(name='Age').parent.id)

        # Test deleting a rank at the end of the heirarchy
        api.delete_resource(self.collection, self.agent, 'Geologictimeperiodtreedefitem', age_rank.id, age_rank.version)
        self.assertEqual(None, models.Geologictimeperiodtreedefitem.objects.filter(name='Age').first())

        # Test deleting a rank at the head of the heirarchy
        with self.assertRaises(TreeBusinessRuleException):
            api.delete_resource(self.collection, self.agent, 'Geologictimeperiodtreedefitem', era_rank.id, era_rank.version)
            