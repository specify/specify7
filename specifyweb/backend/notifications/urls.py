from django.urls import path

from . import views

urlpatterns = [
    path('messages/', views.get_messages),
    path('mark_read/', views.mark_read),
    path('delete/', views.delete),
    path("delete_all/", views.delete_all)
]
