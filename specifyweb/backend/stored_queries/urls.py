from django.urls import path

from . import sharing, views

urlpatterns = [
    path('query/<int:id>/', views.query),
    path('query/<int:id>/shares/', sharing.manage_query_shares),
    path('ephemeral/', views.ephemeral),
    path('exportcsv/', views.export_csv),
    path('exportkml/', views.export_kml),
    path('exportwebportal/', views.export_to_web_portal),
    path('make_recordset/', views.make_recordset),
    path('merge_recordsets/', views.merge_recordsets),
    path('return_loan_preps/', views.return_loan_preps),
    path('batch_edit/', views.batch_edit)
]
