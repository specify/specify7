"""
Tests for py
"""

import json
from unittest import skip
from datetime import datetime
from django.db.models import Max, QuerySet
from django.test import TestCase, Client, TransactionTestCase

from specifyweb.backend.permissions.models import UserPolicy
from specifyweb.specify import models
from specifyweb.backend.businessrules.uniqueness_rules import UNIQUENESS_DISPATCH_UID, validate_unique, apply_default_uniqueness_rules
from specifyweb.backend.businessrules.rules.cogtype_rules import SYSTEM_COGTYPES_PICKLIST
from specifyweb.backend.businessrules.orm_signal_handler import connect_signal, disconnect_signal
from specifyweb.specify.api.crud import create_obj, delete_resource, get_collection, get_resource, post_resource, update_obj
from specifyweb.specify.api.exceptions import MissingVersionException, RecordSetException, StaleObjectException
from specifyweb.specify.models_utils.model_extras import Specifyuser
from specifyweb.specify.models import (
    Institution,
    Division,
    Geologictimeperiodtreedef,
    Geographytreedef,
    Taxontreedef,
    Datatype,
    Discipline,
    Collection,
    Collectingevent,
    Collectionobject,
    Collectionobjectattribute,
    Preptype,
    Agent,
    Specifyuser,
    Collectionobjectgrouptype,
    Collectionobjecttype,
    Recordset,
    Disposal,
    Loan,
    Accession,
    Picklist,
    Picklistitem,
    Preparation
)
import datetime

from specifyweb.specify.models_utils.relationships import get_recordset_info, get_related_or_none
from specifyweb.specify.api.serializers import obj_to_data, uri_for_model
from specifyweb.specify.utils import scoping

def get_table(name: str):
    return getattr(models, name.capitalize())

class MockDateTime:

    @classmethod
    def now(cls):
        return datetime.datetime(2025, 7, 20, 18, 23, 32)

class MainSetupTearDown:
    def setUp(self):
        disconnect_signal('pre_save', None, dispatch_uid=UNIQUENESS_DISPATCH_UID)
        connect_signal('pre_save', validate_unique, None, dispatch_uid=UNIQUENESS_DISPATCH_UID)
        self.institution = Institution.objects.create(
            name='Test Institution',
            isaccessionsglobal=True,
            issecurityon=False,
            isserverbased=False,
            issharinglocalities=True,
            issinglegeographytree=True,
        )

        self.division = Division.objects.create(
            institution=self.institution,
            name='Test Division')

        self.geologictimeperiodtreedef = Geologictimeperiodtreedef.objects.create(
            name='Test gtptd')

        self.geographytreedef = Geographytreedef.objects.create(
            name='Test gtd')

        self.geographytreedef.treedefitems.create(name="Planet", rankid="0")

        self.taxontreedef = Taxontreedef.objects.create(name='Test ttd')

        self.datatype = Datatype.objects.create(
            name='Test datatype')

        self.discipline = Discipline.objects.create(
            geologictimeperiodtreedef=self.geologictimeperiodtreedef,
            geographytreedef=self.geographytreedef,
            division=self.division,
            datatype=self.datatype,
            type='paleobotany'
        )

        apply_default_uniqueness_rules(self.discipline)

        self.collection = Collection.objects.create(
            catalognumformatname='test',
            collectionname='TestCollection',
            isembeddedcollectingevent=False,
            discipline=self.discipline,
        )

        self.specifyuser = Specifyuser.objects.create(
            isloggedin=False,
            isloggedinreport=False,
            name="testuser",
            password="205C0D906445E1C71CA77C6D714109EB6D582B03A5493E4C")  # testuser

        self._add_user_policy(self.specifyuser)

        self.agent = Agent.objects.create(
            agenttype=0,
            firstname="Test",
            lastname="User",
            division=self.division,
            specifyuser=self.specifyuser,
        )

        self.collectingevent = Collectingevent.objects.create(
            discipline=self.discipline)

        self.collectionobjecttype = Collectionobjecttype.objects.create(
            name="Test", collection=self.collection, taxontreedef=self.taxontreedef
        )
        
        def make_co(num: int):
            return [
                models.Collectionobject.objects.create(
                    collection=self.collection, 
                    catalognumber="num-%d" % i,
                    collectionobjecttype=self.collectionobjecttype,
                )
                for i in range(num)
            ]

        self.collectionobjects = make_co(5)
        self.make_co = make_co

        def _update(obj, kwargs):
            for key, value in kwargs.items():
                setattr(obj, key, value)
            obj.save()

        self._update = _update
    
    def _create_prep_type(self):
        self.prep_type = Preptype.objects.create(
                name="testPrepType",
                isloanable=False,
                collection=self.collection,
            )

    def _create_prep(self, co, prep_list, **prep_kwargs):

        if 'preptype' not in prep_kwargs:
            prep_kwargs['preptype'] = self.prep_type

        prep = Preparation.objects.create(
            collectionobject=co, **prep_kwargs
        )
        if prep_list is not None:
            prep_list.append(prep)
        return prep

    def _assertStatusCodeEqual(self, response, status_code):
        self.assertEqual(response.status_code, status_code, f"ERROR: {response.content.decode()}")

    def _assertContentEqual(self, response, expected_content):
        self.assertEqual(response.content.decode(), expected_content)

    def _add_user_policy(self, specifyuser):
        UserPolicy.objects.create(
                collection=None,
                specifyuser=specifyuser,
                resource="%",
                action="%",
            )

    # TODO: Replace all such tests with below.
    def assertExists(self, queryset: QuerySet):
        self.assertTrue(queryset.exists(), "Record does not exist!")

