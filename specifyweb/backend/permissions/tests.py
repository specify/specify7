import json
from unittest.mock import patch

from django.test import Client, RequestFactory
from django.utils import timezone

from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.specify import models as spmodels
from . import models, permissions, initialize

class ScopedPermissionTestBase(ApiTests):
    resource = '/table/collectionobject'

    def setUp(self):
        super().setUp()
        initialize.wipe_permissions()
        self.other_collection = spmodels.Collection.objects.create(
            catalognumformatname='test',
            collectionname='Other Collection',
            isembeddedcollectingevent=False,
            discipline=self.discipline,
        )

    def grant(self, collection, resource, action):
        models.UserPolicy.objects.create(
            collection=collection,
            specifyuser=self.specifyuser,
            resource=resource,
            action=action,
        )

    def grant_access(self, collection):
        target = permissions.CollectionAccessPT.access
        self.grant(collection, target.resource(), target.action())

class ScopedPermissionTests(ScopedPermissionTestBase):
    def test_denies_without_policies(self):
        self.assertFalse(permissions.has_permission_in_scope(
            self.collection, self.specifyuser.id, self.resource, 'read'
        ))

    def test_requires_collection_access(self):
        self.grant(self.collection, self.resource, 'read')

        self.assertFalse(permissions.has_permission_in_scope(
            self.collection, self.specifyuser.id, self.resource, 'read'
        ))

    def test_requires_requested_action(self):
        self.grant_access(self.collection)
        self.grant(self.collection, self.resource, 'read')

        self.assertTrue(permissions.has_permission_in_scope(
            self.collection, self.specifyuser.id, self.resource, 'read'
        ))
        self.assertFalse(permissions.has_permission_in_scope(
            self.collection, self.specifyuser.id, self.resource, 'update'
        ))

    def test_does_not_use_grants_outside_scope(self):
        self.grant_access(self.collection)
        self.grant(self.collection, self.resource, '%')

        self.assertFalse(permissions.has_permission_in_scope(
            self.other_collection, self.specifyuser.id, self.resource, 'read'
        ))

    def test_shared_scopes_allow_access_through_a_member_collection(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, self.resource, '%')

        for scope in (self.discipline, self.division, self.institution):
            for action in ('read', 'create', 'update', 'delete'):
                with self.subTest(scope=scope._meta.model_name, action=action):
                    self.assertTrue(permissions.has_permission_in_scope(
                        scope, self.specifyuser.id, self.resource, action
                    ))

    def test_does_not_combine_grants_from_different_collections(self):
        self.grant_access(self.collection)
        self.grant(self.other_collection, self.resource, 'read')

        self.assertFalse(permissions.has_permission_in_scope(
            self.discipline, self.specifyuser.id, self.resource, 'read'
        ))

    def test_role_policies_can_supply_access_and_action(self):
        role = models.Role.objects.create(
            collection=self.other_collection, name='Scoped role'
        )
        models.UserRole.objects.create(specifyuser=self.specifyuser, role=role)
        models.RolePolicy.objects.create(role=role, resource='%', action='%')

        self.assertTrue(permissions.has_permission_in_scope(
            self.discipline, self.specifyuser.id, self.resource, 'update'
        ))
        self.assertFalse(permissions.has_permission_in_scope(
            self.collection, self.specifyuser.id, self.resource, 'update'
        ))

    def test_institution_wide_policies_remain_valid(self):
        self.grant(None, '%', '%')

        self.assertTrue(permissions.has_permission_in_scope(
            self.other_collection, self.specifyuser.id, self.resource, 'delete'
        ))

    def test_scope_without_collections_does_not_grant_access(self):
        self.grant(None, '%', '%')
        empty_division = spmodels.Division.objects.create(
            institution=self.institution, name='Empty Division'
        )

        self.assertFalse(permissions.has_permission_in_scope(
            empty_division, self.specifyuser.id, self.resource, 'read'
        ))

