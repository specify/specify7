import logging
from xml.etree import ElementTree

from sqlalchemy.sql.expression import or_, and_

from django.http import HttpResponse
from django.views.decorators.http import require_GET

from specifyweb.specify.models import datamodel
from specifyweb.specify.api import toJson
from specifyweb.specify.views import login_required

from specifyweb.context.app_resource import get_app_resource

from specifyweb.stored_queries import models
from specifyweb.stored_queries.fieldspec import FieldSpec
from specifyweb.stored_queries.views import filter_by_collection

from .search_terms import parse_search_str

logger = logging.getLogger(__name__)

def get_express_search_config(request):
    resource, __ = get_app_resource(request.specify_collection,
                                    request.specify_user,
                                    'ExpressSearchConfig')
    return ElementTree.XML(resource)


def build_primary_query(session, searchtable, terms, collection, as_scalar=False):
    table = datamodel.get_table(searchtable.find('tableName').text)
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
    table = getattr(models, searchtable.find('tableName').text)

    return [FieldSpec(field_name=fn.text,
                      date_part=None,
                      root_table=table,
                      join_path=[],
                      is_relation=False,
                      op_num=1,
                      value="",
                      negate=False,
                      display=True,
                      sort_type=0)
            for fn in searchtable.findall('.//displayfield/fieldName')]


def run_primary_search(session, searchtable, terms, collection, limit, offset):
    query = build_primary_query(session, searchtable, terms, collection)

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

@require_GET
@login_required
def search(request):
    collection = request.specify_collection
    express_search_config = get_express_search_config(request)
    terms = parse_search_str(collection, request.GET['q'])
    specific_table = request.GET.get('name', "").lower()
    limit = int(request.GET.get('limit', 20))
    offset = int(request.GET.get('offset', 0))

    with models.session_context() as session:
        results = [run_primary_search(session, searchtable, terms, collection, limit, offset)
                   for searchtable in express_search_config.findall('tables/searchtable')
                   if specific_table == "" or searchtable.find('tableName').text.lower() == specific_table]

        result = {k: v for r in results for (k,v) in r.items()}
        return HttpResponse(toJson(result), content_type='application/json')

@require_GET
@login_required
def related_search(request):
    from . import related_searches
    related_search = getattr(related_searches, request.GET['name'])

    config = get_express_search_config(request)
    terms = parse_search_str(request.specify_collection, request.GET['q'])

    with models.session_context() as session:
        result = related_search.execute(session, config, terms,
                                        collection=request.specify_collection,
                                        offset=int(request.GET.get('offset', 0)),
                                        limit=int(request.GET.get('limit', 20)))

        return HttpResponse(toJson(result), content_type='application/json')

@require_GET
@login_required
def querycbx_search(request, modelname):
    table = datamodel.get_table(modelname)
    model = getattr(models, table.name)

    fields = [table.get_field(fieldname, strict=True)
              for fieldname in request.GET
              if fieldname not in ('limit', 'offset')]

    filters = []
    for field in fields:
        filters_for_field = []
        terms = parse_search_str(request.specify_collection, request.GET[field.name.lower()])
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
            query = filter_by_collection(model, query, request.specify_collection).limit(10)
            ids = [id for (id,) in query]
    else:
        ids = []

    from specifyweb.specify.api import get_model_or_404, obj_to_data
    specify_model = get_model_or_404(modelname)
    qs = specify_model.objects.filter(id__in=ids)

    results = [obj_to_data(obj) for obj in qs]
    return HttpResponse(toJson(results), content_type='application/json')
