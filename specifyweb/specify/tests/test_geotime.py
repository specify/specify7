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
            'selandian': selandian_stage_chronostrat,
        }

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

    def test_geotime_range_all_paths(self):
        # Test absolute age
        co_1 = Collectionobject.objects.create(collection=self.collection)
        absolute_age_200 = Absoluteage.objects.create(absoluteage=200, collectionobject=co_1)

        result_co_ids = geo_time.search_co_ids_in_time_range(250, 150)
        self.assertTrue(co_1.id in result_co_ids)
        
        # Test relative age
        co_2 = Collectionobject.objects.create(collection=self.collection)
        relative_age = Relativeage.objects.create(
            agename=self.geo_time_period_dict['paleocene'], # 66-56
            collectionobject=co_2
        )

        result_co_ids = geo_time.search_co_ids_in_time_range(65, 55)
        self.assertTrue(co_2.id in result_co_ids)

        # Test relative age with uncertainty TODO
        co_3 = Collectionobject.objects.create(collection=self.collection)
        relative_age = Relativeage.objects.create(
            ageuncertainty=5,
            agename=self.geo_time_period_dict['paleocene'], # 66-56
            collectionobject=co_3
        )

        result_co_ids = geo_time.search_co_ids_in_time_range(65, 55)
        self.assertTrue(co_3.id in result_co_ids)

        # Test relative age with agenameend
        co_4 = Collectionobject.objects.create(collection=self.collection)
        relative_age = Relativeage.objects.create(
            agename=self.geo_time_period_dict['devonian'], # 419.2-358.9
            agenameend=self.geo_time_period_dict['paleogene'], # 66-23
            collectionobject=co_4
        )

        result_co_ids = geo_time.search_co_ids_in_time_range(200, 100)
        self.assertFalse(co_4.id in result_co_ids)

        # Test collection object paleo context
        co_paleo_context = Paleocontext.objects.create(
            chronosstrat=self.geo_time_period_dict['paleocene'], # 66-56
            discipline=self.discipline
        )
        co_5 = Collectionobject.objects.create(collection=self.collection, paleocontext=co_paleo_context)

        result_co_ids = geo_time.search_co_ids_in_time_range(65, 55)
        self.assertTrue(co_5.id in result_co_ids)

        # Test collecting event paleo context
        ce_paleo_context = Paleocontext.objects.create(
            chronosstrat=self.geo_time_period_dict['paleocene'], # 66-56,
            discipline=self.discipline
        )
        collecting_event_1 = Collectingevent.objects.create(paleocontext=ce_paleo_context, discipline=self.discipline)
        co_6 = Collectionobject.objects.create(collection=self.collection, collectingevent=collecting_event_1)

        result_co_ids = geo_time.search_co_ids_in_time_range(65, 55)
        self.assertTrue(co_6.id in result_co_ids)

        # Test locality paleo context
        loc_paleo_context = Paleocontext.objects.create(
            chronosstrat=self.geo_time_period_dict['paleocene'], # 66-56,
            discipline=self.discipline
        )
        locality_1 = Locality.objects.create(paleocontext=loc_paleo_context, discipline=self.discipline)
        collecting_event_2 = Collectingevent.objects.create(locality=locality_1, discipline=self.discipline)
        co_7 = Collectionobject.objects.create(collection=self.collection, collectingevent=collecting_event_2)

        result_co_ids = geo_time.search_co_ids_in_time_range(65, 55)
        self.assertTrue(co_7.id in result_co_ids)

        # Test collection object paleo context with chronosstratend
        co_paleo_context = Paleocontext.objects.create(
            chronosstrat=self.geo_time_period_dict['devonian'], # 419.2-358.9
            chronosstratend=self.geo_time_period_dict['paleogene'], # 66-23
            discipline=self.discipline
        )
        co_8 = Collectionobject.objects.create(collection=self.collection, paleocontext=co_paleo_context)

        result_co_ids = geo_time.search_co_ids_in_time_range(200, 100)
        self.assertTrue(co_8.id in result_co_ids)
