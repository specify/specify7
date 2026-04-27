from django.urls import path

from . import views

urlpatterns = [
    path('rss/', views.rss_feed),
    path('extract_eml/<path:filename>', views.extract_eml),
    path('make_dwca/', views.export),
    path('extract_query/<int:query_id>/', views.extract_query),
    path('force_update/', views.force_update),
    path('schema_terms/', views.get_schema_terms),
    path('list_mappings/', views.list_mappings),
    path('list_export_datasets/', views.list_export_datasets),
    path('clone_mapping/<int:mapping_id>/', views.clone_mapping),
    path('generate_dwca/<int:dataset_id>/', views.generate_dwca),
    path('build_cache/<int:dataset_id>/', views.build_cache),
    path('validate_occurrence_ids/<int:mapping_id>/', views.validate_occurrence_ids),
    path('cache_status/<int:dataset_id>/', views.cache_status),
]
