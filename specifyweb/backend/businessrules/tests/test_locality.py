from django.db.models import ProtectedError
from specifyweb.specify import models
from specifyweb.specify.api.crud import post_resource, update_obj
from specifyweb.specify.api.serializers import uri_for_model
from specifyweb.specify.tests.test_api import ApiTests

class LocalityBusinessRuleTests(ApiTests):
    def _geography_data(self, name='Test geography'):
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

        self.assertIsNotNone(locality.geography)
        self.assertEqual(locality.geography.name, 'New geography')
        self.assertEqual(
            locality.geography.definition_id,
            self.geographytreedef.id,
        )

    def test_add_existing_geography_to_locality(self):
        geography = models.Geography.objects.create(
            name='Existing geography',
            definition=self.geographytreedef,
            definitionitem=self.geographytreedef.treedefitems.get(rankid=0),
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

