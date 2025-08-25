"""
A few non-business data resource end points 
"""

import json
import mimetypes
from functools import wraps
import time
import logging
import os
from zipfile import ZipFile, BadZipFile
from tempfile import TemporaryDirectory

from django import http
from django.conf import settings
from django.db import router
from django.db.models.deletion import Collector
from django.views.decorators.cache import cache_control
from django.views.decorators.http import require_POST, require_http_methods
from specifyweb.specify.api import get_model

from specifyweb.middleware.general import require_GET, require_http_methods
from . import api, models as spmodels
from .specify_jar import specify_jar, specify_jar_path
from .uiformatters import get_uiformatter_by_name

logger = logging.getLogger(__name__)

def login_maybe_required(view):
    @wraps(view)
    def wrapped(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return http.HttpResponseForbidden()
        return view(request, *args, **kwargs)
    return wrapped


if settings.ANONYMOUS_USER:
    def login_maybe_required(func): return func


class HttpResponseConflict(http.HttpResponse):
    status_code = 409


def openapi(schema, components={}):
    def decorator(view):
        @wraps(view)
        def wrapped(*args, **kwargs):
            return view(*args, **kwargs)
        setattr(wrapped, '__schema__', {
            'schema': schema,
            'components': components
        })
        return wrapped
    return decorator


def api_view(dispatch_func):
    """Create a Django view function that handles exceptions arising
    in the api logic."""
    @login_maybe_required
    @cache_control(private=True, max_age=2)
    def view(request, *args, **kwargs):
        """RESTful API endpoint for most Specify datamodel resources.
        <model> is the table from the Specify datamodel. <id> is the
        row id.
        """
        try:
            return dispatch_func(request, *args, **kwargs)
        except api.StaleObjectException as e:
            return HttpResponseConflict(e)
        except api.MissingVersionException as e:
            return http.HttpResponseBadRequest(e)
        except http.Http404 as e:
            return http.HttpResponseNotFound(e)
    return view


resource = api_view(api.resource_dispatch)
collection = api_view(api.collection_dispatch)
collection_bulk_copy = api_view(api.collection_dispatch_bulk_copy)
collection_bulk = api_view(api.collection_dispatch_bulk)


def raise_error(request):
    """This endpoint intentionally throws an error in the server for
    testing purposes.
    """
    raise Exception('This error is a test. You may now return to your regularly '
                    'scheduled hacking.')


@login_maybe_required
@require_http_methods(['GET', 'HEAD'])
def delete_blockers(request, model, id):
    """Returns a JSON list of fields on <model> that point to related
    resources which prevent the resource <id> of that model from being
    deleted.
    """
    obj = api.get_object_or_404(model, id=int(id))
    using = router.db_for_write(obj.__class__, instance=obj)
    collector = Collector(using=using)
    collector.delete_blockers = []
    collector.collect([obj])
    result = flatten([
        [
            {
                'table': sub_objs[0].__class__.__name__,
                'field': field.name,
                'ids': [sub_obj.id for sub_obj in sub_objs]
            }
        ] for field, sub_objs in collector.delete_blockers
    ])
    return http.HttpResponse(api.toJson(result), content_type='application/json')


def flatten(l):
    return [item for sublist in l for item in sublist]


@login_maybe_required
@require_http_methods(['GET', 'HEAD'])
def rows(request, model):
    "Returns tuples from the table for <model>."
    return api.rows(request, model)


@require_http_methods(['GET', 'HEAD'])
@cache_control(max_age=365 * 24 * 60 * 60, public=True)
def images(request, path):
    """Returns images and icons from the Specify thickclient jar file
    under edu/ku/brc/specify/images/."""
    mimetype = mimetypes.guess_type(path)[0]
    path = 'edu/ku/brc/specify/images/' + path
    try:
        image = specify_jar.read(path)
    except KeyError as e:
        raise http.Http404(e)
    return http.HttpResponse(image, content_type=mimetype)


@login_maybe_required
@require_http_methods(['GET', 'HEAD'])
@cache_control(max_age=24 * 60 * 60, public=True)
def properties(request, name):
    """
    Returns the <name>.properties file from the thickclient jar.
    Retries on BadZipFile and falls back to manual extraction.
    """
    path = f"{name}.properties"
    max_retries = 2
    delay = 0.1

    for attempt in range(1, max_retries + 2):
        try:
            data = specify_jar.read(path)
            break
        except BadZipFile:
            logger.warning(
                "Attempt %d to read from %r failed with BadZipFile. Retrying…",
                attempt, path,
                exc_info=True
            )
            if attempt <= max_retries:
                time.sleep(delay * attempt)
            else:
                # Final fallback: manually extract just this one entry
                try:
                    with TemporaryDirectory() as td:
                        with ZipFile(specify_jar_path, 'r') as jar:
                            jar.extract(path, td)
                        with open(os.path.join(td, path), 'rb') as f:
                            data = f.read()
                    logger.info("Successfully extracted %r via fallback extraction.", path)
                    break
                except Exception as fallback_exc:
                    logger.error(
                        "Fallback extract also failed for %r: %s",
                        path, fallback_exc,
                        exc_info=True
                    )
                    return http.HttpResponseServerError(
                        f"Could not read {path} from JAR."
                    )
    else:
        return http.HttpResponseServerError(f"Failed to load {path}.")

    return http.HttpResponse(data, content_type='text/plain')

# check if user is new by looking the presence of institution
def is_new_user(request):
    is_new_user = len(spmodels.Institution.objects.all()) == 0
    return http.JsonResponse(is_new_user, safe=False)

@login_maybe_required
@require_POST
def catalog_number_for_sibling(request: http.HttpRequest):
    """
    Returns the catalog number of the primary CO of a COG if one is present 
    """
    try:
        request_data = json.loads(request.body)
        object_id = request_data.get('id')
        provided_catalog_number = request_data.get('catalognumber')
    except json.JSONDecodeError:
        return http.JsonResponse({'error': 'Invalid JSON body.'}, status=400)

    if object_id is None:
        return http.JsonResponse({'error': "'id' field is required."}, status=400)

    if provided_catalog_number is not None:
        return http.JsonResponse(None, safe=False)

    try:
        # Find the join record for the requesting object and its parent group ID
        requesting_cojo = spmodels.Collectionobjectgroupjoin.objects.filter(
            childco_id=object_id
        ).values('parentcog_id').first()

        if not requesting_cojo:
            return http.JsonResponse(None, safe=False)

        parent_cog_id = requesting_cojo['parentcog_id']

        primary_cojo = spmodels.Collectionobjectgroupjoin.objects.filter(
            parentcog_id=parent_cog_id,
            isprimary=True
        ).select_related('childco').first()

        # Extract the catalog number if a primary sibling CO exists
        primary_catalog_number = None
        if primary_cojo and primary_cojo.childco:
            primary_catalog_number = primary_cojo.childco.catalognumber

        return http.JsonResponse(primary_catalog_number, safe=False)

    except Exception as e:
        print(f"Error processing request: {e}")
        return http.JsonResponse({'error': 'An internal server error occurred.'}, status=500)                  
                                

@login_maybe_required
@require_POST
def catalog_number_from_parent(request: http.HttpRequest):
    """
    Returns the catalog number of the parent component
    """
    try:
        request_data = json.loads(request.body)
        object_id = request_data.get('id')
        provided_catalog_number = request_data.get('catalognumber')
    except json.JSONDecodeError:
        return http.JsonResponse({'error': 'Invalid JSON body.'}, status=400)

    if object_id is None:
        return http.JsonResponse({'error': "'id' field is required."}, status=400)

    if provided_catalog_number is not None:
        return http.JsonResponse(None, safe=False)

    try:
        # Get the child CO
        child = spmodels.Collectionobject.objects.get(id=object_id)

        # Get the parent CO
        parent = child.componentParent

        if parent and parent.catalognumber:
            return http.JsonResponse(parent.catalognumber, safe=False)
        else:
            return http.JsonResponse({'error': 'Parent or parent catalog number not found.'}, status=404)

    except Exception as e:
        print(f"Error processing request: {e}")
        return http.JsonResponse({'error': 'An internal server error occurred.'}, status=500)  


@login_maybe_required
@require_POST
def series_autonumber_range(request: http.HttpRequest):
    """
    Returns a list of autonumbered values given a range.
    Used for series data entry on Collection Objects.
    """
    request_data: dict = json.loads(request.body)
    range_start = request_data.get('rangestart')
    range_end = request_data.get('rangeend')
    table_name = request_data.get('tablename')
    field_name = request_data.get('fieldname')
    formatter_name = request_data.get('formattername')
    
    formatter = get_uiformatter_by_name(request.specify_collection, request.specify_user, formatter_name)
    
    try: 
        range_start_parsed = formatter.parse(range_start)
        assert not formatter.needs_autonumber(range_start_parsed)
        canonicalized_range_start = formatter.canonicalize(range_start_parsed)
    except:
        return http.HttpResponseBadRequest('Range start does not match format.')
    try:
        range_end_parsed = formatter.parse(range_end)
        assert not formatter.needs_autonumber(range_end_parsed)
        canonicalized_range_end = formatter.canonicalize(range_end_parsed)
    except:
        return http.HttpResponseBadRequest('Range end does not match format.')
    
    if canonicalized_range_end <= canonicalized_range_start:
        return http.HttpResponseBadRequest(f'Range end must be greater than range start.')

    try:
        # Repeatedly autonumber until the end is reached.
        limit = 500
        values = [canonicalized_range_start]
        current_value = values[0]
        if request_data.get('skipstartnumber'):
            # The first value can be optionally excluded/skipped.
            # Needed since series entry currently relies on the first record being saved first.
            values = []
        while current_value < canonicalized_range_end:
            current_value = ''.join(formatter.fill_vals_after(current_value))
            values.append(current_value)
            if len(values) >= limit:
                return http.JsonResponse({
                    'values': [],
                    'error': 'LimitExceeded',
                })
        
        # Check if any existing records use the values.
        # Not garanteed to be accurate at the time of saving, just serves as a warning for the frontend.
        table = get_model(table_name)
        existing_records = table.objects.filter(**{f'{field_name}__in': values, 'collection': request.specify_collection})
        existing_values = list(existing_records.values_list(field_name, flat=True))

        if len(existing_values) > 0:
            return http.JsonResponse({
                'values': values,
                'existing': existing_values,
                'error': 'ExistingNumbers',
            })

        return http.JsonResponse({
            'values': values,
        })
    except Exception as e:
        return http.JsonResponse({'error': 'An internal server error occurred.'}, status=500)