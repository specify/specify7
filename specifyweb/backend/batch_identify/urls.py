from django.urls import path

from . import views

urlpatterns = [
    path('batch_identify/resolve/', views.batch_identify_resolve),
    path('batch_identify/validate_record_set/', views.batch_identify_validate_record_set),
    path('batch_identify/', views.batch_identify),
]
