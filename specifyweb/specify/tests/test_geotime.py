import json
from datetime import datetime

from unittest import skip
from .test_api import ApiTests
from django.test import Client
from specifyweb.specify import geo_time
from specifyweb.specify.models import (
    Geologictimeperiod,
    Geologictimeperiodtreedefitem,
    Geologictimeperiodtreedef,
    Relativeage,
    Absoluteage,
    Paleocontext,
    Collectionobject,
    Collectingevent,
    Locality,
)
from unittest.mock import patch

class GeoTimeTests(ApiTests):
    def setUp(self):
        super().setUp()

        self.root_rank, _ = Geologictimeperiodtreedefitem.objects.get_or_create(
            name='Root',
            rankid=0,
            treedef=self.geologictimeperiodtreedef,
        )
        self.erathem_rank, _ = Geologictimeperiodtreedefitem.objects.get_or_create(
            name='Erathem',
            parent=self.root_rank,
            rankid=100,
            treedef=self.geologictimeperiodtreedef,
        )
        self.period_rank, _ = Geologictimeperiodtreedefitem.objects.get_or_create(
            name='Period',
            parent=self.erathem_rank,
            rankid=200,
            treedef=self.geologictimeperiodtreedef,
        )
        self.epoch_rank, _ = Geologictimeperiodtreedefitem.objects.get_or_create(
            name='Series/Epoch',
            parent=self.period_rank,
            rankid=300,
            treedef=self.geologictimeperiodtreedef,
        )
        self.stage_rank, _ = Geologictimeperiodtreedefitem.objects.get_or_create(
            name='Stage/Age',
            parent=self.epoch_rank,
            rankid=400,
            treedef=self.geologictimeperiodtreedef,
        )

        root_chronostrat = Geologictimeperiod.objects.create(
            name='Root',
            rankid=0,
            definitionitem=self.root_rank,
            definition=self.geologictimeperiodtreedef,
            startperiod=100000,
            endperiod=0,
        )
        cenozoic_erathem_chronostrat = Geologictimeperiod.objects.create(
            name='Cenozoic',
            rankid=100,
            definitionitem=self.erathem_rank,
            definition=self.geologictimeperiodtreedef,
            startperiod=None,
            startuncertainty=None,
            endperiod=None,
            enduncertainty=None,
        )
        paelozoic_erathem_chronostrat = Geologictimeperiod.objects.create(
            name='Paleozoic',
            rankid=100,
            definitionitem=self.erathem_rank,
            definition=self.geologictimeperiodtreedef,
            startperiod=570,
            startuncertainty=None,
            endperiod=245,
            enduncertainty=20,
        )
        null_erathem_chronostrat = Geologictimeperiod.objects.create(
            name='Null',
            rankid=100,
            definitionitem=self.erathem_rank,
            definition=self.geologictimeperiodtreedef,
            startperiod=None,
            startuncertainty=None,
            endperiod=None,
            enduncertainty=None,
        )
        paleogene_period_chronostrat = Geologictimeperiod.objects.create(
            name='Paleogene',
            rankid=200,
            definitionitem=self.period_rank,
            definition=self.geologictimeperiodtreedef,
            startperiod=66,
            startuncertainty=None,
            endperiod=23,
            enduncertainty=None,
        )
        devonian_period_chronostrat = Geologictimeperiod.objects.create(
            name='Devonian',
            rankid=200,
            definitionitem=self.period_rank,
            definition=self.geologictimeperiodtreedef,
            startperiod=419.2,
            startuncertainty=None,
            endperiod=358.9,
            enduncertainty=None,
        )
        jurassic_period_chronostrat = Geologictimeperiod.objects.create(
            name='Jurassic',
            rankid=200,
            definitionitem=self.period_rank,
            definition=self.geologictimeperiodtreedef,
            startperiod=208,
            startuncertainty=18,
            endperiod=144,
            enduncertainty=5,
        )
        paleocene_epoch_chronostrat = Geologictimeperiod.objects.create(
            name='Paleocene',
            rankid=300,
            definitionitem=self.epoch_rank,
            definition=self.geologictimeperiodtreedef,
            startperiod=66,
            startuncertainty=None,
            endperiod=56,
            enduncertainty=None,
        )
        eocene_epoch_chronostrat = Geologictimeperiod.objects.create(
            name='Eocene',
            rankid=300,
            definitionitem=self.epoch_rank,
            definition=self.geologictimeperiodtreedef,
            startperiod=56,
            startuncertainty=None,
            endperiod=33.9,
            enduncertainty=None,
        )
        test_epoch_chronostrat = Geologictimeperiod.objects.create(
            name='Test Epoch',
            rankid=300,
            definitionitem=self.epoch_rank,
            definition=self.geologictimeperiodtreedef,
            startperiod=100,
            startuncertainty=11,
            endperiod=50,
            enduncertainty=6,
        )
        late_jurassic_epoch_chronostrat = Geologictimeperiod.objects.create(
            name='Late Jurassic',
            rankid=300,
            definitionitem=self.epoch_rank,
            definition=self.geologictimeperiodtreedef,
            startperiod=163,
            startuncertainty=15,
            endperiod=144,
            enduncertainty=5,
        )
        selandian_stage_chronostrat = Geologictimeperiod.objects.create(
            name='Selandian',
            rankid=400,
            definitionitem=self.stage_rank,
            definition=self.geologictimeperiodtreedef,
            startperiod=61.6,
            startuncertainty=None,
            endperiod=59.2,
            enduncertainty=None,
        )
        franconian_stage_chronostrat = Geologictimeperiod.objects.create(
            name='Franconian',
            rankid=400,
            definitionitem=self.stage_rank,
            definition=self.geologictimeperiodtreedef,
            startperiod=523,
            startuncertainty=36,
            endperiod=505,
            enduncertainty=32,
        )
        oxfordian_stage_chronostrat = Geologictimeperiod.objects.create(
            name='Oxfordian',
            rankid=400,
            definitionitem=self.stage_rank,
            definition=self.geologictimeperiodtreedef,
            startperiod=163,
            startuncertainty=15,
            endperiod=156,
            enduncertainty=6,
        )

        self.geo_time_period_dict = {
            'root': root_chronostrat,
            'cenozoic': cenozoic_erathem_chronostrat,
            'paleozoic': paelozoic_erathem_chronostrat,
            'paleogene': paleogene_period_chronostrat,
            'devonian': devonian_period_chronostrat,
            'paleocene': paleocene_epoch_chronostrat,
            'eocene': eocene_epoch_chronostrat,
            'test': test_epoch_chronostrat,
            'selandian': selandian_stage_chronostrat,
            'franconian': franconian_stage_chronostrat,
            'oxfordian': oxfordian_stage_chronostrat,
            'jurassic': jurassic_period_chronostrat,
            'late_jurassic': late_jurassic_epoch_chronostrat,
        }

    def test_geotime_range_all_paths(self):
        # Test absolute age
        co_1 = Collectionobject.objects.create(collection=self.collection)
        absolute_age_200 = Absoluteage.objects.create(absoluteage=200, collectionobject=co_1)

        self.assertTrue(co_1.id in geo_time.search_co_ids_in_time_range(250, 150))
        
        # Test relative age
        co_2 = Collectionobject.objects.create(collection=self.collection)
        relative_age = Relativeage.objects.create(
            agename=self.geo_time_period_dict['paleocene'], # 66-56
            collectionobject=co_2
        )

        self.assertTrue(co_2.id in geo_time.search_co_ids_in_time_range(65, 55))

        # Test relative age with uncertainty
        co_3 = Collectionobject.objects.create(collection=self.collection)
        relative_age = Relativeage.objects.create(
            ageuncertainty=2,
            agename=self.geo_time_period_dict['paleocene'], # 66-56
            collectionobject=co_3
        )

        self.assertTrue(co_3.id in geo_time.search_co_ids_in_time_range(65, 55))
        self.assertTrue(co_3.id in geo_time.search_co_ids_in_time_range(67, 53))
        self.assertTrue(co_3.id in geo_time.search_co_ids_in_time_range(60, 0))
        self.assertTrue(co_3.id in geo_time.search_co_ids_in_time_range(200, 60))
        self.assertTrue(co_3.id in geo_time.search_co_ids_in_time_range(200, 0))
        self.assertFalse(co_3.id in geo_time.search_co_ids_in_time_range(200, 100))
        self.assertFalse(co_3.id in geo_time.search_co_ids_in_time_range(20, 10))

        # Test relative age with agenameend
        co_4 = Collectionobject.objects.create(collection=self.collection)
        relative_age = Relativeage.objects.create(
            agename=self.geo_time_period_dict['devonian'], # 419.2-358.9
            agenameend=self.geo_time_period_dict['paleogene'], # 66-23
            collectionobject=co_4
        )

        self.assertTrue(co_4.id in geo_time.search_co_ids_in_time_range(200, 100))
        self.assertTrue(co_4.id in geo_time.search_co_ids_in_time_range(200, 10))

        # Test collection object paleo context
        co_paleo_context = Paleocontext.objects.create(
            chronosstrat=self.geo_time_period_dict['paleocene'], # 66-56
            discipline=self.discipline
        )
        co_5 = Collectionobject.objects.create(collection=self.collection, paleocontext=co_paleo_context)

        self.assertTrue(co_5.id in geo_time.search_co_ids_in_time_range(65, 55))

        # Test collecting event paleo context
        ce_paleo_context = Paleocontext.objects.create(
            chronosstrat=self.geo_time_period_dict['paleocene'], # 66-56,
            discipline=self.discipline
        )
        collecting_event_1 = Collectingevent.objects.create(paleocontext=ce_paleo_context, discipline=self.discipline)
        co_6 = Collectionobject.objects.create(collection=self.collection, collectingevent=collecting_event_1)

        self.assertTrue(co_6.id in geo_time.search_co_ids_in_time_range(65, 55))

        # Test locality paleo context
        loc_paleo_context = Paleocontext.objects.create(
            chronosstrat=self.geo_time_period_dict['paleocene'], # 66-56,
            discipline=self.discipline
        )
        locality_1 = Locality.objects.create(paleocontext=loc_paleo_context, discipline=self.discipline)
        collecting_event_2 = Collectingevent.objects.create(locality=locality_1, discipline=self.discipline)
        co_7 = Collectionobject.objects.create(collection=self.collection, collectingevent=collecting_event_2)

        self.assertTrue(co_7.id in geo_time.search_co_ids_in_time_range(65, 55))

        # Test collection object paleo context with chronosstratend
        co_paleo_context = Paleocontext.objects.create(
            chronosstrat=self.geo_time_period_dict['devonian'], # 419.2-358.9
            chronosstratend=self.geo_time_period_dict['paleogene'], # 66-23
            discipline=self.discipline
        )
        co_8 = Collectionobject.objects.create(collection=self.collection, paleocontext=co_paleo_context)

        self.assertTrue(co_8.id in geo_time.search_co_ids_in_time_range(200, 100))

        # Test exclusions with relative age with uncertainty
        co_9 = Collectionobject.objects.create(collection=self.collection)
        relative_age = Relativeage.objects.create(
            ageuncertainty=5,
            agename=self.geo_time_period_dict['paleocene'], # 66-56
            collectionobject=co_9
        )

        self.assertFalse(co_9.id in geo_time.search_co_ids_in_time_range(200, 100))

        # Test range coverage of relaiveage with uncertainty
        co_10 = Collectionobject.objects.create(collection=self.collection)
        relative_age = Relativeage.objects.create(
            agename=self.geo_time_period_dict['test'], # 100(+/-11)-50(+/-6)
            collectionobject=co_10
        )

        self.assertTrue(co_10.id in geo_time.search_co_ids_in_time_range(100, 50))
        self.assertTrue(co_10.id in geo_time.search_co_ids_in_time_range(200, 45))
        self.assertTrue(co_10.id in geo_time.search_co_ids_in_time_range(110, 10))
        self.assertTrue(co_10.id in geo_time.search_co_ids_in_time_range(200, 10))
        self.assertTrue(co_10.id in geo_time.search_co_ids_in_time_range(200, 105))
        self.assertTrue(co_10.id in geo_time.search_co_ids_in_time_range(48, 10))
        self.assertTrue(co_10.id in geo_time.search_co_ids_in_time_range(90, 55))
        self.assertTrue(co_10.id in geo_time.search_co_ids_in_time_range(80, 70))
        self.assertTrue(co_10.id in geo_time.search_co_ids_in_time_range(89, 56))
        self.assertFalse(co_10.id in geo_time.search_co_ids_in_time_range(200, 112))
        self.assertFalse(co_10.id in geo_time.search_co_ids_in_time_range(43, 10))
        self.assertTrue(co_10.id in geo_time.search_co_ids_in_time_range(110, 45, require_full_overlap=True))
        self.assertTrue(co_10.id in geo_time.search_co_ids_in_time_range(90, 55, require_full_overlap=True))
        self.assertTrue(co_10.id in geo_time.search_co_ids_in_time_range(200, 10, require_full_overlap=True))
        self.assertFalse(co_10.id in geo_time.search_co_ids_in_time_range(80, 70, require_full_overlap=True))
        self.assertFalse(co_10.id in geo_time.search_co_ids_in_time_range(48, 10, require_full_overlap=True))
        self.assertFalse(co_10.id in geo_time.search_co_ids_in_time_range(58, 10, require_full_overlap=True))
        self.assertFalse(co_10.id in geo_time.search_co_ids_in_time_range(200, 110, require_full_overlap=True))
        self.assertFalse(co_10.id in geo_time.search_co_ids_in_time_range(200, 92, require_full_overlap=True))
        self.assertFalse(co_10.id in geo_time.search_co_ids_in_time_range(200, 70, require_full_overlap=True))

        # Test relaiveage with uncertainty and require_full_overlap
        co_11 = Collectionobject.objects.create(collection=self.collection)
        relative_age = Relativeage.objects.create(
            ageuncertainty=5,
            agename=self.geo_time_period_dict['paleocene'], # 66-56
            collectionobject=co_11
        )

        self.assertTrue(co_11.id in geo_time.search_co_ids_in_time_range(65, 55, require_full_overlap=True))
        self.assertFalse(co_11.id in geo_time.search_co_ids_in_time_range(75, 65, require_full_overlap=True))
        self.assertFalse(co_11.id in geo_time.search_co_ids_in_time_range(60, 50, require_full_overlap=True))

    def test_geotime_period(self):
        # Test relative age
        co_1 = Collectionobject.objects.create(collection=self.collection)
        relative_age = Relativeage.objects.create(
            agename=self.geo_time_period_dict['paleocene'], # 66-56
            collectionobject=co_1
        )

        self.assertTrue(co_1.id in geo_time.search_co_ids_in_time_period('paleocene'))

    def test_geotime_simple(self):
        co_1 = Collectionobject.objects.create(collection=self.collection)
        absolute_age_200 = Absoluteage.objects.create(absoluteage=200, ageuncertainty=10.0, collectionobject=co_1)

        self.assertTrue(co_1.id in geo_time.search_co_ids_in_time_range(300, 100))
        self.assertTrue(co_1.id in geo_time.search_co_ids_in_time_range(300, 200))
        self.assertTrue(co_1.id in geo_time.search_co_ids_in_time_range(200, 100))
        self.assertTrue(co_1.id in geo_time.search_co_ids_in_time_range(300, 201))
        self.assertTrue(co_1.id in geo_time.search_co_ids_in_time_range(199, 100))
        self.assertTrue(co_1.id in geo_time.search_co_ids_in_time_range(300, 199))
        self.assertTrue(co_1.id in geo_time.search_co_ids_in_time_range(201, 100))
        self.assertTrue(co_1.id in geo_time.search_co_ids_in_time_range(300, 100, require_full_overlap=True))
        self.assertTrue(co_1.id in geo_time.search_co_ids_in_time_range(201, 199, require_full_overlap=True))
        self.assertFalse(co_1.id in geo_time.search_co_ids_in_time_range(300, 250))
        self.assertFalse(co_1.id in geo_time.search_co_ids_in_time_range(150, 100))
        self.assertFalse(co_1.id in geo_time.search_co_ids_in_time_range(300, 250, require_full_overlap=True))
        self.assertFalse(co_1.id in geo_time.search_co_ids_in_time_range(150, 100, require_full_overlap=True))

        co_2 = Collectionobject.objects.create(collection=self.collection)
        relative_age_1 = Relativeage.objects.create(
            agename=self.geo_time_period_dict['jurassic'], # 208-144
            collectionobject=co_2
        )

        self.assertTrue(co_2.id in geo_time.search_co_ids_in_time_range(220, 140))
        self.assertTrue(co_2.id in geo_time.search_co_ids_in_time_range(180, 160))
        self.assertTrue(co_2.id in geo_time.search_co_ids_in_time_range(220, 100))
        self.assertTrue(co_2.id in geo_time.search_co_ids_in_time_range(300, 140))
        self.assertTrue(co_2.id in geo_time.search_co_ids_in_time_range(180, 100))
        self.assertTrue(co_2.id in geo_time.search_co_ids_in_time_range(300, 160))
        self.assertTrue(co_2.id in geo_time.search_co_ids_in_time_range(300, 100))
        self.assertTrue(co_2.id in geo_time.search_co_ids_in_time_range(300, 100, require_full_overlap=True))
        self.assertTrue(co_2.id in geo_time.search_co_ids_in_time_range(195, 145, require_full_overlap=True))
        self.assertFalse(co_2.id in geo_time.search_co_ids_in_time_range(300, 250))
        self.assertFalse(co_2.id in geo_time.search_co_ids_in_time_range(120, 100))
        self.assertFalse(co_2.id in geo_time.search_co_ids_in_time_range(300, 250, require_full_overlap=True))
        self.assertFalse(co_2.id in geo_time.search_co_ids_in_time_range(120, 100, require_full_overlap=True))
        self.assertFalse(co_2.id in geo_time.search_co_ids_in_time_range(180, 160, require_full_overlap=True))
        self.assertFalse(co_2.id in geo_time.search_co_ids_in_time_range(180, 100, require_full_overlap=True))
        self.assertFalse(co_2.id in geo_time.search_co_ids_in_time_range(300, 160, require_full_overlap=True))

        co_3 = Collectionobject.objects.create(collection=self.collection)
        relative_age_2 = Relativeage.objects.create(
            agename=self.geo_time_period_dict['devonian'], # 419.2-358.9
            agenameend=self.geo_time_period_dict['paleogene'], # 66-23
            collectionobject=co_3
        )

        self.assertTrue(co_3.id in geo_time.search_co_ids_in_time_range(200, 100))
        self.assertTrue(co_3.id in geo_time.search_co_ids_in_time_range(200, 10))

        ce_paleo_context_1 = Paleocontext.objects.create(
            chronosstrat=self.geo_time_period_dict['late_jurassic'], # 163-144
            discipline=self.discipline
        )
        co_4 = Collectionobject.objects.create(collection=self.collection, paleocontext=ce_paleo_context_1)


        ce_paleo_context_2 = Paleocontext.objects.create(
            chronosstrat=self.geo_time_period_dict['franconian'], # 523-505
            discipline=self.discipline
        )
        collecting_event_1 = Collectingevent.objects.create(paleocontext=ce_paleo_context_2, discipline=self.discipline)
        co_5 = Collectionobject.objects.create(collection=self.collection, collectingevent=collecting_event_1)

        loc_paleo_context = Paleocontext.objects.create(
            chronosstrat=self.geo_time_period_dict['oxfordian'], # 163-156
            discipline=self.discipline
        )
        locality_1 = Locality.objects.create(paleocontext=loc_paleo_context, discipline=self.discipline)
        collecting_event_2 = Collectingevent.objects.create(locality=locality_1, discipline=self.discipline)
        co_6 = Collectionobject.objects.create(collection=self.collection, collectingevent=collecting_event_2)

    def test_invalid_chronostrat(self):
        bad_chronostrat = Geologictimeperiod.objects.create(
            name='BadBoyz',
            rankid=100,
            definitionitem=self.erathem_rank,
            definition=self.geologictimeperiodtreedef,
            startperiod=10,
            endperiod=90,
            parent=self.geo_time_period_dict['root']
        )
        co_1 = Collectionobject.objects.create(collection=self.collection)
        relative_age = Relativeage.objects.create(
            agename=bad_chronostrat,
            collectionobject=co_1
        )

        self.assertFalse(co_1.id in geo_time.search_co_ids_in_time_range(200, 10))

        bad_chronostrat.startperiod = 100
        bad_chronostrat.name = 'GoodBoyz' # important, don't change this :)
        bad_chronostrat.save()

        self.assertTrue(co_1.id in geo_time.search_co_ids_in_time_range(200, 10))
    
    @skip('Fix API test call')
    def test_geotime_any(self):
        c = Client()
        c.force_login(self.specifyuser)

        # Assert that the api request ran successfully
        response = self.client.post(
            f'/stored_query/ephemeral/',
            data=json.dumps({
                "name": "Test All Ages",
                "contextname": "CollectionObject",
                "contexttableid": 1,
                "selectdistinct": False,
                "countonly": False,
                "formatauditrecids": False,
                "specifyuser": f"/api/specify/specifyuser/{self.specifyuser}/",
                "isfavorite": True,
                # "ordinal": 32767,
                "fields": [
                    {
                        "tablelist": "1",
                        "stringid": "1.collectionobject.age",
                        "fieldname": "age",
                        "isrelfld": False,
                        "sorttype": 0,
                        "position": 0,
                        "isdisplay": True,
                        "operstart": 8,
                        "startvalue": "",
                        "isnot": False,
                        "isstrict": False
                    },
                    {
                        "tablelist": "1",
                        "stringid": "1.collectionobject.collectionObjectId",
                        "fieldname": "collectionObjectId",
                        "isrelfld": False,
                        "sorttype": 0,
                        "position": 1,
                        "isdisplay": True,
                        "operstart": 8,
                        "startvalue": "",
                        "isnot": False,
                        "isstrict": False
                    }
                ],
                "_tablename": "SpQuery",
                "remarks": None,
                "searchsynonymy": None,
                "smushed": None,
                "sqlstr": None,
                "timestampcreated": "2024-11-06",
                "timestampmodified": None,
                "version": 1,
                "createdbyagent": None,
                "modifiedbyagent": None,
                "limit": 40,
                "offset": 0
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
