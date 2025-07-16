"""
Implements the express search mechanism
"""

import logging
from functools import reduce
from xml.etree import ElementTree

from django import forms
from django.http import HttpResponse, HttpResponseBadRequest
from sqlalchemy.sql.expression import or_, and_

from specifyweb.middleware.general import require_GET
from .search_terms import parse_search_str
from specifyweb.backend.context.app_resource import get_app_resource
from specifyweb.backend.permissions.permissions import check_table_permissions
from specifyweb.specify.api import toJson
from specifyweb.specify.models import datamodel, Collection
from specifyweb.specify.views import login_maybe_required
from specifyweb.backend.stored_queries import models
from specifyweb.backend.stored_queries.execution import filter_by_collection
from specifyweb.backend.stored_queries.queryfieldspec import QueryFieldSpec

logger = logging.getLogger(__name__)

def get_express_search_config(collection, user):
    resource, _, __ = get_app_resource(collection, user, 'ExpressSearchConfig')
    return ElementTree.XML(resource)


def build_primary_query(session, searchtable, terms, collection, user, as_scalar=False):
    table = datamodel.get_table(searchtable.find('tableName').text)
    check_table_permissions(collection, user, table, "read")

    model = getattr(models, table.name)
    id_field = getattr(model, table.idFieldName)

    fields = [table.get_field(fn.text)
              for fn in searchtable.findall('.//searchfield/fieldName')]

    q_fields = [id_field]
    if not as_scalar:
        q_fields.extend([
            getattr(model, table.get_field(fn.text).name)
            for fn in searchtable.findall('.//displayfield/fieldName')])

    filters = [fltr for fltr in [
                t.create_filter(table, f) for f in fields for t in terms]
               if fltr is not None]

    if len(filters) > 0:
        reduced = reduce(or_, filters)
        query = session.query(*q_fields).filter(reduced)
        query = filter_by_collection(model, query, collection)
        return query.as_scalar() if as_scalar else query.order_by(id_field)

    logger.info("no filters for query. model: %s fields: %s terms: %s", table, fields, terms)
    return None

def make_fieldspecs(searchtable):
    tablename = searchtable.find('tableName').text

    return [QueryFieldSpec.from_path((tablename, fieldname.text))
            for fieldname in searchtable.findall('.//displayfield/fieldName')]


def run_primary_search(session, searchtable, terms, collection, user, limit, offset):
    query = build_primary_query(session, searchtable, terms, collection, user)

    if query is not None:
        total_count = query.count()
        results = list(query.limit(limit).offset(offset))
    else:
        total_count = 0
        results = []

    return { searchtable.find('tableName').text : {
        'totalCount': total_count,
        'results': results,
        'displayOrder': int( searchtable.find('displayOrder').text ),
        'fieldSpecs': [{'stringId': f.to_stringid(), 'isRelationship': False}
                       for f in make_fieldspecs(searchtable)]
        }}

class SearchForm(forms.Form):
    q = forms.CharField()
    name = forms.CharField(required=False)
    limit = forms.IntegerField(required=False)
    offset = forms.IntegerField(required=False)

    def clean_limit(self):
        limit = self.cleaned_data['limit']
        return 20 if limit is None else limit

    def clean_offset(self):
        offset = self.cleaned_data['offset']
        return 0 if offset is None else offset

@require_GET
@login_maybe_required
def search(request):
    """Performs an express search and returns the results.
    Based on the GET parameters:
    'q' = the query string (required)
    'name' = restrict to the table 'name'
    'limit' = number of results to return
    'offest' = offset into results
    """
    form = SearchForm(request.GET)
    if not form.is_valid():
        return HttpResponseBadRequest(toJson(form.errors), content_type='application/json')
    logger.debug("parameters: %s", form.cleaned_data)

    collection = request.specify_collection
    user = request.specify_user
    express_search_config = get_express_search_config(collection, request.specify_user)
    terms = parse_search_str(collection, form.cleaned_data['q'])
    specific_table = form.cleaned_data['name'].lower()
    limit = form.cleaned_data['limit']
    offset = form.cleaned_data['offset']

    with models.session_context() as session:
        results = [run_primary_search(session, searchtable, terms, collection, user, limit, offset)
                   for searchtable in express_search_config.findall('tables/searchtable')
                   if specific_table == "" or searchtable.find('tableName').text.lower() == specific_table]

        result = {k: v for r in results for (k,v) in list(r.items())}
        return HttpResponse(toJson(result), content_type='application/json')

class RelatedSearchForm(SearchForm):
    name = forms.CharField(required=True)

@require_GET
@login_maybe_required
def related_search(request):
    """Performs an express search "related query" and returns the results. """
    from . import related_searches
    form = RelatedSearchForm(request.GET)
    if not form.is_valid():
        return HttpResponseBadRequest(toJson(form.errors), content_type='application/json')
    logger.debug("parameters: %s", form.cleaned_data)

    related_search = getattr(related_searches, form.cleaned_data['name'])

    config = get_express_search_config(request.specify_collection, request.specify_user)
    terms = parse_search_str(request.specify_collection, form.cleaned_data['q'])

    with models.session_context() as session:
        result = related_search.execute(session, config, terms,
                                        collection=request.specify_collection,
                                        user=request.specify_user,
                                        offset=form.cleaned_data['offset'],
                                        limit=form.cleaned_data['limit'])

        return HttpResponse(toJson(result), content_type='application/json')

@require_GET
@login_maybe_required
def querycbx_search(request, modelname):
    """Executes a querycbx search for table <modelname>. """
    table = datamodel.get_table(modelname)
    model = getattr(models, table.name)

    fields = [table.get_field(fieldname, strict=True)
              for fieldname in request.GET
              if fieldname not in ('limit', 'offset', 'forcecollection')]

    if 'forcecollection' in request.GET:
        collection = Collection.objects.get(pk=request.GET['forcecollection'])
    else:
        collection = request.specify_collection

    filters = []
    for field in fields:
        filters_for_field = []
        terms = parse_search_str(collection, request.GET[field.name.lower()])
        logger.debug("found terms: %s for %s", terms, field)
        for term in terms:
            filter_for_term = term.create_filter(table, field)
            if filter_for_term is not None:
                filters_for_field.append(filter_for_term)

        logger.debug("filtering %s with %s", field, filters_for_field)
        if len(filters_for_field) > 0:
            filters.append(reduce(or_, filters_for_field))

    if len(filters) > 0:
        with models.session_context() as session:
            combined = reduce(and_, filters)
            query = session.query(getattr(model, table.idFieldName)).filter(combined)
            query = filter_by_collection(model, query, collection).limit(100)
            ids = [id for (id,) in query]
    else:
        ids = []

    from specifyweb.specify.api import get_model_or_404, obj_to_data
    specify_model = get_model_or_404(modelname)
    qs = specify_model.objects.filter(id__in=ids)

    results = [obj_to_data(obj) for obj in qs]
    return HttpResponse(toJson(results), content_type='application/json')
