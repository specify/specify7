
from django.urls import re_path

from specifyweb.backend.bulk_copy import views

urlpatterns = [
    re_path(r'^bulk/(?P<model>\w+)/(?P<copies>\d+)/$', views.collection_bulk_copy), # permissions added
    re_path(r'^bulk/(?P<model>\w+)/$', views.collection_bulk), # permissions added
]

