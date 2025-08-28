# Entrypoint for the routing of the app

from django.urls import re_path

from . import schema
from specifyweb.specify import views

urlpatterns = [
    # cat num for siblings
    re_path(r'^specify/catalog_number_for_sibling/$', views.catalog_number_for_sibling),

    # cat num for parent
    re_path(r'^specify/catalog_number_from_parent/$', views.catalog_number_from_parent), 

    # check if the user is new at login
    re_path(r'^specify/is_new_user/$', views.is_new_user),

    # the main business data API
    re_path(r'^specify_schema/openapi.json$', schema.openapi),
    re_path(r'^specify_schema/(?P<model>\w+)/$', schema.view),
    re_path(r'^specify/(?P<model>\w+)/(?P<id>\d+)/$', views.resource), # permissions added
    re_path(r'^specify/bulk/(?P<model>\w+)/(?P<copies>\d+)/$', views.collection_bulk_copy), # permissions added
    re_path(r'^specify/bulk/(?P<model>\w+)/$', views.collection_bulk), # permissions added
    re_path(r'^specify/(?P<model>\w+)/$', views.collection), # permissions added

    # this url always triggers a 500 for testing purposes
    re_path(r'^test_error/', views.raise_error),
]

