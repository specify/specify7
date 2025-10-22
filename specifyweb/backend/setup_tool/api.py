import json
from django.http import (JsonResponse)

from specifyweb.backend.permissions.models import UserPolicy
from specifyweb.specify.api_utils import strict_uri_to_model
from specifyweb.specify.models import Spversion
from specifyweb.specify import models
from specifyweb.backend.setup_tool.schema_defaults import apply_schema_defaults
from specifyweb.backend.setup_tool.picklist_defaults import create_default_picklists
from specifyweb.backend.setup_tool.prep_type_defaults import create_default_prep_types
from specifyweb.backend.setup_tool.setup_tasks import setup_database_background

from django.db.models import Max
from django.db import transaction

import logging
logger = logging.getLogger(__name__)

APP_VERSION = "7"
SCHEMA_VERSION = "2.10"

class SetupError(Exception):
    """Raised by any setup tasks."""
    pass

def get_setup_progress():
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

def _guided_setup_condition(request):
    from specifyweb.specify.models import Specifyuser
    if Specifyuser.objects.exists():
        is_auth = request.user.is_authenticated
        user = Specifyuser.objects.filter(id=request.user.id).first()
        if not user or not is_auth or not user.usertype in ('Admin', 'Manager'):
            return False
    return True

def normalize_keys(obj):
    if isinstance(obj, dict):
        return {k.lower(): normalize_keys(v) for k, v in obj.items()}
    else:
        return obj

def handle_request(request, create_resource, direct=False):
    # Check permission
    if not _guided_setup_condition(request):
        return JsonResponse({"error": "Not permitted"}, status=401)

    # Only allow POST requests
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
    if not _guided_setup_condition(request):
        return JsonResponse({"error": "Not permitted"}, status=401)
    if request.method != 'POST':
        return JsonResponse({"error": "Invalid request"}, status=400)
    
    try:
        logger.debug("Starting Database Setup.")
        raw_data = json.loads(request.body)
        data = normalize_keys(raw_data)
        logger.debug(data)
        task_id = setup_database_background(data)
        logger.debug("Database setup stared successfuly.")
        return JsonResponse({"success": True, "setup_progress": get_setup_progress()}, status=200)
    except Exception as e:
        return JsonResponse({'error': 'An internal server error occurred.'}, status=500)

def create_institution(data):
    from specifyweb.specify.models import Institution, Address

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
    existing_id = data.get('division_id')
    if existing_id:
        existing_division = Division.objects.filter(id=existing_id).first()
        if existing_division:
            return {"division_id": existing_division.id}

    # Determine new Division ID
    max_id = Division.objects.aggregate(Max('id'))['id__max'] or 0
    data['id'] = max_id + 1

    # Normalize abbreviation
    data['abbrev'] = data.get('abbreviation') or data.get('abbrev', '')

    # Handle institution assignment
    if 'institution' in data:
        institution_url = data.pop('institution')
        institution = strict_uri_to_model(institution_url, 'institution')
        data['institution_id'] = institution[1]
    else:
        last_institution = Institution.objects.last()
        data['institution_id'] = last_institution.id if last_institution else None

    # Remove unwanted keys
    for key in ['abbreviation', '_tableName', 'success', 'division_id']:
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
        Discipline, Division, Datatype,
        Geographytreedef, Geologictimeperiodtreedef
    )

    # Check if discipline_id is provided and already exists
    existing_id = data.get('discipline_id')
    if existing_id:
        existing_discipline = Discipline.objects.filter(id=existing_id).first()
        if existing_discipline:
            return {"discipline_id": existing_discipline.id}

    # Resolve division
    division_url = data.get('division')
    if division_url:
        try:
            division_id = int(division_url.rstrip('/').split('/')[-1])
            division = Division.objects.get(id=division_id)
        except (ValueError, Division.DoesNotExist):
            raise SetupError("Invalid division URL")
    else:
        division = Division.objects.last()
        if not division:
            raise SetupError("No Division available to assign")

    data['division'] = division

    # Ensure required foreign key objects exist
    datatype = Datatype.objects.last() or Datatype.objects.create(id=1, name='Biota')
    geography_def = Geographytreedef.objects.last() or Geographytreedef.objects.create(id=1, name='Geography')
    geologic_time_def = Geologictimeperiodtreedef.objects.last() or Geologictimeperiodtreedef.objects.create(id=1, name='Chronostratigraphy')

    data.update({
        'datatype_id': datatype.id,
        'geographytreedef_id': geography_def.id,
        'geologictimeperiodtreedef_id': geologic_time_def.id
    })

    # Assign new Discipline ID
    max_id = Discipline.objects.aggregate(Max('id'))['id__max'] or 0
    data['id'] = max_id + 1

    # Remove unwanted keys
    for key in ['_tablename', 'success', 'discipline_id', 'datatype']:
        data.pop(key, None)

    # Create new Discipline
    try:
        new_discipline = Discipline.objects.create(**data)

        # During setup, create Splocalecontainers for all datamodel tables
        if not division_url:
            apply_schema_defaults(new_discipline)

        return {"discipline_id": new_discipline.id}

    except Exception as e:
        raise SetupError(e)

