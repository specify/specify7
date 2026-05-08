from django.urls import path

from . import views

urlpatterns = [
    path('run/', views.run),
    path('get_reports/', views.get_reports_view),
    path('get_reports_by_tbl/<int:table_id>/', views.get_reports_by_table),
    path('create/', views.create),
]

