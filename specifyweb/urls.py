from django.conf.urls import include, url
from django.views.generic.base import RedirectView

from .accounts import urls as accounts_urls
from .attachment_gw import urls as attachment_urls
from .barvis import urls as tt_urls
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

urlpatterns = [

    # This will redirect all browsers looking for the favicon to the SVG.
    url(r'^favicon.ico', RedirectView.as_view(url='/static/img/short_logo.svg')), 

    # just redirect root url to the main specify view
    url(r'^$', skip_collection_access_check(RedirectView.as_view(url='/specify/'))),

    url(r'^opensearch.xml$', search_view),

    # This is the main specify view.
    # Every URL beginning with '/specify/' is handled
    # by the frontend. 'frontend.urls' just serves the
    # empty webapp container for all these URLs.
    url(r'^specify/', include(frontend_urls)),

    # primary api
    url(r'^api/', include(api_urls)),
    url(r'^images/(?P<path>.+)$', images),
    url(r'^properties/(?P<name>.+).properties$', properties),

    url(r'^documentation/', include(doc_urls)),

    # submodules
    url(r'^accounts/', include(accounts_urls)),
    url(r'^api/workbench/', include(wb_urls)), # permissions added
    url(r'^express_search/', include(es_urls)),
    url(r'^context/', include(context_urls)),
    url(r'^stored_query/', include(query_urls)), # permissions added
    url(r'^attachment_gw/', include(attachment_urls)),
    url(r'^barvis/', include(tt_urls)),
    url(r'^report_runner/', include(report_urls)), # permissions added
    url(r'^interactions/', include(interaction_urls)), # permissions added
    url(r'^notifications/', include(notification_urls)),
    url(r'^export/', include(export_urls)), # permissions added
    url(r'^permissions/', include(permissions_urls)), # permissions added
    # url(r'^testcontext/', include()),
    url(r'^stats/', include(stat_urls))
]
