from django.conf.urls import url

from .views import *

urlpatterns = [
    url(r'^preparations_available_rs/(?P<recordset_id>\d+)/', preps_available_rs),
    url(r'^preparations_available_ids/', preps_available_ids),
    url(r'^loan_return_all/', loan_return_all_items),
    url(r'^prep_interactions/', prep_interactions),
    url(r'^prep_availability/(?P<prep_id>\d+)/(?P<iprep_id>\d+)/(?P<iprep_name>\w+)/', prep_availability),
    url(r'^prep_availability/(?P<prep_id>\d+)/', prep_availability),

    # special COG APIs
    url(r'^cog_consolidated_preps/(?P<model>\w+)/$', cog_consolidated_preps),
    url(r'^remove_cog_consolidated_preps/(?P<model>\w+)/$', remove_cog_consolidated_preps),
]
