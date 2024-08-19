from unittest.mock import patch
from specifyweb.context.remote_prefs import get_remote_prefs
from specifyweb.specify.func import Func
from specifyweb.specify.tests.test_api import get_table
from specifyweb.stored_queries.batch_edit import BatchEditPack, run_batch_edit_query
from specifyweb.stored_queries.queryfieldspec import QueryFieldSpec
from specifyweb.stored_queries.tests.test_batch_edit import QueryConstructionTests
from specifyweb.stored_queries.tests.tests import SQLAlchemySetup
from specifyweb.workbench.upload.preferences import DEFER_KEYS
from specifyweb.workbench.upload.tests.base import UploadTestsBase
from specifyweb.workbench.upload.upload import do_upload
from specifyweb.specify import auditcodes
from specifyweb.workbench.upload.upload_result import (
    Deleted,
    MatchedAndChanged,
    MatchedMultiple,
    NoChange,
    NullRecord,
    PropagatedFailure,
    ReportInfo,
    Uploaded,
    Updated,
    Matched, 
    UploadResult
)
from specifyweb.workbench.upload.upload_table import UploadTable
from specifyweb.workbench.views import regularize_rows
from ..upload_plan_schema import parse_column_options, parse_plan, schema

from jsonschema import validate  # type: ignore

from specifyweb.specify.models import Spauditlogfield, Collectionobject, Agent, Determination, Preparation, Collectingeventattribute, Collectingevent, Address, Agentspecialty

lookup_in_auditlog = lambda model, _id: get_table("Spauditlog").objects.filter(
    recordid=_id, tablenum=get_table(model).specify_model.tableId
)

def make_defer(match, null, force: DEFER_KEYS=None):
    def _defer(key: DEFER_KEYS):
        if force and key == DEFER_KEYS:
            raise Exception(f"Did not epect {key}")
        if key == 'match':
            return match
        elif key == 'null_check':
            return null
    return _defer

class UpdateTests(UploadTestsBase):

    def test_basic_save(self):
        plan_json = {
            "baseTableName": "collectionobject",
            "uploadable": {
                "uploadTable": {
                    "wbcols": {
                        "catalognumber": "Catno",
                        "integer1": "Reference Number",
                        "remarks": "Remarks field",
                    },
                    "static": {},
                    "toOne": {},
                    "toMany": {},
                }
            },
        }
        validate(plan_json, schema)
        plan = parse_plan(plan_json)
        data = [
            {"Catno": "1", "Reference Number": "10", "Remarks field": "Foo"},
            {"Catno": "2", "Reference Number": "8982", "Remarks field": "Bar"},
            {
                "Catno": "1029",
                "Remarks field": "FizzBuzz",
                "Reference Number": "",
            },
            {
                "Catno": "9024",
                "Remarks field": "Should be created",
                "Reference Number": "",
            },
            {"Catno": "89282", "Remarks field": "Reference", "Reference Number": "292"},
        ]
        co_0 = get_table("collectionobject").objects.create(
            catalognumber="1".rjust(9, "0"),
            integer1=10,  # This would be no change
            remarks="OriginalRemarks",
            collection=self.collection,
        )
        co_1 = get_table("collectionobject").objects.create(
            catalognumber="2".rjust(9, "0"),
            integer1=92,
            remarks="Foo",
            collection=self.collection,
        )
        co_2 = get_table("collectionobject").objects.create(
            catalognumber="1029".rjust(9, "0"),
            integer1=92,
            remarks="PaleoObject",
            collection=self.collection,
        )
        co_3 = get_table("collectionobject").objects.create(
            catalognumber="89282".rjust(9, "0"),
            integer1=292,
            remarks="Reference",
            collection=self.collection,
        )
        batch_edit_packs = [
            {"self": {"id": co_0.id, "version": 0, "ordernumber": None}},
            {"self": {"id": co_1.id, "version": 0, "ordernumber": None}},
            {"self": {"id": co_2.id, "version": 0, "ordernumber": None}},
            None,
            {"self": {"id": co_3.id, "version": 0, "ordernumber": None}},
        ]
        results = do_upload(
            self.collection,
            data,
            plan,
            self.agent.id,
            batch_edit_packs=batch_edit_packs,
        )
        for r in results[:3]:
            self.assertIsInstance(r.record_result, Updated)

        self.assertIsInstance(results[3].record_result, Uploaded)
        self.assertIsInstance(results[4].record_result, NoChange)

        co_0.refresh_from_db()
        co_1.refresh_from_db()
        co_2.refresh_from_db()
        co_3.refresh_from_db()

        self.assertEqual(co_0.integer1, 10)
        self.assertEqual(co_0.remarks, "Foo")

        self.assertEqual(co_1.integer1, 8982)
        self.assertEqual(co_1.remarks, "Bar")

        self.assertIsNone(co_2.integer1)
        self.assertEqual(co_2.remarks, "FizzBuzz")

        changed_columns = [
            ["Remarks field"],
            ["Reference Number", "Remarks field"],
            ["Reference Number", "Remarks field"],
        ]

        static_mapping = plan_json["uploadable"]["uploadTable"]["wbcols"]

        for _changed_columns, result in zip(changed_columns, results[:3]):
            self.assertCountEqual(result.record_result.info.columns, _changed_columns)
            co_entries = lookup_in_auditlog(
                "Collectionobject", result.record_result.get_id()
            )
            self.assertEqual(1, co_entries.count())
            entry = co_entries.first()
            self.assertEqual(auditcodes.UPDATE, entry.action)
            self.assertEqual(self.agent.id, entry.createdbyagent_id)
            log_fields = Spauditlogfield.objects.filter(spauditlog=entry)
            self.assertEqual(log_fields.count(), len(_changed_columns))
            for log_field in log_fields:
                self.assertTrue(static_mapping[log_field.fieldname] in _changed_columns)
                self.assertEqual(log_field.createdbyagent_id, self.agent.id)

        # The the non-modified record shouldn't be in the audit log
        self.assertEqual(
            0,
            lookup_in_auditlog(
                "Collectionobject", results[4].record_result.get_id()
            ).count(),
        )

