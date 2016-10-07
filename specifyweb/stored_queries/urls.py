from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^query/(?P<id>\d+)/$', views.query),
    url(r'^ephemeral/$', views.ephemeral),
    url(r'^make_recordset/$', views.make_recordset),
]