class ScopedReadApiTests(ScopedPermissionTestBase):
    def setUp(self):
        super().setUp()
        self.grant_access(self.collection)
        self.grant(self.collection, '/table/%', 'read')
        self.client.force_login(self.specifyuser)
        self.client.cookies['collection'] = str(self.collection.id)
        self.other_record = spmodels.Collectionobject.objects.create(
            collection=self.other_collection,
            catalognumber='other-record',
        )

    def test_reads_authorized_record(self):
        response = self.client.get(
            f'/api/specify/collectionobject/{self.collectionobjects[0].id}/'
        )
        self.assertEqual(response.status_code, 200)

    def test_denies_read_in_restricted_collection(self):
        response = self.client.get(
            f'/api/specify/collectionobject/{self.other_record.id}/'
        )
        self.assertEqual(response.status_code, 403)
        self.other_record.refresh_from_db()
        self.assertEqual(self.other_record.collection_id, self.other_collection.id)
        self.assertEqual(self.other_record.catalognumber, 'other-record')

    def test_table_grant_without_collection_access_does_not_allow_read(self):
        self.grant(self.other_collection, '/table/%', 'read')
        response = self.client.get(
            f'/api/specify/collectionobject/{self.other_record.id}/'
        )
        self.assertEqual(response.status_code, 403)

    def test_collection_access_without_table_grant_does_not_allow_read(self):
        self.grant_access(self.other_collection)
        response = self.client.get(
            f'/api/specify/collectionobject/{self.other_record.id}/'
        )
        self.assertEqual(response.status_code, 403)

    def test_reads_other_collection_with_both_grants(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/%', 'read')
        response = self.client.get(
            f'/api/specify/collectionobject/{self.other_record.id}/'
        )
        self.assertEqual(response.status_code, 200)

    def test_institution_admin_can_read_other_collection(self):
        self.grant(None, '%', '%')
        response = self.client.get(
            f'/api/specify/collectionobject/{self.other_record.id}/'
        )
        self.assertEqual(response.status_code, 200)

    def test_reads_shared_division_record(self):
        response = self.client.get(f'/api/specify/agent/{self.agent.id}/')
        self.assertEqual(response.status_code, 200)

    def test_denies_record_from_other_division(self):
        division = spmodels.Division.objects.create(
            institution=self.institution, name='Restricted Division'
        )
        agent = spmodels.Agent.objects.create(agenttype=0, division=division)
        response = self.client.get(f'/api/specify/agent/{agent.id}/')
        self.assertEqual(response.status_code, 403)

    def test_denies_nested_record_in_restricted_collection(self):
        attribute = spmodels.Collectionobjectattribute.objects.create(
            collectionmemberid=self.other_collection.id
        )
        record = self.collectionobjects[0]
        record.collectionobjectattribute = attribute
        record.save()

        response = self.client.get(f'/api/specify/collectionobject/{record.id}/')
        self.assertEqual(response.status_code, 403)
        record.refresh_from_db()
        attribute.refresh_from_db()
        self.assertEqual(record.collectionobjectattribute_id, attribute.id)
        self.assertEqual(attribute.collectionmemberid, self.other_collection.id)

    def test_list_filters_restricted_records_before_count_and_pagination(self):
        for domainfilter in (None, 'false', 'true'):
            with self.subTest(domainfilter=domainfilter):
                params = {'limit': 2, 'offset': 1, 'orderby': '-id'}
                if domainfilter is not None:
                    params['domainfilter'] = domainfilter
                response = self.client.get('/api/specify/collectionobject/', params)
                self.assertEqual(response.status_code, 200)
                payload = response.json()
                self.assertEqual(payload['meta']['total_count'], 5)
                self.assertEqual(
                    [obj['id'] for obj in payload['objects']],
                    [obj.id for obj in reversed(self.collectionobjects)][1:3],
                )

    def test_list_includes_other_collection_with_both_grants(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/%', 'read')
        response = self.client.get('/api/specify/collectionobject/', {'limit': 0})
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload['meta']['total_count'], 6)
        self.assertCountEqual(
            [obj['id'] for obj in payload['objects']],
            [obj.id for obj in self.collectionobjects] + [self.other_record.id],
        )

    def test_domainfilter_still_limits_broad_access_to_login_collection(self):
        self.grant(None, '%', '%')
        response = self.client.get(
            '/api/specify/collectionobject/', {'domainfilter': 'true', 'limit': 0}
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['meta']['total_count'], 5)

    def test_list_does_not_combine_grants_across_collections(self):
        self.grant(self.other_collection, '/table/%', 'read')
        response = self.client.get(
            '/api/specify/collectionobject/', {'id': self.other_record.id}
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['objects'], [])
        self.assertEqual(response.json()['meta']['total_count'], 0)

    def test_list_requires_table_grant_in_target_collection(self):
        self.grant_access(self.other_collection)
        response = self.client.get(
            '/api/specify/collectionobject/', {'id': self.other_record.id}
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['objects'], [])
        self.assertEqual(response.json()['meta']['total_count'], 0)

    def test_list_scope_matches_membership_when_collection_fields_disagree(self):
        self.other_record.collectionmemberid = self.other_collection.id
        self.other_record.collection = self.collection
        self.other_record.save()

        response = self.client.get(
            '/api/specify/collectionobject/', {'id': self.other_record.id}
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['objects'], [])
        self.assertEqual(response.json()['meta']['total_count'], 0)

    def test_list_preserves_collection_fallback_for_invalid_membership(self):
        record = self.collectionobjects[0]
        record.collectionmemberid = self.other_collection.id + self.collection.id + 1
        record.save()

        response = self.client.get(
            '/api/specify/collectionobject/', {'id': record.id}
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['meta']['total_count'], 1)
        self.assertEqual(response.json()['objects'][0]['id'], record.id)

    def test_list_filters_membership_only_records(self):
        allowed = spmodels.Collectionobjectattribute.objects.create(
            collectionmemberid=self.collection.id
        )
        spmodels.Collectionobjectattribute.objects.create(
            collectionmemberid=self.other_collection.id
        )

        response = self.client.get('/api/specify/collectionobjectattribute/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['meta']['total_count'], 1)
        self.assertEqual(
            [obj['id'] for obj in response.json()['objects']], [allowed.id]
        )

    def test_list_with_global_grant_includes_both_collections(self):
        self.grant(None, '%', '%')
        response = self.client.get('/api/specify/collectionobject/', {'limit': 0})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['meta']['total_count'], 6)
        self.assertIn(
            self.other_record.id,
            [obj['id'] for obj in response.json()['objects']],
        )

    def test_non_instance_read_check_keeps_current_collection_behavior(self):
        for obj in (spmodels.Collectionobject, spmodels.Collectionobject.specify_model):
            with self.subTest(obj=obj):
                permissions.check_table_permissions(
                    self.collection, self.agent, obj, 'read'
                )

class ScopedRowsApiTests(ScopedPermissionTestBase):
    def setUp(self):
        super().setUp()
        self.grant_access(self.collection)
        self.grant(self.collection, '/table/%', 'read')
        self.client.force_login(self.specifyuser)
        self.client.cookies['collection'] = str(self.collection.id)
        self.other_record = spmodels.Collectionobject.objects.create(
            collection=self.other_collection,
            catalognumber='restricted-record',
            text1='restricted-value',
        )

    def get_rows(self, **params):
        return self.client.get(
            '/table_rows/specify_rows/collectionobject/',
            {'fields': 'id', 'limit': 0, **params},
        )

    def test_filters_before_projection_and_pagination(self):
        expected = [[obj.id] for obj in reversed(self.collectionobjects)][1:3]
        for domainfilter in (None, 'false', 'true'):
            with self.subTest(domainfilter=domainfilter):
                params = {'orderby': '-id', 'offset': 1, 'limit': 2}
                if domainfilter is not None:
                    params['domainfilter'] = domainfilter
                response = self.get_rows(**params)
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.json(), expected)

    def test_restricted_id_returns_no_rows(self):
        response = self.get_rows(id=self.other_record.id)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_distinct_projection_excludes_restricted_values(self):
        response = self.get_rows(fields='text1', distinct='true')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [[None]])

    def test_read_grant_without_collection_access_does_not_expose_rows(self):
        self.grant(self.other_collection, '/table/%', 'read')
        response = self.get_rows(id=self.other_record.id)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_collection_access_without_read_grant_does_not_expose_rows(self):
        self.grant_access(self.other_collection)
        response = self.get_rows(id=self.other_record.id)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_both_grants_allow_other_collection_rows(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/%', 'read')
        response = self.get_rows()
        self.assertEqual(response.status_code, 200)
        self.assertCountEqual(
            response.json(),
            [[obj.id] for obj in self.collectionobjects] + [[self.other_record.id]],
        )

    def test_global_grant_preserves_domainfilter(self):
        self.grant(None, '%', '%')
        response = self.get_rows()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 6)
        response = self.get_rows(domainfilter='true')
        self.assertEqual(response.status_code, 200)
        self.assertCountEqual(
            response.json(), [[obj.id] for obj in self.collectionobjects]
        )

    def test_membership_only_rows_are_filtered(self):
        allowed = spmodels.Collectionobjectattribute.objects.create(
            collectionmemberid=self.collection.id
        )
        spmodels.Collectionobjectattribute.objects.create(
            collectionmemberid=self.other_collection.id
        )
        response = self.client.get(
            '/table_rows/specify_rows/collectionobjectattribute/', {'fields': 'id'}
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [[allowed.id]])

    def test_legacy_dispatch_rows_uses_same_filter(self):
        from specifyweb.specify.api.dispatch import rows

        request = RequestFactory().get(
            '/table_rows/specify_rows/collectionobject/',
            {'fields': 'id', 'id': self.other_record.id},
        )
        request.specify_collection = self.collection
        request.specify_user_agent = self.agent
        response = rows(request, 'collectionobject')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content), [])