class OneToOneUpdateTests(UploadTestsBase):
    def setUp(self):
        super().setUp()
        self.plan = UploadTable(
            name="Collectionobject",
            wbcols={
                "catalognumber": parse_column_options("catno"),
            },
            overrideScope=None,
            static={},
            toMany={},
            toOne={
                "collectionobjectattribute": UploadTable(
                    name="collectionobjectattribute",
                    wbcols={"number1": parse_column_options("number")},
                    static={},
                    toOne={},
                    toMany={},
                )
            },
        )
    
    def inserted_to_pack(self, inserted):
        return [
            {
                "self": {"id": co.id},
                "to_one": {
                    "collectionobjectattribute": {
                        "self": {
                            "id": coa.id
                        }
                    }
                }
                }
            for (co, coa) in inserted
        ]

    def make_co_coa_pair(self, data):
        inserted = []
        for record in data:
            coa = get_table("Collectionobjectattribute").objects.create(
                collectionmemberid=self.collection.id
            )
            co = get_table("Collectionobject").objects.create(
                collection=self.collection,
                catalognumber=record['catno'].zfill(9),
                collectionobjectattribute=coa
            )
            inserted.append((co, coa))
        return inserted

    def test_one_to_one_updates(self):
        plan = self.plan
        data = [
            {"catno": "9090", "number": "762"},
            {"catno": "9022", "number": "212"},
            {"catno": "1221", "number": "121"},
        ]

        inserted = self.make_co_coa_pair(data)
        batch_edit_pack = self.inserted_to_pack(inserted)

        self._update(inserted[0][1], {"number1": 102})
        self._update(inserted[1][1], {"number1": 212})
        self._update(inserted[2][1], {"number1": 874})

        co_to_create = get_table("Collectionobject").objects.create(
            collection=self.collection,
            catalognumber="88".zfill(9),
        )

        data = [*data, {"catno": "88", "number": "902"}]
        batch_edit_pack = [*batch_edit_pack, {"self": {"id": co_to_create.id}}]
        results = do_upload(
            self.collection, data, plan, self.agent.id, batch_edit_packs=batch_edit_pack
        )

        correct = [(NoChange, coa_result) for coa_result in [Updated, NoChange, Updated, Uploaded]]

        for _id, result in enumerate(zip(results, correct)):
            top, (co_result, coa_result) = result
            msg = f"failed at {_id}"
            self.assertIsInstance(top.record_result, co_result, msg)
            self.assertIsInstance(top.toOne['collectionobjectattribute'].record_result, coa_result, msg)
            coa_id = top.toOne['collectionobjectattribute'].record_result.get_id()
            # Do a fresh sync and assert that the relationship was truly established
            self.assertEqual(get_table("Collectionobject").objects.get(id=top.record_result.get_id()).collectionobjectattribute_id, coa_id)

    def test_one_to_one_deleting_no_hidden(self):
        
        # We don't epect matching to happen. Also, match is a lower "priority".
        # The code is smart enough to be as strict as possible when there is ambiguity. This tests that.
        for defer in [make_defer(match=True, null=False, force='match'), make_defer(match=True, null=True, force='match')]:

            data = [dict(catno="9090", number=''), dict(catno="22222", number=''), dict(catno="122", number='')]
            inserted = self.make_co_coa_pair(data)
            batch_edit_pack = self.inserted_to_pack(inserted)
            
            self._update(inserted[0][1], {"number1": 102})
            self._update(inserted[1][1], {"number1": 212})

            with patch('specifyweb.workbench.upload.preferences.should_defer_fields', new=defer):
                results = do_upload(
                    self.collection, data, self.plan, self.agent.id, batch_edit_packs=batch_edit_pack
                    )
                for result in results:
                    self.assertIsInstance(result.record_result, NoChange)
                    self.assertIsInstance(result.toOne['collectionobjectattribute'].record_result, Deleted)

            self.assertFalse(get_table("Collectionobjectattribute").objects.filter(id__in=[coa.id for coa in Func.second(inserted)]).exists())
            
            get_table('Collectionobject').objects.all().delete()
            get_table("Collectionobjectattribute").objects.all().delete()

    def test_one_to_one_deleting_hidden(self):

        def _make_data():
            data = [dict(catno="9090", number=''), dict(catno="22222", number=''), dict(catno="122", number='')]
            inserted = self.make_co_coa_pair(data)
            batch_edit_pack = self.inserted_to_pack(inserted)

            self._update(inserted[0][1], {"number1": 102, "number2": 212, "text22": "hidden value"})
            self._update(inserted[1][1], {"number1": 212, "number2": 764, "text22": "hidden value for coa"})
            self._update(inserted[2][1], {"number1": 874, "number6": 822, "text22": "hidden value for another coa"})

            return data, inserted, batch_edit_pack

        data, inserted, batch_edit_pack = _make_data()

        defer = make_defer(match=True, null=False, force='match')

        with patch('specifyweb.workbench.upload.preferences.should_defer_fields', new=defer):
            results = do_upload(
                self.collection, data, self.plan, self.agent.id, batch_edit_packs=batch_edit_pack
                )
            for result in results:
                self.assertIsInstance(result.record_result, NoChange)
                # Records cannot be deleted now
                self.assertIsInstance(result.toOne['collectionobjectattribute'].record_result, Updated)
        
        get_table('Collectionobject').objects.all().delete()
        get_table("Collectionobjectattribute").objects.all().delete()

        data, _, batch_edit_pack = _make_data()

        defer = make_defer(match=True, null=True, force='match')

        with patch('specifyweb.workbench.upload.preferences.should_defer_fields', new=defer):
            results = do_upload(
                self.collection, data, self.plan, self.agent.id, batch_edit_packs=batch_edit_pack
                )
            for result in results:
                self.assertIsInstance(result.record_result, NoChange)
                self.assertIsInstance(result.toOne['collectionobjectattribute'].record_result, Deleted)

        self.assertFalse(get_table("Collectionobjectattribute").objects.filter(id__in=[coa.id for coa in Func.second(inserted)]).exists())


