import json
from jsonschema import validate # type: ignore
from typing import List, Dict, Any, NamedTuple, Union

from .base import UploadTestsBase, get_table
from ..data import Uploaded, Matched, NoMatch, ParseFailures, CellIssue, FailedBusinessRule
from ..upload import do_upload, do_upload_csv
from ..upload_table import UploadTable, MustMatchTable
from ..upload_plan_schema import schema, parse_plan

class MustMatchTests(UploadTestsBase):
    def setUp(self) -> None:
        super().setUp()

        get_table('Collectingevent').objects.create(
            stationfieldnumber='1',
            discipline=self.discipline,
        )

    def plan(self, must_match: bool) -> Dict:
        reltype = 'mustMatchTable' if must_match else 'uploadTable'
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


    def test_mustmatch_parsing(self) -> None:
        json = self.plan(must_match=True)
        validate(json, schema)
        plan = parse_plan(self.collection, json)
        assert isinstance(plan, UploadTable)
        assert isinstance(plan.toOne['collectingevent'], UploadTable)
        self.assertIsInstance(plan.toOne['collectingevent'], MustMatchTable)

    def test_mustmatch_uploading(self) -> None:
        plan = parse_plan(self.collection, self.plan(must_match=True))

        data = [
            dict(catno='0', sfn='1'),
            dict(catno='1', sfn='2'),
            dict(catno='2', sfn='1'),
            dict(catno='3', sfn='2'),
        ]

        starting_ce_count = get_table('Collectingevent').objects.count()

        results = do_upload(self.collection, data, plan)
        for r, expected in zip(results, [Matched, NoMatch, Matched, NoMatch]):
            assert isinstance(r.record_result, Uploaded)
            self.assertIsInstance(r.toOne['collectingevent'].record_result, expected)

        for r, expected_count in zip(results, [1, 0, 1, 0]):
            cos = get_table('Collectionobject').objects.filter(id=r.record_result.get_id())
            self.assertEqual(expected_count, cos.count())

        self.assertEqual(starting_ce_count, get_table('Collectingevent').objects.count(),
                         "there are an equal number of collecting events before and after the upload")