class ApiTests(MainSetupTearDown, TestCase): pass

# This test gets used when there are some transactional behavior that needs to be tested
class ApiTransactionTests(MainSetupTearDown, TransactionTestCase): pass

skip_perms_check = lambda x: None


class SimpleApiTests(ApiTests):

    def test_get_collection(self):
        data = get_collection(self.collection, "collectionobject", skip_perms_check)
        self.assertEqual(data["meta"]["total_count"], len(self.collectionobjects))
        self.assertEqual(len(data["objects"]), len(self.collectionobjects))
        ids = [obj["id"] for obj in data["objects"]]
        for co in self.collectionobjects:
            self.assertTrue(co.id in ids)

    def test_get_resouce(self):
        data = get_resource("institution", self.institution.id, skip_perms_check)
        self.assertEqual(data["id"], self.institution.id)
        self.assertEqual(data["name"], self.institution.name)

    def test_create_object(self):
        obj = create_obj(self.collection, self.agent, 'collectionobject', {
                'collection': uri_for_model('collection', self.collection.id),
                'catalognumber': 'foobar'})
        obj = Collectionobject.objects.get(id=obj.id)
        self.assertTrue(obj.id is not None)
        self.assertEqual(obj.collection, self.collection)
        self.assertEqual(obj.catalognumber, "foobar")
        self.assertEqual(obj.createdbyagent, self.agent)

    def test_update_object(self):
        data = get_resource('collection', self.collection.id, skip_perms_check)
        data['collectionname'] = 'New Name'
        update_obj(self.collection, self.agent, 'collection',
                       data['id'], data['version'], data)
        obj = Collection.objects.get(id=self.collection.id)
        self.assertEqual(obj.collectionname, 'New Name')

    def test_delete_object(self):
        obj = create_obj(self.collection, self.agent, 'collectionobject', {
                'collection': uri_for_model('collection', self.collection.id),
                'catalognumber': 'foobar'})
        delete_resource(self.collection, self.agent, 'collectionobject', obj.id, obj.version)
        self.assertEqual(Collectionobject.objects.filter(id=obj.id).count(), 0)

