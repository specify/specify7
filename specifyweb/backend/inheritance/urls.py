
from django.urls import include, path

from specifyweb.backend.inheritance import views

urlpatterns = [
    # cat num for siblings
    path('catalog_number_for_sibling/', views.catalog_number_for_sibling),

    # cat num for parent
    path('catalog_number_from_parent/', views.catalog_number_from_parent), 
]