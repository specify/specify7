from django.conf.urls import patterns, url

urlpatterns = patterns('specifyweb.interactions.views',
    url(r'^preparations_available_rs/(?P<recordset_id>\d+)/', 'preps_available_rs'),
    url(r'^preparations_available_ids/', 'preps_available_ids'),
    url(r'^loan_return_all/', 'loan_return_all_items'),
    url(r'^prep_interactions/', 'prep_interactions'),
)