class RecordSetTests(ApiTests):
    def setUp(self):
        super().setUp()
        self.recordset = Recordset.objects.create(
            collectionmemberid=self.collection.id,
            dbtableid=Collectionobject.specify_model.tableId,
            name="Test recordset",
            type=0,
            specifyuser=self.specifyuser,
        )

    def test_post_resource(self):
        obj = post_resource(
            self.collection,
            self.agent,
            "collectionobject",
            {
                "collection": uri_for_model("collection", self.collection.id),
                "catalognumber": "foobar",
            },
            recordsetid=self.recordset.id,
        )
        self.assertEqual(
            self.recordset.recordsetitems.filter(recordid=obj.id).count(), 1
        )

    @skip(
        "errors because of many-to-many stuff checking if Agent is admin. should test with different model."
    )
    def test_post_bad_resource(self):
        with self.assertRaises(RecordSetException) as cm:
            obj = post_resource(
                self.collection,
                self.agent,
                "Agent",
                {
                    "agenttype": 0,
                    "lastname": "MonkeyWrench",
                    "division": uri_for_model("division", self.division.id),
                },
                recordsetid=self.recordset.id,
            )
        self.assertEqual(
            models.Agent.objects.filter(lastname="MonkeyWrench").count(), 0
        )

    @skip(
        "errors because of many-to-many stuff checking if Agent is admin. should test with different model."
    )
    def test_post_resource_to_bad_recordset(self):
        max_id = Recordset.objects.aggregate(Max('id'))['id__max']
        with self.assertRaises(RecordSetException) as cm:
            obj = post_resource(self.collection, self.agent, 'Agent',
                                    {'agenttype': 0,
                                     'lastname': 'Pitts',
                                     'division': uri_for_model('division', self.division.id)},
                                    recordsetid=max_id + 100)
        self.assertEqual(Agent.objects.filter(lastname='Pitts').count(), 0)

    def test_remove_from_recordset_on_delete(self):
        ids = [co.id for co in self.collectionobjects]

        for id in ids:
            self.recordset.recordsetitems.create(recordid=id)

        counts = {
            self.recordset.recordsetitems.filter(recordid=id).count() for id in ids
        }
        self.assertEqual(counts, {1})

        for co in self.collectionobjects:
            co.delete()

        counts = {
            self.recordset.recordsetitems.filter(recordid=id).count() for id in ids
        }
        self.assertEqual(counts, {0})

    def test_get_resource_with_recordset_info(self):
        data = get_resource(
            "collectionobject", self.collectionobjects[0].id, skip_perms_check
        )
        self.assertFalse(hasattr(data, "recordset_info"))

        data = get_resource(
            "collectionobject",
            self.collectionobjects[0].id,
            skip_perms_check,
            self.recordset.id,
        )
        self.assertEqual(data["recordset_info"], None)

        self.recordset.recordsetitems.create(recordid=self.collectionobjects[0].id)

        data = get_resource(
            "collectionobject",
            self.collectionobjects[0].id,
            skip_perms_check,
            self.recordset.id,
        )
        self.assertEqual(data["recordset_info"]["recordsetid"], self.recordset.id)

    def test_update_object(self):
        data = get_resource(
            "collectionobject",
            self.collectionobjects[0].id,
            skip_perms_check,
            self.recordset.id,
        )
        self.assertEqual(data["recordset_info"], None)

        obj = update_obj(
            self.collection,
            self.agent,
            "collectionobject",
            data["id"],
            data["version"],
            data,
        )

    def test_get_recordset_info(self):
        ids = [co.id for co in self.collectionobjects]

        for id in ids:
            self.recordset.recordsetitems.create(recordid=id)

        for i, co in enumerate(self.collectionobjects):
            info = get_recordset_info(co, self.recordset.id)
            self.assertEqual(info["recordsetid"], self.recordset.id)
            self.assertEqual(info["total_count"], len(self.collectionobjects))
            self.assertEqual(info["index"], i)
            self.assertEqual(
                info["previous"],
                (
                    None
                    if i == 0
                    else uri_for_model(
                        "collectionobject", self.collectionobjects[i - 1].id
                    )
                ),
            )

            self.assertEqual(
                info["next"],
                (
                    None
                    if i == len(self.collectionobjects) - 1
                    else uri_for_model(
                        "collectionobject", self.collectionobjects[i + 1].id
                    )
                ),
            )

    def test_no_recordset_info(self):
        info = get_recordset_info(self.collectionobjects[0], self.recordset.id)
        self.assertEqual(info, None)

    def test_recordsetitem_ordering(self):
        ids = [co.id for co in self.collectionobjects]
        ids.sort()
        ids.reverse()

        for id in ids:
            self.recordset.recordsetitems.create(recordid=id)

        rsis = get_collection(
            self.collection,
            "recordsetitem",
            skip_perms_check,
            params={"recordset": self.recordset.id},
        )

        result_ids = [rsi["recordid"] for rsi in rsis["objects"]]
        ids.sort()
        self.assertEqual(result_ids, ids)

    def test_deleting_recordset_deletes_items(self):
        ids = [co.id for co in self.collectionobjects]

        for id in ids:
            self.recordset.recordsetitems.create(recordid=id)

        recordset = Recordset.objects.get(id=self.recordset.id)
        self.assertNotEqual(recordset.recordsetitems.count(), 0)

        # shouldn't throw integrity exception
        recordset.delete()

        with self.assertRaises(Recordset.DoesNotExist) as cm:
            recordset = Recordset.objects.get(id=self.recordset.id)


