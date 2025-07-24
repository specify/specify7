from django.db import transaction, connection
from django.apps import apps
from django.core.exceptions import MultipleObjectsReturned

from specifyweb.specify.datamodel import datamodel
from specifyweb.specify.model_extras import is_legacy_admin
from specifyweb.specify.auditlog import auditlog

from .permissions import CollectionAccessPT

def wipe_permissions(apps = apps) -> None:
    RolePolicy = apps.get_model('permissions', 'RolePolicy')
    UserRole = apps.get_model('permissions', 'UserRole')
    Role = apps.get_model('permissions', 'Role')
    LibraryRolePolicy = apps.get_model('permissions', 'LibraryRolePolicy')
    LibraryRole = apps.get_model('permissions', 'LibraryRole')
    UserPolicy = apps.get_model('permissions', 'UserPolicy')

    RolePolicy.objects.all().delete()
    UserRole.objects.all().delete()
    Role.objects.all().delete()
    LibraryRolePolicy.objects.all().delete()
    LibraryRole.objects.all().delete()
    UserPolicy.objects.all().delete()

def initialize(wipe: bool=False, apps=apps) -> None:
    with transaction.atomic():
        if wipe:
            wipe_permissions(apps)
        create_admins(apps)
        create_roles(apps)
        assign_users_to_roles(apps)

def create_admins(apps=apps) -> None:
    UserPolicy = apps.get_model('permissions', 'UserPolicy')
    Specifyuser = apps.get_model('specify', 'Specifyuser')

    if UserPolicy.objects.filter(collection__isnull=True, resource='%', action='%').exists():
        # don't do anything if there is already any admin.
        return

    users = Specifyuser.objects.all()
    for user in users:
        if is_legacy_admin(user):
            user_policy, is_new = UserPolicy.objects.get_or_create(
                collection=None,
                specifyuser_id=user.id,
                resource="%",
                action="%",
            )
            if is_new:
                auditlog.insert(user_policy)

def assign_users_to_roles(apps=apps) -> None:
    from specifyweb.context.views import users_collections_for_sp6

    Role = apps.get_model('permissions', 'Role')
    UserRole = apps.get_model('permissions', 'UserRole')
    UserPolicy = apps.get_model('permissions', 'UserPolicy')
    Collection = apps.get_model('specify', 'Collection')
    Specifyuser = apps.get_model('specify', 'Specifyuser')
    Agent = apps.get_model('specify', 'Agent')

    cursor = connection.cursor()
    for user in Specifyuser.objects.all():
        if is_sp6_user_permissions_migrated(user, apps):
            # Skip users that have already been migrated from sp6 to sp7.
            continue
        for collection in Collection.objects.all():
            if user.usertype == 'Manager':
                roles = Role.objects.filter(collection=collection, name="Collection Admin")
                for role in roles:
                    try:
                        user_role, created = UserRole.objects.get_or_create(specifyuser=user, role=role)
                    except MultipleObjectsReturned:
                        user_role = UserRole.objects.filter(specifyuser=user, role=role).first()
                        created = False
                    if created:
                        auditlog.insert(user_role)
            if user.usertype == 'FullAccess':
                roles = Role.objects.filter(collection=collection, name="Full Access - Legacy")
                for role in roles:
                    try:
                        user_role, created = UserRole.objects.get_or_create(specifyuser=user, role=role)
                    except MultipleObjectsReturned:
                        user_role = UserRole.objects.filter(specifyuser=user, role=role).first()
                        created = False
                    if created:
                        auditlog.insert(user_role)
            if user.usertype in ('LimitedAccess', 'Guest'):
                roles = Role.objects.filter(collection=collection, name="Read Only - Legacy")
                for role in roles:
                    try:
                        user_role, created = UserRole.objects.get_or_create(specifyuser=user, role=role)
                    except MultipleObjectsReturned:
                        user_role = UserRole.objects.filter(specifyuser=user, role=role).first()
                        created = False
                    if created:
                        auditlog.insert(user_role)

        for colid, _ in users_collections_for_sp6(cursor, user.id):
            # Does the user have an agent for the collection?
            if Agent.objects.filter(specifyuser=user, division__disciplines__collections__id=colid).exists():
                # Give them access to the collection.
                try:
                    user_policy, created = UserPolicy.objects.get_or_create(
                        collection_id=colid,
                        specifyuser_id=user.id,
                        resource=CollectionAccessPT.access.resource(),
                        action=CollectionAccessPT.access.action(),
                    )
                except MultipleObjectsReturned:
                    user_policy = UserPolicy.objects.filter(
                        collection_id=colid,
                        specifyuser_id=user.id,
                        resource=CollectionAccessPT.access.resource(),
                        action=CollectionAccessPT.access.action(),
                    ).first()
                    created = False
                if created:
                    auditlog.insert(user_policy, None)

