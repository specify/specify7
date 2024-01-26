from django.conf.urls import url, include

from . import views

urlpatterns = [
    url(r'^dataset/$', views.datasets),
    url(r'^dataset/(?P<ds_id>\d+)/$', views.dataset),

    url(r'^rows/(?P<ds_id>\d+)/', views.rows),
    url(r'^upload/(?P<ds_id>\d+)/', views.upload, {'no_commit': False, 'allow_partial': False}),
    url(r'^validate/(?P<ds_id>\d+)/', views.upload, {'no_commit': True, 'allow_partial': True}),
    url(r'^unupload/(?P<ds_id>\d+)/', views.unupload),
    url(r'^status/(?P<ds_id>\d+)/', views.status),
    url(r'^upload_results/(?P<ds_id>\d+)/', views.upload_results),
    url(r'^abort/(?P<ds_id>\d+)/', views.abort),
    url(r'^validate_row/(?P<ds_id>\d+)/', views.validate_row),
    url(r'^transfer/(?P<ds_id>\d+)/', views.transfer),
    url(r'^create_recordset/(?P<ds_id>\d+)/', views.create_recordset),

    url(r'^schemas/', include([
        url(r'^uploadplan/$', views.up_schema),
    ]))
]
