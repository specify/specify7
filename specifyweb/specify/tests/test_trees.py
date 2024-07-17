from django.test import Client
from specifyweb.businessrules.exceptions import TreeBusinessRuleException
from specifyweb.specify import api, models
from specifyweb.specify.tests.test_api import ApiTests, get_table
from specifyweb.specify.tree_stats import get_tree_stats
from specifyweb.specify.tree_extras import set_fullnames
from specifyweb.specify.tree_views import get_tree_rows
from specifyweb.stored_queries.execution import set_group_concat_max_len
from specifyweb.stored_queries.tests import SQLAlchemySetup
from contextlib import contextmanager
from django.db import connection

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
    
        self.earth = self.make_geotree("Earth", "Planet")

        self.na = self.make_geotree("North America", "Continent", parent=self.earth)

        self.usa = self.make_geotree("USA", "Country", parent=self.na)

        self.kansas = self.make_geotree("Kansas", "State", parent=self.usa)
        self.mo = self.make_geotree("Missouri", "State", parent=self.usa)
        self.ohio = self.make_geotree("Ohio", "State", parent=self.usa)
        self.ill = self.make_geotree("Illinois", "State", parent=self.usa)

        self.doug = self.make_geotree("Douglas", "County", parent=self.kansas)
        self.greene = self.make_geotree("Greene", "County", parent=self.mo)
        self.greeneoh = self.make_geotree("Greene", "County", parent=self.ohio)
        self.sangomon = self.make_geotree("Sangamon", "County", parent=self.ill)

        self.springmo = self.make_geotree("Springfield", "City", parent=self.greene)
        self.springill = self.make_geotree("Springfield", "City", parent=self.sangomon)

    def make_geotree(self, name, rank_name, **extra_kwargs):
        return get_table("Geography").objects.create(
            name=name,
            definitionitem=get_table('Geographytreedefitem').objects.get(name=rank_name),
            definition=self.geographytreedef,
            **extra_kwargs
        )
    
class GeographyTree(TestTree, TestTreeSetup): pass

class SqlTreeSetup(SQLAlchemySetup, GeographyTree): pass

class TreeViewsTest(SqlTreeSetup):

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
            cte_results = get_tree_stats(*args, **kwargs, session_context=TreeViewsTest.test_session_context, using_cte=True)
            node_number_results = get_tree_stats(*args, **kwargs, session_context=TreeViewsTest.test_session_context, using_cte=False)
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
    
    def test_test_synonyms_concat(self):
        self.maxDiff = None
        na_syn_0 = self.make_geotree("NA Syn 0", "Continent",
                                     acceptedgeography=self.na, 
                                     # fullname is not set by default for not-accepted
                                     fullname="NA Syn 0",
                                     parent=self.earth
                                     )
        na_syn_1 = self.make_geotree("NA Syn 1", "Continent", acceptedgeography=self.na, fullname="NA Syn 1", parent=self.earth)

        usa_syn_0 = self.make_geotree("USA Syn 0", "Country", acceptedgeography=self.usa, parent=self.na, fullname="USA Syn 0")
        usa_syn_1 = self.make_geotree("USA Syn 1", "Country", acceptedgeography=self.usa, parent=self.na, fullname="USA Syn 1")
        usa_syn_2 = self.make_geotree("USA Syn 2", "Country", acceptedgeography=self.usa, parent=self.na, fullname="USA Syn 2")

        # need to refresh _some_ nodes (but not all)
        # just the immediate parents and siblings inserted before us
        # to be safe, we could refresh all, but I'm not going to, so that bug in those sections can be caught here
        self.earth.refresh_from_db()
        self.na.refresh_from_db()
        self.usa.refresh_from_db()

        na_syn_0.refresh_from_db()
        na_syn_1.refresh_from_db()

        usa_syn_1.refresh_from_db()
        usa_syn_0.refresh_from_db()

        @contextmanager
        def _run_for_row():
            with TreeViewsTest.test_session_context() as session:
                # this needs to be run via django, but not directly via test_session_context
                set_group_concat_max_len(connection.cursor())
                yield session

        with _run_for_row() as session:
            results = get_tree_rows(
                self.geographytreedef.id, "Geography", self.earth.id, "geographyid", False, session
            )
            expected = [
                    (self.na.id, self.na.name, self.na.fullname, self.na.nodenumber, self.na.highestchildnodenumber, self.na.rankid, None, None, 'NULL', self.na.children.count(), 'NA Syn 0, NA Syn 1'),
                    (na_syn_0.id, na_syn_0.name, na_syn_0.fullname, na_syn_0.nodenumber, na_syn_0.highestchildnodenumber, na_syn_0.rankid, self.na.id, self.na.fullname, 'NULL', na_syn_0.children.count(), None),
                    (na_syn_1.id, na_syn_1.name, na_syn_1.fullname, na_syn_1.nodenumber, na_syn_1.highestchildnodenumber, na_syn_1.rankid, self.na.id, self.na.fullname, 'NULL', na_syn_1.children.count(), None),
                ]

            self.assertCountEqual(
                results,
                expected
            )
        
        with _run_for_row() as session:
            results = get_tree_rows(
                self.geographytreedef.id, "Geography", self.na.id, "name", False, session
            )
            expected = [
                    (self.usa.id, self.usa.name, self.usa.fullname, self.usa.nodenumber, self.usa.highestchildnodenumber, self.usa.rankid, None, None, 'NULL', self.usa.children.count(), 'USA Syn 0, USA Syn 1, USA Syn 2'),
                    (usa_syn_0.id, usa_syn_0.name, usa_syn_0.fullname, usa_syn_0.nodenumber, usa_syn_0.highestchildnodenumber, usa_syn_0.rankid, self.usa.id, self.usa.fullname, 'NULL', 0, None),
                    (usa_syn_1.id, usa_syn_1.name, usa_syn_1.fullname, usa_syn_1.nodenumber, usa_syn_1.highestchildnodenumber, usa_syn_1.rankid, self.usa.id, self.usa.fullname, 'NULL', 0, None),
                    (usa_syn_2.id, usa_syn_2. name, usa_syn_2.fullname, usa_syn_2.nodenumber, usa_syn_2.highestchildnodenumber, usa_syn_2.rankid, self.usa.id, self.usa.fullname, 'NULL', 0, None)

                ]
            self.assertCountEqual(
                results,
                expected
            )

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

        for obj in models.Taxontreedefitem.objects.all():
            obj.delete()

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
        for rank in models.Taxontreedefitem.objects.all():
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
            