class ScopedDeleteApiTests(ScopedPermissionTestBase):
    def setUp(self):
        super().setUp()
        self.grant_access(self.collection)
        self.grant(self.collection, '/table/%', 'delete')
        self.client.force_login(self.specifyuser)
        self.client.cookies['collection'] = str(self.collection.id)
        self.other_record = spmodels.Collectionobject.objects.create(
            collection=self.other_collection,
            catalognumber='other-record',
        )

    def delete_record(self, record):
        return self.client.delete(
            f'/api/specify/collectionobject/{record.id}/?version={record.version}'
        )

    def assert_record_unchanged(self, record):
        version = record.version
        collection_id = record.collection_id
        catalognumber = record.catalognumber
        record.refresh_from_db()
        self.assertEqual(record.version, version)
        self.assertEqual(record.collection_id, collection_id)
        self.assertEqual(record.catalognumber, catalognumber)

    def test_deletes_authorized_record(self):
        record = self.collectionobjects[0]
        response = self.delete_record(record)
        self.assertEqual(response.status_code, 204)
        self.assertFalse(spmodels.Collectionobject.objects.filter(pk=record.id).exists())

    def test_denies_delete_in_restricted_collection(self):
        response = self.delete_record(self.other_record)
        self.assertEqual(response.status_code, 403)
        self.assert_record_unchanged(self.other_record)

    def test_delete_grant_without_collection_access_does_not_allow_delete(self):
        self.grant(self.other_collection, '/table/%', 'delete')
        response = self.delete_record(self.other_record)
        self.assertEqual(response.status_code, 403)
        self.assert_record_unchanged(self.other_record)

    def test_collection_access_without_delete_grant_does_not_allow_delete(self):
        self.grant_access(self.other_collection)
        response = self.delete_record(self.other_record)
        self.assertEqual(response.status_code, 403)
        self.assert_record_unchanged(self.other_record)

    def test_deletes_other_collection_record_with_both_grants(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/%', 'delete')
        response = self.delete_record(self.other_record)
        self.assertEqual(response.status_code, 204)
        self.assertFalse(
            spmodels.Collectionobject.objects.filter(pk=self.other_record.id).exists()
        )

    def test_institution_admin_can_delete_other_collection_record(self):
        self.grant(None, '%', '%')
        response = self.delete_record(self.other_record)
        self.assertEqual(response.status_code, 204)
        self.assertFalse(
            spmodels.Collectionobject.objects.filter(pk=self.other_record.id).exists()
        )

    def test_restricted_dependent_rolls_back_parent_delete(self):
        attribute = spmodels.Collectionobjectattribute.objects.create(
            collectionmemberid=self.other_collection.id
        )
        record = self.collectionobjects[0]
        record.collectionobjectattribute = attribute
        record.save()
        attribute_version = attribute.version

        response = self.delete_record(record)

        self.assertEqual(response.status_code, 403)
        self.assert_record_unchanged(record)
        attribute.refresh_from_db()
        self.assertEqual(record.collectionobjectattribute_id, attribute.id)
        self.assertEqual(attribute.version, attribute_version)
        self.assertEqual(attribute.collectionmemberid, self.other_collection.id)

    def test_deletes_authorized_dependent(self):
        attribute = spmodels.Collectionobjectattribute.objects.create(
            collectionmemberid=self.collection.id
        )
        record = self.collectionobjects[0]
        record.collectionobjectattribute = attribute
        record.save()

        response = self.delete_record(record)

        self.assertEqual(response.status_code, 204)
        self.assertFalse(spmodels.Collectionobject.objects.filter(pk=record.id).exists())
        self.assertFalse(
            spmodels.Collectionobjectattribute.objects.filter(pk=attribute.id).exists()
        )

class ScopedUpdateApiTests(ScopedPermissionTestBase):
    def setUp(self):
        super().setUp()
        self.grant_access(self.collection)
        self.grant(self.collection, '/table/%', 'update')
        self.grant(None, '/table/%', 'read')
        self.grant(None, '/field/%', 'update')
        self.client.force_login(self.specifyuser)
        self.client.cookies['collection'] = str(self.collection.id)
        self.other_record = spmodels.Collectionobject.objects.create(
            collection=self.other_collection,
            catalognumber='other-record',
        )

    def update_record(self, record, **changes):
        return self.client.put(
            f'/api/specify/collectionobject/{record.id}/',
            data={'version': record.version, **changes},
            content_type='application/json',
        )

    def assert_record_unchanged(self, record):
        expected = {
            field.attname: getattr(record, field.attname)
            for field in record._meta.concrete_fields
        }
        persisted = spmodels.Collectionobject.objects.filter(pk=record.id).values().get()
        self.assertEqual(persisted, expected)

    def test_updates_authorized_record(self):
        record = self.collectionobjects[0]
        version = record.version
        response = self.update_record(record, text1='Updated')
        self.assertEqual(response.status_code, 200)
        record.refresh_from_db()
        self.assertEqual(record.text1, 'Updated')
        self.assertEqual(record.version, version + 1)

    def test_denies_update_in_restricted_collection(self):
        response = self.update_record(self.other_record, text1='Forbidden')
        self.assertEqual(response.status_code, 403)
        self.assert_record_unchanged(self.other_record)

    def test_update_grant_without_collection_access_does_not_allow_update(self):
        self.grant(self.other_collection, '/table/%', 'update')
        response = self.update_record(self.other_record, text1='Forbidden')
        self.assertEqual(response.status_code, 403)
        self.assert_record_unchanged(self.other_record)

    def test_collection_access_without_update_grant_does_not_allow_update(self):
        self.grant_access(self.other_collection)
        response = self.update_record(self.other_record, text1='Forbidden')
        self.assertEqual(response.status_code, 403)
        self.assert_record_unchanged(self.other_record)

    def test_updates_other_collection_with_both_grants(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/%', 'update')
        response = self.update_record(self.other_record, text1='Updated')
        self.assertEqual(response.status_code, 200)
        self.other_record.refresh_from_db()
        self.assertEqual(self.other_record.text1, 'Updated')

    def test_institution_admin_can_update_other_collection(self):
        self.grant(None, '%', '%')
        response = self.update_record(self.other_record, text1='Updated')
        self.assertEqual(response.status_code, 200)
        self.other_record.refresh_from_db()
        self.assertEqual(self.other_record.text1, 'Updated')

    def test_denies_moving_record_into_restricted_collection(self):
        record = self.collectionobjects[0]
        response = self.update_record(
            record, collection=f'/api/specify/collection/{self.other_collection.id}/',
            collectionmemberid=self.other_collection.id, text1='Forbidden',
        )
        self.assertEqual(response.status_code, 403)
        self.assert_record_unchanged(record)

    def test_denies_moving_restricted_record_into_authorized_collection(self):
        response = self.update_record(
            self.other_record,
            collection=f'/api/specify/collection/{self.collection.id}/',
            collectionmemberid=self.collection.id, text1='Forbidden',
        )
        self.assertEqual(response.status_code, 403)
        self.assert_record_unchanged(self.other_record)

    def test_moves_record_when_both_scopes_are_authorized(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/%', 'update')
        record = self.collectionobjects[0]
        version = record.version
        response = self.update_record(
            record, collection=f'/api/specify/collection/{self.other_collection.id}/',
            collectionmemberid=self.other_collection.id, text1='Moved',
        )
        self.assertEqual(response.status_code, 200)
        record.refresh_from_db()
        self.assertEqual(record.collection_id, self.other_collection.id)
        self.assertEqual(record.collectionmemberid, self.other_collection.id)
        self.assertEqual(record.text1, 'Moved')
        self.assertEqual(record.version, version + 1)

    def restrict_field_grants(self):
        models.UserPolicy.objects.filter(resource='/field/%').delete()
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/%', 'update')

    def test_denies_field_granted_only_in_login_collection(self):
        self.restrict_field_grants()
        self.grant(self.collection, '/field/%', 'update')
        response = self.update_record(self.other_record, text1='Forbidden')
        self.assertEqual(response.status_code, 403)
        self.assert_record_unchanged(self.other_record)

    def test_allows_field_granted_only_in_record_collection(self):
        self.restrict_field_grants()
        self.grant(self.other_collection, '/field/%', 'update')
        response = self.update_record(self.other_record, text1='Updated')
        self.assertEqual(response.status_code, 200)
        self.other_record.refresh_from_db()
        self.assertEqual(self.other_record.text1, 'Updated')

    def test_denies_field_not_covered_by_record_scope_grant(self):
        self.restrict_field_grants()
        self.grant(self.other_collection, '/field/collectionobject/text2', 'update')
        response = self.update_record(self.other_record, text1='Forbidden')
        self.assertEqual(response.status_code, 403)
        self.assert_record_unchanged(self.other_record)

    def test_empty_field_check_does_not_resolve_scope(self):
        with self.assertNumQueries(0):
            permissions.check_field_permissions(
                self.collection, self.agent, spmodels.Collectionobject(), [], 'update'
            )

    def test_model_field_check_keeps_current_collection_behavior(self):
        self.restrict_field_grants()
        self.grant(self.collection, '/field/%', 'update')
        for obj in (spmodels.Collectionobject, spmodels.Collectionobject.specify_model):
            with self.subTest(obj=obj):
                permissions.check_field_permissions(
                    self.collection, self.agent, obj, ['text1'], 'update'
                )

    def test_move_requires_field_grants_in_both_scopes(self):
        for granted_collection in (self.collection, self.other_collection):
            with self.subTest(collection=granted_collection.id):
                self.restrict_field_grants()
                self.grant(granted_collection, '/field/%', 'update')
                record = self.collectionobjects[0]
                response = self.update_record(
                    record,
                    collection=f'/api/specify/collection/{self.other_collection.id}/',
                    collectionmemberid=self.other_collection.id,
                    text1='Forbidden',
                )
                self.assertEqual(response.status_code, 403)
                self.assert_record_unchanged(record)

    def test_move_with_field_grants_in_both_scopes(self):
        self.restrict_field_grants()
        for collection in (self.collection, self.other_collection):
            self.grant(collection, '/field/%', 'update')
        record = self.collectionobjects[0]
        response = self.update_record(
            record, collection=f'/api/specify/collection/{self.other_collection.id}/',
            collectionmemberid=self.other_collection.id, text1='Moved',
        )
        self.assertEqual(response.status_code, 200)
        record.refresh_from_db()
        self.assertEqual(record.collection_id, self.other_collection.id)
        self.assertEqual(record.text1, 'Moved')

    def test_restricted_nested_update_rolls_back_parent(self):
        attribute = spmodels.Collectionobjectattribute.objects.create(
            collectionmemberid=self.other_collection.id
        )
        record = self.collectionobjects[0]
        record.collectionobjectattribute = attribute
        record.save()
        version = attribute.version

        response = self.update_record(
            record, text1='Forbidden',
            collectionobjectattribute={
                'id': attribute.id, 'version': version,
                'collectionmemberid': self.collection.id,
            },
        )

        self.assertEqual(response.status_code, 403)
        self.assert_record_unchanged(record)
        attribute.refresh_from_db()
        self.assertEqual(attribute.version, version)
        self.assertEqual(attribute.collectionmemberid, self.other_collection.id)

class CreateIdentityApiTests(ScopedPermissionTestBase):
    def setUp(self):
        super().setUp()
        self.grant_access(self.collection)
        self.grant(self.collection, '/table/%', 'create')
        self.grant(None, '/table/%', 'read')
        self.client.force_login(self.specifyuser)
        self.client.cookies['collection'] = str(self.collection.id)
        self.other_record = spmodels.Collectionobject.objects.create(
            collection=self.other_collection, catalognumber='other-record'
        )

    def post_record(self, **changes):
        return self.client.post(
            '/api/specify/collectionobject/',
            data={
                'collection': f'/api/specify/collection/{self.collection.id}/',
                'catalognumber': 'new-record',
                **changes,
            },
            content_type='application/json',
        )

    def test_create_cannot_overwrite_existing_record(self):
        for record in (self.collectionobjects[0], self.other_record):
            with self.subTest(collection=record.collection_id):
                before = list(spmodels.Collectionobject.objects.order_by('id').values())
                response = self.post_record(id=record.id)
                self.assertEqual(response.status_code, 400)
                self.assertEqual(
                    list(spmodels.Collectionobject.objects.order_by('id').values()),
                    before,
                )

    def test_create_rejects_case_insensitive_id(self):
        before = list(spmodels.Collectionobject.objects.order_by('id').values())
        response = self.post_record(ID=self.other_record.id)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            list(spmodels.Collectionobject.objects.order_by('id').values()), before
        )

    def test_create_rejects_unused_id(self):
        unused_id = max(
            spmodels.Collectionobject.objects.values_list('id', flat=True)
        ) + 1
        count = spmodels.Collectionobject.objects.count()
        response = self.post_record(id=unused_id)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(spmodels.Collectionobject.objects.count(), count)
        self.assertFalse(spmodels.Collectionobject.objects.filter(pk=unused_id).exists())

    def test_create_without_id_still_inserts(self):
        count = spmodels.Collectionobject.objects.count()
        response = self.post_record()
        self.assertEqual(response.status_code, 201)
        record = spmodels.Collectionobject.objects.get(pk=response.json()['id'])
        self.assertEqual(record.collection_id, self.collection.id)
        self.assertEqual(record.catalognumber, 'new-record')
        self.assertEqual(spmodels.Collectionobject.objects.count(), count + 1)

    def test_create_with_null_id_still_inserts(self):
        response = self.post_record(id=None)
        self.assertEqual(response.status_code, 201)
        record = spmodels.Collectionobject.objects.get(pk=response.json()['id'])
        self.assertEqual(record.collection_id, self.collection.id)
        self.assertEqual(record.catalognumber, 'new-record')

class ScopedCreateApiTests(ScopedPermissionTestBase):
    def setUp(self):
        super().setUp()
        self.grant_access(self.collection)
        self.grant(self.collection, '/table/%', 'create')
        self.grant(None, '/table/%', 'read')
        self.client.force_login(self.specifyuser)
        self.client.cookies['collection'] = str(self.collection.id)

    def post_record(self, collection):
        return self.client.post(
            '/api/specify/collectionobject/',
            data={
                'collection': f'/api/specify/collection/{collection.id}/',
                'catalognumber': 'new-record',
            },
            content_type='application/json',
        )

    def assert_create_denied(self):
        before = list(spmodels.Collectionobject.objects.order_by('id').values())
        response = self.post_record(self.other_collection)
        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            list(spmodels.Collectionobject.objects.order_by('id').values()), before
        )

    def test_denies_create_in_restricted_collection(self):
        self.assert_create_denied()

    def test_login_collection_membership_cannot_mask_restricted_target(self):
        before = list(spmodels.Collectionobject.objects.order_by('id').values())
        response = self.client.post(
            '/api/specify/collectionobject/',
            data={
                'collection': f'/api/specify/collection/{self.other_collection.id}/',
                'collectionmemberid': self.collection.id,
                'catalognumber': 'forbidden-record',
            },
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            list(spmodels.Collectionobject.objects.order_by('id').values()), before
        )

    def test_create_grant_without_collection_access_does_not_allow_create(self):
        self.grant(self.other_collection, '/table/%', 'create')
        self.assert_create_denied()

    def test_collection_access_without_create_grant_does_not_allow_create(self):
        self.grant_access(self.other_collection)
        self.assert_create_denied()

    def test_creates_in_authorized_collection(self):
        response = self.post_record(self.collection)
        self.assertEqual(response.status_code, 201)
        record = spmodels.Collectionobject.objects.get(pk=response.json()['id'])
        self.assertEqual(record.collection_id, self.collection.id)
        self.assertEqual(record.collectionmemberid, self.collection.id)

    def test_creates_in_other_collection_with_both_grants(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/%', 'create')
        response = self.post_record(self.other_collection)
        self.assertEqual(response.status_code, 201)
        record = spmodels.Collectionobject.objects.get(pk=response.json()['id'])
        self.assertEqual(record.collection_id, self.other_collection.id)
        self.assertEqual(record.collectionmemberid, self.other_collection.id)

    def test_institution_admin_can_create_in_other_collection(self):
        self.grant(None, '%', '%')
        response = self.post_record(self.other_collection)
        self.assertEqual(response.status_code, 201)
        record = spmodels.Collectionobject.objects.get(pk=response.json()['id'])
        self.assertEqual(record.collection_id, self.other_collection.id)
        self.assertEqual(record.collectionmemberid, self.other_collection.id)

    def test_denied_create_does_not_reach_save(self):
        models.UserPolicy.objects.filter(action='create').delete()
        with patch('specifyweb.specify.api.crud.autonumber_and_save') as save:
            response = self.post_record(self.collection)
        self.assertEqual(response.status_code, 403)
        save.assert_not_called()

    def test_creates_in_shared_discipline(self):
        response = self.client.post(
            '/api/specify/loan/',
            data={
                'discipline': f'/api/specify/discipline/{self.discipline.id}/',
                'loannumber': 'shared-loan',
            },
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 201)
        loan = spmodels.Loan.objects.get(pk=response.json()['id'])
        self.assertEqual(loan.discipline_id, self.discipline.id)

    def test_denies_create_in_restricted_discipline(self):
        discipline = spmodels.Discipline.objects.create(
            division=self.division,
            datatype=self.datatype,
            geographytreedef=self.geographytreedef,
            geologictimeperiodtreedef=self.geologictimeperiodtreedef,
        )
        self.other_collection.discipline = discipline
        self.other_collection.save()
        count = spmodels.Loan.objects.count()

        with patch('specifyweb.specify.api.crud.autonumber_and_save') as save:
            response = self.client.post(
                '/api/specify/loan/',
                data={
                    'discipline': f'/api/specify/discipline/{discipline.id}/',
                    'loannumber': 'forbidden-loan',
                },
                content_type='application/json',
            )

        self.assertEqual(response.status_code, 403)
        save.assert_not_called()
        self.assertEqual(spmodels.Loan.objects.count(), count)

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
