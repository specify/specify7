from django.urls import path, re_path

from .views import *

urlpatterns = [
    re_path(r'^preparations_available_rs/(?P<recordset_id>\d+)/', preps_available_rs),
    re_path(r'^preparations_available_ids/', preps_available_ids),
    re_path(r'^loan_return_all/', loan_return_all_items),
    re_path(r'^prep_interactions/', prep_interactions),
    re_path(r'^prep_availability/(?P<prep_id>\d+)/(?P<iprep_id>\d+)/(?P<iprep_name>\w+)/', prep_availability),
    re_path(r'^prep_availability/(?P<prep_id>\d+)/', prep_availability),

    # special COG APIs
    # url(r'^cog_consolidated_preps/(?P<model>\w+)/$', cog_consolidated_preps),
    # url(r'^remove_cog_consolidated_preps/(?P<model>\w+)/$', remove_cog_consolidated_preps),
    # url(r'^create_sibling_loan_preps/$', create_sibling_loan_preps),
    path('sibling_preps/', get_sibling_preps),
]
