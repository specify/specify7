from django.urls import re_path

from specifyweb.backend.bulk_copy import views

urlpatterns = [
    re_path(r'^bulk_delete/(?P<model>\w+)/$',
            views.bulk_delete_background,
            name='bulk_delete'),
    re_path(r'^bulk_delete/status/(?P<task_id>[-\w]+)/$',
            views.bulk_delete_status,
            name='bulk_delete_status'),
    re_path(r'^bulk/(?P<model>\w+)/(?P<copies>\d+)/$',
            views.collection_bulk_copy),
    re_path(r'^bulk/(?P<model>\w+)/$',
            views.collection_bulk),
]