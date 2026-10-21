from django.urls import path

from . import views

urlpatterns = [
    path('uniqueness_rules/<int:discipline_id>/', views.uniqueness_rule),
    path('uniqueness_rules/validate/', views.validate_uniqueness),
]
