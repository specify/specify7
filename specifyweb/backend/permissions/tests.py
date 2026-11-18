import json
from concurrent.futures import ThreadPoolExecutor
from threading import Event
from unittest.mock import patch

from django.test import Client, skipUnlessDBFeature
from django.db import connection
from django.core.exceptions import FieldError
from django.test.utils import CaptureQueriesContext
from django.utils import timezone

from specifyweb.backend.businessrules.rules.cogtype_rules import SYSTEM_COGTYPES_PICKLIST
from specifyweb.specify.tests.test_api import ApiTests, ApiTransactionTests
from specifyweb.specify import models as spmodels
from specifyweb.specify.api import crud
from specifyweb.specify.api.crud import _check_destination_scope, create_obj, get_collection, put_resource
from specifyweb.specify.api.filter_by_col import filter_by_collection
from specifyweb.specify.api.validators import GetCollectionForm
from specifyweb.specify.models_utils.relationships import get_recordset_info, handle_fk_fields
from specifyweb.specify.utils.scoping import Scoping, ScopeType
from . import models, permissions, initialize

class CollectionScopeApiTests(ApiTests):
    def setUp(self):
        super().setUp()
        self.other_collection = spmodels.Collection.objects.create(
            collectionname='Restricted collection', discipline=self.discipline,
        )
        self.other_object = spmodels.Collectionobject.objects.create(
            collection=self.other_collection, catalognumber='restricted',
        )
        models.UserPolicy.objects.all().delete()
        models.UserPolicy.objects.create(
            collection=self.collection, specifyuser=self.specifyuser,
            resource='%', action='%',
        )
        self.client.force_login(self.specifyuser)
        self.client.cookies['collection'] = self.collection.id

    def grant_other_collection(self, resource='%', action='%'):
        models.UserPolicy.objects.create(
            collection=self.other_collection, specifyuser=self.specifyuser,
            resource=resource, action=action,
        )

    def _grant_child_edit_permissions(self):
        models.UserPolicy.objects.all().delete()
        for resource, action in (
            ('/system/sp7/collection', 'access'),
            ('/table/%', '%'),
            ('/field/determination/%', 'update'),
            ('/field/collectionobjectattribute/%', 'update'),
            ('/field/collectionobjectgroupjoin/%', 'update'),
            ('/field/collectionobject/remarks', 'update'),
            ('/field/collectionobject/collectingevent', 'update'),
        ):
            models.UserPolicy.objects.create(
                collection=self.collection, specifyuser=self.specifyuser,
                resource=resource, action=action,
            )

    def test_child_edits_do_not_require_unchanged_parent_relationship_permissions(self):
        co = self.collectionobjects[0]
        attribute = spmodels.Collectionobjectattribute.objects.create(
            collectionmemberid=self.collection.id, text1='Original',
        )
        co.collectionobjectattribute = attribute
        co.save()
        determination = spmodels.Determination.objects.create(
            collectionobject=co, iscurrent=True,
        )
        self._grant_child_edit_permissions()
        response = self.client.put(
            f'/api/specify/collectionobject/{co.id}/', {
                'version': co.version, 'remarks': 'Parent edit',
                'collectionobjectattribute': {
                    'id': attribute.id, 'version': attribute.version, 'text1': 'Child edit',
                },
                'determinations': [{
                    'id': determination.id, 'version': determination.version,
                    'remarks': 'Child edit',
                }],
                'preparations': [],
            }, content_type='application/json',
        )
        self.assertEqual(response.status_code, 200, response.content)
        attribute.refresh_from_db()
        determination.refresh_from_db()
        co.refresh_from_db()
        self.assertEqual(attribute.text1, 'Child edit')
        self.assertEqual(determination.remarks, 'Child edit')
        self.assertEqual(co.remarks, 'Parent edit')
        response = self.client.put(
            f'/api/specify/collectionobject/{co.id}/',
            {'version': co.version, 'text1': 'Unauthorized scalar edit'},
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 403, response.content)
        co.refresh_from_db()
        self.assertIsNone(co.text1)

    def test_dependent_membership_changes_require_relationship_permission(self):
        co, other_co = self.collectionobjects[:2]
        determination = spmodels.Determination.objects.create(
            collectionobject=co, iscurrent=True,
        )
        other = spmodels.Determination.objects.create(
            collectionobject=other_co, iscurrent=True,
        )
        existing = {'id': determination.id, 'version': determination.version}
        self._grant_child_edit_permissions()
        for children in (
            [existing, {'remarks': 'New child'}],
            [],
            [{'id': other.id, 'version': other.version}],
        ):
            with self.subTest(children=children):
                response = self.client.put(
                    f'/api/specify/collectionobject/{co.id}/',
                    {'version': co.version, 'determinations': children},
                    content_type='application/json',
                )
                self.assertEqual(response.status_code, 403, response.content)
                self.assertEqual(
                    list(co.determinations.values_list('id', flat=True)), [determination.id],
                )
                other.refresh_from_db()
                self.assertEqual(other.collectionobject_id, other_co.id)

    def test_unchanged_independent_membership_does_not_require_relationship_permission(self):
        co = self.collectionobjects[0]
        co.collectingevent = self.collectingevent
        co.save()
        self._grant_child_edit_permissions()
        response = self.client.put(
            f'/api/specify/collectingevent/{self.collectingevent.id}/', {
                'version': self.collectingevent.version,
                'collectionobjects': {
                    'update': [{
                        'id': co.id, 'version': co.version, 'remarks': 'Child edit',
                    }],
                    'remove': [],
                },
            }, content_type='application/json',
        )
        self.assertEqual(response.status_code, 200, response.content)
        co.refresh_from_db()
        self.assertEqual(co.remarks, 'Child edit')
        self.collectingevent.refresh_from_db()
        response = self.client.put(
            f'/api/specify/collectingevent/{self.collectingevent.id}/', {
                'version': self.collectingevent.version,
                'collectionobjects': {
                    'remove': [f'/api/specify/collectionobject/{co.id}/'],
                },
            }, content_type='application/json',
        )
        self.assertEqual(response.status_code, 403, response.content)
        co.refresh_from_db()
        self.assertEqual(co.collectingevent_id, self.collectingevent.id)

    def _create_scoped_group_joins(self):
        joins = []
        for collection, child in zip(
            (self.collection, self.other_collection), self.collectionobjects,
        ):
            picklist = spmodels.Picklist.objects.create(
                name=SYSTEM_COGTYPES_PICKLIST, issystem=True, type=0,
                readonly=True, collection=collection,
            )
            spmodels.Picklistitem.objects.create(
                title='Discrete', value='Discrete', picklist=picklist,
            )
            cogtype = spmodels.Collectionobjectgrouptype.objects.create(
                name='Scoped group type', type='Discrete', collection=collection,
            )
            group = spmodels.Collectionobjectgroup.objects.create(
                collection=collection, cogtype=cogtype,
            )
            joins.append(spmodels.Collectionobjectgroupjoin.objects.create(
                parentcog=group, childco=child,
            ))
        return joins

    def test_group_join_reads_use_parent_collection(self):
        allowed, denied = self._create_scoped_group_joins()
        for join, readable in ((allowed, True), (denied, False)):
            with self.subTest(join=join.id):
                response = self.client.get(f'/api/specify/collectionobjectgroupjoin/{join.id}/')
                self.assertEqual(response.status_code, 200 if readable else 403, response.content)
                response = self.client.get('/api/specify/collectionobjectgroupjoin/', {'id': join.id})
                self.assertEqual(response.status_code, 200, response.content)
                self.assertEqual(
                    [obj['id'] for obj in response.json()['objects']],
                    [join.id] if readable else [],
                )
                response = self.client.get('/table_rows/specify_rows/collectionobjectgroupjoin/', {
                    'fields': 'id', 'id': join.id,
                })
                self.assertEqual(response.status_code, 200, response.content)
                self.assertEqual(response.json(), [[join.id]] if readable else [])

    def test_remote_to_one_requires_relationship_permission_only_when_changed(self):
        join, _ = self._create_scoped_group_joins()
        co = self.collectionobjects[0]
        self._grant_child_edit_permissions()
        response = self.client.put(
            f'/api/specify/collectionobject/{co.id}/', {
                'version': co.version,
                'cojo': {'id': join.id, 'version': join.version, 'text1': 'Child edit'},
            }, content_type='application/json',
        )
        self.assertEqual(response.status_code, 200, response.content)
        join.refresh_from_db()
        self.assertEqual(join.text1, 'Child edit')
        other_co = self.collectionobjects[2]
        response = self.client.put(
            f'/api/specify/collectionobject/{other_co.id}/', {
                'version': other_co.version,
                'cojo': {
                    'parentcog': f'/api/specify/collectionobjectgroup/{join.parentcog_id}/',
                },
            }, content_type='application/json',
        )
        self.assertEqual(response.status_code, 403, response.content)
        self.assertFalse(spmodels.Collectionobjectgroupjoin.objects.filter(childco=other_co).exists())

    def test_group_join_updates_require_parent_collection_permissions(self):
        allowed, denied = self._create_scoped_group_joins()
        response = self.client.put(
            f'/api/specify/collectionobjectgroupjoin/{allowed.id}/',
            {'version': allowed.version, 'text1': 'Allowed edit'},
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 200, response.content)
        allowed.refresh_from_db()
        self.assertEqual(allowed.text1, 'Allowed edit')
        original_parent_id = denied.parentcog_id
        original_version = denied.version
        for fields in ({}, {'parentcog': f'/api/specify/collectionobjectgroup/{allowed.parentcog_id}/'}):
            with self.subTest(fields=fields):
                response = self.client.put(
                    f'/api/specify/collectionobjectgroupjoin/{denied.id}/', {
                        'version': original_version, 'text1': 'Unauthorized edit', **fields,
                    }, content_type='application/json',
                )
                self.assertEqual(response.status_code, 403, response.content)
                denied.refresh_from_db()
                self.assertIsNone(denied.text1)
                self.assertEqual(denied.parentcog_id, original_parent_id)
                self.assertEqual(denied.version, original_version)

    def test_empty_hierarchy_scopes_require_global_permissions(self):
        discipline = spmodels.Discipline.objects.create(
            name='Empty discipline', type='botany', datatype=self.datatype,
            division=self.division, geographytreedef=self.geographytreedef,
            geologictimeperiodtreedef=self.geologictimeperiodtreedef,
        )
        division = spmodels.Division.objects.create(
            name='Empty division', institution=self.institution,
        )
        with permissions.cache_permission_queries():
            for obj in (discipline, division):
                with self.subTest(model=type(obj).__name__):
                    with self.assertRaises(permissions.NoMatchingRuleException):
                        permissions.check_table_permissions(
                            self.collection, self.agent, obj, 'delete',
                        )
        models.UserPolicy.objects.create(
            collection=None, specifyuser=self.specifyuser, resource='%', action='%',
        )
        with permissions.cache_permission_queries():
            for obj in (discipline, division):
                permissions.check_table_permissions(self.collection, self.agent, obj, 'delete')

    def test_global_permissions_do_not_authorize_arbitrary_empty_scopes(self):
        models.UserPolicy.objects.create(
            collection=None, specifyuser=self.specifyuser, resource='%', action='%',
        )
        with permissions.cache_permission_queries():
            for obj in (
                spmodels.Collectionobject(collection_id=self.collection.id, collectionmemberid=None),
                spmodels.Discipline(pk=-1),
                spmodels.Collection(pk=-1),
            ):
                with self.subTest(model=type(obj).__name__):
                    with self.assertRaises(permissions.NoMatchingRuleException):
                        permissions.check_table_permissions(self.collection, self.agent, obj, 'read')
            with self.assertRaises(permissions.NoMatchingRuleException):
                permissions.enforce_record(
                    self.agent, self.discipline, ['/table/discipline'], 'delete',
                    collections=spmodels.Collection.objects.none(),
                )

    def test_empty_hierarchy_lists_require_global_read_permissions(self):
        division = spmodels.Division.objects.create(
            name='Empty division', institution=self.institution,
        )
        discipline = spmodels.Discipline.objects.create(
            name='Empty discipline', type='botany', datatype=self.datatype,
            division=division, geographytreedef=self.geographytreedef,
            geologictimeperiodtreedef=self.geologictimeperiodtreedef,
        )
        foreign = spmodels.Discipline.objects.create(
            name='Restricted discipline', type='botany', datatype=self.datatype,
            division=self.division, geographytreedef=self.geographytreedef,
            geologictimeperiodtreedef=self.geologictimeperiodtreedef,
        )
        self.other_collection.discipline = foreign
        self.other_collection.save()
        for resource, action, allowed in (
            (None, None, False), ('%', 'delete', False),
            ('/table/%', 'read', True), ('%', '%', True),
        ):
            with self.subTest(resource=resource, action=action):
                models.UserPolicy.objects.filter(collection__isnull=True).delete()
                if resource is not None:
                    models.UserPolicy.objects.create(
                        collection=None, specifyuser=self.specifyuser,
                        resource=resource, action=action,
                    )
                for obj in (discipline, division):
                    table = obj.specify_model.name.lower()
                    response = self.client.get(f'/api/specify/{table}/{obj.pk}/')
                    self.assertEqual(response.status_code, 200 if allowed else 403, response.content)
                    response = self.client.get(f'/api/specify/{table}/', {'id': obj.pk})
                    self.assertEqual(response.status_code, 200, response.content)
                    self.assertEqual(
                        [row['id'] for row in response.json()['objects']],
                        [obj.pk] if allowed else [],
                    )
                response = self.client.get('/api/specify/discipline/', {'id': foreign.pk})
                self.assertEqual(response.status_code, 200, response.content)
                self.assertEqual(
                    [row['id'] for row in response.json()['objects']],
                    [foreign.pk] if action == '%' else [],
                )
                response = self.client.get('/table_rows/specify_rows/discipline/', {
                    'fields': 'id,division__name', 'id': discipline.pk,
                })
                self.assertEqual(response.status_code, 200, response.content)
                self.assertEqual(
                    response.json(), [[discipline.pk, division.name]] if allowed else [],
                )
                with permissions.cache_permission_queries():
                    self.assertFalse(permissions.filter_readable(
                        spmodels.Discipline.objects.filter(pk=discipline.pk), self.agent,
                    ).exists())

    def test_collection_membership_fallback_matches_instance_and_queryset_access(self):
        obj = self.collectionobjects[0]
        for membership, collection, allowed in (
            (self.collection.id, self.collection, True),
            (-1, self.collection, True),
            (-1, self.other_collection, False),
            (self.other_collection.id, self.collection, False),
        ):
            with self.subTest(membership=membership, collection=collection.id):
                spmodels.Collectionobject.objects.filter(pk=obj.pk).update(
                    collectionmemberid=membership, collection=collection,
                )
                obj.refresh_from_db()
                response = self.client.get(f'/api/specify/collectionobject/{obj.id}/')
                self.assertEqual(response.status_code, 200 if allowed else 403, response.content)
                response = self.client.get('/api/specify/collectionobject/', {'id': obj.id})
                self.assertEqual(response.status_code, 200, response.content)
                self.assertEqual(
                    [row['id'] for row in response.json()['objects']],
                    [obj.id] if allowed else [],
                )
                response = self.client.get('/table_rows/specify_rows/collectionobject/', {
                    'fields': 'id', 'id': obj.id,
                })
                self.assertEqual(response.status_code, 200, response.content)
                self.assertEqual(response.json(), [[obj.id]] if allowed else [])
                if allowed:
                    self.assertEqual(Scoping.model_from_instance(obj), self.collection)
                    response = self.client.put(
                        f'/api/specify/collectionobject/{obj.id}/', {
                            'version': obj.version, 'remarks': f'Membership {membership}',
                        }, content_type='application/json',
                    )
                    self.assertEqual(response.status_code, 200, response.content)
                    obj.refresh_from_db()
                    self.assertEqual(obj.collectionmemberid, membership)
                    with permissions.cache_permission_queries():
                        permissions.check_table_permissions(
                            self.collection, self.agent, obj, 'read',
                        )
                        with self.assertNumQueries(0):
                            for _ in range(100):
                                permissions.check_table_permissions(
                                    self.collection, self.agent, obj, 'read',
                                )
        with permissions.cache_permission_queries():
            with self.assertRaises(permissions.NoMatchingRuleException):
                permissions.check_table_permissions(
                    self.collection, self.agent,
                    spmodels.Determination(collectionmemberid=-1), 'read',
                )

    def test_repeated_scope_checks_do_not_issue_queries(self):
        agents = list(spmodels.Agent.objects.filter(pk=self.agent.pk))
        groups = (
            self.collectionobjects,
            agents,
            [spmodels.Accession(division_id=self.division.id)],
        )
        for objects in groups:
            with self.subTest(model=type(objects[0]).__name__):
                with permissions.cache_permission_queries():
                    permissions.check_table_permissions(
                        self.collection, self.agent, objects[0], 'read',
                    )
                    with self.assertNumQueries(0):
                        for index in range(100):
                            permissions.check_table_permissions(
                                self.collection, self.agent, objects[index % len(objects)], 'read',
                            )

    def test_repeated_field_checks_do_not_issue_queries(self):
        fields = ['remarks', 'text1', 'text2']
        with permissions.cache_permission_queries():
            permissions.check_field_permissions(
                self.collection, self.agent, self.collectionobjects[0], fields, 'update',
            )
            with self.assertNumQueries(0):
                for obj in self.collectionobjects:
                    permissions.check_field_permissions(
                        self.collection, self.agent, obj, fields, 'update',
                    )

    def test_repeated_destination_checks_do_not_issue_queries(self):
        children = [
            spmodels.Determination(
                collectionobject=parent, collectionmemberid=self.collection.id,
            ) for parent in self.collectionobjects
        ]
        preparation = spmodels.Preparation(
            collectionobject=self.collectionobjects[0], collectionmemberid=self.collection.id,
        )
        sample = spmodels.Materialsample(
            preparation=preparation, collectionmemberid=self.collection.id,
        )
        for objects, field in ((children, 'collectionobject'), ([sample], 'preparation')):
            with self.subTest(model=type(objects[0]).__name__):
                with permissions.cache_permission_queries():
                    _check_destination_scope(
                        self.collection, self.agent, objects[0],
                        {field: getattr(objects[0], field)}, 'update',
                    )
                    with self.assertNumQueries(0):
                        for index in range(100):
                            obj = objects[index % len(objects)]
                            _check_destination_scope(
                                self.collection, self.agent, obj,
                                {field: getattr(obj, field)}, 'update',
                            )

    def test_destination_cache_uses_current_membership_and_parent_scopes(self):
        self.grant_other_collection()
        preparation = spmodels.Preparation(
            collectionobject=self.collectionobjects[0], collectionmemberid=self.collection.id,
        )
        sample = spmodels.Materialsample(
            preparation=preparation, collectionmemberid=self.collection.id,
        )
        with permissions.cache_permission_queries():
            _check_destination_scope(
                self.collection, self.agent, sample, {'preparation': preparation}, 'update',
            )
            preparation.collectionobject = self.other_object
            with self.assertRaises(permissions.NoMatchingRuleException):
                _check_destination_scope(
                    self.collection, self.agent, sample, {'preparation': preparation}, 'update',
                )
            preparation.collectionmemberid = self.other_collection.id
            with self.assertRaises(permissions.NoMatchingRuleException):
                _check_destination_scope(
                    self.collection, self.agent, sample, {'preparation': preparation}, 'update',
                )
            sample.collectionmemberid = self.other_collection.id
            _check_destination_scope(
                self.collection, self.agent, sample, {'preparation': preparation}, 'update',
            )
            sample.preparation = spmodels.Preparation(
                collectionobject=self.collectionobjects[0], collectionmemberid=self.collection.id,
            )
            with self.assertRaises(permissions.NoMatchingRuleException):
                _check_destination_scope(
                    self.collection, self.agent, sample, {'preparation': sample.preparation}, 'update',
                )

    def test_destination_parent_references_load_ancestor_scopes(self):
        preptype = spmodels.Preptype.objects.create(
            name='Scoped preparation', isloanable=False, collection=self.collection,
        )
        preparation = spmodels.Preparation.objects.create(
            collectionobject=self.collectionobjects[0], preptype=preptype,
        )
        data = {'preparation': f'/api/specify/preparation/{preparation.id}/'}
        sample = spmodels.Materialsample(
            preparation=preparation, collectionmemberid=self.collection.id,
        )
        with permissions.cache_permission_queries():
            permissions.check_table_permissions(self.collection, self.agent, preparation, 'read')
            _check_destination_scope(self.collection, self.agent, sample, data, 'create')
            for _ in range(10):
                sample = spmodels.Materialsample(collectionmemberid=self.collection.id)
                with self.assertNumQueries(1):
                    handle_fk_fields(self.collection, self.agent, sample, data.copy())
                with self.assertNumQueries(0):
                    _check_destination_scope(self.collection, self.agent, sample, data, 'create')

    def test_moving_collectionobject_rescopes_dependent_collection_members(self):
        self.grant_other_collection()
        co = self.collectionobjects[0]
        determination = spmodels.Determination.objects.create(
            collectionobject=co, collectionmemberid=self.collection.id, iscurrent=True,
        )
        preptype = spmodels.Preptype.objects.create(
            name='Movable preparation', isloanable=False, collection=self.collection,
        )
        preparation = spmodels.Preparation.objects.create(
            collectionobject=co, preptype=preptype, collectionmemberid=self.collection.id,
        )
        sample = spmodels.Materialsample.objects.create(
            preparation=preparation, collectionmemberid=self.collection.id,
        )
        response = self.client.put(
            f'/api/specify/collectionobject/{co.id}/', {
                'version': co.version,
                'collection': f'/api/specify/collection/{self.other_collection.id}/',
                'collectionmemberid': self.other_collection.id,
            }, content_type='application/json',
        )
        self.assertEqual(response.status_code, 200, response.content)
        for child in (determination, preparation, sample):
            child.refresh_from_db()
            self.assertEqual(child.collectionmemberid, self.other_collection.id)
        # An actor permitted only in the source collection loses access.
        models.UserPolicy.objects.filter(collection=self.other_collection).delete()
        response = self.client.get(f'/api/specify/determination/{determination.id}/')
        self.assertEqual(response.status_code, 403, response.content)
        response = self.client.get('/api/specify/determination/', {'id': determination.id})
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual([row['id'] for row in response.json()['objects']], [])
        with permissions.cache_permission_queries():
            with self.assertRaises(permissions.NoMatchingRuleException):
                permissions.check_table_permissions(
                    self.collection, self.agent, determination, 'read',
                )

    def test_moving_collectionobject_updates_submitted_children_once(self):
        self.grant_other_collection()
        co = create_obj(self.collection, self.agent, 'collectionobject', {
            'collection': f'/api/specify/collection/{self.collection.id}/',
            'catalognumber': 'move-with-child-edits',
            'collectionobjectattribute': {'text1': 'Original attribute'},
        })
        attribute = co.collectionobjectattribute
        determination = spmodels.Determination.objects.create(
            collectionobject=co, iscurrent=True,
        )
        preptype = spmodels.Preptype.objects.create(
            name='Movable preparation', isloanable=False, collection=self.collection,
        )
        preparation = spmodels.Preparation.objects.create(
            collectionobject=co, preptype=preptype,
        )
        sample = spmodels.Materialsample.objects.create(
            preparation=preparation, collectionmemberid=self.collection.id,
        )
        remaining = spmodels.Otheridentifier.objects.create(
            collectionobject=co, collectionmemberid=self.collection.id,
        )
        children = (attribute, determination, preparation, sample, remaining)
        versions = [child.version for child in children]

        def edit(child, **fields):
            return {
                'id': child.id, 'version': child.version,
                'collectionmemberid': self.collection.id, **fields,
            }

        response = self.client.put(
            f'/api/specify/collectionobject/{co.id}/', {
                'version': co.version,
                'collection': f'/api/specify/collection/{self.other_collection.id}/',
                'collectionmemberid': self.other_collection.id,
                'collectionobjectattribute': edit(attribute, text1='Edited attribute'),
                'determinations': [edit(determination, remarks='Edited determination')],
                'preparations': [edit(
                    preparation, remarks='Edited preparation',
                    materialsamples=[edit(sample, remarks='Edited sample')],
                )],
            }, content_type='application/json',
        )
        self.assertEqual(response.status_code, 200, response.content)
        for child, version in zip(children, versions):
            child.refresh_from_db()
            self.assertEqual(child.collectionmemberid, self.other_collection.id)
            self.assertEqual(child.version, version + 1)
        self.assertEqual(attribute.text1, 'Edited attribute')
        self.assertEqual(determination.remarks, 'Edited determination')
        self.assertEqual(preparation.remarks, 'Edited preparation')
        self.assertEqual(sample.remarks, 'Edited sample')

    def test_moving_collectionobject_rejects_stale_submitted_child(self):
        self.grant_other_collection()
        co = create_obj(self.collection, self.agent, 'collectionobject', {
            'collection': f'/api/specify/collection/{self.collection.id}/',
            'catalognumber': 'stale-child-move',
            'collectionobjectattribute': {'text1': 'Original attribute'},
        })
        attribute = co.collectionobjectattribute
        determination = spmodels.Determination.objects.create(
            collectionobject=co, iscurrent=True, version=1, remarks='Original',
        )
        response = self.client.put(
            f'/api/specify/collectionobject/{co.id}/', {
                'version': co.version,
                'collection': f'/api/specify/collection/{self.other_collection.id}/',
                'collectionmemberid': self.other_collection.id,
                'collectionobjectattribute': {
                    'id': attribute.id, 'version': attribute.version, 'text1': 'Edited',
                },
                'determinations': [{
                    'id': determination.id, 'version': 0, 'remarks': 'Stale edit',
                }],
            }, content_type='application/json',
        )
        self.assertEqual(response.status_code, 409, response.content)
        co.refresh_from_db()
        determination.refresh_from_db()
        self.assertEqual(co.collection_id, self.collection.id)
        self.assertEqual(co.collectionmemberid, self.collection.id)
        self.assertEqual(determination.collectionmemberid, self.collection.id)
        self.assertEqual(determination.version, 1)
        self.assertEqual(determination.remarks, 'Original')
        attribute.refresh_from_db()
        self.assertEqual(attribute.collectionmemberid, self.collection.id)
        self.assertEqual(attribute.version, 0)
        self.assertEqual(attribute.text1, 'Original attribute')

    def test_moving_collectionobject_with_child_edits_requires_both_scopes(self):
        co = self.collectionobjects[0]
        determination = spmodels.Determination.objects.create(
            collectionobject=co, iscurrent=True, remarks='Original',
        )
        for restricted in (self.collection, self.other_collection):
            with self.subTest(restricted_collection=restricted.id):
                models.UserPolicy.objects.all().delete()
                for collection in (self.collection, self.other_collection):
                    if collection != restricted:
                        models.UserPolicy.objects.create(
                            collection=collection, specifyuser=self.specifyuser,
                            resource='%', action='%',
                        )
                for resource, action in (
                    ('%', 'read'),
                    ('/system/sp7/collection', 'access'),
                    ('/table/collectionobject', 'update'),
                    ('/field/collectionobject/%', 'update'),
                ):
                    models.UserPolicy.objects.create(
                        collection=restricted, specifyuser=self.specifyuser,
                        resource=resource, action=action,
                    )
                response = self.client.put(
                    f'/api/specify/collectionobject/{co.id}/', {
                        'version': co.version,
                        'collection': f'/api/specify/collection/{self.other_collection.id}/',
                        'collectionmemberid': self.other_collection.id,
                        'determinations': [{
                            'id': determination.id, 'version': determination.version,
                            'remarks': 'Unauthorized edit',
                        }],
                    }, content_type='application/json',
                )
                self.assertEqual(response.status_code, 403, response.content)
                co.refresh_from_db()
                determination.refresh_from_db()
                self.assertEqual(co.collection_id, self.collection.id)
                self.assertEqual(determination.collectionmemberid, self.collection.id)
                self.assertEqual(determination.version, 0)
                self.assertEqual(determination.remarks, 'Original')

    def test_moving_collectionobject_rescopes_inline_attribute(self):
        self.grant_other_collection()
        co = create_obj(self.collection, self.agent, 'collectionobject', {
            'collection': f'/api/specify/collection/{self.collection.id}/',
            'catalognumber': 'inline-attribute-move',
            'collectionobjectattribute': {'text1': 'Inline attribute'},
        })
        attribute = co.collectionobjectattribute
        original_version = attribute.version
        self.assertEqual(attribute.collectionmemberid, self.collection.id)
        response = self.client.put(
            f'/api/specify/collectionobject/{co.id}/', {
                'version': co.version,
                'collection': f'/api/specify/collection/{self.other_collection.id}/',
                'collectionmemberid': self.other_collection.id,
            }, content_type='application/json',
        )
        self.assertEqual(response.status_code, 200, response.content)
        attribute.refresh_from_db()
        self.assertEqual(attribute.collectionmemberid, self.other_collection.id)
        self.assertEqual(attribute.version, original_version + 1)
        self.assertEqual(attribute.text1, 'Inline attribute')

    def test_moving_collectionobject_requires_inline_attribute_permissions(self):
        co = create_obj(self.collection, self.agent, 'collectionobject', {
            'collection': f'/api/specify/collection/{self.collection.id}/',
            'catalognumber': 'restricted-attribute-move',
            'collectionobjectattribute': {'text1': 'Inline attribute'},
        })
        attribute = co.collectionobjectattribute
        original_version = attribute.version
        for restricted in (self.collection, self.other_collection):
            with self.subTest(restricted_collection=restricted.id):
                models.UserPolicy.objects.all().delete()
                for collection in (self.collection, self.other_collection):
                    models.UserPolicy.objects.create(
                        collection=collection, specifyuser=self.specifyuser,
                        resource='%', action='%',
                    )
                models.UserPolicy.objects.filter(collection=restricted).delete()
                for resource in (
                    '/system/sp7/collection',
                    '/table/collectionobject',
                    '/field/collectionobject/%',
                ):
                    models.UserPolicy.objects.create(
                        collection=restricted, specifyuser=self.specifyuser,
                        resource=resource, action='%',
                    )
                response = self.client.put(
                    f'/api/specify/collectionobject/{co.id}/', {
                        'version': co.version,
                        'collection': f'/api/specify/collection/{self.other_collection.id}/',
                        'collectionmemberid': self.other_collection.id,
                    }, content_type='application/json',
                )
                self.assertEqual(response.status_code, 403, response.content)
                co.refresh_from_db()
                attribute.refresh_from_db()
                self.assertEqual(co.collection_id, self.collection.id)
                self.assertEqual(attribute.collectionmemberid, self.collection.id)
                self.assertEqual(attribute.version, original_version)

    def test_moving_collectionobject_requires_dependent_permissions_in_destination(self):
        for resource in (
            '/system/sp7/collection',
            '/table/collectionobject',
            '/field/collectionobject/%',
        ):
            self.grant_other_collection(resource=resource)
        co = self.collectionobjects[0]
        determination = spmodels.Determination.objects.create(
            collectionobject=co, collectionmemberid=self.collection.id, iscurrent=True,
        )
        response = self.client.put(
            f'/api/specify/collectionobject/{co.id}/', {
                'version': co.version,
                'collection': f'/api/specify/collection/{self.other_collection.id}/',
                'collectionmemberid': self.other_collection.id,
            }, content_type='application/json',
        )
        self.assertEqual(response.status_code, 403, response.content)
        co.refresh_from_db()
        determination.refresh_from_db()
        self.assertEqual(co.collection_id, self.collection.id)
        self.assertEqual(co.collectionmemberid, self.collection.id)
        self.assertEqual(determination.collectionmemberid, self.collection.id)
        response = self.client.get(f'/api/specify/determination/{determination.id}/')
        self.assertEqual(response.status_code, 200, response.content)

    def test_list_permission_query_count_does_not_grow_with_records(self):
        recordset = spmodels.Recordset.objects.create(
            name='Scoped items', dbtableid=1, type=0,
            collectionmemberid=self.collection.id, specifyuser=self.specifyuser,
        )
        for obj in self.collectionobjects:
            recordset.recordsetitems.create(recordid=obj.id)
        for model in ('collectionobject', 'recordsetitem'):
            counts = []
            for limit in (1, 5):
                query_count = 0

                def checker(obj):
                    nonlocal query_count
                    with CaptureQueriesContext(connection) as captured:
                        permissions.check_table_permissions(self.collection, self.agent, obj, 'read')
                    query_count += len(captured)

                with permissions.cache_permission_queries():
                    data = get_collection(
                        self.collection, model, checker,
                        GetCollectionForm.defaults | {'limit': limit}, actor=self.agent,
                    )
                self.assertEqual(len(data['objects']), limit)
                self.assertLessEqual(query_count, 1)
                counts.append(query_count)
            self.assertEqual(counts[0], counts[1])

    def test_cached_checks_distinguish_scope_actor_resource_and_action(self):
        models.UserPolicy.objects.all().delete()
        for resource, action in (
            ('/system/sp7/collection', 'access'), ('/table/collectionobject', 'read'),
        ):
            models.UserPolicy.objects.create(
                collection=self.collection, specifyuser=self.specifyuser,
                resource=resource, action=action,
            )
        other_user = spmodels.Specifyuser.objects.create(name='No access')
        obj = self.collectionobjects[0]
        with permissions.cache_permission_queries():
            permissions.check_table_permissions(self.collection, self.agent, obj, 'read')
            for actor, target, action in (
                (self.agent, self.other_object, 'read'),
                (self.agent, obj, 'update'),
                (other_user, obj, 'read'),
                (self.agent, self.agent, 'read'),
            ):
                with self.subTest(actor=actor, target=target, action=action):
                    with self.assertRaises(permissions.NoMatchingRuleException):
                        permissions.check_table_permissions(self.collection, actor, target, action)
            obj.collectionmemberid = self.other_collection.id
            obj.collection_id = self.other_collection.id
            with self.assertRaises(permissions.NoMatchingRuleException):
                permissions.check_table_permissions(self.collection, self.agent, obj, 'read')

    def test_restricted_collection_cache_does_not_replace_unrestricted_result(self):
        self.grant_other_collection()
        resource = '/table/collectionobject'
        with permissions.cache_permission_queries():
            self.assertEqual(
                permissions._permitted_collection_ids(
                    self.agent, resource, 'read',
                    candidate_collection_ids=frozenset({self.collection.id}),
                ),
                frozenset({self.collection.id}),
            )
            self.assertEqual(
                set(permissions.permitted_collections(self.agent, resource, 'read').values_list(
                    'pk', flat=True,
                )),
                {self.collection.id, self.other_collection.id},
            )

    def test_record_checks_reuse_cached_unrestricted_collection_grants(self):
        resource = '/table/collectionobject'
        for allowed in (True, False):
            with self.subTest(allowed=allowed):
                if not allowed:
                    models.UserPolicy.objects.all().delete()
                with permissions.cache_permission_queries():
                    unrestricted = permissions._permitted_collection_ids(
                        self.agent, resource, 'read',
                    )
                    for obj in (self.collectionobjects[0], self.other_object):
                        permissions._record_collection_ids(obj)
                    with self.assertNumQueries(0):
                        for obj in (self.collectionobjects[0], self.other_object):
                            if allowed and obj is self.collectionobjects[0]:
                                permissions.enforce_record(
                                    self.agent, obj, [resource], 'read',
                                )
                            else:
                                with self.assertRaises(permissions.NoMatchingRuleException):
                                    permissions.enforce_record(
                                        self.agent, obj, [resource], 'read',
                                    )
                        self.assertEqual(
                            permissions._permitted_collection_ids(
                                self.agent, resource, 'read',
                                candidate_collection_ids=frozenset({self.other_collection.id}),
                            ),
                            frozenset(),
                        )
                        self.assertEqual(
                            permissions._permitted_collection_ids(self.agent, resource, 'read'),
                            unrestricted,
                        )

    def test_list_permissions_bulk_load_policies_across_collections(self):
        for index in range(5):
            spmodels.Collection.objects.create(
                collectionname=f'Unpermitted collection {index}', discipline=self.discipline,
            )
        with permissions.cache_permission_queries():
            with self.assertNumQueries(3):
                self.assertEqual(
                    permissions.filter_readable(
                        spmodels.Collectionobject.objects.all(), self.agent,
                    ).count(),
                    len(self.collectionobjects),
                )

    def test_permission_cache_does_not_survive_request_context(self):
        with permissions.cache_permission_queries():
            permissions.check_table_permissions(
                self.collection, self.agent, self.collectionobjects[0], 'read',
            )
        models.UserPolicy.objects.all().delete()
        self.grant_other_collection()
        with permissions.cache_permission_queries():
            with self.assertRaises(permissions.NoMatchingRuleException):
                permissions.check_table_permissions(
                    self.collection, self.agent, self.collectionobjects[0], 'read',
                )
            permissions.check_table_permissions(
                self.collection, self.agent, self.other_object, 'read',
            )

    def test_hierarchy_update_invalidates_cached_scope_rules(self):
        division = spmodels.Division.objects.create(
            institution=self.institution, name='Foreign division',
        )
        accession = spmodels.Accession(division_id=division.id)
        with permissions.cache_permission_queries():
            permissions.check_table_permissions(self.collection, self.agent, accession, 'read')
            put_resource(
                self.collection, self.agent, 'institution',
                self.institution.id, self.institution.version, {'isaccessionsglobal': False},
            )
            with self.assertRaises(permissions.NoMatchingRuleException):
                permissions.check_table_permissions(self.collection, self.agent, accession, 'read')

    def test_denied_record_crud_leaves_record_unchanged(self):
        url = f'/api/specify/collectionobject/{self.other_object.id}/'
        for method in ('get', 'put', 'delete'):
            with self.subTest(method=method):
                if method == 'put':
                    response = self.client.put(
                        url, data={'version': self.other_object.version, 'remarks': 'changed'},
                        content_type='application/json',
                    )
                else:
                    response = getattr(self.client, method)(url)
                self.assertEqual(response.status_code, 403, response.content)
                self.other_object.refresh_from_db()
                self.assertIsNone(self.other_object.remarks)
                self.assertEqual(self.other_object.collection_id, self.other_collection.id)

    def test_lists_and_rows_filter_before_pagination(self):
        for domainfilter in ('false', 'true'):
            response = self.client.get('/api/specify/collectionobject/', {
                'domainfilter': domainfilter, 'orderby': '-id', 'limit': 1,
            })
            self.assertEqual(response.status_code, 200, response.content)
            self.assertEqual(response.json()['meta']['total_count'], 5)
            self.assertEqual(response.json()['objects'][0]['id'], self.collectionobjects[-1].id)
        response = self.client.get('/table_rows/specify_rows/collectionobject/', {'fields': 'id'})
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual({row[0] for row in response.json()}, {co.id for co in self.collectionobjects})

    def test_other_collection_requires_access_and_action(self):
        url = f'/api/specify/collectionobject/{self.other_object.id}/'
        self.grant_other_collection('/table/collectionobject', 'read')
        self.assertEqual(self.client.get(url).status_code, 403)
        self.grant_other_collection('/system/sp7/collection', 'access')
        self.assertEqual(self.client.get(url).status_code, 200)
        response = self.client.put(url, {
            'version': self.other_object.version, 'remarks': 'changed',
        }, content_type='application/json')
        self.assertEqual(response.status_code, 403)
        self.other_object.refresh_from_db()
        self.assertIsNone(self.other_object.remarks)

    def test_authorized_cross_collection_update(self):
        self.grant_other_collection()
        response = self.client.put(
            f'/api/specify/collectionobject/{self.other_object.id}/',
            {'version': self.other_object.version, 'remarks': 'allowed'},
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 200, response.content)
        self.other_object.refresh_from_db()
        self.assertEqual(self.other_object.remarks, 'allowed')

    def test_post_cannot_overwrite_existing_record(self):
        response = self.client.post('/api/specify/collectionobject/', {
            'id': self.other_object.id, 'remarks': 'changed',
            'collection': f'/api/specify/collection/{self.collection.id}/',
        }, content_type='application/json')
        self.assertEqual(response.status_code, 400, response.content)
        self.other_object.refresh_from_db()
        self.assertIsNone(self.other_object.remarks)
        self.assertEqual(self.other_object.collection_id, self.other_collection.id)

    def test_put_cannot_change_primary_key(self):
        obj = self.collectionobjects[0]
        response = self.client.put(
            f'/api/specify/collectionobject/{obj.id}/',
            {'id': self.other_object.id, 'version': obj.version, 'remarks': 'changed'},
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 400, response.content)
        obj.refresh_from_db()
        self.other_object.refresh_from_db()
        self.assertIsNone(self.other_object.remarks)
        self.assertEqual(self.other_object.collection_id, self.other_collection.id)

    def test_related_rows_and_filters_do_not_expose_foreign_records(self):
        self.other_object.collectingevent = self.collectingevent
        self.other_object.save()
        obj = self.collectionobjects[0]
        obj.collectingevent = self.collectingevent
        obj.save()
        for prefix in ('/table_rows/', '/api/'):
            response = self.client.get(f'{prefix}specify_rows/collectingevent/', {
                'fields': 'id,collectionobjects__catalognumber',
                'id': self.collectingevent.id, 'orderby': '-collectionobjects__catalognumber',
            })
            self.assertEqual(response.status_code, 200, response.content)
            self.assertEqual(response.json(), [[self.collectingevent.id, obj.catalognumber]])
        response = self.client.get('/api/specify/collectingevent/', {
            'collectionobjects__catalognumber': 'restricted',
        })
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.json()['meta']['total_count'], 0)

    def test_rows_preserve_roots_with_unreadable_related_projections_and_ordering(self):
        models.UserPolicy.objects.all().delete()
        for resource, action in (
            ('/system/sp7/collection', 'access'),
            ('/table/collectionobject', 'read'),
        ):
            models.UserPolicy.objects.create(
                collection=self.collection, specifyuser=self.specifyuser,
                resource=resource, action=action,
            )
        obj = self.collectionobjects[0]
        for prefix in ('/table_rows/', '/api/'):
            for path in ('collection__collectionname', 'collection__discipline__name'):
                for orderby in ('', path):
                    for fields in ('id', f'id,{path}'):
                        with self.subTest(prefix=prefix, path=path, fields=fields, orderby=orderby):
                            response = self.client.get(f'{prefix}specify_rows/collectionobject/', {
                                'fields': fields, 'id': obj.pk, 'orderby': orderby,
                            })
                            self.assertEqual(response.status_code, 200, response.content)
                            self.assertEqual(
                                response.json(), [[obj.pk]] if fields == 'id' else [[obj.pk, None]],
                            )
                response = self.client.get(f'{prefix}specify_rows/collectionobject/', {
                    'fields': f'id,{path}', 'id': obj.pk,
                    path: (
                        self.collection.collectionname
                        if path == 'collection__collectionname' else self.discipline.name
                    ),
                })
                self.assertEqual(response.status_code, 200, response.content)
                self.assertEqual(response.json(), [])

        models.UserPolicy.objects.create(
            collection=self.collection, specifyuser=self.specifyuser,
            resource='/table/collection', action='read',
        )
        for prefix in ('/table_rows/', '/api/'):
            response = self.client.get(f'{prefix}specify_rows/collectionobject/', {
                'fields': 'id,collection__collectionname,collection__discipline__name',
                'id': obj.pk, 'orderby': 'collection__discipline__name',
            })
            self.assertEqual(response.status_code, 200, response.content)
            self.assertEqual(response.json(), [[obj.pk, self.collection.collectionname, None]])

    def test_rows_mask_unreadable_reverse_relations_without_dropping_root(self):
        obj = self.collectionobjects[0]
        obj.collectingevent = self.collectingevent
        obj.save()
        models.UserPolicy.objects.all().delete()
        for resource, action in (
            ('/system/sp7/collection', 'access'), ('/table/collectingevent', 'read'),
        ):
            models.UserPolicy.objects.create(
                collection=self.collection, specifyuser=self.specifyuser,
                resource=resource, action=action,
            )
        for prefix in ('/table_rows/', '/api/'):
            params = {
                'fields': 'id,collectionobjects__catalognumber',
                'id': self.collectingevent.pk, 'orderby': 'collectionobjects__catalognumber',
            }
            response = self.client.get(f'{prefix}specify_rows/collectingevent/', params)
            self.assertEqual(response.status_code, 200, response.content)
            self.assertEqual(response.json(), [[self.collectingevent.pk, None]])
            response = self.client.get(f'{prefix}specify_rows/collectingevent/', {
                **params, 'collectionobjects__catalognumber': obj.catalognumber,
            })
            self.assertEqual(response.status_code, 200, response.content)
            self.assertEqual(response.json(), [])

    def test_read_projections_reject_forward_and_reverse_many_to_many_paths(self):
        for queryset, path in (
            (spmodels.Project.objects.all(), 'collectionobjects__catalognumber'),
            (spmodels.Collectionobject.objects.all(), 'projects__projectname'),
        ):
            with self.subTest(path=path):
                with permissions.cache_permission_queries():
                    with self.assertRaises(FieldError):
                        permissions.prepare_read_queryset(queryset, self.agent, [path])

    def test_determination_reassignment_inherits_target_membership(self):
        self.grant_other_collection()
        determination = spmodels.Determination.objects.create(
            collectionobject=self.collectionobjects[0], iscurrent=True,
        )
        response = self.client.put(
            f'/api/specify/determination/{determination.id}/', {
                'version': determination.version,
                'collectionobject': f'/api/specify/collectionobject/{self.other_object.id}/',
            }, content_type='application/json',
        )
        self.assertEqual(response.status_code, 200, response.content)
        determination.refresh_from_db()
        self.assertEqual(determination.collectionobject_id, self.other_object.id)
        self.assertEqual(determination.collectionmemberid, self.other_collection.id)
        self.assertEqual(determination.version, 1)
        models.UserPolicy.objects.filter(collection=self.other_collection).delete()
        response = self.client.get(f'/api/specify/determination/{determination.id}/')
        self.assertEqual(response.status_code, 403, response.content)

    def test_determination_reassignment_checks_membership_permissions_in_both_scopes(self):
        determination = spmodels.Determination.objects.create(
            collectionobject=self.collectionobjects[0], iscurrent=True,
        )
        for restricted in (self.collection, self.other_collection):
            with self.subTest(restricted_collection=restricted.id):
                models.UserPolicy.objects.all().delete()
                for collection in (self.collection, self.other_collection):
                    if collection != restricted:
                        models.UserPolicy.objects.create(
                            collection=collection, specifyuser=self.specifyuser,
                            resource='%', action='%',
                        )
                for resource, action in (
                    ('%', 'read'),
                    ('/system/sp7/collection', 'access'),
                    ('/table/determination', 'update'),
                    ('/field/determination/collectionobject', 'update'),
                ):
                    models.UserPolicy.objects.create(
                        collection=restricted, specifyuser=self.specifyuser,
                        resource=resource, action=action,
                    )
                response = self.client.put(
                    f'/api/specify/determination/{determination.id}/', {
                        'version': determination.version,
                        'collectionobject': f'/api/specify/collectionobject/{self.other_object.id}/',
                    }, content_type='application/json',
                )
                self.assertEqual(response.status_code, 403, response.content)
                determination.refresh_from_db()
                self.assertEqual(determination.collectionobject_id, self.collectionobjects[0].id)
                self.assertEqual(determination.collectionmemberid, self.collection.id)
                self.assertEqual(determination.version, 0)

    def test_determination_reassignment_refreshes_target_model_reference(self):
        self.grant_other_collection()
        target = self.collectionobjects[1]
        determination = spmodels.Determination.objects.create(
            collectionobject=self.collectionobjects[0], iscurrent=True,
        )
        put_resource(
            self.collection, self.agent, 'collectionobject', target.id, target.version, {
                'collection': f'/api/specify/collection/{self.other_collection.id}/',
                'collectionmemberid': self.other_collection.id,
            },
        )
        put_resource(
            self.collection, self.agent, 'determination', determination.id,
            determination.version, {'collectionobject': target},
        )
        determination.refresh_from_db()
        self.assertEqual(determination.collectionobject_id, target.id)
        self.assertEqual(determination.collectionmemberid, self.other_collection.id)

    def test_foreign_relationship_assignment_is_denied(self):
        obj = self.collectionobjects[0]
        response = self.client.put(
            f'/api/specify/collectionobject/{obj.id}/', {
                'version': obj.version,
                'collectionobjecttype': '/api/specify/collectionobjecttype/%s/' % (
                    spmodels.Collectionobjecttype.objects.create(
                        collection=self.other_collection, name='restricted',
                        taxontreedef=self.taxontreedef,
                    ).id
                ),
            }, content_type='application/json',
        )
        self.assertEqual(response.status_code, 403, response.content)
        obj.refresh_from_db()
        self.assertEqual(obj.collectionobjecttype_id, self.collectionobjecttype.id)

    def test_scope_change_and_foreign_create_are_denied(self):
        obj = self.collectionobjects[0]
        for method, url, data in (
            ('put', f'/api/specify/collectionobject/{obj.id}/', {
                'version': obj.version, 'collectionmemberid': self.other_collection.id,
            }),
            ('post', '/api/specify/collectionobject/', {
                'collection': f'/api/specify/collection/{self.other_collection.id}/',
                'catalognumber': 'new-restricted',
            }),
        ):
            with self.subTest(method=method):
                response = getattr(self.client, method)(url, data, content_type='application/json')
                self.assertEqual(response.status_code, 403, response.content)
        obj.refresh_from_db()
        self.assertEqual(obj.collection_id, self.collection.id)
        self.assertEqual(obj.collectionmemberid, self.collection.id)
        self.assertFalse(spmodels.Collectionobject.objects.filter(catalognumber='new-restricted').exists())

    def test_nested_update_is_atomic(self):
        foreign = spmodels.Determination.objects.create(
            collectionobject=self.other_object, iscurrent=True,
        )
        obj = self.collectionobjects[0]
        response = self.client.put(
            f'/api/specify/collectionobject/{obj.id}/', {
                'version': obj.version, 'remarks': 'must roll back',
                'determinations': [{
                    'id': foreign.id, 'version': foreign.version, 'remarks': 'changed',
                }],
            }, content_type='application/json',
        )
        self.assertEqual(response.status_code, 403, response.content)
        obj.refresh_from_db()
        foreign.refresh_from_db()
        self.assertIsNone(obj.remarks)
        self.assertIsNone(foreign.remarks)
        self.assertEqual(foreign.collectionobject_id, self.other_object.id)

    def test_child_references_require_destination_mutation_permissions(self):
        self.grant_other_collection('/system/sp7/collection', 'access')
        self.grant_other_collection('%', 'read')
        own = spmodels.Determination.objects.create(
            collectionobject=self.collectionobjects[0], iscurrent=True,
        )
        foreign = spmodels.Determination.objects.create(
            collectionobject=self.other_object, iscurrent=True,
        )
        count = spmodels.Determination.objects.count()
        destination = f'/api/specify/collectionobject/{self.other_object.id}/'
        requests = [
            ('post', '/api/specify/determination/', {
                'collectionobject': destination, 'iscurrent': False,
            }),
            ('post', '/api/specify/determination/', {
                'collectionobject': destination, 'iscurrent': False,
                'collectionmemberid': self.collection.id,
            }),
            ('put', f'/api/specify/determination/{own.id}/', {
                'version': own.version, 'collectionobject': destination,
            }),
            ('put', f'/api/specify/determination/{foreign.id}/', {
                'version': foreign.version,
                'collectionobject': f'/api/specify/collectionobject/{self.collectionobjects[0].id}/',
                'collectionmemberid': self.collection.id,
            }),
        ]
        for method, url, data in requests:
            with self.subTest(method=method, url=url, membership=data.get('collectionmemberid')):
                response = getattr(self.client, method)(url, data, content_type='application/json')
                self.assertEqual(response.status_code, 403, response.content)
        own.refresh_from_db()
        foreign.refresh_from_db()
        self.assertEqual(own.collectionobject_id, self.collectionobjects[0].id)
        self.assertEqual(foreign.collectionobject_id, self.other_object.id)
        self.assertEqual(spmodels.Determination.objects.count(), count)

    def test_authorized_child_destinations_validate_creation_and_rescope_reassignment(self):
        self.grant_other_collection()
        destination = f'/api/specify/collectionobject/{self.other_object.id}/'
        for membership in ({}, {'collectionmemberid': None}):
            with self.subTest(membership=membership):
                response = self.client.post('/api/specify/determination/', {
                    'collectionobject': destination, 'iscurrent': False, **membership,
                }, content_type='application/json')
                self.assertEqual(response.status_code, 201, response.content)
                child = spmodels.Determination.objects.get(pk=response.json()['id'])
                self.assertEqual(child.collectionmemberid, self.other_collection.id)
        own = spmodels.Determination.objects.create(
            collectionobject=self.collectionobjects[0], iscurrent=True,
        )
        response = self.client.post('/api/specify/determination/', {
            'iscurrent': False, 'collectionobject': destination,
            'collectionmemberid': self.collection.id,
        }, content_type='application/json')
        self.assertEqual(response.status_code, 403, response.content)
        response = self.client.put(f'/api/specify/determination/{own.id}/', {
            'version': own.version, 'collectionmemberid': self.other_collection.id,
        }, content_type='application/json')
        self.assertEqual(response.status_code, 403, response.content)
        response = self.client.put(f'/api/specify/determination/{own.id}/', {
            'version': own.version, 'collectionobject': destination,
            'collectionmemberid': self.collection.id,
        }, content_type='application/json')
        self.assertEqual(response.status_code, 200, response.content)
        own.refresh_from_db()
        self.assertEqual(own.collectionobject_id, self.other_object.id)
        self.assertEqual(own.collectionmemberid, self.other_collection.id)

    def test_cross_collection_inline_attribute_inherits_parent_destination(self):
        self.grant_other_collection()
        response = self.client.post('/api/specify/collectionobject/', {
            'collection': f'/api/specify/collection/{self.other_collection.pk}/',
            'catalognumber': 'cross-inline',
            'collectionobjectattribute': {'text1': 'Inline attribute'},
        }, content_type='application/json')
        self.assertEqual(response.status_code, 201, response.content)
        obj = spmodels.Collectionobject.objects.get(pk=response.json()['id'])
        self.assertEqual(obj.collection_id, self.other_collection.pk)
        self.assertEqual(obj.collectionmemberid, self.other_collection.pk)
        self.assertEqual(obj.collectionobjectattribute.collectionmemberid, self.other_collection.pk)
        self.assertEqual(obj.collectionobjectattribute.text1, 'Inline attribute')

    def test_inline_attribute_prefers_existing_parent_membership(self):
        self.grant_other_collection()
        parent = spmodels.Collectionobject(
            collection=self.collection, collectionmemberid=self.other_collection.pk,
        )
        attribute = create_obj(
            self.collection, self.agent, 'collectionobjectattribute',
            {'text1': 'Inline attribute'}, parent_obj=parent,
        )
        self.assertEqual(attribute.collectionmemberid, self.other_collection.pk)

    def test_shared_scope_and_own_collection_remain_accessible(self):
        response = self.client.get(f'/api/specify/agent/{self.agent.id}/')
        self.assertEqual(response.status_code, 200, response.content)
        obj = self.collectionobjects[0]
        response = self.client.put(
            f'/api/specify/collectionobject/{obj.id}/',
            {'version': obj.version, 'remarks': 'allowed'}, content_type='application/json',
        )
        self.assertEqual(response.status_code, 200, response.content)
        obj.refresh_from_db()
        self.assertEqual(obj.remarks, 'allowed')

    def test_create_and_delete_in_own_collection(self):
        response = self.client.post('/api/specify/collectionobject/', {
            'collection': f'/api/specify/collection/{self.collection.id}/',
            'catalognumber': 'new-allowed',
        }, content_type='application/json')
        self.assertEqual(response.status_code, 201, response.content)
        obj = spmodels.Collectionobject.objects.get(pk=response.json()['id'])
        self.assertEqual(obj.collection_id, self.collection.id)
        response = self.client.delete(f'/api/specify/collectionobject/{obj.id}/')
        self.assertEqual(response.status_code, 204, response.content)
        self.assertFalse(spmodels.Collectionobject.objects.filter(pk=obj.id).exists())

    def test_collection_and_shared_scope_lists(self):
        foreign_division = spmodels.Division.objects.create(
            institution=self.institution, name='Foreign division',
        )
        foreign_agent = spmodels.Agent.objects.create(
            division=foreign_division, agenttype=0, lastname='restricted',
        )
        response = self.client.get('/api/specify/collection/')
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual([row['id'] for row in response.json()['objects']], [self.collection.id])
        response = self.client.get('/api/specify/agent/')
        self.assertEqual(response.status_code, 200, response.content)
        self.assertIn(self.agent.id, [row['id'] for row in response.json()['objects']])
        self.assertNotIn(foreign_agent.id, [row['id'] for row in response.json()['objects']])
        self.assertEqual(
            self.client.get(f'/api/specify/agent/{foreign_agent.id}/').status_code, 403,
        )

    def test_field_permissions_use_destination_collection(self):
        self.grant_other_collection('/system/sp7/collection', 'access')
        self.grant_other_collection('/table/collectionobject', '%')
        response = self.client.put(
            f'/api/specify/collectionobject/{self.other_object.id}/',
            {'version': self.other_object.version, 'remarks': 'changed'},
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 403, response.content)
        self.other_object.refresh_from_db()
        self.assertIsNone(self.other_object.remarks)

    def test_age_models_inherit_collectionobject_scope_for_reads(self):
        for model in (spmodels.Absoluteage, spmodels.Relativeage):
            with self.subTest(model=model.__name__):
                allowed, denied = [
                    model.objects.create(collectionobject=obj)
                    for obj in (self.collectionobjects[0], self.other_object)
                ]
                self.assertEqual(Scoping.model_from_instance(allowed), self.collection)
                self.assertEqual(Scoping.model_from_instance(denied), self.other_collection)
                self.assertEqual(Scoping.scope_type_from_class(model), ScopeType.COLLECTION)

                self.assertEqual(
                    list(permissions.filter_readable(model.objects.all(), self.agent)),
                    [allowed],
                )
                permissions.check_table_permissions(
                    self.collection, self.agent, allowed, 'read',
                )
                with self.assertRaises(permissions.NoMatchingRuleException):
                    permissions.check_table_permissions(
                        self.collection, self.agent, denied, 'read',
                    )

                url = f'/api/specify/{model.__name__.lower()}/'
                response = self.client.get(url)
                self.assertEqual(response.status_code, 200, response.content)
                self.assertEqual(
                    [row['id'] for row in response.json()['objects']], [allowed.id],
                )
                self.assertEqual(
                    self.client.get(f'{url}{allowed.id}/').status_code, 200,
                )
                self.assertEqual(
                    self.client.get(f'{url}{denied.id}/').status_code, 403,
                )

                row_url = f'/table_rows/specify_rows/{model.__name__.lower()}/'
                for age, readable in ((allowed, True), (denied, False)):
                    response = self.client.get(row_url, {
                        'fields': 'id', 'id': age.id,
                    })
                    self.assertEqual(response.status_code, 200, response.content)
                    self.assertEqual(response.json(), [[age.id]] if readable else [])

    def test_age_attachments_and_citations_use_collection_membership_scope(self):
        attachment = spmodels.Attachment.objects.create()
        referencework = spmodels.Referencework.objects.create(
            institution=self.institution, title='Age reference', referenceworktype=0,
        )
        permitted_collections = spmodels.Collection.objects.filter(pk=self.collection.pk)
        for age_model, age_field, attachment_model, citation_model in (
            (
                spmodels.Absoluteage, 'absoluteage',
                spmodels.Absoluteageattachment, spmodels.Absoluteagecitation,
            ),
            (
                spmodels.Relativeage, 'relativeage',
                spmodels.Relativeageattachment, spmodels.Relativeagecitation,
            ),
        ):
            ages = [
                age_model.objects.create(collectionobject=obj)
                for obj in (self.collectionobjects[0], self.other_object)
            ]
            for model, related_field, related in (
                (attachment_model, 'attachment', attachment),
                (citation_model, 'referencework', referencework),
            ):
                with self.subTest(model=model.__name__):
                    allowed, denied = [
                        model.objects.create(
                            collectionmember=collection,
                            **{age_field: age, related_field: related},
                        )
                        for collection, age in zip(
                            (self.collection, self.other_collection), ages,
                        )
                    ]
                    self.assertEqual(
                        list(Scoping.filter_records(
                            model.objects.all(), permitted_collections,
                        )),
                        [allowed],
                    )
                    url = f'/api/specify/{model.__name__.lower()}/'
                    response = self.client.get(url)
                    self.assertEqual(response.status_code, 200, response.content)
                    self.assertEqual(
                        [row['id'] for row in response.json()['objects']], [allowed.id],
                    )
                    response = self.client.get(f'{url}{allowed.id}/')
                    self.assertEqual(response.status_code, 200, response.content)
                    response = self.client.get(f'{url}{denied.id}/')
                    self.assertEqual(response.status_code, 403, response.content)

    def test_attachment_scope_is_enforced(self):
        attachments = [
            spmodels.Attachment.objects.create(scopetype=scope_type, scopeid=scope_id)
            for scope_type, scope_id in (
                (ScopeType.COLLECTION.value, self.collection.id),
                (ScopeType.COLLECTION.value, self.other_collection.id),
                (ScopeType.DISCIPLINE.value, self.discipline.id), (None, None),
            )
        ]
        response = self.client.get('/api/specify/attachment/')
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(
            {row['id'] for row in response.json()['objects']},
            {attachments[index].id for index in (0, 2, 3)},
        )
        response = self.client.get(f'/api/specify/attachment/{attachments[1].id}/')
        self.assertEqual(response.status_code, 403, response.content)

    def test_conservevent_attachment_links_respect_event_division(self):
        foreign_division = spmodels.Division.objects.create(
            institution=self.institution, name='Restricted division',
        )
        foreign_discipline = spmodels.Discipline.objects.create(
            division=foreign_division, datatype=self.datatype,
            geographytreedef=self.geographytreedef,
            geologictimeperiodtreedef=self.geologictimeperiodtreedef,
            name='Restricted discipline', type='botany',
        )
        self.other_collection.discipline = foreign_discipline
        self.other_collection.save()
        links = []
        for division in (self.division, foreign_division):
            description = spmodels.Conservdescription.objects.create(division=division)
            event = spmodels.Conservevent.objects.create(conservdescription=description)
            links.append(spmodels.Conserveventattachment.objects.create(
                conservevent=event, attachment=spmodels.Attachment.objects.create(), ordinal=0,
            ))

        response = self.client.get('/api/specify/conserveventattachment/')
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(
            [row['id'] for row in response.json()['objects']], [links[0].id],
        )
        response = self.client.get('/api/specify/conserveventattachment/', {
            'conservevent': links[1].conservevent_id,
        })
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.json()['objects'], [])
        response = self.client.get(f'/api/specify/conserveventattachment/{links[0].id}/')
        self.assertEqual(response.status_code, 200, response.content)
        response = self.client.get(f'/api/specify/conserveventattachment/{links[1].id}/')
        self.assertEqual(response.status_code, 403, response.content)

    def test_tree_scope_is_shared_only_with_its_discipline(self):
        foreign_discipline = spmodels.Discipline.objects.create(
            division=self.division, datatype=self.datatype,
            geographytreedef=self.geographytreedef,
            geologictimeperiodtreedef=self.geologictimeperiodtreedef,
            name='Foreign discipline', type='botany',
        )
        trees = []
        ranks = []
        for discipline in (self.discipline, foreign_discipline):
            definition = spmodels.Taxontreedef.objects.create(
                name=discipline.name, discipline=discipline,
            )
            item = definition.treedefitems.create(name='Root', rankid=0)
            ranks.append(item)
            trees.append(spmodels.Taxon.objects.create(
                name='Root', rankid=0, definition=definition, definitionitem=item,
            ))
        for table, records in (('taxon', trees), ('taxontreedefitem', ranks)):
            with self.subTest(table=table):
                response = self.client.get(f'/api/specify/{table}/')
                self.assertEqual(response.status_code, 200, response.content)
                self.assertEqual(
                    [row['id'] for row in response.json()['objects']], [records[0].id],
                )
                response = self.client.get(f'/api/specify/{table}/{records[1].id}/')
                self.assertEqual(response.status_code, 403, response.content)

    def test_tree_writes_authorize_the_definition_implied_by_the_rank(self):
        foreign = spmodels.Discipline.objects.create(
            name='Restricted discipline', type='botany', datatype=self.datatype,
            division=self.division, geographytreedef=self.geographytreedef,
            geologictimeperiodtreedef=self.geologictimeperiodtreedef,
        )
        self.other_collection.discipline = foreign
        self.other_collection.save()
        self.grant_other_collection('/system/sp7/collection', 'access')
        self.grant_other_collection('%', 'read')
        definitions = [
            spmodels.Taxontreedef.objects.create(name=discipline.name, discipline=discipline)
            for discipline in (self.discipline, foreign)
        ]
        ranks = [definition.treedefitems.create(name='Root', rankid=0) for definition in definitions]
        taxon = spmodels.Taxon.objects.create(
            name='Allowed root', definition=definitions[0], definitionitem=ranks[0],
        )
        for method, url, data in (
            ('post', '/api/specify/taxon/', {'name': 'Unauthorized root'}),
            ('post', '/api/specify/taxon/', {
                'name': 'Unauthorized root',
                'definition': f'/api/specify/taxontreedef/{definitions[0].id}/',
            }),
            ('put', f'/api/specify/taxon/{taxon.id}/', {'version': taxon.version}),
        ):
            with self.subTest(method=method, data=data):
                response = getattr(self.client, method)(url, {
                    **data, 'definitionitem': f'/api/specify/taxontreedefitem/{ranks[1].id}/',
                }, content_type='application/json')
                self.assertEqual(response.status_code, 403, response.content)
        taxon.refresh_from_db()
        self.assertEqual(taxon.definition_id, definitions[0].id)
        self.assertEqual(taxon.definitionitem_id, ranks[0].id)
        self.assertFalse(spmodels.Taxon.objects.filter(name='Unauthorized root').exists())

    def test_taxon_rank_without_discipline_uses_institution_scope(self):
        rank = self.taxontreedef.treedefitems.create(name='Root', rankid=0)
        self.assertIsNone(Scoping.record_scope_filter(rank))
        self.assertCountEqual(
            Scoping.collections_for_record(rank),
            spmodels.Collection.objects.filter(
                discipline__division__institution=self.institution,
            ),
        )
        response = self.client.get(f'/api/specify/taxontreedefitem/{rank.id}/')
        self.assertEqual(response.status_code, 200, response.content)
        queryset = spmodels.Taxontreedefitem.objects.filter(pk=rank.id)
        self.assertEqual(
            list(Scoping.filter_records(queryset, spmodels.Collection.objects.filter(
                pk=self.collection.id,
            ))), [rank],
        )
        self.assertFalse(Scoping.filter_records(
            queryset, spmodels.Collection.objects.none(),
        ).exists())
        empty_institution = spmodels.Institution.objects.create(
            name='Empty institution', isaccessionsglobal=True,
            issecurityon=False, isserverbased=False,
            issharinglocalities=True, issinglegeographytree=True,
        )
        with patch.object(
            spmodels.Institution.objects, 'get', return_value=empty_institution,
        ):
            self.assertFalse(Scoping.collections_for_record(rank).exists())
            self.assertFalse(Scoping.filter_records(
                queryset, spmodels.Collection.objects.all(),
            ).exists())

    def test_parentless_fieldnotebook_records_use_their_discipline_scope(self):
        foreign_discipline = spmodels.Discipline.objects.create(
            name='Restricted discipline', type='botany', datatype=self.datatype,
            division=self.division, geographytreedef=self.geographytreedef,
            geologictimeperiodtreedef=self.geologictimeperiodtreedef,
        )
        pageset = spmodels.Fieldnotebookpageset.objects.create(
            discipline=self.discipline,
        )
        foreign_pageset = spmodels.Fieldnotebookpageset.objects.create(
            discipline=foreign_discipline,
        )
        page = spmodels.Fieldnotebookpage.objects.create(
            discipline=self.discipline, pagenumber='local',
        )
        foreign_page = spmodels.Fieldnotebookpage.objects.create(
            discipline=foreign_discipline, pagenumber='foreign',
        )

        for obj, discipline in (
            (pageset, self.discipline),
            (foreign_pageset, foreign_discipline),
            (page, self.discipline),
            (foreign_page, foreign_discipline),
        ):
            with self.subTest(model=type(obj).__name__, discipline=discipline.name):
                self.assertEqual(Scoping.model_from_instance(obj), discipline)
                self.assertEqual(
                    Scoping.record_scope_filter(obj), {'discipline_id': discipline.id},
                )

        for model, allowed, denied in (
            (spmodels.Fieldnotebookpageset, pageset, foreign_pageset),
            (spmodels.Fieldnotebookpage, page, foreign_page),
        ):
            with self.subTest(model=model.__name__):
                self.assertEqual(
                    list(permissions.filter_readable(model.objects.all(), self.agent)),
                    [allowed],
                )
                permissions.check_table_permissions(
                    self.collection, self.agent, allowed, 'read',
                )
                with self.assertRaises(permissions.NoMatchingRuleException):
                    permissions.check_table_permissions(
                        self.collection, self.agent, denied, 'read',
                    )

    def test_shared_tree_scope_uses_all_referencing_disciplines(self):
        shared_discipline = spmodels.Discipline.objects.create(
            name='Shared tree discipline',
            geologictimeperiodtreedef=self.geologictimeperiodtreedef,
            geographytreedef=self.geographytreedef,
            division=self.division,
            datatype=self.datatype,
            type='paleobotany',
        )
        shared_collection = spmodels.Collection.objects.create(
            collectionname='Shared tree collection',
            discipline=shared_discipline,
        )
        geography = spmodels.Geography.objects.create(
            name='Shared geography',
            rankid=0,
            definition=self.geographytreedef,
            definitionitem=self.geographytreedef.treedefitems.get(rankid=0),
        )

        for model in (
            spmodels.Geography, spmodels.Geologictimeperiod,
            spmodels.Lithostrat, spmodels.Tectonicunit,
        ):
            self.assertEqual(
                Scoping.record_scope_path(model),
                (ScopeType.DISCIPLINE, 'definition__disciplines'),
            )

        scope_filter = Scoping.record_scope_filter(geography)
        self.assertEqual(
            scope_filter,
            {'discipline__geographytreedef_id': self.geographytreedef.id},
        )
        self.assertCountEqual(
            Scoping.collections_for_record(geography),
            spmodels.Collection.objects.filter(
                discipline__in=(self.discipline, shared_discipline),
            ),
        )
        self.assertEqual(
            list(Scoping.filter_records(
                spmodels.Geography.objects.filter(pk=geography.pk),
                spmodels.Collection.objects.filter(
                    discipline__in=(self.discipline, shared_discipline),
                ),
            )),
            [geography],
        )
        for collection in (self.collection, shared_collection):
            self.assertEqual(
                list(filter_by_collection(
                    spmodels.Geography.objects.filter(pk=geography.pk), collection,
                )),
                [geography],
            )

        models.UserPolicy.objects.all().delete()
        for resource, action in (
            ('/system/sp7/collection', 'access'),
            ('/table/geography', 'read'),
        ):
            models.UserPolicy.objects.create(
                collection=shared_collection, specifyuser=self.specifyuser,
                resource=resource, action=action,
            )
        with permissions.cache_permission_queries():
            permissions.enforce_record(
                self.agent, geography, ['/table/geography'], 'read',
            )
            with self.assertNumQueries(0):
                permissions.enforce_record(
                    self.agent, geography, ['/table/geography'], 'read',
                )
            self.assertEqual(
                list(permissions.filter_readable(
                    spmodels.Geography.objects.filter(pk=geography.pk), self.agent,
                )),
                [geography],
            )

    def test_recordset_navigation_includes_globally_readable_empty_hierarchy(self):
        for model, fields in (
            (spmodels.Discipline, {
                'type': 'botany', 'datatype': self.datatype, 'division': self.division,
                'geographytreedef': self.geographytreedef,
                'geologictimeperiodtreedef': self.geologictimeperiodtreedef,
            }),
            (spmodels.Division, {'institution': self.institution}),
            (spmodels.Institution, {
                'isaccessionsglobal': True, 'issecurityon': False,
                'isserverbased': False, 'issharinglocalities': True,
                'issinglegeographytree': True,
            }),
        ):
            with self.subTest(model=model.__name__):
                targets = [
                    model.objects.create(name=f'Empty {model.__name__} {index}', **fields)
                    for index in range(3)
                ]
                recordset = spmodels.Recordset.objects.create(
                    collectionmemberid=self.collection.id,
                    dbtableid=model.specify_model.tableId,
                    name=f'Empty {model.__name__} records', type=0,
                    specifyuser=self.specifyuser,
                )
                for target in targets:
                    recordset.recordsetitems.create(recordid=target.pk)
                with permissions.cache_permission_queries():
                    self.assertIsNone(get_recordset_info(
                        targets[1], recordset.pk, actor=self.agent,
                    ))
                policy = models.UserPolicy.objects.create(
                    collection=None, specifyuser=self.specifyuser,
                    resource=f'/table/{model.specify_model.name.lower()}', action='read',
                )
                with permissions.cache_permission_queries():
                    self.assertEqual(
                        get_recordset_info(targets[1], recordset.pk, actor=self.agent),
                        {
                            'recordsetid': recordset.pk, 'total_count': 3, 'index': 1,
                            'previous': f'/api/specify/{model.specify_model.name.lower()}/{targets[0].pk}/',
                            'next': f'/api/specify/{model.specify_model.name.lower()}/{targets[2].pk}/',
                        },
                    )
                policy.delete()

    def test_recordset_membership_and_navigation(self):
        own = spmodels.Recordset.objects.create(
            collectionmemberid=self.collection.id, dbtableid=1,
            name='Own', type=0, specifyuser=self.specifyuser,
        )
        foreign = spmodels.Recordset.objects.create(
            collectionmemberid=self.other_collection.id, dbtableid=1,
            name='Foreign', type=0, specifyuser=self.specifyuser,
        )
        obj = self.collectionobjects[0]
        for target in (obj, self.other_object):
            own.recordsetitems.create(recordid=target.id)
        response = self.client.get(
            f'/api/specify/collectionobject/{obj.id}/', {'recordsetid': own.id},
        )
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.json()['recordset_info']['total_count'], 1)
        self.assertIsNone(response.json()['recordset_info']['next'])
        response = self.client.get(
            f'/api/specify/collectionobject/{obj.id}/', {'recordsetid': foreign.id},
        )
        self.assertEqual(response.status_code, 403, response.content)
        response = self.client.post(
            f'/api/specify/collectionobject/?recordsetid={foreign.id}',
            {'collection': f'/api/specify/collection/{self.collection.id}/',
             'catalognumber': 'must-roll-back'},
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 403, response.content)
        self.assertFalse(spmodels.Collectionobject.objects.filter(catalognumber='must-roll-back').exists())
        response = self.client.post('/api/specify/recordsetitem/', {
            'recordset': f'/api/specify/recordset/{own.id}/', 'recordid': self.other_object.id,
        }, content_type='application/json')
        self.assertEqual(response.status_code, 403, response.content)
        self.assertEqual(own.recordsetitems.count(), 2)


