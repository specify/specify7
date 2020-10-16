import json
from jsonschema import validate # type: ignore
from typing import List, Dict, Any, NamedTuple, Union

from .base import UploadTestsBase, get_table
from ..data import Uploaded, Matched, ParseFailures, CellIssue, FailedBusinessRule
from ..upload import do_upload, do_upload_csv
from ..upload_table import UploadTable
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
        self.assertTrue(plan.toOne['collectingevent'].is_one_to_one())

    def test_manytoone_parsing(self) -> None:
        json = self.plan(one_to_one=False)
        validate(json, schema)
        plan = parse_plan(self.collection, json)
        assert isinstance(plan, UploadTable)
        assert isinstance(plan.toOne['collectingevent'], UploadTable)
        self.assertFalse(plan.toOne['collectingevent'].is_one_to_one())

    def test_onetoone_uploading(self) -> None:
        plan = parse_plan(self.collection, self.plan(one_to_one=True))

        data = [
            dict(catno='0', sfn='1'),
            dict(catno='1', sfn='1'),
            dict(catno='2', sfn='2'),
            dict(catno='3', sfn='2'),
            dict(catno='4', sfn='2'),
        ]

        results = do_upload(self.collection, data, plan)
        ces = set()
        for r in results:
            assert isinstance(r.record_result, Uploaded)
            self.assertIsInstance(r.toOne['collectingevent'].record_result, Uploaded)
            ces.add(get_table('Collectionobject').objects.get(id=r.record_result.get_id()).collectingevent_id)

        self.assertEqual(5, len(ces))



    def test_manytoone_uploading(self) -> None:
        plan = parse_plan(self.collection, self.plan(one_to_one=False))

        data = [
            dict(catno='0', sfn='1'),
            dict(catno='1', sfn='1'),
            dict(catno='2', sfn='2'),
            dict(catno='3', sfn='2'),
            dict(catno='4', sfn='2'),
        ]

        results = do_upload(self.collection, data, plan)
        ces = set()
        for r, expected in zip(results, [Uploaded, Matched, Uploaded, Matched, Matched]):
            assert isinstance(r.record_result, Uploaded)
            self.assertIsInstance(r.toOne['collectingevent'].record_result, expected)
            ces.add(get_table('Collectionobject').objects.get(id=r.record_result.get_id()).collectingevent_id)

        self.assertEqual(2, len(ces))

