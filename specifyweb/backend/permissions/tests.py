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

class IndirectImportMatchingTests(ScopedPermissionTestBase):
    def setUp(self):
        super().setUp()
        self.grant_access(self.collection)
        self.grant(self.collection, '/table/%', '%')
        self.obj = self.collectionobjects[0]
        self.preptype = spmodels.Preptype.objects.create(
            name='indirect-import-type', collection=self.collection,
        )

    def preparation(self, *, readable=True, remarks='witness', parent=None, preptype=None):
        return spmodels.Preparation.objects.create(
            collectionobject=self.obj if parent is None else parent,
            collectionmemberid=(self.collection if readable else self.other_collection).pk,
            preptype=self.preptype if preptype is None else preptype, remarks=remarks,
            countamt=1,
        )

    def bound_table(self, *, actor=True):
        from specifyweb.backend.workbench.upload.auditor import Auditor, DEFAULT_AUDITOR_PROPS
        from specifyweb.backend.workbench.upload.upload_table import UploadTable
        return UploadTable(
            name='Collectionobject', wbcols={}, static={}, toOne={}, toMany={},
        ).apply_scoping(self.collection).bind(
            {}, self.agent.pk,
            Auditor(self.collection, DEFAULT_AUDITOR_PROPS, None,
                    agent=self.agent if actor else None), {},
        )

    def match(self, predicate, *, actor=True):
        from specifyweb.backend.workbench.upload.upload_result import ReportInfo
        bound = self.bound_table(actor=actor)
        return bound._match(predicate, ReportInfo(bound.name, [], None))

    def predicate(self, *children):
        from specifyweb.backend.workbench.upload.predicates import DjangoPredicates
        return DjangoPredicates(filters={'id': self.obj.pk, 'preparations': list(children)})

    def test_unreadable_to_many_cannot_witness_a_match(self):
        from specifyweb.backend.workbench.upload.predicates import DjangoPredicates
        self.preparation(readable=False)
        self.assertIsNone(self.match(self.predicate(
            DjangoPredicates(filters={'remarks': 'witness'}),
        )))

    def test_readable_child_cannot_authorize_another_matching_child(self):
        from specifyweb.backend.workbench.upload.predicates import DjangoPredicates
        self.preparation(readable=False)
        self.preparation(remarks='not-a-witness')
        self.assertIsNone(self.match(self.predicate(
            DjangoPredicates(filters={'remarks': 'witness'}),
        )))

    def test_readable_child_preserves_parent_match(self):
        from specifyweb.backend.workbench.upload.predicates import DjangoPredicates
        self.preparation()
        self.preparation(readable=False)
        self.assertEqual(self.match(self.predicate(
            DjangoPredicates(filters={'remarks': 'witness'}),
        )).id, self.obj.pk)

    def test_two_witnesses_must_be_distinct_and_readable(self):
        from specifyweb.backend.workbench.upload.predicates import DjangoPredicates
        self.preparation()
        self.preparation(readable=False)
        child = DjangoPredicates(filters={'remarks': 'witness'})
        self.assertIsNone(self.match(self.predicate(child, child)))

    def test_two_readable_witnesses_preserve_match(self):
        from specifyweb.backend.workbench.upload.predicates import DjangoPredicates
        self.preparation()
        self.preparation()
        child = DjangoPredicates(filters={'remarks': 'witness'})
        self.assertEqual(self.match(self.predicate(child, child)).id, self.obj.pk)

    def test_reverse_then_forward_requires_related_scope(self):
        from specifyweb.backend.workbench.upload.predicates import DjangoPredicates
        restricted_type = spmodels.Preptype.objects.create(
            name='restricted-type', collection=self.other_collection,
        )
        self.preparation(preptype=restricted_type)
        self.assertIsNone(self.match(self.predicate(DjangoPredicates(filters={
            'remarks': 'witness', 'preptype': [
                DjangoPredicates(filters={'name': 'restricted-type'}),
            ],
        }))))

    def test_raw_fk_aliases_require_related_scope(self):
        from specifyweb.backend.workbench.upload.predicates import DjangoPredicates
        restricted_type = spmodels.Preptype.objects.create(
            name='restricted-type', collection=self.other_collection,
        )
        self.preparation(preptype=restricted_type)
        for field in ('preptype', 'preptype_id', 'preptype__name'):
            with self.subTest(field=field):
                self.assertIsNone(self.match(self.predicate(DjangoPredicates(filters={
                    field: 'restricted-type' if field.endswith('__name') else restricted_type.pk,
                }))))

    def test_scalar_reverse_lookup_requires_same_readable_witness(self):
        from specifyweb.backend.workbench.upload.predicates import DjangoPredicates
        self.preparation(readable=False)
        self.preparation(remarks='not-a-witness')
        self.assertIsNone(self.match(DjangoPredicates(filters={
            'id': self.obj.pk, 'preparations__remarks': 'witness',
        })))

    def test_hidden_extra_child_does_not_change_absence_match(self):
        from specifyweb.backend.workbench.upload.predicates import DjangoPredicates, ToRemove
        self.preparation(readable=False)
        self.assertEqual(self.match(self.predicate(
            DjangoPredicates(to_remove=ToRemove('Preparation', {})),
        )).id, self.obj.pk)

    def test_readable_extra_child_still_blocks_absence_match(self):
        from specifyweb.backend.workbench.upload.predicates import DjangoPredicates, ToRemove
        self.preparation()
        self.assertIsNone(self.match(self.predicate(
            DjangoPredicates(to_remove=ToRemove('Preparation', {})),
        )))

    def test_exclusion_keeps_explicit_witness_and_ignores_hidden_extra(self):
        from specifyweb.backend.workbench.upload.predicates import DjangoPredicates, ToRemove
        self.preparation()
        self.preparation(readable=False, remarks='extra')
        self.assertEqual(self.match(self.predicate(
            DjangoPredicates(filters={'remarks': 'witness'}),
            DjangoPredicates(to_remove=ToRemove('Preparation', {})),
        )).id, self.obj.pk)

    def test_exclusion_still_detects_readable_extra(self):
        from specifyweb.backend.workbench.upload.predicates import DjangoPredicates, ToRemove
        self.preparation()
        self.preparation(remarks='extra')
        self.assertIsNone(self.match(self.predicate(
            DjangoPredicates(filters={'remarks': 'witness'}),
            DjangoPredicates(to_remove=ToRemove('Preparation', {})),
        )))

    def test_exclusion_checks_forward_reference_in_filter(self):
        from specifyweb.backend.workbench.upload.predicates import DjangoPredicates, ToRemove
        restricted_type = spmodels.Preptype.objects.create(
            name='restricted-type', collection=self.other_collection,
        )
        self.preparation(preptype=restricted_type)
        self.assertEqual(self.match(self.predicate(
            DjangoPredicates(to_remove=ToRemove('Preparation', {
                'preptype_id': restricted_type.pk,
            })),
        )).id, self.obj.pk)

    def test_trusted_matching_retains_unrestricted_behavior(self):
        from specifyweb.backend.workbench.upload.predicates import DjangoPredicates
        self.preparation(readable=False)
        self.assertEqual(self.match(self.predicate(
            DjangoPredicates(filters={'remarks': 'witness'}),
        ), actor=False).id, self.obj.pk)

    def test_collection_access_without_table_read_cannot_witness(self):
        from specifyweb.backend.workbench.upload.predicates import DjangoPredicates
        self.preparation(readable=False)
        self.grant_access(self.other_collection)
        self.assertIsNone(self.match(self.predicate(
            DjangoPredicates(filters={'remarks': 'witness'}),
        )))

    def test_table_read_without_collection_access_cannot_witness(self):
        from specifyweb.backend.workbench.upload.predicates import DjangoPredicates
        self.preparation(readable=False)
        self.grant(self.other_collection, '/table/preparation', 'read')
        self.assertIsNone(self.match(self.predicate(
            DjangoPredicates(filters={'remarks': 'witness'}),
        )))

    def test_both_grants_enable_restricted_witness(self):
        from specifyweb.backend.workbench.upload.predicates import DjangoPredicates
        self.preparation(readable=False)
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/preparation', 'read')
        self.assertEqual(self.match(self.predicate(
            DjangoPredicates(filters={'remarks': 'witness'}),
        )).id, self.obj.pk)

    def test_null_forward_relation_keeps_readable_parent(self):
        from specifyweb.backend.workbench.upload.predicates import DjangoPredicates
        self.assertEqual(self.match(DjangoPredicates(filters={
            'id': self.obj.pk, 'collectionobjectattribute_id': None,
        })).id, self.obj.pk)

    def test_nested_reverse_requires_grandchild_scope(self):
        from specifyweb.backend.workbench.upload.predicates import DjangoPredicates
        prep = self.preparation()
        spmodels.Preparationproperty.objects.create(
            preparation=prep, collectionmemberid=self.other_collection.pk, integer1=17,
        )
        self.assertIsNone(self.match(self.predicate(DjangoPredicates(filters={
            'preparationproperties': [DjangoPredicates(filters={'integer1': 17})],
        }))))

    def test_nested_reverse_absence_ignores_hidden_grandchild(self):
        from specifyweb.backend.workbench.upload.predicates import DjangoPredicates, ToRemove
        prep = self.preparation()
        spmodels.Preparationproperty.objects.create(
            preparation=prep, collectionmemberid=self.other_collection.pk, integer1=17,
        )
        self.assertEqual(self.match(self.predicate(DjangoPredicates(filters={
            'remarks': 'witness', 'preparationproperties': [
                DjangoPredicates(to_remove=ToRemove('Preparationproperty', {})),
            ],
        }))).id, self.obj.pk)

    def test_forward_then_reverse_requires_intermediate_read(self):
        from specifyweb.backend.workbench.upload.predicates import DjangoPredicates
        prep = self.preparation(readable=False)
        prop = spmodels.Preparationproperty.objects.create(
            preparation=prep, collectionmemberid=self.collection.pk, integer1=17,
        )
        self.assertIsNone(self.match(DjangoPredicates(filters={
            'id': self.obj.pk, 'preparations__preparationproperties__id': prop.pk,
        })))

    def test_cached_matches_recheck_indirect_witness(self):
        from specifyweb.backend.workbench.upload.predicates import DjangoPredicates
        from specifyweb.backend.workbench.upload.upload_result import ReportInfo
        prep = self.preparation()
        bound = self.bound_table()
        predicate = self.predicate(DjangoPredicates(filters={'remarks': 'witness'}))
        info = ReportInfo(bound.name, [], None)
        self.assertEqual(bound._match(predicate, info).id, self.obj.pk)
        bound.cache[predicate.get_cache_key(bound.name)] = [self.obj.pk]
        prep.collectionmemberid = self.other_collection.pk
        prep.save()
        self.assertIsNone(bound._match(predicate, info))

    def test_ten_row_limit_applies_after_deduplicating_witnesses(self):
        from specifyweb.backend.workbench.upload.predicates import DjangoPredicates
        for _ in range(12):
            self.preparation()
        second = self.collectionobjects[1]
        self.preparation(parent=second)
        predicate = DjangoPredicates(filters={
            'preparations': [DjangoPredicates(filters={'remarks': 'witness'})],
        })
        self.assertCountEqual(self.match(predicate).ids, [self.obj.pk, second.pk])

    def test_reverse_isnull_uses_only_readable_children(self):
        from specifyweb.backend.workbench.upload.predicates import DjangoPredicates
        self.preparation(readable=False)
        self.assertEqual(self.match(DjangoPredicates(filters={
            'id': self.obj.pk, 'preparations__id__isnull': True,
        })).id, self.obj.pk)

    def test_readable_child_still_blocks_reverse_isnull(self):
        from specifyweb.backend.workbench.upload.predicates import DjangoPredicates
        self.preparation()
        self.assertIsNone(self.match(DjangoPredicates(filters={
            'id': self.obj.pk, 'preparations__id__isnull': True,
        })))

    def run_upload(
        self, *, empty=False, no_commit=False, allow_partial=True,
        earlier_row=False, single_row_validation=False,
    ):
        from specifyweb.backend.workbench.upload.upload import do_upload
        from specifyweb.backend.workbench.upload.upload_plan_schema import parse_plan
        plan = parse_plan({
            'baseTableName': 'Collectionobject', 'uploadable': {'uploadTable': {
                'wbcols': {'remarks': 'Object'}, 'static': {}, 'toOne': {},
                'toMany': {'preparations': [{
                    'wbcols': {'remarks': 'Prep'},
                    'static': {'preptype_id': self.preptype.pk}, 'toOne': {}, 'toMany': {},
                }]},
            }},
        })
        row = {'Object': 'source', 'Prep': '' if empty else 'witness'}
        if single_row_validation:
            from specifyweb.backend.workbench.upload.upload import validate_row
            return [validate_row(
                self.collection, plan.apply_scoping(self.collection, row=row),
                self.agent.pk, row, None,
            )]
        return do_upload(
            self.collection,
            ([{'Object': 'earlier-allowed-row', 'Prep': ''}] if earlier_row else [])
            + [row],
            plan, self.agent.pk, no_commit=no_commit, allow_partial=allow_partial,
        )

    def restrict_preparation_read(self, *, create=True):
        self.obj.remarks = 'source'
        self.obj.save()
        self.preparation()
        models.UserPolicy.objects.filter(resource='/table/%').delete()
        self.grant(self.collection, '/table/collectionobject', '%')
        self.grant(self.collection, '/table/preptype', 'read')
        if create:
            self.grant(self.collection, '/table/preparation', 'create')

    def test_actual_upload_does_not_reuse_parent_via_unreadable_child(self):
        from specifyweb.backend.workbench.upload.upload_result import Uploaded
        self.restrict_preparation_read()
        result = self.run_upload()[0]
        self.assertIsInstance(result.record_result, Uploaded)
        self.assertNotEqual(result.get_id(), self.obj.pk)
        self.assertEqual(self.obj.preparations.count(), 1)

    def test_actual_upload_absence_ignores_unreadable_extra(self):
        from specifyweb.backend.workbench.upload.upload_result import Matched
        self.restrict_preparation_read()
        # Absence matching is scoped by the plan's static fields as well.
        result = self.run_upload(empty=True)[0]
        self.assertIsInstance(result.record_result, Matched)
        self.assertEqual(result.get_id(), self.obj.pk)

    def test_actual_validation_does_not_reuse_hidden_witness(self):
        from specifyweb.backend.workbench.upload.upload_result import Uploaded
        self.restrict_preparation_read()
        before = self.snapshot()
        result = self.run_upload(no_commit=True)[0]
        self.assertIsInstance(result.record_result, Uploaded)
        self.assertEqual(self.snapshot(), before)

    def test_single_row_validation_does_not_reuse_hidden_witness(self):
        from specifyweb.backend.workbench.upload.upload_result import Uploaded
        self.restrict_preparation_read(create=False)
        before = self.snapshot()
        result = self.run_upload(single_row_validation=True)[0]
        self.assertIsInstance(result.record_result, Uploaded)
        self.assertEqual(self.snapshot(), before)

    def test_single_row_validation_absence_ignores_hidden_extra(self):
        from specifyweb.backend.workbench.upload.upload_result import Matched
        self.restrict_preparation_read(create=False)
        before = self.snapshot()
        result = self.run_upload(empty=True, single_row_validation=True)[0]
        self.assertIsInstance(result.record_result, Matched)
        self.assertEqual(result.get_id(), self.obj.pk)
        self.assertEqual(self.snapshot(), before)

    def snapshot(self):
        return {
            model.__name__: list(model.objects.order_by('pk').values())
            for model in (
                spmodels.Collectionobject, spmodels.Preparation,
                spmodels.Spauditlog, spmodels.Spauditlogfield,
            )
        }

    def test_denial_after_indirect_nonmatch_rolls_back_writes_and_audits(self):
        self.restrict_preparation_read(create=False)
        for allow_partial in (True, False):
            with self.subTest(allow_partial=allow_partial):
                before = self.snapshot()
                with self.assertRaises(permissions.NoMatchingRuleException):
                    self.run_upload(allow_partial=allow_partial, earlier_row=True)
                self.assertEqual(self.snapshot(), before)


