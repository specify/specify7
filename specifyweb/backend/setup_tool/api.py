import json
from django.http import (JsonResponse)
import time

from specifyweb.backend.permissions.models import UserPolicy
from specifyweb.specify import models
from specifyweb.specify.api_utils import strict_uri_to_model
from specifyweb.specify.load_datamodel import Datamodel
from specifyweb.specify.migration_utils.update_schema_config import update_table_schema_config_with_defaults
from specifyweb.specify.models import Spversion
from specifyweb.specify.models_by_table_id import model_names_by_table_id

from django.db.models import Max

def _guided_setup_condition(request):
    from specifyweb.specify.models import Specifyuser
    if Specifyuser.objects.exists():
        is_auth = request.user.is_authenticated
        user = Specifyuser.objects.filter(id=request.user.id).first()
        if not user or not is_auth or not user.usertype in ('Admin', 'Manager'):
            return False
    return True

def create_institution(request, direct=False):
    from specifyweb.specify.models import Institution

    if Institution.objects.exists() and not _guided_setup_condition(request):
        return JsonResponse({"error": "Institution already exists"}, status=400)

    if request.method == 'POST':
        if Institution.objects.exists():
            if not _guided_setup_condition(request):
                return JsonResponse({"error": "Not permitted"}, status=401)
            data = json.loads(request.body)
            institution = Institution.objects.first()
            fields_to_update = [
                'name',
                'code',
                'isaccessionsglobal',
                'issecurityon',
                'isserverbased',
                'issinglegeographytree',
            ]

            for field in fields_to_update:
                if field in data:
                    setattr(institution, field, data[field])
            institution.save()

            return JsonResponse({"success": True, "institution_id": institution.id}, status=200)
        try:
            data = json.loads(request.body)

            key_map = {
                'isAccessionsGlobal': 'isaccessionsglobal',
                'isSecurityOn': 'issecurityon',
                'isServerBased': 'isserverbased',
                'isSingleGeographyTree': 'issinglegeographytree',
            }
            normalized_data = {}

            for key, value in data.items():
                normalized_key = key_map.get(key, key.lower() if key.isupper() else key)
                normalized_data[normalized_key] = value

            normalized_data['id'] = 1
            new_institution = Institution.objects.create(**normalized_data)
            Spversion.objects.create(
                appversion='7',
                schemaversion="2.10"
            )

            return JsonResponse({"success": True, "institution_id": new_institution.id}, status=200)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    return JsonResponse({"error": "Invalid request"}, status=400)

