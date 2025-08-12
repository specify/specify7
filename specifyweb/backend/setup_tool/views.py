import http
import json

from specifyweb.specify import api, models as spmodels


def create_institution(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
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


def create_division_view(request):
    return api.create_division(request, direct=True)


def create_discipline_view(request):
    return api.create_discipline(request, direct=True)


def create_collection_view(request):
    return api.create_collection(request, direct=True)


def create_specifyuser_view(request):
    return api.create_specifyuser(request, direct=True)

# check which resource are present in a new db to define setup step
def get_setup_progress(request):
    progress = {
        "institution": spmodels.Institution.objects.exists(),
        "division": spmodels.Division.objects.exists(),
        "discipline": spmodels.Discipline.objects.exists(),
        "collection": spmodels.Collection.objects.exists(),
        "specifyUser": spmodels.Specifyuser.objects.exists(),
    }
    return http.JsonResponse(progress)