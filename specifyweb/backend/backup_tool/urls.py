from django.urls import path
from . import views

urlpatterns = [
    path('start/', views.backup_start, name='backup_start'),
    path('status/<str:taskid>/', views.backup_status, name='backup_status'),
    path('download/<str:taskid>/', views.backup_download, name='backup_download'),
    path('previous/', views.backup_previous, name='backup_previous'),
]
