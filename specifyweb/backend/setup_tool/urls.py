
from django.urls import re_path

from . import views

urlpatterns = [
    # check if the db is new at login
    re_path(r'^setup_progress/$', views.get_setup_progress),

    re_path(r'^setup_database/create/$', views.setup_database_view),

    re_path(r'^institution/create/$', views.create_institution_view),
    re_path(r'^storagetreedef/create/$', views.create_storage_tree_view),
    re_path(r'^global_geographytreedef/create/$', views.create_geography_tree_view),
    re_path(f'^division/create/$', views.create_division_view),
    re_path(f'^discipline/create/$', views.create_discipline_view),
    re_path(f'^geographytreedef/create/$', views.create_geography_tree_view),
    re_path(f'^taxontreedef/create/$', views.create_taxon_tree_view),
    re_path(f'^collection/create/$', views.create_collection_view),
    re_path(f'^specifyuser/create/$', views.create_specifyuser_view),
]