import json
from django.http import (JsonResponse)

from specifyweb.backend.permissions.models import UserPolicy
from specifyweb.specify.api import strict_uri_to_model
from specifyweb.specify.models import Spversion

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
        data = json.loads(request.body)

        if not Discipline.objects.exists():
            max_id = int(Discipline.objects.aggregate(Max('id'))['id__max']) if Discipline.objects.exists() else 0

            data['id'] = max_id + 1
            data['division_id'] = Division.objects.last().id

            datatype = Datatype.objects.last()
            if not datatype:
                datatype = Datatype.objects.create(id=1, name='Biota') 

            geography_tree_def = Geographytreedef.objects.last()
            if not geography_tree_def:
                geography_tree_def = Geographytreedef.objects.create(id=1, name='Geography')

            geologic_time_def = Geologictimeperiodtreedef.objects.last()
            if not geologic_time_def:
                geologic_time_def = Geologictimeperiodtreedef.objects.create(id=1, name='Chronostratigraphy')

            data['division_id'] = Division.objects.last().id
            data['datatype_id'] = datatype.id
            data['geographytreedef_id'] = geography_tree_def.id
            data['geologictimeperiodtreedef_id'] = geologic_time_def.id

            try:
                new_discipline = Discipline.objects.create(**data)
                return JsonResponse({"success": True, "discipline_id": new_discipline.id}, status=200)
            except Exception as e:
                return JsonResponse({"error": str(e)}, status=400)
        else:
            discipline = Discipline.objects.first()
            fields_to_update = [
                'name',
                'type',
            ]
            for field in fields_to_update:
                if field in data:
                    setattr(discipline, field, data[field])
            discipline.save()
            return JsonResponse({"success": True, "discipline_id": discipline.id}, status=200)
    return JsonResponse({"error": "Invalid request"}, status=400)

def create_collection(request, direct=False):
    from specifyweb.specify.models import Collection, Discipline
    if not _guided_setup_condition(request):
        return JsonResponse({"error": "Not permitted"}, status=401)

    if request.method == 'POST':
        raw_data = json.loads(request.body)
        # Lowercase all keys
        data = {k.lower(): v for k, v in raw_data.items()}

        if not Collection.objects.exists():
            max_id = int(Collection.objects.aggregate(Max('id'))['id__max']) if Collection.objects.exists() else 0

            data['id'] = max_id + 1
            data['discipline_id'] = Discipline.objects.last().id

            try:
                new_collection = Collection.objects.create(**data)
                return JsonResponse({"success": True, "collection_id": new_collection.id}, status=200)
            except Exception as e:
                return JsonResponse({"error": str(e)}, status=400)
        else:
            collection = Collection.objects.first()
            fields_to_update = [
                'collectionname',
                'code',
                'catalognumformatname',
                'isserverbased',
                'issinglegeographytree',
            ]
            for field in fields_to_update:
                if field in data:
                    setattr(collection, field, data[field])
            collection.save()
            return JsonResponse({"success": True, "collection_id": collection.id}, status=200)
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