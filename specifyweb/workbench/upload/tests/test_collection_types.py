from jsonschema import validate # type: ignore

from specifyweb.workbench.upload.tests.base import UploadTestsBase
from ..upload_plan_schema import schema, parse_plan
from specifyweb.specify.models import Collectionobjecttype, Collectionobject
from ..scope_context import ScopeContext
from ..upload import do_upload
from ..upload_result import UploadResult, Matched, NullRecord

class CollectionObjectTypeTests(UploadTestsBase):

    def setUp(self):
        super().setUp()
        Collectionobjecttype.objects.all().delete()
        self.cot_1 = Collectionobjecttype.objects.create(
            name="cot_1",
            catalognumberformatname  = "CatalogNumberNumeric",
            collection = self.collection,
            taxontreedef = self.taxontreedef,
        )
        self.cot_2 = Collectionobjecttype.objects.create(
            name="cot_2",
            catalognumberformatname  = "CatalogNumberAlphaNumByYear",
            collection = self.collection,
            taxontreedef = self.taxontreedef,
        )
        self.cot_3 = Collectionobjecttype.objects.create(
            name="cot_3",
            # For this case, making sure it goes to default.
            catalognumberformatname  = None,
            collection = self.collection,
            taxontreedef = self.taxontreedef,
        )

    def get_basic_plan(self):
        return dict(
            baseTableName = 'Collectionobject',
            uploadable = {
                'uploadTable': dict(
                    wbcols = {
                        'catalognumber': 'cn'
                    },
                    static = {},
                    toOne = {
                        "collectionobjecttype": {
                            "uploadTable": dict(
                                wbcols = {
                                    "name": "COTName"
                                },
                                static = {},
                                toOne = {},
                                toMany = {}
                            )
                        }
                    },
                    toMany = {}
                )
            }
        )
        

    def test_basic_parsing(self) -> None:
        json = self.get_basic_plan()
        validate(json, schema)
    
    def test_no_caching(self) -> None:
        context = ScopeContext()
        plan = parse_plan(self.get_basic_plan()).apply_scoping(
            self.collection, 
            context
        )
        self.assertTrue(context.is_variable, "caching is not possible")

    def test_cotype_catnum(self) -> None:
        plan = parse_plan(self.get_basic_plan())
        rows = [
            dict(
                cn = "1234",
                COTName = "cot_1"
            ),
            dict(
                cn = "5678",
                COTName="cot_1"
            ),
            dict(
                cn = "2025-654321",
                COTName="cot_2"
            ),
            dict(
                cn = "2025-002898",
                COTName="cot_2"
            ),
            dict(
                cn = "895679",
                # goto default
                COTName="cot_3"
            ),
            dict(
                cn = "895678",
                # goto default
                COTName="cot_3"
            ),
            dict(
                cn = "898",
                # this will also be default!!
                COTName = ""
            )
        ]
        
        results = do_upload(self.collection, rows, plan, self.agent.id)
        # Make sure cat nums are seet
        self.assertEqual(self._get_co_catnum(results[0]), "000001234")
        self.assertEqual(self._get_co_catnum(results[1]), "000005678")
        self.assertEqual(self._get_co_catnum(results[2]), "2025-654321")
        self.assertEqual(self._get_co_catnum(results[3]), "2025-002898")
        self.assertEqual(self._get_co_catnum(results[4]), "000895679")
        self.assertEqual(self._get_co_catnum(results[5]), "000895678")
        self.assertEqual(self._get_co_catnum(results[6]), "000000898")

        # Make sure COTypes are always matched (except last one)
        for i in range(6):
            self.enforce_cot_matched(results[i])

        self.assertIsInstance(results[-1].toOne['collectionobjecttype'].record_result, NullRecord)

    def enforce_cot_matched(self, record_result: UploadResult):
        self.assertIsInstance(record_result.toOne['collectionobjecttype'].record_result, Matched)

    def _get_co_catnum(self, record_result: UploadResult):
        return Collectionobject.objects.get(
            # whatever, if this fails, we know we failed our test anyways
            id=int(str(record_result.get_id())),
            collection=self.collection
            ).catalognumber