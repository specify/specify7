from specifyweb.specify.serializers import uri_for_model
from specifyweb.specify.tests.test_api import ApiTests
from django.test import Client
import json

class TestDomain(ApiTests):

    def test_domain(self):
        c = Client()
        c.force_login(self.specifyuser)

        response = c.get('/context/domain.json')

        self._assertStatusCodeEqual(response, 200)

        collection = self.collection

        domain = {
        'collection': collection.id,
        'discipline': collection.discipline.id,
        'division': collection.discipline.division.id,
        'institution': collection.discipline.division.institution.id,
        'embeddedCollectingEvent': collection.isembeddedcollectingevent,
        'embeddedPaleoContext': collection.discipline.ispaleocontextembedded,
        'paleoContextChildTable': collection.discipline.paleocontextchildtable,
        'catalogNumFormatName': collection.catalognumformatname,
        'defaultCollectionObjectType': uri_for_model(collection.collectionobjecttype.__class__, collection.collectionobjecttype.id) if collection.collectionobjecttype is not None else None,
        'collectionObjectTypeCatalogNumberFormats': {
            uri_for_model(cot.__class__, cot.id): cot.catalognumberformatname for cot in collection.cotypes.all()
        }
        }

        self.assertEqual(domain, json.loads(response.content.decode()))