def create_collection(data):
    from specifyweb.specify.models import Collection, Discipline

    # If collection_id is provided and exists, return success
    existing_id = data.get('collection_id')
    if existing_id:
        existing_collection = Collection.objects.filter(id=existing_id).first()
        if existing_collection:
            return {"collection_id": existing_collection.id}

    # Assign new Collection ID
    max_id = Collection.objects.aggregate(Max('id'))['id__max'] or 0
    data['id'] = max_id + 1

    # Handle discipline reference from URL
    discipline_id = data.get('discipline_id', None)
    discipline_url = data.get('discipline')
    if discipline_url:
        try:
            discipline_id = int(discipline_url.rstrip('/').split('/')[-1])
            data['discipline_id'] = discipline_id
        except ValueError:
            raise SetupError("Invalid discipline URL")

    # Fallback to last Discipline if none provided
    if not data.get('discipline_id'):
        last_discipline = Discipline.objects.last()
        if last_discipline:
            discipline_id = last_discipline.id
            data['discipline_id'] = discipline_id
        else:
            raise SetupError("No discipline available")
    
    try:
        discipline = Discipline.objects.get(pk=discipline_id)
    except Discipline.DoesNotExist:
        raise SetupError(f"Discipline with id {discipline_id} not found")
    
    # Remove keys that should not be passed to model
    for key in ['discipline', '_tablename', 'success', 'collection_id']:
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

from .tree_defaults import create_default_tree

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

def create_tree(name: str, data):
    # TODO: Use trees/create_default_trees
    # https://github.com/specify/specify7/pull/6429
    from specifyweb.specify.models import Institution, Discipline

    # Handle institution assignment
    if 'institution' in data:
        institution_url = data.pop('institution')
        institution = strict_uri_to_model(institution_url, 'institution')
        data['institution_id'] = institution[1]
    else:
        institution = Institution.objects.last()
        data['institution_id'] = institution.id if institution else None

    # Handle discipline reference from URL
    if name != 'Storage':
        discipline_id = data.get('discipline_id', None)
        discipline_url = data.get('discipline')
        if discipline_url:
            try:
                discipline_id = int(discipline_url.rstrip('/').split('/')[-1])
                data['discipline_id'] = discipline_id
            except ValueError:
                raise SetupError("Invalid discipline URL")
        if not data.get('discipline_id'):
            last_discipline = Discipline.objects.last()
            if last_discipline:
                discipline_id = last_discipline.id
                data['discipline_id'] = discipline_id
            else:
                raise SetupError("No discipline available")
        discipline = Discipline.objects.get(pk=discipline_id)

    # Get tree configuration
    ranks = data.pop('ranks', dict())
    
    try:
        kwargs = {}
        kwargs['fullnamedirection'] = data.get('fullnamedirection', 1)
        if name == 'Storage':
            kwargs['institution'] = institution
        else:
            kwargs['discipline'] = discipline

        treedef = create_default_tree(name, kwargs, ranks)
        return {'treedef_id': treedef.id}
    except Exception as e:
        raise SetupError(e)