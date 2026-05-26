from django.urls import path

from . import views

urlpatterns = [
    path('rss/', views.rss_feed),
    path('extract_eml/<path:filename>', views.extract_eml),
    path('make_dwca/', views.export),
    path('extract_query/<int:query_id>/', views.extract_query),
    path('force_update/', views.force_update),
]
