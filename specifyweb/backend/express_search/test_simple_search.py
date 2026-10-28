"""Database workflows using the same SQLAlchemy bridge as stored-query tests."""

from datetime import date
from pathlib import Path
from xml.etree import ElementTree

from django.test import Client

from specifyweb.backend.stored_queries.tests.tests import SQLAlchemySetup
from specifyweb.specify import models
from .related_searches import ColObjCollectors
from .search_terms import parse_search_str
from .views import run_primary_search


class SimpleSearchResultsTests(SQLAlchemySetup):
    def setUp(self):
        super().setUp()
        self.config = ElementTree.parse(
            Path(__file__).resolve().parents[3] / 'config/common/expresssearchconfig.xml'
        ).getroot()
        container = models.Splocalecontainer.objects.create(
            discipline=self.discipline, schematype=0, name='CollectionObject')
        models.Splocalecontaineritem.objects.create(
            container=container, name='catalogNumber', format='')

    def primary(self, table, text, limit=40, offset=0):
        config = next(item for item in self.config.findall('tables/searchtable')
                      if item.findtext('tableName') == table)
        with self.__class__.test_session_context() as session:
            return run_primary_search(session, config, parse_search_str(self.collection, text),
                                      self.collection, self.specifyuser, limit, offset)[table]

    def ids(self, table, text):
        return [row[0] for row in self.primary(table, text)['results']]

    def test_agent_uses_configured_last_name_not_displayed_first_name(self):
        expected = models.Agent.objects.create(division=self.division, agenttype=0,
                                               firstname='Other', lastname='Searchable')
        models.Agent.objects.create(division=self.division, agenttype=0,
                                    firstname='Searchable', lastname='Unrelated')
        self.assertEqual(self.ids('Agent', 'Searchable'), [expected.id])
        self.assertEqual(self.ids('Agent', 'Search*'), [expected.id])
        self.assertEqual(self.ids('Agent', 'Absent'), [])

    def test_taxon_full_name_exact_and_partial(self):
        rank = models.Taxontreedefitem.objects.create(treedef=self.taxontreedef, name='Species', rankid=220)
        expected = models.Taxon.objects.create(treedef=self.taxontreedef, treedefitem=rank,
                                               rankid=220, name='alba', fullname='Quercus alba')
        models.Taxon.objects.create(treedef=self.taxontreedef, treedefitem=rank,
                                    rankid=220, name='Quercus', fullname='Unrelated')
        self.assertEqual(self.ids('Taxon', '"Quercus alba"'), [expected.id])
        self.assertEqual(self.ids('Taxon', 'Quercus*'), [expected.id])
        self.assertEqual(self.ids('Taxon', 'Absent'), [])

    def test_locality_and_geography_use_separate_configured_fields(self):
        rank = self.geographytreedef.treedefitems.first()
        geography = models.Geography.objects.create(treedef=self.geographytreedef,
            treedefitem=rank, rankid=0, name='Short', fullname='Searchable Region')
        models.Geography.objects.create(treedef=self.geographytreedef,
            treedefitem=rank, rankid=0, name='Other', fullname='Unrelated')
        locality = models.Locality.objects.create(discipline=self.discipline,
            localityname='Searchable Site', geography=geography)
        models.Locality.objects.create(discipline=self.discipline, localityname='Unrelated', geography=geography)
        self.assertEqual(self.ids('Geography', '"Searchable Region"'), [geography.id])
        self.assertEqual(self.ids('Geography', 'Searchable*'), [geography.id])
        self.assertEqual(self.ids('Geography', 'Short'), [])
        self.assertEqual(self.ids('Locality', '"Searchable Site"'), [locality.id])
        self.assertEqual(self.ids('Locality', 'Searchable*'), [locality.id])
        self.assertEqual(self.ids('Locality', '"Searchable Region"'), [])

    def test_collecting_event_station_and_date(self):
        event = models.Collectingevent.objects.create(discipline=self.discipline,
            stationfieldnumber='ST-42', startdate=date(2020, 5, 6))
        models.Collectingevent.objects.create(discipline=self.discipline,
            stationfieldnumber='ST-43', startdate=date(2021, 5, 6))
        for text in ('ST-42', '2020-05-06', '2020'):
            with self.subTest(text=text):
                self.assertEqual(self.ids('CollectingEvent', text), [event.id])
        self.assertEqual(self.ids('CollectingEvent', 'ST-99'), [])

    def test_secondary_collector_search_returns_related_objects_not_agents(self):
        self.agent.lastname = 'CollectorMatch'
        self.agent.save()
        self.collectionobjects[0].collectingevent = self.collectingevent
        self.collectionobjects[0].save()
        models.Collector.objects.create(agent=self.agent, collectingevent=self.collectingevent,
                                        isprimary=True, ordernumber=0)
        self.assertEqual(self.ids('Agent', 'CollectorMatch'), [self.agent.id])
        self.assertEqual(self.ids('CollectionObject', 'CollectorMatch'), [])
        with self.__class__.test_session_context() as session:
            result = ColObjCollectors.execute(session, self.config,
                parse_search_str(self.collection, 'CollectorMatch'), self.collection,
                self.specifyuser, limit=40, offset=0)
        self.assertEqual(result['definition']['root'], 'CollectionObject')
        self.assertEqual([row[0] for row in result['results']], [self.collectionobjects[0].id])
        self.assertEqual(result['totalCount'], 1)

    def test_search_results_can_be_saved_and_retrieved_as_record_set(self):
        models.Collectionobject.objects.create(collection=self.collection,
            collectionobjecttype=self.collectionobjecttype, catalognumber='unrelated')
        ids = self.ids('CollectionObject', 'num-%')
        self.assertCountEqual(ids, [obj.id for obj in self.collectionobjects])
        client = Client()
        client.force_login(self.specifyuser)
        response = client.post('/api/specify/recordset/', data={
            'name': 'Simple Search results', 'type': 0,
            'dbtableid': models.Collectionobject.specify_model.tableId,
            'specifyuser': f'/api/specify/specifyuser/{self.specifyuser.id}/',
            'recordsetitems': [{'recordid': record_id} for record_id in ids],
        }, content_type='application/json')
        self.assertEqual(response.status_code, 201, response.content)
        record_set = models.Recordset.objects.get(name='Simple Search results')
        self.assertCountEqual(record_set.recordsetitems.values_list('recordid', flat=True), ids)
        response = client.get(f'/api/specify/recordset/{record_set.id}/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['dbtableid'], models.Collectionobject.specify_model.tableId)

    def test_merge_search_matches_preserves_unrelated_agent_and_collector(self):
        target = models.Agent.objects.create(division=self.division, agenttype=0, lastname='MergeSearch')
        source = models.Agent.objects.create(division=self.division, agenttype=0, lastname='MergeSearch')
        collector = models.Collector.objects.create(agent=source, collectingevent=self.collectingevent,
                                                    isprimary=True, ordernumber=0)
        unrelated = models.Collector.objects.create(agent=self.agent, collectingevent=self.collectingevent,
                                                    isprimary=False, ordernumber=1)
        ids = self.ids('Agent', 'MergeSearch')
        self.assertCountEqual(ids, [target.id, source.id])
        client = Client()
        client.force_login(self.specifyuser)
        response = client.post(f'/merge/agent/replace/{target.id}/', data={
            'old_record_ids': [record_id for record_id in ids if record_id != target.id],
            'background': False,
        }, content_type='application/json')
        self.assertEqual(response.status_code, 204, response.content)
        collector.refresh_from_db()
        unrelated.refresh_from_db()
        self.assertEqual(collector.agent_id, target.id)
        self.assertEqual(unrelated.agent_id, self.agent.id)
        self.assertFalse(models.Agent.objects.filter(id=source.id).exists())
        self.assertTrue(models.Agent.objects.filter(id=target.id).exists())
        self.assertTrue(models.Agent.objects.filter(id=self.agent.id).exists())
        self.assertEqual(self.ids('Agent', 'MergeSearch'), [target.id])
