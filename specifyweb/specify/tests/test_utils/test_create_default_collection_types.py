from specifyweb.specify.tests.test_api import ApiTests
from django.apps import apps
from specifyweb.specify.models import Collection, Collectionobject, Collectionobjecttype
from specifyweb.specify.utils import create_default_collection_types

class TestCreateDefaultCollectionTypes(ApiTests):
    def setUp(self):
        super().setUp()
        Collectionobject.objects.all().delete()
        Collectionobjecttype.objects.all().delete()
        Collection.objects.all().delete()


    def test_no_collection_case(self):
        Collectionobject.objects.all().delete()
        Collection.objects.all().delete()
        create_default_collection_types(apps)
        