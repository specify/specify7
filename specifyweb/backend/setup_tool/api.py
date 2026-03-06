"""
API for creating database setup resources (Institution, Discipline, etc.).
These will be called in the correct order by the background setup task in setup_tasks.py.
"""

import json
from typing import Optional
from django.http import (JsonResponse)
from django.db.models import Max
from django.db import transaction

from specifyweb.backend.permissions.models import UserPolicy

from specifyweb.specify.models import Spversion
from specifyweb.specify import models
from specifyweb.backend.setup_tool.utils import normalize_keys, resolve_uri_or_fallback
from specifyweb.backend.setup_tool.schema_defaults import (
    apply_schema_defaults,
    queue_apply_schema_defaults_background,
)
from specifyweb.backend.setup_tool.picklist_defaults import create_default_picklists
from specifyweb.backend.setup_tool.prep_type_defaults import create_default_prep_types
from specifyweb.backend.setup_tool.app_resource_defaults import ensure_discipline_resource_dir
from specifyweb.backend.setup_tool.setup_tasks import (
    setup_database_background,
    get_active_setup_task,
    get_last_setup_error,
    set_last_setup_error,
    queue_fix_schema_config_background,
)
from specifyweb.celery_tasks import MissingWorkerError, get_running_worker_task_names
from specifyweb.backend.setup_tool.tree_defaults import start_default_tree_from_configuration, update_tree_scoping
from specifyweb.backend.setup_tool.task_tracking import (
    is_collection_ready_for_config_tasks,
    is_discipline_ready_for_config_tasks,
)
from specifyweb.specify.models import Institution, Discipline
from specifyweb.backend.businessrules.uniqueness_rules import apply_default_uniqueness_rules
from specifyweb.specify.management.commands.run_key_migration_functions import fix_cots, fix_schema_config

import logging
logger = logging.getLogger(__name__)

APP_VERSION = "7"
SCHEMA_VERSION = "2.10"

class SetupError(Exception):
    """Raised by any setup tasks."""
    pass

def get_setup_progress() -> dict:
    """Returns a dictionary of the status of the database setup."""
    # Check if setup is currently in progress
    active_setup_task, busy = get_active_setup_task()

    completed_resources = None
    last_error = None
    # Get setup progress if its currently in progress.
    if active_setup_task:
        info = getattr(active_setup_task, "info", None) or getattr(active_setup_task, "result", None)
        if isinstance(info, dict):
            completed_resources = info.get('progress', None)
            last_error = info.get('error', get_last_setup_error())
            if last_error is not None:
                set_last_setup_error(last_error)
    
    if completed_resources is None:
        completed_resources = get_setup_resource_progress()
        last_error = get_last_setup_error()

    if not busy:
        setup_complete = _setup_resources_complete(completed_resources)
        if active_setup_task is not None or not setup_complete:
            busy = is_config_task_running()
    return {
        "resources": completed_resources,
        "last_error": last_error,
        "busy": busy,
    }

def _setup_resources_complete(completed_resources: dict) -> bool:
    return all(bool(resource_ready) for resource_ready in completed_resources.values())

def get_setup_resource_progress() -> dict:
    """Returns a dictionary of the status of database setup resources."""
    return {
        "institution": models.Institution.objects.exists(),
        "storageTreeDef": models.Storagetreedef.objects.exists(),
        "division": models.Division.objects.exists(),
        "discipline": models.Discipline.objects.exists(),
        "geographyTreeDef": models.Geographytreedef.objects.exists(),
        "taxonTreeDef": models.Taxontreedef.objects.exists(),
        "collection": models.Collection.objects.exists(),
        "specifyUser": models.Specifyuser.objects.exists(),
    }

def _guided_setup_condition(request) -> bool:
    from specifyweb.specify.models import Specifyuser
    if Specifyuser.objects.exists():
        is_auth = request.user.is_authenticated
        user = Specifyuser.objects.filter(id=request.user.id).first()
        if not user or not is_auth or not user.usertype in ('Admin', 'Manager'):
            return False
    return True

