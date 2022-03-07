from django.urls import path

from . import views

urlpatterns = [
    path('user_policies/<int:collectionid>/<int:userid>/', views.UserPolicies.as_view()),
    path('user_roles/<int:collectionid>/<int:userid>/', views.UserRoles.as_view()),
    path('role/<int:roleid>/', views.Role.as_view()),
    path('roles/<int:collectionid>/', views.Roles.as_view()),
]
