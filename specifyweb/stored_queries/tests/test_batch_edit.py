import json
from unittest.mock import patch

from specifyweb.stored_queries.batch_edit import (
    BatchEditFieldPack,
    BatchEditPack,
    BatchEditProps,
    RowPlanMap,
    run_batch_edit_query,
)

from specifyweb.stored_queries.queryfield import fields_from_json
from specifyweb.stored_queries.queryfieldspec import QueryFieldSpec
from specifyweb.stored_queries.tests.base_format import SIMPLE_DEF
from specifyweb.stored_queries.tests.tests import SQLAlchemySetup
from specifyweb.stored_queries.tests.static import test_plan

from specifyweb.specify.datamodel import datamodel
import specifyweb.specify.models as models

from specifyweb.workbench.upload.upload_plan_schema import schema
from jsonschema import validate

from specifyweb.stored_queries.tests.static.co_query_row_plan import row_plan_map


def apply_visual_order(headers, order):
    return [headers[col] for col in order]


def props_builder(self, session_maker):
    def _builder(query_fields, base_table):
        return BatchEditProps(
            collection=self.collection,
            user=self.specifyuser,
            contexttableid=datamodel.get_table_strict(base_table).tableId,
            fields=query_fields,
            session_maker=session_maker,
            captions=None,
            limit=None,
            recordsetid=None,
        )

    return _builder

def fake_obj_formatter(*args, **kwargs):
    return (SIMPLE_DEF, None, None)

OBJ_FORMATTER_PATH = 'specifyweb.context.app_resource.get_app_resource'