class IndirectImportTreeMatchingTests(ScopedPermissionTestBase):
    def setUp(self):
        super().setUp()
        self.grant_access(self.collection)
        self.grant(self.collection, '/table/%', '%')
        self.geographytreedef.discipline = self.discipline
        self.geographytreedef.save()
        root_item = self.geographytreedef.treedefitems.get(name='Planet')
        middle_item = self.geographytreedef.treedefitems.create(
            name='Continent', rankid=100, parent=root_item,
        )
        leaf_item = self.geographytreedef.treedefitems.create(
            name='Country', rankid=200, parent=middle_item,
        )
        self.root = spmodels.Geography.objects.create(
            name='Earth', definition=self.geographytreedef, definitionitem=root_item,
        )
        self.middle = spmodels.Geography.objects.create(
            name='Middle', definition=self.geographytreedef,
            definitionitem=middle_item, parent=self.root,
        )
        self.leaf = spmodels.Geography.objects.create(
            name='Target', definition=self.geographytreedef,
            definitionitem=leaf_item, parent=self.middle,
        )
        discipline = spmodels.Discipline.objects.create(
            division=self.division, datatype=self.datatype,
            geographytreedef=self.geographytreedef,
            geologictimeperiodtreedef=self.geologictimeperiodtreedef,
        )
        self.other_collection.discipline = discipline
        self.other_collection.save()
        self.other_definition = spmodels.Geographytreedef.objects.create(discipline=discipline)
        self.other_item = self.other_definition.treedefitems.create(name='Continent', rankid=100)

    def bound_tree(self):
        from specifyweb.backend.workbench.upload.auditor import Auditor, DEFAULT_AUDITOR_PROPS
        from specifyweb.backend.workbench.upload.upload_plan_schema import parse_plan
        return parse_plan({
            'baseTableName': 'Geography', 'uploadable': {'treeRecord': {'ranks': {
                'Planet': {'treeNodeCols': {'name': 'Planet'}},
                'Country': {'treeNodeCols': {'name': 'Country'}},
            }}},
        }).apply_scoping(self.collection).bind(
            {'Planet': 'Earth', 'Country': 'Target'}, self.agent.pk,
            Auditor(self.collection, DEFAULT_AUDITOR_PROPS, None, agent=self.agent), {},
        )

    def hide_middle(self):
        # Simulate a pre-existing cross-definition parent link.
        spmodels.Geography.objects.filter(pk=self.middle.pk).update(
            definition=self.other_definition, definitionitem=self.other_item,
        )

    def test_skipped_unreadable_ancestor_cannot_establish_tree_match(self):
        from specifyweb.backend.workbench.upload.upload_result import NoMatch
        self.hide_middle()
        self.assertIsInstance(self.bound_tree().match_row().record_result, NoMatch)

    def test_readable_skipped_ancestor_preserves_match(self):
        from specifyweb.backend.workbench.upload.upload_result import Matched
        result = self.bound_tree().match_row().record_result
        self.assertIsInstance(result, Matched)
        self.assertEqual(result.id, self.leaf.pk)

    def test_both_grants_enable_cross_scope_ancestor(self):
        self.hide_middle()
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/geography', 'read')
        self.assertEqual(self.bound_tree().match_row().get_id(), self.leaf.pk)

    def test_cached_tree_matches_recheck_ancestor_scope(self):
        from specifyweb.backend.workbench.upload.upload_result import NoMatch
        bound = self.bound_tree()
        trusted = bound._replace(auditor=bound.auditor._replace(agent=None))
        self.assertEqual(trusted.match_row().get_id(), self.leaf.pk)
        self.assertTrue(bound.cache)
        self.hide_middle()
        self.assertIsInstance(bound.match_row().record_result, NoMatch)

    def test_tree_ancestor_table_read_alone_is_insufficient(self):
        from specifyweb.backend.workbench.upload.upload_result import NoMatch
        self.hide_middle()
        self.grant(self.other_collection, '/table/geography', 'read')
        self.assertIsInstance(self.bound_tree().match_row().record_result, NoMatch)

    def test_tree_ancestor_collection_access_alone_is_insufficient(self):
        from specifyweb.backend.workbench.upload.upload_result import NoMatch
        self.hide_middle()
        self.grant_access(self.other_collection)
        self.assertIsInstance(self.bound_tree().match_row().record_result, NoMatch)


