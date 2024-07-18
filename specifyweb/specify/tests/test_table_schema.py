from django.conf import settings
from django.db import IntegrityError, transaction
from specifyweb.specify.tests.test_api import DefaultsSetup
from specifyweb.businessrules.exceptions import BusinessRuleException
from specifyweb.specify.models import (
    Collectionobject,
    CollectionObjectGroup,
    CollectionObjectGroupType,
    CollectionObjectGroupJoin,
)

class TableSchemaTests(DefaultsSetup):
    def test_cojo(self) -> None:
        co_1 = Collectionobject.objects.create(collectionmemberid=1, collection=self.collection)
        co_2 = Collectionobject.objects.create(collectionmemberid=1, collection=self.collection)
        co_3 = Collectionobject.objects.create(collectionmemberid=1, collection=self.collection)

        cog_type = CollectionObjectGroupType.objects.create(
            name="microscope slide", type="Discrete", collection=self.collection
        )

        cog_1 = CollectionObjectGroup.objects.create(collection=self.collection, cogtype=cog_type)
        cog_2 = CollectionObjectGroup.objects.create(collection=self.collection, cogtype=cog_type)
        cog_3 = CollectionObjectGroup.objects.create(collection=self.collection, cogtype=cog_type)

        CollectionObjectGroupJoin.objects.create(parentcog=cog_1, childcog=cog_2, childco=None)
        CollectionObjectGroupJoin.objects.create(parentcog=cog_2, childcog=None, childco=co_1)
        CollectionObjectGroupJoin.objects.create(parentcog=cog_2, childcog=None, childco=co_2)

        with self.assertRaises(IntegrityError), transaction.atomic():
            CollectionObjectGroupJoin.objects.create(parentcog=cog_3, childcog=cog_2, childco=None)
        with self.assertRaises(IntegrityError), transaction.atomic():
            CollectionObjectGroupJoin.objects.create(parentcog=cog_3, childcog=None, childco=co_1)
        with self.assertRaises(BusinessRuleException), transaction.atomic():
            CollectionObjectGroupJoin.objects.create(parentcog=cog_3, childcog=None, childco=None)
        with self.assertRaises(BusinessRuleException), transaction.atomic():
            CollectionObjectGroupJoin.objects.create(parentcog=cog_3, childcog=cog_1, childco=co_3)