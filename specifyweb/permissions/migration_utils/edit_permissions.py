def add_permission(apps, schema_editor=None):
    UserPolicy = apps.get_model('permissions', 'UserPolicy')
    LibraryRolePolicy = apps.get_model('permissions', 'LibraryRolePolicy')
    RolePolicy = apps.get_model('permissions', 'RolePolicy')

    for p in UserPolicy.objects.filter(resource='/workbench/dataset', action='upload'):
        UserPolicy.objects.create(
            collection=p.collection,
            specifyuser=p.specifyuser,
            resource=p.resource,
            action='create_recordset',
        )

    for p in RolePolicy.objects.filter(resource='/workbench/dataset', action='upload'):
        RolePolicy.objects.create(
            role=p.role,
            resource=p.resource,
            action='create_recordset',
        )

    for p in LibraryRolePolicy.objects.filter(resource='/workbench/dataset', action='upload'):
        LibraryRolePolicy.objects.create(
            role=p.role,
            resource=p.resource,
            action='create_recordset',
        )


def add_stats_edit_permission(apps, schema_editor=None):
    Collection = apps.get_model('specify', 'Collection')
    Role = apps.get_model('permissions', 'Role')
    for collection_id in Collection.objects.values_list('id', flat=True):
        try:
            all_full_access_roles = Role.objects.filter(
                collection_id=collection_id, name="Full Access - Legacy")
            for full_access_role in all_full_access_roles:
                full_access_role.policies.create(resource="/preferences"
                                                          "/statistics",
                                                 action="edit")
        except:
            print("Failed to assign stats edit permission in collection: ",
                  collection_id)
