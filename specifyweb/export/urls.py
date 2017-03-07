from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^make_dwca/$', views.export),
    url(r'extract_query/(?P<query_id>\d+)/$', views.extract_query),
]
