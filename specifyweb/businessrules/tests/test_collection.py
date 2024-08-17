from ast import mod
from django.db.models import ProtectedError

from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests
from ..exceptions import BusinessRuleException

class CollectionTests(ApiTests):
    def test_collection_name_unique_in_discipline(self):
        with self.assertRaises(BusinessRuleException):
            models.Collection.objects.create(
                catalognumformatname='test',
                collectionname=self.collection.collectionname,
                isembeddedcollectingevent=False,
                discipline=self.discipline)

        models.Collection.objects.create(
            catalognumformatname='test',
            collectionname=self.collection.collectionname + 'foo',
            isembeddedcollectingevent=False,
            discipline=self.discipline)

    def test_code_is_unique(self):
        models.Collection.objects.create(
            catalognumformatname='test',
            collectionname='test1',
            isembeddedcollectingevent=False,
            discipline=self.discipline,
            code='TEST')

        with self.assertRaises(BusinessRuleException):
            models.Collection.objects.create(
                catalognumformatname='test',
                collectionname='test2',
                isembeddedcollectingevent=False,
                discipline=self.discipline,
                code='TEST')

    def test_null_code_need_not_be_unique(self):
        models.Collection.objects.create(
            catalognumformatname='test',
            collectionname='test1',
            isembeddedcollectingevent=False,
            discipline=self.discipline,
            code=None)

        models.Collection.objects.create(
            catalognumformatname='test',
            collectionname='test2',
            isembeddedcollectingevent=False,
            discipline=self.discipline,
            code=None)

    def test_collection_objects_block_delete(self):
        with self.assertRaises(ProtectedError):
            self.collection.delete()

        models.Collectionobjecttype.objects.filter(collection=self.collection).delete()
        models.Collectionobject.objects.filter(collection=self.collection).delete()
        self.collection.delete()
