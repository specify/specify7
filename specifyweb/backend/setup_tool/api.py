import json
from django.http import (JsonResponse)
from django.db.models import Max
from django.db import transaction

from specifyweb.backend.permissions.models import UserPolicy
from specifyweb.specify.models import Spversion
from specifyweb.specify import models
from specifyweb.backend.setup_tool.utils import normalize_keys, resolve_uri_or_fallback
from specifyweb.backend.setup_tool.schema_defaults import apply_schema_defaults
from specifyweb.backend.setup_tool.picklist_defaults import create_default_picklists
from specifyweb.backend.setup_tool.prep_type_defaults import create_default_prep_types
from specifyweb.backend.setup_tool.setup_tasks import setup_database_background, get_active_setup_task, get_last_setup_error, set_last_setup_error, MissingWorkerError
from specifyweb.backend.setup_tool.tree_defaults import create_default_tree, update_tree_scoping
from specifyweb.specify.models import Institution, Discipline

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

    return {
        "resources": completed_resources,
        "last_error": last_error,
        "busy": busy,
    }

def get_setup_resource_progress() -> dict:
    """Returns a dictionary of the status of database setup resources."""
    institution_created = models.Institution.objects.exists()
    institution = models.Institution.objects.first()
    globalGeographyTree = institution and institution.issinglegeographytree

    return {
        "institution": institution_created,
        "storageTreeDef": models.Storagetreedef.objects.exists(),
        "globalGeographyTreeDef": institution_created and ((not globalGeographyTree) or models.Geographytreedef.objects.exists()),
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
    # Check permission and only allow POST requests
    if not _guided_setup_condition(request):
        return JsonResponse({"error": "Not permitted"}, status=401)
    if request.method != 'POST':
        return JsonResponse({"error": "Invalid request"}, status=400)

    raw_data = json.loads(request.body)
    data = normalize_keys(raw_data)

    try:
        response = create_resource(data)
        return JsonResponse({"success": True, "setup_progress": get_setup_progress(), **response}, status=200)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

def setup_database(request, direct=False):
    """Creates all database setup resources sequentially in the background. Atomic."""
    # Check permission and only allow POST requests
    if not _guided_setup_condition(request):
        return JsonResponse({"error": "Not permitted"}, status=401)
    if request.method != 'POST':
        return JsonResponse({"error": "Invalid request"}, status=400)
    
    # Check that there isn't another setup task running.
    active_setup_task, busy = get_active_setup_task()
    if busy:
        return JsonResponse({"error": "Database setup is already in progress."}, status=400)
    
    try:
        logger.debug("Starting Database Setup.")
        raw_data = json.loads(request.body)
        data = normalize_keys(raw_data)

        task_id = setup_database_background(data)

        logger.debug("Database setup started successfully.")
        return JsonResponse({"success": True, "setup_progress": get_setup_progress(), "task_id": task_id}, status=200)
    except MissingWorkerError as e:
        logger.exception(str(e))
        return JsonResponse({'error': str(e)}, status=500)
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
    return {'institution_id': new_institution}

def create_division(data):
    from specifyweb.specify.models import Division, Institution

    # If division_id is provided and exists, return success
    existing_id = data.pop('division_id', None)
    if existing_id:
        existing_division = Division.objects.filter(id=existing_id).first()
        if existing_division:
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
    for key in ['_tableName', 'success']:
        data.pop(key, None)

    # Create new division
    try:
        new_division = Division.objects.create(**data)
        return {"division_id": new_division.id}
    except Exception as e:
        logger.exception(f'Division error: {e}')
        raise SetupError(e)

def create_discipline(data):
    from specifyweb.specify.models import (
        Division, Datatype, Geographytreedef,
        Geologictimeperiodtreedef
    )

    # Check if discipline_id is provided and already exists
    existing_id = data.pop('discipline_id', None)
    if existing_id:
        existing_discipline = Discipline.objects.filter(id=existing_id).first()
        if existing_discipline:
            return {"discipline_id": existing_discipline.id}

    # Resolve division
    division_url = data.get('division')
    division = resolve_uri_or_fallback(division_url, None, Division)
    if not division:
        raise SetupError("No Division available to assign")

    data['division'] = division
    
    # Ensure required foreign key objects exist
    datatype = Datatype.objects.last() or Datatype.objects.create(id=1, name='Biota')
    geographytreedef_url = data.pop('geographytreedef', None)
    geologictimeperiodtreedef_url = data.pop('geologictimeperiodtreedef', None)
    geographytreedef = resolve_uri_or_fallback(geographytreedef_url, None, Geographytreedef)
    geologictimeperiodtreedef = resolve_uri_or_fallback(geologictimeperiodtreedef_url, None, Geologictimeperiodtreedef)

    if geographytreedef is None or geologictimeperiodtreedef is None:
        raise SetupError("A Geography tree and Chronostratigraphy tree must exist before creating an institution.")

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

        # Check if initial setup.
        if not division_url:
            # Create Splocalecontainers for all datamodel tables
            apply_schema_defaults(new_discipline)

            # Update tree scoping
            update_tree_scoping(geographytreedef, new_discipline.id)
            update_tree_scoping(geologictimeperiodtreedef, new_discipline.id)

        return {"discipline_id": new_discipline.id}

    except Exception as e:
        raise SetupError(e)

def create_collection(data):
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
    discipline_url = data.pop('discipline', None)
    discipline = resolve_uri_or_fallback(discipline_url, discipline_id, Discipline)
    if discipline is not None:
        data['discipline_id'] = discipline.id
    else:
        raise SetupError(f"No discipline available")
    
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
        # Create Collection Object Type
        # TODO

        return {"collection_id": new_collection.id}
    except Exception as e:
        raise SetupError(e)

def create_specifyuser(data):
    from specifyweb.specify.models import Specifyuser, Agent, Division, Collection

    # Assign ID manually
    max_id = Specifyuser.objects.aggregate(Max('id'))['id__max'] or 0
    data['id'] = max_id + 1

    # Ensure there is an Agent
    agent = Agent.objects.last()
    if not agent:
        agent = Agent.objects.create(
            id=1,
            agenttype=1,
            firstname='spadmin',
            division=Division.objects.last(),
        )

    try:
        # Create user
        new_user = Specifyuser.objects.create(**data)
        new_user.set_password(new_user.password)
        new_user.save()

        # Grant permissions
        UserPolicy.objects.create(
            specifyuser=new_user,
            collection=Collection.objects.last(),
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

def create_global_geography_tree(data):
    return create_tree('Geography', data)

def create_geography_tree(data):
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
    # TODO: Use trees/create_default_trees
    # https://github.com/specify/specify7/pull/6429

    # Figure out which scoping field should be used.
    use_institution = False
    use_discipline = True
    if name == 'Storage':
        use_institution = True
        use_discipline = False

    # Handle institution assignment
    institution = None
    if use_institution:
        institution_url = data.pop('institution', None)
        institution = resolve_uri_or_fallback(institution_url, None, Institution)

    # Handle discipline reference from URL
    discipline = None
    if use_discipline:
        discipline_url = data.get('discipline', None)
        discipline = resolve_uri_or_fallback(discipline_url, None, Discipline)

    # Get tree configuration
    ranks = data.pop('ranks', dict())
    
    try:
        kwargs = {}
        kwargs['fullnamedirection'] = data.get('fullnamedirection', 1)
        if use_institution:
            kwargs['institution'] = institution
        if use_discipline and discipline is not None:
            kwargs['discipline'] = discipline

        treedef = create_default_tree(name, kwargs, ranks)
        return {'treedef_id': treedef.id}
    except Exception as e:
        raise SetupError(e)