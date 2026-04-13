from django.urls import path

from . import views

urlpatterns = [
    path('export/', views.export_picklists),
    path('import/', views.import_picklists),
]
