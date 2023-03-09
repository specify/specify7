
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

def create_roles() -> None:
    role = LibraryRole.objects.create(name="Assign Roles", description="Gives ability to assign existing roles to existing users.")
    role.policies.create(resource="/permissions/user/roles", action="read")
    role.policies.create(resource="/permissions/user/roles", action="update")
    role.policies.create(resource="/permissions/roles", action="read")

    role = LibraryRole.objects.create(name="Create Data Sets", description="Allows creating new Data Sets in the WorkBench, without ability to upload them.\n\nSuch user would create a Data Sets, map the columns, fix validation issues, and then transfer the Data Set to another user for review and upload.")
    role.policies.create(resource="/workbench/dataset", action="create")
    role.policies.create(resource="/workbench/dataset", action="update")
    role.policies.create(resource="/workbench/dataset", action="delete")
    role.policies.create(resource="/workbench/dataset", action="validate")
    role.policies.create(resource="/workbench/dataset", action="transfer")

    role = LibraryRole.objects.create(name="Edit Forms and Global Preferences", description="Grants full access to resource editor. This allows editing form definitions and global Specify preferences.")
    role.policies.create(resource="/table/spappresource", action="read")
    role.policies.create(resource="/table/spappresource", action="create")
    role.policies.create(resource="/table/spappresource", action="update")
    role.policies.create(resource="/table/spappresource", action="delete")
    role.policies.create(resource="/table/spappresourcedata", action="read")
    role.policies.create(resource="/table/spappresourcedata", action="create")
    role.policies.create(resource="/table/spappresourcedata", action="update")
    role.policies.create(resource="/table/spappresourcedata", action="delete")
    role.policies.create(resource="/table/spappresourcedir", action="read")
    role.policies.create(resource="/table/spappresourcedir", action="create")
    role.policies.create(resource="/table/spappresourcedir", action="update")
    role.policies.create(resource="/table/spappresourcedir", action="delete")
    role.policies.create(resource="/table/spviewsetobj", action="read")
    role.policies.create(resource="/table/spviewsetobj", action="create")
    role.policies.create(resource="/table/spviewsetobj", action="update")
    role.policies.create(resource="/table/spviewsetobj", action="delete")

    role = LibraryRole.objects.create(name="Edit Pick lists", description="Gives full access to modifying pick lists.")
    role.policies.create(resource="/table/picklist", action="read")
    role.policies.create(resource="/table/picklist", action="create")
    role.policies.create(resource="/table/picklist", action="update")
    role.policies.create(resource="/table/picklist", action="delete")
    role.policies.create(resource="/table/picklistitem", action="read")
    role.policies.create(resource="/table/picklistitem", action="create")
    role.policies.create(resource="/table/picklistitem", action="update")
    role.policies.create(resource="/table/picklistitem", action="delete")

    role = LibraryRole.objects.create(name="Edit Taxon Tree", description="Gives full access to the Taxon Tree.\n\nWarning: Taxon Tree may be shared between collections. Edits in one collection may affect another.")
    role.policies.create(resource="/tree/edit/taxon", action="merge")
    role.policies.create(resource="/tree/edit/taxon", action="move")
    role.policies.create(resource="/tree/edit/taxon", action="synonymize")
    role.policies.create(resource="/tree/edit/taxon", action="desynonymize")
    role.policies.create(resource="/tree/edit/taxon", action="repair")
    role.policies.create(resource="/table/taxon", action="read")
    role.policies.create(resource="/table/taxon", action="update")
    role.policies.create(resource="/table/taxon", action="delete")
    role.policies.create(resource="/table/taxon", action="create")
    role.policies.create(resource="/table/taxonattribute", action="read")
    role.policies.create(resource="/table/taxonattribute", action="delete")
    role.policies.create(resource="/table/taxonattribute", action="update")
    role.policies.create(resource="/table/taxonattribute", action="create")
    role.policies.create(resource="/table/taxoncitation", action="read")
    role.policies.create(resource="/table/taxoncitation", action="create")
    role.policies.create(resource="/table/taxoncitation", action="update")
    role.policies.create(resource="/table/taxoncitation", action="delete")
    role.policies.create(resource="/table/taxontreedef", action="read")
    role.policies.create(resource="/table/taxontreedef", action="update")
    role.policies.create(resource="/table/taxontreedefitem", action="read")
    role.policies.create(resource="/table/taxontreedefitem", action="update")
    role.policies.create(resource="/table/taxonattachment", action="read")
    role.policies.create(resource="/table/taxonattachment", action="create")
    role.policies.create(resource="/table/taxonattachment", action="update")
    role.policies.create(resource="/table/taxonattachment", action="delete")

    role = LibraryRole.objects.create(name="Export Data", description="Gives ability to export DwC Archive from any table.")
    role.policies.create(resource="/export/dwca", action="execute")
    role.policies.create(resource="/table/%", action="read")

    role = LibraryRole.objects.create(name="Full Data Access", description="Grants read and edit access to all tables")
    role.policies.create(resource="/table/%", action="read")
    role.policies.create(resource="/table/%", action="create")
    role.policies.create(resource="/table/%", action="update")
    role.policies.create(resource="/table/%", action="delete")

    role = LibraryRole.objects.create(name="Full WorkBench access", description="Gives full access to the WorkBench. Allows creating new records in any table.")
    role.policies.create(resource="/workbench/dataset", action="create")
    role.policies.create(resource="/workbench/dataset", action="update")
    role.policies.create(resource="/workbench/dataset", action="delete")
    role.policies.create(resource="/workbench/dataset", action="validate")
    role.policies.create(resource="/workbench/dataset", action="upload")
    role.policies.create(resource="/workbench/dataset", action="unupload")
    role.policies.create(resource="/workbench/dataset", action="transfer")
    role.policies.create(resource="/table/%", action="read")
    role.policies.create(resource="/table/%", action="create")

    role = LibraryRole.objects.create(name="Inspect Audit Log", description="Allows to run a query builder query on the Audit Log table.")
    role.policies.create(resource="/table/spauditlog", action="read")
    role.policies.create(resource="/table/spauditlogfield", action="read")
    role.policies.create(resource="/querybuilder/query", action="execute")

    role = LibraryRole.objects.create(name="Manage Interactions", description="Grants full access to interactions tables.")
    role.policies.create(resource="/table/appraisal", action="read")
    role.policies.create(resource="/table/appraisal", action="create")
    role.policies.create(resource="/table/appraisal", action="update")
    role.policies.create(resource="/table/appraisal", action="delete")
    role.policies.create(resource="/table/borrow", action="read")
    role.policies.create(resource="/table/borrow", action="create")
    role.policies.create(resource="/table/borrow", action="delete")
    role.policies.create(resource="/table/borrow", action="update")
    role.policies.create(resource="/table/borrowagent", action="read")
    role.policies.create(resource="/table/borrowagent", action="create")
    role.policies.create(resource="/table/borrowagent", action="update")
    role.policies.create(resource="/table/borrowagent", action="delete")
    role.policies.create(resource="/table/borrowmaterial", action="read")
    role.policies.create(resource="/table/borrowmaterial", action="create")
    role.policies.create(resource="/table/borrowmaterial", action="update")
    role.policies.create(resource="/table/borrowmaterial", action="delete")
    role.policies.create(resource="/table/borrowreturnmaterial", action="read")
    role.policies.create(resource="/table/borrowreturnmaterial", action="create")
    role.policies.create(resource="/table/borrowreturnmaterial", action="update")
    role.policies.create(resource="/table/borrowreturnmaterial", action="delete")
    role.policies.create(resource="/table/deaccession", action="read")
    role.policies.create(resource="/table/deaccession", action="create")
    role.policies.create(resource="/table/deaccession", action="update")
    role.policies.create(resource="/table/deaccession", action="delete")
    role.policies.create(resource="/table/deaccessionagent", action="read")
    role.policies.create(resource="/table/deaccessionagent", action="create")
    role.policies.create(resource="/table/deaccessionagent", action="update")
    role.policies.create(resource="/table/deaccessionagent", action="delete")
    role.policies.create(resource="/table/disposal", action="read")
    role.policies.create(resource="/table/disposal", action="create")
    role.policies.create(resource="/table/disposal", action="update")
    role.policies.create(resource="/table/disposal", action="delete")
    role.policies.create(resource="/table/disposalagent", action="read")
    role.policies.create(resource="/table/disposalagent", action="create")
    role.policies.create(resource="/table/disposalagent", action="update")
    role.policies.create(resource="/table/disposalagent", action="delete")
    role.policies.create(resource="/table/disposalpreparation", action="read")
    role.policies.create(resource="/table/disposalpreparation", action="create")
    role.policies.create(resource="/table/disposalpreparation", action="update")
    role.policies.create(resource="/table/disposalpreparation", action="delete")
    role.policies.create(resource="/table/exchangein", action="read")
    role.policies.create(resource="/table/exchangein", action="create")
    role.policies.create(resource="/table/exchangein", action="update")
    role.policies.create(resource="/table/exchangein", action="delete")
    role.policies.create(resource="/table/exchangeinprep", action="read")
    role.policies.create(resource="/table/exchangeinprep", action="create")
    role.policies.create(resource="/table/exchangeinprep", action="delete")
    role.policies.create(resource="/table/exchangeinprep", action="update")
    role.policies.create(resource="/table/exchangeout", action="read")
    role.policies.create(resource="/table/exchangeout", action="update")
    role.policies.create(resource="/table/exchangeout", action="delete")
    role.policies.create(resource="/table/exchangeout", action="create")
    role.policies.create(resource="/table/exchangeoutprep", action="read")
    role.policies.create(resource="/table/exchangeoutprep", action="create")
    role.policies.create(resource="/table/exchangeoutprep", action="update")
    role.policies.create(resource="/table/exchangeoutprep", action="delete")
    role.policies.create(resource="/table/gift", action="read")
    role.policies.create(resource="/table/gift", action="create")
    role.policies.create(resource="/table/gift", action="update")
    role.policies.create(resource="/table/gift", action="delete")
    role.policies.create(resource="/table/giftagent", action="read")
    role.policies.create(resource="/table/giftagent", action="create")
    role.policies.create(resource="/table/giftagent", action="update")
    role.policies.create(resource="/table/giftagent", action="delete")
    role.policies.create(resource="/table/giftpreparation", action="read")
    role.policies.create(resource="/table/giftpreparation", action="update")
    role.policies.create(resource="/table/giftpreparation", action="delete")
    role.policies.create(resource="/table/giftpreparation", action="create")
    role.policies.create(resource="/table/inforequest", action="read")
    role.policies.create(resource="/table/inforequest", action="create")
    role.policies.create(resource="/table/inforequest", action="update")
    role.policies.create(resource="/table/inforequest", action="delete")
    role.policies.create(resource="/table/loan", action="read")
    role.policies.create(resource="/table/loan", action="create")
    role.policies.create(resource="/table/loan", action="update")
    role.policies.create(resource="/table/loan", action="delete")
    role.policies.create(resource="/table/loanagent", action="read")
    role.policies.create(resource="/table/loanagent", action="create")
    role.policies.create(resource="/table/loanagent", action="update")
    role.policies.create(resource="/table/loanagent", action="delete")
    role.policies.create(resource="/table/loanpreparation", action="read")
    role.policies.create(resource="/table/loanpreparation", action="create")
    role.policies.create(resource="/table/loanpreparation", action="update")
    role.policies.create(resource="/table/loanpreparation", action="delete")
    role.policies.create(resource="/table/loanreturnpreparation", action="read")
    role.policies.create(resource="/table/loanreturnpreparation", action="create")
    role.policies.create(resource="/table/loanreturnpreparation", action="update")
    role.policies.create(resource="/table/loanreturnpreparation", action="delete")
    role.policies.create(resource="/table/permit", action="read")
    role.policies.create(resource="/table/permit", action="create")
    role.policies.create(resource="/table/permit", action="update")
    role.policies.create(resource="/table/permit", action="delete")
    role.policies.create(resource="/table/shipment", action="read")
    role.policies.create(resource="/table/shipment", action="create")
    role.policies.create(resource="/table/shipment", action="update")
    role.policies.create(resource="/table/shipment", action="delete")
    role.policies.create(resource="/table/borrowattachment", action="read")
    role.policies.create(resource="/table/borrowattachment", action="create")
    role.policies.create(resource="/table/borrowattachment", action="update")
    role.policies.create(resource="/table/borrowattachment", action="delete")
    role.policies.create(resource="/table/deaccessionattachment", action="read")
    role.policies.create(resource="/table/deaccessionattachment", action="create")
    role.policies.create(resource="/table/deaccessionattachment", action="update")
    role.policies.create(resource="/table/deaccessionattachment", action="delete")
    role.policies.create(resource="/table/disposalattachment", action="read")
    role.policies.create(resource="/table/disposalattachment", action="create")
    role.policies.create(resource="/table/disposalattachment", action="update")
    role.policies.create(resource="/table/disposalattachment", action="delete")
    role.policies.create(resource="/table/giftattachment", action="read")
    role.policies.create(resource="/table/giftattachment", action="create")
    role.policies.create(resource="/table/giftattachment", action="update")
    role.policies.create(resource="/table/giftattachment", action="delete")
    role.policies.create(resource="/table/loanattachment", action="create")
    role.policies.create(resource="/table/loanattachment", action="update")
    role.policies.create(resource="/table/loanattachment", action="delete")
    role.policies.create(resource="/table/loanattachment", action="read")
    role.policies.create(resource="/table/permitattachment", action="read")
    role.policies.create(resource="/table/permitattachment", action="create")
    role.policies.create(resource="/table/permitattachment", action="update")
    role.policies.create(resource="/table/permitattachment", action="delete")

    role = LibraryRole.objects.create(name="Print Reports", description="Gives ability to execute reports from any table.")
    role.policies.create(resource="/report", action="execute")
    role.policies.create(resource="/table/%", action="read")

    role = LibraryRole.objects.create(name="Read-Only Access", description="Grants read access to all tables")
    role.policies.create(resource="/table/%", action="read")

    role = LibraryRole.objects.create(name="Run Queries", description="Gives access to execute queries on any table, export query results and create record sets.")
    role.policies.create(resource="/querybuilder/query", action="execute")
    role.policies.create(resource="/querybuilder/query", action="export_csv")
    role.policies.create(resource="/querybuilder/query", action="export_kml")
    role.policies.create(resource="/querybuilder/query", action="create_recordset")
    role.policies.create(resource="/table/spquery", action="read")
    role.policies.create(resource="/table/spquery", action="create")
    role.policies.create(resource="/table/spquery", action="update")
    role.policies.create(resource="/table/spquery", action="delete")
    role.policies.create(resource="/table/spqueryfield", action="read")
    role.policies.create(resource="/table/spqueryfield", action="create")
    role.policies.create(resource="/table/spqueryfield", action="update")
    role.policies.create(resource="/table/spqueryfield", action="delete")
    role.policies.create(resource="/table/recordset", action="read")
    role.policies.create(resource="/table/recordset", action="create")
    role.policies.create(resource="/table/recordset", action="update")
    role.policies.create(resource="/table/recordset", action="delete")
    role.policies.create(resource="/table/recordsetitem", action="read")
    role.policies.create(resource="/table/recordsetitem", action="create")
    role.policies.create(resource="/table/recordsetitem", action="update")
    role.policies.create(resource="/table/recordsetitem", action="delete")
    role.policies.create(resource="/table/%", action="read")

    role = LibraryRole.objects.create(name="Security Admin", description="Grants full access to security settings within a collection.")
    role.policies.create(resource="/permissions/%", action="read")
    role.policies.create(resource="/permissions/%", action="update")
    role.policies.create(resource="/permissions/%", action="create")
    role.policies.create(resource="/permissions/%", action="delete")
    role.policies.create(resource="/permissions/%", action="copy_from_library")
    role.policies.create(resource="/table/specifyuser", action="read")
    role.policies.create(resource="/table/specifyuser", action="create")
    role.policies.create(resource="/table/specifyuser", action="update")
    role.policies.create(resource="/table/specifyuser", action="delete")


    collection_admin = LibraryRole.objects.create(
        name="Collection Admin",
        description="Grants full access to all abilities within a collection.")
    collection_admin.policies.create(resource="%", action="%")

    read_only = LibraryRole.objects.create(
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

    full_access = LibraryRole.objects.create(
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
            full_access.policies.create(resource=f"/table/{table.name.lower()}", action="%")

    full_access.policies.create(resource="/table/picklist", action="%")
    full_access.policies.create(resource="/table/picklistitem", action="%")

    full_access.policies.create(resource="/table/recordset", action="%")
    full_access.policies.create(resource="/table/recordsetitem", action="%")

    full_access.policies.create(resource="/table/spquery", action="%")
    full_access.policies.create(resource="/table/spqueryfield", action="%")

    full_access.policies.create(resource="/tree/%", action="%")
    full_access.policies.create(resource="/report", action="%")
    full_access.policies.create(resource="/querybuilder/%", action="%")

    # copy the appropriate roles into the individual collections.
    users = Specifyuser.objects.all()
    user_types = set((user.usertype for user in users))

    if 'Guest' in user_types or 'LimitedAccess' in user_types:
        for collection in Collection.objects.all():
            r = Role.objects.create(
                collection_id=collection.id,
                name=read_only.name,
                description=read_only.description,
            )
            for lp in read_only.policies.all():
                r.policies.create(resource=lp.resource, action=lp.action)

    if 'FullAccess' in user_types:
        for collection in Collection.objects.all():
            r = Role.objects.create(
                collection_id=collection.id,
                name=full_access.name,
                description=full_access.description,
            )
            for lp in full_access.policies.all():
                r.policies.create(resource=lp.resource, action=lp.action)


    for collection in Collection.objects.all():
        # Copy the collection admin role into the collection roles.
        ca = Role.objects.create(
            collection_id=collection.id,
            name=collection_admin.name,
            description=collection_admin.description,
        )
        for lp in collection_admin.policies.all():
            ca.policies.create(resource=lp.resource, action=lp.action)
