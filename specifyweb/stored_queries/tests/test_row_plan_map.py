from unittest import TestCase

import json

from specifyweb.stored_queries.batch_edit import (
    BatchEditFieldPack,
    BatchEditPack,
    RowPlanMap,
)
from specifyweb.stored_queries.queryfield import fields_from_json

from specifyweb.stored_queries.tests.static.co_query_row_plan import row_plan_map


class TestRowPlanMaps(TestCase):

    def test_query_construction(self):
        query = json.load(open("specifyweb/stored_queries/tests/static/co_query.json"))
        query_fields = fields_from_json(query["fields"])
        visible_fields = [field for field in query_fields if field.display]
        row_plan = RowPlanMap.get_row_plan(visible_fields)
        plan, fields = row_plan.index_plan()
        self.assertEqual(plan, row_plan_map)

    def test_complicated_query_construction_filters(self):

        fields = [
            {
                "tablelist": "10",
                "stringid": "10.collectingevent.text4",
                "fieldname": "text4",
                "isrelfld": False,
                "sorttype": 0,
                "position": 0,
                "isdisplay": True,
                "operstart": 8,
                "startvalue": "",
                "isnot": False,
            },
            {
                "tablelist": "10,30-collectors",
                "stringid": "10,30-collectors.collector.isPrimary",
                "fieldname": "isPrimary",
                "isrelfld": False,
                "sorttype": 0,
                "position": 1,
                "isdisplay": True,
                "operstart": 6,
                "startvalue": "",
                "isnot": False,
            },
            {
                "tablelist": "10,1-collectionObjects",
                "stringid": "10,1-collectionObjects.collectionobject.catalogNumber",
                "fieldname": "catalogNumber",
                "isrelfld": False,
                "sorttype": 0,
                "position": 2,
                "isdisplay": True,
                "operstart": 1,
                "startvalue": "707070",
                "isnot": False,
            },
            {
                "tablelist": "10,1-collectionObjects,5-cataloger",
                "stringid": "10,1-collectionObjects,5-cataloger.agent.email",
                "fieldname": "email",
                "isrelfld": False,
                "sorttype": 0,
                "position": 3,
                "isdisplay": True,
                "operstart": 1,
                "startvalue": "testmail",
                "isnot": False,
            },
            {
                "tablelist": "10,1-collectionObjects,5-cataloger,8-addresses",
                "stringid": "10,1-collectionObjects,5-cataloger,8-addresses.address.address",
                "fieldname": "address",
                "isrelfld": False,
                "sorttype": 0,
                "position": 4,
                "isdisplay": True,
                "operstart": 8,
                "startvalue": "",
                "isnot": False,
            },
            {
                "tablelist": "10,1-collectionObjects,5-cataloger,109-agentAttachments",
                "stringid": "10,1-collectionObjects,5-cataloger,109-agentAttachments.agentattachment.remarks",
                "fieldname": "remarks",
                "isrelfld": False,
                "sorttype": 0,
                "position": 5,
                "isdisplay": True,
                "operstart": 1,
                "startvalue": "Test Here",
                "isnot": False,
            },
            {
                "tablelist": "10,1-collectionObjects,5-cataloger,109-agentAttachments,41",
                "stringid": "10,1-collectionObjects,5-cataloger,109-agentAttachments,41.attachment.guid",
                "fieldname": "guid",
                "isrelfld": False,
                "sorttype": 0,
                "position": 6,
                "isdisplay": True,
                "operstart": 8,
                "startvalue": "",
                "isnot": False,
            },
        ]

        query_fields = fields_from_json(fields)
        visible_fields = [field for field in query_fields if field.display]
        row_plan = RowPlanMap.get_row_plan(visible_fields)
        plan, fields = row_plan.index_plan()
        correct_plan = RowPlanMap(
            batch_edit_pack=BatchEditPack(
                id=BatchEditFieldPack(field=None, idx=2, value=None),
                order=BatchEditFieldPack(field=None, idx=None, value=None),
                version=BatchEditFieldPack(field=None, idx=3, value=None),
            ),
            columns=[BatchEditFieldPack(field=None, idx=1, value=None)],
            to_one={},
            to_many={
                "collectionobjects": RowPlanMap(
                    batch_edit_pack=BatchEditPack(
                        id=BatchEditFieldPack(field=None, idx=5, value=None),
                        order=BatchEditFieldPack(field=None, idx=None, value=None),
                        version=BatchEditFieldPack(field=None, idx=6, value=None),
                    ),
                    columns=[BatchEditFieldPack(field=None, idx=4, value=None)],
                    to_one={
                        "cataloger": RowPlanMap(
                            batch_edit_pack=BatchEditPack(
                                id=BatchEditFieldPack(field=None, idx=8, value=None),
                                order=BatchEditFieldPack(
                                    field=None, idx=None, value=None
                                ),
                                version=BatchEditFieldPack(
                                    field=None, idx=9, value=None
                                ),
                            ),
                            columns=[BatchEditFieldPack(field=None, idx=7, value=None)],
                            to_one={},
                            to_many={
                                "addresses": RowPlanMap(
                                    batch_edit_pack=BatchEditPack(
                                        id=BatchEditFieldPack(
                                            field=None, idx=11, value=None
                                        ),
                                        order=BatchEditFieldPack(
                                            field=None, idx=None, value=None
                                        ),
                                        version=BatchEditFieldPack(
                                            field=None, idx=12, value=None
                                        ),
                                    ),
                                    columns=[
                                        BatchEditFieldPack(
                                            field=None, idx=10, value=None
                                        )
                                    ],
                                    to_one={},
                                    to_many={},
                                    is_naive=True,
                                ),
                                "agentattachments": RowPlanMap(
                                    batch_edit_pack=BatchEditPack(
                                        id=BatchEditFieldPack(
                                            field=None, idx=14, value=None
                                        ),
                                        order=BatchEditFieldPack(
                                            field=None, idx=None, value=None
                                        ),
                                        version=BatchEditFieldPack(
                                            field=None, idx=15, value=None
                                        ),
                                    ),
                                    columns=[
                                        BatchEditFieldPack(
                                            field=None, idx=13, value=None
                                        )
                                    ],
                                    to_one={
                                        "attachment": RowPlanMap(
                                            batch_edit_pack=BatchEditPack(
                                                id=BatchEditFieldPack(
                                                    field=None, idx=17, value=None
                                                ),
                                                order=BatchEditFieldPack(
                                                    field=None, idx=None, value=None
                                                ),
                                                version=BatchEditFieldPack(
                                                    field=None, idx=18, value=None
                                                ),
                                            ),
                                            columns=[
                                                BatchEditFieldPack(
                                                    field=None, idx=16, value=None
                                                )
                                            ],
                                            to_one={},
                                            to_many={},
                                            is_naive=False,
                                        )
                                    },
                                    to_many={},
                                    is_naive=False,
                                ),
                            },
                            is_naive=True,
                        )
                    },
                    to_many={},
                    is_naive=True,
                ),
                "collectors": RowPlanMap(
                    batch_edit_pack=BatchEditPack(
                        id=BatchEditFieldPack(field=None, idx=20, value=None),
                        order=BatchEditFieldPack(field=None, idx=22, value=None),
                        version=BatchEditFieldPack(field=None, idx=21, value=None),
                    ),
                    columns=[BatchEditFieldPack(field=None, idx=19, value=None)],
                    to_one={},
                    to_many={},
                    is_naive=False,
                ),
            },
            is_naive=True,
        )
        self.assertEqual(plan, correct_plan)
