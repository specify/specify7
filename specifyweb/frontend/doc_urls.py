from django.urls import path

from . import views

urlpatterns = [
    path('api/tables/', views.api_tables),
    path('api/operations/', views.api_operations),
    path('api/operations/all/', views.api_operations_all),
]
