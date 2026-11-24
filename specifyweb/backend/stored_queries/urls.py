from django.urls import path

from . import sharing, views

urlpatterns = [
    path('query/<int:id>/', views.query),
    path('query/<int:id>/shares/', sharing.manage_query_shares),
    path('query/<int:id>/folder/', views.move_query_to_folder),
    path('query/<int:id>/favorite/', views.favorite_query),
    path('query/<int:id>/unfavorite/', views.unfavorite_query),
    path('query/<int:id>/archive/', views.archive_query),
    path('query/<int:id>/restore/', views.restore_query),
    path('favorites/', views.query_favorites),
    path('folders/', views.query_folders),
    path('ephemeral/', views.ephemeral),
    path('exportcsv/', views.export_csv),
    path('exportkml/', views.export_kml),
    path('exportwebportal/', views.export_to_web_portal),
    path('make_recordset/', views.make_recordset),
    path('merge_recordsets/', views.merge_recordsets),
    path('return_loan_preps/', views.return_loan_preps),
    path('batch_edit/', views.batch_edit)
]