@skipUnlessDBFeature('has_select_for_update')
class CollectionScopeTransactionTests(ApiTransactionTests):
    def test_create_waits_for_collectionobject_move(self):
        self._assert_child_change_and_move_are_serialized(move_first=True)

    def test_collectionobject_move_waits_for_create(self):
        self._assert_child_change_and_move_are_serialized(move_first=False)

    def test_reassignment_waits_for_collectionobject_move(self):
        self._assert_child_change_and_move_are_serialized(move_first=True, reassign=True)

    def test_collectionobject_move_waits_for_reassignment(self):
        self._assert_child_change_and_move_are_serialized(move_first=False, reassign=True)

    def _assert_child_change_and_move_are_serialized(self, *, move_first, reassign=False):
        destination = spmodels.Collection.objects.create(
            collectionname='Move destination', discipline=self.discipline,
        )
        co = self.collectionobjects[0]
        if reassign:
            original = spmodels.Determination.objects.create(
                collectionobject=self.collectionobjects[1], iscurrent=True,
            )
        first_paused = Event()
        release_first = Event()
        second_lock_attempted = Event()
        original_save = crud.autonumber_and_save
        original_cascade = crud._cascade_collection_membership

        def pause():
            first_paused.set()
            self.assertTrue(release_first.wait(10), 'First operation was not released')

        def save(collection, user, obj):
            if not move_first and not reassign and isinstance(obj, spmodels.Determination):
                pause()
            return original_save(collection, user, obj)

        def cascade(collection, agent, obj, previous_member_id):
            if (
                move_first and isinstance(obj, spmodels.Collectionobject)
                or not move_first and reassign and isinstance(obj, spmodels.Determination)
            ):
                pause()
            return original_cascade(collection, agent, obj, previous_member_id)

        def observe_lock(execute, sql, params, many, context):
            if 'FOR UPDATE' in sql.upper() and '`collectionobject`' in sql:
                second_lock_attempted.set()
            return execute(sql, params, many, context)

        def change_child():
            if reassign:
                return crud.update_obj(
                    self.collection, self.agent, 'determination', original.id, original.version, {
                        'collectionobject': f'/api/specify/collectionobject/{co.id}/',
                    },
                )
            return create_obj(self.collection, self.agent, 'determination', {
                'collectionobject': f'/api/specify/collectionobject/{co.id}/',
                'iscurrent': True,
            })

        def move():
            return crud.update_obj(
                self.collection, self.agent, 'collectionobject', co.id, co.version, {
                    'collection': f'/api/specify/collection/{destination.id}/',
                    'collectionmemberid': destination.id,
                },
            )

        def run(operation, *, observe=False):
            try:
                if observe:
                    with connection.execute_wrapper(observe_lock):
                        return operation()
                return operation()
            finally:
                connection.close()

        with (
            patch.object(crud, 'autonumber_and_save', side_effect=save),
            patch.object(crud, '_cascade_collection_membership', side_effect=cascade),
            ThreadPoolExecutor(max_workers=2) as executor,
        ):
            first = executor.submit(run, move if move_first else change_child)
            try:
                self.assertTrue(first_paused.wait(10), 'First operation did not reach pause')
                second = executor.submit(run, change_child if move_first else move, observe=True)
                self.assertTrue(second_lock_attempted.wait(10), 'Owner lock was not requested')
                self.assertFalse(second.done(), 'Competing operation did not wait for the owner')
            finally:
                release_first.set()
            first.result(timeout=10)
            second.result(timeout=10)

        co.refresh_from_db()
        determination = spmodels.Determination.objects.get(collectionobject=co)
        self.assertEqual(co.collectionmemberid, destination.id)
        self.assertEqual(determination.collectionmemberid, destination.id)


