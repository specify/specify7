from django.urls import path

from . import views

urlpatterns = [
    path('query/<int:id>/', views.query),
    path('ephemeral/', views.ephemeral),
    path('exportcsv/', views.export_csv),
    path('exportkml/', views.export_kml),
    path('make_recordset/', views.make_recordset),
    path('merge_recordsets/', views.merge_recordsets),
    path('return_loan_preps/', views.return_loan_preps),
]
