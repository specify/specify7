import json
from django.http import (JsonResponse)

from specifyweb.backend.permissions.models import UserPolicy
from specifyweb.specify.api_utils import strict_uri_to_model
from specifyweb.specify.migration_utils.update_schema_config import update_table_schema_config_with_defaults
from specifyweb.specify.models import Spversion
from specifyweb.specify.models_utils.models_by_table_id import model_names_by_table_id
from specifyweb.specify import models

from django.db.models import Max
from django.db import transaction

import logging
logger = logging.getLogger(__name__)

def get_setup_progress():
    institution = models.Institution.objects.first()
    globalGeographyTree = institution and institution.issinglegeographytree

    return {
        "institution": models.Institution.objects.exists(),
        "storageTreeDef": models.Storagetreedef.objects.exists(),
        "globalGeographyTreeDef": (not globalGeographyTree) or models.Geographytreedef.objects.exists(),
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

def create_institution(request, direct=False):
    from specifyweb.specify.models import Institution, Address

    # Check permission
    if not _guided_setup_condition(request):
        return JsonResponse({"error": "Not permitted"}, status=401)

    # Only allow POST requests
    if request.method != 'POST':
        return JsonResponse({"error": "Invalid request"}, status=400)

    raw_data = json.loads(request.body)

    # Normalize keys: lowercase everything
    data = {k.lower(): v for k, v in raw_data.items()}

    # Get address fields (if any)
    address_data = data.pop('address', None)

    # New DB: force id = 1
    data['id'] = 1

    try:
        # Create address
        with transaction.atomic():
            if address_data:
                address_obj = Address.objects.create(**address_data)
                data['address_id'] = address_obj.id

            # Create institution
            new_institution = Institution.objects.create(**data)
            Spversion.objects.create(appversion='7', schemaversion='2.10')
        
        return JsonResponse({"success": True, "institution_id": new_institution.id, "setup_progress": get_setup_progress()}, status=200)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

def create_division(request, direct=False):
    from specifyweb.specify.models import Division, Institution

    # Check permission
    if not _guided_setup_condition(request):
        return JsonResponse({"error": "Not permitted"}, status=401)

    # Only allow POST requests
    if request.method != 'POST':
        return JsonResponse({"error": "Invalid request"}, status=400)

    data = json.loads(request.body)

    # If division_id is provided and exists, return success
    existing_id = data.get('division_id')
    if existing_id:
        existing_division = Division.objects.filter(id=existing_id).first()
        if existing_division:
            return JsonResponse({"success": True, "division_id": existing_division.id, "setup_progress": get_setup_progress()}, status=200)


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
        return JsonResponse({"success": True, "division_id": new_division.id, "setup_progress": get_setup_progress()}, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

def create_discipline(request, direct=False):
    from specifyweb.specify.models import (
        Discipline, Division, Datatype,
        Geographytreedef, Geologictimeperiodtreedef
    )

    # Permission check
    if not _guided_setup_condition(request):
        return JsonResponse({"error": "Not permitted"}, status=401)

    # Only allow POST requests
    if request.method != 'POST':
        return JsonResponse({"error": "Invalid request"}, status=400)

    # Load and normalize data keys
    raw_data = json.loads(request.body)
    data = {k.lower(): v for k, v in raw_data.items()}

    # Check if discipline_id is provided and already exists
    existing_id = data.get('discipline_id')
    if existing_id:
        existing_discipline = Discipline.objects.filter(id=existing_id).first()
        if existing_discipline:
            return JsonResponse({"success": True, "discipline_id": existing_discipline.id, "setup_progress": get_setup_progress()}, status=200)

    # Resolve division
    division_url = data.get('division')
    if division_url:
        try:
            division_id = int(division_url.rstrip('/').split('/')[-1])
            division = Division.objects.get(id=division_id)
        except (ValueError, Division.DoesNotExist):
            return JsonResponse({"error": "Invalid division URL"}, status=400)
    else:
        division = Division.objects.last()
        if not division:
            return JsonResponse({"error": "No Division available to assign"}, status=400)

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
            for model_name in model_names_by_table_id.values():
                update_table_schema_config_with_defaults(
                    table_name=model_name,
                    discipline_id=new_discipline.id
                )

        return JsonResponse({"success": True, "discipline_id": new_discipline.id, "setup_progress": get_setup_progress()}, status=200)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

def create_collection(request, direct=False):
    from specifyweb.specify.models import Collection, Discipline

    # Permission check
    if not _guided_setup_condition(request):
        return JsonResponse({"error": "Not permitted"}, status=401)

    # Only allow POST requests
    if request.method != 'POST':
        return JsonResponse({"error": "Invalid request"}, status=400)

    # Load and normalize data keys
    raw_data = json.loads(request.body)
    data = {k.lower(): v for k, v in raw_data.items()}

    # If collection_id is provided and exists, return success
    existing_id = data.get('collection_id')
    if existing_id:
        existing_collection = Collection.objects.filter(id=existing_id).first()
        if existing_collection:
            return JsonResponse({"success": True, "collection_id": existing_collection.id, "setup_progress": get_setup_progress()}, status=200)

    # Assign new Collection ID
    max_id = Collection.objects.aggregate(Max('id'))['id__max'] or 0
    data['id'] = max_id + 1

    # Handle discipline reference from URL
    discipline_url = data.get('discipline')
    if discipline_url:
        try:
            discipline_id = int(discipline_url.rstrip('/').split('/')[-1])
            data['discipline_id'] = discipline_id
        except ValueError:
            return JsonResponse({"error": "Invalid discipline URL"}, status=400)

    # Fallback to last Discipline if none provided
    if not data.get('discipline_id'):
        last_discipline = Discipline.objects.last()
        if last_discipline:
            data['discipline_id'] = last_discipline.id
        else:
            return JsonResponse({"error": "No discipline available"}, status=400)

    # Remove keys that should not be passed to model
    for key in ['discipline', '_tablename', 'success', 'collection_id']:
        data.pop(key, None)

    # Create new Collection
    try:
        new_collection = Collection.objects.create(**data)
        return JsonResponse({"success": True, "collection_id": new_collection.id, "setup_progress": get_setup_progress()}, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

def create_specifyuser(request, direct=False):
    from specifyweb.specify.models import Specifyuser, Agent, Division, Collection

    if not _guided_setup_condition(request):
        return JsonResponse({"error": "Not permitted"}, status=401)

    if request.method != 'POST':
        return JsonResponse({"error": "Invalid request"}, status=400)

    data = json.loads(request.body)

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

        return JsonResponse({"success": True, "user_id": new_user.id, "setup_progress": get_setup_progress()}, status=200)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

# Trees
def create_storage_tree(request, direct=False):
    # TODO: Use trees/create_default_trees
    # https://github.com/specify/specify7/pull/6429
    from specifyweb.specify.models import Storagetreedef
    raw_data = json.loads(request.body)
    data = {k.lower(): v for k, v in raw_data.items()}
    ranks = data.pop('ranks')
    logger.debug(data)
    # Placeholder treedef:
    try:
        Storagetreedef.objects.create(**data)
        return JsonResponse({"success": True, "setup_progress": get_setup_progress()}, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


def create_global_geography_tree(request, direct=False):
    # TODO: Use trees/create_default_trees
    # https://github.com/specify/specify7/pull/6429
    from specifyweb.specify.models import Geographytreedef
    raw_data = json.loads(request.body)
    data = {k.lower(): v for k, v in raw_data.items()}
    ranks = data.pop('ranks')
    logger.debug(data)
    # Placeholder treedef:
    try:
        Geographytreedef.objects.create(**data)
        return JsonResponse({"success": True, "setup_progress": get_setup_progress()}, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

def create_geography_tree(request, direct=False):
    # TODO: Use trees/create_default_trees
    # https://github.com/specify/specify7/pull/6429
    from specifyweb.specify.models import Geographytreedef
    raw_data = json.loads(request.body)
    data = {k.lower(): v for k, v in raw_data.items()}
    ranks = data.pop('ranks')
    logger.debug(data)
    # Placeholder treedef:
    try:
        Geographytreedef.objects.create(**data)
        return JsonResponse({"success": True, "setup_progress": get_setup_progress()}, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

def create_taxon_tree(request, direct=False):
    # TODO: Use trees/create_default_trees
    # https://github.com/specify/specify7/pull/6429
    from specifyweb.specify.models import Taxontreedef
    raw_data = json.loads(request.body)
    data = {k.lower(): v for k, v in raw_data.items()}
    ranks = data.pop('ranks')
    logger.debug(data)
    # Placeholder treedef:
    try:
        Taxontreedef.objects.create(**data)
        return JsonResponse({"success": True, "setup_progress": get_setup_progress()}, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)