class PermissionsApiTest(ApiTests):
    def setUp(self):
        super().setUp()
        initialize.wipe_permissions()

        models.UserPolicy.objects.create(
            collection=None,
            specifyuser=self.specifyuser,
            resource='%',
            action='%',
        )
        # Because the test database doesn't have specifyuser_spprincipal
        from specifyweb.backend.context import views
        views.users_collections_for_sp6 = lambda cursor, userid: []

    def test_set_user_policies(self) -> None:
        c = Client()
        c.force_login(self.specifyuser)
        response = c.put(
            f'/permissions/user_policies/{self.collection.id}/{self.specifyuser.id}/',
            data={
                '/table/%': ['%'],
                '/field/%': ['%']
            },
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 204)

        response = c.get(f'/permissions/user_policies/{self.collection.id}/{self.specifyuser.id}/')
        data = json.loads(response.content)
        self.assertEqual(data['/table/%'], ['%'])
        self.assertEqual(data['/field/%'], ['%'])

    def test_all_user_roles_includes_presence_for_collection_users(self) -> None:
        from specifyweb.backend.accounts.models import UserPresence

        UserPresence.objects.create(
            specifyuser=self.specifyuser,
            last_heartbeat=timezone.now(),
            last_activity=timezone.now(),
        )

        c = Client()
        c.force_login(self.specifyuser)
        response = c.get(f'/permissions/user_roles/{self.collection.id}/')

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        current_user = next(
            user for user in data if user['userid'] == self.specifyuser.id)
        self.assertEqual(current_user['presence'], 'active')

    def test_set_user_policies_institution(self) -> None:
        c = Client()
        c.force_login(self.specifyuser)
        response = c.put(
            f'/permissions/user_policies/institution/{self.specifyuser.id}/',
            data={
                '/table/%': ['%'],
                '%': ['%'],
            },
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 204)

        response = c.get(f'/permissions/user_policies/institution/{self.specifyuser.id}/')
        data = json.loads(response.content)
        self.assertEqual(data['/table/%'], ['%'])
        self.assertEqual(data['%'], ['%'])

    def test_set_no_admin(self) -> None:
        c = Client()
        c.force_login(self.specifyuser)

        models.UserPolicy.objects.all().delete()

        # Make self.specifyuser an admin
        models.UserPolicy.objects.create(collection=None, specifyuser=self.specifyuser, resource="%", action="%")

        # There's an admin user
        self.assertTrue(models.UserPolicy.objects.filter(collection__isnull=True, resource='%', action='%').exists())

        response = c.put(
            f'/permissions/user_policies/institution/{self.specifyuser.id}/',
            data={
                '/table/%': ['%'],
                '/field/%': ['%']
            },
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.content)
        self.assertIn("NoAdminUsersException", data)

        response = c.put(
            f'/permissions/user_policies/institution/{self.specifyuser.id}/',
            data={'%': ['%'],},
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 204)

    def test_collection_access(self) -> None:
        c = Client()
        c.force_login(self.specifyuser)

        models.UserPolicy.objects.all().delete()
        models.UserPolicy.objects.create(collection=None, specifyuser=self.specifyuser, resource="/table/%", action="read")

        response = c.get('/api/specify/collectionobject/')
        self.assertEqual(response.status_code, 403)
        data = json.loads(response.content)
        self.assertEqual(data, {
            'NoMatchingRuleException': [{
                'collectionid': self.collection.id,
                'userid': self.specifyuser.id,
                'resource': '/system/sp7/collection',
                'action': 'access'}]
        })

        models.UserPolicy.objects.create(collection=self.collection, specifyuser=self.specifyuser, resource="/system/sp7/collection", action="access")
        response = c.get('/api/specify/collectionobject/')
        self.assertEqual(response.status_code, 200)


    def test_create_get_delete_role(self) -> None:
        c = Client()
        c.force_login(self.specifyuser)
        response = c.post(
            f'/permissions/roles/{self.collection.id}/',
            data={
                'name': 'fullaccess',
                'description': 'fullaccess role',
                'policies': {
                    '/table/%': ['%'],
                    '/field/%': ['%']
                },
            },
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 201)
        data_role = json.loads(response.content)

        response = c.get(f'/permissions/roles/{self.collection.id}/')
        data_roles = json.loads(response.content)

        self.assertEqual(data_roles, [data_role])
        roleid = data_role['id']

        response = c.get(f'/permissions/role/{roleid}/')
        data_get = json.loads(response.content)
        self.assertEqual(data_get, data_role)

        response = c.delete(f'/permissions/role/{roleid}/')
        self.assertEqual(response.status_code, 204)

        response = c.get(f'/permissions/roles/{self.collection.id}/')
        data_roles = json.loads(response.content)

        self.assertEqual(data_roles, [])

    def test_set_role_policies(self) -> None:
        c = Client()
        c.force_login(self.specifyuser)
        response = c.post(
            f'/permissions/roles/{self.collection.id}/',
            data={
                'name': 'fullaccess',
                'description': 'fullaccess role',
                'policies': {
                    '/table/%': ['read'],
                    '/field/%': ['read'],
                },
            },
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 201)
        roleid = json.loads(response.content)['id']

        update_data = {
            'name': 'fullaccess_updated',
            'description': 'fullaccess_updated role',
            'policies': {
                '/table/%': ['%'],
                '/field/%': ['%'],
            },
        }

        response = c.put(
            f'/permissions/role/{roleid}/',
            data=update_data,
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 204)

        response = c.get(f'/permissions/role/{roleid}/')
        data_get = json.loads(response.content)
        self.assertEqual(data_get, {'id': roleid, **update_data})

    def test_create_get_delete_library_role(self) -> None:
        c = Client()
        c.force_login(self.specifyuser)
        response = c.post(
            f'/permissions/library_roles/',
            data={
                'name': 'fullaccess library',
                'description': 'fullaccess library role',
                'policies': {
                    '/table/%': ['%'],
                    '/field/%': ['%'],
                }
            },
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 201)
        data_role = json.loads(response.content)

        response = c.get(f'/permissions/library_roles/')
        data_roles = json.loads(response.content)

        self.assertEqual(data_roles, [data_role])
        roleid = data_role['id']

        response = c.get(f'/permissions/library_role/{roleid}/')
        data_get = json.loads(response.content)
        self.assertEqual(data_get, data_role)

        response = c.delete(f'/permissions/library_role/{roleid}/')
        self.assertEqual(response.status_code, 204)

        response = c.get(f'/permissions/library_roles/')
        data_roles = json.loads(response.content)

        self.assertEqual(data_roles, [])

    def test_copy_role_from_library(self) -> None:
        c = Client()
        c.force_login(self.specifyuser)
        response = c.post(
            f'/permissions/library_roles/',
            data={
                'name': 'fullaccess library',
                'description': 'fullaccess library role',
                'policies': {
                    '/table/%': ['%'],
                    '/field/%': ['%'],
                }
            },
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 201)
        lib_role = json.loads(response.content)

        response = c.post(
            f'/permissions/roles/{self.collection.id}/',
            data={'libraryroleid': lib_role['id']},
            content_type='application/json',
        )
        role = json.loads(response.content)
        for f in "name description policies".split():
            self.assertEqual(role[f], lib_role[f])


    def test_set_library_role_policies(self) -> None:
        c = Client()
        c.force_login(self.specifyuser)
        response = c.post(
            f'/permissions/library_roles/',
            data={
                'name': 'fullaccess library',
                'description': 'fullaccess lib role',
                'policies': {
                    '/table/%': ['read'],
                    '/field/%': ['read'],
                },
            },
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 201)
        roleid = json.loads(response.content)['id']

        update_data = {
            'name': 'fullaccess_updated lib',
            'description': 'fullaccess role updated lib',
            'policies': {
                '/table/%': ['%'],
                '/field/%': ['%'],
            }
        }

        response = c.put(
            f'/permissions/library_role/{roleid}/',
            data=update_data,
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 204)

        response = c.get(f'/permissions/library_role/{roleid}/')
        data_get = json.loads(response.content)
        self.assertEqual(data_get, {'id': roleid, **update_data})

    def test_set_get_user_roles(self) -> None:
        full_access = {
            'name': 'fullaccess',
            'description': 'fullaccess role',
            'policies': {
                '/table/%': ['read'],
                '/field/%': ['read'],
            },
        }

        c = Client()
        c.force_login(self.specifyuser)

        # create a role
        response = c.post(
            f'/permissions/roles/{self.collection.id}/',
            data=full_access,
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 201)
        role = json.loads(response.content)

        # assign user to role
        response = c.put(
            f'/permissions/user_roles/{self.collection.id}/{self.specifyuser.id}/',
            data=[{'id': role['id']}],
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 204)

        # check user roles contains assigned role
        response = c.get(f'/permissions/user_roles/{self.collection.id}/{self.specifyuser.id}/')
        data = json.loads(response.content)
        self.assertEqual(data, [{'id': role['id'], 'name': role['name']}])

        # set user roles to empty
        response = c.put(
            f'/permissions/user_roles/{self.collection.id}/{self.specifyuser.id}/',
            data=[],
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 204)

        # check user roles are empty
        response = c.get(f'/permissions/user_roles/{self.collection.id}/{self.specifyuser.id}/')
        data = json.loads(response.content)
        self.assertEqual(data, [])

    def test_query(self) -> None:
        c = Client()
        c.force_login(self.specifyuser)

        response = c.post(
            '/permissions/query/',
            data={
                'queries': [{'resource': '/table/collectionobject', 'actions': ['create', 'update', 'delete']}]
            },
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.content)

    def test_query_reflects_policy_changes_immediately(self) -> None:
        models.UserPolicy.objects.all().delete()
        request = (
            self.collection.id,
            self.specifyuser.id,
            "/table/collectionobject",
            "create",
        )

        self.assertFalse(permissions.query(*request).allowed)

        policy = models.UserPolicy.objects.create(
            collection=self.collection,
            specifyuser=self.specifyuser,
            resource="/table/collectionobject",
            action="create",
        )
        self.assertTrue(permissions.query(*request).allowed)

        policy.delete()
        self.assertFalse(permissions.query(*request).allowed)

    def test_add_access_to_new_collection_exception(self) -> None:
        user2 = models.Specifyuser.objects.create( # type: ignore
            isloggedin=False,
            isloggedinreport=False,
            name="testuser2",
            password="205C0D906445E1C71CA77C6D714109EB6D582B03A5493E4C") # testuser


        c = Client()
        c.force_login(self.specifyuser)

        response = c.put(
            f'/permissions/user_policies/{self.collection.id}/{user2.id}/',
            data={
                permissions.CollectionAccessPT.resource: ["access"],
            },
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            json.loads(response.content),
            {'MissingAgentForAccessibleCollection': {
                'missing_for_7': [self.collection.id],
                'missing_for_6': [],
                'all_accessible_divisions': [self.division.id]
            }}
        )

        agent2 = spmodels.Agent.objects.create( # type: ignore
            agenttype=0,
            firstname="Test",
            lastname="User",
            division=self.division,
            specifyuser=user2)

        response = c.put(
            f'/permissions/user_policies/{self.collection.id}/{user2.id}/',
            data={
                permissions.CollectionAccessPT.resource: ["access"],
            },
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 204)

    def test_add_access_to_new_collection_via_role_exception(self) -> None:
        c = Client()
        c.force_login(self.specifyuser)
        response = c.post(
            f'/permissions/roles/{self.collection.id}/',
            data={
                'name': 'access collection',
                'description': 'foo',
                'policies': {
                    permissions.CollectionAccessPT.resource: ["access"],
                },
            },
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 201)
        role = json.loads(response.content)

        user2 = spmodels.Specifyuser.objects.create( # type: ignore
            isloggedin=False,
            isloggedinreport=False,
            name="testuser2",
            password="205C0D906445E1C71CA77C6D714109EB6D582B03A5493E4C") # testuser

        response = c.put(
            f'/permissions/user_roles/{self.collection.id}/{user2.id}/',
            data=[{'id': role['id']}],
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            json.loads(response.content),
            {'MissingAgentForAccessibleCollection': {
                'missing_for_7': [self.collection.id],
                'missing_for_6': [],
                'all_accessible_divisions': [self.division.id]
            }}
        )

        agent2 = spmodels.Agent.objects.create( # type: ignore
            agenttype=0,
            firstname="Test",
            lastname="User",
            division=self.division,
            specifyuser=user2)

        response = c.put(
            f'/permissions/user_policies/{self.collection.id}/{user2.id}/',
            data={
                permissions.CollectionAccessPT.resource: ["access"],
            },
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 204)

    def test_add_access_to_new_collection_via_updated_role_exception(self) -> None:
        c = Client()
        c.force_login(self.specifyuser)
        response = c.post(
            f'/permissions/roles/{self.collection.id}/',
            data={
                'name': 'access collection',
                'description': 'foo',
                'policies': {
                },
            },
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 201)
        role = json.loads(response.content)

        user2 = spmodels.Specifyuser.objects.create( # type: ignore
            isloggedin=False,
            isloggedinreport=False,
            name="testuser2",
            password="205C0D906445E1C71CA77C6D714109EB6D582B03A5493E4C") # testuser

        response = c.put(
            f'/permissions/user_roles/{self.collection.id}/{user2.id}/',
            data=[{'id': role['id']}],
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 204)

        response = c.put(
            f'/permissions/role/{role["id"]}/',
            data={
                'name': 'access collection',
                'description': 'foo',
                'policies': {
                    permissions.CollectionAccessPT.resource: ["access"],
                },
            },
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            json.loads(response.content),
            {'MissingAgentForAccessibleCollection': {
                'missing_for_7': [self.collection.id],
                'missing_for_6': [],
                'all_accessible_divisions': [self.division.id]
            }}
        )

        agent2 = spmodels.Agent.objects.create( # type: ignore
            agenttype=0,
            firstname="Test",
            lastname="User",
            division=self.division,
            specifyuser=user2)

        response = c.put(
            f'/permissions/role/{role["id"]}/',
            data={
                'name': 'access collection',
                'description': 'foo',
                'policies': {
                    permissions.CollectionAccessPT.resource: ["access"],
                },
            },
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 204)

    def test_create_user_institution(self) -> None:
        c = Client()
        c.force_login(self.specifyuser)

        response = c.post(
            '/api/specify/specifyuser/',
            data=json.dumps({'name': 'testuser2'}),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 201)

        user2 = spmodels.Specifyuser.objects.get(name='testuser2')
        response = c.get(f'/api/specify/specifyuser/{user2.id}/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content)['name'], 'testuser2')

    def test_create_user_in_collection(self) -> None:
        c = Client()
        c.force_login(self.specifyuser)

        response = c.post(
            '/api/specify/specifyuser/',
            data=json.dumps({'name': 'testuser2'}),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 201)

        user2 = spmodels.Specifyuser.objects.get(name='testuser2')
        user2.set_password('testuser2password')
        user2.save()

        # a user needs an agent in the discipline before getting collection access
        spmodels.Agent.objects.create( # type: ignore
            agenttype=0,
            firstname="Test",
            lastname="User",
            division=self.division,
            specifyuser=user2)

        response = c.put(
            f'/permissions/user_policies/{self.collection.id}/{user2.id}/',
            data={
                permissions.CollectionAccessPT.resource: ["access"],
                '/table/collectionobject': ["read"],
                '/field/%': ["%"],
            },
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 204)

        # the new user can log in and read the collection's collection objects
        c2 = Client()
        self.assertTrue(c2.login(name='testuser2', password='testuser2password'))
        response = c2.get('/api/specify/collectionobject/')
        self.assertEqual(response.status_code, 200)

    def test_delete_user(self) -> None:
        c = Client()
        c.force_login(self.specifyuser)

        user2 = spmodels.Specifyuser.objects.create( # type: ignore
            isloggedin=False,
            isloggedinreport=False,
            name="testuser2",
            password="")

        models.UserPolicy.objects.create(
            collection=self.collection,
            specifyuser=user2,
            resource="/table/%",
            action="read",
        )

        response = c.delete(f'/api/specify/specifyuser/{user2.id}/')
        self.assertEqual(response.status_code, 204)

        self.assertFalse(spmodels.Specifyuser.objects.filter(id=user2.id).exists())
        self.assertFalse(models.UserPolicy.objects.filter(specifyuser_id=user2.id).exists())


    def test_no_access_to_other_collection(self) -> None:
    # making a second collection
        other_collection = spmodels.Collection.objects.create(
            catalognumformatname="test",
            collectionname="Other Test Collection",
            isembeddedcollectingevent=False,
            discipline=self.discipline
        )

        # creating a new user
        user2 = spmodels.Specifyuser.objects.create( # type: ignore
            isloggedin=False,
            isloggedinreport=False,
            name="testuser2",
            password=""
        )
        user2.set_password('testuser2password')
        user2.save()

        spmodels.Agent.objects.create(
            agenttype=0,
            firstname="Test",
            lastname="User",
            division=self.division,
            specifyuser=user2
        )

        models.UserPolicy.objects.create(
            collection=self.collection,
            specifyuser=user2,
            resource=permissions.CollectionAccessPT.resource,
            action="access")
        models.UserPolicy.objects.create(
            collection=self.collection,
            specifyuser=user2,
            resource="/table/collectionobject",
            action="read")

        c = Client()
        self.assertTrue(c.login(name='testuser2', password='testuser2password'))

        # the user has access to this collection
        c.cookies['collection'] = str(self.collection.id)
        response = c.get('/api/specify/collectionobject/')
        self.assertEqual(response.status_code, 200)

        # but not to another collection, even if the collection cookie is changed
        c.cookies['collection'] = str(other_collection.id)
        response = c.get('/api/specify/collectionobject/')
        self.assertEqual(response.status_code, 403)
        self.assertEqual(json.loads(response.content), {
            'NoMatchingRuleException': [{
                'collectionid': other_collection.id,
                'userid': user2.id,
                'resource': permissions.CollectionAccessPT.resource,
                'action': 'access',
            }]
        })
