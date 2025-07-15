"""
Defines the urls for the app context subsystem
"""

from django.urls import path, re_path
from django.urls import path

from . import views, user_resources, collection_resources
from ..attachment_gw.views import get_settings as attachment_settings
from ..report_runner.views import get_status as report_runner_status

urlpatterns = [
    path('login/', views.api_login),
    path('collection/', views.collection),
    path('user_collection_access_for_sp6/<int:userid>/', views.user_collection_access_for_sp6),
    path('language/', views.languages),
    path('schema/language/', views.schema_language),

    re_path(r'^api_endpoints.json$', views.api_endpoints),
    re_path(r'^api_endpoints_all.json$', views.api_endpoints_all),
    re_path(r'^user.json$', views.user),
    re_path(r'^system_info.json$', views.system_info),
    re_path(r'^domain.json$', views.domain),
    re_path(r'^view.json$', views.view),
    re_path(r'^views.json$', views.views),
    re_path(r'^viewsets.json$', views.viewsets),
    re_path(r'^datamodel.json$', views.datamodel),
    re_path(r'^schema_localization.json$', views.schema_localization),
    re_path(r'^app.resource$', views.app_resource),
    re_path(r'^available_related_searches.json$', views.available_related_searches),
    re_path(r'^remoteprefs.properties$', views.remote_prefs),

    re_path(r'^attachment_settings.json$', attachment_settings),
    re_path(r'^report_runner_status.json$', report_runner_status),

    path('user_resource/', user_resources.user_resources),
    path('user_resource/<int:resourceid>/', user_resources.user_resource),

    path('collection_resource/', collection_resources.collection_resources),
    path('collection_resource/<int:resourceid>/', collection_resources.collection_resource),


]
