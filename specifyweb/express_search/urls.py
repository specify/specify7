from django.conf.urls import url

from . import views
urlpatterns = [
    url(r'^$', views.search),
    url(r'^related/$', views.related_search),
    url(r'^querycbx/(?P<modelname>\w*)/$', views.querycbx_search),
]