class ApiRelatedFieldsTests(ApiTests):
    def test_get_to_many_uris_with_regular_othersidename(self):
        data = get_resource(
            "collectingevent", self.collectingevent.id, skip_perms_check
        )
        self.assertEqual(
            data["collectionobjects"],
            uri_for_model("collectionobject")
            + "?collectingevent=%d" % self.collectingevent.id,
        )

    def test_get_to_many_uris_with_special_othersidename(self):
        data = get_resource("agent", self.agent.id, skip_perms_check)

        # This one is actually a regular othersidename
        self.assertEqual(
            data["collectors"],
            uri_for_model("collector") + "?agent=%d" % self.agent.id,
        )

        # This one is the special otherside name ("organization" instead of "agent")
        self.assertEqual(
            data["orgmembers"],
            uri_for_model("agent") + "?organization=%d" % self.agent.id,
        )


class VersionCtrlApiTests(ApiTests):
    def test_bump_version(self):
        data = get_resource("collection", self.collection.id, skip_perms_check)
        data["collectionname"] = "New Name"
        obj = update_obj(
            self.collection, self.agent, "collection", data["id"], data["version"], data
        )
        self.assertEqual(obj.version, data["version"] + 1)

    def test_update_object(self):
        data = get_resource("collection", self.collection.id, skip_perms_check)
        data["collectionname"] = "New Name"
        self.collection.version += 1
        self.collection.save()
        with self.assertRaises(StaleObjectException) as cm:
            update_obj(
                self.collection,
                self.agent,
                "collection",
                data["id"],
                data["version"],
                data,
            )
        data = get_resource("collection", self.collection.id, skip_perms_check)
        self.assertNotEqual(data["collectionname"], "New Name")

    def test_delete_object(self):
        obj = create_obj(
            self.collection,
            self.agent,
            "collectionobject",
            {
                "collection": uri_for_model("collection", self.collection.id),
                "catalognumber": "foobar",
            },
        )
        data = get_resource("collectionobject", obj.id, skip_perms_check)
        obj.version += 1
        obj.save()
        with self.assertRaises(StaleObjectException) as cm:
            delete_resource(self.collection, self.agent, 'collectionobject', data['id'], data['version'])
        self.assertEqual(Collectionobject.objects.filter(id=obj.id).count(), 1)

    def test_missing_version(self):
        data = get_resource("collection", self.collection.id, skip_perms_check)
        data["collectionname"] = "New Name"
        self.collection.version += 1
        self.collection.save()
        with self.assertRaises(MissingVersionException) as cm:
            update_obj(
                self.collection, self.agent, "collection", data["id"], None, data
            )


        self.assertFalse(models.Collectionobject.objects.filter(catalognumber=redundant_catalog_number).exists())

