
from django.urls import include, path, re_path

from specifyweb.backend.inheritance import views

urlpatterns = [
    # cat num for siblings
    re_path(r'^catalog_number_for_sibling/$', views.catalog_number_for_sibling),

    # cat num for parent
    re_path(r'^catalog_number_from_parent/$', views.catalog_number_from_parent), 
]