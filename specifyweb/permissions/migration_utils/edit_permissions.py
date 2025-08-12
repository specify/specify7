from specifyweb.specify.auditlog import auditlog


def add_permission(apps, schema_editor=None):
    UserPolicy = apps.get_model('permissions', 'UserPolicy')
    LibraryRolePolicy = apps.get_model('permissions', 'LibraryRolePolicy')
    RolePolicy = apps.get_model('permissions', 'RolePolicy')

    for p in UserPolicy.objects.filter(resource='/workbench/dataset', action='upload'):
        if not UserPolicy.objects.filter(
            collection=p.collection,
            specifyuser=p.specifyuser,
            resource=p.resource,
            action='create_recordset',
        ).exists():
            user_policy = UserPolicy.objects.create(
                collection=p.collection,
                specifyuser=p.specifyuser,
                resource=p.resource,
                action='create_recordset',
            )
            auditlog.insert(user_policy)

    for p in RolePolicy.objects.filter(resource='/workbench/dataset', action='upload'):
        if not RolePolicy.objects.filter(
            role=p.role,
            resource=p.resource,
            action='create_recordset',
        ).exists():
            role_policy = RolePolicy.objects.create(
                role=p.role,
                resource=p.resource,
                action='create_recordset',
            )
            auditlog.insert(role_policy, None)

    for p in LibraryRolePolicy.objects.filter(resource='/workbench/dataset', action='upload'):
        if not LibraryRolePolicy.objects.filter(
            role=p.role,
            resource=p.resource,
            action='create_recordset',
        ).exists():
            library_role_policy = LibraryRolePolicy.objects.create(
                role=p.role,
                resource=p.resource,
                action='create_recordset',
            )
            auditlog.insert(library_role_policy, None)


def add_stats_edit_permission(apps, schema_editor=None):
    Collection = apps.get_model('specify', 'Collection')
    Role = apps.get_model('permissions', 'Role')
    for collection_id in Collection.objects.values_list('id', flat=True):
        try:
            all_full_access_roles = Role.objects.filter(
                collection_id=collection_id, name="Full Access - Legacy")
            for full_access_role in all_full_access_roles:
                if not full_access_role.policies.filter(
                    resource="/preferences/statistics",
                    action="edit",
                ).exists():
                    full_access_role.policies.create(
                        resource="/preferences/statistics",
                        action="edit",
                    )
                    auditlog.insert(full_access_role, None)
        except Exception as e:
            print(f"Failed to assign stats edit permission in collection {collection_id}: {e}")
