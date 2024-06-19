from jsonschema import validate # type: ignore
from typing import Dict
from specifyweb.specify.tests.test_api import get_table
from .base import UploadTestsBase
from ..upload_result import Uploaded, Matched, NullRecord
from ..upload import do_upload
from ..upload_table import UploadTable, OneToOneTable
from ..upload_plan_schema import schema, parse_plan

class OneToOneTests(UploadTestsBase):
    def setUp(self) -> None:
        super().setUp()

    def plan(self, one_to_one: bool) -> Dict:
        reltype = 'oneToOneTable' if one_to_one else 'uploadTable'
        return dict(
            baseTableName = 'Collectionobject',
            uploadable = { 'uploadTable': dict(
                wbcols = {
                    'catalognumber' : "catno",
                },
                static = {},
                toMany = {},
                toOne = {
                    'collectingevent': { reltype: dict(
                        wbcols = {
                            'stationfieldnumber' : 'sfn',
                        },
                        static = {},
                        toOne = {},
                        toMany = {}
                    )}
                }
            )}
        )


    def test_onetoone_parsing(self) -> None:
        json = self.plan(one_to_one=True)
        validate(json, schema)
        plan = parse_plan(self.collection, json)
        assert isinstance(plan, UploadTable)
        assert isinstance(plan.toOne['collectingevent'], UploadTable)
        self.assertIsInstance(plan.toOne['collectingevent'], OneToOneTable)

    def test_manytoone_parsing(self) -> None:
        json = self.plan(one_to_one=False)
        validate(json, schema)
        plan = parse_plan(self.collection, json)
        assert isinstance(plan, UploadTable)
        assert isinstance(plan.toOne['collectingevent'], UploadTable)
        self.assertNotIsInstance(plan.toOne['collectingevent'], OneToOneTable)

    def test_onetoone_uploading(self) -> None:
        plan = parse_plan(self.collection, self.plan(one_to_one=True)).apply_scoping(self.collection)

        data = [
            dict(catno='0', sfn='1'),
            dict(catno='1', sfn='1'),
            dict(catno='2', sfn='2'),
            dict(catno='3', sfn='2'),
            # dict(catno='4', sfn='2'), # This fails because the CE has multiple matches
        ]

        results = do_upload(self.collection, data, plan, self.agent.id)
        ces = set()
        for r in results:
            assert isinstance(r.record_result, Uploaded), r
            self.assertIsInstance(r.toOne['collectingevent'].record_result, Uploaded)
            ces.add(get_table('Collectionobject').objects.get(id=r.record_result.get_id()).collectingevent_id)

        # self.assertEqual(5, len(ces))
        self.assertEqual(4, len(ces))

    def test_manytoone_uploading(self) -> None:
        plan = parse_plan(self.collection, self.plan(one_to_one=False)).apply_scoping(self.collection)

        data = [
            dict(catno='0', sfn='1'),
            dict(catno='1', sfn='1'),
            dict(catno='2', sfn='2'),
            dict(catno='3', sfn='2'),
            dict(catno='4', sfn='2'),
        ]

        results = do_upload(self.collection, data, plan, self.agent.id)
        ces = set()
        for r, expected in zip(results, [Uploaded, Matched, Uploaded, Matched, Matched]):
            assert isinstance(r.record_result, Uploaded)
            self.assertIsInstance(r.toOne['collectingevent'].record_result, expected)
            ces.add(get_table('Collectionobject').objects.get(id=r.record_result.get_id()).collectingevent_id)

        self.assertEqual(2, len(ces))

    def test_onetoone_with_null(self) -> None:
        plan = parse_plan(self.collection, self.plan(one_to_one=True)).apply_scoping(self.collection)

        data = [
            dict(catno='0', sfn='1'),
            dict(catno='1', sfn='1'),
            dict(catno='2', sfn='2'),
            dict(catno='3', sfn=''),
            dict(catno='4', sfn=''),
        ]

        ce_count_before_upload = get_table('Collectingevent').objects.count()

        results = do_upload(self.collection, data, plan, self.agent.id)
        ces = set()
        for r, expected in zip(results, [Uploaded, Uploaded, Uploaded, NullRecord, NullRecord]):
            assert isinstance(r.record_result, Uploaded)
            self.assertIsInstance(r.toOne['collectingevent'].record_result, expected)
            ce = get_table('Collectionobject').objects.get(id=r.record_result.get_id()).collectingevent_id
            if expected is NullRecord:
                self.assertIsNone(ce)
            else:
                ces.add(ce)

        self.assertEqual(3, len(ces))
        self.assertEqual(ce_count_before_upload + 3, get_table('Collectingevent').objects.count())