def get_or_create_role(model, name, description, extra_fields=None):
    kwargs = {"name": name, "description": description}
    if extra_fields:
        kwargs.update(extra_fields)
    try:
        role_obj, created = model.objects.get_or_create(**kwargs)
    except MultipleObjectsReturned:
        role_obj = model.objects.filter(**kwargs).first()
        created = False
    if created:
        auditlog.insert(role_obj)
    return role_obj

def get_or_create_policy(role, resource, action):
    try:
        policy_obj, created = role.policies.get_or_create(resource=resource, action=action)
    except MultipleObjectsReturned:
        policy_obj = role.policies.filter(resource=resource, action=action).first()
        created = False
    if created:
        auditlog.insert(policy_obj)
    return policy_obj

def is_sp6_user_permissions_migrated(user, apps=apps) -> bool:
    UserPolicy = apps.get_model('permissions', 'UserPolicy')
    UserRole = apps.get_model('permissions', 'UserRole')
    return UserRole.objects.filter(specifyuser=user).exists() or UserPolicy.objects.filter(specifyuser=user).exists()

def create_roles(apps=apps) -> None:
    LibraryRole = apps.get_model('permissions', 'LibraryRole')
    Role = apps.get_model('permissions', 'Role')
    Collection = apps.get_model('specify', 'Collection')
    Specifyuser = apps.get_model('specify', 'Specifyuser')

    # Library Roles
    assign_roles = get_or_create_role(
        LibraryRole,
        "Assign Roles",
        "Gives ability to assign existing roles to existing users."
    )
    for resource, action in [
        ("/permissions/user/roles", "read"),
        ("/permissions/user/roles", "update"),
        ("/permissions/roles", "read"),
    ]:
        get_or_create_policy(assign_roles, resource, action)

    create_datasets = get_or_create_role(
        LibraryRole,
        "Create Data Sets",
        ("Allows creating new Data Sets in the WorkBench, without ability to upload them.\n\n"
         "Such user would create a Data Sets, map the columns, fix validation issues, and then transfer the Data Set to another user for review and upload.")
    )
    for resource, action in [
        ("/workbench/dataset", "create"),
        ("/workbench/dataset", "update"),
        ("/workbench/dataset", "delete"),
        ("/workbench/dataset", "validate"),
        ("/workbench/dataset", "transfer"),
    ]:
        get_or_create_policy(create_datasets, resource, action)

    edit_forms = get_or_create_role(
        LibraryRole,
        "Edit Forms and Global Preferences",
        "Grants full access to resource editor. This allows editing form definitions and global Specify preferences."
    )
    for resource, action in [
        ("/table/spappresource", "read"),
        ("/table/spappresource", "create"),
        ("/table/spappresource", "update"),
        ("/table/spappresource", "delete"),
        ("/table/spappresourcedata", "read"),
        ("/table/spappresourcedata", "create"),
        ("/table/spappresourcedata", "update"),
        ("/table/spappresourcedata", "delete"),
        ("/table/spappresourcedir", "read"),
        ("/table/spappresourcedir", "create"),
        ("/table/spappresourcedir", "update"),
        ("/table/spappresourcedir", "delete"),
        ("/table/spviewsetobj", "read"),
        ("/table/spviewsetobj", "create"),
        ("/table/spviewsetobj", "update"),
        ("/table/spviewsetobj", "delete"),
    ]:
        get_or_create_policy(edit_forms, resource, action)

    edit_picklists = get_or_create_role(
        LibraryRole,
        "Edit Pick lists",
        "Gives full access to modifying pick lists."
    )
    for resource, action in [
        ("/table/picklist", "read"),
        ("/table/picklist", "create"),
        ("/table/picklist", "update"),
        ("/table/picklist", "delete"),
        ("/table/picklistitem", "read"),
        ("/table/picklistitem", "create"),
        ("/table/picklistitem", "update"),
        ("/table/picklistitem", "delete"),
    ]:
        get_or_create_policy(edit_picklists, resource, action)

    edit_taxon_tree = get_or_create_role(
        LibraryRole,
        "Edit Taxon Tree",
        ("Gives full access to the Taxon Tree.\n\nWarning: Taxon Tree may be shared between collections. "
         "Edits in one collection may affect another.")
    )
    for resource, action in [
        ("/tree/edit/taxon", "merge"),
        ("/tree/edit/taxon", "move"),
        ("/tree/edit/taxon", "synonymize"),
        ("/tree/edit/taxon", "desynonymize"),
        ("/tree/edit/taxon", "repair"),
        ("/table/taxon", "read"),
        ("/table/taxon", "update"),
        ("/table/taxon", "delete"),
        ("/table/taxon", "create"),
        ("/table/taxonattribute", "read"),
        ("/table/taxonattribute", "delete"),
        ("/table/taxonattribute", "update"),
        ("/table/taxonattribute", "create"),
        ("/table/taxoncitation", "read"),
        ("/table/taxoncitation", "create"),
        ("/table/taxoncitation", "update"),
        ("/table/taxoncitation", "delete"),
        ("/table/taxontreedef", "read"),
        ("/table/taxontreedef", "update"),
        ("/table/taxontreedefitem", "read"),
        ("/table/taxontreedefitem", "update"),
        ("/table/taxonattachment", "read"),
        ("/table/taxonattachment", "create"),
        ("/table/taxonattachment", "update"),
        ("/table/taxonattachment", "delete"),
    ]:
        get_or_create_policy(edit_taxon_tree, resource, action)

    export_data = get_or_create_role(
        LibraryRole,
        "Export Data",
        "Gives ability to export DwC Archive from any table."
    )
    for resource, action in [
        ("/export/dwca", "execute"),
        ("/table/%", "read"),
    ]:
        get_or_create_policy(export_data, resource, action)

    full_data_access = get_or_create_role(
        LibraryRole,
        "Full Data Access",
        "Grants read and edit access to all tables"
    )
    for resource, action in [
        ("/table/%", "read"),
        ("/table/%", "create"),
        ("/table/%", "update"),
        ("/table/%", "delete"),
    ]:
        get_or_create_policy(full_data_access, resource, action)

    full_workbench = get_or_create_role(
        LibraryRole,
        "Full WorkBench access",
        "Gives full access to the WorkBench. Allows creating new records in any table."
    )
    for resource, action in [
        ("/workbench/dataset", "create"),
        ("/workbench/dataset", "update"),
        ("/workbench/dataset", "delete"),
        ("/workbench/dataset", "validate"),
        ("/workbench/dataset", "upload"),
        ("/workbench/dataset", "unupload"),
        ("/workbench/dataset", "transfer"),
        ("/table/%", "read"),
        ("/table/%", "create"),
    ]:
        get_or_create_policy(full_workbench, resource, action)

    inspect_audit_log = get_or_create_role(
        LibraryRole,
        "Inspect Audit Log",
        "Allows to run a query builder query on the Audit Log table."
    )
    for resource, action in [
        ("/table/spauditlog", "read"),
        ("/table/spauditlogfield", "read"),
        ("/querybuilder/query", "execute"),
    ]:
        get_or_create_policy(inspect_audit_log, resource, action)

    manage_interactions = get_or_create_role(
        LibraryRole,
        "Manage Interactions",
        "Grants full access to interactions tables."
    )
    for resource, action in [
        ("/table/appraisal", "read"),
        ("/table/appraisal", "create"),
        ("/table/appraisal", "update"),
        ("/table/appraisal", "delete"),
        ("/table/borrow", "read"),
        ("/table/borrow", "create"),
        ("/table/borrow", "delete"),
        ("/table/borrow", "update"),
        ("/table/borrowagent", "read"),
        ("/table/borrowagent", "create"),
        ("/table/borrowagent", "update"),
        ("/table/borrowagent", "delete"),
        ("/table/borrowmaterial", "read"),
        ("/table/borrowmaterial", "create"),
        ("/table/borrowmaterial", "update"),
        ("/table/borrowmaterial", "delete"),
        ("/table/borrowreturnmaterial", "read"),
        ("/table/borrowreturnmaterial", "create"),
        ("/table/borrowreturnmaterial", "update"),
        ("/table/borrowreturnmaterial", "delete"),
        ("/table/deaccession", "read"),
        ("/table/deaccession", "create"),
        ("/table/deaccession", "update"),
        ("/table/deaccession", "delete"),
        ("/table/deaccessionagent", "read"),
        ("/table/deaccessionagent", "create"),
        ("/table/deaccessionagent", "update"),
        ("/table/deaccessionagent", "delete"),
        ("/table/disposal", "read"),
        ("/table/disposal", "create"),
        ("/table/disposal", "update"),
        ("/table/disposal", "delete"),
        ("/table/disposalagent", "read"),
        ("/table/disposalagent", "create"),
        ("/table/disposalagent", "update"),
        ("/table/disposalagent", "delete"),
        ("/table/disposalpreparation", "read"),
        ("/table/disposalpreparation", "create"),
        ("/table/disposalpreparation", "update"),
        ("/table/disposalpreparation", "delete"),
        ("/table/exchangein", "read"),
        ("/table/exchangein", "create"),
        ("/table/exchangein", "update"),
        ("/table/exchangein", "delete"),
        ("/table/exchangeinprep", "read"),
        ("/table/exchangeinprep", "create"),
        ("/table/exchangeinprep", "delete"),
        ("/table/exchangeinprep", "update"),
        ("/table/exchangeout", "read"),
        ("/table/exchangeout", "update"),
        ("/table/exchangeout", "delete"),
        ("/table/exchangeout", "create"),
        ("/table/exchangeoutprep", "read"),
        ("/table/exchangeoutprep", "create"),
        ("/table/exchangeoutprep", "update"),
        ("/table/exchangeoutprep", "delete"),
        ("/table/gift", "read"),
        ("/table/gift", "create"),
        ("/table/gift", "update"),
        ("/table/gift", "delete"),
        ("/table/giftagent", "read"),
        ("/table/giftagent", "create"),
        ("/table/giftagent", "update"),
        ("/table/giftagent", "delete"),
        ("/table/giftpreparation", "read"),
        ("/table/giftpreparation", "update"),
        ("/table/giftpreparation", "delete"),
        ("/table/giftpreparation", "create"),
        ("/table/inforequest", "read"),
        ("/table/inforequest", "create"),
        ("/table/inforequest", "update"),
        ("/table/inforequest", "delete"),
        ("/table/loan", "read"),
        ("/table/loan", "create"),
        ("/table/loan", "update"),
        ("/table/loan", "delete"),
        ("/table/loanagent", "read"),
        ("/table/loanagent", "create"),
        ("/table/loanagent", "update"),
        ("/table/loanagent", "delete"),
        ("/table/loanpreparation", "read"),
        ("/table/loanpreparation", "create"),
        ("/table/loanpreparation", "update"),
        ("/table/loanpreparation", "delete"),
        ("/table/loanreturnpreparation", "read"),
        ("/table/loanreturnpreparation", "create"),
        ("/table/loanreturnpreparation", "update"),
        ("/table/loanreturnpreparation", "delete"),
        ("/table/permit", "read"),
        ("/table/permit", "create"),
        ("/table/permit", "update"),
        ("/table/permit", "delete"),
        ("/table/shipment", "read"),
        ("/table/shipment", "create"),
        ("/table/shipment", "update"),
        ("/table/shipment", "delete"),
        ("/table/borrowattachment", "read"),
        ("/table/borrowattachment", "create"),
        ("/table/borrowattachment", "update"),
        ("/table/borrowattachment", "delete"),
        ("/table/deaccessionattachment", "read"),
        ("/table/deaccessionattachment", "create"),
        ("/table/deaccessionattachment", "update"),
        ("/table/deaccessionattachment", "delete"),
        ("/table/disposalattachment", "read"),
        ("/table/disposalattachment", "create"),
        ("/table/disposalattachment", "update"),
        ("/table/disposalattachment", "delete"),
        ("/table/giftattachment", "read"),
        ("/table/giftattachment", "create"),
        ("/table/giftattachment", "update"),
        ("/table/giftattachment", "delete"),
        ("/table/loanattachment", "create"),
        ("/table/loanattachment", "update"),
        ("/table/loanattachment", "delete"),
        ("/table/loanattachment", "read"),
        ("/table/permitattachment", "read"),
        ("/table/permitattachment", "create"),
        ("/table/permitattachment", "update"),
        ("/table/permitattachment", "delete"),
    ]:
        get_or_create_policy(manage_interactions, resource, action)

    print_reports = get_or_create_role(
        LibraryRole,
        "Print Reports",
        "Gives ability to execute reports from any table."
    )
    for resource, action in [
        ("/report", "execute"),
        ("/table/%", "read"),
    ]:
        get_or_create_policy(print_reports, resource, action)

    legacy_read_only = get_or_create_role(
        LibraryRole,
        "Read Only - Legacy",
        ("This is a legacy role that provides read only access and is assigned to user in the Limited Access and Guest groups from Specify 6. "
         "This is to maintain consistency with the permissions granted these users in previous versions of Specify 7.")
    )
    for resource, action in [
        ("/field/%", "%"),
        ("/table/%", "read"),
        ("/querybuilder/%", "%"),
    ]:
        get_or_create_policy(legacy_read_only, resource, action)

    run_queries = get_or_create_role(
        LibraryRole,
        "Run Queries",
        "Gives access to execute queries on any table, export query results and create record sets."
    )
    for resource, action in [
        ("/querybuilder/query", "execute"),
        ("/querybuilder/query", "export_csv"),
        ("/querybuilder/query", "export_kml"),
        ("/querybuilder/query", "create_recordset"),
        ("/table/spquery", "read"),
        ("/table/spquery", "create"),
        ("/table/spquery", "update"),
        ("/table/spquery", "delete"),
        ("/table/spqueryfield", "read"),
        ("/table/spqueryfield", "create"),
        ("/table/spqueryfield", "update"),
        ("/table/spqueryfield", "delete"),
        ("/table/recordset", "read"),
        ("/table/recordset", "create"),
        ("/table/recordset", "update"),
        ("/table/recordset", "delete"),
        ("/table/recordsetitem", "read"),
        ("/table/recordsetitem", "create"),
        ("/table/recordsetitem", "update"),
        ("/table/recordsetitem", "delete"),
        ("/table/%", "read"),
    ]:
        get_or_create_policy(run_queries, resource, action)

    security_admin = get_or_create_role(
        LibraryRole,
        "Security Admin",
        "Grants full access to security settings within a collection."
    )
    for resource, action in [
        ("/permissions/%", "read"),
        ("/permissions/%", "update"),
        ("/permissions/%", "create"),
        ("/permissions/%", "delete"),
        ("/permissions/%", "copy_from_library"),
        ("/table/specifyuser", "read"),
        ("/table/specifyuser", "create"),
        ("/table/specifyuser", "update"),
        ("/table/specifyuser", "delete"),
    ]:
        get_or_create_policy(security_admin, resource, action)

    collection_admin = get_or_create_role(
        LibraryRole,
        "Collection Admin",
        "Grants full access to all abilities within a collection."
    )
    get_or_create_policy(collection_admin, "%", "%")

    legacy_full_access = get_or_create_role(
        LibraryRole,
        "Full Access - Legacy",
        ("This is a legacy role that provides read write access to most Specify resources and is assigned to users in the Full Access group from Specify 6. "
         "This is to maintain consistency with the permissions granted these users in previous versions of Specify 7.")
    )
    get_or_create_policy(legacy_full_access, "/field/%", "%")
    get_or_create_policy(legacy_full_access, "/table/%", "read")
    for table in datamodel.tables:
        if not table.system or table.name.endswith('Attachment'):
            get_or_create_policy(legacy_full_access, f"/table/{table.name.lower()}", "%")
    for resource in ["/table/picklist", "/table/picklistitem",
                     "/table/recordset", "/table/recordsetitem",
                     "/table/spquery", "/table/spqueryfield",
                     "/tree/%", "/report", "/querybuilder/%"]:
        get_or_create_policy(legacy_full_access, resource, "%")

    # Copy library Roles into individual collections
    users = Specifyuser.objects.all()
    user_types = {user.usertype for user in users}

    if 'Guest' in user_types or 'LimitedAccess' in user_types:
        for collection in Collection.objects.all():
            coll_read_only = get_or_create_role(
                Role,
                legacy_read_only.name,
                legacy_read_only.description,
                extra_fields={'collection_id': collection.id}
            )
            for lp in legacy_read_only.policies.all():
                get_or_create_policy(coll_read_only, lp.resource, lp.action)

    if 'FullAccess' in user_types:
        for collection in Collection.objects.all():
            coll_full_access = get_or_create_role(
                Role,
                legacy_full_access.name,
                legacy_full_access.description,
                extra_fields={'collection_id': collection.id}
            )
            for lp in legacy_full_access.policies.all():
                get_or_create_policy(coll_full_access, lp.resource, lp.action)

    for collection_id in Collection.objects.values_list('id', flat=True):
        ca = get_or_create_role(
            Role,
            collection_admin.name,
            collection_admin.description,
            extra_fields={'collection_id': collection_id}
        )
        for lp in collection_admin.policies.all():
            get_or_create_policy(ca, lp.resource, lp.action)
