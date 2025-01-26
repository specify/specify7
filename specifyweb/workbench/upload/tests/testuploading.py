import csv
import io
from datetime import datetime
from decimal import Decimal
from uuid import uuid4

from jsonschema import validate  # type: ignore

from specifyweb.specify import auditcodes
from specifyweb.specify.auditlog import auditlog
from specifyweb.specify.tests.test_trees import TestTree
from specifyweb.specify.tree_extras import validate_tree_numbering
from specifyweb.specify.tests.test_trees import get_table
from specifyweb.workbench.upload.auditor import DEFAULT_AUDITOR_PROPS
from .base import UploadTestsBase
from ..parsing import filter_and_upload
from ..treerecord import TreeRecord, BoundTreeRecord, TreeDefItemWithParseResults
from ..upload import do_upload, do_upload_csv
from ..upload_plan_schema import schema, parse_plan, parse_column_options
from ..upload_result import (
    Uploaded,
    UploadResult,
    Matched,
    MatchedMultiple,
    NoMatch,
    FailedBusinessRule,
    ReportInfo,
    TreeInfo,
)
from ..upload_table import UploadTable
from ..uploadable import Auditor


class UploadTreeSetup(TestTree, UploadTestsBase):
    pass


class TreeMatchingTests(UploadTreeSetup):
    def setUp(self) -> None:
        super().setUp()

    def test_enforced_state(self) -> None:
        state = get_table("Geographytreedefitem").objects.get(name="State")
        state.isenforced = True
        state.save()

        plan_json = dict(
            baseTableName="Geography",
            uploadable={
                "treeRecord": dict(
                    ranks={
                        "County": "County",
                        "City": "City",
                    }
                )
            },
        )
        validate(plan_json, schema)
        plan = parse_plan(plan_json)
        data = [
            {"County": "Johnson", "City": "Olathe"},
            {"County": "Johnson", "City": "Olathe"},
        ]
        results = do_upload(self.collection, data, plan, self.agent.id)
        self.assertIsInstance(results[0].record_result, Uploaded)
        self.assertIsInstance(results[1].record_result, Matched)
        self.assertEqual(results[0].get_id(), results[1].get_id())
        for r in results:
            uploaded_state = (
                get_table("Geography").objects.get(id=r.get_id()).parent.parent
            )
            self.assertEqual(state.id, uploaded_state.definitionitem.id)
            self.assertEqual("Uploaded", uploaded_state.name)

    def test_enforced_county(self) -> None:
        state = get_table("Geographytreedefitem").objects.get(name="State")
        co = get_table("Geographytreedefitem").objects.get(name="County")
        co.isenforced = True
        co.save()

        plan_json = dict(
            baseTableName="Geography",
            uploadable={
                "treeRecord": dict(
                    ranks={
                        "State": "State",
                        "City": "City",
                    }
                )
            },
        )
        validate(plan_json, schema)
        plan = parse_plan(plan_json)
        data = [
            {"State": "Texas", "City": "Austin"},
            {"State": "Missouri", "City": "Columbia"},
        ]
        results = do_upload(self.collection, data, plan, self.agent.id)
        self.assertEqual(
            results[0].record_result,
            FailedBusinessRule(
                message="missingRequiredTreeParent",
                payload={"names": ["County"]},
                info=ReportInfo(tableName="Geography", columns=["City"], treeInfo=None),
            ),
        )
        self.assertEqual(
            results[1].record_result,
            FailedBusinessRule(
                message="missingRequiredTreeParent",
                payload={"names": ["County"]},
                info=ReportInfo(tableName="Geography", columns=["City"], treeInfo=None),
            ),
        )

    def test_match_skip_level(self) -> None:
        plan_json = dict(
            baseTableName="Geography",
            uploadable={
                "treeRecord": dict(
                    ranks={
                        "State": "State",
                        "City": "City",
                    }
                )
            },
        )
        validate(plan_json, schema)
        plan = parse_plan(plan_json)
        data = [
            {"State": "Missouri", "City": "Springfield"},
            {"State": "Illinois", "City": "Springfield"},
        ]
        results = do_upload(self.collection, data, plan, self.agent.id)
        for r in results:
            self.assertIsInstance(r.record_result, Matched)
        self.assertEqual(self.springmo.id, results[0].record_result.get_id())
        self.assertEqual(self.springill.id, results[1].record_result.get_id())

    def test_match_multiple(self) -> None:
        plan_json = dict(
            baseTableName="Geography",
            uploadable={
                "treeRecord": dict(
                    ranks={
                        "City": "City",
                    }
                )
            },
        )
        validate(plan_json, schema)
        plan = parse_plan(plan_json)
        data = [
            {"City": "Springfield"},
            {"City": "Springfield"},
        ]
        results = do_upload(self.collection, data, plan, self.agent.id)
        for r in results:
            assert isinstance(r.record_result, MatchedMultiple)
            self.assertEqual(
                set([self.springmo.id, self.springill.id]), set(r.record_result.ids)
            )

    def test_match_higher(self) -> None:
        plan_json = dict(
            baseTableName="Geography",
            uploadable={
                "treeRecord": dict(
                    ranks={
                        "State": "State",
                        "County": "County",
                        "City": "City",
                    }
                )
            },
        )
        validate(plan_json, schema)
        plan = parse_plan(plan_json)
        data = [
            {"State": "Missouri", "County": "Greene", "City": "Springfield"},
        ]
        results = do_upload(self.collection, data, plan, self.agent.id)
        for r in results:
            assert isinstance(r.record_result, Matched)
            self.assertEqual(self.springmo.id, r.record_result.id)

    def test_match_uploaded(self) -> None:
        plan_json = dict(
            baseTableName="Geography",
            uploadable={
                "treeRecord": dict(
                    ranks={
                        "County": "County",
                        "City": "City",
                    }
                )
            },
        )
        validate(plan_json, schema)
        plan = parse_plan(plan_json)
        data = [
            {"County": "Johnson", "City": "Olathe"},
            {"County": "Johnson", "City": "Olathe"},
        ]
        results = do_upload(self.collection, data, plan, self.agent.id)
        self.assertIsInstance(results[0].record_result, Uploaded)
        self.assertIsInstance(results[1].record_result, Matched)
        self.assertEqual(results[0].get_id(), results[1].get_id())
        self.assertEqual(
            results[0].toOne["parent"].toOne["parent"].record_result.info.treeInfo.rank,
            "Planet",
        )

    def test_match_uploaded_just_enforced(self) -> None:
        country = self.geographytreedef.treedefitems.get(name="Country")
        country.isenforced = True
        country.save()

        plan_json = dict(
            baseTableName="Geography",
            uploadable={
                "treeRecord": dict(
                    ranks={
                        "County": "County",
                        "City": "City",
                    }
                )
            },
        )
        validate(plan_json, schema)
        plan = parse_plan(plan_json)
        data = [
            {"County": "Johnson", "City": "Olathe"},
            {"County": "Shawnee", "City": "Topeka"},
        ]
        results = do_upload(self.collection, data, plan, self.agent.id)
        self.assertIsInstance(results[0].record_result, Uploaded)
        self.assertIsInstance(results[1].record_result, Uploaded)

        self.assertIsInstance(
            results[0].toOne["parent"].toOne["parent"].record_result, Uploaded
        )
        self.assertEqual(
            results[0].toOne["parent"].toOne["parent"].record_result.info.treeInfo,
            ("Country", "Uploaded"),
        )
        self.assertEqual(
            results[0].toOne["parent"].toOne["parent"].record_result.info.treeInfo,
            ("Country", "Uploaded"),
        )

        self.assertIsInstance(
            results[1].toOne["parent"].toOne["parent"].record_result, Matched
        )
        self.assertEqual(
            results[1].toOne["parent"].toOne["parent"].get_id(),
            results[0].toOne["parent"].toOne["parent"].get_id(),
        )

    def test_upload_partial_match(self) -> None:
        plan_json = dict(
            baseTableName="Geography",
            uploadable={
                "treeRecord": dict(
                    ranks={
                        "State": "State",
                        "County": "County",
                        "City": "City",
                    }
                )
            },
        )
        validate(plan_json, schema)
        plan = parse_plan(plan_json)
        data = [
            {"State": "Missouri", "County": "Greene", "City": "Rogersville"},
        ]
        results = do_upload(self.collection, data, plan, self.agent.id)
        self.assertIsInstance(results[0].record_result, Uploaded)
        self.assertEqual(
            self.greene.id,
            get_table("Geography").objects.get(id=results[0].get_id()).parent_id,
        )


