from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^rows/(?P<wb_id>\d+)/', views.rows),
    url(r'^upload/(?P<wb_id>\d+)/(?P<multi_match_action>\w+)/', views.upload, {'no_commit': False, 'match': False}),
    url(r'^validate/(?P<wb_id>\d+)/(?P<multi_match_action>\w+)/', views.upload, {'no_commit': True, 'match': False}),
    url(r'^match/(?P<wb_id>\d+)/', views.upload, {'no_commit': True, 'match': True, 'multi_match_action': "skip"}),
    url(r'^upload_status/(?P<wb_id>.+)/', views.upload_status),
    url(r'^upload_log/(?P<upload_id>.+)/', views.upload_log),
]