def handle_request(request, create_resource, direct=False):
    """Generic handler for any setup resource POST request."""
    # Check permission
    if not _guided_setup_condition(request):
        return JsonResponse({"error": "Not permitted"}, status=401)

    raw_data = json.loads(request.body)
    data = normalize_keys(raw_data)

    try:
        response = create_resource(data)
        return JsonResponse({"success": True, "setup_progress": get_setup_progress(), **response}, status=200)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

def setup_database(request, direct=False):
    """Creates all database setup resources sequentially in the background. Atomic."""
    # Check permission
    if not _guided_setup_condition(request):
        return JsonResponse({"error": "Not permitted"}, status=401)
    
    # Check that there isn't another setup task running.
    active_setup_task, busy = get_active_setup_task()
    if busy:
        return JsonResponse({"error": "Database setup is already in progress."}, status=409)
    
    try:
        logger.debug("Starting Database Setup.")
        raw_data = json.loads(request.body)
        data = normalize_keys(raw_data)

        task_id = setup_database_background(data)

        logger.debug("Database setup started successfully.")
        return JsonResponse({"success": True, "setup_progress": get_setup_progress(), "task_id": task_id}, status=200)
    except MissingWorkerError as e:
        logger.exception(str(e))
        return JsonResponse({'error': str(e)}, status=503)
    except Exception as e:
        logger.exception(str(e))
        return JsonResponse({'error': 'An internal server error occurred.'}, status=500)

def create_institution(data):
    from specifyweb.specify.models import Institution, Address

    # Check that there are no institutions. Only one should ever exist.
    if Institution.objects.count() > 0:
        raise SetupError('An institution already exists, cannot create another.')

    # Get address fields (if any)
    address_data = data.pop('address', None)

    # New DB: force id = 1
    data['id'] = 1

    # Create address
    with transaction.atomic():
        if address_data:
            address_obj = Address.objects.create(**address_data)
            data['address_id'] = address_obj.id

        # Create institution
        new_institution = Institution.objects.create(**data)
        Spversion.objects.create(appversion=APP_VERSION, schemaversion=SCHEMA_VERSION)
    return {'institution_id': new_institution.id}

def create_division(data):
    from specifyweb.specify.models import Division, Institution, Agent, Specifyuser

    def ensure_user_agent_for_division(division) -> None:
        user_ids = Agent.objects.filter(
            specifyuser_id__isnull=False
        ).values_list('specifyuser_id', flat=True).distinct()
        for user in Specifyuser.objects.filter(id__in=user_ids):
            if Agent.objects.filter(specifyuser=user, division=division).exists():
                continue
            template_agent = Agent.objects.filter(specifyuser=user).order_by('id').first()
            if template_agent is None:
                continue
            Agent.objects.create(
                agenttype=template_agent.agenttype,
                lastname=template_agent.lastname or user.name or "User",
                firstname=template_agent.firstname,
                division=division,
                specifyuser=user,
            )

    # If division_id is provided and exists, return success
    existing_id = data.pop('division_id', None)
    if existing_id:
        existing_division = Division.objects.filter(id=existing_id).first()
        if existing_division:
            ensure_user_agent_for_division(existing_division)
            return {"division_id": existing_division.id}

    # Determine new Division ID
    max_id = Division.objects.aggregate(Max('id'))['id__max'] or 0
    data['id'] = max_id + 1

    # Normalize abbreviation
    data['abbrev'] = data.pop('abbreviation', None) or data.get('abbrev', '')

    # Handle institution assignment
    institution_url = data.pop('institution', None)
    institution = resolve_uri_or_fallback(institution_url, None, Institution)
    data['institution_id'] = institution.id if institution else None

    # Remove unwanted keys
    for key in ['_tablename', 'success']:
        data.pop(key, None)

    # Create new division
    try:
        new_division = Division.objects.create(**data)
        ensure_user_agent_for_division(new_division)
        return {"division_id": new_division.id}
    except Exception as e:
        logger.exception(f'Division error: {e}')
        raise SetupError(e)

