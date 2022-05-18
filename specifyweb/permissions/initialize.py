
from django.db import transaction, connection

from specifyweb.specify.models import Specifyuser, Agent, Collection # type: ignore
from specifyweb.specify.datamodel import datamodel

from .models import LibraryRole, Role, UserPolicy, LibraryRolePolicy, RolePolicy, UserRole
from .permissions import CollectionAccessPT

def wipe_permissions() -> None:
    RolePolicy.objects.all().delete()
    UserRole.objects.all().delete()
    Role.objects.all().delete()
    LibraryRolePolicy.objects.all().delete()
    LibraryRole.objects.all().delete()
    UserPolicy.objects.all().delete()

def initialize(wipe: bool=False) -> None:
    with transaction.atomic():
        if wipe:
            wipe_permissions()
        create_admins()
        create_roles()
        assign_users_to_roles()

def create_admins() -> None:
    if UserPolicy.objects.filter(collection__isnull=True, resource='%', action='%').exists():
        # don't do anything if there is already any admin.
        return

    users = Specifyuser.objects.all()
    for user in users:
        if user.is_admin():
            UserPolicy.objects.get_or_create(
                collection=None,
                specifyuser_id=user.id,
                resource="%",
                action="%",
            )

def create_roles() -> None:
    users = Specifyuser.objects.all()
    user_types = set((user.usertype for user in users))

    if 'Guest' in user_types or 'LimitedAccess' in user_types:
        for collection in Collection.objects.all():
            read_only = Role.objects.create(
                collection=collection,
                name="Read Only - Legacy",
                description="This is a legacy role that provides "
                "read only access and is assigned to user in the "
                "Limited Access and Guest groups from Specify 6. "
                "This is to maintain consistency with the permissions "
                "granted these users in previous versions of Specify 7."
            )
            read_only.policies.create(resource="/field/%", action="%")
            read_only.policies.create(resource="/table/%", action="read")

            read_only.policies.create(resource="/querybuilder/%", action="%")

    if 'FullAccess' in user_types:
        for collection in Collection.objects.all():
            full_access = Role.objects.create(
                collection=collection,
                name='Full Access - Legacy',
                description="This is a legacy role that provides "
                "read write access to most Specify resources and "
                "is assigned to users in the Full Access group from Specify 6. "
                "This is to maintain consistency with the permissions "
                "granted these users in previous versions of Specify 7."
            )

            full_access.policies.create(resource="/field/%", action="%")
            full_access.policies.create(resource="/table/%", action="read")

            for table in datamodel.tables:
                if not table.system or table.name.endswith('Attachment'):
                    full_access.policies.get_or_create(resource=f"/table/{table.name.lower()}", action="%")

            full_access.policies.get_or_create(resource="/table/picklist", action="%")
            full_access.policies.get_or_create(resource="/table/picklistitem", action="%")

            full_access.policies.get_or_create(resource="/table/recordset", action="%")
            full_access.policies.get_or_create(resource="/table/recordsetitem", action="%")

            full_access.policies.get_or_create(resource="/table/spquery", action="%")
            full_access.policies.get_or_create(resource="/table/spqueryfield", action="%")

            full_access.policies.create(resource="/tree/%", action="%")
            full_access.policies.create(resource="/report", action="%")
            full_access.policies.create(resource="/querybuilder/%", action="%")


    # Create a library role for collection admin.
    collection_admin = LibraryRole.objects.create(name='Collection Admin',)
    collection_admin.policies.create(resource="%", action="%")


    for collection in Collection.objects.all():
        # Copy the collection admin role into the collection roles.
        ca = Role.objects.create(
            collection_id=collection.id,
            name=collection_admin.name,
            description=collection_admin.description,
        )
        for lp in collection_admin.policies.all():
            ca.policies.create(resource=lp.resource, action=lp.action)

def assign_users_to_roles() -> None:
    from specifyweb.context.views import users_collections_for_sp6

    cursor = connection.cursor()
    for user in Specifyuser.objects.all():
        for collection in Collection.objects.all():
            if user.usertype == 'Manager':
                user.roles.create(role=Role.objects.get(collection=collection, name="Collection Admin"))
            if user.usertype == 'FullAccess':
                user.roles.create(role=Role.objects.get(collection=collection, name="Full Access - Legacy"))
            if user.usertype in ('LimitedAccess', 'Guest'):
                user.roles.create(role=Role.objects.get(collection=collection, name="Read Only - Legacy"))

        for colid, _ in users_collections_for_sp6(cursor, user.id):
            # Does the user has an agent for the collection?
            if Agent.objects.filter(specifyuser=user, division__disciplines__collections__id=colid).exists():
                # Give them access to the collection.
                UserPolicy.objects.create(
                    collection_id=colid,
                    specifyuser_id=user.id,
                    resource=CollectionAccessPT.access.resource(),
                    action=CollectionAccessPT.access.action(),
                )

