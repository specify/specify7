from jsonschema import validate # type: ignore
from typing import Dict
from specifyweb.specify.tests.test_api import get_table
from .base import UploadTestsBase
from ..upload_result import Uploaded, Matched, NoMatch, NullRecord
from ..upload import do_upload
from ..upload_table import UploadTable, MustMatchTable
from ..treerecord import TreeRecord, MustMatchTreeRecord
from ..upload_plan_schema import schema, parse_plan


class MustMatchTests(UploadTestsBase):
    def setUp(self) -> None:
        super().setUp()

        get_table('Collectingevent').objects.create(
            stationfieldnumber='1',
            discipline=self.discipline,
        )


    def upload_some_geography(self) -> None:
        plan_json = dict(
            baseTableName = 'Geography',
            uploadable = { 'treeRecord': dict(
                ranks = {
                    'Continent': 'Continent',
                    'Country': 'Country',
                    'State': 'State',
                    'County': 'County',

                        }
            )}
        )
        validate(plan_json, schema)
        scoped_plan = parse_plan(self.collection, plan_json).apply_scoping(self.collection)
        data = [
            dict(name="Douglas Co. KS", Continent="North America", Country="USA", State="Kansas", County="Douglas"),
            dict(name="Greene Co. MO", Continent="North America", Country="USA", State="Missouri", County="Greene")
        ]
        results = do_upload(self.collection, data, scoped_plan, self.agent.id)
        for r in results:
            assert isinstance(r.record_result, Uploaded)


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

    def test_mustmatchtree(self) -> None:
        self.upload_some_geography()

        json = dict(
            baseTableName = 'Locality',
            uploadable = { 'uploadTable': dict(
                wbcols = {
                    'localityname' : "name",
                },
                static = {},
                toMany = {},
                toOne = {
                    'geography': { 'mustMatchTreeRecord': dict(
                        ranks = {
                            'Continent': 'Continent',
                            'Country': 'Country',
                            'State': 'State',
                            'County': 'County',

                        }
                    )}
                }
            )}
        )
        validate(json, schema)
        plan = parse_plan(self.collection, json)
        assert isinstance(plan, UploadTable)
        assert isinstance(plan.toOne['geography'], TreeRecord)
        assert isinstance(plan.toOne['geography'], MustMatchTreeRecord)

        scoped_plan = plan.apply_scoping(self.collection)

        data = [
            dict(name="Douglas Co. KS", Continent="North America", Country="USA", State="Kansas", County="Douglas"),
            dict(name="Emerald City", Continent="North America", Country="USA", State="Kansas", County="Oz"),
        ]
        results = do_upload(self.collection, data, scoped_plan, self.agent.id)
        self.assertIsInstance(results[0].record_result, Uploaded)
        self.assertNotIsInstance(results[1].record_result, Uploaded)
        self.assertIsInstance(results[1].toOne['geography'].record_result, NoMatch)

    def test_mustmatch_parsing(self) -> None:
        json = self.plan(must_match=True)
        validate(json, schema)
        plan = parse_plan(self.collection, json)
        assert isinstance(plan, UploadTable)
        assert isinstance(plan.toOne['collectingevent'], UploadTable)
        self.assertIsInstance(plan.toOne['collectingevent'], MustMatchTable)

    def test_mustmatch_uploading(self) -> None:
        plan = parse_plan(self.collection, self.plan(must_match=True)).apply_scoping(self.collection)

        data = [
            dict(catno='0', sfn='1'),
            dict(catno='1', sfn='2'),
            dict(catno='2', sfn='1'),
            dict(catno='3', sfn='2'),
        ]

        starting_ce_count = get_table('Collectingevent').objects.count()
        starting_co_count = get_table('Collectionobject').objects.count()

        results = do_upload(self.collection, data, plan, self.agent.id)
        for r, expected in zip(results, [Matched, NoMatch, Matched, NoMatch]):
            self.assertIsInstance(r.toOne['collectingevent'].record_result, expected)

        cos = get_table('Collectionobject').objects.count()
        self.assertEqual(starting_co_count + 2, cos, "Two collection objects were created")

        self.assertEqual(starting_ce_count, get_table('Collectingevent').objects.count(),
                         "there are an equal number of collecting events before and after the upload")

    def test_mustmatch_with_null(self) -> None:
        plan = parse_plan(self.collection, self.plan(must_match=True)).apply_scoping(self.collection)

        data = [
            dict(catno='0', sfn='1'),
            dict(catno='1', sfn='2'),
            dict(catno='2', sfn=''),
            dict(catno='3', sfn='1'),
            dict(catno='4', sfn='2'),
        ]

        ce_count_before_upload = get_table('Collectingevent').objects.count()

        results = do_upload(self.collection, data, plan, self.agent.id)
        ces = set()
        for r, expected in zip(results, [Matched, NoMatch, NullRecord, Matched, NoMatch]):
            self.assertIsInstance(r.toOne['collectingevent'].record_result, expected)
            if not r.contains_failure():
                ce = get_table('Collectionobject').objects.get(id=r.record_result.get_id()).collectingevent_id
                if expected is NullRecord:
                    self.assertIsNone(ce)
                else:
                    ces.add(ce)

        self.assertEqual(1, len(ces))
        self.assertEqual(ce_count_before_upload, get_table('Collectingevent').objects.count())
