from specifyweb.backend.bulk_copy import bulk_copy
from specifyweb.specify.views import api_view


collection_bulk_delete = api_view(bulk_copy.collection_dispatch_bulk_delete)
collection_bulk_copy = api_view(bulk_copy.collection_dispatch_bulk_copy)
collection_bulk = api_view(bulk_copy.collection_dispatch_bulk)