class UnuploadAuthorizationTests(ScopedPermissionTestBase):
    def setUp(self):
        super().setUp()
        self.grant_access(self.collection)
        self.allowed_obj = self.collectionobjects[0]
        self.restricted_obj = spmodels.Collectionobject.objects.create(
            collection=self.other_collection, catalognumber='restricted-unupload',
        )

    def uploaded_result(self, obj, *, to_many=None, additions=None):
        from specifyweb.backend.workbench.upload.upload_result import (
            ReportInfo, Uploaded, UploadResult,
        )
        return UploadResult(
            Uploaded(
                obj.pk,
                ReportInfo(obj.specify_model.name, [], None),
                [] if additions is None else additions,
            ),
            {},
            {} if to_many is None else to_many,
        )

    def snapshot(self):
        return {
            model.__name__: list(model.objects.order_by('pk').values())
            for model in (
                spmodels.Collectionobject, spmodels.Preparation,
                spmodels.Picklist, spmodels.Picklistitem,
                spmodels.Spauditlog, spmodels.Spauditlogfield,
            )
        }

    def grant_delete(self, collection, table):
        self.grant_access(collection)
        self.grant(collection, f'/table/{table}', 'delete')

    def test_unupload_checks_delete_in_actual_scope(self):
        from specifyweb.backend.workbench.upload.upload import unupload_record
        self.grant(self.collection, '/table/collectionobject', 'delete')
        before = self.snapshot()
        with self.assertRaises(permissions.NoMatchingRuleException):
            unupload_record(
                self.uploaded_result(self.restricted_obj), self.agent, self.collection,
            )
        self.assertEqual(self.snapshot(), before)

    def test_unupload_does_not_require_read_permission(self):
        from specifyweb.backend.workbench.upload.upload import unupload_record
        from specifyweb.backend.workbench.upload import auditcodes
        self.grant_delete(self.other_collection, 'collectionobject')
        unupload_record(
            self.uploaded_result(self.restricted_obj), self.agent, self.collection,
        )
        self.assertFalse(spmodels.Collectionobject.objects.filter(pk=self.restricted_obj.pk).exists())
        self.assertTrue(spmodels.Spauditlog.objects.filter(
            tablenum=self.restricted_obj.specify_model.tableId,
            recordid=self.restricted_obj.pk, action=auditcodes.REMOVE,
        ).exists())

    def test_import_delete_checks_actual_scope_without_requiring_read(self):
        from specifyweb.backend.workbench.upload.auditor import Auditor, DEFAULT_AUDITOR_PROPS
        from specifyweb.backend.workbench.upload.auditlog import auditlog
        from specifyweb.backend.workbench.upload.upload_table import UploadTable
        self.grant_delete(self.other_collection, 'collectionobject')
        bound = UploadTable(
            name='Collectionobject', wbcols={}, static={}, toOne={}, toMany={},
        ).apply_scoping(self.collection).bind(
            {}, self.agent.pk,
            Auditor(self.collection, DEFAULT_AUDITOR_PROPS, auditlog, agent=self.agent), {},
        )._replace(match_payload={
            'id': self.restricted_obj.pk,
            'version': self.restricted_obj.version,
            'ordernumber': None,
        })
        result = bound.delete_row()
        from specifyweb.backend.workbench.upload.upload_result import Deleted
        self.assertIsInstance(result.record_result, Deleted)
        self.assertFalse(spmodels.Collectionobject.objects.filter(pk=self.restricted_obj.pk).exists())

    def test_import_delete_denied_in_actual_scope(self):
        from specifyweb.backend.workbench.upload.auditor import Auditor, DEFAULT_AUDITOR_PROPS
        from specifyweb.backend.workbench.upload.auditlog import auditlog
        from specifyweb.backend.workbench.upload.upload_table import UploadTable
        self.grant(self.collection, '/table/collectionobject', 'delete')
        bound = UploadTable(
            name='Collectionobject', wbcols={}, static={}, toOne={}, toMany={},
        ).apply_scoping(self.collection).bind(
            {}, self.agent.pk,
            Auditor(self.collection, DEFAULT_AUDITOR_PROPS, auditlog, agent=self.agent), {},
        )._replace(match_payload={
            'id': self.restricted_obj.pk,
            'version': self.restricted_obj.version,
            'ordernumber': None,
        })
        before = self.snapshot()
        with self.assertRaises(permissions.NoMatchingRuleException):
            bound.delete_row()
        self.assertEqual(self.snapshot(), before)

    def test_import_delete_propagated_child_failure_rolls_back_dependent_deletions(self):
        from specifyweb.backend.workbench.upload.auditor import Auditor, DEFAULT_AUDITOR_PROPS
        from specifyweb.backend.workbench.upload.auditlog import auditlog
        from specifyweb.backend.workbench.upload.upload_table import UploadTable
        child = spmodels.Preparation.objects.create(
            collectionobject=self.restricted_obj,
            collectionmemberid=self.collection.pk, countamt=1,
            preptype=spmodels.Preptype.objects.create(
                name='import delete preparation type', collection=self.collection,
            ),
        )
        self.grant_delete(self.collection, 'preparation')
        parent_plan = UploadTable(
            name='Collectionobject', wbcols={}, static={}, toOne={}, toMany={
                'preparations': [UploadTable(
                    name='Preparation', wbcols={}, static={}, toOne={}, toMany={},
                )],
            },
        ).apply_scoping(self.collection).apply_batch_edit_pack({
            'self': {'id': self.restricted_obj.pk, 'version': self.restricted_obj.version},
            'to_many': {'preparations': [{
                'self': {'id': child.pk, 'version': child.version},
            }]},
        }).bind(
            {}, self.agent.pk,
            Auditor(self.collection, DEFAULT_AUDITOR_PROPS, auditlog, agent=self.agent), {},
        )
        before = self.snapshot()
        result = parent_plan.delete_row()
        from specifyweb.backend.workbench.upload.upload_result import PropagatedFailure
        self.assertIsInstance(result.record_result, PropagatedFailure)
        self.assertEqual(self.snapshot(), before)

    def test_nested_delete_denial_rolls_back_earlier_child_removal(self):
        from specifyweb.backend.workbench.upload.upload import unupload_record
        from specifyweb.backend.workbench.upload.upload_result import ReportInfo, UploadResult, Uploaded
        child = spmodels.Preparation.objects.create(
            collectionobject=self.restricted_obj,
            collectionmemberid=self.collection.pk, countamt=1,
            preptype=spmodels.Preptype.objects.create(
                name='unupload preparation type', collection=self.collection,
            ),
        )
        child_result = self.uploaded_result(child)
        parent_result = self.uploaded_result(
            self.restricted_obj, to_many={'preparations': [child_result]},
        )
        self.grant_delete(self.collection, 'preparation')
        before = self.snapshot()
        with self.assertRaises(permissions.NoMatchingRuleException):
            unupload_record(parent_result, self.agent, self.collection)
        self.assertEqual(self.snapshot(), before)

    def test_picklist_addition_delete_denial_rolls_back_parent(self):
        from specifyweb.backend.workbench.upload.upload import unupload_record
        from specifyweb.backend.workbench.upload.upload_result import PicklistAddition
        picklist = spmodels.Picklist.objects.create(
            name='restricted rollback picklist', collection=self.other_collection, type=0,
        )
        item = spmodels.Picklistitem.objects.create(
            picklist=picklist, title='new', value='new',
        )
        addition = PicklistAddition(picklist.name, 'new', 'New', item.pk)
        self.grant_delete(self.collection, 'collectionobject')
        before = self.snapshot()
        with self.assertRaises(permissions.NoMatchingRuleException):
            unupload_record(
                self.uploaded_result(self.allowed_obj, additions=[addition]),
                self.agent, self.collection,
            )
        self.assertEqual(self.snapshot(), before)

    def make_dataset(self, results, *, isupdate=False, uploadresult=None):
        import json
        from specifyweb.backend.workbench.models import Spdataset
        return Spdataset.objects.create(
            name='unupload authorization',
            collection=self.collection,
            specifyuser=self.specifyuser,
            columns=[],
            data=[],
            rowresults=json.dumps([result.to_json() for result in results]),
            uploadresult={'success': True} if uploadresult is None else uploadresult,
            isupdate=isupdate,
        )

    def test_dataset_unupload_denial_rolls_back_prior_rows_and_audits(self):
        from specifyweb.backend.workbench.upload.upload import unupload_dataset
        self.grant(self.collection, '/workbench/dataset', 'unupload')
        self.grant_delete(self.collection, 'collectionobject')
        dataset = self.make_dataset([
            self.uploaded_result(self.restricted_obj),
            self.uploaded_result(self.allowed_obj),
        ])
        before = self.snapshot()
        with self.assertRaises(permissions.NoMatchingRuleException):
            unupload_dataset(dataset, self.agent)
        self.assertEqual(self.snapshot(), before)
        dataset.refresh_from_db()
        self.assertIsNotNone(dataset.uploadresult)

    def test_unupload_rechecks_dataset_permission(self):
        from specifyweb.backend.workbench.upload.upload import unupload_dataset
        dataset = self.make_dataset([self.uploaded_result(self.allowed_obj)])
        before = self.snapshot()
        with self.assertRaises(permissions.NoMatchingRuleException):
            unupload_dataset(dataset, self.agent)
        self.assertEqual(self.snapshot(), before)

    def test_batch_edit_unupload_requires_rollback_permission(self):
        from specifyweb.backend.workbench.upload.upload import unupload_dataset
        dataset = self.make_dataset([], isupdate=True)
        self.grant(self.collection, '/workbench/dataset', 'unupload')
        with self.assertRaises(permissions.NoMatchingRuleException):
            unupload_dataset(dataset, self.agent)
        self.grant(self.collection, '/batch_edit/dataset', 'rollback')
        unupload_dataset(dataset, self.agent)
        dataset.refresh_from_db()
        self.assertIsNone(dataset.uploadresult)

    def test_unupload_endpoint_rejects_dataset_from_another_collection(self):
        from unittest.mock import patch
        self.client.force_login(self.specifyuser)
        self.client.cookies['collection'] = str(self.collection.pk)
        self.grant(self.collection, '/workbench/dataset', 'unupload')
        dataset = self.make_dataset([self.uploaded_result(self.restricted_obj)])
        dataset.collection = self.other_collection
        dataset.save(update_fields=['collection'])
        with patch('specifyweb.backend.workbench.views.tasks.unupload.apply_async') as enqueue:
            response = self.client.post(f'/api/workbench/unupload/{dataset.pk}/')
        self.assertEqual(response.status_code, 400)
        enqueue.assert_not_called()

    def test_worker_rejects_dataset_from_another_collection(self):
        from django.core.exceptions import PermissionDenied
        from specifyweb.backend.workbench.tasks import unupload
        dataset = self.make_dataset([self.uploaded_result(self.allowed_obj)])
        dataset.uploaderstatus = {'operation': 'unuploading', 'taskid': None}
        dataset.save(update_fields=['uploaderstatus'])
        with self.assertRaises(PermissionDenied):
            unupload.run(self.other_collection.pk, dataset.pk, self.agent.pk)

    def test_successful_dataset_unupload_checks_dataset_and_record_delete(self):
        from specifyweb.backend.workbench.upload.upload import unupload_dataset
        self.grant(self.collection, '/workbench/dataset', 'unupload')
        self.grant_delete(self.other_collection, 'collectionobject')
        dataset = self.make_dataset([self.uploaded_result(self.restricted_obj)])
        unupload_dataset(dataset, self.agent)
        self.assertFalse(spmodels.Collectionobject.objects.filter(pk=self.restricted_obj.pk).exists())
        dataset.refresh_from_db()
        self.assertIsNone(dataset.uploadresult)