class InlineApiRemoteToOneTests(ApiTests): 
    def setUp(self): 
        super().setUp()
        cog_type_picklist = Picklist.objects.create(
            name=SYSTEM_COGTYPES_PICKLIST,
            issystem=True,
            type=0,
            readonly=True,
            collection=self.collection
        )
        Picklistitem.objects.create(
            title='Discrete',
            value='Discrete',
            picklist=cog_type_picklist
        )
        self.cogtype = models.Collectionobjectgrouptype.objects.create(
            name="Discrete", type="Discrete", collection=self.collection
        )
        self.cog_parent = models.Collectionobjectgroup.objects.create(
            name="Parent",
            cogtype=self.cogtype,
            collection=self.collection,
        )

    def test_setting_remote_to_one_from_new(self):
        co_data = {
            "catalognumber": f'num-{len(self.collectionobjects)}',
            "cojo": {
                "isPrimary": True,
                "isSubstrate": False,
                "parentCog": uri_for_model("Collectionobjectgroup", self.cog_parent.id)
            },
            'collection': uri_for_model('Collection', self.collection.id),
        }
        co = create_obj(self.collection, self.agent, "Collectionobject", co_data)
        cojo = models.Collectionobjectgroupjoin.objects.get(parentcog_id=self.cog_parent.id, childco=co)
        self.assertEqual(co.cojo, cojo)
    
    def test_setting_remote_to_one_from_existing(self): 
        existing_co = self.collectionobjects[0]
        co_data = {
            **obj_to_data(existing_co),
            "cojo": {
                "isPrimary": True,
                "isSubstrate": False,
                "parentCog": uri_for_model("Collectionobjectgroup", self.cog_parent.id)
            },
        }
        co = update_obj(self.collection, self.agent, "Collectionobject", existing_co.id, existing_co.version, co_data)
        cojo = models.Collectionobjectgroupjoin.objects.get(parentcog_id=self.cog_parent.id, childco=co)
        self.assertEqual(co.cojo, cojo)

    def test_creating_independent_from_remote_one_to_one(self):
        new_parent_name = "ParentTwo"
        co_data = {
            "catalognumber": f'num-{len(self.collectionobjects)}',
            "cojo": {
                "isPrimary": True,
                "isSubstrate": False,
                "parentCog": {
                    "name": new_parent_name,
                    "cogtype": uri_for_model("Collectionobjectgrouptype", self.cogtype.id),
                    'collection': uri_for_model('Collection', self.collection.id)
                }
            },
            'collection': uri_for_model('Collection', self.collection.id),
        }
        co = create_obj(self.collection, self.agent, "Collectionobject", co_data)
        cojo = models.Collectionobjectgroupjoin.objects.get(parentcog__name=new_parent_name, childco=co)

        self.assertEqual(co.cojo, cojo)
        self.assertEqual(co.cojo.parentcog.name, new_parent_name)

    def test_unsetting_dependent_remote_one_to_one(self): 
        existing_co = self.collectionobjects[1]
        cojo = models.Collectionobjectgroupjoin.objects.create(isprimary=False, parentcog=self.cog_parent,childco=existing_co)
        existing_co.refresh_from_db()
        self.assertEqual(existing_co.cojo, cojo)
        co_data = {
            **obj_to_data(existing_co),
            "cojo": None,
        }
        co = update_obj(self.collection, self.agent, "Collectionobject", existing_co.id, existing_co.version, co_data)
        self.assertIsNone(get_related_or_none(co, "cojo"))
        self.assertFalse(models.Collectionobjectgroupjoin.objects.filter(childco_id=co.id).exists())
    
    # version control on inlined resources should be tested


class UserApiTests(ApiTests):
    def setUp(self):
        "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOF!"
        super().setUp()

        # Because the test database doesn't have specifyuser_spprincipal
        from specifyweb.backend.context import views

        # TODO: Replace this with a mock.
        views.users_collections_for_sp6 = lambda cursor, userid: []

    def test_set_user_agents(self):
        c = Client()
        c.force_login(self.specifyuser)
        response = c.post(
            f"/accounts/set_agents/{self.specifyuser.id}/",
            data=[self.agent.id],
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 204)

    def test_set_user_agents_missing_exception(self):
        collection2 = Collection.objects.create(
            catalognumformatname='test2',
            collectionname='TestCollection2',
            isembeddedcollectingevent=False,
            discipline=self.discipline,
        )

        UserPolicy.objects.create(
            collection_id=collection2.id,
            specifyuser_id=self.specifyuser.id,
            resource="%",
            action="%",
        )

        c = Client()
        c.force_login(self.specifyuser)

        response = c.post(
            f"/accounts/set_agents/{self.specifyuser.id}/",
            data=[],
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            json.loads(response.content),
            {
                "MissingAgentForAccessibleCollection": {
                    "all_accessible_divisions": [self.division.id],
                    "missing_for_6": [],
                    "missing_for_7": [self.collection.id, collection2.id],
                }
            },
        )

    def test_set_user_agents_multiple_exception(self):
        agent2 = Agent.objects.create(
            agenttype=0,
            firstname="Test2",
            lastname="User2",
            division=self.division,
            specifyuser=None,
        )

        c = Client()
        c.force_login(self.specifyuser)
        response = c.post(
            f"/accounts/set_agents/{self.specifyuser.id}/",
            data=[self.agent.id, agent2.id],
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            json.loads(response.content),
            {
                "MultipleAgentsException": [
                    {
                        "agentid1": self.agent.id,
                        "agentid2": agent2.id,
                        "divisonid": self.division.id,
                    }
                ]
            },
        )

    def test_set_user_agents_in_use_exception(self):
        user2 = Specifyuser.objects.create(
            isloggedin=False,
            isloggedinreport=False,
            name="testuser2",
            password="205C0D906445E1C71CA77C6D714109EB6D582B03A5493E4C")  # testuser

        c = Client()
        c.force_login(self.specifyuser)
        response = c.post(
            f"/accounts/set_agents/{user2.id}/",
            data=[self.agent.id],
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            json.loads(response.content), {"AgentInUseException": [self.agent.id]}
        )