# NOTES: Yes, it is more convenient to hard code ids (instead of defining variables.).
# But, using variables can make bugs apparent
# what if a object doesn't appear in the resulsts? Using the variables will trigger IDEs unused variable warning, making things more safer
class QueryConstructionTests(SQLAlchemySetup):
    def setUp(self):
        super().setUp()

        agents = [
            {"firstname": "Test1", "lastname": "LastName"},
            {"firstname": "Test2", "lastname": "LastNameAsTest"},
            {"firstname": "Test4", "lastname": "LastNameTest4"},
        ]

        self.agents_created = [
            models.Agent.objects.create(agenttype=0, division=self.division, **kwargs)
            for kwargs in agents
        ]

        def _create(model, kwargs):
            return model.objects.create(**kwargs)

        self._create = _create

        self.preptype = models.Preptype.objects.create(
            name="testPrepType",
            isloanable=False,
            collection=self.collection,
        )

        self.build_props = props_builder(
            self, QueryConstructionTests.test_session_context
        )

    def test_query_construction(self):
        query = json.load(open("specifyweb/stored_queries/tests/static/co_query.json"))
        query_fields = fields_from_json(query["fields"])
        visible_fields = [field for field in query_fields if field.display]
        row_plan = RowPlanMap.get_row_plan(visible_fields)
        plan, fields = row_plan.index_plan()

        self.assertEqual(plan, row_plan_map)


    @patch(OBJ_FORMATTER_PATH, new=fake_obj_formatter)
    def test_basic_run(self):
        base_table = "collectionobject"
        query_paths = [
            ["catalognumber"],
            ["integer1"],
            ["cataloger"],
            ["cataloger", "firstname"],
            ["cataloger", "lastname"],
            ["collectingevent"],
            ["collectingevent", "locality", "localityname"],
        ]
        added = [(base_table, *path) for path in query_paths]

        query_fields = [
            BatchEditPack._query_field(QueryFieldSpec.from_path(path), 0)
            for path in added
        ]

        [
            self._update(obj, {"cataloger_id": self.agents_created[0]})
            for obj in self.collectionobjects[:2]
        ]

        self._update(self.collectionobjects[2], {"integer1": 99})
        self._update(self.collectionobjects[4], {"integer1": 229})

        [
            self._update(obj, {"cataloger_id": self.agents_created[1]})
            for obj in self.collectionobjects[2:]
        ]

        [
            self._update(obj, {"collectingevent_id": None})
            for obj in self.collectionobjects
        ]

        props = self.build_props(query_fields, base_table)

        (headers, rows, packs, plan, order) = run_batch_edit_query(props)

        self.assertEqual(
            headers,
            [
                "CollectionObject catalogNumber",
                "CollectionObject integer1",
                "Agent (formatted)",
                "CollectingEvent (formatted)",
                "Agent firstName",
                "Agent lastName",
                "Locality localityName",
            ],
        )

        self.assertEqual(
            apply_visual_order(headers, order),
            [
                "CollectionObject catalogNumber",
                "CollectionObject integer1",
                "Agent (formatted)",
                "Agent firstName",
                "Agent lastName",
                "CollectingEvent (formatted)",
                "Locality localityName",
            ],
        )

        correct_rows = [
            ['num-0', None, 'LastName', '', 'Test1', 'LastName', None],
            ['num-1', None, 'LastName', '', 'Test1', 'LastName', None],
            ['num-2', 99, 'LastNameAsTest', '', 'Test2', 'LastNameAsTest', None],
            ['num-3', None, 'LastNameAsTest', '', 'Test2', 'LastNameAsTest', None],
            ['num-4', 229, 'LastNameAsTest', '', 'Test2', 'LastNameAsTest', None]
            ]

        self.assertEqual(correct_rows, rows)

        correct_packs = [
            {
                "self": {
                    "id": self.collectionobjects[0].id,
                    "ordernumber": None,
                    "version": 0,
                },
                "to_one": {
                    "cataloger": {
                        "self": {
                            "id": self.agents_created[0].id,
                            "ordernumber": None,
                            "version": 0,
                        }
                    }
                },
            },
            {
                "self": {
                    "id": self.collectionobjects[1].id,
                    "ordernumber": None,
                    "version": 0,
                },
                "to_one": {
                    "cataloger": {
                        "self": {
                            "id": self.agents_created[0].id,
                            "ordernumber": None,
                            "version": 0,
                        }
                    }
                },
            },
            {
                "self": {
                    "id": self.collectionobjects[2].id,
                    "ordernumber": None,
                    "version": 0,
                },
                "to_one": {
                    "cataloger": {
                        "self": {
                            "id": self.agents_created[1].id,
                            "ordernumber": None,
                            "version": 0,
                        }
                    }
                },
            },
            {
                "self": {
                    "id": self.collectionobjects[3].id,
                    "ordernumber": None,
                    "version": 0,
                },
                "to_one": {
                    "cataloger": {
                        "self": {
                            "id": self.agents_created[1].id,
                            "ordernumber": None,
                            "version": 0,
                        }
                    }
                },
            },
            {
                "self": {
                    "id": self.collectionobjects[4].id,
                    "ordernumber": None,
                    "version": 0,
                },
                "to_one": {
                    "cataloger": {
                        "self": {
                            "id": self.agents_created[1].id,
                            "ordernumber": None,
                            "version": 0,
                        }
                    }
                },
            },
        ]

        self.assertEqual(correct_packs, packs)

        correct_plan = {
            "baseTableName": "Collectionobject",
            "uploadable": {
                "uploadTable": {
                    "wbcols": {
                        "catalognumber": "CollectionObject catalogNumber",
                        "integer1": "CollectionObject integer1",
                    },
                    "static": {},
                    "toOne": {
                        "cataloger": {
                            "uploadTable": {
                                "wbcols": {
                                    "firstname": "Agent firstName",
                                    "lastname": "Agent lastName",
                                },
                                "static": {},
                                "toOne": {},
                                "toMany": {},
                            }
                        },
                        "collectingevent": {
                            "uploadTable": {
                                "wbcols": {},
                                "static": {},
                                "toOne": {
                                    "locality": {
                                        "uploadTable": {
                                            "wbcols": {
                                                "localityname": "Locality localityName"
                                            },
                                            "static": {},
                                            "toOne": {},
                                            "toMany": {},
                                        }
                                    }
                                },
                                "toMany": {},
                            }
                        },
                    },
                    "toMany": {},
                }
            },
        }

        self.assertDictEqual(correct_plan, plan)

    @patch(OBJ_FORMATTER_PATH, new=fake_obj_formatter)
    def test_duplicates_flattened(self):
        base_table = "collectionobject"
        query_paths = [
            ["catalognumber"],
            ["integer1"],
            ["cataloger"],
            ["determinations", "integer1"],
            ["determinations", "remarks"],
            ["preparations", "countAmt"],
            ["preparations", "text1"],
            ["cataloger", "firstname"],
            ["cataloger", "lastname"],
            ["cataloger", "agentSpecialties", "specialtyName"],
            ["cataloger", "collectors", "remarks"],
            ["cataloger", "collectors", "collectingevent", "stationfieldnumber"],
        ]

        added = [(base_table, *path) for path in query_paths]

        query_fields = [
            BatchEditPack._query_field(QueryFieldSpec.from_path(path), 0)
            for path in added
        ]

        sp1 = models.Agentspecialty.objects.create(
            agent=self.agents_created[0], specialtyname="agent1-testspecialty"
        )
        sp2 = models.Agentspecialty.objects.create(
            agent=self.agents_created[0], specialtyname="agent1-testspecialty2"
        )
        sp3 = models.Agentspecialty.objects.create(
            agent=self.agents_created[0], specialtyname="agent1-testspecialty4"
        )
        sp4 = models.Agentspecialty.objects.create(
            agent=self.agents_created[0], specialtyname="agent1-testspecialty5"
        )

        sp5 = models.Agentspecialty.objects.create(
            agent=self.agents_created[1], specialtyname="agent2-testspecialty"
        )
        sp6 = models.Agentspecialty.objects.create(
            agent=self.agents_created[1], specialtyname="agent2-testspecialty2"
        )
        sp7 = models.Agentspecialty.objects.create(
            agent=self.agents_created[1], specialtyname="agent2-testspecialty4"
        )

        ce1 = models.Collectingevent.objects.create(
            discipline=self.discipline, stationfieldnumber="sfn1"
        )

        ce2 = models.Collectingevent.objects.create(
            discipline=self.discipline, stationfieldnumber="sfn2"
        )
        ce3 = models.Collectingevent.objects.create(
            discipline=self.discipline, stationfieldnumber="sfn3"
        )
        ce4 = models.Collectingevent.objects.create(
            discipline=self.discipline, stationfieldnumber="sfn4"
        )
        ce5 = models.Collectingevent.objects.create(
            discipline=self.discipline, stationfieldnumber="sfn5"
        )
        ce6 = models.Collectingevent.objects.create(
            discipline=self.discipline, stationfieldnumber="sfn6"
        )

        col1 = models.Collector.objects.create(
            collectingevent=ce1,
            agent=self.agents_created[0],
            remarks="ce1-agt1",
            ordernumber=1,
        )

        col2 = models.Collector.objects.create(
            collectingevent=ce2,
            agent=self.agents_created[0],
            remarks="ce2-agt1",
            ordernumber=2,
        )

        col3 = models.Collector.objects.create(
            collectingevent=ce3,
            agent=self.agents_created[0],
            remarks="ce3-agt1",
            ordernumber=4,
        )

        col4 = models.Collector.objects.create(
            collectingevent=ce4,
            agent=self.agents_created[0],
            remarks="ce4-agt1",
            ordernumber=5,
        )

        col5 = models.Collector.objects.create(
            collectingevent=ce5,
            agent=self.agents_created[0],
            remarks="ce5-agt1",
            ordernumber=6,
        )

        col6 = models.Collector.objects.create(
            collectingevent=ce6,
            agent=self.agents_created[0],
            remarks="ce6-agt1",
            ordernumber=7,
        )

        col8 = models.Collector.objects.create(
            collectingevent=ce1,
            agent=self.agents_created[2],
            remarks="ce1-agt2",
            ordernumber=1,
        )

        col9 = models.Collector.objects.create(
            collectingevent=ce2,
            agent=self.agents_created[2],
            remarks="ce2-agt2",
            ordernumber=2,
        )

        col10 = models.Collector.objects.create(
            collectingevent=ce3,
            agent=self.agents_created[2],
            remarks="ce4-agt2",
            ordernumber=4,
        )

        col11 = models.Collector.objects.create(
            collectingevent=ce4,
            agent=self.agents_created[2],
            remarks="ce5-agt2",
            ordernumber=5,
        )

        col12 = models.Collector.objects.create(
            collectingevent=ce5,
            agent=self.agents_created[2],
            remarks="ce6-agt2",
            ordernumber=6,
        )

        col13 = models.Collector.objects.create(
            collectingevent=ce6,
            agent=self.agents_created[2],
            remarks="ce7-agt2",
            ordernumber=7,
        )

        col14 = models.Collector.objects.create(
            collectingevent=ce1,
            agent=self.agents_created[1],
            remarks="ce1-agt",
            ordernumber=1,
        )

        col15 = models.Collector.objects.create(
            collectingevent=ce2,
            agent=self.agents_created[1],
            remarks="ce2-agt",
            ordernumber=2,
        )

        col16 = models.Collector.objects.create(
            collectingevent=ce3,
            agent=self.agents_created[1],
            remarks="ce4-agt",
            ordernumber=4,
        )

        col17 = models.Collector.objects.create(
            collectingevent=ce4,
            agent=self.agents_created[1],
            remarks="ce5-agt",
            ordernumber=5,
        )

        co_1_det_1 = models.Determination.objects.create(
            collectionobject=self.collectionobjects[0],
            integer1=10,
            remarks="Some remarks",
        )

        co_1_det_2 = models.Determination.objects.create(
            collectionobject=self.collectionobjects[0],
            integer1=929,
        )

        co_1_det_3 = models.Determination.objects.create(
            collectionobject=self.collectionobjects[0],
        )

        co_2_det_1 = models.Determination.objects.create(
            collectionobject=self.collectionobjects[1],
            integer1=224,
            remarks="Some remarks unique",
        )

        co_2_det_2 = models.Determination.objects.create(
            collectionobject=self.collectionobjects[1],
            integer1=2222,
        )

        co_4_det_1 = models.Determination.objects.create(
            collectionobject=self.collectionobjects[4],
            integer1=1212,
            remarks="Some remarks for determination testing",
        )

        co_4_det_2 = models.Determination.objects.create(
            collectionobject=self.collectionobjects[4],
            integer1=8729,
            remarks="test remarks",
        )

        co_4_det_3 = models.Determination.objects.create(
            collectionobject=self.collectionobjects[4]
        )

        self._update(
            self.collectionobjects[0],
            {"integer1": 99, "cataloger": self.agents_created[0]},
        )

        self._update(
            self.collectionobjects[2],
            {"integer1": 412, "cataloger": self.agents_created[2]},
        )

        self._update(
            self.collectionobjects[3],
            {"integer1": 322, "cataloger": self.agents_created[1]},
        )

        props = self.build_props(query_fields, base_table)

        (headers, rows, packs, plan, order) = run_batch_edit_query(props)

        visual = apply_visual_order(headers, order)
        self.assertEqual(
            visual,
            [
                "CollectionObject catalogNumber",
                "CollectionObject integer1",
                "Agent (formatted)",
                "Determination integer1",
                "Determination integer1 #2",
                "Determination integer1 #3",
                "Determination remarks",
                "Determination remarks #2",
                "Determination remarks #3",
                "Agent firstName",
                "Agent lastName",
                "AgentSpecialty specialtyName",
                "AgentSpecialty specialtyName #2",
                "AgentSpecialty specialtyName #3",
                "AgentSpecialty specialtyName #4",
                "Collector remarks",
                "Collector remarks #2",
                "Collector remarks #3",
                "Collector remarks #4",
                "Collector remarks #5",
                "Collector remarks #6",
                "Collector remarks #7",
                "Collector remarks #8",
                "CollectingEvent stationFieldNumber",
                "CollectingEvent stationFieldNumber #2",
                "CollectingEvent stationFieldNumber #3",
                "CollectingEvent stationFieldNumber #4",
                "CollectingEvent stationFieldNumber #5",
                "CollectingEvent stationFieldNumber #6",
                "CollectingEvent stationFieldNumber #7",
                "CollectingEvent stationFieldNumber #8",
            ],
        )

        correct_rows = [
            {
                "CollectionObject catalogNumber": "num-0",
                "CollectionObject integer1": 99,
                "Agent (formatted)": "LastName",
                "Agent firstName": "Test1",
                "Agent lastName": "LastName",
                "AgentSpecialty specialtyName": "agent1-testspecialty",
                "AgentSpecialty specialtyName #2": "agent1-testspecialty2",
                "AgentSpecialty specialtyName #3": "agent1-testspecialty4",
                "AgentSpecialty specialtyName #4": "agent1-testspecialty5",
                "Collector remarks": None,
                "CollectingEvent stationFieldNumber": None,
                "Collector remarks #2": "ce1-agt1",
                "CollectingEvent stationFieldNumber #2": "sfn1",
                "Collector remarks #3": "ce2-agt1",
                "CollectingEvent stationFieldNumber #3": "sfn2",
                "Collector remarks #4": None,
                "CollectingEvent stationFieldNumber #4": None,
                "Collector remarks #5": "ce3-agt1",
                "CollectingEvent stationFieldNumber #5": "sfn3",
                "Collector remarks #6": "ce4-agt1",
                "CollectingEvent stationFieldNumber #6": "sfn4",
                "Collector remarks #7": "ce5-agt1",
                "CollectingEvent stationFieldNumber #7": "sfn5",
                "Collector remarks #8": "ce6-agt1",
                "CollectingEvent stationFieldNumber #8": "sfn6",
                "Determination integer1": 10,
                "Determination remarks": "Some remarks",
                "Determination integer1 #2": 929,
                "Determination remarks #2": None,
                "Determination integer1 #3": None,
                "Determination remarks #3": None,
            },
            {
                "CollectionObject catalogNumber": "num-1",
                "CollectionObject integer1": None,
                "Agent (formatted)": "",
                "Agent firstName": None,
                "Agent lastName": None,
                "AgentSpecialty specialtyName": None,
                "AgentSpecialty specialtyName #2": None,
                "AgentSpecialty specialtyName #3": None,
                "AgentSpecialty specialtyName #4": None,
                "Collector remarks": None,
                "CollectingEvent stationFieldNumber": None,
                "Collector remarks #2": None,
                "CollectingEvent stationFieldNumber #2": None,
                "Collector remarks #3": None,
                "CollectingEvent stationFieldNumber #3": None,
                "Collector remarks #4": None,
                "CollectingEvent stationFieldNumber #4": None,
                "Collector remarks #5": None,
                "CollectingEvent stationFieldNumber #5": None,
                "Collector remarks #6": None,
                "CollectingEvent stationFieldNumber #6": None,
                "Collector remarks #7": None,
                "CollectingEvent stationFieldNumber #7": None,
                "Collector remarks #8": None,
                "CollectingEvent stationFieldNumber #8": None,
                "Determination integer1": 224,
                "Determination remarks": "Some remarks unique",
                "Determination integer1 #2": 2222,
                "Determination remarks #2": None,
                "Determination integer1 #3": None,
                "Determination remarks #3": None,
            },
            {
                "CollectionObject catalogNumber": "num-2",
                "CollectionObject integer1": 412,
                "Agent (formatted)": "LastNameTest4",
                "Agent firstName": "Test4",
                "Agent lastName": "LastNameTest4",
                "AgentSpecialty specialtyName": None,
                "AgentSpecialty specialtyName #2": None,
                "AgentSpecialty specialtyName #3": None,
                "AgentSpecialty specialtyName #4": None,
                "Collector remarks": None,
                "CollectingEvent stationFieldNumber": None,
                "Collector remarks #2": "ce1-agt2",
                "CollectingEvent stationFieldNumber #2": "sfn1",
                "Collector remarks #3": "ce2-agt2",
                "CollectingEvent stationFieldNumber #3": "sfn2",
                "Collector remarks #4": None,
                "CollectingEvent stationFieldNumber #4": None,
                "Collector remarks #5": "ce4-agt2",
                "CollectingEvent stationFieldNumber #5": "sfn3",
                "Collector remarks #6": "ce5-agt2",
                "CollectingEvent stationFieldNumber #6": "sfn4",
                "Collector remarks #7": "ce6-agt2",
                "CollectingEvent stationFieldNumber #7": "sfn5",
                "Collector remarks #8": "ce7-agt2",
                "CollectingEvent stationFieldNumber #8": "sfn6",
                "Determination integer1": None,
                "Determination remarks": None,
                "Determination integer1 #2": None,
                "Determination remarks #2": None,
                "Determination integer1 #3": None,
                "Determination remarks #3": None,
            },
            {
                "CollectionObject catalogNumber": "num-3",
                "CollectionObject integer1": 322,
                "Agent (formatted)": "LastNameAsTest",
                "Agent firstName": "Test2",
                "Agent lastName": "LastNameAsTest",
                "AgentSpecialty specialtyName": "agent2-testspecialty",
                "AgentSpecialty specialtyName #2": "agent2-testspecialty2",
                "AgentSpecialty specialtyName #3": "agent2-testspecialty4",
                "AgentSpecialty specialtyName #4": None,
                "Collector remarks": None,
                "CollectingEvent stationFieldNumber": None,
                "Collector remarks #2": "ce1-agt",
                "CollectingEvent stationFieldNumber #2": "sfn1",
                "Collector remarks #3": "ce2-agt",
                "CollectingEvent stationFieldNumber #3": "sfn2",
                "Collector remarks #4": None,
                "CollectingEvent stationFieldNumber #4": None,
                "Collector remarks #5": "ce4-agt",
                "CollectingEvent stationFieldNumber #5": "sfn3",
                "Collector remarks #6": "ce5-agt",
                "CollectingEvent stationFieldNumber #6": "sfn4",
                "Collector remarks #7": None,
                "CollectingEvent stationFieldNumber #7": None,
                "Collector remarks #8": None,
                "CollectingEvent stationFieldNumber #8": None,
                "Determination integer1": None,
                "Determination remarks": None,
                "Determination integer1 #2": None,
                "Determination remarks #2": None,
                "Determination integer1 #3": None,
                "Determination remarks #3": None,
            },
            {
                "CollectionObject catalogNumber": "num-4",
                "CollectionObject integer1": None,
                "Agent (formatted)": "",
                "Agent firstName": None,
                "Agent lastName": None,
                "AgentSpecialty specialtyName": None,
                "AgentSpecialty specialtyName #2": None,
                "AgentSpecialty specialtyName #3": None,
                "AgentSpecialty specialtyName #4": None,
                "Collector remarks": None,
                "CollectingEvent stationFieldNumber": None,
                "Collector remarks #2": None,
                "CollectingEvent stationFieldNumber #2": None,
                "Collector remarks #3": None,
                "CollectingEvent stationFieldNumber #3": None,
                "Collector remarks #4": None,
                "CollectingEvent stationFieldNumber #4": None,
                "Collector remarks #5": None,
                "CollectingEvent stationFieldNumber #5": None,
                "Collector remarks #6": None,
                "CollectingEvent stationFieldNumber #6": None,
                "Collector remarks #7": None,
                "CollectingEvent stationFieldNumber #7": None,
                "Collector remarks #8": None,
                "CollectingEvent stationFieldNumber #8": None,
                "Determination integer1": 1212,
                "Determination remarks": "Some remarks for determination testing",
                "Determination integer1 #2": 8729,
                "Determination remarks #2": "test remarks",
                "Determination integer1 #3": None,
                "Determination remarks #3": None,
            },
        ]

        to_dict = [dict(zip(headers, row)) for row in rows]

        self.assertEqual(to_dict, correct_rows)

        correct_packs = [
            {
                "self": {
                    "id": self.collectionobjects[0].id,
                    "ordernumber": None,
                    "version": 0,
                },
                "to_one": {
                    "cataloger": {
                        "self": {
                            "id": self.agents_created[0].id,
                            "ordernumber": None,
                            "version": 0,
                        },
                        "to_many": {
                            "agentspecialties": [
                                {
                                    "self": {
                                        "id": sp1.id,
                                        "ordernumber": 0,
                                        "version": 0,
                                    }
                                },
                                {
                                    "self": {
                                        "id": sp2.id,
                                        "ordernumber": 1,
                                        "version": 0,
                                    }
                                },
                                {
                                    "self": {
                                        "id": sp3.id,
                                        "ordernumber": 2,
                                        "version": 0,
                                    }
                                },
                                {
                                    "self": {
                                        "id": sp4.id,
                                        "ordernumber": 3,
                                        "version": 0,
                                    }
                                },
                            ],
                            "collectors": [
                                None,
                                {
                                    "self": {
                                        "id": col1.id,
                                        "ordernumber": 1,
                                        "version": 0,
                                    },
                                    "to_one": {
                                        "collectingevent": {
                                            "self": {
                                                "id": ce1.id,
                                                "ordernumber": None,
                                                "version": 0,
                                            }
                                        }
                                    },
                                },
                                {
                                    "self": {
                                        "id": col2.id,
                                        "ordernumber": 2,
                                        "version": 0,
                                    },
                                    "to_one": {
                                        "collectingevent": {
                                            "self": {
                                                "id": ce2.id,
                                                "ordernumber": None,
                                                "version": 0,
                                            }
                                        }
                                    },
                                },
                                None,
                                {
                                    "self": {
                                        "id": col3.id,
                                        "ordernumber": 4,
                                        "version": 0,
                                    },
                                    "to_one": {
                                        "collectingevent": {
                                            "self": {
                                                "id": ce3.id,
                                                "ordernumber": None,
                                                "version": 0,
                                            }
                                        }
                                    },
                                },
                                {
                                    "self": {
                                        "id": col4.id,
                                        "ordernumber": 5,
                                        "version": 0,
                                    },
                                    "to_one": {
                                        "collectingevent": {
                                            "self": {
                                                "id": ce4.id,
                                                "ordernumber": None,
                                                "version": 0,
                                            }
                                        }
                                    },
                                },
                                {
                                    "self": {
                                        "id": col5.id,
                                        "ordernumber": 6,
                                        "version": 0,
                                    },
                                    "to_one": {
                                        "collectingevent": {
                                            "self": {
                                                "id": ce5.id,
                                                "ordernumber": None,
                                                "version": 0,
                                            }
                                        }
                                    },
                                },
                                {
                                    "self": {
                                        "id": col6.id,
                                        "ordernumber": 7,
                                        "version": 0,
                                    },
                                    "to_one": {
                                        "collectingevent": {
                                            "self": {
                                                "id": ce6.id,
                                                "ordernumber": None,
                                                "version": 0,
                                            }
                                        }
                                    },
                                },
                            ],
                        },
                    }
                },
                "to_many": {
                    "determinations": [
                        {
                            "self": {
                                "id": co_1_det_1.id,
                                "ordernumber": None,
                                "version": 0,
                            }
                        },
                        {
                            "self": {
                                "id": co_1_det_2.id,
                                "ordernumber": None,
                                "version": 0,
                            }
                        },
                        {
                            "self": {
                                "id": co_1_det_3.id,
                                "ordernumber": None,
                                "version": 0,
                            }
                        },
                    ]
                },
            },
            {
                "self": {
                    "id": self.collectionobjects[1].id,
                    "ordernumber": None,
                    "version": 0,
                },
                "to_many": {
                    "determinations": [
                        {
                            "self": {
                                "id": co_2_det_1.id,
                                "ordernumber": None,
                                "version": 0,
                            }
                        },
                        {
                            "self": {
                                "id": co_2_det_2.id,
                                "ordernumber": None,
                                "version": 0,
                            }
                        },
                        None,
                    ]
                },
            },
            {
                "self": {
                    "id": self.collectionobjects[2].id,
                    "ordernumber": None,
                    "version": 0,
                },
                "to_one": {
                    "cataloger": {
                        "self": {
                            "id": self.agents_created[2].id,
                            "ordernumber": None,
                            "version": 0,
                        },
                        "to_many": {
                            "collectors": [
                                None,
                                {
                                    "self": {
                                        "id": col8.id,
                                        "ordernumber": 1,
                                        "version": 0,
                                    },
                                    "to_one": {
                                        "collectingevent": {
                                            "self": {
                                                "id": ce1.id,
                                                "ordernumber": None,
                                                "version": 0,
                                            }
                                        }
                                    },
                                },
                                {
                                    "self": {
                                        "id": col9.id,
                                        "ordernumber": 2,
                                        "version": 0,
                                    },
                                    "to_one": {
                                        "collectingevent": {
                                            "self": {
                                                "id": ce2.id,
                                                "ordernumber": None,
                                                "version": 0,
                                            }
                                        }
                                    },
                                },
                                None,
                                {
                                    "self": {
                                        "id": col10.id,
                                        "ordernumber": 4,
                                        "version": 0,
                                    },
                                    "to_one": {
                                        "collectingevent": {
                                            "self": {
                                                "id": ce3.id,
                                                "ordernumber": None,
                                                "version": 0,
                                            }
                                        }
                                    },
                                },
                                {
                                    "self": {
                                        "id": col11.id,
                                        "ordernumber": 5,
                                        "version": 0,
                                    },
                                    "to_one": {
                                        "collectingevent": {
                                            "self": {
                                                "id": ce4.id,
                                                "ordernumber": None,
                                                "version": 0,
                                            }
                                        }
                                    },
                                },
                                {
                                    "self": {
                                        "id": col12.id,
                                        "ordernumber": 6,
                                        "version": 0,
                                    },
                                    "to_one": {
                                        "collectingevent": {
                                            "self": {
                                                "id": ce5.id,
                                                "ordernumber": None,
                                                "version": 0,
                                            }
                                        }
                                    },
                                },
                                {
                                    "self": {
                                        "id": col13.id,
                                        "ordernumber": 7,
                                        "version": 0,
                                    },
                                    "to_one": {
                                        "collectingevent": {
                                            "self": {
                                                "id": ce6.id,
                                                "ordernumber": None,
                                                "version": 0,
                                            }
                                        }
                                    },
                                },
                            ]
                        },
                    }
                },
            },
            {
                "self": {
                    "id": self.collectionobjects[3].id,
                    "ordernumber": None,
                    "version": 0,
                },
                "to_one": {
                    "cataloger": {
                        "self": {
                            "id": self.agents_created[1].id,
                            "ordernumber": None,
                            "version": 0,
                        },
                        "to_many": {
                            "agentspecialties": [
                                {
                                    "self": {
                                        "id": sp5.id,
                                        "ordernumber": 0,
                                        "version": 0,
                                    }
                                },
                                {
                                    "self": {
                                        "id": sp6.id,
                                        "ordernumber": 1,
                                        "version": 0,
                                    }
                                },
                                {
                                    "self": {
                                        "id": sp7.id,
                                        "ordernumber": 2,
                                        "version": 0,
                                    }
                                },
                                None,
                            ],
                            "collectors": [
                                None,
                                {
                                    "self": {
                                        "id": col14.id,
                                        "ordernumber": 1,
                                        "version": 0,
                                    },
                                    "to_one": {
                                        "collectingevent": {
                                            "self": {
                                                "id": ce1.id,
                                                "ordernumber": None,
                                                "version": 0,
                                            }
                                        }
                                    },
                                },
                                {
                                    "self": {
                                        "id": col15.id,
                                        "ordernumber": 2,
                                        "version": 0,
                                    },
                                    "to_one": {
                                        "collectingevent": {
                                            "self": {
                                                "id": ce2.id,
                                                "ordernumber": None,
                                                "version": 0,
                                            }
                                        }
                                    },
                                },
                                None,
                                {
                                    "self": {
                                        "id": col16.id,
                                        "ordernumber": 4,
                                        "version": 0,
                                    },
                                    "to_one": {
                                        "collectingevent": {
                                            "self": {
                                                "id": ce3.id,
                                                "ordernumber": None,
                                                "version": 0,
                                            }
                                        }
                                    },
                                },
                                {
                                    "self": {
                                        "id": col17.id,
                                        "ordernumber": 5,
                                        "version": 0,
                                    },
                                    "to_one": {
                                        "collectingevent": {
                                            "self": {
                                                "id": ce4.id,
                                                "ordernumber": None,
                                                "version": 0,
                                            }
                                        }
                                    },
                                },
                                None,
                                None,
                            ],
                        },
                    }
                },
            },
            {
                "self": {
                    "id": self.collectionobjects[4].id,
                    "ordernumber": None,
                    "version": 0,
                },
                "to_many": {
                    "determinations": [
                        {
                            "self": {
                                "id": co_4_det_1.id,
                                "ordernumber": None,
                                "version": 0,
                            }
                        },
                        {
                            "self": {
                                "id": co_4_det_2.id,
                                "ordernumber": None,
                                "version": 0,
                            }
                        },
                        {
                            "self": {
                                "id": co_4_det_3.id,
                                "ordernumber": None,
                                "version": 0,
                            }
                        },
                    ]
                },
            },
        ]

        self.assertEqual(packs, correct_packs)
        self.assertDictEqual(plan, test_plan.plan)

    @patch(OBJ_FORMATTER_PATH, new=fake_obj_formatter)
    def test_stalls_within_to_many(self):
        base_table = "collectionobject"
        query_paths = [
            ["catalognumber"],
            ["determinations", "remarks"],
            ["preparations", "countamt"],
        ]

        added = [(base_table, *path) for path in query_paths]

        query_fields = [
            BatchEditPack._query_field(QueryFieldSpec.from_path(path), 0)
            for path in added
        ]

        co_1_det_1 = models.Determination.objects.create(
            collectionobject=self.collectionobjects[0],
            remarks="Remarks for collection object 1, det 1",
        )

        co_1_det_2 = models.Determination.objects.create(
            collectionobject=self.collectionobjects[0],
            remarks="Some remarks for collection object 1, det 2",
        )

        co_3_det_1 = models.Determination.objects.create(
            collectionobject=self.collectionobjects[2],
            remarks="Some remarks for collection object 3 det 1",
        )

        co_1_prep_1 = models.Preparation.objects.create(
            collectionobject=self.collectionobjects[0],
            countamt=90,
            preptype=self.preptype,
        )

        co_1_prep_2 = models.Preparation.objects.create(
            collectionobject=self.collectionobjects[0],
            countamt=890,
            preptype=self.preptype,
        )

        co_1_prep_3 = models.Preparation.objects.create(
            collectionobject=self.collectionobjects[0],
            countamt=12,
            preptype=self.preptype,
        )

        co_2_prep_1 = models.Preparation.objects.create(
            collectionobject=self.collectionobjects[1],
            countamt=84,
            preptype=self.preptype,
        )

        co_2_prep_2 = models.Preparation.objects.create(
            collectionobject=self.collectionobjects[1],
            countamt=982,
            preptype=self.preptype,
        )

        co_3_prep_1 = models.Preparation.objects.create(
            collectionobject=self.collectionobjects[2],
            countamt=690,
            preptype=self.preptype,
        )

        co_3_prep_2 = models.Preparation.objects.create(
            collectionobject=self.collectionobjects[2],
            countamt=6890,
            preptype=self.preptype,
        )

        co_3_prep_3 = models.Preparation.objects.create(
            collectionobject=self.collectionobjects[2],
            countamt=612,
            preptype=self.preptype,
        )

        props = self.build_props(query_fields, base_table)

        (headers, rows, packs, plan, order) = run_batch_edit_query(props)

        correct_rows = [
            [
                "num-0",
                "Remarks for collection object 1, det 1",
                "Some remarks for collection object 1, det 2",
                90,
                890,
                12,
            ],
            ["num-1", None, None, 84, 982, None],
            [
                "num-2",
                "Some remarks for collection object 3 det 1",
                None,
                690,
                6890,
                612,
            ],
            ["num-3", None, None, None, None, None],
            ["num-4", None, None, None, None, None],
        ]

        correct_packs = [
            {
                "self": {
                    "id": self.collectionobjects[0].id,
                    "ordernumber": None,
                    "version": 0,
                },
                "to_many": {
                    "determinations": [
                        {
                            "self": {
                                "id": co_1_det_1.id,
                                "ordernumber": None,
                                "version": 0,
                            }
                        },
                        {
                            "self": {
                                "id": co_1_det_2.id,
                                "ordernumber": None,
                                "version": 0,
                            }
                        },
                    ],
                    "preparations": [
                        {
                            "self": {
                                "id": co_1_prep_1.id,
                                "ordernumber": None,
                                "version": 0,
                            }
                        },
                        {
                            "self": {
                                "id": co_1_prep_2.id,
                                "ordernumber": None,
                                "version": 0,
                            }
                        },
                        {
                            "self": {
                                "id": co_1_prep_3.id,
                                "ordernumber": None,
                                "version": 0,
                            }
                        },
                    ],
                },
            },
            {
                "self": {
                    "id": self.collectionobjects[1].id,
                    "ordernumber": None,
                    "version": 0,
                },
                "to_many": {
                    "preparations": [
                        {
                            "self": {
                                "id": co_2_prep_1.id,
                                "ordernumber": None,
                                "version": 0,
                            }
                        },
                        {
                            "self": {
                                "id": co_2_prep_2.id,
                                "ordernumber": None,
                                "version": 0,
                            }
                        },
                        None,
                    ]
                },
            },
            {
                "self": {
                    "id": self.collectionobjects[2].id,
                    "ordernumber": None,
                    "version": 0,
                },
                "to_many": {
                    "determinations": [
                        {
                            "self": {
                                "id": co_3_det_1.id,
                                "ordernumber": None,
                                "version": 0,
                            }
                        },
                        None,
                    ],
                    "preparations": [
                        {
                            "self": {
                                "id": co_3_prep_1.id,
                                "ordernumber": None,
                                "version": 0,
                            }
                        },
                        {
                            "self": {
                                "id": co_3_prep_2.id,
                                "ordernumber": None,
                                "version": 0,
                            }
                        },
                        {
                            "self": {
                                "id": co_3_prep_3.id,
                                "ordernumber": None,
                                "version": 0,
                            }
                        },
                    ],
                },
            },
            {
                "self": {
                    "id": self.collectionobjects[3].id,
                    "ordernumber": None,
                    "version": 0,
                }
            },
            {
                "self": {
                    "id": self.collectionobjects[4].id,
                    "ordernumber": None,
                    "version": 0,
                }
            },
        ]

        self.assertEqual(correct_rows, rows)

        self.assertEqual(
            headers,
            [
                "CollectionObject catalogNumber",
                "Determination remarks",
                "Determination remarks #2",
                "Preparation countAmt",
                "Preparation countAmt #2",
                "Preparation countAmt #3",
            ],
        )

        self.assertEqual(packs, correct_packs)  
    
    @patch(OBJ_FORMATTER_PATH, new=fake_obj_formatter)
    def test_to_one_does_not_stall_if_not_to_many(self):
        base_table = "collectionobject"
        query_paths = [
            ["catalognumber"],
            ["cataloger", "firstname"],
            ["determinations", "remarks"],
        ]
        added = [(base_table, *path) for path in query_paths]

        query_fields = [
            BatchEditPack._query_field(QueryFieldSpec.from_path(path), 0)
            for path in added
        ]

        co_1_det_1 = models.Determination.objects.create(
            collectionobject=self.collectionobjects[0],
            remarks="Remarks for collection object 1 det1",
        )

        co_1_det_2 = models.Determination.objects.create(
            collectionobject=self.collectionobjects[0],
            remarks="Remarks for collection object 1 det2",
        )

        co_2_det_1 = models.Determination.objects.create(
            collectionobject=self.collectionobjects[1],
            remarks="Remarks for collection object 2 det1",
        )

        co_2_det_2 = models.Determination.objects.create(
            collectionobject=self.collectionobjects[1],
            remarks="Remarks for collection object 2 det2",
        )

        co_2_det_3 = models.Determination.objects.create(
            collectionobject=self.collectionobjects[1],
            remarks="Remarks for collection object 2 det-three",
        )

        self._update(self.collectionobjects[0], {"cataloger": self.agents_created[0]})

        props = self.build_props(query_fields, base_table)
        (headers, rows, packs, plan, order) = run_batch_edit_query(props)

        self.assertEqual(
            headers,
            [
                "CollectionObject catalogNumber",
                "Agent firstName",
                "Determination remarks",
                "Determination remarks #2",
                "Determination remarks #3",
            ],
        )

        self.assertEqual(
            rows,
            [
                [
                    "num-0",
                    "Test1",
                    "Remarks for collection object 1 det1",
                    "Remarks for collection object 1 det2",
                    None,
                ],
                [
                    "num-1",
                    None,
                    "Remarks for collection object 2 det1",
                    "Remarks for collection object 2 det2",
                    "Remarks for collection object 2 det-three",
                ],
                ["num-2", None, None, None, None],
                ["num-3", None, None, None, None],
                ["num-4", None, None, None, None],
            ],
        )

        self.assertEqual(
            packs,
            [
                {
                    "self": {
                        "id": self.collectionobjects[0].id,
                        "ordernumber": None,
                        "version": 0,
                    },
                    "to_one": {
                        "cataloger": {
                            "self": {
                                "id": self.agents_created[0].id,
                                "ordernumber": None,
                                "version": 0,
                            }
                        }
                    },
                    "to_many": {
                        "determinations": [
                            {
                                "self": {
                                    "id": co_1_det_1.id,
                                    "ordernumber": None,
                                    "version": 0,
                                }
                            },
                            {
                                "self": {
                                    "id": co_1_det_2.id,
                                    "ordernumber": None,
                                    "version": 0,
                                }
                            },
                            None,
                        ]
                    },
                },
                {
                    "self": {
                        "id": self.collectionobjects[1].id,
                        "ordernumber": None,
                        "version": 0,
                    },
                    "to_many": {
                        "determinations": [
                            {
                                "self": {
                                    "id": co_2_det_1.id,
                                    "ordernumber": None,
                                    "version": 0,
                                }
                            },
                            {
                                "self": {
                                    "id": co_2_det_2.id,
                                    "ordernumber": None,
                                    "version": 0,
                                }
                            },
                            {
                                "self": {
                                    "id": co_2_det_3.id,
                                    "ordernumber": None,
                                    "version": 0,
                                }
                            },
                        ]
                    },
                },
                {
                    "self": {
                        "id": self.collectionobjects[2].id,
                        "ordernumber": None,
                        "version": 0,
                    }
                },
                {
                    "self": {
                        "id": self.collectionobjects[3].id,
                        "ordernumber": None,
                        "version": 0,
                    }
                },
                {
                    "self": {
                        "id": self.collectionobjects[4].id,
                        "ordernumber": None,
                        "version": 0,
                    }
                },
            ],
        )

    @patch(OBJ_FORMATTER_PATH, new=fake_obj_formatter)
    def test_to_one_stalls_within(self):
        # Something like collectionobject -> cataloger -> agent specialty and agent -> agent address self stalls
        base_table = "collectionobject"
        query_paths = [
            ["catalognumber"],
            ["cataloger", "firstname"],
            ["cataloger", "addresses", "address"],
            ["cataloger", "addresses", "address2"],
            ["cataloger", "agentSpecialties", "specialtyName"],
            ["cataloger", "variants", "name"],
        ]
        added = [(base_table, *path) for path in query_paths]

        query_fields = [
            BatchEditPack._query_field(QueryFieldSpec.from_path(path), 0)
            for path in added
        ]

        agt1_sp1 = models.Agentspecialty.objects.create(
            agent=self.agents_created[0], specialtyname="agent1-testspecialty"
        )
        agt1_sp2 = models.Agentspecialty.objects.create(
            agent=self.agents_created[0], specialtyname="agent1-testspecialty2"
        )

        agt2_sp1 = models.Agentspecialty.objects.create(
            agent=self.agents_created[1], specialtyname="agent2-testspecialty1"
        )

        agt1_add1 = models.Address.objects.create(
            address="1234 Main St.",
            address2="Second line",
            agent=self.agents_created[0],
        )

        agt1_add2 = models.Address.objects.create(
            address="5678 Pleo St.",
            address2="Second line -- right below tree",
            agent=self.agents_created[0],
        )

        agt2_add1 = models.Address.objects.create(
            address="8765 Oreo St.", address2="not sure", agent=self.agents_created[1]
        )

        agt2_add2 = models.Address.objects.create(
            address="Plamer road", address2="Room 202", agent=self.agents_created[1]
        )

        agt2_add3 = models.Address.objects.create(
            address="Reo road",
            address2="Room 208, Apt. 101",
            agent=self.agents_created[1],
        )

        agt2_var1 = models.Agentvariant.objects.create(
            agent=self.agents_created[1], name="variant for agent2", vartype=0
        )

        agt2_var2 = models.Agentvariant.objects.create(
            agent=self.agents_created[1], name="variant 2 for agent2", vartype=1
        )

        agt3_var2 = models.Agentvariant.objects.create(
            agent=self.agents_created[1], name="variant 3 for agent2", vartype=2
        )

        self._update(self.collectionobjects[0], {"cataloger": self.agents_created[0]})
        self._update(self.collectionobjects[1], {"cataloger": self.agents_created[1]})
        self._update(self.collectionobjects[2], {"cataloger": self.agents_created[1]})
        self._update(self.collectionobjects[3], {"cataloger": self.agents_created[0]})
        self._update(self.collectionobjects[4], {"cataloger": self.agents_created[0]})

        props = self.build_props(query_fields, base_table)

        (headers, rows, packs, plan, order) = run_batch_edit_query(props)

        ordered_headers = apply_visual_order(headers, order)

        self.assertEqual(
            headers,
            [
                "CollectionObject catalogNumber",
                "Agent firstName",
                "Address address",
                "Address address2",
                "Address address #2",
                "Address address2 #2",
                "Address address #3",
                "Address address2 #3",
                "AgentSpecialty specialtyName",
                "AgentSpecialty specialtyName #2",
                "AgentVariant name",
                "AgentVariant name #2",
                "AgentVariant name #3",
            ],
        )

        correct_rows = [
            [
                "num-0",
                "Test1",
                "1234 Main St.",
                "Second line",
                "5678 Pleo St.",
                "Second line -- right below tree",
                None,
                None,
                "agent1-testspecialty",
                "agent1-testspecialty2",
                None,
                None,
                None,
            ],
            [
                "num-1",
                "Test2",
                "8765 Oreo St.",
                "not sure",
                "Plamer road",
                "Room 202",
                "Reo road",
                "Room 208, Apt. 101",
                "agent2-testspecialty1",
                None,
                "variant for agent2",
                "variant 2 for agent2",
                "variant 3 for agent2",
            ],
            [
                "num-2",
                "Test2",
                "8765 Oreo St.",
                "not sure",
                "Plamer road",
                "Room 202",
                "Reo road",
                "Room 208, Apt. 101",
                "agent2-testspecialty1",
                None,
                "variant for agent2",
                "variant 2 for agent2",
                "variant 3 for agent2",
            ],
            [
                "num-3",
                "Test1",
                "1234 Main St.",
                "Second line",
                "5678 Pleo St.",
                "Second line -- right below tree",
                None,
                None,
                "agent1-testspecialty",
                "agent1-testspecialty2",
                None,
                None,
                None,
            ],
            [
                "num-4",
                "Test1",
                "1234 Main St.",
                "Second line",
                "5678 Pleo St.",
                "Second line -- right below tree",
                None,
                None,
                "agent1-testspecialty",
                "agent1-testspecialty2",
                None,
                None,
                None,
            ],
        ]

        self.assertEqual(rows, correct_rows)

        agent_1_pack = {
            "self": {
                "id": self.agents_created[0].id,
                "ordernumber": None,
                "version": 0,
            },
            "to_many": {
                "addresses": [
                    {"self": {"id": agt1_add1.id, "ordernumber": None, "version": 0}},
                    {"self": {"id": agt1_add2.id, "ordernumber": None, "version": 0}},
                    None,
                ],
                "agentspecialties": [
                    {"self": {"id": agt1_sp1.id, "ordernumber": 0, "version": 0}},
                    {"self": {"id": agt1_sp2.id, "ordernumber": 1, "version": 0}},
                ],
            },
        }

        agent_2_pack = {
            "self": {
                "id": self.agents_created[1].id,
                "ordernumber": None,
                "version": 0,
            },
            "to_many": {
                "addresses": [
                    {"self": {"id": agt2_add1.id, "ordernumber": None, "version": 0}},
                    {"self": {"id": agt2_add2.id, "ordernumber": None, "version": 0}},
                    {"self": {"id": agt2_add3.id, "ordernumber": None, "version": 0}},
                ],
                "agentspecialties": [
                    {"self": {"id": agt2_sp1.id, "ordernumber": 0, "version": 0}},
                    None,
                ],
                "variants": [
                    {"self": {"id": agt2_var1.id, "ordernumber": None, "version": 0}},
                    {"self": {"id": agt2_var2.id, "ordernumber": None, "version": 0}},
                    {"self": {"id": agt3_var2.id, "ordernumber": None, "version": 0}},
                ],
            },
        }
        correct_packs = [
            {
                "self": {
                    "id": self.collectionobjects[0].id,
                    "ordernumber": None,
                    "version": 0,
                },
                "to_one": {"cataloger": agent_1_pack},
            },
            {
                "self": {
                    "id": self.collectionobjects[1].id,
                    "ordernumber": None,
                    "version": 0,
                },
                "to_one": {"cataloger": agent_2_pack},
            },
            {
                "self": {
                    "id": self.collectionobjects[2].id,
                    "ordernumber": None,
                    "version": 0,
                },
                "to_one": {"cataloger": agent_2_pack},
            },
            {
                "self": {
                    "id": self.collectionobjects[3].id,
                    "ordernumber": None,
                    "version": 0,
                },
                "to_one": {"cataloger": agent_1_pack},
            },
            {
                "self": {
                    "id": self.collectionobjects[4].id,
                    "ordernumber": None,
                    "version": 0,
                },
                "to_one": {"cataloger": agent_1_pack},
            },
        ]
        self.assertEqual(correct_packs, packs)

    @patch(OBJ_FORMATTER_PATH, new=fake_obj_formatter)
    def test_to_one_stalls_to_many(self):
        # To ensure that to-many on to-one side stalls naive to-manys

        # Test conditions:
        # 1. Only one on to-one's to-many side does not stall
        # 2. Multiple on to-one's to-many side stalls
        # 3. Test none on to-one does not stall

        base_table = "collectionobject"
        query_paths = [
            ["catalognumber"],
            ["cataloger", "firstname"],
            ["cataloger", "addresses", "address"],
            ["cataloger", "agentSpecialties", "specialtyName"],
            ["determinations", "remarks"],
            ["preparations", "countamt"],
        ]
        added = [(base_table, *path) for path in query_paths]

        query_fields = [
            BatchEditPack._query_field(QueryFieldSpec.from_path(path), 0)
            for path in added
        ]

        # 1. Only one on to-one's to-many side does not stall
        agt1_sp1 = models.Agentspecialty.objects.create(
            agent=self.agents_created[0], specialtyname="agent1-testspeciality - one"
        )

        co_1_det_1 = models.Determination.objects.create(
            collectionobject=self.collectionobjects[0],
            remarks="Remarks for collection object 1 det 1",
        )

        co_1_det_2 = models.Determination.objects.create(
            collectionobject=self.collectionobjects[0],
            remarks="Remarks for collection object 1 det 2",
        )

        co_1_prep_1 = models.Preparation.objects.create(
            collectionobject=self.collectionobjects[0],
            countamt=90,
            preptype=self.preptype,
        )

        # 2. Multiple on to-one's to-many side stalls
        ag2_sp1 = models.Agentspecialty.objects.create(
            agent=self.agents_created[1], specialtyname="agent2-testspecialty - one"
        )

        ag2_sp2 = models.Agentspecialty.objects.create(
            agent=self.agents_created[1], specialtyname="agent2-testspecialty - two"
        )

        ag2_add1 = models.Address.objects.create(
            address="1234 Main St.",
            address2="Second line",
            agent=self.agents_created[1],
        )

        ag2_add2 = models.Address.objects.create(
            address="6789 Main St.",
            address2="Non-primary address",
            agent=self.agents_created[1],
        )

        ag2_add3 = models.Address.objects.create(
            address="1420 Alumni Place",
            address2="Address at aardwark",
            agent=self.agents_created[1],
        )

        co_2_det_1 = models.Determination.objects.create(
            collectionobject=self.collectionobjects[1],
            remarks="Remarks for collection object 2 det 1",
        )

        co_2_det_2 = models.Determination.objects.create(
            collectionobject=self.collectionobjects[1],
            remarks="Remarks for collection object 2 det 2",
        )

        co_2_prep_1 = models.Preparation.objects.create(
            collectionobject=self.collectionobjects[1],
            countamt=102,
            preptype=self.preptype,
        )

        # 3. Test none on to-one does not stall
        co_3_det_1 = models.Determination.objects.create(
            collectionobject=self.collectionobjects[2],
            remarks="Remarks for collection object 3 det 1",
        )

        co_3_det_2 = models.Determination.objects.create(
            collectionobject=self.collectionobjects[2],
            remarks="Remarks for collection object 3 det 2",
        )

        co_3_prep_1 = models.Preparation.objects.create(
            collectionobject=self.collectionobjects[2],
            countamt=21,
            preptype=self.preptype,
        )

        co_3_prep_2 = models.Preparation.objects.create(
            collectionobject=self.collectionobjects[2],
            countamt=12,
            preptype=self.preptype,
        )

        self._update(self.collectionobjects[0], {"cataloger": self.agents_created[0]})
        self._update(self.collectionobjects[1], {"cataloger": self.agents_created[1]})

        props = self.build_props(query_fields, base_table)

        (headers, rows, packs, plan, order) = run_batch_edit_query(props)

        self.assertEqual(
            headers,
            [
                "CollectionObject catalogNumber",
                "Agent firstName",
                "Address address",
                "Address address #2",
                "Address address #3",
                "AgentSpecialty specialtyName",
                "AgentSpecialty specialtyName #2",
                "Determination remarks",
                "Determination remarks #2",
                "Preparation countAmt",
                "Preparation countAmt #2",
            ],
        )

        correct_rows = [
            [
                "num-0",
                "Test1",
                None,
                None,
                None,
                "agent1-testspeciality - one",
                None,
                "Remarks for collection object 1 det 1",
                "Remarks for collection object 1 det 2",
                90,
                None,
            ],
            [
                "num-1",
                "Test2",
                "1234 Main St.",
                "6789 Main St.",
                "1420 Alumni Place",
                "agent2-testspecialty - one",
                "agent2-testspecialty - two",
                "Remarks for collection object 2 det 1",
                "Remarks for collection object 2 det 2",
                102,
                None,
            ],
            [
                "num-2",
                None,
                None,
                None,
                None,
                None,
                None,
                "Remarks for collection object 3 det 1",
                "Remarks for collection object 3 det 2",
                21,
                12,
            ],
            ["num-3", None, None, None, None, None, None, None, None, None, None],
            ["num-4", None, None, None, None, None, None, None, None, None, None],
        ]

        self.assertEqual(rows, correct_rows)

        correct_packs = [
            {
                "self": {
                    "id": self.collectionobjects[0].id,
                    "ordernumber": None,
                    "version": 0,
                },
                "to_one": {
                    "cataloger": {
                        "self": {
                            "id": self.agents_created[0].id,
                            "ordernumber": None,
                            "version": 0,
                        },
                        "to_many": {
                            "agentspecialties": [
                                {
                                    "self": {
                                        "id": agt1_sp1.id,
                                        "ordernumber": 0,
                                        "version": 0,
                                    }
                                },
                                None,
                            ]
                        },
                    }
                },
                "to_many": {
                    "determinations": [
                        {
                            "self": {
                                "id": co_1_det_1.id,
                                "ordernumber": None,
                                "version": 0,
                            }
                        },
                        {
                            "self": {
                                "id": co_1_det_2.id,
                                "ordernumber": None,
                                "version": 0,
                            }
                        },
                    ],
                    "preparations": [
                        {
                            "self": {
                                "id": co_1_prep_1.id,
                                "ordernumber": None,
                                "version": 0,
                            }
                        },
                        None,
                    ],
                },
            },
            {
                "self": {
                    "id": self.collectionobjects[1].id,
                    "ordernumber": None,
                    "version": 0,
                },
                "to_one": {
                    "cataloger": {
                        "self": {
                            "id": self.agents_created[1].id,
                            "ordernumber": None,
                            "version": 0,
                        },
                        "to_many": {
                            "addresses": [
                                {
                                    "self": {
                                        "id": ag2_add1.id,
                                        "ordernumber": None,
                                        "version": 0,
                                    }
                                },
                                {
                                    "self": {
                                        "id": ag2_add2.id,
                                        "ordernumber": None,
                                        "version": 0,
                                    }
                                },
                                {
                                    "self": {
                                        "id": ag2_add3.id,
                                        "ordernumber": None,
                                        "version": 0,
                                    }
                                },
                            ],
                            "agentspecialties": [
                                {
                                    "self": {
                                        "id": ag2_sp1.id,
                                        "ordernumber": 0,
                                        "version": 0,
                                    }
                                },
                                {
                                    "self": {
                                        "id": ag2_sp2.id,
                                        "ordernumber": 1,
                                        "version": 0,
                                    }
                                },
                            ],
                        },
                    }
                },
                "to_many": {
                    "determinations": [
                        {
                            "self": {
                                "id": co_2_det_1.id,
                                "ordernumber": None,
                                "version": 0,
                            }
                        },
                        {
                            "self": {
                                "id": co_2_det_2.id,
                                "ordernumber": None,
                                "version": 0,
                            }
                        },
                    ],
                    "preparations": [
                        {
                            "self": {
                                "id": co_2_prep_1.id,
                                "ordernumber": None,
                                "version": 0,
                            }
                        },
                        None,
                    ],
                },
            },
            {
                "self": {
                    "id": self.collectionobjects[2].id,
                    "ordernumber": None,
                    "version": 0,
                },
                "to_many": {
                    "determinations": [
                        {
                            "self": {
                                "id": co_3_det_1.id,
                                "ordernumber": None,
                                "version": 0,
                            }
                        },
                        {
                            "self": {
                                "id": co_3_det_2.id,
                                "ordernumber": None,
                                "version": 0,
                            }
                        },
                    ],
                    "preparations": [
                        {
                            "self": {
                                "id": co_3_prep_1.id,
                                "ordernumber": None,
                                "version": 0,
                            }
                        },
                        {
                            "self": {
                                "id": co_3_prep_2.id,
                                "ordernumber": None,
                                "version": 0,
                            }
                        },
                    ],
                },
            },
            {
                "self": {
                    "id": self.collectionobjects[3].id,
                    "ordernumber": None,
                    "version": 0,
                }
            },
            {
                "self": {
                    "id": self.collectionobjects[4].id,
                    "ordernumber": None,
                    "version": 0,
                }
            },
        ]

        self.assertEqual(correct_packs, packs)