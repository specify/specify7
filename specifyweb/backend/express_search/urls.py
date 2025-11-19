from django.urls import path, re_path

from . import views
urlpatterns = [
    path('', views.search),
    path('related/', views.related_search),
    re_path(r'^querycbx/(?P<modelname>\w*)/$', views.querycbx_search),
]
