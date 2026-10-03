from django.urls import path, re_path

from . import views, config_views
urlpatterns = [
    path('', views.search),
    path('config/', config_views.config_api),
    path('related/', views.related_search),
    re_path(r'^querycbx/(?P<modelname>\w*)/$', views.querycbx_search),
]
