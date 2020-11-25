from django.conf.urls import url

from . import views
from .upload import views as upload_views

urlpatterns = [
    url(r'^rows/(?P<wb_id>\d+)/', views.rows),
    url(r'^upload/(?P<wb_id>\d+)/', views.upload, {'no_commit': False}),
    url(r'^validate/(?P<wb_id>\d+)/', views.upload, {'no_commit': True}),
    url(r'^upload_status/(?P<wb_id>.+)/', views.upload_status),
    url(r'^upload_results/(?P<wb_id>.+)/', views.upload_results),
    url(r'^upload_abort/(?P<wb_id>.+)/', views.upload_abort),
    url(r'^unupload/(?P<wb_id>\d+)/', views.unupload),
    url(r'^upload_new/', upload_views.upload),
    url(r'^validate_row/(?P<wb_id>\d+)/', upload_views.validate_row),
]
