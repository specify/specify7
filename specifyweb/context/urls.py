"""
Defines the urls for the app context subsystem
"""

from django.conf.urls import include, url
from django.urls import path

from . import views, user_resources, collection_resources
from ..attachment_gw.views import get_settings as attachment_settings
from ..report_runner.views import get_status as report_runner_status

urlpatterns = [
    url(r'^login/$', views.api_login),
    url(r'^collection/$', views.collection),
    url(r'^user_collection_access_for_sp6/(?P<userid>\d+)/$', views.user_collection_access_for_sp6),
    url(r'^language/$', views.languages),
    url(r'^schema/language/$', views.schema_language),

    url(r'^api_endpoints.json$', views.api_endpoints),
    url(r'^api_endpoints_all.json$', views.api_endpoints_all),
    url(r'^user.json$', views.user),
    url(r'^system_info.json$', views.system_info),
    url(r'^domain.json$', views.domain),
    url(r'^view.json$', views.view),
    url(r'^datamodel.json$', views.datamodel),
    url(r'^schema_localization.json$', views.schema_localization),
    url(r'^app.resource$', views.app_resource),
    url(r'^available_related_searches.json$', views.available_related_searches),
    url(r'^remoteprefs.properties$', views.remote_prefs),

    url(r'^attachment_settings.json$', attachment_settings),
    url(r'^report_runner_status.json$', report_runner_status),

    path('user_resource/', user_resources.user_resources),
    path('user_resource/<int:resourceid>/', user_resources.user_resource),

    path('collection_resource/', collection_resources.collection_resources),
    path('collection_resource/<int:resourceid>/', collection_resources.collection_resource),


]