def create_discipline(data, run_apply_schema_defaults_async: bool = True):
    from specifyweb.specify.models import (
        Division, Datatype, Geographytreedef,
        Geologictimeperiodtreedef, Taxontreedef
    )

    # Check if discipline_id is provided and already exists
    existing_id = data.pop('discipline_id', None)
    if existing_id:
        existing_discipline = Discipline.objects.filter(id=existing_id).first()
        if existing_discipline:
            ensure_discipline_resource_dir(existing_discipline)
            return {"discipline_id": existing_discipline.id}

    # Guard against duplicate discipline names across divisions
    discipline_name = data.get('name')
    if isinstance(discipline_name, str):
        normalized_name = discipline_name.strip()
        data['name'] = normalized_name
        if normalized_name and Discipline.objects.filter(name__iexact=normalized_name).exists():
            raise SetupError(f"A discipline named '{normalized_name}' already exists.")

    # Resolve division
    division_url = data.get('division')
    division_id = data.get('division_id', None)
    division = resolve_uri_or_fallback(division_url, division_id, Division)
    if not division:
        raise SetupError("No Division available to assign")

    data['division_id'] = division.id
    
    # Ensure required foreign key objects exist
    datatype = Datatype.objects.last() or Datatype.objects.create(id=1, name='Biota')
    geographytreedef_url = data.pop('geographytreedef', None)
    geographytreedef_id = data.pop('geographytreedef_id', None)
    geologictimeperiodtreedef_url = data.pop('geologictimeperiodtreedef', None)
    geologictimeperiodtreedef_id = data.pop('geologictimeperiodtreedef_id', None)

    geographytreedef = resolve_uri_or_fallback(geographytreedef_url, geographytreedef_id, Geographytreedef)
    geologictimeperiodtreedef = resolve_uri_or_fallback(geologictimeperiodtreedef_url, geologictimeperiodtreedef_id, Geologictimeperiodtreedef)

    if geologictimeperiodtreedef is None:
        raise SetupError("A Geography tree and Chronostratigraphy tree must exist before creating a discipline.")

    # Assign a taxon tree. Not required, but its eventually needed for collection object type.
    taxontreedef_url = data.get('taxontreedef', None)
    taxontreedef = resolve_uri_or_fallback(taxontreedef_url, None, Taxontreedef)
    if taxontreedef_url and taxontreedef is not None:
        data['taxontreedef_id'] = taxontreedef.id

    data.update({
        'datatype_id': datatype.id,
        'geographytreedef_id': geographytreedef.id,
        'geologictimeperiodtreedef_id': geologictimeperiodtreedef.id
    })

    # Assign new Discipline ID
    max_id = Discipline.objects.aggregate(Max('id'))['id__max'] or 0
    data['id'] = max_id + 1

    # Remove unwanted keys
    for key in ['_tablename', 'success', 'datatype']:
        data.pop(key, None)

    # Create new Discipline
    try:
        new_discipline = Discipline.objects.create(**data)
        ensure_discipline_resource_dir(new_discipline)

        # Create Splocalecontainers for all datamodel tables
        if run_apply_schema_defaults_async:
            queue_apply_schema_defaults_background(new_discipline.id)
        else:
            apply_schema_defaults(new_discipline)

        # Apply default uniqueness rules
        apply_default_uniqueness_rules(new_discipline)

        # Update tree scoping
        update_tree_scoping(geologictimeperiodtreedef, new_discipline.id)

        return {"discipline_id": new_discipline.id}

    except Exception as e:
        raise SetupError(e)