# I can see why this might be a bad idea, but want to playaround with making unittests completely end-to-end at least for some type
# So we start from query and end with batch-edit results as the core focus of all these tests.
# This also allows for more complicated tests, with less manual work + self checking.  
class SQLUploadTests(QueryConstructionTests, UploadTestsBase):
    def setUp(self):
        super().setUp()

        get_table('Collectionobject').objects.all().delete()
        self.test_agent_1 = Agent.objects.create(firstname='John', lastname="Doe", division=self.division, agenttype=0)
        self.test_agent_2 = Agent.objects.create(firstname="Jame", division=self.division, agenttype=1)
        self.test_agent_3 = Agent.objects.create(firstname="Jame", lastname="Blo", division=self.division, agenttype=1)
        self.test_agent_4 = Agent.objects.create(firstname="John", lastname="Doe", division=self.division, agenttype=1)

        self.cea_1 = Collectingeventattribute.objects.create(integer1=78, discipline=self.discipline)
        self.ce_1 = Collectingevent.objects.create(stationfieldnumber="test_sfn_1", collectingeventattribute=self.cea_1, discipline=self.discipline, remarks="hidden value")

        self.cea_2 = Collectingeventattribute.objects.create(integer1=22, discipline=self.discipline)
        self.ce_2 = Collectingevent.objects.create(stationfieldnumber="test_sfn_2", collectingeventattribute=self.cea_2, discipline=self.discipline, remarks="hidden value2")

        self.co_1 = Collectionobject.objects.create(catalognumber="7924".zfill(9), cataloger=self.test_agent_1, remarks="test_field", collectingevent=self.ce_1, collection=self.collection)
        self.co_2 = Collectionobject.objects.create(catalognumber="0102".zfill(9), cataloger=self.test_agent_1, remarks="some remarks field", collectingevent=self.ce_1, collection=self.collection)
        self.co_3 = Collectionobject.objects.create(catalognumber="1122".zfill(9), cataloger=self.test_agent_2, remarks="remarks for collection", collectingevent=self.ce_2, collection=self.collection)

        self.co_1_prep_1 = Preparation.objects.create(collectionobject=self.co_1, text1="Value for preparation", countamt=20, preptype=self.preptype)
        self.co_1_prep_2 = Preparation.objects.create(collectionobject=self.co_1, text1="Second value for preparation", countamt=5, preptype=self.preptype)
        self.co_1_prep_3 = Preparation.objects.create(collectionobject=self.co_1, text1="Third value for preparation", countamt=88, preptype=self.preptype)
        
        self.co_2_prep_1 = Preparation.objects.create(collectionobject=self.co_2, text1="Value for preparation for second CO", countamt=89, preptype=self.preptype)
        self.co_2_prep_2 = Preparation.objects.create(collectionobject=self.co_2, countamt=27, preptype=self.preptype)
        
        self.co_3_prep_1 = Preparation.objects.create(collectionobject=self.co_3, text1="Needs to be deleted", preptype=self.preptype)

    def _build_props(self, query_fields, base_table):
        raw = self.build_props(query_fields, base_table)
        raw['session_maker'] = SQLUploadTests.test_session_context
        return raw

    def enforcer(self, result: UploadResult, valid_results=[NoChange, NullRecord, Matched]):
        self.assertTrue(any(isinstance(result.record_result, valid) for valid in valid_results), f"Failed for {result.record_result}")
        to_one = list([self.enforcer(result) for result in result.toOne.values()])
        to_many = list([self.enforcer(result) for result in _results] for _results in result.toMany.values())
    
    def test_no_op(self):
        query_paths = [
            ['catalognumber'],
            ['integer1'],
            ['cataloger', 'firstname'],
            ['cataloger', 'lastname'],
            ['preparations', 'countamt'],
            ['preparations', 'text1'],
            ['collectingevent', 'stationfieldnumber'],
            ['collectingevent', 'collectingeventattribute', 'integer1']
        ]
        added = [('Collectionobject', *path) for path in query_paths]

        query_fields = [
            BatchEditPack._query_field(QueryFieldSpec.from_path(path), 0)
            for path in added
        ]

        props = self._build_props(query_fields, "Collectionobject")

        (headers, rows, packs, plan_json, _) = run_batch_edit_query(props)

        regularized_rows = regularize_rows(len(headers), rows)

        dicted = [dict(zip(headers, row)) for row in regularized_rows]

        validate(plan_json, schema)
        plan = parse_plan(plan_json)

        results = do_upload(
            self.collection, dicted, plan, self.agent.id, batch_edit_packs=packs
        )

        # We didn't change anything, nothing should change. verify just that
        list([self.enforcer(result) for result in results])

    def enforce_created_in_log(self, record_id, table):
        entries = lookup_in_auditlog(table, record_id)
        self.assertEqual(1, entries.count())
        entry = entries.first()
        self.assertEqual(entry.action, auditcodes.INSERT)

    def query_to_results(self, base_table, query_paths):
        added = [(base_table, *path) for path in query_paths]

        query_fields = [
            BatchEditPack._query_field(QueryFieldSpec.from_path(path), 0)
            for path in added
        ]

        props = self._build_props(query_fields, base_table)

        (headers, rows, packs, plan_json, _) = run_batch_edit_query(props)

        validate(plan_json, schema)
        plan = parse_plan(plan_json)

        regularized_rows = regularize_rows(len(headers), rows)


        return (headers, regularized_rows, packs, plan)


    def test_to_one_cloned(self):
        query_paths = [
            ['catalognumber'],
            ['integer1'],
            ['collectingevent', 'stationfieldnumber'],
        ]
        added = [('Collectionobject', *path) for path in query_paths]

        query_fields = [
            BatchEditPack._query_field(QueryFieldSpec.from_path(path), 0)
            for path in added
        ]

        props = self._build_props(query_fields, "Collectionobject")

        (headers, rows, pack, plan_json, _) = run_batch_edit_query(props)

        validate(plan_json, schema)
        plan = parse_plan(plan_json)

        regularized_rows = regularize_rows(len(headers), rows)

        dicted = [dict(zip(headers, row)) for row in regularized_rows]

        data = [
            {'CollectionObject catalogNumber': '7924'.zfill(9), 'CollectionObject integer1': '', 'CollectingEvent stationFieldNumber': 'test_sfn_4'},
            {'CollectionObject catalogNumber': '102'.zfill(9), 'CollectionObject integer1': '', 'CollectingEvent stationFieldNumber': 'test_sfn_1'},
            {'CollectionObject catalogNumber': '1122'.zfill(9), 'CollectionObject integer1': '', 'CollectingEvent stationFieldNumber': 'test_sfn_2'}
            ]
        
        results = do_upload(
            self.collection, data, plan, self.agent.id, batch_edit_packs=pack
        )

        list([self.enforcer(result) for result in results[1:]])

        self.assertIsInstance(results[0].record_result, NoChange)
        self.assertIsInstance(results[0].toOne['collectingevent'].record_result, Uploaded)

        ce_created_id = results[0].toOne['collectingevent'].record_result.get_id()
        ce_created = Collectingevent.objects.get(id=ce_created_id)

        self.assertEqual(ce_created.remarks, self.ce_1.remarks)
        self.assertNotEqual(ce_created.collectingeventattribute_id, self.ce_1.collectingeventattribute_id)

        self.assertEqual(ce_created.collectingeventattribute.integer1, self.cea_1.integer1)

        self.enforce_created_in_log(ce_created_id, "collectingevent")
        self.enforce_created_in_log(ce_created.collectingeventattribute.id, "collectingeventattribute")
    
    def _run_matching_test(self):
        co_4 = Collectionobject.objects.create(catalognumber="1000".zfill(9), collection=self.collection)
        co_5 = Collectionobject.objects.create(catalognumber="1024".zfill(9), collection=self.collection)

        query_paths = [
            ['catalognumber'],
            ['cataloger', 'firstname'],
            ['cataloger', 'lastname']
        ]

        (headers, rows, pack, plan) = self.query_to_results('collectionobject', query_paths)

        dicted = [dict(zip(headers, row)) for row in rows]

        data = [
            {'CollectionObject catalogNumber': '7924'.zfill(9), 'Agent firstName': 'John', 'Agent lastName': 'Doe'},
            {'CollectionObject catalogNumber': '102'.zfill(9), 'Agent firstName': 'John', 'Agent lastName': 'Doe'},
            {'CollectionObject catalogNumber': '1122'.zfill(9), 'Agent firstName': 'John', 'Agent lastName': 'Doe'}, # This won't be matched in-case of non-defer to the first agent, because of differing agent types
            {'CollectionObject catalogNumber': '1000'.zfill(9), 'Agent firstName': 'NewAgent', 'Agent lastName': ''},
            {'CollectionObject catalogNumber': '1024'.zfill(9), 'Agent firstName': 'NewAgent', 'Agent lastName': ''}
            ]
        
        results = do_upload(self.collection, data, plan, self.agent.id, batch_edit_packs=pack)
        return results


    def test_matching_without_defer(self):

        defer = make_defer(match=False, null=False)

        with patch('specifyweb.workbench.upload.preferences.should_defer_fields', new=defer):
            results = self._run_matching_test()

        list([self.enforcer(result) for result in results[:2]])

        self.assertIsInstance(results[2].record_result, NoChange)
        cataloger_0 = results[2].toOne['cataloger'].record_result
        self.assertIsInstance(cataloger_0, MatchedAndChanged)

        self.assertIsInstance(results[-2].record_result, NoChange)
        cataloger_1 = results[-2].toOne['cataloger'].record_result
        self.assertIsInstance(cataloger_1, Uploaded)

        self.assertIsInstance(results[-1].record_result, NoChange)
        cataloger_2 = results[-1].toOne['cataloger'].record_result
        self.assertIsInstance(cataloger_2, MatchedAndChanged)

        self.assertEqual(cataloger_0.get_id(), self.test_agent_4.id)
        self.assertEqual(cataloger_2.get_id(), cataloger_1.get_id())

    def test_matching_with_defer(self):
        defer = make_defer(match=True, null=True) # null doesn't matter, can be true or false

        with patch('specifyweb.workbench.upload.preferences.should_defer_fields', new=defer):
            results = self._run_matching_test()

        list([self.enforcer(result) for result in results[:2]])

        self.assertIsInstance(results[2].record_result, PropagatedFailure)
        cataloger_0 = results[2].toOne['cataloger'].record_result
        self.assertIsInstance(cataloger_0, MatchedMultiple)

        self.assertIsInstance(results[-2].record_result, NoChange)
        cataloger_1 = results[-2].toOne['cataloger'].record_result
        self.assertIsInstance(cataloger_1, Uploaded)

        self.assertIsInstance(results[-1].record_result, NoChange)
        cataloger_2 = results[-1].toOne['cataloger'].record_result
        self.assertIsInstance(cataloger_2, MatchedAndChanged)

        self.assertTrue(self.test_agent_1.id in cataloger_0.ids and self.test_agent_4.id in cataloger_0.ids)
        self.assertEqual(cataloger_2.get_id(), cataloger_1.get_id())
    
    def test_bidirectional_to_many(self):
        agt_1_add_1 = Address.objects.create(address="testaddress1", agent=self.test_agent_1)
        agt_1_add_2 = Address.objects.create(address="testaddress2", agent=self.test_agent_1)

        agt_1_spec_1 = Agentspecialty.objects.create(specialtyname="specialty1", agent=self.test_agent_1)
        agt_1_spec_2 = Agentspecialty.objects.create(specialtyname="specialty2", agent=self.test_agent_1)

        query_paths = [
            ['integer1'],
            ['cataloger', 'firstname'],
            ['cataloger', 'lastname'],
            ['cataloger', 'addresses', 'address'],
            ['preparations', 'countamt'],
            ['preparations', 'text1']
        ]

        (headers, rows, pack, plan) = self.query_to_results('collectionobject', query_paths)

        dicted = [dict(zip(headers, row)) for row in rows]

        # original_data = [
        #     {'CollectionObject integer1': '', 'Agent firstName': 'John', 'Agent lastName': 'Doe', 'Address address': 'testaddress1', 'Address address #2': 'testaddress2', 'Preparation countAmt': '20', 'Preparation text1': 'Value for preparation', 'Preparation countAmt #2': '5', 'Preparation text1 #2': 'Second value for preparation', 'Preparation countAmt #3': '88', 'Preparation text1 #3': 'Third value for preparation'},
        #     {'CollectionObject integer1': '', 'Agent firstName': 'John', 'Agent lastName': 'Doe', 'Address address': 'testaddress1', 'Address address #2': 'testaddress2', 'Preparation countAmt': '89', 'Preparation text1': 'Value for preparation for second CO', 'Preparation countAmt #2': '27', 'Preparation text1 #2': '', 'Preparation countAmt #3': '', 'Preparation text1 #3': ''}, 
        #     {'CollectionObject integer1': '', 'Agent firstName': 'Jame', 'Agent lastName': '', 'Address address': '', 'Address address #2': '', 'Preparation countAmt': '', 'Preparation text1': 'Needs to be deleted', 'Preparation countAmt #2': '', 'Preparation text1 #2': '', 'Preparation countAmt #3': '', 'Preparation text1 #3': ''}
        #     ]

        data = [
            {'CollectionObject integer1': '', 'Agent firstName': 'John', 'Agent lastName': 'Doe', 'Address address': 'testaddress1 changed', 'Address address #2': 'testaddress2', 'Preparation countAmt': '20', 'Preparation text1': 'Value for prep changed', 'Preparation countAmt #2': '5', 'Preparation text1 #2': 'Second value for preparation', 'Preparation countAmt #3': '88', 'Preparation text1 #3': 'Third value for preparation'},
            {'CollectionObject integer1': '', 'Agent firstName': 'John', 'Agent lastName': 'Dave', 'Address address': 'testaddress1', 'Address address #2': 'testaddress2', 'Preparation countAmt': '89', 'Preparation text1': 'Value for preparation for second CO', 'Preparation countAmt #2': '27', 'Preparation text1 #2': '', 'Preparation countAmt #3': '9999', 'Preparation text1 #3': 'Value here was modified'}, 
            {'CollectionObject integer1': '', 'Agent firstName': 'Jame', 'Agent lastName': '', 'Address address': '', 'Address address #2': '', 'Preparation countAmt': '', 'Preparation text1': '', 'Preparation countAmt #2': '', 'Preparation text1 #2': '', 'Preparation countAmt #3': '', 'Preparation text1 #3': ''}
            ]
        
        results = do_upload(self.collection, data, plan, self.agent.id, batch_edit_packs=pack)

        print(results)
    
    def test_to_many_match_is_possible(self):

        defer = make_defer(match=False, null=True)

        agt_1_add_1 = Address.objects.create(address="testaddress1", agent=self.test_agent_1)
        agt_1_add_2 = Address.objects.create(address="testaddress2", agent=self.test_agent_1)

        agt_2_add_1 = Address.objects.create(address="testaddress4", agent=self.test_agent_2)
        agt_2_add_2 = Address.objects.create(address="testaddress5", agent=self.test_agent_2)

        query_paths = [
            ['integer1'],
            ['cataloger', 'firstname'],
            ['cataloger', 'lastname'],
            ['cataloger', 'addresses', 'address'],
            ['cataloger', 'agenttype']
        ]

        
        (headers, rows, pack, plan) = self.query_to_results('collectionobject', query_paths)

        dicted = [dict(zip(headers, row)) for row in rows]
        
        # original_data = [
        #     {'CollectionObject integer1': '', 'Agent firstName': 'John', 'Agent lastName': 'Doe', 'Agent agentType': 'Organization', 'Address address': 'testaddress1', 'Address address #2': 'testaddress2'},
        #     {'CollectionObject integer1': '', 'Agent firstName': 'John', 'Agent lastName': 'Doe', 'Agent agentType': 'Organization', 'Address address': 'testaddress1', 'Address address #2': 'testaddress2'},
        #     {'CollectionObject integer1': '', 'Agent firstName': 'Jame', 'Agent lastName': '', 'Agent agentType': 'Person', 'Address address': 'testaddress4', 'Address address #2': 'testaddress5'}
        #     ]
        
        # Here is a (now resolved) bug below. We need to remove the reverse relationship in predicates for this to match, no way around that.
        # Otherwise, it'd be impossible to match third agent to first (agent on row1 and row2 are same), in deferForMatch=False

        data = [
            {'CollectionObject integer1': '', 'Agent firstName': 'John', 'Agent lastName': 'Doe', 'Agent agentType': 'Organization', 'Address address': 'testaddress1', 'Address address #2': 'testaddress2'},
            {'CollectionObject integer1': '', 'Agent firstName': 'John', 'Agent lastName': 'Doe', 'Agent agentType': 'Organization', 'Address address': 'testaddress1', 'Address address #2': 'testaddress2'},
            {'CollectionObject integer1': '', 'Agent firstName': 'John', 'Agent lastName': 'Doe', 'Agent agentType': 'Organization', 'Address address': 'testaddress1', 'Address address #2': 'testaddress2'}
            ]
        
        with patch('specifyweb.workbench.upload.preferences.should_defer_fields', new=defer):
            results = do_upload(
                self.collection, data, plan, self.agent.id, batch_edit_packs=pack
            )
        
        list([self.enforcer(record) for record in results[:2]])

        self.assertIsInstance(results[2].toOne['cataloger'].record_result, MatchedAndChanged)
        self.assertEqual(results[2].toOne['cataloger'].record_result.get_id(), self.test_agent_1.id)
