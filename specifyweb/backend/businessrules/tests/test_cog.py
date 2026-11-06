from specifyweb.specify import models
from specifyweb.specify.api.crud import post_resource
from specifyweb.specify.api.serializers import uri_for_model
from specifyweb.specify.tests.test_api import DefaultsSetup


class CogCreationTests(DefaultsSetup):
    def test_create_cog_with_name(self):
        cog = post_resource(
            self.collection,
            self.agent,
            'collectionobjectgroup',
            {
                'collection': uri_for_model('collection', self.collection.id),
                'cogtype': uri_for_model(
                    'collectionobjectgrouptype', self.cogtype.id
                ),
                'name': 'Named COG',
            },
        )

        self.assertExists(
            models.Collectionobjectgroup.objects.filter(
                id=cog.id, name='Named COG'
            )
        )
