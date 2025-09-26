from django.urls import path

from . import views

urlpatterns = [
    path('taxon_bar/', views.taxon_bar),
]
