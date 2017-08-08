from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^rss/$', views.rss_feed),
    url(r'^extract_eml/(?P<filename>.+)$', views.extract_eml),
    url(r'^make_dwca/$', views.export),
    url(r'extract_query/(?P<query_id>\d+)/$', views.extract_query),
    url(r'force_update/$', views.force_update),
]
