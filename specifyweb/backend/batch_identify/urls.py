from django.urls import re_path

from . import views

urlpatterns = [
    re_path(r'^batch_identify/resolve/$', views.batch_identify_resolve),
    re_path(r'^batch_identify/$', views.batch_identify),
]