class OneToOneAttributeTests(UploadTestsBase):

    def test_attachmentimageattribute(self) -> None:
        plan = UploadTable(
            name="Attachment",
            wbcols={"guid": parse_column_options("guid")},
            overrideScope=None,
            static={},
            toMany={},
            toOne={
                "attachmentimageattribute": UploadTable(
                    name="Attachmentimageattribute",
                    wbcols={"height": parse_column_options("height")},
                    overrideScope=None,
                    static={},
                    toOne={},
                    toMany={},
                )
            },
        )
        data = [
            {"guid": str(uuid4()), "height": "100"},
            {"guid": str(uuid4()), "height": "100"},
            {"guid": str(uuid4()), "height": "100"},
            {"guid": str(uuid4()), "height": "200"},
        ]
        results = do_upload(self.collection, data, plan, self.agent.id)
        for r in results:
            self.assertIsInstance(r.record_result, Uploaded)
        aias = [
            get_table("Attachment")
            .objects.get(id=r.get_id())
            .attachmentimageattribute_id
            for r in results
        ]
        self.assertEqual(
            len(aias), len(set(aias)), "The attachment image attributes are not shared."
        )

    def test_collectingtripattribute(self) -> None:
        plan = UploadTable(
            name="Collectingtrip",
            wbcols={"collectingtripname": parse_column_options("guid")},
            overrideScope=None,
            static={},
            toMany={},
            toOne={
                "collectingtripattribute": UploadTable(
                    name="Collectingtripattribute",
                    wbcols={"integer1": parse_column_options("integer")},
                    overrideScope=None,
                    static={},
                    toOne={},
                    toMany={},
                )
            },
        )
        data = [
            {"guid": str(uuid4()), "integer": "100"},
            {"guid": str(uuid4()), "integer": "100"},
            {"guid": str(uuid4()), "integer": "100"},
            {"guid": str(uuid4()), "integer": "200"},
        ]
        results = do_upload(self.collection, data, plan, self.agent.id)
        for r in results:
            self.assertIsInstance(r.record_result, Uploaded)
        ctas = [
            get_table("Collectingtrip")
            .objects.get(id=r.get_id())
            .collectingtripattribute_id
            for r in results
        ]
        self.assertEqual(
            len(ctas), len(set(ctas)), "The collecting trip attributes are not shared."
        )

    def test_preparationattribute(self) -> None:
        plan = UploadTable(
            name="Preparation",
            wbcols={"guid": parse_column_options("guid")},
            overrideScope=None,
            static={},
            toMany={},
            toOne={
                "preptype": UploadTable(
                    name="Preptype",
                    wbcols={"name": parse_column_options("preptype")},
                    overrideScope=None,
                    static={},
                    toOne={},
                    toMany={},
                ),
                "preparationattribute": UploadTable(
                    name="Preparationattribute",
                    wbcols={"number1": parse_column_options("integer")},
                    overrideScope=None,
                    static={},
                    toOne={},
                    toMany={},
                ),
                "collectionobject": UploadTable(
                    name="Collectionobject",
                    wbcols={"catalognumber": parse_column_options("catno")},
                    overrideScope=None,
                    static={},
                    toOne={},
                    toMany={},
                ),
            },
        )
        data = [
            {
                "guid": str(uuid4()),
                "integer": "100",
                "catno": "1",
                "preptype": "tissue",
            },
            {
                "guid": str(uuid4()),
                "integer": "100",
                "catno": "1",
                "preptype": "tissue",
            },
            {
                "guid": str(uuid4()),
                "integer": "100",
                "catno": "1",
                "preptype": "tissue",
            },
            {
                "guid": str(uuid4()),
                "integer": "200",
                "catno": "1",
                "preptype": "tissue",
            },
        ]
        results = do_upload(self.collection, data, plan, self.agent.id)
        for r in results:
            self.assertIsInstance(r.record_result, Uploaded)
        pas = [
            get_table("Preparation").objects.get(id=r.get_id()).preparationattribute_id
            for r in results
        ]
        self.assertTrue(
            all(pa is not None for pa in pas), "All prep attributes got created."
        )
        self.assertEqual(len(data), len(pas), "Each prep gets a prep attribute.")
        self.assertEqual(
            len(pas), len(set(pas)), "The preparation attributes are not shared."
        )

    def test_collectionobjectattribute(self) -> None:
        plan = UploadTable(
            name="Collectionobject",
            wbcols={"catalognumber": parse_column_options("catno")},
            overrideScope=None,
            static={},
            toMany={},
            toOne={
                "collectionobjectattribute": UploadTable(
                    name="Collectionobjectattribute",
                    wbcols={"number1": parse_column_options("number")},
                    overrideScope=None,
                    static={},
                    toOne={},
                    toMany={},
                )
            },
        )
        data = [
            {"catno": "1", "number": "100"},
            {"catno": "2", "number": "100"},
            {"catno": "3", "number": "100"},
            {"catno": "4", "number": "200"},
        ]
        results = do_upload(self.collection, data, plan, self.agent.id)
        for r in results:
            self.assertIsInstance(r.record_result, Uploaded)
        coas = [
            get_table("Collectionobject")
            .objects.get(id=r.get_id())
            .collectionobjectattribute_id
            for r in results
        ]
        self.assertTrue(
            all(coa is not None for coa in coas), "All the COAs were created."
        )
        self.assertEqual(
            len(data), len(coas), "Each collection object gets an attribute row."
        )
        self.assertEqual(
            len(coas),
            len(set(coas)),
            "The collection object attributes are not shared.",
        )

    def test_collectingeventattribute(self) -> None:
        plan = UploadTable(
            name="Collectingevent",
            wbcols={"stationfieldnumber": parse_column_options("sfn")},
            overrideScope=None,
            static={},
            toMany={},
            toOne={
                "collectingeventattribute": UploadTable(
                    name="Collectingeventattribute",
                    wbcols={"number1": parse_column_options("number")},
                    overrideScope=None,
                    static={},
                    toOne={},
                    toMany={},
                )
            },
        )
        data = [
            {"sfn": "1", "number": "100"},
            {"sfn": "2", "number": "100"},
            {"sfn": "3", "number": "100"},
            {"sfn": "4", "number": "200"},
        ]
        results = do_upload(self.collection, data, plan, self.agent.id)
        for r in results:
            self.assertIsInstance(r.record_result, Uploaded)
        ceas = [
            get_table("Collectingevent")
            .objects.get(id=r.get_id())
            .collectingeventattribute_id
            for r in results
        ]
        self.assertEqual(
            len(ceas), len(set(ceas)), "The collecting event attributes are not shared."
        )

    def test_null_ce_with_ambiguous_collectingeventattribute(self) -> None:
        get_table("Collectingevent").objects.all().delete()

        get_table("Collectingevent").objects.create(
            discipline=self.discipline,
            collectingeventattribute=get_table(
                "Collectingeventattribute"
            ).objects.create(discipline=self.discipline, number1=100),
        )
        get_table("Collectingevent").objects.create(
            discipline=self.discipline,
            collectingeventattribute=get_table(
                "Collectingeventattribute"
            ).objects.create(discipline=self.discipline, number1=100),
        )

        plan = UploadTable(
            name="Collectingevent",
            wbcols={"stationfieldnumber": parse_column_options("sfn")},
            static={},
            toMany={},
            toOne={
                "collectingeventattribute": UploadTable(
                    name="Collectingeventattribute",
                    wbcols={"number1": parse_column_options("number")},
                    static={},
                    toOne={},
                    toMany={},
                )
            },
        )
        data = [
            {"sfn": "", "number": "100"},
        ]
        results = do_upload(self.collection, data, plan, self.agent.id)
        for r in results:
            self.assertIsInstance(r.record_result, MatchedMultiple)

    def test_ambiguous_one_to_one_match(self) -> None:
        get_table("Collectingevent").objects.all().delete()

        for sfn, number in [("1", "100"), ("1", "200"), ("2", "100"), ("2", "200")]:
            get_table("Collectingevent").objects.create(
                stationfieldnumber=sfn,
                discipline=self.discipline,
                collectingeventattribute=get_table(
                    "Collectingeventattribute"
                ).objects.create(discipline=self.discipline, number1=number),
            )

        plan = UploadTable(
            name="Collectingevent",
            wbcols={"stationfieldnumber": parse_column_options("sfn")},
            overrideScope=None,
            static={},
            toMany={},
            toOne={
                "collectingeventattribute": UploadTable(
                    name="Collectingeventattribute",
                    wbcols={"number1": parse_column_options("number")},
                    static={},
                    toOne={},
                    toMany={},
                )
            },
        )
        data = [
            {"sfn": "1", "number": "100"},
        ]
        results = do_upload(self.collection, data, plan, self.agent.id)
        for r in results:
            self.assertIsInstance(r.record_result, Matched)

    def test_null_record_with_ambiguous_one_to_one(self) -> None:
        plan = UploadTable(
            name="Collectionobject",
            wbcols={"catalognumber": parse_column_options("catno")},
            overrideScope=None,
            static={},
            toMany={},
            toOne={
                "collectionobjectattribute": UploadTable(
                    name="Collectionobjectattribute",
                    wbcols={"number1": parse_column_options("number")},
                    overrideScope=None,
                    static={},
                    toOne={},
                    toMany={},
                )
            },
        )
        data = [
            {"catno": "1", "number": "100"},
            {"catno": "2", "number": "100"},
            {"catno": "", "number": "100"},
        ]
        results = do_upload(self.collection, data, plan, self.agent.id)
        for r in results:
            self.assertIsInstance(r.record_result, Uploaded)
        coas = [
            get_table("Collectionobject")
            .objects.get(id=r.get_id())
            .collectionobjectattribute_id
            for r in results
        ]
        self.assertEqual(
            len(coas),
            len(set(coas)),
            "The collection object attributes are not shared.",
        )


