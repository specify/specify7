from django import http
import json

from specifyweb.backend.setup_tool import api

def setup_database_view(request):
    return api.setup_database(request)

def create_institution_view(request):
    return api.handle_request(request, api.create_institution)

def create_storage_tree_view(request):
    return api.handle_request(request, api.create_storage_tree)

def create_global_geography_tree_view(request):
    return api.handle_request(request, api.create_global_geography_tree)

def create_division_view(request):
    return api.handle_request(request, api.create_division)

def create_discipline_view(request):
    return api.handle_request(request, api.create_discipline)

def create_geography_tree_view(request):
    return api.handle_request(request, api.create_geography_tree)

def create_taxon_tree_view(request):
    return api.handle_request(request, api.create_taxon_tree)

def create_collection_view(request):
    return api.handle_request(request, api.create_collection)

def create_specifyuser_view(request):
    return api.handle_request(request, api.create_specifyuser)

# check which resource are present in a new db to define setup step
def get_setup_progress(request):
    return http.JsonResponse(api.get_setup_progress(request))