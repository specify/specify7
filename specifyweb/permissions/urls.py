from django.urls import path

from . import views

urlpatterns = [
    path('user_policies/<int:collectionid>/<int:userid>/', views.user_policies),
    path('user_roles/<int:collectionid>/<int:userid>/', views.user_roles),
    path('role/<int:roleid>/', views.role),
    path('roles/<int:collectionid>/', views.roles),
]
