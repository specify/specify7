from django.conf.urls import url

from . import views
from .upload import views as upload_views

urlpatterns = [
    url(r'^dataset/$', views.datasets),
    url(r'^dataset/(?P<ds_id>\d+)/$', views.dataset),

    url(r'^rows/(?P<ds_id>\d+)/', views.rows),
    url(r'^upload/(?P<ds_id>\d+)/', views.upload, {'no_commit': False}),
    url(r'^validate/(?P<ds_id>\d+)/', views.upload, {'no_commit': True}),
    url(r'^unupload/(?P<ds_id>\d+)/', views.unupload),
    url(r'^status/(?P<ds_id>\d+)/', views.status),
    url(r'^validation_results/(?P<ds_id>\d+)/', views.validation_results),
    url(r'^upload_results/(?P<ds_id>\d+)/', views.upload_results),
    url(r'^abort/(?P<ds_id>\d+)/', views.abort),

    url(r'^upload_new/', upload_views.upload),
    url(r'^validate_row/(?P<ds_id>\d+)/', upload_views.validate_row),
]
