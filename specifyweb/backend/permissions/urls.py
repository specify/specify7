from django.urls import path

from . import views

urlpatterns = [
    path('user_policies/<int:collectionid>/<int:userid>/', views.user_policies),
    path('user_policies/institution/<int:userid>/', views.user_policies_institution),
    path('user_policies/<int:collectionid>/', views.all_user_policies),
    path('user_policies/institution/', views.all_user_policies_institution),
    path('user_roles/<int:collectionid>/<int:userid>/', views.user_roles),
    path('user_roles/<int:collectionid>/', views.all_user_roles),
    path('role/<int:roleid>/', views.role),
    path('roles/<int:collectionid>/', views.roles),
    path('library_role/<int:roleid>/', views.library_role),
    path('library_roles/', views.library_roles),
    path('registry/', views.policy_registry),
    path('query/', views.query_view),
    path('list_admins/', views.list_admins),
]
