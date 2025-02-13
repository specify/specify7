from django.urls import path

from . import views

urlpatterns = [
    path('get_settings/', views.get_settings),
    path('get_upload_params/', views.get_upload_params),
    path('get_token/', views.get_token),
    path('proxy/', views.proxy),
    path('dataset/', views.datasets),
    path('dataset/<int:ds_id>/', views.dataset),

]
