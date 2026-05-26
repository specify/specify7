from django.urls import re_path

from . import views

urlpatterns = [ 
   re_path(r'^specify_rows/(?P<model>\w+)/$', views.rows), # permissions added  
]