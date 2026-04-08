from django.urls import path

from . import views

urlpatterns = [
    path('rss/', views.rss_feed),
    path('extract_eml/<path:filename>', views.extract_eml),
    path('make_dwca/', views.export),
    path('extract_query/<int:query_id>/', views.extract_query),
    path('force_update/', views.force_update),
    path('force_update_packages/', views.force_update_packages),
    path('schema_terms/', views.get_schema_terms),
    path('list_mappings/', views.list_mappings),
    path('list_export_datasets/', views.list_export_datasets),
    path('clone_mapping/<int:mapping_id>/', views.clone_mapping),
    path('generate_dwca/<int:dataset_id>/', views.generate_dwca),
    path('build_cache/<int:dataset_id>/', views.build_cache),
    path('validate_occurrence_ids/<int:mapping_id>/', views.validate_occurrence_ids),
    path('cache_status/<int:dataset_id>/', views.cache_status),
    path('create_mapping/', views.create_mapping),
    path('create_mapping_from_query/', views.create_mapping_from_query),
    path('list_queries/', views.list_queries),
    path('update_mapping/<int:mapping_id>/', views.update_mapping),
    path('delete_mapping/<int:mapping_id>/', views.delete_mapping),
    path('save_mapping_fields/<int:mapping_id>/', views.save_mapping_fields),
    path('clone_dataset/<int:dataset_id>/', views.clone_dataset),
    path('create_dataset/', views.create_dataset),
    path('update_dataset/<int:dataset_id>/', views.update_dataset),
    path('delete_dataset/<int:dataset_id>/', views.delete_dataset),
    path('preview_eml/<int:dataset_id>/', views.preview_eml),
    path('download_feed/<path:filename>', views.download_feed),
]
