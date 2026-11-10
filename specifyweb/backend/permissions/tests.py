import json
from unittest.mock import patch

from django.apps import apps
from django.test import Client, RequestFactory
from django.utils import timezone

from specifyweb.backend.businessrules.rules.cogtype_rules import SYSTEM_COGTYPES_PICKLIST
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

class ReverseRelatedRowsApiTests(ScopedPermissionTestBase):
    def setUp(self):
        super().setUp()
        self.grant_access(self.collection)
        self.grant(self.collection, '/table/%', 'read')
        self.client.force_login(self.specifyuser)
        self.client.cookies['collection'] = str(self.collection.id)
        self._create_prep_type()
        self.mixed_record, self.restricted_record, self.empty_record = self.collectionobjects[:3]
        self.allowed_prep = self._create_prep(
            self.mixed_record, None, remarks='allowed',
        )
        self.null_prep = self._create_prep(self.mixed_record, None)
        self.restricted_prep = self._create_prep(
            self.mixed_record, None, remarks='restricted',
            collectionmemberid=self.other_collection.id,
        )
        self.restricted_only_prep = self._create_prep(
            self.restricted_record, None, remarks='restricted only',
            collectionmemberid=self.other_collection.id,
        )

    def get_rows(self, **params):
        return self.client.get('/table_rows/specify_rows/collectionobject/', {
            'fields': 'id,preparations__id,preparations__remarks',
            'id__in': ','.join(str(obj.id) for obj in (
                self.mixed_record, self.restricted_record, self.empty_record,
            )),
            'limit': 0, **params,
        })

    def expected_rows(self):
        return [
            [self.mixed_record.id, self.allowed_prep.id, 'allowed'],
            [self.mixed_record.id, self.null_prep.id, None],
            [self.restricted_record.id, None, None],
            [self.empty_record.id, None, None],
        ]

    def test_projects_only_readable_children_and_preserves_parents(self):
        response = self.get_rows()
        self.assertEqual(response.status_code, 200)
        self.assertCountEqual(response.json(), self.expected_rows())

    def test_related_read_requires_access_in_same_collection(self):
        self.grant(self.other_collection, '/table/preparation', 'read')
        response = self.get_rows()
        self.assertEqual(response.status_code, 200)
        self.assertCountEqual(response.json(), self.expected_rows())

    def test_related_access_requires_table_read(self):
        self.grant_access(self.other_collection)
        response = self.get_rows()
        self.assertEqual(response.status_code, 200)
        self.assertCountEqual(response.json(), self.expected_rows())

    def test_both_grants_include_previously_restricted_children(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/preparation', 'read')
        response = self.get_rows()
        self.assertEqual(response.status_code, 200)
        self.assertCountEqual(response.json(), [
            *self.expected_rows()[:2],
            [self.mixed_record.id, self.restricted_prep.id, 'restricted'],
            [self.restricted_record.id, self.restricted_only_prep.id, 'restricted only'],
            [self.empty_record.id, None, None],
        ])

    def test_without_child_table_read_projects_nulls(self):
        initialize.wipe_permissions()
        self.grant_access(self.collection)
        self.grant(self.collection, '/table/collectionobject', 'read')
        response = self.get_rows()
        self.assertEqual(response.status_code, 200)
        self.assertCountEqual(response.json(), [
            [record.id, None, None] for record in (
                self.mixed_record, self.restricted_record, self.empty_record,
            )
        ])

    def test_filters_and_projection_use_same_authorized_child(self):
        response = self.get_rows(preparations__remarks='allowed')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [
            [self.mixed_record.id, self.allowed_prep.id, 'allowed'],
        ])

    def test_restricted_child_cannot_match_filter(self):
        response = self.get_rows(
            fields='id', preparations__remarks='restricted',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_isnull_filter_preserves_missing_readable_children(self):
        response = self.get_rows(preparations__remarks__isnull='true')
        self.assertEqual(response.status_code, 200)
        self.assertCountEqual(response.json(), self.expected_rows()[1:])

    def test_nonnull_filter_excludes_missing_readable_children(self):
        response = self.get_rows(preparations__remarks__isnull='false')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), self.expected_rows()[:1])

    def test_reverse_terminal_reference_is_authorized(self):
        response = self.get_rows(fields='id,preparations', id=self.mixed_record.id)
        self.assertEqual(response.status_code, 200)
        self.assertCountEqual(response.json(), [
            [self.mixed_record.id, self.allowed_prep.id],
            [self.mixed_record.id, self.null_prep.id],
        ])

    def test_ordering_and_pagination_use_authorized_children(self):
        response = self.get_rows(orderby='-preparations__remarks', limit=1)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), self.expected_rows()[:1])

    def test_unprojected_ordering_does_not_add_restricted_child_rows(self):
        response = self.get_rows(fields='id', orderby='-preparations__remarks')
        self.assertEqual(response.status_code, 200)
        self.assertCountEqual(response.json(), [
            [self.mixed_record.id], [self.mixed_record.id],
            [self.restricted_record.id], [self.empty_record.id],
        ])

    def test_distinct_omits_restricted_values(self):
        response = self.get_rows(
            fields='preparations__remarks', distinct='true',
        )
        self.assertEqual(response.status_code, 200)
        self.assertCountEqual(response.json(), [['allowed'], [None]])

    def test_forward_path_after_reverse_is_authorized(self):
        other_type = spmodels.Preptype.objects.create(
            name='restricted type', isloanable=False, collection=self.other_collection,
        )
        self.allowed_prep.preptype = other_type
        self.allowed_prep.save()
        response = self.get_rows(
            fields='id,preparations__id,preparations__preptype__name',
            id=self.mixed_record.id,
        )
        self.assertEqual(response.status_code, 200)
        self.assertCountEqual(response.json(), [
            [self.mixed_record.id, self.allowed_prep.id, None],
            [self.mixed_record.id, self.null_prep.id, self.prep_type.name],
        ])

    def test_terminal_forward_reference_after_reverse_is_authorized(self):
        other_type = spmodels.Preptype.objects.create(
            name='restricted type', isloanable=False, collection=self.other_collection,
        )
        self.allowed_prep.preptype = other_type
        self.allowed_prep.save()
        for field in ('preptype', 'preptype_id'):
            with self.subTest(field=field):
                response = self.get_rows(
                    fields=f'preparations__id,preparations__{field}',
                    id=self.mixed_record.id,
                )
                self.assertEqual(response.status_code, 200)
                self.assertCountEqual(response.json(), [
                    [self.allowed_prep.id, None],
                    [self.null_prep.id, self.prep_type.id],
                ])

    def test_nested_reverse_paths_check_each_child(self):
        spmodels.Preparationproperty.objects.create(
            preparation=self.allowed_prep,
            collectionmemberid=self.collection.id, integer1=1,
        )
        spmodels.Preparationproperty.objects.create(
            preparation=self.allowed_prep,
            collectionmemberid=self.other_collection.id, integer1=2,
        )
        spmodels.Preparationproperty.objects.create(
            preparation=self.restricted_prep,
            collectionmemberid=self.collection.id, integer1=3,
        )
        response = self.get_rows(
            fields='preparations__id,preparations__preparationproperties__integer1',
            id=self.mixed_record.id,
        )
        self.assertEqual(response.status_code, 200)
        self.assertCountEqual(response.json(), [
            [self.allowed_prep.id, 1], [self.null_prep.id, None],
        ])

    def test_nested_filter_cannot_match_restricted_grandchild(self):
        spmodels.Preparationproperty.objects.create(
            preparation=self.allowed_prep,
            collectionmemberid=self.other_collection.id, integer1=2,
        )
        response = self.get_rows(
            fields='id', preparations__preparationproperties__integer1=2,
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_reverse_path_after_forward_checks_both_scopes(self):
        self.mixed_record.collectingevent = self.collectingevent
        self.mixed_record.save()
        self.restricted_record.collectingevent = self.collectingevent
        self.restricted_record.collection = self.other_collection
        self.restricted_record.collectionmemberid = self.other_collection.id
        self.restricted_record.save()
        response = self.get_rows(
            fields='collectingevent__collectionobjects__id',
            id=self.mixed_record.id,
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [[self.mixed_record.id]])

    def test_forward_filter_after_reverse_cannot_match_restricted_target(self):
        other_type = spmodels.Preptype.objects.create(
            name='restricted type', isloanable=False, collection=self.other_collection,
        )
        self.allowed_prep.preptype = other_type
        self.allowed_prep.save()
        response = self.get_rows(
            fields='id', preparations__preptype__name=other_type.name,
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_multiple_filters_match_the_same_readable_child(self):
        response = self.get_rows(
            preparations__id=self.allowed_prep.id,
            preparations__remarks__isnull='true',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_equivalent_paths_do_not_overwrite_conflicting_filters(self):
        other_type = spmodels.Preptype.objects.create(
            name='another readable type', isloanable=False, collection=self.collection,
        )
        response = self.get_rows(
            preparations__preptype=other_type.id,
            preparations__preptype_id=self.prep_type.id,
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_reverse_in_filter_only_matches_readable_children(self):
        response = self.get_rows(
            preparations__in=f'{self.allowed_prep.id},{self.restricted_prep.id}',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), self.expected_rows()[:1])

    def test_without_reverse_paths_parent_visibility_is_unchanged(self):
        response = self.get_rows(fields='id')
        self.assertEqual(response.status_code, 200)
        self.assertCountEqual(response.json(), [
            [record.id] for record in (
                self.mixed_record, self.restricted_record, self.empty_record,
            )
        ])

    def test_reverse_scalar_transform_remains_valid(self):
        response = self.get_rows(
            fields='preparations__timestampcreated__year',
            preparations__id=self.allowed_prep.id,
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [[self.allowed_prep.timestampcreated.year]])

    def test_invalid_reverse_paths_remain_bad_requests(self):
        for params in (
            {'fields': 'preparations__unknown__remarks'},
            {'preparations__unknown': 'value'},
            {'orderby': 'preparations__unknown'},
        ):
            with self.subTest(params=params):
                response = self.get_rows(**params)
                self.assertEqual(response.status_code, 400)

    def test_legacy_rows_share_reverse_authorization(self):
        from specifyweb.specify.api.dispatch import rows

        request = RequestFactory().get(
            '/table_rows/specify_rows/collectionobject/', {
                'fields': 'id,preparations__id,preparations__remarks',
                'id': self.mixed_record.id,
            },
        )
        request.specify_collection = self.collection
        request.specify_user_agent = self.agent
        response = rows(request, 'collectionobject')
        self.assertEqual(response.status_code, 200)
        self.assertCountEqual(json.loads(response.content), self.expected_rows()[:2])

class ReverseRelatedListApiTests(ScopedPermissionTestBase):
    def setUp(self):
        super().setUp()
        self.grant_access(self.collection)
        self.grant(self.collection, '/table/%', 'read')
        self.client.force_login(self.specifyuser)
        self.client.cookies['collection'] = str(self.collection.id)
        self._create_prep_type()
        self.mixed_record, self.restricted_record, self.empty_record = [
            spmodels.Preparationattribute.objects.create(
                collectionmemberid=self.collection.id,
            ) for _ in range(3)
        ]
        self.allowed_prep = self._create_prep(
            self.collectionobjects[0], None, remarks='allowed',
            preparationattribute=self.mixed_record,
        )
        self.null_prep = self._create_prep(
            self.collectionobjects[0], None, preparationattribute=self.mixed_record,
        )
        self.restricted_prep = self._create_prep(
            self.collectionobjects[0], None, remarks='restricted',
            preparationattribute=self.mixed_record,
            collectionmemberid=self.other_collection.id,
        )
        self.restricted_only_prep = self._create_prep(
            self.collectionobjects[1], None, remarks='restricted only',
            preparationattribute=self.restricted_record,
            collectionmemberid=self.other_collection.id,
        )

    def get_list(self, **params):
        return self.client.get('/api/specify/preparationattribute/', {
            'id__in': ','.join(str(obj.id) for obj in (
                self.mixed_record, self.restricted_record, self.empty_record,
            )),
            'limit': 0, 'orderby': 'id', **params,
        })

    def assert_list_ids(self, expected, **params):
        response = self.get_list(**params)
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload['meta']['total_count'], len(expected))
        self.assertCountEqual(
            [obj['id'] for obj in payload['objects']], [obj.id for obj in expected],
        )

    def test_list_restricted_children_cannot_match_filters(self):
        for domainfilter in ('true', 'false'):
            with self.subTest(domainfilter=domainfilter):
                self.assert_list_ids(
                    [], preparations__remarks='restricted',
                    domainfilter=domainfilter,
                )

    def test_list_child_grants_require_access_and_read_in_same_collection(self):
        self.grant(self.other_collection, '/table/preparation', 'read')
        self.assert_list_ids([], preparations__remarks='restricted')
        initialize.wipe_permissions()
        self.grant_access(self.collection)
        self.grant(self.collection, '/table/%', 'read')
        self.grant_access(self.other_collection)
        self.assert_list_ids([], preparations__remarks='restricted')

    def test_list_qualifying_grants_allow_child_filters(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/preparation', 'read')
        self.assert_list_ids(
            [self.mixed_record, self.restricted_record],
            preparations__remarks__startswith='restricted',
        )

    def test_list_global_grant_allows_child_filters(self):
        self.grant(None, '%', '%')
        self.assert_list_ids(
            [self.mixed_record, self.restricted_record],
            preparations__remarks__startswith='restricted',
        )

    def test_list_isnull_filters_preserve_parents_without_readable_children(self):
        self.assert_list_ids(
            [self.mixed_record, self.restricted_record, self.empty_record],
            preparations__remarks__isnull='true',
        )

    def test_list_nonnull_filter_matches_only_readable_children(self):
        self.assert_list_ids(
            [self.mixed_record], preparations__remarks__isnull='false',
        )

    def test_list_filters_and_ordering_share_the_same_readable_child(self):
        self.assert_list_ids(
            [self.mixed_record], preparations__remarks='allowed',
            orderby='-preparations__id,id',
        )

    def test_list_multiple_filters_require_the_same_readable_child(self):
        self.assert_list_ids(
            [], preparations__id=self.allowed_prep.id,
            preparations__remarks__isnull='true',
        )

    def test_list_terminal_reverse_references_require_child_scope(self):
        for field in ('preparations', 'preparations__exact', 'preparations__in'):
            with self.subTest(field=field):
                self.assert_list_ids([], **{field: str(self.restricted_prep.id)})
                self.assert_list_ids(
                    [self.mixed_record], **{field: str(self.allowed_prep.id)},
                )

    def test_list_reverse_ordering_counts_authorized_joined_rows(self):
        for orderby in (
            'preparations__remarks,id', '-preparations__remarks,id',
            '-preparations,id', '-preparations__id,id',
        ):
            with self.subTest(orderby=orderby):
                self.assert_list_ids(
                    [self.mixed_record, self.mixed_record,
                     self.restricted_record, self.empty_record],
                    orderby=orderby,
                )

    def test_list_reverse_ordering_without_child_read_preserves_parents(self):
        initialize.wipe_permissions()
        self.grant_access(self.collection)
        self.grant(self.collection, '/table/preparationattribute', 'read')
        self.assert_list_ids(
            [self.mixed_record, self.restricted_record, self.empty_record],
            orderby='-preparations__remarks,id',
        )

    def test_list_reverse_ordering_counts_all_children_with_qualifying_grants(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/preparation', 'read')
        self.assert_list_ids(
            [self.mixed_record, self.mixed_record, self.mixed_record,
             self.restricted_record, self.empty_record],
            orderby='-preparations__remarks,id',
        )

    def test_list_reverse_ordering_filters_before_count_and_pagination(self):
        for offset, expected in ((0, self.mixed_record), (2, self.restricted_record)):
            with self.subTest(offset=offset):
                response = self.get_list(
                    orderby='-preparations__remarks,id', offset=offset, limit=1,
                )
                self.assertEqual(response.status_code, 200)
                payload = response.json()
                self.assertEqual(payload['meta']['total_count'], 4)
                self.assertEqual(
                    [obj['id'] for obj in payload['objects']], [expected.id],
                )

    def test_list_nested_reverse_paths_require_each_child_scope(self):
        spmodels.Preparationproperty.objects.create(
            preparation=self.allowed_prep,
            collectionmemberid=self.collection.id, integer1=1,
        )
        spmodels.Preparationproperty.objects.create(
            preparation=self.allowed_prep,
            collectionmemberid=self.other_collection.id, integer1=2,
        )
        spmodels.Preparationproperty.objects.create(
            preparation=self.restricted_prep,
            collectionmemberid=self.collection.id, integer1=3,
        )
        self.assert_list_ids(
            [self.mixed_record], preparations__preparationproperties__integer1=1,
        )
        for value in (2, 3):
            with self.subTest(value=value):
                self.assert_list_ids(
                    [], preparations__preparationproperties__integer1=value,
                )

    def test_list_nested_reverse_ordering_counts_only_readable_grandchildren(self):
        for value in (1, 2):
            spmodels.Preparationproperty.objects.create(
                preparation=self.allowed_prep,
                collectionmemberid=self.collection.id, integer1=value,
            )
        spmodels.Preparationproperty.objects.create(
            preparation=self.allowed_prep,
            collectionmemberid=self.other_collection.id, integer1=3,
        )
        self.assert_list_ids(
            [self.mixed_record, self.mixed_record, self.mixed_record,
             self.restricted_record, self.empty_record],
            orderby='-preparations__preparationproperties__integer1,id',
        )
        self.assert_list_ids(
            [self.mixed_record, self.mixed_record],
            preparations__remarks='allowed',
            orderby='-preparations__preparationproperties__integer1,id',
        )

    def test_list_reverse_queries_still_require_base_record_scope(self):
        self.restricted_record.collectionmemberid = self.other_collection.id
        self.restricted_record.save()
        self.allowed_prep.preparationattribute = self.restricted_record
        self.allowed_prep.save()
        self.assert_list_ids([], preparations__remarks='allowed')
        self.assert_list_ids(
            [self.mixed_record, self.empty_record],
            orderby='-preparations__remarks,id',
        )

    def test_list_reverse_then_forward_ordering_ignores_restricted_targets(self):
        other_type = spmodels.Preptype.objects.create(
            name='zz restricted type', isloanable=False, collection=self.other_collection,
        )
        self.allowed_prep.preptype = other_type
        self.allowed_prep.save()
        readable_type = spmodels.Preptype.objects.create(
            name='z readable type', isloanable=False, collection=self.collection,
        )
        self._create_prep(
            self.collectionobjects[1], None, preparationattribute=self.restricted_record,
            preptype=readable_type,
        )
        response = self.get_list(
            orderby='-preparations__preptype__name,id', limit=1,
        )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload['meta']['total_count'], 4)
        self.assertEqual(
            [obj['id'] for obj in payload['objects']], [self.restricted_record.id],
        )
        self.assert_list_ids(
            [self.mixed_record, self.mixed_record,
             self.restricted_record, self.empty_record],
            orderby='-preparations__preptype__name,id',
        )

    def test_list_forward_path_after_reverse_requires_target_scope(self):
        other_type = spmodels.Preptype.objects.create(
            name='restricted type', isloanable=False, collection=self.other_collection,
        )
        self.allowed_prep.preptype = other_type
        self.allowed_prep.save()
        self.assert_list_ids([], preparations__preptype__name=other_type.name)
        for field in ('preptype', 'preptype_id'):
            with self.subTest(field=field):
                self.assert_list_ids([], **{f'preparations__{field}': other_type.id})

    def test_list_equivalent_paths_preserve_conflicting_filters(self):
        other_type = spmodels.Preptype.objects.create(
            name='another readable type', isloanable=False, collection=self.collection,
        )
        self.assert_list_ids(
            [], preparations__preptype=other_type.id,
            preparations__preptype_id=self.prep_type.id,
        )

    def test_list_without_relationship_queries_preserves_base_records(self):
        self.assert_list_ids([
            self.mixed_record, self.restricted_record, self.empty_record,
        ])

    def test_list_reverse_scalar_transforms_remain_valid(self):
        self.assert_list_ids(
            [self.mixed_record],
            preparations__timestampcreated__year=self.allowed_prep.timestampcreated.year,
            preparations__id=self.allowed_prep.id,
        )

    def test_list_reverse_filters_work_without_ordering(self):
        self.assert_list_ids(
            [self.mixed_record], preparations__remarks='allowed', orderby='',
        )

    def test_list_invalid_reverse_paths_remain_bad_requests(self):
        for params in (
            {'preparations__unknown': 'value'},
            {'orderby': 'preparations__unknown'},
        ):
            with self.subTest(params=params):
                response = self.get_list(**params)
                self.assertEqual(response.status_code, 400)

    def test_list_reverse_path_errors_keep_filter_and_order_error_types(self):
        from specifyweb.specify.api.crud import get_collection
        from specifyweb.specify.api.exceptions import FilterError, OrderByError
        from specifyweb.specify.api.validators import GetCollectionForm

        with self.assertRaises(FilterError):
            get_collection(
                self.collection, spmodels.Preparationattribute, lambda obj: None,
                params={'preparations__unknown': 'value'}, actor=self.agent,
            )
        with self.assertRaises(OrderByError):
            get_collection(
                self.collection, spmodels.Preparationattribute, lambda obj: None,
                control_params={
                    **GetCollectionForm.defaults, 'orderby': 'preparations__unknown',
                },
                actor=self.agent,
            )

    def test_list_trusted_caller_without_actor_retains_existing_behavior(self):
        from specifyweb.specify.api.crud import get_collection

        payload = get_collection(
            self.collection, spmodels.Preparationattribute, lambda obj: None,
            params={'preparations__remarks': 'restricted'},
        )
        self.assertEqual(payload['meta']['total_count'], 1)
        self.assertEqual(
            [obj['id'] for obj in payload['objects']], [self.mixed_record.id],
        )

    def test_list_inline_restricted_children_are_excluded(self):
        response = self.client.get('/api/specify/collectionobject/', {
            'id': self.collectionobjects[0].id,
            'preparations__remarks': 'allowed',
        })
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload['meta']['total_count'], 1)
        self.assertCountEqual(
            [obj['id'] for obj in payload['objects'][0]['preparations']],
            [self.allowed_prep.id, self.null_prep.id],
        )

class InlineRelatedReadApiTests(ScopedPermissionTestBase):
    def setUp(self):
        super().setUp()
        self.grant_access(self.collection)
        self.grant(self.collection, '/table/%', 'read')
        self.client.force_login(self.specifyuser)
        self.client.cookies['collection'] = str(self.collection.id)
        self._create_prep_type()
        self.parent, self.restricted_only_parent, self.empty_parent = self.collectionobjects[:3]
        self.allowed_prep = self._create_prep(self.parent, None, remarks='allowed')
        self.restricted_prep = self._create_prep(
            self.parent, None, remarks='restricted',
            collectionmemberid=self.other_collection.id,
        )
        self.restricted_only_prep = self._create_prep(
            self.restricted_only_parent, None, collectionmemberid=self.other_collection.id,
        )

    def assert_inline_ids(self, expected):
        response = self.client.get(f'/api/specify/collectionobject/{self.parent.id}/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['id'], self.parent.id)
        self.assertCountEqual(
            [obj['id'] for obj in response.json()['preparations']], expected,
        )
        response = self.client.get('/api/specify/collectionobject/', {'id': self.parent.id})
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload['meta']['total_count'], 1)
        self.assertCountEqual(
            [obj['id'] for obj in payload['objects'][0]['preparations']], expected,
        )

    def test_mixed_children_preserve_readable_parent_and_child(self):
        self.assert_inline_ids([self.allowed_prep.id])

    def test_related_table_read_without_access_does_not_expose_child(self):
        self.grant(self.other_collection, '/table/preparation', 'read')
        self.assert_inline_ids([self.allowed_prep.id])

    def test_related_access_without_table_read_does_not_expose_child(self):
        self.grant_access(self.other_collection)
        self.assert_inline_ids([self.allowed_prep.id])

    def test_qualifying_grants_include_previously_restricted_child(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/preparation', 'read')
        self.assert_inline_ids([self.allowed_prep.id, self.restricted_prep.id])

    def test_global_grant_includes_all_children(self):
        self.grant(None, '%', '%')
        self.assert_inline_ids([self.allowed_prep.id, self.restricted_prep.id])

    def test_missing_child_table_read_returns_empty_children(self):
        initialize.wipe_permissions()
        self.grant_access(self.collection)
        self.grant(self.collection, '/table/collectionobject', 'read')
        self.assert_inline_ids([])

    def test_empty_and_restricted_only_parents_remain_visible(self):
        response = self.client.get('/api/specify/collectionobject/', {
            'id__in': f'{self.restricted_only_parent.id},{self.empty_parent.id}',
            'orderby': 'id', 'limit': 1, 'offset': 1,
        })
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload['meta']['total_count'], 2)
        self.assertEqual(payload['objects'][0]['id'], self.empty_parent.id)
        for parent in (self.restricted_only_parent, self.empty_parent):
            response = self.client.get(f'/api/specify/collectionobject/{parent.id}/')
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()['preparations'], [])

    def test_restricted_parent_is_still_denied(self):
        self.parent.collectionmemberid = self.other_collection.id
        self.parent.save()
        response = self.client.get(f'/api/specify/collectionobject/{self.parent.id}/')
        self.assertEqual(response.status_code, 403)
        response = self.client.get('/api/specify/collectionobject/', {'id': self.parent.id})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['objects'], [])
        self.assertEqual(response.json()['meta']['total_count'], 0)

    def test_nested_children_are_independently_filtered(self):
        allowed = spmodels.Preparationproperty.objects.create(
            preparation=self.allowed_prep, collectionmemberid=self.collection.id,
        )
        spmodels.Preparationproperty.objects.create(
            preparation=self.allowed_prep, collectionmemberid=self.other_collection.id,
        )
        spmodels.Preparationproperty.objects.create(
            preparation=self.restricted_prep, collectionmemberid=self.collection.id,
        )
        for path, params in (
            (f'/api/specify/collectionobject/{self.parent.id}/', {}),
            ('/api/specify/collectionobject/', {'id': self.parent.id}),
        ):
            with self.subTest(path=path):
                response = self.client.get(path, params)
                self.assertEqual(response.status_code, 200)
                payload = response.json()
                if 'objects' in payload:
                    payload = payload['objects'][0]
                self.assertEqual(len(payload['preparations']), 1)
                self.assertEqual(
                    [obj['id'] for obj in payload['preparations'][0]['preparationproperties']],
                    [allowed.id],
                )

    def test_restricted_child_is_still_denied_when_requested_directly(self):
        response = self.client.get(f'/api/specify/preparation/{self.restricted_prep.id}/')
        self.assertEqual(response.status_code, 403)

    def test_omitted_children_are_logged(self):
        with self.assertLogs('specifyweb.specify.api.serializers', level='DEBUG') as logs:
            response = self.client.get(f'/api/specify/collectionobject/{self.parent.id}/')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(any(
            'omitting unreadable inline child' in message for message in logs.output
        ))

    def test_prefetched_children_apply_the_same_authorization(self):
        from specifyweb.specify.api.serializers import _obj_to_data

        obj = spmodels.Collectionobject.objects.prefetch_related('preparations').get(
            pk=self.parent.id,
        )
        payload = _obj_to_data(obj, permissions.table_permissions_checker(
            self.collection, self.agent, 'read',
        ))
        self.assertEqual(
            [child['id'] for child in payload['preparations']], [self.allowed_prep.id],
        )

    def test_prefetched_nested_children_apply_the_same_authorization(self):
        from specifyweb.specify.api.serializers import _obj_to_data

        allowed = spmodels.Preparationproperty.objects.create(
            preparation=self.allowed_prep, collectionmemberid=self.collection.id,
        )
        spmodels.Preparationproperty.objects.create(
            preparation=self.allowed_prep, collectionmemberid=self.other_collection.id,
        )
        obj = spmodels.Collectionobject.objects.prefetch_related(
            'preparations__preparationproperties',
        ).get(pk=self.parent.id)
        payload = _obj_to_data(obj, permissions.table_permissions_checker(
            self.collection, self.agent, 'read',
        ))
        self.assertEqual(
            [child['id'] for child in payload['preparations']], [self.allowed_prep.id],
        )
        self.assertEqual(
            [child['id'] for child in payload['preparations'][0]['preparationproperties']],
            [allowed.id],
        )

    def test_trusted_serialization_without_checker_retains_all_children(self):
        from specifyweb.specify.api.serializers import obj_to_data

        payload = obj_to_data(self.parent)
        self.assertCountEqual(
            [child['id'] for child in payload['preparations']],
            [self.allowed_prep.id, self.restricted_prep.id],
        )

    def test_unexpected_checker_errors_are_not_suppressed(self):
        from specifyweb.specify.api.serializers import _obj_to_data

        def checker(obj):
            if isinstance(obj, spmodels.Preparation):
                raise ValueError('invalid record scope')

        with self.assertRaisesRegex(ValueError, 'invalid record scope'):
            _obj_to_data(self.parent, checker)

    def test_denial_inside_child_serialization_is_not_suppressed(self):
        from specifyweb.specify.api.serializers import _obj_to_data

        attribute = spmodels.Preparationattribute.objects.create(
            collectionmemberid=self.other_collection.id,
        )
        self.allowed_prep.preparationattribute = attribute
        self.allowed_prep.save()
        with self.assertRaises(permissions.NoMatchingRuleException):
            _obj_to_data(self.parent, permissions.table_permissions_checker(
                self.collection, self.agent, 'read',
            ))

