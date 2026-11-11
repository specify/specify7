from specifyweb.specify import models
from specifyweb.specify.api.crud import post_resource, update_obj
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

    def test_create_new_cog_child(self):
        parent = post_resource(
            self.collection,
            self.agent,
            'collectionobjectgroup',
            {
                'collection': uri_for_model('collection', self.collection.id),
                'cogtype': uri_for_model(
                    'collectionobjectgrouptype', self.cogtype.id
                ),
                'name': 'Parent COG',
            },
        )

        update_obj(
            self.collection,
            self.agent,
            'collectionobjectgroup',
            parent.id,
            parent.version,
            {
                'children': [
                    {
                        'isPrimary': False,
                        'isSubstrate': False,
                        'childCog': {
                            'collection': uri_for_model(
                                'collection', self.collection.id
                            ),
                            'cogtype': uri_for_model(
                                'collectionobjectgrouptype',
                                self.cogtype.id,
                            ),
                            'name': 'Child COG',
                        },
                    }
                ],
            },
        )

        join = models.Collectionobjectgroupjoin.objects.get(
            parentcog=parent, childcog__name='Child COG'
        )
        self.assertEqual(join.childcog.name, 'Child COG')
        self.assertIs(join.isprimary, False)
        self.assertIs(join.issubstrate, False)

    def test_add_existing_cog_child(self):
        parent = post_resource(
            self.collection,
            self.agent,
            'collectionobjectgroup',
            {
                'collection': uri_for_model('collection', self.collection.id),
                'cogtype': uri_for_model(
                    'collectionobjectgrouptype', self.cogtype.id
                ),
                'name': 'Parent COG',
            },
        )
        child = post_resource(
            self.collection,
            self.agent,
            'collectionobjectgroup',
            {
                'collection': uri_for_model('collection', self.collection.id),
                'cogtype': uri_for_model(
                    'collectionobjectgrouptype', self.cogtype.id
                ),
                'name': 'Existing COG',
            },
        )

        update_obj(
            self.collection,
            self.agent,
            'collectionobjectgroup',
            parent.id,
            parent.version,
            {
                'children': [
                    {
                        'isPrimary': False,
                        'isSubstrate': False,
                        'childCog': uri_for_model(
                            'collectionobjectgroup', child.id
                        ),
                    }
                ],
            },
        )

        join = models.Collectionobjectgroupjoin.objects.get(
            parentcog=parent, childcog=child
        )
        self.assertIs(join.isprimary, False)
        self.assertIs(join.issubstrate, False)