def create_collection(data, run_fix_schema_config_async: bool = True):
    from specifyweb.specify.models import Collection, Discipline

    # If collection_id is provided and exists, return success
    existing_id = data.pop('collection_id', None)
    if existing_id:
        existing_collection = Collection.objects.filter(id=existing_id).first()
        if existing_collection:
            return {"collection_id": existing_collection.id}

    # Assign new Collection ID
    max_id = Collection.objects.aggregate(Max('id'))['id__max'] or 0
    data['id'] = max_id + 1

    # Handle discipline reference from URL
    discipline_id = data.get('discipline_id', None)
    discipline_url = data.get('discipline', None)
    discipline = resolve_uri_or_fallback(discipline_url, discipline_id, Discipline)

    if discipline is not None:
        data['discipline_id'] = discipline.id
        data['discipline'] = discipline
    else:
        raise SetupError("No discipline available")
    
    # The discipline needs a Taxon Tree in order for the Collection Object Type to be created.
    if not discipline.taxontreedef_id:
        raise SetupError("The collection's discipline needs a taxontreedef in order for the Collection Object type to be created.")
    
    # Remove keys that should not be passed to model
    for key in ['_tablename', 'success']:
        data.pop(key, None)

    # Create new Collection
    try:
        new_collection = Collection.objects.create(**data)

        # Create Preparation Types
        create_default_prep_types(new_collection, discipline.type)

        # Create picklists
        create_default_picklists(new_collection, discipline.type)
        if run_fix_schema_config_async:
            queue_fix_schema_config_background(collection_id=new_collection.id)
        else:
            fix_schema_config()
        
        # Create Collection Object Type
        fix_cots()

        return {"collection_id": new_collection.id}
    except Exception as e:
        raise SetupError(e)

def create_specifyuser(data):
    """Creates the first admin user during the initial database setup."""
    from specifyweb.specify.models import Specifyuser, Agent, Division

    # Assign ID manually
    max_id = Specifyuser.objects.aggregate(Max('id'))['id__max'] or 0
    data['id'] = max_id + 1

    username = data.get('username')

    last_name = data.pop('lastname', username)
    if not last_name:
        last_name = username
    first_name = data.pop('firstname', '')

    # Create agent. We can assume no agents already exist.
    agent = Agent.objects.create(
        id=1,
        agenttype=1,
        lastname=last_name,
        firstname=first_name,
        division=Division.objects.last(),
    )

    try:
        # Create user
        new_user = Specifyuser.objects.create(
            **data,
            usertype='Manager'
        )
        new_user.set_password(new_user.password)
        new_user.save()

        # Grant permissions
        UserPolicy.objects.create(
            specifyuser=new_user,
            collection=None,
            resource='%',
            action='%'
        )

        # Link agent to user
        agent.specifyuser = new_user
        agent.save()

        return {"user_id": new_user.id}

    except Exception as e:
        raise SetupError(e)

# Trees
def create_storage_tree(data):
    return create_tree('Storage', data)

def create_geography_tree(data, global_tree: bool = False):
    return create_tree('Geography', data)

def create_taxon_tree(data):
    return create_tree('Taxon', data)

def create_geologictimeperiod_tree(data):
    return create_tree('Geologictimeperiod', data)

def create_lithostrat_tree(data):
    return create_tree('Lithostrat', data)

def create_tectonicunit_tree(data):
    return create_tree('Tectonicunit', data)

def create_tree(name: str, data: dict) -> dict:
    # Figure out which scoping field should be used.
    use_institution = False
    use_discipline = True
    if name == 'Storage':
        use_institution = True
        use_discipline = False

    # Handle institution assignment
    institution = None
    if use_institution:
        institution_id = data.pop('institution_id', None)
        institution_url = data.pop('institution', None)
        institution = resolve_uri_or_fallback(institution_url, institution_id, Institution)

    # Handle discipline reference from URL
    discipline = None
    if use_discipline:
        discipline_id = data.get('discipline_id', None)
        discipline_url = data.get('discipline', None)
        discipline = resolve_uri_or_fallback(discipline_url, discipline_id, Discipline)

    # Get tree configuration
    ranks = data.pop('ranks', dict())

    # Properties for pre-loading default tree. Pre-loading should be done once setup is complete.
    preload_tree = data.pop('preload', None)
    preload_tree_file = data.pop('preloadFile', None)
    
    try:
        kwargs = {}
        kwargs['fullnamedirection'] = data.get('fullnamedirection', 1)
        if use_institution:
            kwargs['institution'] = institution
        if use_discipline and discipline is not None:
            kwargs['discipline'] = discipline

        treedef = start_default_tree_from_configuration(name, kwargs, ranks)

        # Set as the primary tree in the institution/discipline if its the first one
        tree_field_name = f'{name.lower()}treedef_id'
        if use_institution and institution:
            if getattr(institution, tree_field_name) is None:
                setattr(institution, tree_field_name, treedef.id)
                institution.save()
        if use_discipline and discipline:
            if getattr(discipline, tree_field_name) is None:
                setattr(discipline, tree_field_name, treedef.id)
                discipline.save()

        # Optionally preload tree
        # NOTE: You probably do not want to do this during the initial setup, as there are still resources missing.
        # if preload_tree:
        #     if discipline is not None:
        #         start_preload_default_tree(name, discipline.id, None, treedef.id, None, preload_tree_file)
        return {'treedef_id': treedef.id}
    except Exception as e:
        raise SetupError(e)

