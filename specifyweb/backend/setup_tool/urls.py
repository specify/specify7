
from django.urls import include, path, re_path

from . import views

urlpatterns = [
    # check if the db is new at login
    re_path(r'^specify/setup_progress/$', views.get_setup_progress),

    re_path(r'^specify/institution/create/$', views.create_institution_view),
    re_path(f'^specify/division/create/$', views.create_division_view),
    re_path(f'^specify/discipline/create/$', views.create_discipline_view),
    re_path(f'^specify/collection/create/$', views.create_collection_view),
    re_path(f'^specify/specifyuser/create/$', views.create_specifyuser_view),
]