class ImportReadAuthorizationTests(ScopedPermissionTestBase):
    def setUp(self):
        super().setUp()
        self.grant_access(self.collection)
        self.grant(self.collection, '/table/%', '%')
        self.obj = self.collectionobjects[0]
        self.obj.remarks = 'existing-import-record'
        self.obj.save()

    def snapshot(self):
        return {
            model.__name__: list(model.objects.order_by('pk').values())
            for model in (
                spmodels.Collectionobject, spmodels.Collectionobjectattribute,
                spmodels.Geography,
                spmodels.Spauditlog, spmodels.Spauditlogfield,
            )
        }

    def upload(self, *, rows=None, static=None, disambiguations=None, no_commit=False):
        from specifyweb.backend.workbench.upload.upload import do_upload
        from specifyweb.backend.workbench.upload.upload_table import UploadTable
        from specifyweb.backend.workbench.upload.upload_plan_schema import parse_column_options

        plan = UploadTable(
            name='Collectionobject', wbcols={'remarks': parse_column_options('Remarks')},
            static={} if static is None else static, toOne={}, toMany={},
        )
        return do_upload(
            self.collection, [{'Remarks': self.obj.remarks}] if rows is None else rows,
            plan, self.agent.pk, disambiguations=disambiguations, no_commit=no_commit,
        )

    def assert_denied_unchanged(self, operation):
        before = self.snapshot()
        with self.assertRaises(permissions.NoMatchingRuleException):
            operation()
        self.assertEqual(self.snapshot(), before)

    def deny_read(self):
        models.UserPolicy.objects.filter(resource='/table/%').delete()
        self.grant(self.collection, '/table/%', 'create')

    def test_natural_match_requires_record_read(self):
        self.deny_read()
        self.assert_denied_unchanged(self.upload)

    def test_disambiguated_match_requires_actual_collection_access(self):
        from specifyweb.backend.workbench.upload.disambiguation import DisambiguationInfo
        restricted = spmodels.Collectionobject.objects.create(
            collection=self.other_collection, remarks='restricted-import',
        )
        self.grant(self.other_collection, '/table/%', 'read')
        self.assert_denied_unchanged(lambda: self.upload(
            disambiguations=[DisambiguationInfo({(): restricted.pk})],
        ))

    def test_disambiguated_match_requires_read_not_just_access(self):
        from specifyweb.backend.workbench.upload.disambiguation import DisambiguationInfo
        restricted = spmodels.Collectionobject.objects.create(
            collection=self.other_collection, remarks='restricted-import',
        )
        self.grant_access(self.other_collection)
        self.assert_denied_unchanged(lambda: self.upload(
            disambiguations=[DisambiguationInfo({(): restricted.pk})],
        ))

    def test_disambiguation_denial_rolls_back_earlier_row(self):
        from specifyweb.backend.workbench.upload.disambiguation import DisambiguationInfo
        restricted = spmodels.Collectionobject.objects.create(collection=self.other_collection)
        self.assert_denied_unchanged(lambda: self.upload(
            rows=[{'Remarks': 'new-import-row'}, {'Remarks': 'restricted'}],
            disambiguations=[None, DisambiguationInfo({(): restricted.pk})],
        ))

    def test_explicit_static_fk_requires_target_read(self):
        attribute = spmodels.Collectionobjectattribute.objects.create(
            collectionmemberid=self.other_collection.pk,
        )
        self.assert_denied_unchanged(lambda: self.upload(
            rows=[{'Remarks': 'new-import-row'}],
            static={'collectionobjectattribute_id': attribute.pk},
        ))

    def test_allowed_reference_requires_read_not_update(self):
        attribute = spmodels.Collectionobjectattribute.objects.create(
            collectionmemberid=self.other_collection.pk,
        )
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/collectionobjectattribute', 'read')
        result = self.upload(
            rows=[{'Remarks': 'new-import-row'}],
            static={'collectionobjectattribute_id': attribute.pk},
        )
        created = spmodels.Collectionobject.objects.get(pk=result[0].get_id())
        self.assertEqual(created.collectionobjectattribute_id, attribute.pk)

    def test_validation_still_checks_match_read_access(self):
        self.deny_read()
        self.assert_denied_unchanged(lambda: self.upload(no_commit=True))

    def test_matching_does_not_require_create_or_update(self):
        from specifyweb.backend.workbench.upload.upload_result import Matched
        models.UserPolicy.objects.filter(resource='/table/%').delete()
        self.grant(self.collection, '/table/%', 'read')
        result = self.upload()
        self.assertIsInstance(result[0].record_result, Matched)
        self.assertEqual(result[0].get_id(), self.obj.pk)

    def test_creation_rechecks_actual_scope(self):
        self.assert_denied_unchanged(lambda: self.upload(
            rows=[{'Remarks': 'new-import-row'}],
            static={'collectionmemberid': self.other_collection.pk},
        ))

    def test_multiple_matches_require_read(self):
        spmodels.Collectionobject.objects.create(
            collection=self.collection, remarks=self.obj.remarks,
        )
        self.deny_read()
        self.assert_denied_unchanged(self.upload)

    def test_create_without_record_read_is_preserved(self):
        from specifyweb.backend.workbench.upload.upload_result import Uploaded
        self.deny_read()
        result = self.upload(rows=[{'Remarks': 'new-import-row'}])
        self.assertIsInstance(result[0].record_result, Uploaded)

    def test_one_to_one_match_requires_related_read(self):
        from specifyweb.backend.workbench.upload.upload import do_upload
        from specifyweb.backend.workbench.upload.upload_table import UploadTable, OneToOneTable
        from specifyweb.backend.workbench.upload.upload_plan_schema import parse_column_options
        attribute = spmodels.Collectionobjectattribute.objects.create(
            collectionmemberid=self.collection.pk, number1=42,
        )
        models.UserPolicy.objects.filter(resource='/table/%').delete()
        self.grant(self.collection, '/table/collectionobject', '%')
        self.grant(self.collection, '/table/collectionobjectattribute', 'create')
        self.obj.collectionobjectattribute = attribute
        self.obj.save()
        plan = UploadTable(
            name='Collectionobject', wbcols={'remarks': parse_column_options('Remarks')},
            static={}, toMany={}, toOne={
                'collectionobjectattribute': OneToOneTable(
                    name='Collectionobjectattribute',
                    wbcols={'number1': parse_column_options('Number')},
                    static={}, toOne={}, toMany={},
                ),
            },
        )
        self.assert_denied_unchanged(lambda: do_upload(
            self.collection, [{'Remarks': self.obj.remarks, 'Number': '42'}],
            plan, self.agent.pk,
        ))

    def bound_table(self):
        from specifyweb.backend.workbench.upload.auditor import Auditor, DEFAULT_AUDITOR_PROPS
        from specifyweb.backend.workbench.upload.auditlog import auditlog
        from specifyweb.backend.workbench.upload.upload_table import UploadTable
        return UploadTable(
            name='Collectionobject', wbcols={}, static={}, toOne={}, toMany={},
        ).apply_scoping(self.collection).bind(
            {}, self.agent.pk,
            Auditor(self.collection, DEFAULT_AUDITOR_PROPS, auditlog, agent=self.agent), {},
        )

    def test_cached_matches_recheck_read(self):
        from specifyweb.backend.workbench.upload.predicates import DjangoPredicates
        from specifyweb.backend.workbench.upload.upload_result import ReportInfo
        bound = self.bound_table()
        predicates = DjangoPredicates(filters={'id': self.obj.pk})
        bound.cache[predicates.get_cache_key(bound.name)] = [self.obj.pk]
        self.deny_read()
        self.assert_denied_unchanged(lambda: bound._match(
            predicates, ReportInfo(bound.name, [], None),
        ))

    def test_clone_requires_source_read(self):
        from django.db import transaction
        bound = self.bound_table()._replace(match_payload={'id': self.obj.pk})
        self.deny_read()
        with transaction.atomic():
            self.assert_denied_unchanged(lambda: bound._do_clone({'remarks': 'cloned'}))

    def test_clone_requires_dependent_source_read(self):
        from django.db import transaction
        attribute = spmodels.Collectionobjectattribute.objects.create(
            collectionmemberid=self.other_collection.pk,
        )
        self.obj.collectionobjectattribute = attribute
        self.obj.save()
        bound = self.bound_table()._replace(match_payload={'id': self.obj.pk})
        with transaction.atomic():
            self.assert_denied_unchanged(lambda: bound._do_clone({'remarks': 'cloned'}))

    def test_authorized_clone_preserves_original(self):
        bound = self.bound_table()._replace(match_payload={'id': self.obj.pk})
        copied = bound._do_clone({'remarks': 'cloned', 'catalognumber': 'import-clone'})
        self.obj.refresh_from_db()
        self.assertNotEqual(copied.pk, self.obj.pk)
        self.assertEqual(self.obj.remarks, 'existing-import-record')
        self.assertEqual(copied.remarks, 'cloned')

    def tree_plan(self):
        from specifyweb.backend.workbench.upload.upload_plan_schema import parse_plan
        return parse_plan({
            'baseTableName': 'Geography',
            'uploadable': {'treeRecord': {'ranks': {
                'Planet': {'treeNodeCols': {'name': 'Planet'}},
            }}},
        })

    def tree_node(self):
        return spmodels.Geography.objects.create(
            name='Earth', definition=self.geographytreedef,
            definitionitem=self.geographytreedef.treedefitems.get(name='Planet'),
        )

    def test_tree_match_requires_read(self):
        from specifyweb.backend.workbench.upload.upload import do_upload
        self.tree_node()
        self.deny_read()
        self.assert_denied_unchanged(lambda: do_upload(
            self.collection, [{'Planet': 'Earth'}], self.tree_plan(), self.agent.pk,
        ))

    def test_tree_disambiguation_requires_actual_scope_read(self):
        from specifyweb.backend.workbench.upload.upload import do_upload
        from specifyweb.backend.workbench.upload.disambiguation import DisambiguationInfo
        other_discipline = spmodels.Discipline.objects.create(
            division=self.division, datatype=self.datatype,
            geographytreedef=self.geographytreedef,
            geologictimeperiodtreedef=self.geologictimeperiodtreedef,
        )
        self.other_collection.discipline = other_discipline
        self.other_collection.save()
        definition = spmodels.Geographytreedef.objects.create(discipline=other_discipline)
        item = definition.treedefitems.create(name='Planet', rankid=0)
        node = spmodels.Geography.objects.create(
            name='Restricted', definition=definition, definitionitem=item,
        )
        self.assert_denied_unchanged(lambda: do_upload(
            self.collection, [{'Planet': 'Earth'}], self.tree_plan(), self.agent.pk,
            disambiguations=[DisambiguationInfo({('$Planet',): node.pk})],
        ))

    def test_tree_existing_null_fallback_requires_read(self):
        from specifyweb.backend.workbench.upload.auditor import Auditor, DEFAULT_AUDITOR_PROPS
        node = self.tree_node()
        bound = self.tree_plan().apply_scoping(self.collection).bind(
            {'Planet': ''}, self.agent.pk,
            Auditor(self.collection, DEFAULT_AUDITOR_PROPS, None, agent=self.agent), {},
        )
        self.deny_read()
        self.assert_denied_unchanged(lambda: bound.process_with_existing(node.pk))

    def test_tree_reference_requires_read_before_clone(self):
        from specifyweb.backend.workbench.upload.upload import do_upload
        from specifyweb.backend.workbench.upload.treerecord import RANK_KEY_DELIMITER
        node = self.tree_node()
        key = RANK_KEY_DELIMITER.join((
            self.geographytreedef.name, 'Planet', str(self.geographytreedef.pk),
        ))
        self.deny_read()
        self.assert_denied_unchanged(lambda: do_upload(
            self.collection, [{'Planet': 'Other'}], self.tree_plan(), self.agent.pk,
            batch_edit_packs=[{'to_one': {
                key: {'self': {'id': node.pk, 'version': node.version}},
            }}],
        ))

    def test_authorized_tree_match_is_preserved(self):
        from specifyweb.backend.workbench.upload.upload import do_upload
        node = self.tree_node()
        result = do_upload(
            self.collection, [{'Planet': 'Earth'}], self.tree_plan(), self.agent.pk,
        )
        self.assertEqual(result[0].get_id(), node.pk)