class UploadTests(UploadTestsBase):

    def test_determination_default_iscurrent(self) -> None:
        plan_json = {
            "baseTableName": "collectionobject",
            "uploadable": {
                "uploadTable": {
                    "wbcols": {
                        "catalognumber": "Catno",
                    },
                    "static": {},
                    "toOne": {},
                    "toMany": {
                        "determinations": [
                            {
                                "wbcols": {},
                                "static": {},
                                "toOne": {
                                    "taxon": {
                                        "treeRecord": {
                                            "ranks": {
                                                "Genus": {
                                                    "treeNodeCols": {"name": "Genus"}
                                                },
                                                "Species": {
                                                    "treeNodeCols": {"name": "Species"}
                                                },
                                            }
                                        }
                                    }
                                },
                            }
                        ],
                    },
                }
            },
        }

        validate(plan_json, schema)
        plan = parse_plan(plan_json)
        data = [
            {"Catno": "1", "Genus": "Foo", "Species": "Bar"},
            {"Catno": "2", "Genus": "Foo", "Species": "Bar"},
            {"Catno": "3", "Genus": "Foo", "Species": "Bar"},
        ]
        results = do_upload(self.collection, data, plan, self.agent.id)
        dets = [
            get_table("Collectionobject")
            .objects.get(id=r.get_id())
            .determinations.get()
            for r in results
        ]
        self.assertTrue(
            all(d.iscurrent for d in dets),
            "created determinations have iscurrent = true by default",
        )

    def test_determination_override_iscurrent(self) -> None:
        plan_json = {
            "baseTableName": "collectionobject",
            "uploadable": {
                "uploadTable": {
                    "wbcols": {
                        "catalognumber": "Catno",
                    },
                    "static": {},
                    "toOne": {},
                    "toMany": {
                        "determinations": [
                            {
                                "wbcols": {"iscurrent": "iscurrent"},
                                "static": {},
                                "toOne": {
                                    "taxon": {
                                        "treeRecord": {
                                            "ranks": {
                                                "Genus": {
                                                    "treeNodeCols": {"name": "Genus"}
                                                },
                                                "Species": {
                                                    "treeNodeCols": {"name": "Species"}
                                                },
                                            }
                                        }
                                    }
                                },
                            }
                        ],
                    },
                }
            },
        }

        validate(plan_json, schema)
        plan = parse_plan(plan_json)
        data = [
            {"Catno": "1", "Genus": "Foo", "Species": "Bar", "iscurrent": "false"},
            {"Catno": "2", "Genus": "Foo", "Species": "Bar", "iscurrent": "false"},
            {"Catno": "3", "Genus": "Foo", "Species": "Bar", "iscurrent": "false"},
        ]
        results = do_upload(self.collection, data, plan, self.agent.id)
        dets = [
            get_table("Collectionobject")
            .objects.get(id=r.get_id())
            .determinations.get()
            for r in results
        ]
        self.assertFalse(
            any(d.iscurrent for d in dets),
            "created determinations have iscurrent = false by override",
        )

    def test_ordernumber(self) -> None:
        plan = UploadTable(
            name="Referencework",
            wbcols={"title": parse_column_options("title")},
            overrideScope=None,
            static={"referenceworktype": 0},
            toOne={},
            toMany={
                "authors": [
                    UploadTable(
                        name="Author",
                        wbcols={},
                        static={},
                        toOne={
                            "agent": UploadTable(
                                name="Agent",
                                wbcols={"lastname": parse_column_options("author1")},
                                overrideScope=None,
                                static={},
                                toOne={},
                                toMany={},
                            )
                        },
                        toMany={},
                    ),
                    UploadTable(
                        name="Author",
                        wbcols={},
                        static={},
                        toOne={
                            "agent": UploadTable(
                                name="Agent",
                                wbcols={"lastname": parse_column_options("author2")},
                                overrideScope=None,
                                static={},
                                toOne={},
                                toMany={},
                            )
                        },
                        toMany={},
                    ),
                ]
            },
        )
        data = [
            {
                "title": "A Natural History of Mung Beans",
                "author1": "Philomungus",
                "author2": "Mungophilius",
            },
            {
                "title": "A Natural History of Mung Beans",
                "author1": "Mungophilius",
                "author2": "Philomungus",
            },
            {
                "title": "A Natural History of Mung Beans",
                "author1": "Philomungus",
                "author2": "Mungophilius",
            },
        ]
        results = do_upload(self.collection, data, plan, self.agent.id)
        self.assertIsInstance(results[0].record_result, Uploaded)
        self.assertIsInstance(
            results[1].record_result,
            Uploaded,
            "The previous record should not be matched b/c the authors are in a different order.",
        )
        self.assertIsInstance(
            results[2].record_result,
            Matched,
            "The previous record should be matched b/c the authors are in the same order.",
        )

    def test_no_override_ordernumber(self) -> None:
        plan = UploadTable(
            name="Referencework",
            wbcols={"title": parse_column_options("title")},
            overrideScope=None,
            static={"referenceworktype": 0},
            toOne={},
            toMany={
                "authors": [
                    UploadTable(
                        name="Author",
                        wbcols={"ordernumber": parse_column_options("on1")},
                        static={},
                        toOne={
                            "agent": UploadTable(
                                name="Agent",
                                wbcols={"lastname": parse_column_options("author1")},
                                overrideScope=None,
                                static={},
                                toOne={},
                                toMany={},
                            )
                        },
                        toMany={},
                    ),
                    UploadTable(
                        name="Author",
                        wbcols={"ordernumber": parse_column_options("on2")},
                        static={},
                        toOne={
                            "agent": UploadTable(
                                name="Agent",
                                wbcols={"lastname": parse_column_options("author2")},
                                static={},
                                toOne={},
                                toMany={},
                            )
                        },
                        toMany={},
                    ),
                ]
            },
        )
        data = [
            {
                "title": "A Natural History of Mung Beans",
                "author1": "Philomungus",
                "on1": "0",
                "author2": "Mungophilius",
                "on2": "1",
            },
            {
                "title": "A Natural History of Mung Beans",
                "author1": "Mungophilius",
                "on1": "1",
                "author2": "Philomungus",
                "on2": "0",
            },
            {
                "title": "A Natural History of Mung Beans",
                "author1": "Philomungus",
                "on1": "0",
                "author2": "Mungophilius",
                "on2": "1",
            },
        ]
        results = do_upload(self.collection, data, plan, self.agent.id)
        self.assertIsInstance(results[0].record_result, Uploaded)
        self.assertIsInstance(
            results[1].record_result,
            Uploaded,
            "The previous record should not be matched b/c the authors are in a different order.",
        )
        self.assertIsInstance(
            results[2].record_result,
            Matched,
            "The previous record should be matched b/c the authors are in the same order.",
        )

    #     @skip("outdated")
    #     def test_filter_to_many_single(self) -> None:
    #         reader = csv.DictReader(io.StringIO(
    # '''BMSM No.,Class,Superfamily,Family,Genus,Subgenus,Species,Subspecies,Species Author,Subspecies Author,Who ID First Name,Determiner 1 Title,Determiner 1 First Name,Determiner 1 Middle Initial,Determiner 1 Last Name,ID Date Verbatim,ID Date,ID Status,Country,State/Prov/Pref,Region,Site,Sea Basin,Continent/Ocean,Date Collected,Start Date Collected,End Date Collected,Collection Method,Verbatim Collecting method,No. of Specimens,Live?,W/Operc,Lot Description,Prep Type 1,- Paired valves,for bivalves - Single valves,Habitat,Min Depth (M),Max Depth (M),Fossil?,Stratum,Sex / Age,Lot Status,Accession No.,Original Label,Remarks,Processed by,Cataloged by,DateCataloged,Latitude1,Latitude2,Longitude1,Longitude2,Lat Long Type,Station No.,Checked by,Label Printed,Not for publication on Web,Realm,Estimated,Collected Verbatim,Collector 1 Title,Collector 1 First Name,Collector 1 Middle Initial,Collector 1 Last Name,Collector 2 Title,Collector 2 First Name,Collector 2 Middle Initial,Collector 2 Last name,Collector 3 Title,Collector 3 First Name,Collector 3 Middle Initial,Collector 3 Last Name,Collector 4 Title,Collector 4 First Name,Collector 4 Middle Initial,Collector 4 Last Name
    # 5033,Gastropoda,Stromboidea,Strombidae,Lobatus,,leidyi,,"(Heilprin, 1887)",,,,,,, , ,,USA,FLORIDA,Hendry Co.,"Cochran Pit, N of Rt. 80, W of LaBelle",,North America,8/9/1973,8/9/1973,,,,8,0,0,Dry; shell,Dry,,,,,,1,"Caloosahatchee,Pinecrest Unit #4",U/Juv,,241,,,LWD,MJP,12/11/1997,26° 44.099' N,,81° 29.027' W,,Point,,,12/08/2016,0,Marine,0,M. Buffington,,M.,,Buffington,,,,,,,,,,,,
    # '''))
    #         row = next(reader)
    #         assert isinstance(self.example_plan_scoped.toOne['collectingevent'], ScopedUploadTable)
    #         uploadable = self.example_plan_scoped.toOne['collectingevent'].bind(self.collection, row, self.agent.id, Auditor(self.collection, auditlog))
    #         assert isinstance(uploadable, BoundUploadTable)
    #         filters, excludes = _to_many_filters_and_excludes(uploadable.toMany)
    #         self.assertEqual([{
    #             'collectors__agent__agenttype': 1,
    #             'collectors__agent__firstname': 'M.',
    #             'collectors__agent__lastname': 'Buffington',
    #             'collectors__agent__middleinitial': None,
    #             'collectors__agent__title': None,
    #             'collectors__agent__division_id': self.division.id,
    #             'collectors__division_id': self.division.id,
    #             'collectors__isprimary': True,
    #             'collectors__ordernumber': 0}], filters)

    #         self.assertEqual(
    #             excludes,
    #             [Exclude(lookup='collectors__in', table='Collector', filter={'isprimary': False, 'ordernumber': 1, 'division_id': self.division.id})])

    #     def test_filter_multiple_to_many(self) -> None:
    #         reader = csv.DictReader(io.StringIO(
    # '''BMSM No.,Class,Superfamily,Family,Genus,Subgenus,Species,Subspecies,Species Author,Subspecies Author,Who ID First Name,Determiner 1 Title,Determiner 1 First Name,Determiner 1 Middle Initial,Determiner 1 Last Name,ID Date Verbatim,ID Date,ID Status,Country,State/Prov/Pref,Region,Site,Sea Basin,Continent/Ocean,Date Collected,Start Date Collected,End Date Collected,Collection Method,Verbatim Collecting method,No. of Specimens,Live?,W/Operc,Lot Description,Prep Type 1,- Paired valves,for bivalves - Single valves,Habitat,Min Depth (M),Max Depth (M),Fossil?,Stratum,Sex / Age,Lot Status,Accession No.,Original Label,Remarks,Processed by,Cataloged by,DateCataloged,Latitude1,Latitude2,Longitude1,Longitude2,Lat Long Type,Station No.,Checked by,Label Printed,Not for publication on Web,Realm,Estimated,Collected Verbatim,Collector 1 Title,Collector 1 First Name,Collector 1 Middle Initial,Collector 1 Last Name,Collector 2 Title,Collector 2 First Name,Collector 2 Middle Initial,Collector 2 Last name,Collector 3 Title,Collector 3 First Name,Collector 3 Middle Initial,Collector 3 Last Name,Collector 4 Title,Collector 4 First Name,Collector 4 Middle Initial,Collector 4 Last Name
    # 1378,Gastropoda,Rissooidea,Rissoinidae,Rissoina,,delicatissima,,"Raines, 2002",,B. Raines,,B.,,Raines,Nov 2003,11/2003,,CHILE,,Easter Island [= Isla de Pascua],"Off Punta Rosalia, E of Anakena",,SE Pacific O.,Apr 1998,04/1998,,,,2,0,0,Dry; shell,Dry,,,In sand at base of cliffs,10,20,0,,,Paratype,512,," PARATYPES.  In pouch no. 1, paratypes 4 & 5.  Raines, B.K. 2002.  La Conchiglia 34 ( no. 304) : 16 (holotype LACM 2934, Fig. 9).",JSG,MJP,07/01/2004,"27° 04' 18"" S",,109° 19' 45' W,,Point,,JSG,23/12/2014,0,Marine,0,B. Raines and M. Taylor,,B.,,Raines,,M.,,Taylor,,,,,,,,
    # '''))
    #         row = next(reader)
    #         assert isinstance(self.example_plan_scoped.toOne['collectingevent'], ScopedUploadTable)
    #         uploadable = self.example_plan_scoped.toOne['collectingevent'].bind(self.collection, row, self.agent.id, Auditor(self.collection, auditlog))
    #         assert isinstance(uploadable, BoundUploadTable)
    #         filters, excludes = _to_many_filters_and_excludes(uploadable.toMany)
    #         self.assertEqual([
    #             {'collectors__agent__agenttype': 1,
    #              'collectors__agent__firstname': 'B.',
    #              'collectors__agent__lastname': 'Raines',
    #              'collectors__agent__middleinitial': None,
    #              'collectors__agent__title': None,
    #              'collectors__agent__division_id': self.division.id,
    #              'collectors__division_id': self.division.id,
    #              'collectors__isprimary': True,
    #              'collectors__ordernumber': 0},
    #             {'collectors__agent__agenttype': 1,
    #              'collectors__agent__firstname': 'M.',
    #              'collectors__agent__lastname': 'Taylor',
    #              'collectors__agent__middleinitial': None,
    #              'collectors__agent__title': None,
    #              'collectors__agent__division_id': self.division.id,
    #              'collectors__division_id': self.division.id,
    #              'collectors__isprimary': False,
    #              'collectors__ordernumber': 1}], filters)

    #         self.assertEqual(excludes, [])

    def test_big(self) -> None:
        reader = csv.DictReader(
            io.StringIO(
                """BMSM No.,Class,Superfamily,Family,Genus,Subgenus,Species,Subspecies,Species Author,Subspecies Author,Who ID First Name,Determiner 1 Title,Determiner 1 First Name,Determiner 1 Middle Initial,Determiner 1 Last Name,ID Date Verbatim,ID Date,ID Status,Country,State/Prov/Pref,Region,Site,Sea Basin,Continent/Ocean,Date Collected,Start Date Collected,End Date Collected,Collection Method,Verbatim Collecting method,No. of Specimens,Live?,W/Operc,Lot Description,Prep Type 1,- Paired valves,for bivalves - Single valves,Habitat,Min Depth (M),Max Depth (M),Fossil?,Stratum,Sex / Age,Lot Status,Accession No.,Original Label,Remarks,Processed by,Cataloged by,DateCataloged,Latitude1,Latitude2,Longitude1,Longitude2,Lat Long Type,Station No.,Checked by,Label Printed,Not for publication on Web,Realm,Estimated,Collected Verbatim,Collector 1 Title,Collector 1 First Name,Collector 1 Middle Initial,Collector 1 Last Name,Collector 2 Title,Collector 2 First Name,Collector 2 Middle Initial,Collector 2 Last name,Collector 3 Title,Collector 3 First Name,Collector 3 Middle Initial,Collector 3 Last Name,Collector 4 Title,Collector 4 First Name,Collector 4 Middle Initial,Collector 4 Last Name
1365,Gastropoda,Fissurelloidea,Fissurellidae,Diodora,,meta,,"(Ihering, 1927)",,,,,,, , ,,USA,LOUISIANA,,[Lat-long site],Gulf of Mexico,NW Atlantic O.,Date unk'n,,,,,6,0,0,Dry; shell,Dry,,,,71,74,0,,,,313,,Dredged,JSG,MJP,22/01/2003,28° 03.44' N,,92° 26.98' W,,Point,,JSG,19/06/2003,0,Marine,0,Emilio Garcia,,Emilio,,Garcia,,,,,,,,,,,,
1366,Gastropoda,Fissurelloidea,Fissurellidae,Emarginula,,phrixodes,,"Dall, 1927",,,,,,, , ,,USA,LOUISIANA,,[Lat-long site],Gulf of Mexico,NW Atlantic O.,Date unk'n,,,,,3,0,0,Dry; shell,Dry,,,In coral rubble,57,65,0,,,,313,,,JSG,MJP,22/01/2003,28° 06.07' N,,91° 02.42' W,,Point,D-7(1),JSG,19/06/2003,0,Marine,0,Emilio Garcia,,Emilio,,Garcia,,,,,,,,,,,,
1367,Gastropoda,Fissurelloidea,Fissurellidae,Emarginula,,sicula,,"J.E. Gray, 1825",,,,,,, , ,,USA,LOUISIANA,,[Lat-long site],Gulf of Mexico,NW Atlantic O.,Date unk'n,,,,,1,0,0,Dry; shell,Dry,,,In coral rubble,57,65,0,,,,313,,,JSG,MJP,22/01/2003,28° 06.07' N,,91° 02.42' W,,Point,D-7(1),JSG,19/06/2003,0,Marine,0,Emilio Garcia,,Emilio,,Garcia,,,,,,,,,,,,
1368,Gastropoda,Fissurelloidea,Fissurellidae,Emarginula,,tuberculosa,,"Libassi, 1859",,Emilio Garcia,,Emilio,,Garcia,Jan 2002,00/01/2002,,USA,LOUISIANA,off Louisiana coast,[Lat-long site],Gulf of Mexico,NW Atlantic O.,Date unk'n,,,,,11,0,0,Dry; shell,Dry,,,"Subtidal 65-91 m, in coralline [sand]",65,91,0,,,,313,,Dredged.  Original label no. 23331.,JSG,MJP,22/01/2003,27° 59.14' N,,91° 38.83' W,,Point,D-4(1),JSG,19/06/2003,0,Marine,0,Emilio Garcia,,Emilio,,Garcia,,,,,,,,,,,,
1373,Gastropoda,Fissurelloidea,Fissurellidae,Diodora,,meta,,"(Ihering, 1927)",,Emilio Garcia,,Emilio,,Garcia,Jan 2002,00/01/2002,,USA,LOUISIANA,off Louisiana coast,[Lat-long site],Gulf of Mexico,NW Atlantic O.,Date unk'n,,,,,4,0,0,Dry; shell,Dry,,,"Subtidal, offshore",55,65,0,,,,313,,"Taken at night, dredged.  Original label no. 19782",JSG,MJP,22/01/2003,27° 48.7' N,,93° 2.88' W,,Point,,JSG,19/06/2003,0,Marine,0,Emilio Garcia,,Emilio,,Garcia,,,,,,,,,,,,
1374,Gastropoda,Fissurelloidea,Fissurellidae,Diodora,,meta,,"(Ihering, 1927)",,Emilio Garcia,,Emilio,,Garcia,Jan 2002,00/01/2002,,USA,LOUISIANA,off Louisiana coast,[Lat-long site],Gulf of Mexico,NW Atlantic O.,Date unk'n,,,,,2,0,0,Dry; shell,Dry,,,"Subtidal, offshore, in coralline [sand]",,,0,,,,313,,Dredged. Original label no. 23337,JSG,MJP,22/01/2003,27° 59.1' N,,91° 38.8' W,,Point,,JSG,19/06/2003,0,Marine,0,Emilio Garcia,,Emilio,,Garcia,,,,,,,,,,,,
1375,Gastropoda,Fissurelloidea,Fissurellidae,Emarginula,,phrixodes,,"Dall, 1927",,Emilio Garcia,,Emilio,,Garcia,Jan 2002,00/01/2002,,USA,LOUISIANA,off Louisiana coast,[Lat-long site],Gulf of Mexico,NW Atlantic O.,Date unk'n,,,,,2,0,0,Dry; shell,Dry,,,"Subtidal, offshore",55,65,0,,,,313,,"Taken at night, dredged. Original label no. 19786.",JSG,MJP,22/01/2003,27° 48.7' N,,93° 2.88' W,,Point,,JSG,19/06/2003,0,Marine,0,Emilio Garcia,,Emilio,,Garcia,,,,,,,,,,,,
1378,Gastropoda,Rissooidea,Rissoinidae,Rissoina,,delicatissima,,"Raines, 2002",,B. Raines,,B.,,Raines,Nov 2003,11/2003,,CHILE,,Easter Island [= Isla de Pascua],"Off Punta Rosalia, E of Anakena",,SE Pacific O.,Apr 1998,04/1998,,,,2,0,0,Dry; shell,Dry,,,In sand at base of cliffs,10,20,0,,,Paratype,512,," PARATYPES.  In pouch no. 1, paratypes 4 & 5.  Raines, B.K. 2002.  La Conchiglia 34 ( no. 304) : 16 (holotype LACM 2934, Fig. 9).",JSG,MJP,07/01/2004,"27° 04' 18"" S",,109° 19' 45' W,,Point,,JSG,23/12/2014,0,Marine,0,B. Raines and M. Taylor,,B.,,Raines,,M.,,Taylor,,,,,,,,
1380,Gastropoda,Cerithioidea,Pickworthiidae,Clatrosansonia,,circumserrata,,"(Raines, 2002)",,,,,,,,,,CHILE,,Easter Island [= Isla de Pascua],"Off Hanga-Teo, on N. coast",,SE Pacific O.,Dec 2000,00/12/2000,,,,1,0,0,Dry; shell,Dry,,,"Subtidal, in silty mud in a cave",15,,0,,,Paratype,512,,"PARATYPE. In pouch # 3, paratype # 3. Raines, B.K. 2002.  La Conchiglia 34 ( no 304); 18-19 (holotype LACM 2938, fig 13).",JSG,MJP,07/01/2004,27° 03' 37'' S,,109° 21' 58' W,,Point,,JSG,02/02/2017,0,Marine,0,B. Raines,,B.,,Raines,,,,,,,,,,,,
1381,Gastropoda,Velutinoidea,Triviidae,Hespererato,,rehderi,,"(Raines, 2002)",,,,,,,,,,CHILE,,Easter Island [= Isla de Pascua],"Off Punta Rosalia, E of Anakean",,SE Pacific O.,Apr 1998,04/1998,,,,1,0,0,Dry; shell,Dry,,,"In sand, along base of cliff",10,20,0,,,Paratype,512,,"PARATYPE. In pouch # 4 paratype # 3.  Dead collected in sand along base of cliffs.  Informally (in litt.. 28 Nov 2003) Raines expressed intent to reclassify species in genus `Hespererato' Raines, B.K. 2002.  La Conchiglia 34 (no. 304); 22-23 (holotype LAC",JSG,MJP,07/01/2004,"27° 04' 18"" S",,"109° 19' 45"" W",,Point,,JSG,08/03/2017,0,Marine,0,B. Raines and M. Taylor,,B.,,Raines,,M.,,Taylor,,,,,,,,
1382,Gastropoda,Buccinoidea,Columbellidae,Zafra,,rapanuiensis,,"Raines, 2002",,B. Raines,,B.,,Raines,Nov 2003,11/2003,,CHILE,,Easter Island [= Isla de Pascua],"Off Punta Rosalia, E of Anakean",,SE Pacific O.,Apr 1998,04/1998,,,,1,0,0,Dry; shell,Dry,,,"In sand, along base of cliff",10,20,0,,,Paratype,512,,"PARATYPE. In pouch # 5, paratype #3. La Conchiglia 34 (no. 304): 24-25 (holotype LACM 2942, fig 23.",JSG,MJP,07/01/2004,"27° 04' 18"" S",,"109° 19' 45"" W",,Point,,JSG,22/04/2008,0,Marine,0,B. Raines and M. Taylor,,B.,,Raines,,M.,,Taylor,,,,,,,,
1383,Scaphopoda,,Gadilidae,Dischides,,splendens,,"Raines, 2002",,,,,,, , ,,CHILE,,Atacama region,Near Tahai,,SE Pacific O.,Dec 2000,00/12/2000,,,,2,0,0,Dry; shell,Dry,,,In sandy mud,50,80,0,,,Paratype,512,,"PARATYPE. In pouch # 6, paratypes 4 & 5.  Dredged. La Conchiglia 34 (no. 304): 37-38 (holotype LACM 2949, fig 47).",JSG,MJP,07/01/2004,"27° 07' 20"" S",,"109° 26' 30"" W",,Point,,JSG,16/05/2013,0,Marine,0,B. Raines,,B.,,Raines,,,,,,,,,,,,
1384,Gastropoda,Acteonoidea,Acteonidae,Pupa,,pascuana,,"Raines, 2003",,B. Raines,,B.,,Raines,Nov 2003,11/2003,,CHILE,,Atacama region,Near Tahai,,SE Pacific O.,Dec 2000,00/12/2000,,,,2,0,0,Dry; shell,Dry,,,In fine sand,30,50,0,,,Paratype,512,,"PARATYPE. In pouch # 7, paratype 1 [ 2 specimens deposited, but letter & paper mention only one paratype for BMSM]. Dredged. La Conchiglia 34 (no. 305: 51-53 (holotype LACM 2954, figs 1,2).",JSG,MJP,07/01/2004,"27° 07' 20"" S",,"109° 26' 30"" W",,Point,,JSG,16/05/2013,0,Marine,0,B. Raines,,B.,,Raines,,,,,,,,,,,,
1385,Gastropoda,Vanikoroidea,Eulimidae,Sticteulima,,plenicolora,,"Raines, 2003",,B. Raines,,B.,,Raines,Nov 2003,11/2003,,CHILE,,Easter Island [= Isla de Pascua],Hanga Nui,,SE Pacific O.,Apr 1998,04/1998,,,,2,0,0,Dry; shell,Dry,,,"In sand, in tidepools",0,,0,,,Paratype,512,,"PARATYPE. In pouch # 8, paratypes 4 & 5.  Taken in sand collected from tidepools. La Conchiglia 34 (no. 305): 43-46 (holotype LACM 2955, fig 3).",JSG,MJP,07/01/2004,"27° 07' 46"" S",,"109° 16' 35"" W",,Point,,JSG,16/05/2013,0,Marine,0,B. Raines and M. Taylor,,B.,,Raines,,M.,,Taylor,,,,,,,,
1386,Gastropoda,Vanikoroidea,Eulimidae,Subniso,,osorioae,,"Raines, 2003",,B. Raines,,B.,,Raines,Nov 2003,11/2003,,CHILE,,Easter Island [= Isla de Pascua],"Off Punta Rosalia, E of Anakena",,SE Pacific O.,Apr 1998,04/1998,,,,2,0,0,Dry; shell,Dry,,,"In sand & rubble, along base of cliffs",10,20,0,,,Paratype,512,,"PARATYPES. In pouch # 9, paratypes 4 & 5.  La Conchiglia 34 (no. 305): 46-47 (holotype LACM 2957, fig. 5a, b).",JSG,MJP,07/01/2004,"27° 04' 18"" S",,"109° 19' 45"" W",,Point,,JSG,28/05/2013,0,Marine,0,B. Raines,,B.,,Raines,,,,,,,,,,,,
1387,Gastropoda,Vanikoroidea,Eulimidae,Hemiliostraca,,clarimaculosa,,"(Raines, 2003)",,B. Raines,,B.,,Raines,Nov 2003,11/2003,cf.,CHILE,,Easter Island [= Isla de Pascua],"Off Punta Rosalia, E pf Anakena",,SE Pacific O.,Apr 1998,04/1998,,,,2,0,0,Dry; shell,Dry,,,"In sand & rubble, along base of cliffs",10,20,0,,,Paratype,512,,"PARATYPES. In pouch # 10, paratypes 4 & 5.  La Conchiglia 34 (no. 305): 47-48 (holotype LACM 2959, fig. 6).",JSG,MJP,07/01/2004,"27° 04' 18"" S",,"109° 19' 45"" W",,Point,,JSG,12/01/2017,0,Marine,0,B. Raines,,B.,,Raines,,,,,,,,,,,,
1906,Gastropoda,Pleurotomarioidea,Pleurotomariidae,Perotrochus,,maureri,,"Harasewych & Askew, 1993",,,,,,, , ,,USA,SOUTH CAROLINA,,90 mi east of Charleston,,NW Atlantic O.,4/5/1987,4/5/1987,,,,1,1,0,Dry; shell,Dry,,,Deep water; water temperature 9.7° C,195,204,0,,,,461,,"Topotype, but no evidence that it is a paratype.  Received in exchange from U.S. Nat'l. Mus (1993) for a specimen from the BMSM that was taken off Jacksonville, FL, in 200 fms (366 m)",HEP,JSG,22/10/1997,"32° 43' 57"" N",,"78° 05' 41"" W",,Point,,,,0,Marine,0,Johnson Sealink (Submersible),,Johnson,,Sealink,,,,,,,,,,,,
5009,Gastropoda,Muricoidea,Volutidae,Scaphella,,floridana,,"(Heilprin, 1886)",,,,,,, , ,,USA,FLORIDA,Hendry Co.,"Cochran Pit, N of Rt. 80, W of LaBelle",,North America,1980,1980,,,,2,0,0,Dry; shell,Dry,,,,,,1,,U/Juv,,340,,Spoil banks.,LWD,MJP,12/11/1997,26° 44.099' N,,81° 29.027' W,,Point,,JHL,25/05/2016,0,Marine,0,M. Palmer,,M.,,Palmer,,,,,,,,,,,,
5033,Gastropoda,Stromboidea,Strombidae,Lobatus,,leidyi,,"(Heilprin, 1887)",,,,,,, , ,,USA,FLORIDA,Hendry Co.,"Cochran Pit, N of Rt. 80, W of LaBelle",,North America,8/9/1973,8/9/1973,,,,8,0,0,Dry; shell,Dry,,,,,,1,"Caloosahatchee,Pinecrest Unit #4",U/Juv,,241,,,LWD,MJP,12/11/1997,26° 44.099' N,,81° 29.027' W,,Point,,,12/08/2016,0,Marine,0,M. Buffington,,M.,,Buffington,,,,,,,,,,,,
5035,Gastropoda,Stromboidea,Strombidae,Lobatus,,leidyi,,"(Heilprin, 1887)",,,,,,, , ,,USA,FLORIDA,Hendry Co.,"Cochran Pit, N of Rt. 80, W of LaBelle",,North America,1971,1971,,,,4,0,0,Dry; shell,Dry,,,,,,1,,U/Ad & Juv,,241,,"3 Adults, 1 Juvenile",LWD,MJP,12/11/1997,26° 44.099' N,,81° 29.027' W,,Point,,,12/08/2016,0,Marine,0,M. Buffington,,M.,,Buffington,,,,,,,,,,,,
5043,Gastropoda,Stromboidea,Strombidae,Lobatus,,mayacensis,,"(Tucker & Wilson, 1933)",,D. Hargreave,,D.,,Hargreave, , ,aff.,USA,FLORIDA,Hendry Co.,"Cochran Pit, N of Rt. 80, W of LaBelle",,North America,1977,1977,,,,1,0,0,Dry; shell,Dry,,,,,,1,,,,241,,,LWD,MJP,12/11/1997,26° 44.099' N,,81° 29.027' W,,Point,,,12/08/2016,0,Marine,0,M. Buffington,,M.,,Buffington,,,,,,,,,,,,
5081,Gastropoda,Stromboidea,Strombidae,Strombus,,evergladesensis,,"Petuch, 1991",,D. Hargreave,,D.,,Hargreave, , ,,USA,FLORIDA,Hendry Co.,"Cochran Pit, N of Rt. 80, W of LaBelle",,North America,1977,1977,,,,1,0,0,Dry; shell,Dry,,,,,,1,,,,150,,Collected from 1977-1978.,LWD,MJP,03/12/1997,26° 44.099' N,,81° 29.027' W,,Point,,,18/06/2016,0,Marine,0,G. Moller,,G.,,Moller,,,,,,,,,,,,
5083,Gastropoda,Stromboidea,Strombidae,Strombus,,evergladesensis,,"Petuch, 1991",,D. Hargreave,,D.,,Hargreave, , ,cf.,USA,FLORIDA,Hendry Co.,"Cochran Pit, N of Rt. 80, W of LaBelle",,North America,Date unk'n,,,,,1,0,0,Dry; shell,Dry,,,,,,1,,,,23,,"ID uncertain, either 'evergladesensis' or 'sarasotaensis'",LWD,MJP,03/12/1997,26° 44.099' N,,81° 29.027' W,,Point,,,18/06/2016,0,Marine,0,L. Weddle,,L.,,Weddle,,,,,,,,,,,,
5091,Gastropoda,Muricoidea,Marginellidae,Prunum,,donovani,,"(Olsson, 1967)",,,,,,, , ,,USA,FLORIDA,Hendry Co.,"Cochran Pit, N of Rt. 80, W of LaBelle",,North America,Date unk'n,,,,,2,0,0,Dry; shell,Dry,,,,,,1,,,,150,,,LWD,MJP,03/12/1997,26° 44.099' N,,81° 29.027' W,,Point,,,25/10/2016,0,Marine,0,G. Moller,,G.,,Moller,,,,,,,,,,,,
5097,Gastropoda,Muricoidea,Marginellidae,Prunum,,onchidella,,"(Dall, 1890)",,,,,,,,,,USA,FLORIDA,Hendry Co.,"Cochran Pit, N of Route 80, W of LaBelle",,North America,1972,1972,,,,10,0,0,Dry; shell,Dry,,,,,,1,,,,241,,Taken from spoil from 1972-1975.,LWD,MJP,03/12/1997,26° 44.099' N,,81° 29.027' W,,Point,,,16/08/2016,0,Marine,0,M. Buffington,,M.,,Buffington,,,,,,,,,,,,
"""
            )
        )
        upload_results = do_upload_csv(
            self.collection, reader, self.example_plan, self.agent.id
        )
        uploaded_catnos = []
        for r in upload_results:
            self.assertIsInstance(r.record_result, Uploaded)
            co = get_table("Collectionobject").objects.get(id=r.record_result.get_id())
            self.assertEqual(self.agent, co.createdbyagent)
            self.assertIsNotNone(co.timestampcreated)
            self.assertEqual(0, co.version)
            uploaded_catnos.append(co.catalognumber)

        # Check that collection objects were uploaded.
        expected_cats = [
            n.zfill(9)
            for n in "1365 1366 1367 1368 1373 1374 1375 1378 1380 1381 1382 1383 1384 1385 1386 1387 1906 5009 5033 5035 5043 5081 5083 5091 5097".split()
        ]
        self.assertEqual(uploaded_catnos, expected_cats)

        cos = get_table("Collectionobject").objects.filter(
            catalognumber__in=expected_cats
        )
        self.assertEqual(cos.count(), len(expected_cats))

        # Check that new collection objects are in the audit log.
        for co in cos:
            co_entries = get_table("Spauditlog").objects.filter(
                recordid=co.id,
                tablenum=get_table("Collectionobject").specify_model.tableId,
            )
            self.assertEqual(1, co_entries.count())
            self.assertEqual(auditcodes.INSERT, co_entries[0].action)
            self.assertEqual(self.agent.id, co_entries[0].createdbyagent_id)

            ce_entries = get_table("Spauditlog").objects.filter(
                recordid=co.collectingevent.id,
                tablenum=get_table("Collectingevent").specify_model.tableId,
            )
            self.assertEqual(1, ce_entries.count())
            self.assertEqual(auditcodes.INSERT, ce_entries[0].action)
            self.assertEqual(self.agent.id, ce_entries[0].createdbyagent_id)

            loc_entries = get_table("Spauditlog").objects.filter(
                recordid=co.collectingevent.locality.id,
                tablenum=get_table("Locality").specify_model.tableId,
            )
            self.assertEqual(1, loc_entries.count())
            self.assertEqual(auditcodes.INSERT, loc_entries[0].action)
            self.assertEqual(self.agent.id, loc_entries[0].createdbyagent_id)

            geo = co.collectingevent.locality.geography
            while geo is not None:
                geo_entries = get_table("Spauditlog").objects.filter(
                    recordid=geo.id,
                    tablenum=get_table("Geography").specify_model.tableId,
                )
                self.assertEqual(1, geo_entries.count())
                self.assertEqual(auditcodes.INSERT, geo_entries[0].action)
                self.assertEqual(self.agent.id, geo_entries[0].createdbyagent_id)
                geo = geo.parent

        # Check that only one copy of a given agent/collectingevent was uploaded.
        self.assertEqual(
            get_table("Agent").objects.filter(lastname="Garcia").count(), 1
        )
        self.assertEqual(
            get_table("Collectingevent")
            .objects.filter(stationfieldnumber="D-7(1)")
            .count(),
            1,
        )

        # Check which collectingevents got uploaded for some cases.
        self.assertEqual(
            get_table("Collectionobject")
            .objects.get(catalognumber="000001365")
            .collectingevent.stationfieldnumber,
            None,
        )
        self.assertEqual(
            set(
                ce.stationfieldnumber
                for ce in get_table("Collectingevent").objects.filter(
                    collectors__agent__lastname="Garcia"
                )
            ),
            set([None, "D-7(1)", "D-4(1)"]),
        )

        # Check the collectors for some collection objects.
        self.assertEqual(
            [
                c.agent.lastname
                for c in get_table("Collectionobject")
                .objects.get(catalognumber="000001378")
                .collectingevent.collectors.order_by("ordernumber")
            ],
            ["Raines", "Taylor"],
        )

        self.assertEqual(
            [
                c.agent.lastname
                for c in get_table("Collectionobject")
                .objects.get(catalognumber="000001380")
                .collectingevent.collectors.order_by("ordernumber")
            ],
            ["Raines"],
        )

        self.assertEqual(
            set(
                co.collectingevent.collectors.get(ordernumber=0).agent.lastname
                for co in cos
            ),
            set(
                (
                    "Raines",
                    "Palmer",
                    "Weddle",
                    "Buffington",
                    "Garcia",
                    "Sealink",
                    "Moller",
                )
            ),
        )

        # Check that localities got uploaded.
        self.assertEqual(
            set(
                (l.localityname, l.latitude1, l.lat1text, l.longitude1, l.long1text)
                for l in [co.collectingevent.locality for co in cos]
            ),
            set(
                [
                    (
                        "Off Hanga-Teo, on N. coast",
                        Decimal("-27.0602777778"),
                        "27° 03' 37'' S",
                        Decimal("-109.3661111111"),
                        "109° 21' 58' W",
                    ),
                    (
                        "[Lat-long site]",
                        Decimal("27.8116666667"),
                        "27° 48.7' N",
                        Decimal("-93.0480000000"),
                        "93° 2.88' W",
                    ),
                    (
                        "Off Punta Rosalia, E pf Anakena",
                        Decimal("-27.0716666667"),
                        "27° 04' 18\" S",
                        Decimal("-109.3291666667"),
                        "109° 19' 45\" W",
                    ),
                    (
                        "[Lat-long site]",
                        Decimal("28.1011666667"),
                        "28° 06.07' N",
                        Decimal("-91.0403333333"),
                        "91° 02.42' W",
                    ),
                    (
                        "Off Punta Rosalia, E of Anakean",
                        Decimal("-27.0716666667"),
                        "27° 04' 18\" S",
                        Decimal("-109.3291666667"),
                        "109° 19' 45\" W",
                    ),
                    (
                        "Near Tahai",
                        Decimal("-27.1222222222"),
                        "27° 07' 20\" S",
                        Decimal("-109.4416666667"),
                        "109° 26' 30\" W",
                    ),
                    (
                        "90 mi east of Charleston",
                        Decimal("32.7325000000"),
                        "32° 43' 57\" N",
                        Decimal("-78.0947222222"),
                        "78° 05' 41\" W",
                    ),
                    (
                        "Hanga Nui",
                        Decimal("-27.1294444444"),
                        "27° 07' 46\" S",
                        Decimal("-109.2763888889"),
                        "109° 16' 35\" W",
                    ),
                    (
                        "[Lat-long site]",
                        Decimal("27.9850000000"),
                        "27° 59.1' N",
                        Decimal("-91.6466666667"),
                        "91° 38.8' W",
                    ),
                    (
                        "Cochran Pit, N of Rt. 80, W of LaBelle",
                        Decimal("26.7349833333"),
                        "26° 44.099' N",
                        Decimal("-81.4837833333"),
                        "81° 29.027' W",
                    ),
                    (
                        "Off Punta Rosalia, E of Anakena",
                        Decimal("-27.0716666667"),
                        "27° 04' 18\" S",
                        Decimal("-109.3291666667"),
                        "109° 19' 45\" W",
                    ),
                    (
                        "[Lat-long site]",
                        Decimal("27.9856666667"),
                        "27° 59.14' N",
                        Decimal("-91.6471666667"),
                        "91° 38.83' W",
                    ),
                    (
                        "Off Punta Rosalia, E of Anakena",
                        Decimal("-27.0716666667"),
                        "27° 04' 18\" S",
                        Decimal("-109.3291666667"),
                        "109° 19' 45' W",
                    ),
                    (
                        "[Lat-long site]",
                        Decimal("28.0573333333"),
                        "28° 03.44' N",
                        Decimal("-92.4496666667"),
                        "92° 26.98' W",
                    ),
                    (
                        "Cochran Pit, N of Route 80, W of LaBelle",
                        Decimal("26.7349833333"),
                        "26° 44.099' N",
                        Decimal("-81.4837833333"),
                        "81° 29.027' W",
                    ),
                ]
            ),
        )

        # Check that taxa got uploaded without dupes.
        self.assertEqual(
            get_table("Taxon").objects.get(definitionitem__name="Taxonomy Root").name,
            "Uploaded",
        )

        self.assertEqual(
            sorted(
                t.name
                for t in get_table("Taxon").objects.filter(definitionitem__name="Class")
            ),
            "Gastropoda Scaphopoda".split(),
        )

        self.assertEqual(
            sorted(
                t.name
                for t in get_table("Taxon").objects.filter(
                    definitionitem__name="Superfamily"
                )
            ),
            """Acteonoidea Buccinoidea Cerithioidea Fissurelloidea Muricoidea Pleurotomarioidea Rissooidea Stromboidea Vanikoroidea Velutinoidea""".split(),
        )

        # Check the determination of a specific collectionobject.
        det = (
            get_table("Collectionobject")
            .objects.get(catalognumber="000005081")
            .determinations.get()
        )
        self.assertEqual(det.determineddate, None)

        self.assertEqual(
            (det.taxon.name, det.taxon.author, det.taxon.definitionitem.name),
            ("evergladesensis", "Petuch, 1991", "Species"),
        )
        self.assertEqual(
            (det.taxon.parent.name, det.taxon.parent.definitionitem.name),
            ("Strombus", "Genus"),
        )
        self.assertEqual(
            (det.taxon.parent.parent.name, det.taxon.parent.parent.definitionitem.name),
            ("Strombidae", "Family"),
        )
        self.assertEqual(
            (
                det.taxon.parent.parent.parent.name,
                det.taxon.parent.parent.parent.definitionitem.name,
            ),
            ("Stromboidea", "Superfamily"),
        )
        self.assertEqual(
            (
                det.taxon.parent.parent.parent.parent.name,
                det.taxon.parent.parent.parent.parent.definitionitem.name,
            ),
            ("Gastropoda", "Class"),
        )
        self.assertEqual(
            (
                det.taxon.parent.parent.parent.parent.parent.name,
                det.taxon.parent.parent.parent.parent.parent.definitionitem.name,
            ),
            ("Uploaded", "Taxonomy Root"),
        )

        # Check some determination dates.
        self.assertEqual(
            set(co.determinations.get().determineddate for co in cos),
            set((None, datetime(2003, 11, 1, 0, 0), datetime(2002, 1, 1, 0, 0))),
        )
        self.assertEqual(
            set(co.determinations.get().determineddateprecision for co in cos),
            set((None, 2)),
        )

        # Check some collectingevent dates.
        self.assertEqual(
            get_table("Collectionobject")
            .objects.get(catalognumber="000001906")
            .collectingevent.startdate,
            datetime(1987, 5, 4, 0, 0),
        )
        self.assertEqual(
            get_table("Collectionobject")
            .objects.get(catalognumber="000001906")
            .collectingevent.startdateprecision,
            1,
        )  # full

        self.assertEqual(
            get_table("Collectionobject")
            .objects.get(catalognumber="000005009")
            .collectingevent.startdate,
            datetime(1980, 1, 1, 0, 0),
        )
        self.assertEqual(
            get_table("Collectionobject")
            .objects.get(catalognumber="000005009")
            .collectingevent.startdateprecision,
            3,
        )  # year

        self.assertEqual(
            get_table("Collectionobject")
            .objects.get(catalognumber="000001378")
            .collectingevent.startdate,
            datetime(1998, 4, 1, 0, 0),
        )
        self.assertEqual(
            get_table("Collectionobject")
            .objects.get(catalognumber="000001378")
            .collectingevent.startdateprecision,
            2,
        )  # month

        # Check that trees are valid.
        for tree in ("taxon", "geography", "geologictimeperiod", "lithostrat"):
            validate_tree_numbering(tree)
            self.assertEqual(
                0, get_table(tree).objects.filter(fullname__isnull=True).count()
            )

    def test_tree_1(self) -> None:
        reader = csv.DictReader(
            io.StringIO(
                """BMSM No.,Class,Superfamily,Family,Genus,Subgenus,Species,Subspecies,Species Author,Subspecies Author,Who ID First Name,Determiner 1 Title,Determiner 1 First Name,Determiner 1 Middle Initial,Determiner 1 Last Name,ID Date Verbatim,ID Date,ID Status,Country,State/Prov/Pref,Region,Site,Sea Basin,Continent/Ocean,Date Collected,Start Date Collected,End Date Collected,Collection Method,Verbatim Collecting method,No. of Specimens,Live?,W/Operc,Lot Description,Prep Type 1,- Paired valves,for bivalves - Single valves,Habitat,Min Depth (M),Max Depth (M),Fossil?,Stratum,Sex / Age,Lot Status,Accession No.,Original Label,Remarks,Processed by,Cataloged by,DateCataloged,Latitude1,Latitude2,Longitude1,Longitude2,Lat Long Type,Station No.,Checked by,Label Printed,Not for publication on Web,Realm,Estimated,Collected Verbatim,Collector 1 Title,Collector 1 First Name,Collector 1 Middle Initial,Collector 1 Last Name,Collector 2 Title,Collector 2 First Name,Collector 2 Middle Initial,Collector 2 Last name,Collector 3 Title,Collector 3 First Name,Collector 3 Middle Initial,Collector 3 Last Name,Collector 4 Title,Collector 4 First Name,Collector 4 Middle Initial,Collector 4 Last Name
5033,Gastropoda,Stromboidea,Strombidae,Lobatus,,leidyi,,"(Heilprin, 1887)",,,,,,, , ,,USA,FLORIDA,Hendry Co.,"Cochran Pit, N of Rt. 80, W of LaBelle",,North America,8 Sep 1973,8 Sep 1973,,,,8,0,0,Dry; shell,Dry,,,,,,1,"Caloosahatchee,Pinecrest Unit #4",U/Juv,,241,,,LWD,MJP,12/11/1997,26° 44.099' N,,81° 29.027' W,,Point,,,12/08/2016,0,Marine,0,M. Buffington,,M.,,Buffington,,,,,,,,,,,,
"""
            )
        )
        tree_record = TreeRecord(
            name="Geography",
            ranks={
                "Continent": {"name": parse_column_options("Continent/Ocean")},
                "Country": {"name": parse_column_options("Country")},
                "State": {"name": parse_column_options("State/Prov/Pref")},
                "County": {"name": parse_column_options("Region")},
            },
        ).apply_scoping(self.collection)
        row = next(reader)
        bt = tree_record.bind(
            row, None, Auditor(self.collection, DEFAULT_AUDITOR_PROPS, auditlog)
        )
        assert isinstance(bt, BoundTreeRecord)
        to_upload, matched = bt._match(bt._to_match())

        self.assertEqual(
            to_upload,
            [
                # TreeDefItemWithParseResults(get_table('Geographytreedefitem').objects.get(name="Planet"), [filter_and_upload({'name': "Uploaded"}, "")]),
                TreeDefItemWithParseResults(
                    get_table("Geographytreedefitem").objects.get(name="Continent"),
                    [filter_and_upload({"name": "North America"}, "Continent/Ocean")],
                ),
                TreeDefItemWithParseResults(
                    get_table("Geographytreedefitem").objects.get(name="Country"),
                    [filter_and_upload({"name": "USA"}, "Country")],
                ),
                TreeDefItemWithParseResults(
                    get_table("Geographytreedefitem").objects.get(name="State"),
                    [filter_and_upload({"name": "FLORIDA"}, "State/Prov/Pref")],
                ),
                TreeDefItemWithParseResults(
                    get_table("Geographytreedefitem").objects.get(name="County"),
                    [filter_and_upload({"name": "Hendry Co."}, "Region")],
                ),
            ],
        )

        self.assertIsInstance(matched, NoMatch)

        planet = get_table("Geography").objects.create(
            name="Uploaded",
            definitionitem=get_table("Geographytreedefitem").objects.get(name="Planet"),
            definition=self.geographytreedef,
        )

        continent = get_table("Geography").objects.create(
            name="North America",
            definitionitem=get_table("Geographytreedefitem").objects.get(
                name="Continent"
            ),
            definition=self.geographytreedef,
            parent=planet,
        )

        country = get_table("Geography").objects.create(
            name="USA",
            definitionitem=get_table("Geographytreedefitem").objects.get(
                name="Country"
            ),
            definition=self.geographytreedef,
            parent=continent,
        )

        state = get_table("Geography").objects.create(
            name="Florida",
            definitionitem=get_table("Geographytreedefitem").objects.get(name="State"),
            definition=self.geographytreedef,
            parent=country,
        )

        # The following should be created by the upload:
        # county = get_table('Geography').objects.create(
        #     name="Hendry Co.",
        #     definitionitem=get_table('Geographytreedefitem').objects.get(name="County"),
        #     definition=self.geographytreedef,
        #     parent=state,
        # )

        bt = tree_record.bind(
            row, None, Auditor(self.collection, DEFAULT_AUDITOR_PROPS, None)
        )
        assert isinstance(bt, BoundTreeRecord)
        to_upload, matched = bt._match(bt._to_match())
        self.assertEqual(
            to_upload,
            [
                TreeDefItemWithParseResults(
                    get_table("Geographytreedefitem").objects.get(name="County"),
                    [filter_and_upload({"name": "Hendry Co."}, "Region")],
                )
            ],
        )
        assert isinstance(matched, Matched)
        self.assertEqual(state.id, matched.id)
        self.assertEqual(
            set(["State/Prov/Pref", "Country", "Continent/Ocean"]),
            set(matched.info.columns),
        )

        bt = tree_record.bind(
            row, None, Auditor(self.collection, DEFAULT_AUDITOR_PROPS, None)
        )
        assert isinstance(bt, BoundTreeRecord)
        upload_result = bt.process_row()
        self.assertIsInstance(upload_result.record_result, Uploaded)

        uploaded = get_table("Geography").objects.get(id=upload_result.get_id())
        self.assertEqual(uploaded.name, "Hendry Co.")
        self.assertEqual(uploaded.definitionitem.name, "County")
        self.assertEqual(uploaded.parent.id, state.id)

        bt = tree_record.bind(
            row, None, Auditor(self.collection, DEFAULT_AUDITOR_PROPS, None)
        )
        assert isinstance(bt, BoundTreeRecord)
        to_upload, matched = bt._match(bt._to_match())
        self.assertEqual([], to_upload)
        assert isinstance(matched, Matched)
        self.assertEqual(uploaded.id, matched.id)
        self.assertEqual(
            set(["Region", "State/Prov/Pref", "Country", "Continent/Ocean"]),
            set(matched.info.columns),
        )

        bt = tree_record.bind(
            row, None, Auditor(self.collection, DEFAULT_AUDITOR_PROPS, None)
        )
        assert isinstance(bt, BoundTreeRecord)
        upload_result = bt.process_row()
        expected_info = ReportInfo(
            tableName="Geography",
            columns=[
                "Continent/Ocean",
                "Country",
                "State/Prov/Pref",
                "Region",
            ],
            treeInfo=TreeInfo("County", "Hendry Co."),
        )
        self.assertEqual(
            upload_result,
            UploadResult(Matched(id=uploaded.id, info=expected_info), {}, {}),
        )

    def test_rollback_bad_rows(self) -> None:
        reader = csv.DictReader(
            io.StringIO(
                """BMSM No.,Class,Superfamily,Family,Genus,Subgenus,Species,Subspecies,Species Author,Subspecies Author,Who ID First Name,Determiner 1 Title,Determiner 1 First Name,Determiner 1 Middle Initial,Determiner 1 Last Name,ID Date Verbatim,ID Date,ID Status,Country,State/Prov/Pref,Region,Site,Sea Basin,Continent/Ocean,Date Collected,Start Date Collected,End Date Collected,Collection Method,Verbatim Collecting method,No. of Specimens,Live?,W/Operc,Lot Description,Prep Type 1,- Paired valves,for bivalves - Single valves,Habitat,Min Depth (M),Max Depth (M),Fossil?,Stratum,Sex / Age,Lot Status,Accession No.,Original Label,Remarks,Processed by,Cataloged by,DateCataloged,Latitude1,Latitude2,Longitude1,Longitude2,Lat Long Type,Station No.,Checked by,Label Printed,Not for publication on Web,Realm,Estimated,Collected Verbatim,Collector 1 Title,Collector 1 First Name,Collector 1 Middle Initial,Collector 1 Last Name,Collector 2 Title,Collector 2 First Name,Collector 2 Middle Initial,Collector 2 Last name,Collector 3 Title,Collector 3 First Name,Collector 3 Middle Initial,Collector 3 Last Name,Collector 4 Title,Collector 4 First Name,Collector 4 Middle Initial,Collector 4 Last Name
1365,Gastropoda,Fissurelloidea,Fissurellidae,Diodora,,meta,,"(Ihering, 1927)",,,,,,, , ,,USA,LOUISIANA,,[Lat-long site],Gulf of Mexico,NW Atlantic O.,Date unk'n,,,,,6,0,0,Dry; shell,Dry,,,,71,74,0,,,,313,,Dredged,JSG,MJP,22/01/2003,28° 03.44' N,,92° 26.98' W,,Point,,JSG,19/06/2003,0,Marine,0,Emilio Garcia,,Emilio,,Garcia,,,,,,,,,,,,
1366,Gastropoda,Fissurelloidea,Fissurellidae,Emarginula,,phrixodes,,"Dall, 1927",,,,,,, , ,,USA,LOUISIANA,,[Lat-long site],Gulf of Mexico,NW Atlantic O.,Date unk'n,,,,,3,0,0,Dry; shell,Dry,,,In coral rubble,57,65,0,,,,313,,,JSG,MJP,22/01/2003,28° 06.07' N,,91° 02.42' W,,Point,D-7(1),JSG,19/06/2003,0,Marine,0,Emilio Garcia,,Emilio,,Garcia,,,,,,,,,,,,
1365,Gastropoda,Fissurelloidea,Fissurellidae,Emarginula,,sicula,,"J.E. Gray, 1825",,,,,,, , ,,USA,Foobar,,[Lat-long site],Gulf of Mexico,NW Atlantic O.,Date unk'n,,,,,1,0,0,Dry; shell,Dry,,,In coral rubble,57,65,0,,,,313,,,JSG,MJP,22/01/2003,28° 06.07' N,,91° 02.42' W,,Point,D-7(1),JSG,19/06/2003,0,Marine,0,Emilio Garcia,,Emilio,,Garcia,,,,,,,,,,,,
1368,Gastropoda,Fissurelloidea,Fissurellidae,Emarginula,,tuberculosa,,"Libassi, 1859",,Emilio Garcia,,Emilio,,Garcia,Jan 2002,00/01/2002,,USA,LOUISIANA,off Louisiana coast,[Lat-long site],Gulf of Mexico,NW Atlantic O.,Date unk'n,,,,,11,0,0,Dry; shell,Dry,,,"Subtidal 65-91 m, in coralline [sand]",65,91,0,,,,313,,Dredged.  Original label no. 23331.,JSG,MJP,22/01/2003,27° 59.14' N,,91° 38.83' W,,Point,D-4(1),JSG,19/06/2003,0,Marine,0,Emilio Garcia,,Emilio,,Garcia,,,,,,,,,,,,
"""
            )
        )
        co_entries = get_table("Spauditlog").objects.filter(
            tablenum=get_table("Collectionobject").specify_model.tableId
        )
        self.assertEqual(
            0, co_entries.count(), "No collection objects in audit log yet."
        )

        upload_results = do_upload_csv(
            self.collection, reader, self.example_plan, self.agent.id
        )
        failed_result = upload_results[2]
        self.assertIsInstance(failed_result.record_result, FailedBusinessRule)
        for result in upload_results:
            if result is not failed_result:
                self.assertIsInstance(result.record_result, Uploaded)
                self.assertEqual(
                    1,
                    get_table("collectionobject")
                    .objects.filter(id=result.get_id())
                    .count(),
                )

        co_entries = get_table("Spauditlog").objects.filter(
            tablenum=get_table("Collectionobject").specify_model.tableId
        )
        self.assertEqual(
            3,
            co_entries.count(),
            "Three collection objects added to audit log. Four rows in data set but one rolled back.",
        )

        ce_result = failed_result.toOne["collectingevent"]
        self.assertIsInstance(ce_result.record_result, Uploaded)
        self.assertEqual(
            0,
            get_table("Collectingevent").objects.filter(id=ce_result.get_id()).count(),
        )

        loc_result = ce_result.toOne["locality"]
        self.assertIsInstance(loc_result.record_result, Uploaded)
        self.assertEqual(
            0, get_table("locality").objects.filter(id=loc_result.get_id()).count()
        )

        geo_result = loc_result.toOne["geography"]
        self.assertIsInstance(geo_result.record_result, Uploaded)
        self.assertEqual(
            0, get_table("geography").objects.filter(id=geo_result.get_id()).count()
        )

        collector_result = ce_result.toMany["collectors"][0]
        self.assertIsInstance(collector_result.record_result, Uploaded)
        self.assertEqual(
            0,
            get_table("collector").objects.filter(id=collector_result.get_id()).count(),
        )

    def test_disallow_partial(self) -> None:
        reader = csv.DictReader(
            io.StringIO(
                """BMSM No.,Class,Superfamily,Family,Genus,Subgenus,Species,Subspecies,Species Author,Subspecies Author,Who ID First Name,Determiner 1 Title,Determiner 1 First Name,Determiner 1 Middle Initial,Determiner 1 Last Name,ID Date Verbatim,ID Date,ID Status,Country,State/Prov/Pref,Region,Site,Sea Basin,Continent/Ocean,Date Collected,Start Date Collected,End Date Collected,Collection Method,Verbatim Collecting method,No. of Specimens,Live?,W/Operc,Lot Description,Prep Type 1,- Paired valves,for bivalves - Single valves,Habitat,Min Depth (M),Max Depth (M),Fossil?,Stratum,Sex / Age,Lot Status,Accession No.,Original Label,Remarks,Processed by,Cataloged by,DateCataloged,Latitude1,Latitude2,Longitude1,Longitude2,Lat Long Type,Station No.,Checked by,Label Printed,Not for publication on Web,Realm,Estimated,Collected Verbatim,Collector 1 Title,Collector 1 First Name,Collector 1 Middle Initial,Collector 1 Last Name,Collector 2 Title,Collector 2 First Name,Collector 2 Middle Initial,Collector 2 Last name,Collector 3 Title,Collector 3 First Name,Collector 3 Middle Initial,Collector 3 Last Name,Collector 4 Title,Collector 4 First Name,Collector 4 Middle Initial,Collector 4 Last Name
1365,Gastropoda,Fissurelloidea,Fissurellidae,Diodora,,meta,,"(Ihering, 1927)",,,,,,, , ,,USA,LOUISIANA,,[Lat-long site],Gulf of Mexico,NW Atlantic O.,Date unk'n,,,,,6,0,0,Dry; shell,Dry,,,,71,74,0,,,,313,,Dredged,JSG,MJP,22/01/2003,28° 03.44' N,,92° 26.98' W,,Point,,JSG,19/06/2003,0,Marine,0,Emilio Garcia,,Emilio,,Garcia,,,,,,,,,,,,
1366,Gastropoda,Fissurelloidea,Fissurellidae,Emarginula,,phrixodes,,"Dall, 1927",,,,,,, , ,,USA,LOUISIANA,,[Lat-long site],Gulf of Mexico,NW Atlantic O.,Date unk'n,,,,,3,0,0,Dry; shell,Dry,,,In coral rubble,57,65,0,,,,313,,,JSG,MJP,22/01/2003,28° 06.07' N,,91° 02.42' W,,Point,D-7(1),JSG,19/06/2003,0,Marine,0,Emilio Garcia,,Emilio,,Garcia,,,,,,,,,,,,
1365,Gastropoda,Fissurelloidea,Fissurellidae,Emarginula,,sicula,,"J.E. Gray, 1825",,,,,,, , ,,USA,Foobar,,[Lat-long site],Gulf of Mexico,NW Atlantic O.,Date unk'n,,,,,1,0,0,Dry; shell,Dry,,,In coral rubble,57,65,0,,,,313,,,JSG,MJP,22/01/2003,28° 06.07' N,,91° 02.42' W,,Point,D-7(1),JSG,19/06/2003,0,Marine,0,Emilio Garcia,,Emilio,,Garcia,,,,,,,,,,,,
1368,Gastropoda,Fissurelloidea,Fissurellidae,Emarginula,,tuberculosa,,"Libassi, 1859",,Emilio Garcia,,Emilio,,Garcia,Jan 2002,00/01/2002,,USA,LOUISIANA,off Louisiana coast,[Lat-long site],Gulf of Mexico,NW Atlantic O.,Date unk'n,,,,,11,0,0,Dry; shell,Dry,,,"Subtidal 65-91 m, in coralline [sand]",65,91,0,,,,313,,Dredged.  Original label no. 23331.,JSG,MJP,22/01/2003,27° 59.14' N,,91° 38.83' W,,Point,D-4(1),JSG,19/06/2003,0,Marine,0,Emilio Garcia,,Emilio,,Garcia,,,,,,,,,,,,
"""
            )
        )
        expect = [
            get_table("collectionobject").objects.count(),
            get_table("collectingevent").objects.count(),
            get_table("locality").objects.count(),
            get_table("geography").objects.count(),
            get_table("collector").objects.count(),
        ]

        upload_results = do_upload_csv(
            self.collection,
            reader,
            self.example_plan,
            self.agent.id,
            allow_partial=False,
        )
        failed_result = upload_results[2]
        self.assertIsInstance(failed_result.record_result, FailedBusinessRule)

        self.assertEqual(
            expect,
            [
                get_table("collectionobject").objects.count(),
                get_table("collectingevent").objects.count(),
                get_table("locality").objects.count(),
                get_table("geography").objects.count(),
                get_table("collector").objects.count(),
            ],
            "no new records",
        )
