from django.urls import path, re_path

from . import views

urlpatterns = [
    path('collection/user/<int:user_id>/', views.collection_user),
    path('collection/preparations/', views.collection_preparations),
    path('collection/type_specimens/', views.collection_type_specimens),
    re_path(r'^collection/locality_geography/(?P<stat>\w+)/', views.collection_locality_geography),
    re_path(r'^collection/attachments/(?P<stat>\w+)/', views.collection_attachments)
]
