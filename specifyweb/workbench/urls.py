from django.conf.urls import url

from . import views
from .upload import views as upload_views

urlpatterns = [
    url(r'^rows/(?P<wb_id>\d+)/', views.rows),
    url(r'^upload/(?P<wb_id>\d+)/', views.upload, {'no_commit': False}),
    # url(r'^validate/(?P<wb_id>\d+)/(?P<mul_match_action>\w+)/', views.upload, {'no_commit': True, 'match': False}),
    url(r'^match/(?P<wb_id>\d+)/', views.upload, {'mul_match_action': 'skip', 'no_commit': True, 'match': True}),
    url(r'^upload_status/(?P<wb_id>.+)/', views.upload_status),
    url(r'^upload_log/(?P<upload_id>.+)/', views.upload_log),
    url(r'^upload_new/', upload_views.upload),
]