class ScopingTests(ApiTests):
    def setUp(self):
        super().setUp()

        self.other_division = Division.objects.create(
            institution=self.institution,
            name='Other Division')

        self.other_discipline = Discipline.objects.create(
            geologictimeperiodtreedef=self.geologictimeperiodtreedef,
            geographytreedef=self.geographytreedef,
            division=self.other_division,
            datatype=self.datatype,
        )

        self.other_collection = Collection.objects.create(
            catalognumformatname='test',
            collectionname='OtherCollection',
            isembeddedcollectingevent=False,
            discipline=self.other_discipline,
        )

    def test_explicitly_defined_scope(self):
        accession = Accession.objects.create(
            accessionnumber="ACC_Test",
            division=self.division
        )
        accession_scope = scoping.Scoping(accession).get_scope_model()
        self.assertEqual(accession_scope.id, self.institution.id)

        loan = Loan.objects.create(
            loannumber = "LOAN_Test",
            discipline=self.other_discipline
        )

        loan_scope = scoping.Scoping(loan).get_scope_model()
        self.assertEqual(loan_scope.id, self.other_discipline.id)

    def test_infered_scope(self):
        disposal = Disposal.objects.create(
            disposalnumber = "DISPOSAL_TEST"
        )
        disposal_scope = scoping.Scoping(disposal).get_scope_model()
        self.assertEqual(disposal_scope.id, self.institution.id)

        loan = Loan.objects.create(
            loannumber = "Inerred_Loan",
            division=self.other_division,
            discipline=self.other_discipline,
        )
        inferred_loan_scope = scoping.Scoping(loan)._infer_scope()[1]
        self.assertEqual(inferred_loan_scope.id, self.other_division.id)

        collection_object_scope = scoping.Scoping(
            self.collectionobjects[0]
        ).get_scope_model()
        self.assertEqual(collection_object_scope.id, self.collection.id)

    def test_in_same_scope(self):
        collection_objects_same_collection = (
            self.collectionobjects[0],
            self.collectionobjects[1],
        )
        self.assertEqual(
            scoping.in_same_scope(*collection_objects_same_collection), True
        )

        other_collectionobject = Collectionobject.objects.create(
            catalognumber="other-co",
            collection=self.other_collection
        )

        agent = Agent.objects.create(
            agenttype=1,
            division=self.other_division
        )
        self.assertEqual(scoping.in_same_scope(agent, other_collectionobject), True)
        self.assertEqual(scoping.in_same_scope(self.collectionobjects[0], agent), False)

class DefaultsSetup(MainSetupTearDown, TestCase):
    def setUp(self):
        super().setUp()
        cog_type_picklist = Picklist.objects.create(
            name=SYSTEM_COGTYPES_PICKLIST,
            issystem=True,
            type=0,
            readonly=True,
            collection=self.collection
        )
        Picklistitem.objects.create(
            title='Discrete',
            value='Discrete',
            picklist=cog_type_picklist
        )
        Picklistitem.objects.create(
            title='Consolidated',
            value='Consolidated',
            picklist=cog_type_picklist
        )
        self.cogtype = Collectionobjectgrouptype.objects.create(
            name="Test", type="Discrete", collection=self.collection
        )
