from django.urls import include, path, re_path

from . import views

urlpatterns = [
    path('dataset/', views.datasets),
    path('dataset/<int:ds_id>/', views.dataset),

    re_path(r'^rows/(?P<ds_id>\d+)/', views.rows),
    re_path(r'^upload/(?P<ds_id>\d+)/', views.upload, {'no_commit': False, 'allow_partial': False}),
    re_path(r'^validate/(?P<ds_id>\d+)/', views.upload, {'no_commit': True, 'allow_partial': True}),
    re_path(r'^unupload/(?P<ds_id>\d+)/', views.unupload),
    re_path(r'^status/(?P<ds_id>\d+)/', views.status),
    re_path(r'^upload_results/(?P<ds_id>\d+)/', views.upload_results),
    re_path(r'^abort/(?P<ds_id>\d+)/', views.abort),
    re_path(r'^validate_row/(?P<ds_id>\d+)/', views.validate_row),
    re_path(r'^transfer/(?P<ds_id>\d+)/', views.transfer),
    re_path(r'^create_recordset/(?P<ds_id>\d+)/', views.create_recordset),

    path('schemas/', include([
        path('uploadplan/', views.up_schema),
    ]))
]