CONFIG_TASKS = frozenset({
    "specifyweb.backend.trees.defaults.create_default_tree_task",
    "specifyweb.backend.setup_tool.setup_tasks.setup_database_task",
    "specifyweb.backend.setup_tool.setup_tasks.fix_schema_config_task",
    "specifyweb.backend.setup_tool.schema_defaults.apply_schema_defaults_task",
})

def _task_name_to_progress_key(task_name: str) -> str:
    """Convert a task function name into a camelCase progress key."""
    task_function_name = task_name.rsplit(".", 1)[-1]
    parts = task_function_name.split("_")
    return parts[0] + "".join(part.title() for part in parts[1:])

def _get_config_resource_progress_from_active_names(active_task_names: set[str]) -> dict:
    """Return config task booleans from a set of active task names"""
    return {
        _task_name_to_progress_key(task_name): task_name in active_task_names
        for task_name in sorted(CONFIG_TASKS)
    }

def is_config_task_running(running_task_names: Optional[list[str]] = None) -> bool:
    """Returns whether any setup or config related Celery task is currently active"""
    if running_task_names is None:
        try:
            running_task_names = get_running_worker_task_names()
        except MissingWorkerError:
            return False

    active_task_names = set(running_task_names)
    return not CONFIG_TASKS.isdisjoint(active_task_names)

def get_config_resource_progress(running_task_names: Optional[list[str]] = None) -> dict:
    """Returns a dictionary of config task activity by task type"""
    active_task_names = set(running_task_names or [])
    return _get_config_resource_progress_from_active_names(active_task_names)


def is_collection_busy_for_config_tasks(
    collection_id: int,
    discipline_id: Optional[int] = None,
) -> bool:
    if discipline_id is None:
        collection = models.Collection.objects.filter(id=collection_id).only("discipline_id").first()
        if collection is None:
            return False
        discipline_id = collection.discipline_id
    return not is_collection_ready_for_config_tasks(collection_id, discipline_id)


def is_discipline_busy_for_config_tasks(discipline_id: int) -> bool:
    return not is_discipline_ready_for_config_tasks(discipline_id)


def filter_ready_collections_for_config_tasks(collections: list) -> list:
    return [
        collection
        for collection in collections
        if not is_collection_busy_for_config_tasks(collection.id, collection.discipline_id)
    ]


def filter_ready_disciplines_for_config_tasks(disciplines: list) -> list:
    return [
        discipline
        for discipline in disciplines
        if not is_discipline_busy_for_config_tasks(discipline.id)
    ]


def get_config_progress(collection_id: Optional[int] = None) -> dict:
    """Returns a dict of the status of config/setup related background tasks"""
    try:
        running_task_names = get_running_worker_task_names()
    except MissingWorkerError:
        running_task_names = []

    busy = (
        is_config_task_running(running_task_names)
        if collection_id is None
        else is_collection_busy_for_config_tasks(collection_id)
    )
    last_error = None
    completed_resources = get_config_resource_progress(running_task_names)

    return {
        "resources": completed_resources,
        "last_error": last_error,
        "busy": busy,
    }
