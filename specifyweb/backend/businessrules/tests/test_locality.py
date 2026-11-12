from decimal import Decimal

from django.db.models import ProtectedError
from specifyweb.specify import models
from specifyweb.specify.api.crud import post_resource, update_obj
from specifyweb.specify.api.serializers import uri_for_model
from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.specify.utils.scoping import ScopeType

class LocalityBusinessRuleTests(ApiTests):
    def _geography_data(self, name):
        return {
            'name': name,
            'definition': uri_for_model(
                'geographytreedef', self.geographytreedef.id
            ),
            'definitionitem': uri_for_model(
                'geographytreedefitem',
                self.geographytreedef.treedefitems.get(rankid=0).id,
            ),
        }

    def test_create_new_geography_from_locality(self):
        locality = post_resource(
            self.collection,
            self.agent,
            'locality',
            {
                'localityname': 'Locality with new geography',
                'srclatlongunit': 0,
                'discipline': uri_for_model(
                    'discipline', self.discipline.id
                ),
                'geography': self._geography_data('New geography'),
            },
        )

        locality.refresh_from_db()
        self.assertIsNotNone(locality.geography)
        self.assertEqual(locality.geography.name, 'New geography')
        self.assertEqual(
            locality.geography.definition_id,
            self.geographytreedef.id,
        )

    def test_add_existing_geography_to_locality(self):
        geography = post_resource(
            self.collection,
            self.agent,
            'geography',
            self._geography_data('Existing geography'),
        )
        locality = models.Locality.objects.create(
            localityname='Locality with existing geography',
            srclatlongunit=0,
            discipline=self.discipline,
        )

        update_obj(
            self.collection,
            self.agent,
            'locality',
            locality.id,
            locality.version,
            {
                'geography': uri_for_model('geography', geography.id),
            },
        )

        locality.refresh_from_db()
        self.assertEqual(locality.geography_id, geography.id)
        self.assertEqual(locality.geography.name, 'Existing geography')

    def test_add_paleocontext_to_locality(self):
        locality = models.Locality.objects.create(
            localityname='Locality with paleo context',
            srclatlongunit=0,
            discipline=self.discipline,
        )

        update_obj(
            self.collection,
            self.agent,
            'locality',
            locality.id,
            locality.version,
            {
                'paleocontext': {
                    'paleocontextname': 'Test Paleo Context',
                    'discipline': uri_for_model(
                        'discipline', self.discipline.id
                    ),
                }
            },
        )

        locality.refresh_from_db()
        self.assertIsNotNone(locality.paleocontext)
        self.assertEqual(
            locality.paleocontext.paleocontextname,
            'Test Paleo Context',
        )
        self.assertEqual(
            locality.paleocontext.discipline_id,
            self.discipline.id,
        )

    def test_add_attachment_to_locality(self):
        locality = models.Locality.objects.create(
            localityname='Locality with attachment',
            srclatlongunit=0,
            discipline=self.discipline,
        )

        locality_attachment = post_resource(
            self.collection,
            self.agent,
            'localityattachment',
            {
                'locality': uri_for_model('locality', locality.id),
                'ordinal': 0,
                'attachment': {
                    'origfilename': 'locality.txt',
                    'title': 'Locality attachment',
                },
            },
        )

        attachment = locality_attachment.attachment
        attachment.refresh_from_db()
        self.assertEqual(locality.localityattachments.count(), 1)
        self.assertEqual(attachment.origfilename, 'locality.txt')
        self.assertEqual(attachment.title, 'Locality attachment')
        self.assertEqual(
            attachment.tableid,
            models.Locality.specify_model.tableId,
        )
        self.assertEqual(attachment.scopetype, ScopeType.DISCIPLINE.value)
        self.assertEqual(attachment.scopeid, self.discipline.id)

    def test_locality_optional_fields_round_trip(self):
        locality = post_resource(
            self.collection,
            self.agent,
            'locality',
            {
                'localityname': 'Locality with optional fields',
                'srclatlongunit': 0,
                'discipline': uri_for_model(
                    'discipline', self.discipline.id
                ),
                'latitude1': Decimal('12.345'),
                'longitude1': Decimal('-45.678'),
                'lat1text': '12.345 N',
                'long1text': '45.678 W',
                'verbatimlatitude': '12.345',
                'verbatimlongitude': '-45.678',
                'latlongtype': 'Point',
                'latlongmethod': 'GPS',
                'datum': 'WGS84',
                'remarks': 'Optional locality fields',
            },
        )

        locality.refresh_from_db()
        self.assertEqual(locality.latitude1, Decimal('12.345'))
        self.assertEqual(locality.longitude1, Decimal('-45.678'))
        self.assertEqual(locality.lat1text, '12.345 N')
        self.assertEqual(locality.long1text, '45.678 W')
        self.assertEqual(locality.verbatimlatitude, '12.345')
        self.assertEqual(locality.verbatimlongitude, '-45.678')
        self.assertEqual(locality.latlongtype, 'Point')
        self.assertEqual(locality.latlongmethod, 'GPS')
        self.assertEqual(locality.datum, 'WGS84')
        self.assertEqual(locality.remarks, 'Optional locality fields')

    def test_create_locality_with_fields(self):
        locality = models.Locality.objects.create(
            localityname="Somewhere",
            srclatlongunit=0,
            discipline=self.discipline)

        fetched_locality = models.Locality.objects.get(id=locality.id)
        self.assertEqual(fetched_locality.localityname, "Somewhere")
        self.assertEqual(fetched_locality.srclatlongunit, 0)
        self.assertEqual(fetched_locality.discipline, self.discipline)

    def test_collectingevents_block_delete(self):
        locality = models.Locality.objects.create(
            localityname="Somewhere",
            srclatlongunit=0,
            discipline=self.discipline)

        collectingevent = models.Collectingevent.objects.create(
            discipline=self.discipline,
            locality=locality)

        with self.assertRaises(ProtectedError):
            locality.delete()

        collectingevent.locality = None
        collectingevent.save()

        locality.delete()

