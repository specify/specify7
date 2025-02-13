from django.urls import include, path, re_path
from django.views.generic.base import RedirectView

from .accounts import urls as accounts_urls
from .attachment_gw import urls as attachment_urls
from .barvis import urls as tt_urls
from .businessrules import urls as bus_urls
from .context import urls as context_urls
from .export import urls as export_urls
from .express_search import urls as es_urls
from .frontend import urls as frontend_urls, doc_urls
from .frontend.views import open_search as search_view
from .interactions import urls as interaction_urls
from .notifications import urls as notification_urls
from .permissions import urls as permissions_urls
from .permissions.permissions import skip_collection_access_check
from .report_runner import urls as report_urls
from .specify import urls as api_urls
from .specify.views import images, properties
from .stored_queries import urls as query_urls
from .workbench import urls as wb_urls
from .stats import urls as stat_urls

# print(get_resolver().reverse_dict.keys()) # Use for debugging urls

urlpatterns = [

    # This will redirect all browsers looking for the favicon to the SVG.
    re_path(r'^favicon.ico', RedirectView.as_view(url='/static/img/short_logo.svg')), 

    # just redirect root url to the main specify view
    path('', skip_collection_access_check(RedirectView.as_view(url='/specify/'))),

    re_path(r'^opensearch.xml$', search_view),

    # This is the main specify view.
    # Every URL beginning with '/specify/' is handled
    # by the frontend. 'frontend.urls' just serves the
    # empty webapp container for all these URLs.
    path('specify/', include(frontend_urls)),

    # primary api
    path('api/', include(api_urls)),
    path('images/<path:path>', images),
    re_path(r'^properties/(?P<name>.+).properties$', properties), # Note fully supported since remmoving dependence on specify.jar

    path('documentation/', include(doc_urls)),

    # submodules
    path('accounts/', include(accounts_urls)),
    path('api/workbench/', include(wb_urls)), # permissions added
    path('express_search/', include(es_urls)),
    path('context/', include(context_urls)),
    path('stored_query/', include(query_urls)), # permissions added
    path('attachment_gw/', include(attachment_urls)),
    path('barvis/', include(tt_urls)),
    path('businessrules/', include(bus_urls)),
    path('report_runner/', include(report_urls)), # permissions added
    path('interactions/', include(interaction_urls)), # permissions added
    path('notifications/', include(notification_urls)),
    path('export/', include(export_urls)), # permissions added
    path('permissions/', include(permissions_urls)), # permissions added
    # url(r'^testcontext/', include()),
    path('stats/', include(stat_urls))
]