class BatchEditWriteAuthorizationTests(ScopedPermissionTestBase):
    def setUp(self):
        super().setUp()
        self.grant_access(self.collection)
        self.grant(self.collection, '/table/%', '%')
        self.grant(self.collection, '/field/%', 'update')
        self.obj = self.collectionobjects[0]

    def snapshot(self):
        return {
            model.__name__: list(model.objects.order_by('pk').values())
            for model in (
                spmodels.Collectionobject, spmodels.Collectionobjectattribute,
                spmodels.Fieldnotebook, spmodels.Fieldnotebookpageset, spmodels.Fieldnotebookpage,
                spmodels.Spauditlog, spmodels.Spauditlogfield,
            )
        }

    def upload(self, objects=None, *, no_commit=False, allow_partial=True, rows=None):
        from specifyweb.backend.workbench.upload.upload import do_upload
        from specifyweb.backend.workbench.upload.upload_plan_schema import parse_plan
        plan = parse_plan({
            'baseTableName': 'collectionobject', 'uploadable': {'uploadTable': {
                'wbcols': {'remarks': 'Remarks', **({'text1': 'Text'} if rows is not None else {})},
                'static': {}, 'toOne': {}, 'toMany': {},
            }},
        })
        objects = [self.obj] if objects is None else objects
        return do_upload(
            self.collection, [{'Remarks': 'changed'} for obj in objects] if rows is None else rows,
            plan, self.agent.pk, no_commit=no_commit, allow_partial=allow_partial,
            batch_edit_packs=[{'self': {
                'id': obj.pk, 'version': obj.version, 'ordernumber': None,
            }} for obj in objects],
        )

    def bound_update(self, obj, changes):
        from specifyweb.backend.workbench.upload.auditor import Auditor, DEFAULT_AUDITOR_PROPS
        from specifyweb.backend.workbench.upload.auditlog import auditlog
        from specifyweb.backend.workbench.upload.upload_table import BoundUpdateTable
        from specifyweb.specify.utils.field_change_info import FieldChangeInfo
        from django.db import transaction

        bound = BoundUpdateTable(
            name=obj.__class__.__name__, static={}, parsedFields=[], toOne={}, toMany={},
            preserveIdentity=True, scopingAttrs={}, disambiguation=None,
            uploadingAgentId=self.agent.pk,
            auditor=Auditor(self.collection, DEFAULT_AUDITOR_PROPS, auditlog, agent=self.agent),
            cache={}, to_one_fields={}, match_payload=None, strong_ignore=[],
        )
        dirty = [FieldChangeInfo(
            field_name=name,
            old_value=getattr(obj, name), new_value=value,
        ) for name, value in changes.items()]
        with transaction.atomic():
            return bound._do_update(obj, dirty, **changes)

    def assert_denied_unchanged(self, operation):
        before = self.snapshot()
        with self.assertRaises(permissions.NoMatchingRuleException):
            operation()
        self.assertEqual(self.snapshot(), before)

    def test_commit_requires_field_permission(self):
        models.UserPolicy.objects.filter(resource='/field/%').delete()
        self.assert_denied_unchanged(self.upload)

    def test_unrelated_field_permission_does_not_authorize_commit(self):
        models.UserPolicy.objects.filter(resource='/field/%').delete()
        self.grant(self.collection, '/field/collectionobject/text1', 'update')
        self.assert_denied_unchanged(self.upload)

    def test_commit_requires_table_update(self):
        models.UserPolicy.objects.filter(resource='/table/%').delete()
        self.grant(self.collection, '/table/%', 'read')
        self.assert_denied_unchanged(self.upload)

    def test_revoked_field_permission_is_rechecked_at_commit(self):
        self.upload()
        self.obj.refresh_from_db()
        self.obj.remarks = 'reset'
        self.obj.save()
        models.UserPolicy.objects.filter(resource='/field/%').delete()
        self.assert_denied_unchanged(self.upload)

    def test_mixed_rows_permission_denial_rolls_back_first_update(self):
        self.assert_mixed_field_denial(allow_partial=True)

    def test_mixed_rows_without_partial_also_roll_back(self):
        self.assert_mixed_field_denial(allow_partial=False)

    def assert_mixed_field_denial(self, *, allow_partial):
        second = spmodels.Collectionobject.objects.create(
            collection=self.collection, catalognumber='second-batch-write', remarks='keep',
        )
        self.obj.text1 = 'keep'
        self.obj.save()
        models.UserPolicy.objects.filter(resource='/field/%').delete()
        self.grant(self.collection, '/field/collectionobject/remarks', 'update')
        self.assert_denied_unchanged(lambda: self.upload(
            [self.obj, second], allow_partial=allow_partial,
            rows=[{'Remarks': 'changed', 'Text': 'keep'},
                  {'Remarks': 'keep', 'Text': 'changed'}],
        ))

    def test_authorized_commit_updates_and_audits(self):
        from specifyweb.backend.workbench.upload.upload_result import Updated
        results = self.upload()
        self.assertIsInstance(results[0].record_result, Updated)
        self.obj.refresh_from_db()
        self.assertEqual(self.obj.remarks, 'changed')
        self.assertTrue(spmodels.Spauditlog.objects.filter(
            tablenum=self.obj.specify_model.tableId, recordid=self.obj.pk,
        ).exists())

    def test_validation_preserves_existing_write_permission_skip(self):
        models.UserPolicy.objects.filter(resource='/field/%').delete()
        before = self.snapshot()
        self.upload(no_commit=True)
        self.assertEqual(self.snapshot(), before)

    def test_unchanged_record_requires_current_read_permission(self):
        self.obj.remarks = 'changed'
        self.obj.save()
        models.UserPolicy.objects.filter(resource='/table/%').delete()
        self.grant(self.collection, '/table/%', 'update')
        self.assert_denied_unchanged(self.upload)

    def upload_nested(self):
        from specifyweb.backend.workbench.upload.upload import do_upload
        from specifyweb.backend.workbench.upload.upload_plan_schema import parse_plan
        attribute = self.obj.collectionobjectattribute
        plan = parse_plan({
            'baseTableName': 'collectionobject', 'uploadable': {'uploadTable': {
                'wbcols': {'remarks': 'Remarks'}, 'static': {}, 'toMany': {},
                'toOne': {'collectionobjectattribute': {'uploadTable': {
                    'wbcols': {'number1': 'Number'}, 'static': {}, 'toOne': {}, 'toMany': {},
                }}},
            }},
        })
        return do_upload(
            self.collection, [{'Remarks': 'changed', 'Number': '123'}], plan, self.agent.pk,
            batch_edit_packs=[{
                'self': {'id': self.obj.pk, 'version': self.obj.version, 'ordernumber': None},
                'to_one': {'collectionobjectattribute': {'self': {
                    'id': attribute.pk, 'version': attribute.version, 'ordernumber': None,
                }}},
            }],
        )

    def setup_nested_attribute(self):
        attribute = spmodels.Collectionobjectattribute.objects.create(
            collectionmemberid=self.collection.pk,
        )
        self.obj.collectionobjectattribute = attribute
        self.obj.save()
        return attribute

    def test_nested_update_requires_source_relationship_permission(self):
        self.setup_nested_attribute()
        models.UserPolicy.objects.filter(resource='/field/%').delete()
        self.grant(self.collection, '/field/collectionobject/remarks', 'update')
        self.grant(self.collection, '/field/collectionobjectattribute/%', 'update')
        self.assert_denied_unchanged(self.upload_nested)

    def test_nested_writes_roll_back_on_later_scalar_field_denial(self):
        self.setup_nested_attribute()
        models.UserPolicy.objects.filter(resource='/field/%').delete()
        self.grant(self.collection, '/field/collectionobject/collectionobjectattribute', 'update')
        self.grant(self.collection, '/field/collectionobjectattribute/%', 'update')
        self.assert_denied_unchanged(self.upload_nested)

    def test_authorized_nested_update_is_preserved(self):
        attribute = self.setup_nested_attribute()
        self.upload_nested()
        attribute.refresh_from_db()
        self.assertEqual(attribute.number1, 123)

    def test_resulting_scope_requires_table_update(self):
        self.assert_denied_unchanged(lambda: self.bound_update(
            self.obj, {'collectionmemberid': self.other_collection.pk},
        ))

    def test_resulting_scope_requires_field_update(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/%', '%')
        self.assert_denied_unchanged(lambda: self.bound_update(
            self.obj, {'collectionmemberid': self.other_collection.pk},
        ))

    def test_allowed_scope_transition_updates_membership(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/%', '%')
        self.grant(self.other_collection, '/field/%', 'update')
        self.bound_update(self.obj, {'collectionmemberid': self.other_collection.pk})
        self.obj.refresh_from_db()
        self.assertEqual(permissions.Scoping.scope_for_record(self.obj), self.other_collection)

    def test_changed_fk_requires_target_read(self):
        attribute = spmodels.Collectionobjectattribute.objects.create(
            collectionmemberid=self.other_collection.pk,
        )
        self.assert_denied_unchanged(lambda: self.bound_update(
            self.obj, {'collectionobjectattribute_id': attribute.pk},
        ))

    def test_fk_read_does_not_require_target_update(self):
        attribute = spmodels.Collectionobjectattribute.objects.create(
            collectionmemberid=self.other_collection.pk,
        )
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/collectionobjectattribute', 'read')
        self.bound_update(self.obj, {'collectionobjectattribute_id': attribute.pk})
        self.obj.refresh_from_db()
        self.assertEqual(self.obj.collectionobjectattribute_id, attribute.pk)

    def test_fk_attname_uses_relationship_field_permission(self):
        attribute = spmodels.Collectionobjectattribute.objects.create(
            collectionmemberid=self.collection.pk,
        )
        models.UserPolicy.objects.filter(resource='/field/%').delete()
        self.grant(self.collection, '/field/collectionobject/collectionobjectattribute', 'update')
        self.bound_update(self.obj, {'collectionobjectattribute_id': attribute.pk})
        self.obj.refresh_from_db()
        self.assertEqual(self.obj.collectionobjectattribute_id, attribute.pk)

    def notebook_scope_change(self, *, original_children=True, destination_children=True):
        destination = spmodels.Discipline.objects.create(
            division=self.division, datatype=self.datatype,
            geographytreedef=self.geographytreedef,
            geologictimeperiodtreedef=self.geologictimeperiodtreedef,
        )
        self.other_collection.discipline = destination
        self.other_collection.save()
        notebook = spmodels.Fieldnotebook.objects.create(
            discipline=self.discipline, collection=self.collection, owneragent=self.agent,
        )
        pageset = spmodels.Fieldnotebookpageset.objects.create(
            fieldnotebook=notebook, discipline=self.discipline,
        )
        page = spmodels.Fieldnotebookpage.objects.create(
            pageset=pageset, discipline=self.discipline,
        )
        models.UserPolicy.objects.filter(resource='/table/%').delete()
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/field/%', 'update')
        for collection, children in (
            (self.collection, original_children), (self.other_collection, destination_children),
        ):
            self.grant(collection, '/table/fieldnotebook', 'update')
            self.grant(collection, '/table/discipline', 'read')
            if children:
                self.grant(collection, '/table/fieldnotebookpageset', 'update')
                self.grant(collection, '/table/fieldnotebookpage', 'update')
        return notebook, page, destination

    def test_inherited_descendant_requires_original_scope_update(self):
        notebook, _, destination = self.notebook_scope_change(original_children=False)
        self.assert_denied_unchanged(lambda: self.bound_update(
            notebook, {'discipline_id': destination.pk},
        ))

    def test_inherited_descendant_requires_destination_scope_update(self):
        notebook, _, destination = self.notebook_scope_change(destination_children=False)
        self.assert_denied_unchanged(lambda: self.bound_update(
            notebook, {'discipline_id': destination.pk},
        ))

    def test_authorized_inherited_scope_change_is_preserved(self):
        notebook, page, destination = self.notebook_scope_change()
        self.bound_update(notebook, {'discipline_id': destination.pk})
        page.refresh_from_db()
        self.assertEqual(permissions.Scoping.scope_for_record(page), destination)


class BatchEditPreparationAuthorizationApiTests(ScopedPermissionTestBase):
    def setUp(self):
        super().setUp()
        self.client.force_login(self.specifyuser)
        self.client.cookies['collection'] = str(self.collection.pk)
        self.grant_access(self.collection)
        self.grant(self.collection, '%', '%')
        self.restricted = spmodels.Collectionobject.objects.create(
            collection=self.other_collection, catalognumber='restricted-batch',
        )
        self.preptype = spmodels.Preptype.objects.create(
            collection=self.collection, name='Batch prep', isloanable=False,
        )
        self.preparation = spmodels.Preparation.objects.create(
            collectionobject=self.collectionobjects[0], preptype=self.preptype,
            collectionmemberid=self.other_collection.pk, remarks='restricted data',
        )
        self.source_rows = [(self.collectionobjects[0], None)]

    def snapshot(self):
        from specifyweb.backend.workbench.models import Spdataset
        return {
            model.__name__: list(model.objects.order_by('pk').values())
            for model in (Spdataset, spmodels.Collectionobject, spmodels.Preparation,
                          spmodels.Spauditlog, spmodels.Spauditlogfield)
        }

    def execute_rows(self, **kwargs):
        rows = []
        for obj, preparation in self.source_rows:
            values = [obj.pk]
            for query_field in kwargs['query_fields']:
                spec = query_field.fieldspec
                source = obj if spec.table.name.lower() == 'collectionobject' else preparation
                field = spec.get_field()
                values.append(
                    None if source is None else (
                        source.pk if field.name == spec.table.idFieldName
                        else getattr(source, field.name.lower())
                    )
                )
            rows.append(tuple(values))
        return {'results': rows}

    def post(self, *, related=False, recordset=None, paths=None):
        from specifyweb.backend.stored_queries.queryfieldspec import QueryFieldSpec

        paths = [('Collectionobject', 'text1')] if paths is None else list(paths)
        if related:
            paths.append(('Collectionobject', 'preparations', 'remarks'))
        fields = [{
            'stringid': QueryFieldSpec.from_path(path).to_stringid(),
            'isrelfld': False, 'operstart': 8, 'startvalue': '',
            'isnot': False, 'isdisplay': True, 'sorttype': 0, 'position': index,
        } for index, path in enumerate(paths)]
        with (
            patch('specifyweb.backend.stored_queries.batch_edit.execute', side_effect=self.execute_rows),
            patch('specifyweb.backend.stored_queries.batch_edit.get_all_tree_information', return_value={}),
        ):
            response = self.client.post('/stored_query/batch_edit/', data={
                'name': 'Authorization batch', 'contexttableid': 1, 'fields': fields,
                **({} if recordset is None else {'recordsetid': recordset.pk}),
            }, content_type='application/json')
        self.assertNotEqual(response.status_code, 500, response.content.decode()[:1500])
        return response

    def assert_denied_unchanged(self, **options):
        before = self.snapshot()
        self.assertEqual(self.post(**options).status_code, 403)
        self.assertEqual(self.snapshot(), before)

    def test_restricted_base_record_does_not_create_dataset_or_backup(self):
        self.source_rows = [(self.restricted, None)]
        self.assert_denied_unchanged()

    def test_mixed_base_rows_do_not_create_partial_dataset(self):
        self.source_rows.append((self.restricted, None))
        self.assert_denied_unchanged()

    def test_base_read_without_collection_access_does_not_authorize(self):
        self.grant(self.other_collection, '/table/collectionobject', 'read')
        self.source_rows = [(self.restricted, None)]
        self.assert_denied_unchanged()

    def test_collection_access_without_base_read_does_not_authorize(self):
        self.grant_access(self.other_collection)
        self.source_rows = [(self.restricted, None)]
        self.assert_denied_unchanged()

    def test_related_record_requires_read_in_actual_scope(self):
        self.source_rows = [(self.collectionobjects[0], self.preparation)]
        self.assert_denied_unchanged(related=True)

    def test_related_read_without_access_does_not_authorize(self):
        self.grant(self.other_collection, '/table/preparation', 'read')
        self.source_rows = [(self.collectionobjects[0], self.preparation)]
        self.assert_denied_unchanged(related=True)

    def test_related_access_without_read_does_not_authorize(self):
        self.grant_access(self.other_collection)
        self.source_rows = [(self.collectionobjects[0], self.preparation)]
        self.assert_denied_unchanged(related=True)

    def test_authorized_base_creates_dataset_and_backup(self):
        from specifyweb.backend.workbench.models import Spdataset
        before = Spdataset.objects.count()
        response = self.post()
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Spdataset.objects.count(), before + 2)
        dataset = Spdataset.objects.get(pk=response.json()['id'])
        self.assertTrue(dataset.isupdate)
        self.assertIsNotNone(dataset.backer)

    def test_authorized_related_scope_preserves_data(self):
        from specifyweb.backend.workbench.models import Spdataset
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/preparation', 'read')
        self.source_rows = [(self.collectionobjects[0], self.preparation)]
        response = self.post(related=True)
        self.assertEqual(response.status_code, 201)
        self.assertIn('restricted data', str(Spdataset.objects.get(pk=response.json()['id']).data))

    def test_null_related_record_is_allowed(self):
        self.assertEqual(self.post(related=True).status_code, 201)

    def test_related_to_one_record_requires_actual_scope_read(self):
        attribute = spmodels.Collectionobjectattribute.objects.create(
            collectionmemberid=self.other_collection.pk, text1='restricted attribute',
        )
        self.source_rows = [(self.collectionobjects[0], attribute)]
        self.assert_denied_unchanged(paths=[
            ('Collectionobject', 'collectionobjectattribute', 'text1'),
        ])

    def test_authorized_cross_collection_base_is_preserved(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/collectionobject', 'read')
        self.source_rows.append((self.restricted, None))
        self.assertEqual(self.post().status_code, 201)

    def test_restricted_recordset_cannot_select_readable_records(self):
        recordset = spmodels.Recordset.objects.create(
            collectionmemberid=self.other_collection.pk, name='Restricted selection',
            dbtableid=1, type=0, specifyuser=self.specifyuser,
        )
        recordset.recordsetitems.create(recordid=self.collectionobjects[0].pk)
        self.assert_denied_unchanged(recordset=recordset)

    def test_authorized_recordset_selection_is_preserved(self):
        recordset = spmodels.Recordset.objects.create(
            collectionmemberid=self.collection.pk, name='Readable selection',
            dbtableid=1, type=0, specifyuser=self.specifyuser,
        )
        recordset.recordsetitems.create(recordid=self.collectionobjects[0].pk)
        self.assertEqual(self.post(recordset=recordset).status_code, 201)

    def test_missing_source_record_does_not_create_dataset(self):
        obj = self.collectionobjects[0]
        obj.pk += 1000000
        before = self.snapshot()
        response = self.post()
        self.assertEqual(response.status_code, 404)
        self.assertEqual(self.snapshot(), before)

class BulkCreateAuthorizationApiTests(ScopedPermissionTestBase):
    def setUp(self):
        super().setUp()
        self.client.force_login(self.specifyuser)
        self.client.cookies['collection'] = str(self.collection.pk)
        self.grant_access(self.collection)
        self.grant(self.collection, '/table/%', '%')
        self.grant(self.collection, '/field/%', 'update')
        self.recordset = spmodels.Recordset.objects.create(
            collectionmemberid=self.collection.pk,
            dbtableid=spmodels.Collectionobject.specify_model.tableId,
            name='Bulk target', type=0, specifyuser=self.specifyuser,
        )

    def data(self, collection=None, **changes):
        collection = self.collection if collection is None else collection
        return {
            'collection': f'/api/specify/collection/{collection.pk}/',
            'text1': 'bulk-created', **changes,
        }

    def snapshot(self):
        return {
            model.__name__: list(model.objects.order_by('pk').values())
            for model in (
                spmodels.Collectionobject, spmodels.Collectionobjectattribute,
                spmodels.Recordset, spmodels.Recordsetitem,
                spmodels.Spauditlog, spmodels.Spauditlogfield,
            )
        }

    def post(self, data, *, copies=None, recordset=None, prefix='/bulk_copy/'):
        return self.client.post(
            f'{prefix}bulk/collectionobject/'
            + ('' if copies is None else f'{copies}/')
            + ('' if recordset is None else f'?recordsetid={recordset.pk}'),
            data=data, content_type='application/json',
        )

    def assert_denied_unchanged(self, data, **options):
        before = self.snapshot()
        self.assertEqual(self.post(data, **options).status_code, 403)
        self.assertEqual(self.snapshot(), before)

    def test_mixed_scope_batch_rolls_back_first_create_and_audit(self):
        self.assert_denied_unchanged([self.data(), self.data(self.other_collection)])

    def test_mixed_scope_legacy_alias_rolls_back_first_create(self):
        self.assert_denied_unchanged(
            [self.data(), self.data(self.other_collection)], prefix='/api/specify',
        )

    def test_target_read_without_create_does_not_authorize_batch(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/%', 'read')
        self.assert_denied_unchanged([self.data(), self.data(self.other_collection)])

    def test_target_create_without_access_does_not_authorize_batch(self):
        self.grant(self.other_collection, '/table/%', '%')
        self.assert_denied_unchanged([self.data(), self.data(self.other_collection)])

    def test_mixed_scope_batch_rolls_back_recordset_memberships(self):
        self.assert_denied_unchanged(
            [self.data(), self.data(self.other_collection)], recordset=self.recordset,
        )

    def test_later_nested_denial_rolls_back_prior_nested_create(self):
        self.assert_denied_unchanged([
            self.data(collectionobjectattribute={'text1': 'new attribute'}),
            self.data(self.other_collection),
        ])

    def test_later_fk_reference_denial_rolls_back_first_create(self):
        other_discipline = spmodels.Discipline.objects.create(
            division=self.division, datatype=self.datatype,
            geographytreedef=self.geographytreedef,
            geologictimeperiodtreedef=self.geologictimeperiodtreedef,
        )
        self.other_collection.discipline = other_discipline
        self.other_collection.save()
        restricted = spmodels.Collectingevent.objects.create(
            discipline=other_discipline,
        )
        self.assert_denied_unchanged([
            self.data(), self.data(collectingevent=f'/api/specify/collectingevent/{restricted.pk}/'),
        ])

    def test_batch_response_read_denial_rolls_back_created_records(self):
        models.UserPolicy.objects.filter(resource='/table/%').delete()
        self.grant(self.collection, '/table/%', 'create')
        self.grant(self.collection, '/table/collection', 'read')
        self.assert_denied_unchanged([self.data(), self.data()])

    def test_copy_response_read_denial_rolls_back_created_records(self):
        models.UserPolicy.objects.filter(resource='/table/%').delete()
        self.grant(self.collection, '/table/%', 'create')
        self.grant(self.collection, '/table/collection', 'read')
        self.assert_denied_unchanged(self.data(), copies=2)

    def test_repeated_copy_later_denial_rolls_back_previous_copies(self):
        from specifyweb.backend.permissions.permissions import NoMatchingRuleException
        from specifyweb.specify.api.crud import post_resource

        calls = 0

        def create_then_deny(*args, **kwargs):
            nonlocal calls
            calls += 1
            if calls == 2:
                raise NoMatchingRuleException([])
            return post_resource(*args, **kwargs)

        with patch(
            'specifyweb.backend.bulk_copy.bulk_copy.post_resource', side_effect=create_then_deny,
        ):
            self.assert_denied_unchanged(self.data(), copies=2, recordset=self.recordset)
        self.assertEqual(calls, 2)

    def test_later_nested_update_denial_restores_existing_related_record(self):
        attribute = spmodels.Collectionobjectattribute.objects.create(
            collectionmemberid=self.collection.pk, text1='original',
        )
        self.assert_denied_unchanged([
            self.data(collectionobjectattribute={
                'id': attribute.pk, 'version': attribute.version, 'text1': 'changed',
            }),
            self.data(self.other_collection),
        ])

    def test_later_explicit_primary_key_error_rolls_back_prior_create(self):
        before = self.snapshot()
        response = self.post([self.data(), self.data(id=self.collectionobjects[0].pk)])
        self.assertEqual(response.status_code, 400)
        self.assertEqual(self.snapshot(), before)

    def test_later_missing_reference_rolls_back_prior_create(self):
        before = self.snapshot()
        response = self.post([
            self.data(), self.data(collectingevent='/api/specify/collectingevent/2147483647/'),
        ])
        self.assertEqual(response.status_code, 404)
        self.assertEqual(self.snapshot(), before)

    def test_restricted_copy_destination_does_not_write(self):
        self.assert_denied_unchanged(self.data(self.other_collection), copies=2)

    def test_authorized_batch_returns_all_records_in_order(self):
        response = self.post([self.data(text1='first'), self.data(text1='second')])
        self.assertEqual(response.status_code, 201)
        self.assertEqual([obj['text1'] for obj in response.json()], ['first', 'second'])
        self.assertEqual(spmodels.Collectionobject.objects.filter(text1__in=['first', 'second']).count(), 2)

    def test_authorized_cross_collection_batch_uses_actual_scope(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/%', '%')
        self.grant(self.other_collection, '/field/%', 'update')
        response = self.post([self.data(), self.data(self.other_collection)])
        self.assertEqual(response.status_code, 201)
        self.assertEqual([
            spmodels.Collectionobject.objects.get(pk=obj['id']).collection_id
            for obj in response.json()
        ], [self.collection.pk, self.other_collection.pk])

    def test_authorized_copies_create_distinct_records_not_source_updates(self):
        source = self.collectionobjects[0]
        before = spmodels.Collectionobject.objects.filter(pk=source.pk).values().get()
        response = self.post(self.data(id=source.pk), copies=2)
        self.assertEqual(response.status_code, 201)
        ids = [obj['id'] for obj in response.json()]
        self.assertEqual(len(set(ids)), 2)
        self.assertNotIn(source.pk, ids)
        self.assertEqual(spmodels.Collectionobject.objects.filter(pk=source.pk).values().get(), before)

    def test_authorized_copies_append_all_memberships(self):
        response = self.post(self.data(), copies=2, recordset=self.recordset)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(
            set(self.recordset.recordsetitems.values_list('recordid', flat=True)),
            {obj['id'] for obj in response.json()},
        )

    def test_authorized_legacy_copy_alias_returns_all_copies(self):
        response = self.post(self.data(), copies=2, prefix='/api/specify')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(len(response.json()), 2)

    def test_unsupported_method_does_not_write(self):
        before = self.snapshot()
        self.assertEqual(self.client.get('/bulk_copy/bulk/collectionobject/').status_code, 405)
        self.assertEqual(self.client.get('/bulk_copy/bulk/collectionobject/2/').status_code, 405)
        self.assertEqual(self.snapshot(), before)

class RecordsetItemAuthorizationApiTests(ScopedPermissionTestBase):
    def setUp(self):
        super().setUp()
        self.client.force_login(self.specifyuser)
        self.client.cookies['collection'] = str(self.collection.pk)
        self.grant_access(self.collection)
        self.grant(self.collection, '/table/%', '%')
        self.grant(self.collection, '/field/%', 'update')
        self.recordset = self.make_recordset(self.collection)
        self.restricted_recordset = self.make_recordset(self.other_collection)
        self.item = self.recordset.recordsetitems.create(recordid=self.collectionobjects[0].pk)
        self.restricted_item = self.restricted_recordset.recordsetitems.create(
            recordid=self.collectionobjects[1].pk,
        )
        self.restricted_record = spmodels.Collectionobject.objects.create(
            collection=self.other_collection, catalognumber='restricted-member',
        )

    def make_recordset(self, collection):
        return spmodels.Recordset.objects.create(
            collectionmemberid=collection.pk,
            dbtableid=spmodels.Collectionobject.specify_model.tableId,
            name='Item operations', type=0, specifyuser=self.specifyuser,
        )

    def uri(self, obj):
        return f'/api/specify/{obj._meta.model_name}/{obj.pk}/'

    def snapshot(self):
        return {
            model.__name__: list(model.objects.order_by('pk').values())
            for model in (
                spmodels.Recordset, spmodels.Recordsetitem, spmodels.Collectionobject,
                spmodels.Spauditlog, spmodels.Spauditlogfield,
            )
        }

    def post(self, recordset=None, record=None):
        return self.client.post('/api/specify/recordsetitem/', data={
            'recordset': self.uri(self.recordset if recordset is None else recordset),
            'recordid': (self.collectionobjects[2] if record is None else record).pk,
        }, content_type='application/json')

    def put(self, item=None, **changes):
        return self.client.put(
            self.uri(self.item if item is None else item), data=changes,
            content_type='application/json',
        )

    def nested(self, items, recordset=None):
        recordset = self.recordset if recordset is None else recordset
        return self.client.put(self.uri(recordset), data={
            'version': recordset.version, 'name': 'nested change',
            'recordsetitems': items,
        }, content_type='application/json')

    def assert_denied_unchanged(self, operation):
        before = self.snapshot()
        self.assertEqual(operation().status_code, 403)
        self.assertEqual(self.snapshot(), before)

    def test_instance_scope_is_parent_collection(self):
        self.assertEqual(permissions.Scoping.scope_for_record(self.restricted_item), self.other_collection)

    def test_class_scope_is_collection(self):
        from specifyweb.specify.utils.scoping import ScopeType
        self.assertEqual(permissions.Scoping.scope_type_from_class(spmodels.Recordsetitem), ScopeType.COLLECTION)

    def test_restricted_item_read_is_denied(self):
        self.assertEqual(self.client.get(self.uri(self.restricted_item)).status_code, 403)

    def test_list_filters_before_count_and_pagination(self):
        response = self.client.get('/api/specify/recordsetitem/?domainfilter=false&limit=1')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['meta']['total_count'], 1)
        self.assertEqual([row['id'] for row in response.json()['objects']], [self.item.pk])

    def test_legacy_rows_filter_restricted_parent_scope(self):
        response = self.client.get(
            '/api/specify_rows/recordsetitem/?fields=id,recordid&domainfilter=false',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [[self.item.pk, self.item.recordid]])

    def test_modern_rows_filter_restricted_parent_scope(self):
        response = self.client.get(
            '/table_rows/specify_rows/recordsetitem/?fields=id,recordid&domainfilter=false',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [[self.item.pk, self.item.recordid]])

    def test_create_requires_parent_update(self):
        models.UserPolicy.objects.filter(resource='/table/%').delete()
        self.grant(self.collection, '/table/%', 'read')
        self.grant(self.collection, '/table/recordsetitem', 'create')
        self.assert_denied_unchanged(self.post)

    def test_create_requires_parent_relationship_field_update(self):
        models.UserPolicy.objects.filter(resource='/field/%').delete()
        self.assert_denied_unchanged(self.post)

    def test_create_requires_item_create_in_parent_scope(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/recordset', '%')
        self.grant(self.other_collection, '/field/%', 'update')
        self.assert_denied_unchanged(lambda: self.post(self.restricted_recordset))

    def test_create_requires_referenced_record_read(self):
        self.assert_denied_unchanged(lambda: self.post(record=self.restricted_record))

    def test_update_requires_referenced_record_read(self):
        self.assert_denied_unchanged(lambda: self.put(recordid=self.restricted_record.pk))

    def test_item_read_grant_requires_collection_access(self):
        self.grant(self.other_collection, '/table/recordsetitem', 'read')
        self.assertEqual(self.client.get(self.uri(self.restricted_item)).status_code, 403)

    def test_readable_parent_does_not_replace_item_read(self):
        models.UserPolicy.objects.filter(resource='/table/%').delete()
        self.grant(self.collection, '/table/recordset', 'read')
        self.assertEqual(self.client.get(self.uri(self.item)).status_code, 403)

    def test_noop_update_does_not_bypass_parent_scope(self):
        self.assert_denied_unchanged(lambda: self.put(self.restricted_item, order=1))

    def test_update_requires_parent_update_even_when_item_update_is_granted(self):
        models.UserPolicy.objects.filter(resource='/table/%').delete()
        self.grant(self.collection, '/table/%', 'read')
        self.grant(self.collection, '/table/recordsetitem', 'update')
        self.assert_denied_unchanged(lambda: self.put(order=1))

    def test_delete_requires_parent_update(self):
        models.UserPolicy.objects.filter(resource='/table/%').delete()
        self.grant(self.collection, '/table/%', 'read')
        self.grant(self.collection, '/table/recordsetitem', 'delete')
        self.assert_denied_unchanged(lambda: self.client.delete(self.uri(self.item)))

    def test_delete_requires_parent_relationship_field_update(self):
        models.UserPolicy.objects.filter(resource='/field/%').delete()
        self.assert_denied_unchanged(lambda: self.client.delete(self.uri(self.item)))

    def test_update_requires_parent_relationship_field_update(self):
        models.UserPolicy.objects.filter(resource='/field/%').delete()
        self.grant(self.collection, '/field/recordsetitem/%', 'update')
        self.assert_denied_unchanged(lambda: self.put(order=1))

    def test_delete_restricted_item_is_denied(self):
        self.assert_denied_unchanged(lambda: self.client.delete(self.uri(self.restricted_item)))

    def test_reparent_requires_original_parent_update(self):
        self.grant_access(self.other_collection)
        for action in ('read', 'update'):
            self.grant(self.other_collection, '/table/recordsetitem', action)
        self.assert_denied_unchanged(lambda: self.put(
            self.restricted_item, recordset=self.uri(self.recordset),
        ))

    def test_reparent_requires_destination_parent_update(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/%', 'read')
        self.grant(self.other_collection, '/table/recordsetitem', 'update')
        self.assert_denied_unchanged(lambda: self.put(recordset=self.uri(self.restricted_recordset)))

    def test_authorized_cross_collection_reparent_persists(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/%', '%')
        self.grant(self.other_collection, '/field/%', 'update')
        response = self.put(recordset=self.uri(self.restricted_recordset))
        self.assertEqual(response.status_code, 200)
        self.item.refresh_from_db()
        self.assertEqual(self.item.recordset_id, self.restricted_recordset.pk)
        self.assertEqual(permissions.Scoping.scope_for_record(self.item), self.other_collection)

    def test_reparent_requires_item_update_in_destination_scope(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/recordset', '%')
        self.grant(self.other_collection, '/field/%', 'update')
        self.assert_denied_unchanged(lambda: self.put(recordset=self.uri(self.restricted_recordset)))

    def test_missing_reference_returns_404_and_rolls_back(self):
        before = self.snapshot()
        response = self.put(recordid=self.restricted_record.pk + 1000000, order=7)
        self.assertEqual(response.status_code, 404)
        self.assertEqual(self.snapshot(), before)

    def test_invalid_reference_returns_400_and_rolls_back(self):
        before = self.snapshot()
        response = self.put(recordid='invalid', order=7)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(self.snapshot(), before)

    def test_nested_mixed_members_roll_back_all_changes(self):
        self.assert_denied_unchanged(lambda: self.nested([
            {'recordid': self.collectionobjects[2].pk},
            {'recordid': self.restricted_record.pk},
        ]))

    def test_nested_new_recordset_with_restricted_member_rolls_back(self):
        self.assert_denied_unchanged(lambda: self.client.post(
            '/api/specify/recordset/', data={
                'name': 'Denied', 'type': 0,
                'dbtableid': spmodels.Collectionobject.specify_model.tableId,
                'recordsetitems': [{'recordid': self.restricted_record.pk}],
            }, content_type='application/json',
        ))

    def test_nested_existing_item_update_checks_reference(self):
        self.assert_denied_unchanged(lambda: self.nested([
            {'id': self.item.pk, 'recordid': self.restricted_record.pk},
        ]))

    def test_nested_new_recordset_requires_create_not_parent_update(self):
        models.UserPolicy.objects.filter(resource='/table/%').delete()
        for action in ('read', 'create'):
            self.grant(self.collection, '/table/%', action)
        response = self.client.post('/api/specify/recordset/', data={
            'name': 'New set', 'type': 0,
            'dbtableid': spmodels.Collectionobject.specify_model.tableId,
            'recordsetitems': [{'recordid': self.collectionobjects[2].pk}],
        }, content_type='application/json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(spmodels.Recordset.objects.get(pk=response.json()['id'])
                         .recordsetitems.get().recordid, self.collectionobjects[2].pk)

    def test_nested_recordsets_require_inner_recordset_read(self):
        self.recordset.dbtableid = spmodels.Recordset.specify_model.tableId
        self.recordset.save()
        self.assert_denied_unchanged(lambda: self.post(record=self.restricted_recordset))

    def test_shared_discipline_reference_is_allowed(self):
        self.recordset.dbtableid = spmodels.Collectingevent.specify_model.tableId
        self.recordset.save()
        response = self.post(record=self.collectingevent)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()['recordid'], self.collectingevent.pk)

    def test_invalid_table_returns_400_without_writes(self):
        self.recordset.dbtableid = -1
        self.recordset.save()
        before = self.snapshot()
        response = self.post()
        self.assertEqual(response.status_code, 400)
        self.assertEqual(self.snapshot(), before)

    def test_table_change_checks_reinterpreted_member_reference(self):
        spmodels.Recordset.objects.create(
            pk=self.item.recordid, collectionmemberid=self.other_collection.pk,
            name='Restricted reinterpreted target', type=0,
            dbtableid=spmodels.Collectionobject.specify_model.tableId,
            specifyuser=self.specifyuser,
        )
        self.assert_denied_unchanged(lambda: self.client.put(
            self.uri(self.recordset), data={
                'version': self.recordset.version,
                'dbtableid': spmodels.Recordset.specify_model.tableId,
            }, content_type='application/json',
        ))

    def test_authorized_table_change_preserves_membership(self):
        target = spmodels.Recordset.objects.create(
            pk=self.item.recordid, collectionmemberid=self.collection.pk,
            name='Readable reinterpreted target', type=0,
            dbtableid=spmodels.Collectionobject.specify_model.tableId,
            specifyuser=self.specifyuser,
        )
        response = self.client.put(self.uri(self.recordset), data={
            'version': self.recordset.version,
            'dbtableid': spmodels.Recordset.specify_model.tableId,
        }, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.item.refresh_from_db()
        self.assertEqual(self.item.recordid, target.pk)

    def test_recordset_scope_change_requires_descendant_update_in_destination(self):
        self.grant_access(self.other_collection)
        self.grant(self.other_collection, '/table/recordset', '%')
        self.grant(self.other_collection, '/table/recordsetitem', 'read')
        self.grant(self.other_collection, '/field/%', 'update')
        self.assert_denied_unchanged(lambda: self.client.put(
            self.uri(self.recordset), data={
                'version': self.recordset.version,
                'collectionmemberid': self.other_collection.pk,
            }, content_type='application/json',
        ))

    def test_authorized_direct_create_does_not_require_target_update(self):
        models.UserPolicy.objects.filter(resource='/table/%').delete()
        self.grant(self.collection, '/table/%', 'read')
        self.grant(self.collection, '/table/recordset', 'update')
        self.grant(self.collection, '/table/recordsetitem', 'create')
        response = self.post()
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()['recordid'], self.collectionobjects[2].pk)

    def test_authorized_update_persists(self):
        response = self.put(recordid=self.collectionobjects[2].pk, order=5)
        self.assertEqual(response.status_code, 200)
        self.item.refresh_from_db()
        self.assertEqual((self.item.recordid, self.item.order), (self.collectionobjects[2].pk, 5))

    def test_authorized_delete_removes_only_membership(self):
        response = self.client.delete(self.uri(self.item))
        self.assertEqual(response.status_code, 204)
        self.assertFalse(spmodels.Recordsetitem.objects.filter(pk=self.item.pk).exists())
        self.assertTrue(spmodels.Collectionobject.objects.filter(pk=self.item.recordid).exists())

    def test_deletion_can_clean_up_dangling_member(self):
        self.item.recordid = self.restricted_record.pk + 1000000
        self.item.save()
        self.assertEqual(self.client.delete(self.uri(self.item)).status_code, 204)

    def test_deletion_can_remove_unreadable_member_without_deleting_target(self):
        self.item.recordid = self.restricted_record.pk
        self.item.save()
        self.assertEqual(self.client.delete(self.uri(self.item)).status_code, 204)
        self.assertTrue(spmodels.Collectionobject.objects.filter(pk=self.restricted_record.pk).exists())

    def test_deleting_parent_requires_delete_not_update(self):
        models.UserPolicy.objects.filter(resource='/table/%').delete()
        self.grant(self.collection, '/table/%', 'read')
        self.grant(self.collection, '/table/%', 'delete')
        response = self.client.delete(self.uri(self.recordset))
        self.assertEqual(response.status_code, 204)
        self.assertFalse(spmodels.Recordsetitem.objects.filter(pk=self.item.pk).exists())

    def test_nested_authorized_replace_does_not_require_target_delete(self):
        models.UserPolicy.objects.filter(resource='/table/%').delete()
        self.grant(self.collection, '/table/%', 'read')
        self.grant(self.collection, '/table/recordset', 'update')
        for action in ('create', 'delete'):
            self.grant(self.collection, '/table/recordsetitem', action)
        response = self.nested([{'recordid': self.collectionobjects[2].pk}])
        self.assertEqual(response.status_code, 200)
        self.assertEqual(list(self.recordset.recordsetitems.values_list('recordid', flat=True)),
                         [self.collectionobjects[2].pk])
        self.assertTrue(spmodels.Collectionobject.objects.filter(pk=self.item.recordid).exists())

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
        self.grant(self.other_collection, '/table/recordsetitem', 'create')
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
