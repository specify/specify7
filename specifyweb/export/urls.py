from django.conf.urls import url

from . import views

GUID_RE = r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'

urlpatterns = [
    url(r'^rss/$', views.rss_feed),
    url(r'^extract_eml/(?P<filename>.+)$', views.extract_eml),
    url(r'^make_dwca/$', views.export),
    url(r'^extract_query/(?P<query_id>\d+)/$', views.extract_query),
    url(r'^force_update/$', views.force_update),
    url(r'^occurrence/(?P<dataset_id>[^/]+)/(?P<occurrence_id>[^/]+)/$', views.occurrence),
]
