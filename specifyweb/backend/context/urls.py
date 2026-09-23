"""
Defines the urls for the app context subsystem
"""

from django.urls import path
from django.urls import path

from . import views, user_resources, collection_resources
from specifyweb.backend.attachment_gw.views import get_settings as attachment_settings
from specifyweb.backend.report_runner.views import get_status as report_runner_status

urlpatterns = [
    path('login/', views.api_login),
    path('collection/', views.collection),
    path('user_collection_access_for_sp6/<int:userid>/', views.user_collection_access_for_sp6),
    path('language/', views.languages),
    path('schema/language/', views.schema_language),

    path('api_endpoints.json', views.api_endpoints),
    path('api_endpoints_all.json', views.api_endpoints_all),
    path('user.json', views.user),
    path('stats_counts.json', views.stats_counts),
    path('system_info.json', views.system_info),
    path('all_system_data.json', views.all_system_data),
    path('all_system_config_data.json', views.all_system_config_data),
    path('server_time.json', views.get_server_time),
    path('domain.json', views.domain),
    path('view.json', views.view),
    path('views.json', views.views),
    path('viewsets.json', views.viewsets),
    path('datamodel.json', views.datamodel),
    path('schema_localization.json', views.schema_localization),
    path('app.resource', views.app_resource),
    path('available_related_searches.json', views.available_related_searches),
    path('remoteprefs.properties', views.remote_prefs),

    path('attachment_settings.json', attachment_settings),
    path('report_runner_status.json', report_runner_status),

    path('user_resource/', user_resources.user_resources),
    path('user_resource/<int:resourceid>/', user_resources.user_resource),

    path('collection_resource/', collection_resources.collection_resources),
    path('collection_resource/<int:resourceid>/', collection_resources.collection_resource),

]
