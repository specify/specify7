from django.urls import re_path

from . import views
urlpatterns = [
    re_path(r'^delete_blockers/(?P<model>\w+)/(?P<id>\d+)/$', views.delete_blockers),
]