def create_division(request, direct=False):
    from specifyweb.specify.models import Division, Institution

    if not _guided_setup_condition(request):
        return JsonResponse({"error": "Not permitted"}, status=401)

    if request.method == 'POST':
        data = json.loads(request.body)
        max_id = int(Division.objects.aggregate(Max('id'))['id__max']) if Division.objects.exists() else 0

        data['id'] = max_id + 1
        data['abbrev'] = data.get('abbreviation', data.get('abbrev', ''))

        if 'institution' not in data:
            data['institution_id'] = Institution.objects.last().id
        else:
            institution_url = data['institution']
            institution = strict_uri_to_model(institution_url, 'institution')
            data['institution_id'] = institution[1]
            data.pop('institution', None)

        data.pop('abbreviation', None)
        data.pop('_tableName', None)
        data.pop('success', None)
        data.pop('division_id', None)

        try:
            new_division = Division.objects.create(**data)
            return JsonResponse({"success": True, "division_id": new_division.id}, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    return JsonResponse({"error": "Invalid request"}, status=400)

def create_discipline(request, direct=False):
    from specifyweb.specify.models import Discipline, Division, Datatype, Geographytreedef, Geologictimeperiodtreedef

    if not _guided_setup_condition(request):
        return JsonResponse({"error": "Not permitted"}, status=401)

    if request.method == 'POST':
        raw_data = json.loads(request.body)
        # Lowercase all keys
        data = {k.lower(): v for k, v in raw_data.items()}

        # Determine division_id from request or fallback to last Division
        division_url = data.get('division')
        if division_url:
            # Extract ID from URL
            try:
                division_id = int(division_url.rstrip('/').split('/')[-1])
                division = Division.objects.get(id=division_id)
            except ValueError:
                return JsonResponse({"error": "Invalid division URL"}, status=400)
        else:
            # Fallback to last Division
            division = Division.objects.last()
            if not division:
                return JsonResponse({"error": "No Division available to assign"}, status=400)

        data['division'] = division

        # Ensure Datatype exists
        datatype = Datatype.objects.last()
        if not datatype:
            datatype = Datatype.objects.create(id=1, name='Biota') 
        data['datatype_id'] = datatype.id

        # Ensure Geographytreedef exists
        geography_tree_def = Geographytreedef.objects.last()
        if not geography_tree_def:
            geography_tree_def = Geographytreedef.objects.create(id=1, name='Geography')
        data['geographytreedef_id'] = geography_tree_def.id

        # Ensure Geologictimeperiodtreedef exists
        geologic_time_def = Geologictimeperiodtreedef.objects.last()
        if not geologic_time_def:
            geologic_time_def = Geologictimeperiodtreedef.objects.create(id=1, name='Chronostratigraphy')
        data['geologictimeperiodtreedef_id'] = geologic_time_def.id

        # Assign new ID
        max_id = Discipline.objects.aggregate(Max('id'))['id__max'] or 0
        data['id'] = max_id + 1

        data.pop('_tablename', None)
        data.pop('success', None)
        data.pop('discipline_id', None)

        try:
            new_discipline = Discipline.objects.create(**data)

            # Create Splocalecontainers for every table in datamodel
            for model_name in model_names_by_table_id.values():
                update_table_schema_config_with_defaults(
                    table_name=model_name,
                    discipline_id=new_discipline.id
                )

            return JsonResponse({"success": True, "discipline_id": new_discipline.id}, status=200)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Invalid request"}, status=400)


def create_collection(request, direct=False):
    from specifyweb.specify.models import Collection, Discipline

    if not _guided_setup_condition(request):
        return JsonResponse({"error": "Not permitted"}, status=401)

    if request.method == 'POST':
        raw_data = json.loads(request.body)
        # Lowercase all keys
        data = {k.lower(): v for k, v in raw_data.items()}

        # Assign a new ID (optional if auto-increment is used)
        max_id = Collection.objects.aggregate(Max('id'))['id__max'] or 0
        data['id'] = max_id + 1

        # Handle 'discipline' key from API URL
        discipline_url = data.get('discipline')
        if discipline_url:
            try:
                discipline_id = int(discipline_url.rstrip('/').split('/')[-1])
                data['discipline_id'] = discipline_id
            except ValueError:
                return JsonResponse({"error": "Invalid discipline URL"}, status=400)

        # Assign a discipline (use last one if none provided)
        if 'discipline_id' not in data or not data['discipline_id']:
            last_discipline = Discipline.objects.last()
            if last_discipline:
                data['discipline_id'] = last_discipline.id
            else:
                return JsonResponse({"error": "No discipline available"}, status=400)

        # Remove 'discipline' key so it doesn't conflict with ForeignKey
        data.pop('discipline', None)
        data.pop('_tablename', None)
        data.pop('success', None)
        data.pop('collection_id', None)

        try:
            new_collection = Collection.objects.create(**data)
            return JsonResponse({"success": True, "collection_id": new_collection.id}, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Invalid request"}, status=400)

def create_specifyuser(request, direct=False):
    from specifyweb.specify.models import Specifyuser, Agent, Division, Collection

    if not _guided_setup_condition(request):
        return JsonResponse({"error": "Not permitted"}, status=401)

    if request.method == 'POST':
        data = json.loads(request.body)

        if not Specifyuser.objects.exists():
            max_id = int(Specifyuser.objects.aggregate(Max('id'))['id__max']) if Specifyuser.objects.exists() else 0

            data['id'] = max_id + 1

            agent = Agent.objects.last()
            if not agent:
                agent = Agent.objects.create(
                    id=1, 
                    agenttype=1, 
                    firstname='spadmin', 
                    division= Division.objects.last()
                ) 

            try:
                new_user = Specifyuser.objects.create(**data)

                new_user.set_password(new_user.password)
                new_user.save()

                ## Give permission to the newly created user
                UserPolicy.objects.create(
                    specifyuser=new_user,
                    collection=None,
                    resource='%',
                    action='%'
                )

                agent.specifyuser = new_user
                agent.save()

                return JsonResponse({"success": True, "user_id": new_user.id}, status=200)
            except Exception as e:
                return JsonResponse({"error": str(e)}, status=400)

        else:
            user = Specifyuser.objects.first()
            fields_to_update = [
                'name',
                'password',
            ]
            for field in fields_to_update:
                if field in data:
                    setattr(user, field, data[field])
            if not Specifyuser.objects.filter(name=data['name']).exists():
                user.save()
            return JsonResponse({"success": True, "user_id": user.id}, status=200)

    return JsonResponse({"error": "Invalid request"}, status=400)