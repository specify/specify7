import sys
import logging

from collections import defaultdict

from django.db import transaction, connection
from django.db.models.functions import Lower
from django.apps import apps

from specifyweb.specify.datamodel import datamodel
from specifyweb.specify.models_utils.model_extras import is_legacy_admin
from .permissions import CollectionAccessPT

logger = logging.getLogger(__name__)

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

def is_sp6_user_permissions_migrated(user, apps=apps) -> bool:
    UserPolicy = apps.get_model('permissions', 'UserPolicy')
    UserRole = apps.get_model('permissions', 'UserRole')
    return UserRole.objects.filter(specifyuser=user).exists() or \
        UserPolicy.objects.filter(specifyuser=user).exists()

def initialize(wipe: bool=False, apps=apps) -> None:
    with transaction.atomic():
        if wipe:
            wipe_permissions(apps)
        create_admins(apps)
        create_roles(apps)
        if 'test' in ''.join(sys.argv):
            assign_users_to_roles_during_testing(apps)
        else:
            assign_users_to_roles(apps)

def create_admins(apps=apps) -> None:
    UserPolicy = apps.get_model('permissions', 'UserPolicy')
    Specifyuser = apps.get_model('specify', 'Specifyuser')

    users = Specifyuser.objects.all()
    for user in users:
        # REFACTOR: Try and fold the following checks into a single query to
        # avoid making multiple queries per user.
        # Ideally, we only make a single query to fetch all users that:
        # - Are not already Institution Admins
        # - Have not already seen activity in Sp 7 (don't have Sp7 permissions)
        #   - (The Institution Admin permission could have been intentionally
        #      removed)
        # - Are admins in Sp 6

        # The ordering here for checks here is intentional: it's more likely a
        # user has Sp 7 permissions than being an admin, so we do the former
        # check first
        if is_sp6_user_permissions_migrated(user=user, apps=apps):
            continue
        if UserPolicy.objects.filter(
            collection__isnull=True,
            specifyuser_id=user.id,
            resource="%",
            action="%",
        ).exists():
            continue
        if is_legacy_admin(user):
            UserPolicy.objects.get_or_create(
                collection=None,
                specifyuser_id=user.id,
                resource="%",
                action="%",
            )

_USERTYPES_TO_ROLE_NAMES = {
    "Manager": "Collection Admin",
    "FullAccess": "Full Access - Legacy",
    "LimitedAccess": "Read Only - Legacy",
    "Guest": "Read Only - Legacy",
}

