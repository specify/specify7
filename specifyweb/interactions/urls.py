from django.conf.urls import url

from .views import *

urlpatterns = [
    url(r'^preparations_available_rs/(?P<recordset_id>\d+)/', preps_available_rs),
    url(r'^preparations_available_ids/', preps_available_ids),
    url(r'^loan_return_all/', loan_return_all_items),
    url(r'^prep_interactions/', prep_interactions),
    url(r'^prep_availability/(?P<prep_id>\d+)/(?P<iprep_id>\d+)/(?P<iprep_name>\w+)/', prep_availability),
    url(r'^prep_availability/(?P<prep_id>\d+)/', prep_availability),

    url(r'^associated_preps/(?P<model_name>\w+)/', get_associated_preps),
]