class ForwardRelatedRowsApiTests(ScopedPermissionTestBase):
    def setUp(self):
        super().setUp()
        self.grant_access(self.collection)
        self.grant(self.collection, '/table/%', 'read')
        self.client.force_login(self.specifyuser)
        self.client.cookies['collection'] = str(self.collection.id)
        self.other_discipline = spmodels.Discipline.objects.create(
            division=self.division, datatype=self.datatype,
            geographytreedef=self.geographytreedef,
            geologictimeperiodtreedef=self.geologictimeperiodtreedef,
        )
        self.other_collection.discipline = self.other_discipline
        self.other_collection.save()
        self.allowed_event = self.collectingevent
        self.allowed_event.remarks = 'allowed'
        self.allowed_event.save()
        self.restricted_event = spmodels.Collectingevent.objects.create(
            discipline=self.other_discipline, remarks='restricted',
        )
        self.allowed_record, self.restricted_record, self.null_record = (
            self.collectionobjects[:3]
        )
        self.allowed_record.collectingevent = self.allowed_event
        self.allowed_record.save()
        self.restricted_record.collectingevent = self.restricted_event
        self.restricted_record.save()

    def get_rows(self, **params):
        return self.client.get('/table_rows/specify_rows/collectionobject/', {
            'fields': 'id,collectingevent__remarks',
            'id__in': ','.join(str(obj.id) for obj in (
                self.allowed_record, self.restricted_record, self.null_record,
            )),
            'limit': 0, 'orderby': '-id', **params,
        })

    def test_excludes_restricted_related_record_and_preserves_null(self):
        response = self.get_rows()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [
            [self.null_record.id, None], [self.allowed_record.id, 'allowed'],
        ])

    def test_base_record_remains_visible_without_relationship_projection(self):
        response = self.get_rows(fields='id', id=self.restricted_record.id)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [[self.restricted_record.id]])

    def test_related_read_grant_requires_collection_access(self):
        self.grant(self.other_collection, '/table/collectingevent', 'read')
        response = self.get_rows(id=self.restricted_record.id)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_related_collection_access_requires_table_read(self):
        self.grant_access(self.other_collection)
        response = self.get_rows(id=self.restricted_record.id)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_both_grants_allow_related_record(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/collectingevent', 'read')
        response = self.get_rows(id=self.restricted_record.id)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [[self.restricted_record.id, 'restricted']])

    def test_base_table_grant_does_not_replace_related_table_grant(self):
        initialize.wipe_permissions()
        self.grant_access(self.collection)
        self.grant(self.collection, '/table/collectionobject', 'read')
        response = self.get_rows()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [[self.null_record.id, None]])

    def test_global_grant_allows_related_records(self):
        self.grant(None, '%', '%')
        response = self.get_rows(id=self.restricted_record.id)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [[self.restricted_record.id, 'restricted']])

    def test_filters_before_pagination(self):
        response = self.get_rows(offset=1, limit=1)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [[self.allowed_record.id, 'allowed']])

    def test_distinct_projection_excludes_restricted_values(self):
        response = self.get_rows(
            fields='collectingevent__remarks', distinct='true',
            orderby='collectingevent__remarks',
        )
        self.assertEqual(response.status_code, 200)
        self.assertCountEqual(response.json(), [[None], ['allowed']])

    def test_nested_projection_checks_each_related_scope(self):
        locality = spmodels.Locality.objects.create(
            discipline=self.other_discipline, localityname='restricted locality',
        )
        self.allowed_event.locality = locality
        self.allowed_event.save()
        response = self.get_rows(fields='id,collectingevent__locality__localityname')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [[self.null_record.id, None]])

    def test_nested_projection_preserves_missing_locality(self):
        response = self.get_rows(fields='id,collectingevent__locality__localityname')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [
            [self.null_record.id, None], [self.allowed_record.id, None],
        ])

    def test_invalid_projection_retains_bad_request_response(self):
        response = self.get_rows(fields='collectingevent__unknown__remarks')
        self.assertEqual(response.status_code, 400)

    def test_scalar_transforms_remain_valid(self):
        response = self.get_rows(
            id=self.allowed_record.id, fields='timestampcreated__year',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [[self.allowed_record.timestampcreated.year]])

    def test_unprojected_related_ordering_requires_related_read_scope(self):
        for orderby in ('collectingevent__remarks', '-collectingevent__remarks'):
            with self.subTest(orderby=orderby):
                response = self.get_rows(fields='id', orderby=orderby)
                self.assertEqual(response.status_code, 200)
                self.assertCountEqual(response.json(), [
                    [self.null_record.id], [self.allowed_record.id],
                ])

    def test_related_ordering_filters_before_pagination(self):
        response = self.get_rows(
            fields='id', orderby='-collectingevent__remarks', limit=1,
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [[self.allowed_record.id]])

    def test_related_ordering_allows_qualifying_grants(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/collectingevent', 'read')
        response = self.get_rows(
            fields='id', id=self.restricted_record.id,
            orderby='-collectingevent__remarks',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [[self.restricted_record.id]])

    def test_related_ordering_requires_both_grants(self):
        self.grant(self.other_collection, '/table/collectingevent', 'read')
        response = self.get_rows(
            fields='id', id=self.restricted_record.id,
            orderby='collectingevent__remarks',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_related_ordering_requires_related_table_grant(self):
        self.grant_access(self.other_collection)
        response = self.get_rows(
            fields='id', id=self.restricted_record.id,
            orderby='collectingevent__remarks',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_nested_ordering_checks_each_related_scope(self):
        locality = spmodels.Locality.objects.create(
            discipline=self.other_discipline, localityname='restricted locality',
        )
        self.allowed_event.locality = locality
        self.allowed_event.save()
        response = self.get_rows(
            fields='id', orderby='-collectingevent__locality__localityname',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [[self.null_record.id]])

    def test_legacy_dispatch_rows_checks_unprojected_ordering(self):
        from specifyweb.specify.api.dispatch import rows

        request = RequestFactory().get(
            '/table_rows/specify_rows/collectionobject/', {
                'fields': 'id', 'id': self.restricted_record.id,
                'orderby': '-collectingevent__remarks',
            },
        )
        request.specify_collection = self.collection
        request.specify_user_agent = self.agent
        response = rows(request, 'collectionobject')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content), [])

    def test_unprojected_related_filters_require_related_scope(self):
        for lookup, value in (
            ('collectingevent__remarks', 'restricted'),
            ('collectingevent__remarks__icontains', 'restrict'),
            ('collectingevent__id__in', str(self.restricted_event.id)),
        ):
            with self.subTest(lookup=lookup):
                response = self.get_rows(fields='id', **{lookup: value})
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.json(), [])

    def test_related_filter_allows_qualifying_grants(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/collectingevent', 'read')
        response = self.get_rows(
            fields='id', collectingevent__remarks='restricted',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [[self.restricted_record.id]])

    def test_related_filter_read_grant_requires_collection_access(self):
        self.grant(self.other_collection, '/table/collectingevent', 'read')
        response = self.get_rows(fields='id', collectingevent__remarks='restricted')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_related_filter_access_requires_table_read(self):
        self.grant_access(self.other_collection)
        response = self.get_rows(fields='id', collectingevent__remarks='restricted')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_nested_filter_checks_each_related_scope(self):
        locality = spmodels.Locality.objects.create(
            discipline=self.other_discipline, localityname='restricted locality',
        )
        self.allowed_event.locality = locality
        self.allowed_event.save()
        response = self.get_rows(
            fields='id', collectingevent__locality__localityname='restricted locality',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_related_isnull_filter_preserves_missing_relationship(self):
        response = self.get_rows(fields='id', collectingevent__remarks__isnull='true')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [[self.null_record.id]])

    def test_related_filter_checks_scope_before_pagination(self):
        response = self.get_rows(
            fields='id', collectingevent__remarks__isnull='false', limit=1,
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [[self.allowed_record.id]])

    def test_legacy_dispatch_rows_checks_unprojected_filters(self):
        from specifyweb.specify.api.dispatch import rows

        request = RequestFactory().get(
            '/table_rows/specify_rows/collectionobject/', {
                'fields': 'id', 'collectingevent__remarks': 'restricted',
            },
        )
        request.specify_collection = self.collection
        request.specify_user_agent = self.agent
        response = rows(request, 'collectionobject')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content), [])

    def test_legacy_dispatch_rows_uses_same_related_filter(self):
        from specifyweb.specify.api.dispatch import rows

        request = RequestFactory().get(
            '/table_rows/specify_rows/collectionobject/', {
                'fields': 'id,collectingevent__remarks',
                'id': self.restricted_record.id,
            },
        )
        request.specify_collection = self.collection
        request.specify_user_agent = self.agent
        response = rows(request, 'collectionobject')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content), [])

    def assert_list_ids(self, expected, **params):
        response = self.client.get('/api/specify/collectionobject/', {
            'id__in': ','.join(str(obj.id) for obj in (
                self.allowed_record, self.restricted_record, self.null_record,
            )),
            'limit': 0, 'orderby': '-id', **params,
        })
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload['meta']['total_count'], len(expected))
        self.assertCountEqual(
            [obj['id'] for obj in payload['objects']], [obj.id for obj in expected],
        )

    def test_list_related_filter_excludes_restricted_matches_and_count(self):
        self.assert_list_ids([], collectingevent__remarks='restricted')

    def test_list_related_ordering_excludes_restricted_records_and_count(self):
        self.assert_list_ids(
            [self.allowed_record, self.null_record],
            orderby='-collectingevent__remarks,id',
        )

    def test_list_related_ordering_filters_before_pagination(self):
        response = self.client.get('/api/specify/collectionobject/', {
            'id__in': f'{self.allowed_record.id},{self.restricted_record.id}',
            'orderby': '-collectingevent__remarks', 'limit': 1,
        })
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload['meta']['total_count'], 1)
        self.assertEqual(
            [obj['id'] for obj in payload['objects']], [self.allowed_record.id],
        )

    def test_list_related_read_grant_requires_collection_access(self):
        self.grant(self.other_collection, '/table/collectingevent', 'read')
        self.assert_list_ids([], collectingevent__remarks='restricted')

    def test_list_related_access_requires_table_read(self):
        self.grant_access(self.other_collection)
        self.assert_list_ids([], collectingevent__remarks='restricted')

    def test_list_related_filter_allows_qualifying_grants(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/collectingevent', 'read')
        self.assert_list_ids(
            [self.restricted_record], collectingevent__remarks='restricted',
        )

    def test_list_without_relationship_query_preserves_base_records(self):
        self.assert_list_ids([
            self.allowed_record, self.restricted_record, self.null_record,
        ])

    def test_list_nested_filter_checks_each_related_scope(self):
        locality = spmodels.Locality.objects.create(
            discipline=self.other_discipline, localityname='restricted locality',
        )
        self.allowed_event.locality = locality
        self.allowed_event.save()
        self.assert_list_ids(
            [], collectingevent__locality__localityname='restricted locality',
        )

    def test_list_related_filter_preserves_null_relationships(self):
        self.assert_list_ids(
            [self.null_record], collectingevent__remarks__isnull='true',
        )

    def test_list_global_grant_preserves_related_ordering(self):
        self.grant(None, '%', '%')
        self.assert_list_ids(
            [self.allowed_record, self.restricted_record, self.null_record],
            orderby='-collectingevent__remarks,id',
        )

    def test_terminal_fk_filters_require_related_scope(self):
        for field in (
            'collectingevent', 'collectingevent_id',
            'collectingevent__exact', 'collectingevent_id__in',
        ):
            with self.subTest(field=field):
                response = self.get_rows(
                    fields='id', **{field: str(self.restricted_event.id)},
                )
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.json(), [])
                self.assert_list_ids([], **{field: str(self.restricted_event.id)})

    def test_terminal_fk_projections_require_related_scope(self):
        for field in ('collectingevent', 'collectingevent_id'):
            with self.subTest(field=field):
                response = self.get_rows(fields=f'id,{field}')
                self.assertEqual(response.status_code, 200)
                self.assertCountEqual(response.json(), [
                    [self.allowed_record.id, self.allowed_event.id],
                    [self.null_record.id, None],
                ])

    def test_terminal_fk_ordering_requires_related_scope(self):
        self.assert_list_ids(
            [self.allowed_record, self.null_record], orderby='-collectingevent_id',
        )
        response = self.get_rows(fields='id', orderby='-collectingevent_id')
        self.assertEqual(response.status_code, 200)
        self.assertCountEqual(response.json(), [
            [self.allowed_record.id], [self.null_record.id],
        ])

    def test_terminal_fk_allows_qualifying_grants(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/collectingevent', 'read')
        self.assert_list_ids(
            [self.restricted_record], collectingevent=self.restricted_event.id,
        )
        response = self.get_rows(
            fields='id,collectingevent_id', collectingevent=self.restricted_event.id,
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [
            [self.restricted_record.id, self.restricted_event.id],
        ])

    def test_terminal_fk_null_filter_preserves_missing_relationship(self):
        self.assert_list_ids([self.null_record], collectingevent__isnull='true')
        response = self.get_rows(fields='id', collectingevent__isnull='true')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [[self.null_record.id]])

    def test_legacy_rows_checks_terminal_fk_projection(self):
        from specifyweb.specify.api.dispatch import rows

        request = RequestFactory().get(
            '/table_rows/specify_rows/collectionobject/', {
                'fields': 'collectingevent_id', 'id': self.restricted_record.id,
            },
        )
        request.specify_collection = self.collection
        request.specify_user_agent = self.agent
        response = rows(request, 'collectionobject')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content), [])

