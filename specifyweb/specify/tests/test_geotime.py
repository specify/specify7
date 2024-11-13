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

        root_rank, _ = Geologictimeperiodtreedefitem.objects.get_or_create(
            name='Root',
            rankid=0,
            treedef=self.geologictimeperiodtreedef,
        )
        erathem_rank, _ = Geologictimeperiodtreedefitem.objects.get_or_create(
            name='Erathem',
            parent=root_rank,
            rankid=100,
            treedef=self.geologictimeperiodtreedef,
        )
        period_rank, _ = Geologictimeperiodtreedefitem.objects.get_or_create(
            name='Period',
            parent=erathem_rank,
            rankid=200,
            treedef=self.geologictimeperiodtreedef,
        )
        epoch_rank, _ = Geologictimeperiodtreedefitem.objects.get_or_create(
            name='Series/Epoch',
            parent=period_rank,
            rankid=300,
            treedef=self.geologictimeperiodtreedef,
        )
        stage_rank, _ = Geologictimeperiodtreedefitem.objects.get_or_create(
            name='Stage/Age',
            parent=epoch_rank,
            rankid=400,
            treedef=self.geologictimeperiodtreedef,
        )

        root_chronostrat = Geologictimeperiod.objects.create(
            name='Root',
            rankid=0,
            definitionitem=root_rank,
            definition=self.geologictimeperiodtreedef,
            startperiod=100000,
            endperiod=0,
        )
        cenozoic_erathem_chronostrat = Geologictimeperiod.objects.create(
            name='Cenozoic',
            rankid=100,
            definitionitem=erathem_rank,
            definition=self.geologictimeperiodtreedef,
            startperiod=None,
            startuncertainty=None,
            endperiod=None,
            enduncertainty=None,
        )
        paelozoic_erathem_chronostrat = Geologictimeperiod.objects.create(
            name='Paleozoic',
            rankid=100,
            definitionitem=erathem_rank,
            definition=self.geologictimeperiodtreedef,
            startperiod=570,
            startuncertainty=None,
            endperiod=245,
            enduncertainty=20,
        )
        null_erathem_chronostrat = Geologictimeperiod.objects.create(
            name='Null',
            rankid=100,
            definitionitem=erathem_rank,
            definition=self.geologictimeperiodtreedef,
            startperiod=None,
            startuncertainty=None,
            endperiod=None,
            enduncertainty=None,
        )
        paleogene_period_chronostrat = Geologictimeperiod.objects.create(
            name='Paleogene',
            rankid=200,
            definitionitem=period_rank,
            definition=self.geologictimeperiodtreedef,
            startperiod=66,
            startuncertainty=None,
            endperiod=23,
            enduncertainty=None,
        )
        devonian_period_chronostrat = Geologictimeperiod.objects.create(
            name='Devonian',
            rankid=200,
            definitionitem=period_rank,
            definition=self.geologictimeperiodtreedef,
            startperiod=419.2,
            startuncertainty=None,
            endperiod=358.9,
            enduncertainty=None,
        )
        paleocene_epoch_chronostrat = Geologictimeperiod.objects.create(
            name='Paleocene',
            rankid=300,
            definitionitem=epoch_rank,
            definition=self.geologictimeperiodtreedef,
            startperiod=66,
            startuncertainty=None,
            endperiod=56,
            enduncertainty=None,
        )
        eocene_epoch_chronostrat = Geologictimeperiod.objects.create(
            name='Eocene',
            rankid=300,
            definitionitem=epoch_rank,
            definition=self.geologictimeperiodtreedef,
            startperiod=56,
            startuncertainty=None,
            endperiod=33.9,
            enduncertainty=None,
        )
        test_epoch_chronostrat = Geologictimeperiod.objects.create(
            name='Test Epoch',
            rankid=300,
            definitionitem=epoch_rank,
            definition=self.geologictimeperiodtreedef,
            startperiod=100,
            startuncertainty=11,
            endperiod=50,
            enduncertainty=6,
        )
        selandian_stage_chronostrat = Geologictimeperiod.objects.create(
            name='Selandian',
            rankid=400,
            definitionitem=stage_rank,
            definition=self.geologictimeperiodtreedef,
            startperiod=61.6,
            startuncertainty=None,
            endperiod=59.2,
            enduncertainty=None,
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
