# Entrypoint for the routing of the app

from django.urls import re_path

from . import views

urlpatterns = [
    # replace record
    re_path(r'^(?P<model_name>\w+)/replace/(?P<new_model_id>\d+)/$', views.record_merge),
    re_path(r'^status/(?P<merge_id>[0-9a-fA-F-]+)/$', views.merging_status),
    re_path(r'^abort/(?P<merge_id>[0-9a-fA-F-]+)/$', views.abort_merge_task),
]