def assign_users_to_roles(apps=apps) -> None:
    Role = apps.get_model('permissions', 'Role')
    UserPolicy = apps.get_model('permissions', 'UserPolicy')
    Agent = apps.get_model('specify', 'Agent')
    UserPolicy = apps.get_model('permissions', 'UserPolicy')
    UserRole = apps.get_model('permissions', 'UserRole')

    ROLE_DESCRIPTIONS = {
        "Manager": "Grants full access to all abilities within a collection.",
        "FullAccess": "This is a legacy role that provides read write access to most Specify resources and is assigned to users in the Full Access group from Specify 6. This is to maintain consistency with the permissions granted these users in previous versions of Specify 7.",
        "LimitedAccess": "This is a legacy role that provides read only access and is assigned to user in the Limited Access and Guest groups from Specify 6. This is to maintain consistency with the permissions granted these users in previous versions of Specify 7.",
        "Guest": "This is a legacy role that provides read only access and is assigned to user in the Limited Access and Guest groups from Specify 6. This is to maintain consistency with the permissions granted these users in previous versions of Specify 7.",
    }

    results = []

    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT
                u.SpecifyUserID as user_id,
                u.Name as user_name,
                u.UserType as user_type,
                p.usergroupscopeid as collection_id,
                c.CollectionName as collection_name
            FROM specifyuser u
            JOIN specifyuser_spprincipal up ON up.SpecifyUserID = u.SpecifyUserID
            JOIN spprincipal p ON p.SpPrincipalID = up.SpPrincipalID
            JOIN collection c ON c.UserGroupScopeId = p.userGroupScopeID
            WHERE p.groupType IS NULL
            AND NOT EXISTS (
                SELECT 1
                FROM spuserrole ur 
                JOIN sprole r ON r.id = ur.role_id 
                WHERE r.collection_id = c.UserGroupScopeId
                AND ur.specifyuser_id = u.SpecifyUserID
            );
        """)

        results = cursor.fetchall()
    
    for user_id, user_name, user_type, collection_id, collection_name in results:
        # REFACTOR: If we want to exlcude all other roles, why don't we write
        # the exlcusion in the query rather than evaluate in Python?
        if user_type not in _USERTYPES_TO_ROLE_NAMES.keys():
            continue

        role_name = _USERTYPES_TO_ROLE_NAMES.get(user_type, f"{user_type} - {collection_name}")
        role_description = ROLE_DESCRIPTIONS.get(user_type, "No description available.")

        role, _ = Role.objects.get_or_create(
            collection_id=collection_id,
            name=role_name,
            defaults={
                "description": role_description
            }
        )
        # BUG: What if the user was intentionally removed from this role?
        # This would incorrectly re-add them :(
        UserRole.objects.get_or_create(
            specifyuser_id=user_id,
            role=role
        )

        if Agent.objects.filter(specifyuser_id=user_id, division__disciplines__collections__id=collection_id).exists():
            UserPolicy.objects.get_or_create(
                collection_id=collection_id,
                specifyuser_id=user_id,
                resource=CollectionAccessPT.access.resource(),
                action=CollectionAccessPT.access.action()
            )
        logger.info(f"Assigned user {user_name} to role {role_name} for collection {collection_name}.")

def assign_users_to_roles_during_testing(apps=apps) -> None:
    from specifyweb.backend.context.views import users_collections_for_sp6

    Role = apps.get_model('permissions', 'Role')
    UserPolicy = apps.get_model('permissions', 'UserPolicy')
    UserRole = apps.get_model('permissions', 'UserPolicy')
    Specifyuser = apps.get_model('specify', 'Specifyuser')
    Agent = apps.get_model('specify', 'Agent')

    roles_queryset = Role.objects.order_by("collection").values_list("pk","name", "collection__pk")

    # This contains a mapping of Role Names -> Role IDs for each collection
    # Specifically, the mapping is: CollectionID -> RoleName -> RoleID
    roles: dict[int, dict[str, int]] = defaultdict(dict)

    for (role_id, role_name, collection_id) in roles_queryset:
        roles[collection_id][role_name] = role_id

    user_type_to_userrole = {
        "Manager": "Collection Admin",
        "FullAccess": "Full Access - Legacy",
        "LimitedAccess": "Read Only - Legacy",
        "Guest": "Read Only - Legacy"
    }

    users = Specifyuser.objects.filter(usertype__in=user_type_to_userrole.keys()).values_list("pk", "usertype")

    user_roles = []

    for collection_id in roles.keys():
        for (user_id, usertype) in users:
            role_name = user_type_to_userrole[usertype]
            user_roles.append(
                UserRole(specifyuser_id=user_id, role_id=roles[collection_id][role_name])
            )

    UserRole.objects.bulk_create(user_roles)

    with connection.cursor() as cursor:
        for user in Specifyuser.objects.all():
            for colid, _ in users_collections_for_sp6(cursor, user.id):
                # Does the user has an agent for the collection?
                if Agent.objects.filter(specifyuser=user, division__disciplines__collections__id=colid).exists():
                    # Give them access to the collection.
                    UserPolicy.objects.get_or_create(
                        collection_id=colid,
                        specifyuser_id=user.id,
                        resource=CollectionAccessPT.access.resource(),
                        action=CollectionAccessPT.access.action(),
                    )

_INTERACTION_TABLES = (
    "appraisal", "inforequest", "permit", "shipment",
    "borrow", "borrowagent", "borrowmaterial", "borrowreturnmaterial",
    "deaccession", "deaccessionagent",
    "disposal", "disposalagent", "disposalpreparation",
    "exchangein", "exchangeinprep",
    "exchangeout", "exchangeoutprep",
    "gift", "giftagent", "giftpreparation",
    "loan", "loanagent", "loanpreparation", "loanreturnpreparation",
    "borrowattachment", "deaccessionattachment", "disposalattachment",
    "giftattachment", "loanattachment", "permitattachment"
)

LIBRARY_ROLES = {
    "Assign Roles": {
        "description": "Gives ability to assign existing roles to existing users.",
        "policies": {
            "/permissions/user/roles": ("read", "update"),
            "/permissions/roles": ("read",)
        }
    },
    "Create Data Sets": {
        "description": "Allows creating new Data Sets in the WorkBench, without ability to upload them.\n\nSuch user would create a Data Sets, map the columns, fix validation issues, and then transfer the Data Set to another user for review and upload.",
        "policies": {
            "/workbench/dataset": ("create", "update", "delete", "validate", "transfer")
        }
    },
    "Edit Forms and Global Preferences": {
        "description": "Grants full access to resource editor. This allows editing form definitions and global Specify preferences.",
        "policies": {
            "/table/spappresource": ("read", "create", "update", "delete"),
            "/table/spappresourcedata": ("read", "create", "update", "delete"),
            "/table/spappresourcedir": ("read", "create", "update", "delete"),
            "/table/spviewsetobj": ("read", "create", "update", "delete")
        }
    },
    "Edit Pick lists": {
        "description": "Gives full access to modifying pick lists.",
        "policies": {
            "/table/picklist": ("read", "create", "update", "delete"),
            "/table/picklistitem": ("read", "create", "update", "delete")
        }
    },
    "Edit Taxon Tree": {
        "description": "Gives full access to the Taxon Tree.\n\nWarning: Taxon Tree may be shared between collections. Edits in one collection may affect another.",
        "policies": {
            "/tree/edit/taxon": ("merge", "move", "synonymize", "desynonymize", "repair"),
            "/table/taxon": ("read", "create", "update", "delete"),
            "/table/taxonattribute": ("read", "create", "update", "delete"),
            "/table/taxoncitation": ("read", "create", "update", "delete"),
            "/table/taxontreedef": ("read", "update"),
            "/table/taxontreedefitem": ("read", "update"),
            "/table/taxonattachment": ("read", "create", "update", "delete")
        }
    },
    "Export Data": {
        "description": "Gives ability to export DwC Archive from any table.",
        "policies": {
            "/export/dwca": ("execute",),
            "/table/%": ("read",)
        }
    },
    "Full Data Access": {
        "description": "Grants read and edit access to all tables",
        "policies": {
            "/table/%": ("read", "create", "update", "delete")
        }
    },
    "Full WorkBench access": {
        "description": "Gives full access to the WorkBench. Allows creating new records in any table.",
        "policies": {
            "/workbench/dataset": ("create", "update", "delete", "validate", "upload", "unupload", "transfer"),
            "/table/%": ("read", "create")
        }
    },
    "Inspect Audit Log": {
        "description": "Allows to run a query builder query on the Audit Log table.",
        "policies": {
            "/table/spauditlog": ("read",),
            "/table/spauditlogfield": ("read",),
            "/querybuilder/query": ("execute",)
        }
    },
    "Manage Interactions": {
        "description": "Grants full access to interactions tables.",
        "policies": {
            f"/table/{interaction_table}": ("read", "create", "update", "delete")
            for interaction_table in _INTERACTION_TABLES
        }
    },
    "Print Reports": {
        "description": "Gives ability to execute reports from any table.",
        "policies": {
            "/report": ("execute",),
            "/table/%": ("read",)
        }
    },
    "Read-Only Access": {
        "description": "Grants read access to all tables",
        "policies": {
            "/table/%": ("read",)
        }
    },
    "Run Queries": {
        "description": "Gives access to execute queries on any table, export query results and create record sets.",
        "policies": {
            "/querybuilder/query": ("execute", "export_csv", "export_kml", "create_recordset"),
            "/table/spquery": ("read", "create", "update", "delete"),
            "/table/spqueryfield": ("read", "create", "update", "delete"),
            "/table/recordset": ("read", "create", "update", "delete"),
            "/table/recordsetitem": ("read", "create", "update", "delete"),
            "/table/%": ("read", )
        }
    },
    "Security Admin": {
        "description": "Grants full access to security settings within a collection.",
        "policies": {
            "/permissions/%": ("read", "create", "update", "delete", "copy_from_library"),
            "/table/specifyuser": ("read", "create", "update", "delete")
        }
    },
    "Collection Admin": {
        "description": "Grants full access to all abilities within a collection.",
        "policies": {
            "%": ("%",)
        }
    },
    "Read Only - Legacy": {
        "description": "This is a legacy role that provides "
        "read only access and is assigned to user in the "
        "Limited Access and Guest groups from Specify 6. "
        "This is to maintain consistency with the permissions "
        "granted these users in previous versions of Specify 7.",
        "policies": {
            "/field/%": ("%",),
            "/table/%": ("read",),
            "/querybuilder/%": ("%",)
        }
    },
    "Full Access - Legacy": {
        "description": "This is a legacy role that provides "
        "read write access to most Specify resources and "
        "is assigned to users in the Full Access group from Specify 6. "
        "This is to maintain consistency with the permissions "
        "granted these users in previous versions of Specify 7.",
        "policies": {
            "/field/%": ("%",),
            "/table/%": ("read",),
            **{
                f"/table/{table.name.lower()}": ("%",)
                for table in datamodel.tables
                if not table.system or table.name.endswith("Attachment")
            },
            "/table/picklist": ("%",),
            "/table/picklistitem": ("%",),
            "/table/recordset": ("%",),
            "/table/recordsetitem": ("%",),
            "/table/spquery": ("%",),
            "/table/spqueryfield": ("%",),
            "/tree/%": ("%",),
            "/report": ("%",),
            "/querybuilder/%": ("%",)
        }
    }
}

def _create_role_and_policies(role_model, role_policy_model, role_name: str, role_filters: dict = dict()):
    resolved_role = LIBRARY_ROLES[role_name]
    role, is_new = role_model.objects.get_or_create(
        name=role_name,
        **role_filters,
        defaults={
            "description": resolved_role["description"]
        }
    )
    if not is_new:
        return role

    role_policy_model.objects.bulk_create(
        [
            role_policy_model(
                role=role,
                resource=resource,
                action=action
            )
            for policy in resolved_role["policies"]
            for resource, actions in policy.items()
            for action in actions
        ]
    )

def create_missing_library_roles(apps = apps):
    LibraryRole = apps.get_model('permissions', 'LibraryRole')
    LibraryRolePolicy = apps.get_model('permissions', 'LibraryRolePolicy')
    all_roles = set(LIBRARY_ROLES.keys())

    existing_role_names = LibraryRole.objects.annotate(
        name_lower=Lower("name")
    ).filter(
        name_lower__in=(role.lower() for role in all_roles)
    ).values_list("name", flat=True)

    missing_roles = all_roles - set(existing_role_names)
    for missing_role in missing_roles:
        _create_role_and_policies(
            LibraryRole,
            LibraryRolePolicy,
            missing_role
        )


def create_roles(apps = apps) -> None:
    Role = apps.get_model('permissions', 'Role')
    RolePolicy = apps.get_model('permissions', 'RolePolicy')
    Collection = apps.get_model('specify', 'Collection')
    Specifyuser = apps.get_model('specify', 'Specifyuser')
    
    create_missing_library_roles(apps)

    # copy the appropriate roles into the individual collections.
    user_types = Specifyuser.objects.all().values_list("usertype", flat=True).distinct()

    has_guest = 'Guest' in user_types or 'LimitedAccess' in user_types
    has_full_access = 'FullAccess' in user_types

    for collection_id in Collection.objects.all().values_list("pk", flat=True):
        if has_guest:
            _create_role_and_policies(
                Role,
                RolePolicy,
                _USERTYPES_TO_ROLE_NAMES.get('Guest', 'Read Only - Legacy'),
                {
                    "collection_id": collection_id
                }
            )
        if has_full_access:
            _create_role_and_policies(
                Role,
                RolePolicy,
                _USERTYPES_TO_ROLE_NAMES.get('FullAccess', 'Full Access - Legacy'),
                {
                    "collection_id": collection_id
                }
            )
        _create_role_and_policies(
            Role,
            RolePolicy,
            _USERTYPES_TO_ROLE_NAMES.get('Manager', 'Collection Admin'),
            {
                "collection_id": collection_id
            }
        )
