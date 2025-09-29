from django import http
import json

from specifyweb.backend.setup_tool import api
from specifyweb.specify import models

def create_institution(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            # TODO: Remove this?
            new_institution = spmodels.Institution.objects.create(**data)
            return http.JsonResponse(
                {"success": True, "institution_id": new_institution.id},
                status=201
            )
        except Exception as e:
            print(f"Error creating institution: {e}")
            return http.JsonResponse({'error': 'An internal server error occurred.'}, status=500)
    return http.JsonResponse({"error": "Invalid request"}, status=400)


def create_institution_view(request):
    return api.create_institution(request, direct=True)

def create_storage_tree_view(request):
    return api.create_storage_tree(request, direct=True)

def create_global_geography_tree_view(request):
    return api.create_global_geography_tree(request, direct=True)

def create_division_view(request):
    return api.create_division(request, direct=True)


def create_discipline_view(request):
    return api.create_discipline(request, direct=True)

def create_geography_tree_view(request):
    return api.create_geography_tree(request, direct=True)

def create_schema_config_view(request):
    return api.create_schema_config(request, direct=True)

def create_taxon_tree_view(request):
    return api.create_taxon_tree(request, direct=True)

def create_collection_view(request):
    return api.create_collection(request, direct=True)


def create_specifyuser_view(request):
    return api.create_specifyuser(request, direct=True)

# check which resource are present in a new db to define setup step
def get_setup_progress(request):
    progress = {
        "institution": models.Institution.objects.exists(),
        "storageTree": models.Storagetreedef.objects.exists(),
        "globalGeographyTree": models.Geographytreedef.objects.exists(),
        "division": models.Division.objects.exists(),
        "discipline": models.Discipline.objects.exists(),
        "geographyTree": models.Geographytreedef.objects.exists(),
        "schemaConfig": models.Splocalecontainer.objects.exists(),
        "taxonTree": models.Taxontreedef.objects.exists(),
        "collection": models.Collection.objects.exists(),
        "specifyUser": models.Specifyuser.objects.exists(),
    }
    return http.JsonResponse(progress)