class DivisionScopedReadApiTests(ScopedPermissionTestBase):
    def setUp(self):
        super().setUp()
        self.grant_access(self.collection)
        self.grant(self.collection, '/table/%', 'read')
        self.client.force_login(self.specifyuser)
        self.client.cookies['collection'] = str(self.collection.id)
        self.other_division = spmodels.Division.objects.create(
            institution=self.institution, name='Other Division'
        )
        self.other_discipline = spmodels.Discipline.objects.create(
            division=self.other_division, datatype=self.datatype,
            geographytreedef=self.geographytreedef,
            geologictimeperiodtreedef=self.geologictimeperiodtreedef,
        )
        self.other_collection.discipline = self.other_discipline
        self.other_collection.save()
        self.restricted_agent = spmodels.Agent.objects.create(
            agenttype=0, division=self.other_division, lastname='Restricted'
        )

    def assert_visible_agents(self, expected, **params):
        for path in (
            '/api/specify/agent/',
            '/table_rows/specify_rows/agent/',
        ):
            with self.subTest(path=path):
                response = self.client.get(
                    path, {'fields': 'id', 'limit': 0, **params}
                    if path.startswith('/table_rows/')
                    else {'limit': 0, **params},
                )
                self.assertEqual(response.status_code, 200)
                payload = response.json()
                if isinstance(payload, dict):
                    self.assertEqual(payload['meta']['total_count'], len(expected))
                    ids = [obj['id'] for obj in payload['objects']]
                else:
                    ids = [row[0] for row in payload]
                self.assertCountEqual(ids, [obj.id for obj in expected])

    def test_excludes_other_division(self):
        self.assert_visible_agents([self.agent])

    def test_explicit_restricted_id_returns_empty_results(self):
        self.assert_visible_agents([], id=self.restricted_agent.id)

    def test_read_grant_requires_collection_access_in_same_division(self):
        self.grant(self.other_collection, '/table/%', 'read')
        self.assert_visible_agents([self.agent])

    def test_collection_access_requires_table_read_grant(self):
        self.grant_access(self.other_collection)
        self.assert_visible_agents([self.agent])

    def test_both_grants_allow_other_division(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/%', 'read')
        self.assert_visible_agents([self.agent, self.restricted_agent])

    def test_global_grant_preserves_domainfilter(self):
        self.grant(None, '%', '%')
        self.assert_visible_agents([self.agent, self.restricted_agent])
        self.assert_visible_agents([self.agent], domainfilter='true')

    def test_missing_division_preserves_institution_fallback(self):
        unscoped_agent = spmodels.Agent.objects.create(
            agenttype=0, lastname='Institution scoped'
        )
        self.assert_visible_agents([self.agent, unscoped_agent])

    def test_no_read_grants_exclude_missing_division_records(self):
        spmodels.Agent.objects.create(agenttype=0, lastname='Unscoped')
        models.UserPolicy.objects.filter(action='read').delete()

        queryset = permissions.filter_scoped_read_queryset(
            spmodels.Agent.objects.all(), self.agent
        )

        self.assertFalse(queryset.exists())

    def test_discipline_records_are_not_treated_as_division_scoped(self):
        self.assertCountEqual(
            permissions.filter_scoped_read_queryset(
                spmodels.Discipline.objects.all(), self.agent
            ),
            [self.discipline],
        )

    def test_filters_before_pagination(self):
        for path in ('/api/specify/agent/', '/table_rows/specify_rows/agent/'):
            with self.subTest(path=path):
                params = {'orderby': '-id', 'limit': 1}
                if path.startswith('/table_rows/'):
                    params['fields'] = 'id'
                response = self.client.get(path, params)
                self.assertEqual(response.status_code, 200)
                payload = response.json()
                if isinstance(payload, dict):
                    self.assertEqual(payload['meta']['total_count'], 1)
                    self.assertEqual(payload['objects'][0]['id'], self.agent.id)
                else:
                    self.assertEqual(payload, [[self.agent.id]])

class DisciplineScopedReadApiTests(ScopedPermissionTestBase):
    def setUp(self):
        super().setUp()
        self.grant_access(self.collection)
        self.grant(self.collection, '/table/%', 'read')
        self.client.force_login(self.specifyuser)
        self.client.cookies['collection'] = str(self.collection.id)
        self.other_discipline = spmodels.Discipline.objects.create(
            division=self.division, datatype=self.datatype,
            geographytreedef=self.geographytreedef,
            geologictimeperiodtreedef=self.geologictimeperiodtreedef,
        )
        self.other_collection.discipline = self.other_discipline
        self.other_collection.save()
        self.restricted_event = spmodels.Collectingevent.objects.create(
            discipline=self.other_discipline
        )

    def assert_visible_events(self, expected, **params):
        for path in (
            '/api/specify/collectingevent/',
            '/table_rows/specify_rows/collectingevent/',
        ):
            with self.subTest(path=path):
                query = {'limit': 0, **params}
                if path.startswith('/table_rows/'):
                    query['fields'] = 'id'
                response = self.client.get(path, query)
                self.assertEqual(response.status_code, 200)
                payload = response.json()
                if isinstance(payload, dict):
                    self.assertEqual(payload['meta']['total_count'], len(expected))
                    ids = [obj['id'] for obj in payload['objects']]
                else:
                    ids = [row[0] for row in payload]
                self.assertCountEqual(ids, [obj.id for obj in expected])

    def test_excludes_other_discipline_in_same_division(self):
        self.assert_visible_events([self.collectingevent])

    def test_explicit_restricted_id_returns_empty_results(self):
        self.assert_visible_events([], id=self.restricted_event.id)

    def test_read_grant_requires_collection_access(self):
        self.grant(self.other_collection, '/table/%', 'read')
        self.assert_visible_events([self.collectingevent])

    def test_collection_access_requires_table_read_grant(self):
        self.grant_access(self.other_collection)
        self.assert_visible_events([self.collectingevent])

    def test_both_grants_allow_other_discipline(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/%', 'read')
        self.assert_visible_events([self.collectingevent, self.restricted_event])

    def test_shared_discipline_is_accessible_through_sibling_collection(self):
        self.other_collection.discipline = self.discipline
        self.other_collection.save()
        self.restricted_event.discipline = self.discipline
        self.restricted_event.save()
        self.assert_visible_events([self.collectingevent, self.restricted_event])

    def test_global_grant_preserves_domainfilter(self):
        self.grant(None, '%', '%')
        self.assert_visible_events([self.collectingevent, self.restricted_event])
        self.assert_visible_events([self.collectingevent], domainfilter='true')

    def test_filters_before_pagination(self):
        for path in (
            '/api/specify/collectingevent/',
            '/table_rows/specify_rows/collectingevent/',
        ):
            with self.subTest(path=path):
                params = {'orderby': '-id', 'limit': 1}
                if path.startswith('/table_rows/'):
                    params['fields'] = 'id'
                response = self.client.get(path, params)
                self.assertEqual(response.status_code, 200)
                payload = response.json()
                if isinstance(payload, dict):
                    self.assertEqual(payload['meta']['total_count'], 1)
                    self.assertEqual(payload['objects'][0]['id'], self.collectingevent.id)
                else:
                    self.assertEqual(payload, [[self.collectingevent.id]])

    def test_no_read_grants_return_no_records(self):
        models.UserPolicy.objects.filter(action='read').delete()
        queryset = permissions.filter_scoped_read_queryset(
            spmodels.Collectingevent.objects.all(), self.agent
        )
        self.assertFalse(queryset.exists())

    def test_collection_hierarchy_records_are_not_discipline_scoped(self):
        self.assertCountEqual(
            permissions.filter_scoped_read_queryset(
                spmodels.Collection.objects.all(), self.agent
            ),
            [self.collection],
        )

class CollectionHierarchyReadApiTests(ScopedPermissionTestBase):
    def setUp(self):
        super().setUp()
        self.grant_access(self.collection)
        self.grant(self.collection, '/table/%', 'read')
        self.client.force_login(self.specifyuser)
        self.client.cookies['collection'] = str(self.collection.id)

    def assert_visible_collections(self, expected, **params):
        for path in ('/api/specify/collection/', '/table_rows/specify_rows/collection/'):
            with self.subTest(path=path):
                query = {'limit': 0, **params}
                if path.startswith('/table_rows/'):
                    query['fields'] = 'id'
                response = self.client.get(path, query)
                self.assertEqual(response.status_code, 200)
                payload = response.json()
                if isinstance(payload, dict):
                    self.assertEqual(payload['meta']['total_count'], len(expected))
                    ids = [obj['id'] for obj in payload['objects']]
                else:
                    ids = [row[0] for row in payload]
                self.assertCountEqual(ids, [obj.id for obj in expected])

    def test_sibling_collection_requires_its_own_grants(self):
        for domainfilter in (None, 'false', 'true'):
            with self.subTest(domainfilter=domainfilter):
                params = {} if domainfilter is None else {'domainfilter': domainfilter}
                self.assert_visible_collections([self.collection], **params)

    def test_explicit_restricted_id_returns_empty_results(self):
        self.assert_visible_collections([], id=self.other_collection.id)

    def test_read_grant_requires_collection_access(self):
        self.grant(self.other_collection, '/table/%', 'read')
        self.assert_visible_collections([self.collection])

    def test_collection_access_requires_table_read_grant(self):
        self.grant_access(self.other_collection)
        self.assert_visible_collections([self.collection])

    def test_both_grants_allow_other_collection(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/%', 'read')
        self.assert_visible_collections([self.collection, self.other_collection])

    def test_global_grant_allows_both_collections(self):
        self.grant(None, '%', '%')
        self.assert_visible_collections([self.collection, self.other_collection])

    def test_filters_before_pagination(self):
        for path in ('/api/specify/collection/', '/table_rows/specify_rows/collection/'):
            with self.subTest(path=path):
                params = {'orderby': '-id', 'limit': 1}
                if path.startswith('/table_rows/'):
                    params['fields'] = 'id'
                response = self.client.get(path, params)
                self.assertEqual(response.status_code, 200)
                payload = response.json()
                if isinstance(payload, dict):
                    self.assertEqual(payload['meta']['total_count'], 1)
                    self.assertEqual(payload['objects'][0]['id'], self.collection.id)
                else:
                    self.assertEqual(payload, [[self.collection.id]])

class HierarchyScopedReadApiTests(ScopedPermissionTestBase):
    def setUp(self):
        super().setUp()
        self.grant_access(self.collection)
        self.grant(self.collection, '/table/%', 'read')
        self.client.force_login(self.specifyuser)
        self.client.cookies['collection'] = str(self.collection.id)
        self.other_institution = spmodels.Institution.objects.create(
            name='Other Institution', isaccessionsglobal=True,
            issecurityon=False, isserverbased=False,
            issharinglocalities=True, issinglegeographytree=True,
        )
        self.other_division = spmodels.Division.objects.create(
            institution=self.other_institution, name='Other Division'
        )
        self.other_discipline = spmodels.Discipline.objects.create(
            division=self.other_division, datatype=self.datatype,
            taxontreedef=self.taxontreedef,
            geographytreedef=self.geographytreedef,
            geologictimeperiodtreedef=self.geologictimeperiodtreedef,
        )
        self.other_collection.discipline = self.other_discipline
        self.other_collection.save()
        self.scopes = (
            ('discipline', self.discipline, self.other_discipline),
            ('division', self.division, self.other_division),
            ('institution', self.institution, self.other_institution),
        )

    def assert_visible_hierarchy(self, include_other=False, restricted_only=False):
        for model, allowed, restricted in self.scopes:
            for prefix in ('/api/specify', '/table_rows/specify_rows'):
                with self.subTest(model=model, prefix=prefix):
                    params = {'limit': 0, 'orderby': '-id'}
                    if prefix == '/table_rows/specify_rows':
                        params['fields'] = 'id'
                    if restricted_only:
                        params['id'] = restricted.id
                    response = self.client.get(f'{prefix}/{model}/', params)
                    self.assertEqual(response.status_code, 200)
                    expected = [allowed.id]
                    if include_other:
                        expected.append(restricted.id)
                    if restricted_only:
                        expected = [restricted.id] if include_other else []
                    payload = response.json()
                    if isinstance(payload, dict):
                        self.assertEqual(payload['meta']['total_count'], len(expected))
                        ids = [obj['id'] for obj in payload['objects']]
                    else:
                        ids = [row[0] for row in payload]
                    self.assertCountEqual(ids, expected)

    def test_excludes_restricted_hierarchy_scopes(self):
        self.assert_visible_hierarchy()

    def test_restricted_ids_return_empty_results(self):
        self.assert_visible_hierarchy(restricted_only=True)

    def test_read_grants_require_collection_access(self):
        self.grant(self.other_collection, '/table/%', 'read')
        self.assert_visible_hierarchy()

    def test_collection_access_requires_table_read_grants(self):
        self.grant_access(self.other_collection)
        self.assert_visible_hierarchy()

    def test_both_grants_allow_other_hierarchy_scopes(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/%', 'read')
        self.assert_visible_hierarchy(include_other=True)

    def test_global_grant_allows_other_hierarchy_scopes(self):
        self.grant(None, '%', '%')
        self.assert_visible_hierarchy(include_other=True)

    def test_empty_hierarchy_scope_does_not_inherit_other_scope_grants(self):
        self.other_collection.delete()
        self.grant(None, '%', '%')
        self.assert_visible_hierarchy(restricted_only=True)

class DisciplineTreeReadApiTests(ScopedPermissionTestBase):
    def setUp(self):
        super().setUp()
        self.grant_access(self.collection)
        self.grant(self.collection, '/table/%', 'read')
        self.client.force_login(self.specifyuser)
        self.client.cookies['collection'] = str(self.collection.id)
        self.other_discipline = spmodels.Discipline.objects.create(
            division=self.division, datatype=self.datatype,
            geographytreedef=self.geographytreedef,
            geologictimeperiodtreedef=self.geologictimeperiodtreedef,
        )
        self.other_collection.discipline = self.other_discipline
        self.other_collection.save()
        self.nodes = []
        for name in (
            'Taxon', 'Geography', 'Geologictimeperiod', 'Lithostrat', 'Tectonicunit',
        ):
            model = getattr(spmodels, name)
            definition_model = getattr(spmodels, f'{name}treedef')
            nodes = []
            for label, discipline in (
                ('Allowed', self.discipline), ('Restricted', self.other_discipline),
            ):
                definition = definition_model.objects.create(
                    name=f'{label} {name}', discipline=discipline,
                )
                rank = definition.treedefitems.create(name='Root', rankid=0)
                nodes.append(model.objects.create(
                    name=label, definition=definition, definitionitem=rank,
                    rankid=0,
                ))
            self.nodes.append((name.lower(), *nodes))

    def assert_visible_nodes(self, include_other=False, **params):
        for table, allowed, restricted in self.nodes:
            for prefix in ('/api/specify', '/table_rows/specify_rows'):
                with self.subTest(table=table, prefix=prefix):
                    query = {'limit': 0, 'orderby': '-id', **params}
                    if prefix == '/table_rows/specify_rows':
                        query['fields'] = 'id'
                    response = self.client.get(f'{prefix}/{table}/', query)
                    self.assertEqual(response.status_code, 200)
                    expected = [allowed.id]
                    if include_other:
                        expected.append(restricted.id)
                    payload = response.json()
                    if isinstance(payload, dict):
                        self.assertEqual(payload['meta']['total_count'], len(expected))
                        ids = [obj['id'] for obj in payload['objects']]
                    else:
                        ids = [row[0] for row in payload]
                    self.assertCountEqual(ids, expected)

    def test_excludes_restricted_discipline_nodes(self):
        self.assert_visible_nodes()

    def test_restricted_id_returns_empty_rows(self):
        for table, _, restricted in self.nodes:
            with self.subTest(table=table):
                response = self.client.get(
                    f'/table_rows/specify_rows/{table}/',
                    {'fields': 'id', 'id': restricted.id},
                )
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.json(), [])

    def test_read_grant_requires_collection_access(self):
        self.grant(self.other_collection, '/table/%', 'read')
        self.assert_visible_nodes()

    def test_collection_access_requires_table_read_grant(self):
        self.grant_access(self.other_collection)
        self.assert_visible_nodes()

    def test_both_grants_allow_other_discipline_nodes(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/%', 'read')
        self.assert_visible_nodes(include_other=True)

    def test_global_grant_allows_other_discipline_nodes(self):
        self.grant(None, '%', '%')
        self.assert_visible_nodes(include_other=True)

    def test_shared_discipline_nodes_remain_visible(self):
        self.other_collection.discipline = self.discipline
        self.other_collection.save()
        for _, _, restricted in self.nodes:
            definition = restricted.definition
            definition.discipline = self.discipline
            definition.save()
        self.assert_visible_nodes(include_other=True)

    def test_filters_before_pagination(self):
        self.assert_visible_nodes(limit=1)

    def test_definitions_without_discipline_preserve_institution_fallback(self):
        for _, _, restricted in self.nodes:
            definition = restricted.definition
            definition.discipline = None
            definition.save()
        self.assert_visible_nodes(include_other=True)

    def test_institution_fallback_requires_access_and_read_grants(self):
        for _, _, restricted in self.nodes:
            definition = restricted.definition
            definition.discipline = None
            definition.save()
        initialize.wipe_permissions()
        self.grant(self.collection, '/table/%', 'read')
        for table, allowed, _ in self.nodes:
            with self.subTest(table=table):
                self.assertFalse(permissions.filter_scoped_read_queryset(
                    type(allowed).objects.all(), self.agent
                ).exists())

    def test_distinct_projection_excludes_restricted_names(self):
        for table, _, _ in self.nodes:
            with self.subTest(table=table):
                response = self.client.get(
                    f'/table_rows/specify_rows/{table}/',
                    {'fields': 'name', 'distinct': 'true'},
                )
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.json(), [['Allowed']])

    def test_legacy_dispatch_rows_uses_same_scope_filter(self):
        from specifyweb.specify.api.dispatch import rows

        for table, _, restricted in self.nodes:
            with self.subTest(table=table):
                request = RequestFactory().get(
                    f'/table_rows/specify_rows/{table}/',
                    {'fields': 'id', 'id': restricted.id},
                )
                request.specify_collection = self.collection
                request.specify_user_agent = self.agent
                response = rows(request, table)
                self.assertEqual(response.status_code, 200)
                self.assertEqual(json.loads(response.content), [])

class StorageTreeReadApiTests(ScopedPermissionTestBase):
    def setUp(self):
        super().setUp()
        self.grant_access(self.collection)
        self.grant(self.collection, '/table/%', 'read')
        self.client.force_login(self.specifyuser)
        self.client.cookies['collection'] = str(self.collection.id)
        self.allowed_storage = self.make_storage(self.institution, 'Allowed')
        self.other_institution = spmodels.Institution.objects.create(
            name='Other Institution', isaccessionsglobal=True,
            issecurityon=False, isserverbased=False,
            issharinglocalities=True, issinglegeographytree=True,
        )
        self.other_division = spmodels.Division.objects.create(
            institution=self.other_institution, name='Other Division',
        )
        self.other_discipline = spmodels.Discipline.objects.create(
            division=self.other_division, datatype=self.datatype,
            taxontreedef=self.taxontreedef,
            geographytreedef=self.geographytreedef,
            geologictimeperiodtreedef=self.geologictimeperiodtreedef,
        )
        self.other_collection.discipline = self.other_discipline
        self.other_collection.save()
        self.restricted_storage = self.make_storage(
            self.other_institution, 'Restricted',
        )

    def make_storage(self, institution, name):
        definition = spmodels.Storagetreedef.objects.create(
            name=name, institution=institution,
        )
        rank = definition.treedefitems.create(name='Root', rankid=0)
        return spmodels.Storage.objects.create(
            name=name, rankid=0, definition=definition, definitionitem=rank,
        )

    def assert_visible_storage(self, expected, **params):
        for prefix in ('/api/specify', '/table_rows/specify_rows'):
            with self.subTest(prefix=prefix):
                query = {'limit': 0, 'orderby': '-id', **params}
                if prefix == '/table_rows/specify_rows':
                    query['fields'] = 'id'
                response = self.client.get(f'{prefix}/storage/', query)
                self.assertEqual(response.status_code, 200)
                payload = response.json()
                if isinstance(payload, dict):
                    self.assertEqual(payload['meta']['total_count'], len(expected))
                    ids = [obj['id'] for obj in payload['objects']]
                else:
                    ids = [row[0] for row in payload]
                self.assertCountEqual(ids, [obj.id for obj in expected])

    def test_excludes_other_institution(self):
        self.assert_visible_storage([self.allowed_storage])

    def test_restricted_id_returns_empty_results(self):
        self.assert_visible_storage([], id=self.restricted_storage.id)

    def test_read_grant_requires_collection_access(self):
        self.grant(self.other_collection, '/table/%', 'read')
        self.assert_visible_storage([self.allowed_storage])

    def test_collection_access_requires_table_read_grant(self):
        self.grant_access(self.other_collection)
        self.assert_visible_storage([self.allowed_storage])

    def test_both_grants_allow_other_institution(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/%', 'read')
        self.assert_visible_storage([self.allowed_storage, self.restricted_storage])

    def test_global_grant_allows_other_institution(self):
        self.grant(None, '%', '%')
        self.assert_visible_storage([self.allowed_storage, self.restricted_storage])

    def test_shared_institution_allows_other_division_storage(self):
        self.other_division.institution = self.institution
        self.other_division.save()
        definition = self.restricted_storage.definition
        definition.institution = self.institution
        definition.save()
        self.assert_visible_storage([self.allowed_storage, self.restricted_storage])

    def test_filters_before_pagination(self):
        self.assert_visible_storage([self.allowed_storage], limit=1)

    def test_distinct_projection_excludes_restricted_names(self):
        response = self.client.get(
            '/table_rows/specify_rows/storage/',
            {'fields': 'name', 'distinct': 'true'},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [['Allowed']])

    def test_legacy_dispatch_rows_uses_same_scope_filter(self):
        from specifyweb.specify.api.dispatch import rows

        request = RequestFactory().get(
            '/table_rows/specify_rows/storage/',
            {'fields': 'id', 'id': self.restricted_storage.id},
        )
        request.specify_collection = self.collection
        request.specify_user_agent = self.agent
        response = rows(request, 'storage')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content), [])

class StorageTreeFallbackReadTests(ScopedPermissionTestBase):
    def setUp(self):
        super().setUp()
        definition = spmodels.Storagetreedef.objects.create(name='Unscoped')
        rank = definition.treedefitems.create(name='Root', rankid=0)
        self.storage = spmodels.Storage.objects.create(
            name='Institution fallback', rankid=0,
            definition=definition, definitionitem=rank,
        )

    def filtered_storage(self):
        return permissions.filter_scoped_read_queryset(
            spmodels.Storage.objects.all(), self.agent,
        )

    def test_missing_institution_preserves_single_institution_fallback(self):
        self.grant_access(self.collection)
        self.grant(self.collection, '/table/storage', 'read')
        self.assertCountEqual(self.filtered_storage(), [self.storage])

    def test_missing_institution_requires_access_and_read_in_same_collection(self):
        self.grant_access(self.collection)
        self.grant(self.other_collection, '/table/storage', 'read')
        self.assertFalse(self.filtered_storage().exists())

    def test_ambiguous_institution_propagates_resolver_error(self):
        spmodels.Institution.objects.create(
            name='Other Institution', isaccessionsglobal=True,
            issecurityon=False, isserverbased=False,
            issharinglocalities=True, issinglegeographytree=True,
        )
        self.grant(None, '%', '%')
        with self.assertRaises(spmodels.Institution.MultipleObjectsReturned):
            self.filtered_storage()

class LoanGiftReadApiTests(ScopedPermissionTestBase):
    def setUp(self):
        super().setUp()
        self.grant_access(self.collection)
        self.grant(self.collection, '/table/%', 'read')
        self.client.force_login(self.specifyuser)
        self.client.cookies['collection'] = str(self.collection.id)
        self.other_division = spmodels.Division.objects.create(
            institution=self.institution, name='Other Division',
        )
        self.other_discipline = spmodels.Discipline.objects.create(
            division=self.other_division, datatype=self.datatype,
            geographytreedef=self.geographytreedef,
            geologictimeperiodtreedef=self.geologictimeperiodtreedef,
        )
        self.other_collection.discipline = self.other_discipline
        self.other_collection.save()
        self.records = []
        for model, number_field in (
            (spmodels.Loan, 'loannumber'), (spmodels.Gift, 'giftnumber'),
        ):
            allowed = model.objects.create(
                discipline=self.discipline, division=self.other_division,
                **{number_field: 'allowed'},
            )
            restricted = model.objects.create(
                discipline=self.other_discipline, division=self.division,
                **{number_field: 'restricted'},
            )
            self.records.append((model._meta.model_name, allowed, restricted))

    def assert_visible_records(self, include_other=False, restricted_only=False, **params):
        for table, allowed, restricted in self.records:
            for prefix in ('/api/specify', '/table_rows/specify_rows'):
                with self.subTest(table=table, prefix=prefix):
                    query = {'limit': 0, 'orderby': '-id', **params}
                    if prefix == '/table_rows/specify_rows':
                        query['fields'] = 'id'
                    if restricted_only:
                        query['id'] = restricted.id
                    response = self.client.get(f'{prefix}/{table}/', query)
                    self.assertEqual(response.status_code, 200)
                    expected = [allowed.id]
                    if include_other:
                        expected.append(restricted.id)
                    if restricted_only:
                        expected = [restricted.id] if include_other else []
                    payload = response.json()
                    if isinstance(payload, dict):
                        self.assertEqual(payload['meta']['total_count'], len(expected))
                        ids = [obj['id'] for obj in payload['objects']]
                    else:
                        ids = [row[0] for row in payload]
                    self.assertCountEqual(ids, expected)

    def test_discipline_takes_precedence_over_division(self):
        self.assert_visible_records()

    def test_restricted_id_returns_empty_results(self):
        self.assert_visible_records(restricted_only=True)

    def test_read_grant_requires_collection_access(self):
        self.grant(self.other_collection, '/table/%', 'read')
        self.assert_visible_records()

    def test_collection_access_requires_table_read_grant(self):
        self.grant_access(self.other_collection)
        self.assert_visible_records()

    def test_both_grants_allow_other_discipline(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/%', 'read')
        self.assert_visible_records(include_other=True)

    def test_global_grant_allows_other_discipline(self):
        self.grant(None, '%', '%')
        self.assert_visible_records(include_other=True)

    def test_shared_discipline_remains_visible(self):
        for _, _, restricted in self.records:
            restricted.discipline = self.discipline
            restricted.save()
        self.assert_visible_records(include_other=True)

    def test_missing_division_does_not_change_discipline_scope(self):
        for _, allowed, restricted in self.records:
            for record in (allowed, restricted):
                record.division = None
                record.save()
        self.assert_visible_records()

    def test_sibling_disciplines_in_same_division_remain_isolated(self):
        self.other_discipline.division = self.division
        self.other_discipline.save()
        self.assert_visible_records()

    def test_distinct_projection_excludes_restricted_numbers(self):
        for table, _, _ in self.records:
            with self.subTest(table=table):
                response = self.client.get(
                    f'/table_rows/specify_rows/{table}/',
                    {'fields': f'{table}number', 'distinct': 'true'},
                )
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.json(), [['allowed']])

    def test_filters_before_pagination(self):
        self.assert_visible_records(limit=1)

    def test_legacy_dispatch_rows_uses_same_scope_filter(self):
        from specifyweb.specify.api.dispatch import rows

        for table, _, restricted in self.records:
            with self.subTest(table=table):
                request = RequestFactory().get(
                    f'/table_rows/specify_rows/{table}/',
                    {'fields': 'id', 'id': restricted.id},
                )
                request.specify_collection = self.collection
                request.specify_user_agent = self.agent
                response = rows(request, table)
                self.assertEqual(response.status_code, 200)
                self.assertEqual(json.loads(response.content), [])

class AccessionReadApiTests(ScopedPermissionTestBase):
    def setUp(self):
        super().setUp()
        self.institution.isaccessionsglobal = False
        self.institution.save()
        self.grant_access(self.collection)
        self.grant(self.collection, '/table/%', 'read')
        self.client.force_login(self.specifyuser)
        self.client.cookies['collection'] = str(self.collection.id)
        self.other_division = spmodels.Division.objects.create(
            institution=self.institution, name='Other Division',
        )
        self.other_discipline = spmodels.Discipline.objects.create(
            division=self.other_division, datatype=self.datatype,
            geographytreedef=self.geographytreedef,
            geologictimeperiodtreedef=self.geologictimeperiodtreedef,
        )
        self.other_collection.discipline = self.other_discipline
        self.other_collection.save()
        self.allowed_accession = spmodels.Accession.objects.create(
            division=self.division, accessionnumber='allowed',
        )
        self.restricted_accession = spmodels.Accession.objects.create(
            division=self.other_division, accessionnumber='restricted',
        )

    def assert_visible_accessions(self, expected, **params):
        for prefix in ('/api/specify', '/table_rows/specify_rows'):
            with self.subTest(prefix=prefix):
                query = {'limit': 0, 'orderby': '-id', **params}
                if prefix == '/table_rows/specify_rows':
                    query['fields'] = 'id'
                response = self.client.get(f'{prefix}/accession/', query)
                self.assertEqual(response.status_code, 200)
                payload = response.json()
                if isinstance(payload, dict):
                    self.assertEqual(payload['meta']['total_count'], len(expected))
                    ids = [obj['id'] for obj in payload['objects']]
                else:
                    ids = [row[0] for row in payload]
                self.assertCountEqual(ids, [obj.id for obj in expected])

    def test_division_scope_excludes_other_division(self):
        self.assert_visible_accessions([self.allowed_accession])

    def test_restricted_id_returns_empty_results(self):
        self.assert_visible_accessions([], id=self.restricted_accession.id)

    def test_read_grant_requires_collection_access(self):
        self.grant(self.other_collection, '/table/%', 'read')
        self.assert_visible_accessions([self.allowed_accession])

    def test_collection_access_requires_table_read_grant(self):
        self.grant_access(self.other_collection)
        self.assert_visible_accessions([self.allowed_accession])

    def test_both_grants_allow_other_division(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/%', 'read')
        self.assert_visible_accessions([
            self.allowed_accession, self.restricted_accession,
        ])

    def test_global_grant_allows_other_division(self):
        self.grant(None, '%', '%')
        self.assert_visible_accessions([
            self.allowed_accession, self.restricted_accession,
        ])

    def test_shared_division_remains_visible(self):
        self.restricted_accession.division = self.division
        self.restricted_accession.save()
        self.assert_visible_accessions([
            self.allowed_accession, self.restricted_accession,
        ])

    def test_global_accessions_allow_other_division(self):
        self.institution.isaccessionsglobal = True
        self.institution.save()
        self.assert_visible_accessions([
            self.allowed_accession, self.restricted_accession,
        ])

    def test_global_accessions_require_access_and_read_in_same_collection(self):
        self.institution.isaccessionsglobal = True
        self.institution.save()
        initialize.wipe_permissions()
        self.grant(self.collection, '/table/%', 'read')
        self.grant_access(self.other_collection)
        self.assertFalse(permissions.filter_scoped_read_queryset(
            spmodels.Accession.objects.all(), self.agent,
        ).exists())
        for prefix in ('/api/specify', '/table_rows/specify_rows'):
            with self.subTest(prefix=prefix):
                response = self.client.get(f'{prefix}/accession/', {'fields': 'id'})
                self.assertEqual(response.status_code, 403)

    def test_filters_before_pagination(self):
        self.assert_visible_accessions([self.allowed_accession], limit=1)

    def test_distinct_projection_excludes_restricted_numbers(self):
        response = self.client.get(
            '/table_rows/specify_rows/accession/',
            {'fields': 'accessionnumber', 'distinct': 'true'},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [['allowed']])

    def test_legacy_dispatch_rows_uses_same_scope_filter(self):
        from specifyweb.specify.api.dispatch import rows

        request = RequestFactory().get(
            '/table_rows/specify_rows/accession/',
            {'fields': 'id', 'id': self.restricted_accession.id},
        )
        request.specify_collection = self.collection
        request.specify_user_agent = self.agent
        response = rows(request, 'accession')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content), [])

class InstitutionRecordReadApiTests(ScopedPermissionTestBase):
    def setUp(self):
        super().setUp()
        self.grant_access(self.collection)
        self.grant(self.collection, '/table/%', 'read')
        self.client.force_login(self.specifyuser)
        self.client.cookies['collection'] = str(self.collection.id)
        self.other_institution = spmodels.Institution.objects.create(
            name='Other Institution', isaccessionsglobal=True,
            issecurityon=False, isserverbased=False,
            issharinglocalities=True, issinglegeographytree=True,
        )
        self.other_division = spmodels.Division.objects.create(
            institution=self.other_institution, name='Other Division',
        )
        self.other_discipline = spmodels.Discipline.objects.create(
            division=self.other_division, datatype=self.datatype,
            taxontreedef=self.taxontreedef,
            geographytreedef=self.geographytreedef,
            geologictimeperiodtreedef=self.geologictimeperiodtreedef,
        )
        self.other_collection.discipline = self.other_discipline
        self.other_collection.save()
        self.records = []
        for model, label_field, fields in (
            (spmodels.Permit, 'permitnumber', {}),
            (spmodels.Referencework, 'title', {'referenceworktype': 0}),
        ):
            allowed = model.objects.create(
                institution=self.institution, **{label_field: 'allowed'}, **fields,
            )
            restricted = model.objects.create(
                institution=self.other_institution,
                **{label_field: 'restricted'}, **fields,
            )
            self.records.append((model._meta.model_name, allowed, restricted))

    def assert_visible_records(self, include_other=False, restricted_only=False, **params):
        for table, allowed, restricted in self.records:
            for prefix in ('/api/specify', '/table_rows/specify_rows'):
                with self.subTest(table=table, prefix=prefix):
                    query = {'limit': 0, 'orderby': '-id', **params}
                    if prefix == '/table_rows/specify_rows':
                        query['fields'] = 'id'
                    if restricted_only:
                        query['id'] = restricted.id
                    response = self.client.get(f'{prefix}/{table}/', query)
                    self.assertEqual(response.status_code, 200)
                    expected = [allowed.id]
                    if include_other:
                        expected.append(restricted.id)
                    if restricted_only:
                        expected = [restricted.id] if include_other else []
                    payload = response.json()
                    if isinstance(payload, dict):
                        self.assertEqual(payload['meta']['total_count'], len(expected))
                        ids = [obj['id'] for obj in payload['objects']]
                    else:
                        ids = [row[0] for row in payload]
                    self.assertCountEqual(ids, expected)

    def test_excludes_other_institution(self):
        self.assert_visible_records()

    def test_restricted_id_returns_empty_results(self):
        self.assert_visible_records(restricted_only=True)

    def test_read_grant_requires_collection_access(self):
        self.grant(self.other_collection, '/table/%', 'read')
        self.assert_visible_records()

    def test_collection_access_requires_table_read_grant(self):
        self.grant_access(self.other_collection)
        self.assert_visible_records()

    def test_both_grants_allow_other_institution(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/%', 'read')
        self.assert_visible_records(include_other=True)

    def test_global_grant_allows_other_institution(self):
        self.grant(None, '%', '%')
        self.assert_visible_records(include_other=True)

    def test_shared_institution_remains_visible(self):
        for _, _, restricted in self.records:
            restricted.institution = self.institution
            restricted.save()
        self.assert_visible_records(include_other=True)

    def test_empty_institution_scope_is_excluded_even_with_global_grant(self):
        self.other_collection.delete()
        self.grant(None, '%', '%')
        self.assert_visible_records()

    def test_distinct_projection_excludes_restricted_values(self):
        for table, field in (('permit', 'permitnumber'), ('referencework', 'title')):
            with self.subTest(table=table):
                response = self.client.get(
                    f'/table_rows/specify_rows/{table}/',
                    {'fields': field, 'distinct': 'true'},
                )
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.json(), [['allowed']])

    def test_filters_before_pagination(self):
        self.assert_visible_records(limit=1)

    def test_legacy_dispatch_rows_uses_same_scope_filter(self):
        from specifyweb.specify.api.dispatch import rows

        for table, _, restricted in self.records:
            with self.subTest(table=table):
                request = RequestFactory().get(
                    f'/table_rows/specify_rows/{table}/',
                    {'fields': 'id', 'id': restricted.id},
                )
                request.specify_collection = self.collection
                request.specify_user_agent = self.agent
                response = rows(request, table)
                self.assertEqual(response.status_code, 200)
                self.assertEqual(json.loads(response.content), [])

class FieldNotebookReadApiTests(ScopedPermissionTestBase):
    def setUp(self):
        super().setUp()
        self.grant_access(self.collection)
        self.grant(self.collection, '/table/%', 'read')
        self.client.force_login(self.specifyuser)
        self.client.cookies['collection'] = str(self.collection.id)
        self.other_discipline = spmodels.Discipline.objects.create(
            division=self.division, datatype=self.datatype,
            geographytreedef=self.geographytreedef,
            geologictimeperiodtreedef=self.geologictimeperiodtreedef,
        )
        self.other_collection.discipline = self.other_discipline
        self.other_collection.save()
        chains = []
        for label, discipline, competing_discipline, collection in (
            ('allowed', self.discipline, self.other_discipline, self.other_collection),
            ('restricted', self.other_discipline, self.discipline, self.collection),
        ):
            notebook = spmodels.Fieldnotebook.objects.create(
                name=label, discipline=discipline, collection=collection,
                owneragent=self.agent,
            )
            pageset = spmodels.Fieldnotebookpageset.objects.create(
                description=label, fieldnotebook=notebook,
                discipline=competing_discipline,
            )
            page = spmodels.Fieldnotebookpage.objects.create(
                pagenumber=label, pageset=pageset, discipline=competing_discipline,
            )
            chains.append((notebook, pageset, page))
        self.records = tuple(zip(
            ('fieldnotebook', 'fieldnotebookpageset', 'fieldnotebookpage'),
            *chains,
        ))

    def assert_visible_records(self, include_other=False, restricted_only=False, **params):
        for table, allowed, restricted in self.records:
            for prefix in ('/api/specify', '/table_rows/specify_rows'):
                with self.subTest(table=table, prefix=prefix):
                    query = {'limit': 0, 'orderby': '-id', **params}
                    if prefix == '/table_rows/specify_rows':
                        query['fields'] = 'id'
                    if restricted_only:
                        query['id'] = restricted.id
                    response = self.client.get(f'{prefix}/{table}/', query)
                    self.assertEqual(response.status_code, 200)
                    expected = [allowed.id]
                    if include_other:
                        expected.append(restricted.id)
                    if restricted_only:
                        expected = [restricted.id] if include_other else []
                    payload = response.json()
                    if isinstance(payload, dict):
                        self.assertEqual(payload['meta']['total_count'], len(expected))
                        ids = [obj['id'] for obj in payload['objects']]
                    else:
                        ids = [row[0] for row in payload]
                    self.assertCountEqual(ids, expected)

    def test_notebook_discipline_overrides_competing_scope_fields(self):
        self.assert_visible_records()

    def test_restricted_id_returns_empty_results(self):
        self.assert_visible_records(restricted_only=True)

    def test_read_grant_requires_collection_access(self):
        self.grant(self.other_collection, '/table/%', 'read')
        self.assert_visible_records()

    def test_collection_access_requires_table_read_grant(self):
        self.grant_access(self.other_collection)
        self.assert_visible_records()

    def test_both_grants_allow_other_discipline(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/%', 'read')
        self.assert_visible_records(include_other=True)

    def test_global_grant_allows_other_discipline(self):
        self.grant(None, '%', '%')
        self.assert_visible_records(include_other=True)

    def test_shared_discipline_remains_visible(self):
        notebook = self.records[0][2]
        notebook.discipline = self.discipline
        notebook.save()
        self.assert_visible_records(include_other=True)

    def test_filters_before_pagination(self):
        self.assert_visible_records(limit=1)

    def test_missing_parent_chains_are_excluded(self):
        orphan_pageset = spmodels.Fieldnotebookpageset.objects.create(
            discipline=self.discipline,
        )
        spmodels.Fieldnotebookpage.objects.create(
            pagenumber='no-pageset', discipline=self.discipline,
        )
        spmodels.Fieldnotebookpage.objects.create(
            pagenumber='no-notebook', discipline=self.discipline,
            pageset=orphan_pageset,
        )
        self.grant(None, '%', '%')
        self.assert_visible_records(include_other=True)

    def test_child_read_grants_are_not_replaced_by_notebook_grants(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/fieldnotebook', 'read')
        for table, allowed, restricted in self.records:
            with self.subTest(table=table):
                expected = [allowed]
                if table == 'fieldnotebook':
                    expected.append(restricted)
                self.assertCountEqual(
                    permissions.filter_scoped_read_queryset(
                        type(allowed).objects.all(), self.agent,
                    ),
                    expected,
                )

    def test_distinct_projection_excludes_restricted_values(self):
        for table, field in (
            ('fieldnotebook', 'name'), ('fieldnotebookpageset', 'description'),
            ('fieldnotebookpage', 'pagenumber'),
        ):
            with self.subTest(table=table):
                response = self.client.get(
                    f'/table_rows/specify_rows/{table}/',
                    {'fields': field, 'distinct': 'true'},
                )
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.json(), [['allowed']])

    def test_legacy_dispatch_rows_uses_same_scope_filter(self):
        from specifyweb.specify.api.dispatch import rows

        for table, _, restricted in self.records:
            with self.subTest(table=table):
                request = RequestFactory().get(
                    f'/table_rows/specify_rows/{table}/',
                    {'fields': 'id', 'id': restricted.id},
                )
                request.specify_collection = self.collection
                request.specify_user_agent = self.agent
                response = rows(request, table)
                self.assertEqual(response.status_code, 200)
                self.assertEqual(json.loads(response.content), [])

class ConservationEventReadApiTests(ScopedPermissionTestBase):
    def setUp(self):
        super().setUp()
        self.grant_access(self.collection)
        self.grant(self.collection, '/table/%', 'read')
        self.client.force_login(self.specifyuser)
        self.client.cookies['collection'] = str(self.collection.id)
        self.other_division = spmodels.Division.objects.create(
            institution=self.institution, name='Other Division',
        )
        self.other_discipline = spmodels.Discipline.objects.create(
            division=self.other_division, datatype=self.datatype,
            geographytreedef=self.geographytreedef,
            geologictimeperiodtreedef=self.geologictimeperiodtreedef,
        )
        self.other_collection.discipline = self.other_discipline
        self.other_collection.save()
        self.allowed_description = spmodels.Conservdescription.objects.create(
            division=self.division,
        )
        self.restricted_description = spmodels.Conservdescription.objects.create(
            division=self.other_division,
        )
        self.allowed_event = spmodels.Conservevent.objects.create(
            conservdescription=self.allowed_description, text1='allowed',
        )
        self.restricted_event = spmodels.Conservevent.objects.create(
            conservdescription=self.restricted_description, text1='restricted',
        )

    def assert_visible_events(self, expected, **params):
        for prefix in ('/api/specify', '/table_rows/specify_rows'):
            with self.subTest(prefix=prefix):
                query = {'limit': 0, 'orderby': '-id', **params}
                if prefix == '/table_rows/specify_rows':
                    query['fields'] = 'id'
                response = self.client.get(f'{prefix}/conservevent/', query)
                self.assertEqual(response.status_code, 200)
                payload = response.json()
                if isinstance(payload, dict):
                    self.assertEqual(payload['meta']['total_count'], len(expected))
                    ids = [obj['id'] for obj in payload['objects']]
                else:
                    ids = [row[0] for row in payload]
                self.assertCountEqual(ids, [obj.id for obj in expected])

    def test_excludes_other_description_division(self):
        self.assert_visible_events([self.allowed_event])

    def test_restricted_id_returns_empty_results(self):
        self.assert_visible_events([], id=self.restricted_event.id)

    def test_read_grant_requires_collection_access(self):
        self.grant(self.other_collection, '/table/%', 'read')
        self.assert_visible_events([self.allowed_event])

    def test_collection_access_requires_table_read_grant(self):
        self.grant_access(self.other_collection)
        self.assert_visible_events([self.allowed_event])

    def test_both_grants_allow_other_division(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/%', 'read')
        self.assert_visible_events([self.allowed_event, self.restricted_event])

    def test_global_grant_allows_other_division(self):
        self.grant(None, '%', '%')
        self.assert_visible_events([self.allowed_event, self.restricted_event])

    def test_shared_division_remains_visible(self):
        self.restricted_description.division = self.division
        self.restricted_description.save()
        self.assert_visible_events([self.allowed_event, self.restricted_event])

    def test_missing_division_preserves_institution_fallback(self):
        self.restricted_description.division = None
        self.restricted_description.save()
        self.assert_visible_events([self.allowed_event, self.restricted_event])

    def test_fallback_requires_access_and_read_in_same_collection(self):
        self.restricted_description.division = None
        self.restricted_description.save()
        initialize.wipe_permissions()
        self.grant_access(self.collection)
        self.grant(self.other_collection, '/table/conservevent', 'read')
        self.assertFalse(permissions.filter_scoped_read_queryset(
            spmodels.Conservevent.objects.all(), self.agent,
        ).exists())

    def test_ambiguous_institution_fallback_propagates_resolver_error(self):
        self.restricted_description.division = None
        self.restricted_description.save()
        spmodels.Institution.objects.create(
            name='Other Institution', isaccessionsglobal=True,
            issecurityon=False, isserverbased=False,
            issharinglocalities=True, issinglegeographytree=True,
        )
        with self.assertRaises(spmodels.Institution.MultipleObjectsReturned):
            permissions.filter_scoped_read_queryset(
                spmodels.Conservevent.objects.all(), self.agent,
            )

    def test_description_read_does_not_replace_event_read(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/conservdescription', 'read')
        self.assert_visible_events([self.allowed_event])

    def test_filters_before_pagination(self):
        self.assert_visible_events([self.allowed_event], limit=1)

    def test_distinct_projection_excludes_restricted_values(self):
        response = self.client.get(
            '/table_rows/specify_rows/conservevent/',
            {'fields': 'text1', 'distinct': 'true'},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [['allowed']])

    def test_legacy_dispatch_rows_uses_same_scope_filter(self):
        from specifyweb.specify.api.dispatch import rows

        request = RequestFactory().get(
            '/table_rows/specify_rows/conservevent/',
            {'fields': 'id', 'id': self.restricted_event.id},
        )
        request.specify_collection = self.collection
        request.specify_user_agent = self.agent
        response = rows(request, 'conservevent')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content), [])

class InstitutionFallbackReadTests(ScopedPermissionTestBase):
    def filtered_datatypes(self):
        return permissions.filter_scoped_read_queryset(
            spmodels.Datatype.objects.all(), self.agent,
        )

    def test_denies_without_policies(self):
        self.assertFalse(self.filtered_datatypes().exists())

    def test_read_grant_requires_collection_access(self):
        self.grant(self.collection, '/table/datatype', 'read')
        self.assertFalse(self.filtered_datatypes().exists())

    def test_collection_access_requires_table_read(self):
        self.grant_access(self.collection)
        self.assertFalse(self.filtered_datatypes().exists())

    def test_grants_in_different_collections_cannot_be_combined(self):
        self.grant_access(self.collection)
        self.grant(self.other_collection, '/table/datatype', 'read')
        self.assertFalse(self.filtered_datatypes().exists())

    def test_qualifying_sibling_collection_allows_shared_records(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/datatype', 'read')
        self.assertCountEqual(self.filtered_datatypes(), [self.datatype])

    def test_global_grant_allows_shared_records(self):
        self.grant(None, '%', '%')
        self.assertCountEqual(self.filtered_datatypes(), [self.datatype])

    def test_ambiguous_institution_propagates_resolver_error(self):
        spmodels.Institution.objects.create(
            name='Other Institution', isaccessionsglobal=True,
            issecurityon=False, isserverbased=False,
            issharinglocalities=True, issinglegeographytree=True,
        )
        self.grant(None, '%', '%')
        with self.assertRaises(spmodels.Institution.MultipleObjectsReturned):
            self.filtered_datatypes()

    def test_list_and_row_endpoints_preserve_shared_records_and_pagination(self):
        self.grant_access(self.collection)
        self.grant(self.collection, '/table/datatype', 'read')
        other = spmodels.Datatype.objects.create(name='Other datatype')
        self.client.force_login(self.specifyuser)
        self.client.cookies['collection'] = str(self.collection.id)
        for prefix in ('/api/specify', '/table_rows/specify_rows'):
            with self.subTest(prefix=prefix):
                params = {'limit': 1, 'orderby': '-id'}
                if prefix == '/table_rows/specify_rows':
                    params['fields'] = 'id'
                response = self.client.get(
                    f'{prefix}/datatype/', params,
                )
                self.assertEqual(response.status_code, 200)
                payload = response.json()
                if isinstance(payload, dict):
                    self.assertEqual(payload['meta']['total_count'], 2)
                    self.assertEqual([obj['id'] for obj in payload['objects']], [other.id])
                else:
                    self.assertEqual(payload, [[other.id]])

    def test_legacy_rows_deny_without_collection_access(self):
        from specifyweb.specify.api.dispatch import rows

        self.grant(self.collection, '/table/datatype', 'read')
        request = RequestFactory().get(
            '/table_rows/specify_rows/datatype/', {'fields': 'id'},
        )
        request.specify_collection = self.collection
        request.specify_user_agent = self.agent
        response = rows(request, 'datatype')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content), [])

class MixedDisciplineCollectionReadApiTests(ScopedPermissionTestBase):
    def setUp(self):
        super().setUp()
        self.grant_access(self.collection)
        self.grant(self.collection, '/table/%', 'read')
        self.client.force_login(self.specifyuser)
        self.client.cookies['collection'] = str(self.collection.id)
        self.other_discipline = spmodels.Discipline.objects.create(
            division=self.division, datatype=self.datatype,
            geographytreedef=self.geographytreedef,
            geologictimeperiodtreedef=self.geologictimeperiodtreedef,
        )
        self.other_collection.discipline = self.other_discipline
        self.other_collection.save()
        self.records = []
        for model in (spmodels.Spappresourcedir, spmodels.Sptasksemaphore):
            allowed = model.objects.create(
                discipline=self.discipline, collection=self.other_collection,
            )
            restricted = model.objects.create(
                discipline=self.other_discipline, collection=self.collection,
            )
            collection_allowed = model.objects.create(collection=self.collection)
            collection_restricted = model.objects.create(collection=self.other_collection)
            unscoped = model.objects.create()
            self.records.append((
                model, [allowed, collection_allowed, unscoped],
                [restricted, collection_restricted],
            ))

    def assert_visible_records(self, include_other=False, **params):
        for model, allowed, restricted in self.records:
            for prefix in ('/api/specify', '/table_rows/specify_rows'):
                with self.subTest(model=model.__name__, prefix=prefix):
                    query = {'limit': 0, 'orderby': '-id', **params}
                    if prefix == '/table_rows/specify_rows':
                        query['fields'] = 'id'
                    response = self.client.get(
                        f'{prefix}/{model._meta.model_name}/', query,
                    )
                    self.assertEqual(response.status_code, 200)
                    expected = allowed + restricted if include_other else allowed
                    payload = response.json()
                    if isinstance(payload, dict):
                        self.assertEqual(payload['meta']['total_count'], len(expected))
                        ids = [obj['id'] for obj in payload['objects']]
                    else:
                        ids = [row[0] for row in payload]
                    self.assertCountEqual(ids, [obj.id for obj in expected])

    def test_scope_precedence_and_fallbacks(self):
        self.assert_visible_records()

    def test_read_grant_requires_collection_access(self):
        self.grant(self.other_collection, '/table/%', 'read')
        self.assert_visible_records()

    def test_collection_access_requires_table_read(self):
        self.grant_access(self.other_collection)
        self.assert_visible_records()

    def test_both_grants_allow_other_scope(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/%', 'read')
        self.assert_visible_records(include_other=True)

    def test_global_grant_allows_other_scope(self):
        self.grant(None, '%', '%')
        self.assert_visible_records(include_other=True)

    def test_ambiguous_institution_fallback_propagates_resolver_error(self):
        spmodels.Institution.objects.create(
            name='Other Institution', isaccessionsglobal=True,
            issecurityon=False, isserverbased=False,
            issharinglocalities=True, issinglegeographytree=True,
        )
        for model, _, _ in self.records:
            with self.subTest(model=model.__name__):
                with self.assertRaises(spmodels.Institution.MultipleObjectsReturned):
                    permissions.filter_scoped_read_queryset(
                        model.objects.all(), self.agent,
                    )

    def test_fallback_does_not_combine_grants_between_collections(self):
        initialize.wipe_permissions()
        self.grant_access(self.collection)
        self.grant(self.other_collection, '/table/%', 'read')
        for model, _, _ in self.records:
            with self.subTest(model=model.__name__):
                self.assertFalse(permissions.filter_scoped_read_queryset(
                    model.objects.all(), self.agent,
                ).exists())

    def test_filters_before_pagination(self):
        for model, allowed, _ in self.records:
            for prefix in ('/api/specify', '/table_rows/specify_rows'):
                with self.subTest(model=model.__name__, prefix=prefix):
                    query = {'limit': 1, 'offset': 1, 'orderby': '-id'}
                    if prefix == '/table_rows/specify_rows':
                        query['fields'] = 'id'
                    response = self.client.get(
                        f'{prefix}/{model._meta.model_name}/', query,
                    )
                    self.assertEqual(response.status_code, 200)
                    payload = response.json()
                    expected = sorted([obj.id for obj in allowed], reverse=True)[1]
                    if isinstance(payload, dict):
                        self.assertEqual(payload['meta']['total_count'], 3)
                        self.assertEqual([obj['id'] for obj in payload['objects']], [expected])
                    else:
                        self.assertEqual(payload, [[expected]])

    def test_restricted_ids_return_empty_results_in_both_row_implementations(self):
        from specifyweb.specify.api.dispatch import rows

        for model, _, restricted in self.records:
            for record in restricted:
                with self.subTest(model=model.__name__, record=record.id):
                    path = f'/table_rows/specify_rows/{model._meta.model_name}/'
                    params = {'fields': 'id', 'id': record.id}
                    response = self.client.get(path, params)
                    self.assertEqual(response.status_code, 200)
                    self.assertEqual(response.json(), [])
                    request = RequestFactory().get(path, params)
                    request.specify_collection = self.collection
                    request.specify_user_agent = self.agent
                    response = rows(request, model._meta.model_name)
                    self.assertEqual(response.status_code, 200)
                    self.assertEqual(json.loads(response.content), [])

class ScopedReadModelCoverageTests(ScopedPermissionTestBase):
    def api_models(self):
        return [
            model for model in apps.get_app_config('specify').get_models()
            if hasattr(model, 'specify_model')
        ]

    def test_all_api_models_deny_reads_without_grants(self):
        for global_accessions in (False, True):
            self.institution.isaccessionsglobal = global_accessions
            self.institution.save()
            for model in self.api_models():
                with self.subTest(
                    model=model.__name__, global_accessions=global_accessions,
                ):
                    queryset = model.objects.all()
                    filtered = permissions.filter_scoped_read_queryset(
                        queryset, self.agent,
                    )
                    self.assertIsNot(filtered, queryset)
                    self.assertIs(filtered.model, model)
                    self.assertFalse(filtered.exists())

    def test_all_api_model_filters_execute_with_global_grants(self):
        self.grant(None, '%', '%')
        for global_accessions in (False, True):
            self.institution.isaccessionsglobal = global_accessions
            self.institution.save()
            for model in self.api_models():
                with self.subTest(
                    model=model.__name__, global_accessions=global_accessions,
                ):
                    filtered = permissions.filter_scoped_read_queryset(
                        model.objects.all(), self.agent,
                    )
                    self.assertIs(filtered.model, model)
                    list(filtered.values_list('pk', flat=True)[:1])

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

class ReverseRelationshipMutationApiTests(ScopedPermissionTestBase):
    def setUp(self):
        super().setUp()
        self.grant_access(self.collection)
        self.grant(self.collection, '/table/%', '%')
        self.grant(self.collection, '/field/%', 'update')
        self.client.force_login(self.specifyuser)
        self.client.cookies['collection'] = str(self.collection.id)
        self._create_prep_type()
        self.parent, self.second_parent = self.collectionobjects[:2]
        self.restricted_parent = spmodels.Collectionobject.objects.create(
            collection=self.other_collection, catalognumber='restricted-parent',
        )
        self.destination, self.original, self.restricted_original = [
            spmodels.Preparationattribute.objects.create(collectionmemberid=collection.id)
            for collection in (self.collection, self.collection, self.other_collection)
        ]
        self.child = self._create_prep(
            self.parent, None, preparationattribute=self.original, remarks='original',
        )
        self.restricted_child = self._create_prep(
            self.restricted_parent, None,
            collectionmemberid=self.other_collection.id, remarks='restricted',
        )

    def snapshot(self):
        return {
            model.__name__: list(model.objects.order_by('pk').values())
            for model in (
                spmodels.Collectionobject, spmodels.Preparation,
                spmodels.Preparationattribute, spmodels.Preparationproperty,
                spmodels.Spauditlog, spmodels.Spauditlogfield,
            )
        }

    def put(self, parent, **changes):
        return self.client.put(
            f'/api/specify/{parent._meta.model_name}/{parent.id}/',
            data={'version': parent.version, **changes},
            content_type='application/json',
        )

    def uri(self, obj):
        return f'/api/specify/{obj._meta.model_name}/{obj.id}/'

    def child_data(self, child=None, **changes):
        child = self.child if child is None else child
        return {'id': child.id, 'version': child.version, **changes}

    def assert_denied_unchanged(self, parent, **changes):
        before = self.snapshot()
        response = self.put(parent, **changes)
        self.assertEqual(response.status_code, 403)
        self.assertEqual(self.snapshot(), before)

    def allow_other(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/%', '%')
        self.grant(self.other_collection, '/field/%', 'update')

    def test_independent_uri_link_checks_child_scope(self):
        self.assert_denied_unchanged(
            self.destination, preparations={'update': [self.uri(self.restricted_child)]},
        )

    def test_independent_nested_link_checks_child_scope(self):
        self.assert_denied_unchanged(
            self.destination,
            preparations={'update': [self.child_data(self.restricted_child, remarks='denied')]},
        )

    def test_independent_uri_unlink_checks_child_scope(self):
        self.restricted_child.preparationattribute = self.destination
        self.restricted_child.save()
        self.assert_denied_unchanged(
            self.destination, preparations={'remove': [self.uri(self.restricted_child)]},
        )

    def test_independent_noop_link_does_not_skip_authorization(self):
        self.restricted_child.preparationattribute = self.destination
        self.restricted_child.save()
        self.assert_denied_unchanged(
            self.destination, preparations={'update': [self.uri(self.restricted_child)]},
        )

    def test_independent_uri_requires_read_as_well_as_update(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/preparation', 'update')
        self.grant(self.other_collection, '/field/%', 'update')
        self.assert_denied_unchanged(
            self.destination, preparations={'update': [self.uri(self.restricted_child)]},
        )

    def test_independent_read_does_not_replace_child_update(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/preparation', 'read')
        self.assert_denied_unchanged(
            self.destination, preparations={'update': [self.uri(self.restricted_child)]},
        )

    def test_independent_uri_link_and_unlink_preserve_other_child_fields(self):
        response = self.put(
            self.destination, preparations={'update': [self.uri(self.child)]},
        )
        self.assertEqual(response.status_code, 200)
        self.child.refresh_from_db()
        self.assertEqual(self.child.preparationattribute_id, self.destination.id)
        self.assertEqual(self.child.remarks, 'original')
        self.destination.refresh_from_db()
        response = self.put(
            self.destination, preparations={'remove': [self.uri(self.child)]},
        )
        self.assertEqual(response.status_code, 200)
        self.child.refresh_from_db()
        self.assertIsNone(self.child.preparationattribute_id)
        self.assertEqual(self.child.remarks, 'original')
        self.assertTrue(spmodels.Preparationattribute.objects.filter(pk=self.destination.id).exists())
        self.assertTrue(spmodels.Preparationattribute.objects.filter(pk=self.original.id).exists())

    def test_independent_uri_link_does_not_rewrite_or_delete_nested_children(self):
        prop = spmodels.Preparationproperty.objects.create(
            preparation=self.child, collectionmemberid=self.other_collection.id, integer1=1,
        )
        response = self.put(
            self.destination, preparations={'update': [self.uri(self.child)]},
        )
        self.assertEqual(response.status_code, 200)
        self.child.refresh_from_db()
        prop.refresh_from_db()
        self.assertEqual(self.child.preparationattribute_id, self.destination.id)
        self.assertEqual(prop.integer1, 1)
        self.assertEqual(prop.version, 0)

    def test_independent_uri_unlink_does_not_rewrite_nested_children(self):
        self.child.preparationattribute = self.destination
        self.child.save()
        prop = spmodels.Preparationproperty.objects.create(
            preparation=self.child, collectionmemberid=self.other_collection.id,
        )
        response = self.put(
            self.destination, preparations={'remove': [self.uri(self.child)]},
        )
        self.assertEqual(response.status_code, 200)
        self.child.refresh_from_db()
        prop.refresh_from_db()
        self.assertIsNone(self.child.preparationattribute_id)
        self.assertEqual(prop.version, 0)

    def test_independent_reparent_checks_original_parent_scope(self):
        self.child.preparationattribute = self.restricted_original
        self.child.save()
        for value in (self.uri(self.child), self.child_data()):
            with self.subTest(value=value):
                self.assert_denied_unchanged(
                    self.destination, preparations={'update': [value]},
                )

    def test_independent_reparent_with_all_grants_succeeds(self):
        self.child.preparationattribute = self.restricted_original
        self.child.save()
        self.allow_other()
        response = self.put(
            self.destination, preparations={'update': [self.uri(self.child)]},
        )
        self.assertEqual(response.status_code, 200)
        self.child.refresh_from_db()
        self.assertEqual(self.child.preparationattribute_id, self.destination.id)

    def test_independent_unlink_rejects_child_of_another_parent(self):
        before = self.snapshot()
        response = self.put(
            self.destination, preparations={'remove': [self.uri(self.child)]},
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(self.snapshot(), before)

    def test_independent_mixed_batch_is_atomic(self):
        self.assert_denied_unchanged(
            self.destination, text1='rollback',
            preparations={'update': [
                self.child_data(remarks='rollback'), self.uri(self.restricted_child),
            ]},
        )

    def test_independent_create_parent_rolls_back_on_denied_child(self):
        before = self.snapshot()
        response = self.client.post(
            '/api/specify/preparationattribute/',
            data={'preparations': {'update': [self.uri(self.restricted_child)]}},
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(self.snapshot(), before)

    def test_independent_nested_create_and_update(self):
        response = self.put(
            self.destination, preparations={'update': [
                self.child_data(remarks='updated'),
                {'collectionobject': self.uri(self.second_parent),
                 'preptype': self.uri(self.prep_type), 'remarks': 'new'},
            ]},
        )
        self.assertEqual(response.status_code, 200)
        self.child.refresh_from_db()
        self.assertEqual(self.child.remarks, 'updated')
        self.assertEqual(self.child.preparationattribute_id, self.destination.id)
        self.assertTrue(self.destination.preparations.filter(remarks='new').exists())

    def test_independent_supplied_back_reference_cannot_override_destination(self):
        response = self.put(self.destination, preparations={'update': [
            self.child_data(
                preparationattribute=self.uri(self.original),
                PreparationAttribute=self.uri(self.restricted_original),
            ),
        ]})
        self.assertEqual(response.status_code, 200)
        self.child.refresh_from_db()
        self.assertEqual(self.child.preparationattribute_id, self.destination.id)

    def test_independent_nested_scope_change_requires_destination_permission(self):
        self.assert_denied_unchanged(self.destination, preparations={'update': [
            self.child_data(collectionmemberid=self.other_collection.id),
        ]})

    def test_independent_link_succeeds_with_target_collection_grants(self):
        self.allow_other()
        response = self.put(self.destination, preparations={
            'update': [self.uri(self.restricted_child)],
        })
        self.assertEqual(response.status_code, 200)
        self.restricted_child.refresh_from_db()
        self.assertEqual(self.restricted_child.preparationattribute_id, self.destination.id)
        self.assertEqual(self.restricted_child.collectionmemberid, self.other_collection.id)

    def test_independent_create_child_requires_create_permission(self):
        models.UserPolicy.objects.filter(resource='/table/%').delete()
        for action in ('read', 'update'):
            self.grant(self.collection, '/table/%', action)
        self.assert_denied_unchanged(self.destination, preparations={'update': [{
            'preptype': self.uri(self.prep_type),
            'collectionobject': self.uri(self.parent), 'remarks': 'denied',
        }]})

    def test_independent_missing_uri_rolls_back(self):
        before = self.snapshot()
        response = self.put(
            self.destination, text1='rollback',
            preparations={'update': ['/api/specify/preparation/2147483647/']},
        )
        self.assertEqual(response.status_code, 404)
        self.assertEqual(self.snapshot(), before)

    def test_independent_child_field_permission_is_required(self):
        models.UserPolicy.objects.filter(resource='/field/%').delete()
        self.grant(self.collection, '/field/preparationattribute/preparations', 'update')
        self.assert_denied_unchanged(
            self.destination, preparations={'update': [self.uri(self.child)]},
        )

    def test_independent_original_parent_field_permission_is_required(self):
        models.UserPolicy.objects.filter(resource='/field/%').delete()
        self.grant(self.collection, '/field/preparation/%', 'update')
        self.grant(self.collection, '/field/preparationattribute/preparations', 'update')
        # Give the old parent a distinct scope so only the destination grant applies.
        self.child.preparationattribute = self.restricted_original
        self.child.save()
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/%', '%')
        self.assert_denied_unchanged(
            self.destination, preparations={'update': [self.uri(self.child)]},
        )

    def test_independent_update_then_remove_uses_current_version(self):
        response = self.put(self.destination, preparations={
            'update': [self.child_data(remarks='updated')],
            'remove': [self.uri(self.child)],
        })
        self.assertEqual(response.status_code, 200)
        self.child.refresh_from_db()
        self.assertEqual(self.child.remarks, 'updated')
        self.assertIsNone(self.child.preparationattribute_id)
        self.assertTrue(spmodels.Preparationattribute.objects.filter(pk=self.destination.id).exists())

    def test_independent_stale_nested_update_is_atomic(self):
        before = self.snapshot()
        response = self.put(self.destination, text1='rollback', preparations={
            'update': [self.child_data(version=self.child.version + 1)],
        })
        self.assertEqual(response.status_code, 409)
        self.assertEqual(self.snapshot(), before)

    def test_independent_missing_nested_version_is_rejected(self):
        before = self.snapshot()
        response = self.put(self.destination, preparations={'update': [{'id': self.child.id}]})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(self.snapshot(), before)

    def test_independent_parent_update_permission_is_required(self):
        initialize.wipe_permissions()
        self.grant_access(self.collection)
        for action in ('read', 'update'):
            self.grant(self.collection, '/table/preparation', action)
        self.grant(self.collection, '/table/preparationattribute', 'read')
        self.grant(self.collection, '/field/%', 'update')
        self.assert_denied_unchanged(
            self.destination, preparations={'update': [self.uri(self.child)]},
        )

    def test_independent_remove_batch_rolls_back_earlier_unlink(self):
        self.child.preparationattribute = self.destination
        self.child.save()
        self.restricted_child.preparationattribute = self.destination
        self.restricted_child.save()
        self.assert_denied_unchanged(
            self.destination, preparations={'remove': [
                self.uri(self.child), self.uri(self.restricted_child),
            ]},
        )

    def test_independent_parent_relationship_field_permission_is_required(self):
        models.UserPolicy.objects.filter(resource='/field/%').delete()
        self.grant(self.collection, '/field/preparation/%', 'update')
        self.assert_denied_unchanged(
            self.destination, preparations={'update': [self.uri(self.child)]},
        )

    def test_dependent_nested_update_checks_child_scope(self):
        self.restricted_child.collectionobject = self.parent
        self.restricted_child.save()
        self.assert_denied_unchanged(
            self.parent, preparations=[
                self.child_data(), self.child_data(self.restricted_child, remarks='denied'),
            ],
        )

    def test_dependent_nested_scope_change_requires_destination_permission(self):
        self.assert_denied_unchanged(self.parent, preparations=[
            self.child_data(collectionmemberid=self.other_collection.id),
        ])

    def test_dependent_create_parent_with_nested_children(self):
        response = self.client.post(
            '/api/specify/collectionobject/',
            data={
                'collection': self.uri(self.collection), 'catalognumber': 'nested-create',
                'preparations': [{
                    'preptype': self.uri(self.prep_type),
                    'preparationproperties': [{'integer1': 1}],
                }],
            }, content_type='application/json',
        )
        self.assertEqual(response.status_code, 201)
        obj = spmodels.Collectionobject.objects.get(pk=response.json()['id'])
        self.assertEqual(obj.preparations.get().collectionmemberid, self.collection.id)
        self.assertEqual(obj.preparations.get().preparationproperties.get().integer1, 1)

    def test_dependent_omission_requires_delete_in_child_scope(self):
        self.restricted_child.collectionobject = self.parent
        self.restricted_child.save()
        self.assert_denied_unchanged(
            self.parent, text1='rollback', preparations=[self.child_data()],
        )

    def test_dependent_omission_requires_delete_not_update(self):
        initialize.wipe_permissions()
        self.grant_access(self.collection)
        for action in ('read', 'update'):
            self.grant(self.collection, '/table/%', action)
        self.grant(self.collection, '/field/%', 'update')
        self.assert_denied_unchanged(self.parent, preparations=[])

    def test_dependent_omission_checks_cascaded_grandchild_scope(self):
        spmodels.Preparationproperty.objects.create(
            preparation=self.child, collectionmemberid=self.other_collection.id,
        )
        self.assert_denied_unchanged(self.parent, preparations=[])

    def test_dependent_omission_checks_grandchild_table_delete(self):
        spmodels.Preparationproperty.objects.create(
            preparation=self.child, collectionmemberid=self.collection.id,
        )
        initialize.wipe_permissions()
        self.grant_access(self.collection)
        for action in ('read', 'update'):
            self.grant(self.collection, '/table/%', action)
        self.grant(self.collection, '/table/preparation', 'delete')
        self.grant(self.collection, '/field/%', 'update')
        self.assert_denied_unchanged(self.parent, preparations=[])

    def test_dependent_omission_deletes_forward_dependent_with_permissions(self):
        attribute = spmodels.Preparationattribute.objects.create(
            collectionmemberid=self.collection.id,
        )
        self.child.preparationattribute = attribute
        self.child.save()
        response = self.put(self.parent, preparations=[])
        self.assertEqual(response.status_code, 200)
        self.assertFalse(spmodels.Preparation.objects.filter(pk=self.child.id).exists())
        self.assertFalse(spmodels.Preparationattribute.objects.filter(pk=attribute.id).exists())

    def test_dependent_omission_checks_forward_dependent_scope(self):
        self.child.preparationattribute = self.restricted_original
        self.child.save()
        self.assert_denied_unchanged(self.parent, preparations=[])

    def test_dependent_omission_audits_cascaded_grandchildren(self):
        prop = spmodels.Preparationproperty.objects.create(
            preparation=self.child, collectionmemberid=self.collection.id,
        )
        response = self.put(self.parent, preparations=[])
        self.assertEqual(response.status_code, 200)
        self.assertFalse(spmodels.Preparationproperty.objects.filter(pk=prop.id).exists())
        self.assertTrue(spmodels.Spauditlog.objects.filter(
            recordid=prop.id, tablenum=prop.specify_model.tableId, action=2,
        ).exists())

    def test_dependent_omission_mixed_siblings_is_atomic(self):
        allowed = self._create_prep(self.second_parent, None)
        self.restricted_child.collectionobject = self.second_parent
        self.restricted_child.save()
        self.assert_denied_unchanged(self.second_parent, preparations=[])
        self.assertTrue(spmodels.Preparation.objects.filter(pk=allowed.id).exists())

    def test_dependent_nested_grandchild_denial_rolls_back_all_changes(self):
        prop = spmodels.Preparationproperty.objects.create(
            preparation=self.child, collectionmemberid=self.other_collection.id,
        )
        self.assert_denied_unchanged(self.parent, text1='rollback', preparations=[
            self.child_data(remarks='rollback', preparationproperties=[
                {'id': prop.id, 'version': prop.version, 'integer1': 2},
            ]),
        ])

    def test_dependent_old_parent_field_permission_is_required(self):
        self.child.collectionobject = self.restricted_parent
        self.child.save()
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/%', '%')
        self.assert_denied_unchanged(self.second_parent, preparations=[self.child_data()])

    def test_dependent_reparent_with_all_grants_preserves_child_scope(self):
        self.child.collectionobject = self.restricted_parent
        self.child.save()
        self.allow_other()
        response = self.put(self.second_parent, preparations=[self.child_data()])
        self.assertEqual(response.status_code, 200)
        self.child.refresh_from_db()
        self.assertEqual(self.child.collectionobject_id, self.second_parent.id)
        self.assertEqual(self.child.collectionmemberid, self.collection.id)

    def test_dependent_nested_create_and_update(self):
        response = self.put(self.parent, preparations=[
            self.child_data(remarks='updated'),
            {'preptype': self.uri(self.prep_type), 'remarks': 'new',
             'preparationproperties': [{'integer1': 1}]},
        ])
        self.assertEqual(response.status_code, 200)
        self.child.refresh_from_db()
        self.assertEqual(self.child.remarks, 'updated')
        created = self.parent.preparations.get(remarks='new')
        self.assertEqual(created.preparationproperties.get().integer1, 1)

    def test_dependent_case_insensitive_child_data_is_updated_not_recreated(self):
        response = self.put(self.parent, preparations=[{
            'ID': self.child.id, 'Version': self.child.version, 'Remarks': 'updated',
        }])
        self.assertEqual(response.status_code, 200)
        self.child.refresh_from_db()
        self.assertEqual(self.child.remarks, 'updated')
        self.assertEqual(self.parent.preparations.count(), 1)

    def test_dependent_supplied_back_reference_cannot_override_destination(self):
        response = self.put(self.second_parent, preparations=[
            self.child_data(
                collectionobject=self.uri(self.parent),
                CollectionObject=self.uri(self.restricted_parent),
            ),
        ])
        self.assertEqual(response.status_code, 200)
        self.child.refresh_from_db()
        self.assertEqual(self.child.collectionobject_id, self.second_parent.id)

    def test_invalid_reverse_mutation_payloads_return_400_and_rollback(self):
        cases = (
            (self.parent, {'preparations': {'update': []}}),
            (self.parent, {'preparations': [self.uri(self.child)]}),
            (self.destination, {'preparations': []}),
            (self.destination, {'preparations': {'update': 'not a list'}}),
            (self.destination, {'preparations': {'remove': [{}]}}),
            (self.destination, {'preparations': {'update': [False]}}),
            (self.destination, {'preparations': {'unknown': []}}),
            (self.destination, {'preparations': {'update': ['/api/specify/taxon/1/']}}),
        )
        for parent, changes in cases:
            with self.subTest(changes=changes):
                before = self.snapshot()
                response = self.put(parent, **changes)
                self.assertEqual(response.status_code, 400)
                self.assertEqual(self.snapshot(), before)

    def test_dependent_reparent_checks_original_parent_scope(self):
        self.child.collectionobject = self.restricted_parent
        self.child.save()
        self.assert_denied_unchanged(self.second_parent, preparations=[self.child_data()])

    def test_dependent_reparent_succeeds_with_required_permissions(self):
        response = self.put(self.second_parent, preparations=[self.child_data(remarks='moved')])
        self.assertEqual(response.status_code, 200)
        self.child.refresh_from_db()
        self.assertEqual(self.child.collectionobject_id, self.second_parent.id)
        self.assertEqual(self.child.remarks, 'moved')

    def test_dependent_parent_relationship_field_permission_is_required(self):
        models.UserPolicy.objects.filter(resource='/field/%').delete()
        self.grant(self.collection, '/field/preparation/%', 'update')
        self.assert_denied_unchanged(self.parent, preparations=[self.child_data(remarks='denied')])

    def test_dependent_create_under_other_collection_uses_parent_scope(self):
        self.allow_other()
        response = self.put(self.restricted_parent, preparations=[
            self.child_data(self.restricted_child),
            {'preptype': self.uri(self.prep_type), 'remarks': 'new scoped child'},
        ])
        self.assertEqual(response.status_code, 200)
        created = self.restricted_parent.preparations.get(remarks='new scoped child')
        self.assertEqual(created.collectionmemberid, self.other_collection.id)

    def test_dependent_create_requires_create_in_destination_scope(self):
        self.grant_access(self.other_collection)
        for action in ('read', 'update'):
            self.grant(self.other_collection, '/table/%', action)
        self.grant(self.other_collection, '/field/%', 'update')
        self.assert_denied_unchanged(
            self.restricted_parent, preparations=[
                self.child_data(self.restricted_child),
                {'preptype': self.uri(self.prep_type), 'remarks': 'denied'},
            ],
        )

    def test_dependent_nested_update_stale_version_rolls_back(self):
        before = self.snapshot()
        response = self.put(self.parent, text1='rollback', preparations=[
            self.child_data(version=self.child.version + 1, remarks='denied'),
        ])
        self.assertEqual(response.status_code, 409)
        self.assertEqual(self.snapshot(), before)

    def test_dependent_missing_child_rolls_back(self):
        before = self.snapshot()
        response = self.put(self.parent, text1='rollback', preparations=[
            {'id': 2147483647, 'version': 0},
        ])
        self.assertEqual(response.status_code, 404)
        self.assertEqual(self.snapshot(), before)

class ReverseInheritedScopeMutationApiTests(ScopedPermissionTestBase):
    def setUp(self):
        super().setUp()
        self.grant_access(self.collection)
        self.grant(self.collection, '/table/%', '%')
        self.grant(self.collection, '/field/%', 'update')
        self.client.force_login(self.specifyuser)
        self.client.cookies['collection'] = str(self.collection.id)
        self.other_discipline = spmodels.Discipline.objects.create(
            division=self.division, datatype=self.datatype,
            geographytreedef=self.geographytreedef,
            geologictimeperiodtreedef=self.geologictimeperiodtreedef,
        )
        self.other_collection.discipline = self.other_discipline
        self.other_collection.save()
        self.notebook = spmodels.Fieldnotebook.objects.create(
            collection=self.collection, discipline=self.discipline, owneragent=self.agent,
        )
        self.other_notebook = spmodels.Fieldnotebook.objects.create(
            collection=self.other_collection, discipline=self.other_discipline,
            owneragent=self.agent,
        )
        self.pageset = spmodels.Fieldnotebookpageset.objects.create(
            fieldnotebook=self.notebook, discipline=self.discipline,
        )
        self.page = spmodels.Fieldnotebookpage.objects.create(
            pageset=self.pageset, discipline=self.discipline, pagenumber='1',
        )
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/%', 'read')
        self.grant(self.other_collection, '/field/%', 'update')
        for table in ('fieldnotebook', 'fieldnotebookpageset'):
            self.grant(self.other_collection, f'/table/{table}', 'update')

    def snapshot(self):
        return {
            model.__name__: list(model.objects.order_by('pk').values())
            for model in (
                spmodels.Fieldnotebook, spmodels.Fieldnotebookpageset,
                spmodels.Fieldnotebookpage, spmodels.Spauditlog, spmodels.Spauditlogfield,
            )
        }

    def move(self):
        return self.client.put(
            f'/api/specify/fieldnotebook/{self.other_notebook.id}/',
            data={
                'version': self.other_notebook.version, 'description': 'changed',
                'pagesets': [{
                    'id': self.pageset.id, 'version': self.pageset.version,
                }],
            }, content_type='application/json',
        )

    def test_reparent_checks_resulting_descendant_scope(self):
        before = self.snapshot()
        response = self.move()
        self.assertEqual(response.status_code, 403)
        self.assertEqual(self.snapshot(), before)

    def test_reparent_checks_original_descendant_scope(self):
        models.UserPolicy.objects.filter(resource='/table/%', action='%').delete()
        for action in ('read', 'update'):
            self.grant(self.collection, '/table/fieldnotebook', action)
            self.grant(self.collection, '/table/fieldnotebookpageset', action)
        self.grant(self.collection, '/table/fieldnotebookpage', 'read')
        self.grant(self.other_collection, '/table/fieldnotebookpage', 'update')
        before = self.snapshot()
        response = self.move()
        self.assertEqual(response.status_code, 403)
        self.assertEqual(self.snapshot(), before)

    def test_reparent_moves_descendant_scope_with_all_required_permissions(self):
        self.grant(self.other_collection, '/table/fieldnotebookpage', 'update')
        response = self.move()
        self.assertEqual(response.status_code, 200)
        self.pageset.refresh_from_db()
        self.page.refresh_from_db()
        self.assertEqual(self.pageset.fieldnotebook_id, self.other_notebook.id)
        self.assertEqual(
            permissions.Scoping.scope_for_record(self.page), self.other_discipline,
        )

    def test_nested_create_in_restricted_destination_rolls_back(self):
        before = self.snapshot()
        response = self.client.put(
            f'/api/specify/fieldnotebook/{self.other_notebook.id}/',
            data={'version': self.other_notebook.version, 'pagesets': [{
                'discipline': f'/api/specify/discipline/{self.discipline.id}/',
                'pages': [{'discipline': f'/api/specify/discipline/{self.discipline.id}/',
                           'pagenumber': 'new'}],
            }]},
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(self.snapshot(), before)

    def test_nested_scope_change_without_reparent_checks_descendants(self):
        self.other_division = spmodels.Division.objects.create(
            institution=self.institution, name='Other division',
        )
        self.other_discipline.division = self.other_division
        self.other_discipline.save()
        desc = spmodels.Conservdescription.objects.create(
            collectionobject=self.collectionobjects[0], division=self.division,
        )
        event = spmodels.Conservevent.objects.create(conservdescription=desc)
        self.grant(self.other_collection, '/table/conservdescription', 'update')
        before = {
            model.__name__: list(model.objects.order_by('pk').values())
            for model in (spmodels.Collectionobject, spmodels.Conservdescription,
                          spmodels.Conservevent, spmodels.Spauditlog, spmodels.Spauditlogfield)
        }
        response = self.client.put(
            f'/api/specify/collectionobject/{self.collectionobjects[0].id}/',
            data={'version': self.collectionobjects[0].version, 'conservdescriptions': [{
                'id': desc.id, 'version': desc.version,
                'division': f'/api/specify/division/{self.other_division.id}/',
            }]},
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual({
            model.__name__: list(model.objects.order_by('pk').values())
            for model in (spmodels.Collectionobject, spmodels.Conservdescription,
                          spmodels.Conservevent, spmodels.Spauditlog, spmodels.Spauditlogfield)
        }, before)
        event.refresh_from_db()

class RecordsetNavigationAuthorizationApiTests(ScopedPermissionTestBase):
    def setUp(self):
        super().setUp()
        self.client.force_login(self.specifyuser)
        self.client.cookies['collection'] = str(self.collection.pk)
        self.grant_access(self.collection)
        self.grant(self.collection, '/table/%', 'read')
        self.recordset = self.make_recordset(self.collection)
        self.restricted_recordset = self.make_recordset(self.other_collection)
        self.previous, self.current, self.next = self.collectionobjects[:3]
        self.previous.collection = self.other_collection
        self.previous.collectionmemberid = self.other_collection.pk
        self.previous.save()
        self.restricted_next = spmodels.Collectionobject.objects.create(
            collection=self.other_collection, catalognumber='restricted-next',
        )
        for recordset in (self.recordset, self.restricted_recordset):
            for obj in (self.previous, self.current, self.next, self.restricted_next):
                recordset.recordsetitems.create(recordid=obj.pk)

    def make_recordset(self, collection):
        return spmodels.Recordset.objects.create(
            collectionmemberid=collection.pk,
            dbtableid=spmodels.Collectionobject.specify_model.tableId,
            name='Navigation', type=0, specifyuser=self.specifyuser,
        )

    def get(self, obj=None, recordset=None):
        obj = self.current if obj is None else obj
        recordset = self.recordset if recordset is None else recordset
        return self.client.get(
            f'/api/specify/collectionobject/{obj.pk}/?recordsetid={recordset.pk}',
        )

    def test_denies_restricted_recordset_even_for_readable_current_record(self):
        self.assertEqual(self.get(recordset=self.restricted_recordset).status_code, 403)

    def test_recordset_access_requires_read_permission_too(self):
        self.grant_access(self.other_collection)
        self.assertEqual(self.get(recordset=self.restricted_recordset).status_code, 403)

    def test_recordset_read_requires_collection_access_too(self):
        self.grant(self.other_collection, '/table/recordset', 'read')
        self.assertEqual(self.get(recordset=self.restricted_recordset).status_code, 403)

    def test_restricted_recordset_is_checked_even_when_record_is_not_a_member(self):
        self.assertEqual(self.get(
            self.collectionobjects[4], self.restricted_recordset,
        ).status_code, 403)

    def test_navigation_counts_and_previous_omit_unreadable_records(self):
        response = self.get()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['recordset_info'], {
            'recordsetid': self.recordset.pk, 'total_count': 2, 'index': 0,
            'previous': None, 'next': f'/api/specify/collectionobject/{self.next.pk}/',
        })

    def test_navigation_next_omits_unreadable_records(self):
        response = self.get(self.next)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['recordset_info'], {
            'recordsetid': self.recordset.pk, 'total_count': 2, 'index': 1,
            'previous': f'/api/specify/collectionobject/{self.current.pk}/', 'next': None,
        })

    def test_authorized_recordset_does_not_authorize_its_restricted_members(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/recordset', 'read')
        response = self.get(recordset=self.restricted_recordset)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['recordset_info']['total_count'], 2)

    def test_all_authorized_records_are_included(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/collectionobject', 'read')
        response = self.get()
        self.assertEqual(response.status_code, 200)
        info = response.json()['recordset_info']
        self.assertEqual(info['total_count'], 4)
        self.assertEqual(info['index'], 1)
        self.assertEqual(info['previous'], f'/api/specify/collectionobject/{self.previous.pk}/')

    def test_table_read_without_access_does_not_expose_members(self):
        self.grant(self.other_collection, '/table/collectionobject', 'read')
        response = self.get()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['recordset_info']['total_count'], 2)

    def test_dangling_record_ids_are_not_navigation_targets(self):
        self.recordset.recordsetitems.create(recordid=self.restricted_next.pk + 1000000)
        response = self.get(self.next)
        self.assertEqual(response.status_code, 200)
        info = response.json()['recordset_info']
        self.assertEqual(info['total_count'], 2)
        self.assertIsNone(info['next'])

    def test_nonmember_retains_null_navigation(self):
        response = self.get(self.collectionobjects[4])
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.json()['recordset_info'])

    def test_missing_recordset_retains_null_navigation(self):
        response = self.client.get(
            f'/api/specify/collectionobject/{self.current.pk}/'
            f'?recordsetid={self.restricted_recordset.pk + 1000000}',
        )
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.json()['recordset_info'])

    def test_only_readable_member_has_no_neighbors(self):
        self.next.collection = self.other_collection
        self.next.collectionmemberid = self.other_collection.pk
        self.next.save()
        response = self.get()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['recordset_info'], {
            'recordsetid': self.recordset.pk, 'total_count': 1, 'index': 0,
            'previous': None, 'next': None,
        })

    def test_plain_record_read_does_not_require_recordset_read(self):
        models.UserPolicy.objects.filter(resource='/table/%').delete()
        for table in ('collectionobject', 'collection', 'agent'):
            self.grant(self.collection, f'/table/{table}', 'read')
        response = self.client.get(f'/api/specify/collectionobject/{self.current.pk}/')
        self.assertEqual(response.status_code, 200)
        self.assertNotIn('recordset_info', response.json())

    def test_mismatched_table_retains_null_navigation(self):
        self.recordset.dbtableid = spmodels.Agent.specify_model.tableId
        self.recordset.save()
        response = self.get()
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.json()['recordset_info'])

    def test_current_record_still_requires_read_permission(self):
        self.assertEqual(self.get(self.previous).status_code, 403)

    def test_institution_grants_include_all_members(self):
        self.grant(None, '%', 'read')
        self.grant(None, '/system/sp7/collection', 'access')
        response = self.get(recordset=self.restricted_recordset)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['recordset_info']['total_count'], 4)

class RecordsetAppendAuthorizationApiTests(ScopedPermissionTestBase):
    def setUp(self):
        super().setUp()
        self.client.force_login(self.specifyuser)
        self.client.cookies['collection'] = str(self.collection.id)
        self.grant_access(self.collection)
        for action in ('read', 'create'):
            self.grant(self.collection, '/table/%', action)
        self.recordset = self.make_recordset(self.collection)
        self.restricted_recordset = self.make_recordset(self.other_collection)

    def make_recordset(self, collection):
        return spmodels.Recordset.objects.create(
            collectionmemberid=collection.pk,
            dbtableid=spmodels.Collectionobject.specify_model.tableId,
            name='Append target', type=0, specifyuser=self.specifyuser,
        )

    def snapshot(self):
        return {
            model.__name__: list(model.objects.order_by('pk').values())
            for model in (
                spmodels.Collectionobject, spmodels.Recordset, spmodels.Recordsetitem,
                spmodels.Spauditlog, spmodels.Spauditlogfield,
            )
        }

    def post(self, recordset=None):
        return self.client.post(
            '/api/specify/collectionobject/'
            + ('' if recordset is None else f'?recordsetid={recordset.pk}'),
            data={
                'collection': f'/api/specify/collection/{self.collection.pk}/',
                'catalognumber': 'appended-object',
            }, content_type='application/json',
        )

    def allow_update(self, collection):
        self.grant(collection, '/table/recordset', 'update')
        self.grant(collection, '/field/recordset/recordsetitems', 'update')

    def assert_denied_unchanged(self, recordset):
        before = self.snapshot()
        response = self.post(recordset)
        self.assertEqual(response.status_code, 403)
        self.assertEqual(self.snapshot(), before)

    def test_denies_restricted_recordset_and_rolls_back_created_record(self):
        self.assert_denied_unchanged(self.restricted_recordset)

    def test_collection_access_alone_does_not_authorize_append(self):
        self.grant_access(self.other_collection)
        self.assert_denied_unchanged(self.restricted_recordset)

    def test_read_permission_does_not_authorize_append(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/recordset', 'read')
        self.assert_denied_unchanged(self.restricted_recordset)

    def test_login_collection_update_does_not_authorize_restricted_target(self):
        self.allow_update(self.collection)
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/recordset', 'read')
        self.assert_denied_unchanged(self.restricted_recordset)

    def test_target_update_without_access_does_not_authorize_append(self):
        self.allow_update(self.other_collection)
        self.grant(self.other_collection, '/table/recordset', 'read')
        self.assert_denied_unchanged(self.restricted_recordset)

    def test_append_requires_relationship_field_update(self):
        self.grant(self.collection, '/table/recordset', 'update')
        self.assert_denied_unchanged(self.recordset)

    def test_append_requires_recordset_read_for_reference(self):
        models.UserPolicy.objects.filter(resource='/table/%', action='read').delete()
        for table in ('collectionobject', 'collection', 'agent'):
            self.grant(self.collection, f'/table/{table}', 'read')
        self.allow_update(self.collection)
        self.assert_denied_unchanged(self.recordset)

    def test_append_requires_recordsetitem_create(self):
        models.UserPolicy.objects.filter(resource='/table/%', action='create').delete()
        self.grant(self.collection, '/table/collectionobject', 'create')
        self.allow_update(self.collection)
        self.assert_denied_unchanged(self.recordset)

    def test_authorized_append_creates_only_one_membership(self):
        self.allow_update(self.collection)
        response = self.post(self.recordset)
        self.assertEqual(response.status_code, 201)
        item = self.recordset.recordsetitems.get()
        self.assertEqual(item.recordid, response.json()['id'])
        self.assertTrue(spmodels.Collectionobject.objects.filter(pk=item.recordid).exists())

    def test_authorized_cross_collection_append_uses_target_scope(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/recordset', 'read')
        self.allow_update(self.other_collection)
        response = self.post(self.restricted_recordset)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(
            self.restricted_recordset.recordsetitems.get().recordid, response.json()['id'],
        )
        self.assertFalse(self.recordset.recordsetitems.exists())

    def test_institution_wide_grants_authorize_append(self):
        self.grant(None, '%', '%')
        response = self.post(self.restricted_recordset)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(
            self.restricted_recordset.recordsetitems.get().recordid, response.json()['id'],
        )

    def test_created_membership_is_audited_against_target_recordset(self):
        self.allow_update(self.collection)
        response = self.post(self.recordset)
        self.assertEqual(response.status_code, 201)
        item = self.recordset.recordsetitems.get()
        self.assertTrue(spmodels.Spauditlog.objects.filter(
            tablenum=spmodels.Recordsetitem.specify_model.tableId, recordid=item.pk,
            parenttablenum=spmodels.Recordset.specify_model.tableId,
            parentrecordid=self.recordset.pk,
        ).exists())

    def test_record_type_mismatch_still_rolls_back_creation(self):
        from specifyweb.specify.api.crud import post_resource
        from specifyweb.specify.api.exceptions import RecordSetException

        self.allow_update(self.collection)
        self.recordset.dbtableid = spmodels.Agent.specify_model.tableId
        self.recordset.save()
        before = self.snapshot()
        with self.assertRaises(RecordSetException):
            post_resource(self.collection, self.agent, 'collectionobject', {
                'collection': f'/api/specify/collection/{self.collection.pk}/',
                'catalognumber': 'rollback-type-mismatch',
            }, recordsetid=self.recordset.pk)
        self.assertEqual(self.snapshot(), before)

    def test_missing_recordset_still_rolls_back_creation(self):
        from specifyweb.specify.api.crud import post_resource
        from specifyweb.specify.api.exceptions import RecordSetException

        before = self.snapshot()
        with self.assertRaises(RecordSetException):
            post_resource(self.collection, self.agent, 'collectionobject', {
                'collection': f'/api/specify/collection/{self.collection.pk}/',
                'catalognumber': 'rollback-missing-recordset',
            }, recordsetid=self.restricted_recordset.pk + 1000000)
        self.assertEqual(self.snapshot(), before)

    def test_without_recordset_does_not_require_append_permissions(self):
        response = self.post()
        self.assertEqual(response.status_code, 201)
        self.assertFalse(spmodels.Recordsetitem.objects.exists())

class ForwardNestedScopeMutationApiTests(ScopedPermissionTestBase):
    def setUp(self):
        super().setUp()
        self.other_discipline = spmodels.Discipline.objects.create(
            division=self.division, datatype=self.datatype,
            geographytreedef=self.geographytreedef,
            geologictimeperiodtreedef=self.geologictimeperiodtreedef,
        )
        self.other_collection.discipline = self.other_discipline
        self.other_collection.save()
        for collection in (self.collection, self.other_collection):
            self.grant_access(collection)
            self.grant(collection, '/table/%', 'read')
            self.grant(collection, '/field/%', 'update')
            for table in ('fieldnotebook', 'fieldnotebookpageset'):
                self.grant(collection, f'/table/{table}', 'update')
        self.client.force_login(self.specifyuser)
        self.client.cookies['collection'] = str(self.collection.id)
        self.notebook = spmodels.Fieldnotebook.objects.create(
            collection=self.collection, discipline=self.discipline, owneragent=self.agent,
        )
        self.destination = spmodels.Fieldnotebook.objects.create(
            collection=self.other_collection, discipline=self.other_discipline,
            owneragent=self.agent,
        )
        self.pageset = spmodels.Fieldnotebookpageset.objects.create(
            fieldnotebook=self.notebook, discipline=self.discipline,
        )
        self.page = spmodels.Fieldnotebookpage.objects.create(
            pageset=self.pageset, discipline=self.discipline, pagenumber='1',
        )
        self.sibling_pageset = spmodels.Fieldnotebookpageset.objects.create(
            fieldnotebook=self.notebook, discipline=self.discipline,
        )
        self.sibling_page = spmodels.Fieldnotebookpage.objects.create(
            pageset=self.sibling_pageset, discipline=self.discipline, pagenumber='2',
        )

    def snapshot(self):
        return {
            model.__name__: list(model.objects.order_by('pk').values())
            for model in (
                spmodels.Fieldnotebook, spmodels.Fieldnotebookpageset,
                spmodels.Fieldnotebookpage, spmodels.Spauditlog, spmodels.Spauditlogfield,
            )
        }

    def uri(self, obj):
        return f'/api/specify/{obj._meta.model_name}/{obj.pk}/'

    def put(self, obj, **changes):
        return self.client.put(
            self.uri(obj), data={'version': obj.version, **changes},
            content_type='application/json',
        )

    def nested_data(self, **changes):
        return {
            'id': self.notebook.pk, 'version': self.notebook.version,
            'discipline': self.uri(self.other_discipline), **changes,
        }

    def assert_nested_denied_unchanged(self):
        before = self.snapshot()
        response = self.put(
            self.pageset, description='must roll back', fieldnotebook=self.nested_data(),
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(self.snapshot(), before)

    def test_nested_scope_change_requires_resulting_descendant_update(self):
        self.grant(self.collection, '/table/fieldnotebookpage', 'update')
        self.assert_nested_denied_unchanged()

    def test_nested_scope_change_requires_original_descendant_update(self):
        self.grant(self.other_collection, '/table/fieldnotebookpage', 'update')
        self.assert_nested_denied_unchanged()

    def test_nested_scope_change_checks_dependents_outside_submitted_path(self):
        self.page.delete()
        self.assert_nested_denied_unchanged()

    def test_nested_scope_change_with_all_permissions_updates_descendant_scopes(self):
        for collection in (self.collection, self.other_collection):
            self.grant(collection, '/table/fieldnotebookpage', 'update')
        response = self.put(self.pageset, fieldnotebook=self.nested_data())
        self.assertEqual(response.status_code, 200)
        for obj in (self.pageset, self.page, self.sibling_pageset, self.sibling_page):
            obj.refresh_from_db()
            self.assertEqual(permissions.Scoping.scope_for_record(obj), self.other_discipline)

    def test_unchanged_scope_does_not_require_descendant_update(self):
        response = self.put(
            self.pageset, fieldnotebook=self.nested_data(
                discipline=self.uri(self.discipline), description='allowed',
            ),
        )
        self.assertEqual(response.status_code, 200)
        self.notebook.refresh_from_db()
        self.assertEqual(self.notebook.description, 'allowed')

    def test_collection_change_with_unchanged_discipline_preserves_shared_scope(self):
        response = self.put(
            self.pageset, fieldnotebook=self.nested_data(
                discipline=self.uri(self.discipline),
                collection=self.uri(self.other_collection),
            ),
        )
        self.assertEqual(response.status_code, 200)
        self.page.refresh_from_db()
        self.assertEqual(permissions.Scoping.scope_for_record(self.page), self.discipline)

    def test_nested_new_independent_target_preserves_previous_target_and_dependents(self):
        self.grant(self.collection, '/table/fieldnotebook', 'create')
        response = self.put(self.pageset, fieldnotebook={
            'id': None, 'name': 'New notebook',
            'collection': self.uri(self.collection),
            'discipline': self.uri(self.discipline),
            'owneragent': self.uri(self.agent),
        })
        self.assertEqual(response.status_code, 200)
        self.pageset.refresh_from_db()
        self.assertNotEqual(self.pageset.fieldnotebook_id, self.notebook.pk)
        self.assertTrue(spmodels.Fieldnotebook.objects.filter(pk=self.notebook.pk).exists())
        self.sibling_pageset.refresh_from_db()
        self.assertEqual(self.sibling_pageset.fieldnotebook_id, self.notebook.pk)
        self.page.refresh_from_db()
        self.assertEqual(permissions.Scoping.scope_for_record(self.page), self.discipline)

    def test_nested_same_id_requires_source_relationship_field_permission(self):
        models.UserPolicy.objects.filter(resource='/field/%').delete()
        self.grant(self.collection, '/field/fieldnotebook/%', 'update')
        before = self.snapshot()
        response = self.put(
            self.pageset, fieldnotebook=self.nested_data(
                discipline=self.uri(self.discipline), description='denied',
            ),
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(self.snapshot(), before)

    def test_nested_update_still_requires_related_table_permission(self):
        models.UserPolicy.objects.filter(resource='/table/fieldnotebook', action='update').delete()
        self.assert_nested_denied_unchanged()

    def test_nested_change_requires_source_field_in_resulting_scope(self):
        for collection in (self.collection, self.other_collection):
            self.grant(collection, '/table/fieldnotebookpage', 'update')
        models.UserPolicy.objects.filter(resource='/field/%').delete()
        self.grant(self.collection, '/field/%', 'update')
        self.grant(self.other_collection, '/field/fieldnotebook/%', 'update')
        self.assert_nested_denied_unchanged()

    def test_same_id_noop_still_requires_source_relationship_field_permission(self):
        models.UserPolicy.objects.filter(resource='/field/%').delete()
        before = self.snapshot()
        response = self.put(
            self.pageset,
            fieldnotebook={'id': self.notebook.pk, 'version': self.notebook.version},
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(self.snapshot(), before)

    def test_case_insensitive_nested_id_updates_existing_record(self):
        response = self.put(self.pageset, fieldnotebook={
            'ID': self.notebook.pk, 'Version': self.notebook.version,
            'Description': 'normalized',
        })
        self.assertEqual(response.status_code, 200)
        self.notebook.refresh_from_db()
        self.assertEqual(self.notebook.description, 'normalized')

    def test_missing_nested_version_rolls_back(self):
        before = self.snapshot()
        response = self.put(
            self.pageset, description='rollback',
            fieldnotebook={'id': self.notebook.pk, 'description': 'rollback'},
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(self.snapshot(), before)

    def test_stale_nested_version_rolls_back(self):
        before = self.snapshot()
        response = self.put(
            self.pageset, description='rollback', fieldnotebook=self.nested_data(
                version=self.notebook.version + 1,
            ),
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(self.snapshot(), before)

    def test_nested_create_parent_rolls_back_scope_change_of_existing_target(self):
        self.grant(self.collection, '/table/fieldnotebookpageset', 'create')
        self.grant(self.other_collection, '/table/fieldnotebookpageset', 'create')
        before = self.snapshot()
        response = self.client.post(
            '/api/specify/fieldnotebookpageset/',
            data={
                'discipline': self.uri(self.discipline),
                'fieldnotebook': self.nested_data(),
            }, content_type='application/json',
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(self.snapshot(), before)

    def test_direct_scope_change_checks_descendants_too(self):
        before = self.snapshot()
        response = self.put(self.notebook, discipline=self.uri(self.other_discipline))
        self.assertEqual(response.status_code, 403)
        self.assertEqual(self.snapshot(), before)

    def test_direct_reparent_with_uri_checks_descendants_too(self):
        before = self.snapshot()
        response = self.put(self.pageset, fieldnotebook=self.uri(self.destination))
        self.assertEqual(response.status_code, 403)
        self.assertEqual(self.snapshot(), before)

    def test_direct_reparent_with_permissions_preserves_pages(self):
        for collection in (self.collection, self.other_collection):
            self.grant(collection, '/table/fieldnotebookpage', 'update')
        response = self.put(self.pageset, fieldnotebook=self.uri(self.destination))
        self.assertEqual(response.status_code, 200)
        self.page.refresh_from_db()
        self.assertEqual(self.page.pageset_id, self.pageset.pk)
        self.assertEqual(permissions.Scoping.scope_for_record(self.page), self.other_discipline)
        self.sibling_page.refresh_from_db()
        self.assertEqual(permissions.Scoping.scope_for_record(self.sibling_page), self.discipline)

class ReverseOneToOneMutationApiTests(ScopedPermissionTestBase):
    def setUp(self):
        super().setUp()
        self.grant_access(self.collection)
        self.grant(self.collection, '/table/%', '%')
        self.grant(self.collection, '/field/%', 'update')
        self.client.force_login(self.specifyuser)
        self.client.cookies['collection'] = str(self.collection.id)
        self.destination, self.original = self.collectionobjects[:2]
        self.restricted_original = spmodels.Collectionobject.objects.create(
            collection=self.other_collection, catalognumber='restricted-original',
        )
        picklist = spmodels.Picklist.objects.create(
            name=SYSTEM_COGTYPES_PICKLIST, collection=self.collection,
            issystem=True, type=0, readonly=True,
        )
        spmodels.Picklistitem.objects.create(
            title='Discrete', value='Discrete', picklist=picklist,
        )
        cogtype = spmodels.Collectionobjectgrouptype.objects.create(
            name='Discrete', type='Discrete', collection=self.collection,
        )
        self.group = spmodels.Collectionobjectgroup.objects.create(
            name='Parent', cogtype=cogtype, collection=self.collection,
        )
        self.join = spmodels.Collectionobjectgroupjoin.objects.create(
            parentcog=self.group, childco=self.original, isprimary=False, issubstrate=False,
        )

    def snapshot(self):
        return {
            model.__name__: list(model.objects.order_by('pk').values())
            for model in (
                spmodels.Collectionobject, spmodels.Collectionobjectgroup,
                spmodels.Collectionobjectgroupjoin, spmodels.Spauditlog, spmodels.Spauditlogfield,
            )
        }

    def put(self, value, parent=None, **changes):
        parent = self.destination if parent is None else parent
        return self.client.put(
            f'/api/specify/{parent._meta.model_name}/{parent.id}/',
            data={'version': parent.version, 'cojo': value, **changes},
            content_type='application/json',
        )

    def join_data(self, **changes):
        return {'id': self.join.id, 'version': self.join.version, **changes}

    def assert_denied_unchanged(self, value, parent=None):
        before = self.snapshot()
        response = self.put(value, parent, text1='must roll back')
        self.assertEqual(response.status_code, 403)
        self.assertEqual(self.snapshot(), before)

    def test_reassignment_requires_original_parent_update_scope(self):
        self.join.childco = self.restricted_original
        self.join.save()
        self.assert_denied_unchanged(self.join_data())

    def test_original_parent_read_does_not_replace_update(self):
        self.join.childco = self.restricted_original
        self.join.save()
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/%', 'read')
        self.assert_denied_unchanged(self.join_data())

    def test_reassignment_requires_original_parent_field_permission(self):
        self.join.childco = self.restricted_original
        self.join.save()
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/%', '%')
        self.assert_denied_unchanged(self.join_data())

    def test_reassignment_with_all_permissions_preserves_original_record(self):
        self.join.childco = self.restricted_original
        self.join.save()
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/%', '%')
        self.grant(self.other_collection, '/field/%', 'update')
        response = self.put(self.join_data(text1='moved'))
        self.assertEqual(response.status_code, 200)
        self.join.refresh_from_db()
        self.assertEqual(self.join.childco_id, self.destination.id)
        self.assertEqual(self.join.text1, 'moved')
        self.assertTrue(spmodels.Collectionobject.objects.filter(
            pk=self.restricted_original.id,
        ).exists())

    def test_unchanged_reverse_id_still_requires_parent_field_permission(self):
        models.UserPolicy.objects.filter(resource='/field/%').delete()
        self.grant(self.collection, '/field/collectionobjectgroupjoin/%', 'update')
        before = self.snapshot()
        response = self.put(self.join_data(text1='denied'), self.original)
        self.assertEqual(response.status_code, 403)
        self.assertEqual(self.snapshot(), before)

    def test_nested_update_requires_related_table_permission(self):
        initialize.wipe_permissions()
        self.grant_access(self.collection)
        self.grant(self.collection, '/table/%', 'read')
        self.grant(self.collection, '/table/collectionobject', 'update')
        self.grant(self.collection, '/field/%', 'update')
        self.assert_denied_unchanged(self.join_data(text1='denied'), self.original)

    def test_clear_requires_delete_permission_and_rolls_back(self):
        initialize.wipe_permissions()
        self.grant_access(self.collection)
        for action in ('read', 'update'):
            self.grant(self.collection, '/table/%', action)
        self.grant(self.collection, '/field/%', 'update')
        self.assert_denied_unchanged(None, self.original)

    def test_clear_deletes_only_join_with_required_permissions(self):
        response = self.put(None, self.original)
        self.assertEqual(response.status_code, 200)
        self.assertFalse(spmodels.Collectionobjectgroupjoin.objects.filter(pk=self.join.id).exists())
        self.assertTrue(spmodels.Collectionobject.objects.filter(pk=self.original.id).exists())
        self.assertTrue(spmodels.Collectionobjectgroup.objects.filter(pk=self.group.id).exists())

    def test_replacement_without_id_removes_previous_dependent(self):
        response = self.put({
            'parentcog': f'/api/specify/collectionobjectgroup/{self.group.id}/',
            'isprimary': False, 'issubstrate': False,
        }, self.original)
        self.assertEqual(response.status_code, 200)
        self.assertFalse(spmodels.Collectionobjectgroupjoin.objects.filter(pk=self.join.id).exists())
        self.assertEqual(
            spmodels.Collectionobjectgroupjoin.objects.filter(childco=self.original).count(), 1,
        )

    def test_case_insensitive_id_updates_existing_related_record(self):
        response = self.put({
            'ID': self.join.id, 'Version': self.join.version, 'Text1': 'updated',
        }, self.original)
        self.assertEqual(response.status_code, 200)
        self.join.refresh_from_db()
        self.assertEqual(self.join.text1, 'updated')
        self.assertEqual(self.join.childco_id, self.original.id)

    def test_supplied_back_reference_cannot_override_destination(self):
        response = self.put(self.join_data(
            childco=f'/api/specify/collectionobject/{self.restricted_original.id}/',
            ChildCo=f'/api/specify/collectionobject/{self.restricted_original.id}/',
        ))
        self.assertEqual(response.status_code, 200)
        self.join.refresh_from_db()
        self.assertEqual(self.join.childco_id, self.destination.id)

    def test_missing_nested_version_rolls_back_parent(self):
        before = self.snapshot()
        response = self.put({'id': self.join.id}, text1='rollback')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(self.snapshot(), before)

    def test_create_parent_rolls_back_if_original_parent_is_restricted(self):
        self.join.childco = self.restricted_original
        self.join.save()
        before = self.snapshot()
        response = self.client.post(
            '/api/specify/collectionobject/',
            data={
                'collection': f'/api/specify/collection/{self.collection.id}/',
                'catalognumber': 'new-reverse-parent', 'cojo': self.join_data(),
            }, content_type='application/json',
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(self.snapshot(), before)

    def test_group_reassignment_requires_original_group_permission(self):
        restricted_group = spmodels.Collectionobjectgroup.objects.create(
            name='Restricted child', cogtype=self.group.cogtype,
            collection=self.other_collection,
        )
        self.join.childco = None
        self.join.childcog = restricted_group
        self.join.save()
        destination = spmodels.Collectionobjectgroup.objects.create(
            name='New child', cogtype=self.group.cogtype, collection=self.collection,
        )
        self.assert_denied_unchanged(self.join_data(), destination)

    def test_group_reassignment_with_permissions_preserves_original_group(self):
        original_group = spmodels.Collectionobjectgroup.objects.create(
            name='Original child', cogtype=self.group.cogtype, collection=self.collection,
        )
        destination = spmodels.Collectionobjectgroup.objects.create(
            name='New child', cogtype=self.group.cogtype, collection=self.collection,
        )
        self.join.childco = None
        self.join.childcog = original_group
        self.join.save()
        response = self.put(self.join_data(), destination)
        self.assertEqual(response.status_code, 200)
        self.join.refresh_from_db()
        self.assertEqual(self.join.childcog_id, destination.id)
        self.assertTrue(spmodels.Collectionobjectgroup.objects.filter(pk=original_group.id).exists())

    def test_replacement_delete_denial_rolls_back_parent(self):
        initialize.wipe_permissions()
        self.grant_access(self.collection)
        for action in ('read', 'update', 'create'):
            self.grant(self.collection, '/table/%', action)
        self.grant(self.collection, '/field/%', 'update')
        self.assert_denied_unchanged({
            'parentcog': f'/api/specify/collectionobjectgroup/{self.group.id}/',
            'isprimary': False, 'issubstrate': False,
        }, self.original)

    def test_replacement_create_denial_restores_deleted_dependent_and_audit(self):
        initialize.wipe_permissions()
        self.grant_access(self.collection)
        for action in ('read', 'update', 'delete'):
            self.grant(self.collection, '/table/%', action)
        self.grant(self.collection, '/field/%', 'update')
        self.assert_denied_unchanged({
            'parentcog': f'/api/specify/collectionobjectgroup/{self.group.id}/',
            'isprimary': False, 'issubstrate': False,
        }, self.original)

    def test_missing_related_record_rolls_back_parent(self):
        before = self.snapshot()
        response = self.put(self.join_data(id=self.join.id + 1000000), text1='rollback')
        self.assertEqual(response.status_code, 404)
        self.assertEqual(self.snapshot(), before)

    def test_null_nested_id_creates_replacement(self):
        response = self.put({
            'id': None, 'parentcog': f'/api/specify/collectionobjectgroup/{self.group.id}/',
            'isprimary': False, 'issubstrate': False,
        }, self.original)
        self.assertEqual(response.status_code, 200)
        self.assertFalse(spmodels.Collectionobjectgroupjoin.objects.filter(pk=self.join.id).exists())
        self.assertEqual(
            spmodels.Collectionobjectgroupjoin.objects.filter(childco=self.original).count(), 1,
        )

    def test_invalid_payloads_return_400_without_writes(self):
        for value in (False, 1, [], '/api/specify/collectionobjectgroupjoin/1/'):
            with self.subTest(value=value):
                before = self.snapshot()
                response = self.put(value, text1='rollback')
                self.assertEqual(response.status_code, 400)
                self.assertEqual(self.snapshot(), before)

class ForeignKeyReferenceWriteApiTests(ScopedPermissionTestBase):
    def setUp(self):
        super().setUp()
        self.grant_access(self.collection)
        for action in ('read', 'create', 'update'):
            self.grant(self.collection, '/table/%', action)
        self.grant(self.collection, '/field/%', 'update')
        self.client.force_login(self.specifyuser)
        self.client.cookies['collection'] = str(self.collection.id)
        self.other_discipline = spmodels.Discipline.objects.create(
            division=self.division, datatype=self.datatype,
            geographytreedef=self.geographytreedef,
            geologictimeperiodtreedef=self.geologictimeperiodtreedef,
        )
        self.other_collection.discipline = self.other_discipline
        self.other_collection.save()
        self.restricted_event = spmodels.Collectingevent.objects.create(
            discipline=self.other_discipline, remarks='restricted event',
        )
        self.record = self.collectionobjects[0]
        self.record.collectingevent = self.collectingevent
        self.record.save()

    def write_reference(self, operation, event, **changes):
        uri = None if event is None else f'/api/specify/collectingevent/{event.id}/'
        if operation == 'create':
            return self.client.post(
                '/api/specify/collectionobject/',
                data={
                    'collection': f'/api/specify/collection/{self.collection.id}/',
                    'catalognumber': 'reference-test',
                    **changes, 'collectingevent': uri,
                },
                content_type='application/json',
            )
        return self.client.put(
            f'/api/specify/collectionobject/{self.record.id}/',
            data={'version': self.record.version, **changes, 'collectingevent': uri},
            content_type='application/json',
        )

    def snapshot(self):
        return {
            model.__name__: list(model.objects.order_by('pk').values())
            for model in (
                spmodels.Collectionobject, spmodels.Collectionobjectattribute,
                spmodels.Collectingevent, spmodels.Spauditlog, spmodels.Spauditlogfield,
            )
        }

    def assert_reference_denied(self):
        for operation in ('create', 'update'):
            with self.subTest(operation=operation):
                before = self.snapshot()
                response = self.write_reference(
                    operation, self.restricted_event, text1='must not persist',
                )
                self.assertEqual(response.status_code, 403)
                self.assertEqual(self.snapshot(), before)

    def assert_reference_allowed(self, event):
        for operation, status in (('create', 201), ('update', 200)):
            with self.subTest(operation=operation):
                event_before = spmodels.Collectingevent.objects.values().get(pk=event.id)
                response = self.write_reference(operation, event)
                self.assertEqual(response.status_code, status)
                obj = spmodels.Collectionobject.objects.get(pk=response.json()['id'])
                self.assertEqual(obj.collectingevent_id, event.id)
                self.assertEqual(
                    spmodels.Collectingevent.objects.values().get(pk=event.id), event_before,
                )

    def test_denies_restricted_uri_before_create_or_update_persists(self):
        self.assert_reference_denied()

    def test_target_read_without_access_is_not_sufficient(self):
        self.grant(self.other_collection, '/table/collectingevent', 'read')
        self.assert_reference_denied()

    def test_target_access_without_read_is_not_sufficient(self):
        self.grant_access(self.other_collection)
        self.assert_reference_denied()

    def test_target_write_does_not_replace_read(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/collectingevent', 'update')
        self.assert_reference_denied()

    def test_target_read_and_access_allow_link_without_target_write(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/collectingevent', 'read')
        self.assert_reference_allowed(self.restricted_event)

    def test_readable_shared_discipline_target_remains_linkable(self):
        self.assert_reference_allowed(self.collectingevent)

    def test_global_grant_allows_reference(self):
        self.grant(None, '%', '%')
        self.assert_reference_allowed(self.restricted_event)

    def test_readable_target_does_not_replace_source_update_permission(self):
        models.UserPolicy.objects.filter(action='update').delete()
        before = self.snapshot()
        response = self.write_reference('update', self.collectingevent, text1='denied')
        self.assertEqual(response.status_code, 403)
        self.assertEqual(self.snapshot(), before)

    def test_readable_target_does_not_replace_source_create_permission(self):
        models.UserPolicy.objects.filter(action='create').delete()
        before = self.snapshot()
        response = self.write_reference('create', self.collectingevent)
        self.assertEqual(response.status_code, 403)
        self.assertEqual(self.snapshot(), before)

    def test_denied_reference_rolls_back_earlier_nested_writes(self):
        for operation in ('create', 'update'):
            with self.subTest(operation=operation):
                before = self.snapshot()
                response = self.write_reference(
                    operation, self.restricted_event,
                    collectionobjectattribute={'text1': 'must roll back'},
                )
                self.assertEqual(response.status_code, 403)
                self.assertEqual(self.snapshot(), before)

    def test_denied_reference_rolls_back_earlier_nested_update(self):
        attribute = spmodels.Collectionobjectattribute.objects.create(
            collectionmemberid=self.collection.id, text1='original',
        )
        self.record.collectionobjectattribute = attribute
        self.record.save()
        before = self.snapshot()
        response = self.write_reference(
            'update', self.restricted_event,
            collectionobjectattribute={
                'id': attribute.id, 'version': attribute.version, 'text1': 'must roll back',
            },
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(self.snapshot(), before)

    def test_fk_aliases_and_case_insensitive_names_require_target_read(self):
        for field in ('collectingevent_id', 'CollectingEvent'):
            for operation in ('create', 'update'):
                with self.subTest(field=field, operation=operation):
                    data = {field: f'/api/specify/collectingevent/{self.restricted_event.id}/'}
                    if operation == 'create':
                        response = self.client.post(
                            '/api/specify/collectionobject/',
                            data={
                                'collection': f'/api/specify/collection/{self.collection.id}/',
                                'catalognumber': 'alias-test', **data,
                            },
                            content_type='application/json',
                        )
                    else:
                        response = self.client.put(
                            f'/api/specify/collectionobject/{self.record.id}/',
                            data={'version': self.record.version, **data},
                            content_type='application/json',
                        )
                    self.assertEqual(response.status_code, 403)
                    self.record.refresh_from_db()
                    self.assertEqual(self.record.collectingevent_id, self.collectingevent.id)
                    self.assertFalse(spmodels.Collectionobject.objects.filter(
                        catalognumber='alias-test',
                    ).exists())

    def test_readable_target_does_not_replace_source_field_permission(self):
        models.UserPolicy.objects.filter(resource='/field/%').delete()
        before = self.snapshot()
        response = self.write_reference('update', self.collectingevent, text1='denied')
        self.assertEqual(response.status_code, 403)
        self.assertEqual(self.snapshot(), before)

    def test_repeated_restricted_uri_is_not_exempt_from_authorization(self):
        self.record.collectingevent = self.restricted_event
        self.record.save()
        before = self.snapshot()
        response = self.write_reference('update', self.restricted_event)
        self.assertEqual(response.status_code, 403)
        self.assertEqual(self.snapshot(), before)

    def test_missing_target_does_not_persist_other_changes(self):
        missing = spmodels.Collectingevent(id=2147483647)
        for operation in ('create', 'update'):
            with self.subTest(operation=operation):
                before = self.snapshot()
                response = self.write_reference(operation, missing, text1='denied')
                self.assertEqual(response.status_code, 404)
                self.assertEqual(self.snapshot(), before)

    def test_null_reference_still_clears_link(self):
        response = self.write_reference('update', None)
        self.assertEqual(response.status_code, 200)
        self.record.refresh_from_db()
        self.assertIsNone(self.record.collectingevent_id)

    def test_existing_restricted_reference_can_be_cleared(self):
        self.record.collectingevent = self.restricted_event
        self.record.save()
        event_before = spmodels.Collectingevent.objects.values().get(
            pk=self.restricted_event.id,
        )
        response = self.write_reference('update', None)
        self.assertEqual(response.status_code, 200)
        self.record.refresh_from_db()
        self.assertIsNone(self.record.collectingevent_id)
        self.assertEqual(
            spmodels.Collectingevent.objects.values().get(pk=self.restricted_event.id),
            event_before,
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
