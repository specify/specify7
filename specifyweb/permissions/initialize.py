
from django.db import transaction, connection

from specifyweb.specify.models import Specifyuser, Agent, Collection # type: ignore
from specifyweb.specify.datamodel import datamodel

from .models import LibraryRole, Role, UserPolicy, LibraryRolePolicy, RolePolicy, UserRole
from .permissions import CollectionAccessPT

def initialize(wipe: bool=False) -> None:
    with transaction.atomic():
        if wipe:
            RolePolicy.objects.all().delete()
            UserRole.objects.all().delete()
            Role.objects.all().delete()
            LibraryRolePolicy.objects.all().delete()
            LibraryRole.objects.all().delete()
            UserPolicy.objects.all().delete()

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
    if LibraryRole.objects.exists():
        # don't do anything if there are already library roles defined
        return

    ca = LibraryRole.objects.create(name='Collection Admin',)
    ca.policies.create(resource="%", action="%")

    ################################

    full_access = LibraryRole.objects.create(name='Full Access',)
    full_access.policies.create(resource="/field/%", action="%")
    full_access.policies.create(resource="/table/%", action="read")

    for table in datamodel.tables:
        if not table.system or table.name.endswith('Attachment'):
            full_access.policies.get_or_create(resource=f"/table/{table.name}", action="%")

    full_access.policies.get_or_create(resource="/table/picklist", action="%")
    full_access.policies.get_or_create(resource="/table/picklistitem", action="%")

    full_access.policies.get_or_create(resource="/table/recordset", action="%")
    full_access.policies.get_or_create(resource="/table/recordsetitem", action="%")

    full_access.policies.get_or_create(resource="/table/spquery", action="%")
    full_access.policies.get_or_create(resource="/table/spqueryfield", action="%")

    full_access.policies.create(resource="/tree/%", action="%")
    full_access.policies.create(resource="/report/%", action="%")
    full_access.policies.create(resource="/querybuilder/%", action="%")

    ###############################

    limited_access = LibraryRole.objects.create(name='Limited Access',)
    limited_access.policies.create(resource="/field/%", action="%")
    limited_access.policies.create(resource="/table/%", action="read")

    limited_access.policies.create(resource="/querybuilder/%", action="%")

    ###############################

    guest = LibraryRole.objects.create(name='Guest',)
    guest.policies.create(resource="/field/%", action="%")
    guest.policies.create(resource="/table/%", action="read")

    guest.policies.create(resource="/querybuilder/%", action="%")

    ## Copy library roles to collections

    for collection in Collection.objects.all():
        if Role.objects.filter(collection_id=collection.id).exists():
            # don't do anything if there are already roles defined for
            # the collection
            continue

        for lr in LibraryRole.objects.all():
            r = Role.objects.create(
                collection_id=collection.id,
                name=lr.name,
                description=lr.description,
            )
            for lp in lr.policies.all():
                r.policies.create(resource=lp.resource, action=lp.action)

def assign_users_to_roles() -> None:
    from specifyweb.context.views import users_collections_for_sp6

    cursor = connection.cursor()
    for user in Specifyuser.objects.all():
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

            if user.usertype == 'Manager':
                user.roles.create(role=Role.objects.get(collection_id=colid, name="Collection Admin"))
            if user.usertype == 'FullAccess':
                user.roles.create(role=Role.objects.get(collection_id=colid, name="Full Access"))
            if user.usertype == 'LimitedAccess':
                user.roles.create(role=Role.objects.get(collection_id=colid, name="Limited Access"))
            if user.usertype == 'Guest':
                user.roles.create(role=Role.objects.get(collection_id=colid, name="Guest"))
