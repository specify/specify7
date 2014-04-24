import operator
import logging
import json
from collections import namedtuple

from django.http import HttpResponse
from django.views.decorators.http import require_GET, require_POST
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings

import sqlalchemy
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql.expression import asc, desc, and_, or_

from specifyweb.specify.api import toJson
from specifyweb.specify.views import login_required
from . import models

from .fieldspec import FieldSpec

logger = logging.getLogger(__name__)
Session = sessionmaker(bind=sqlalchemy.create_engine(settings.SA_DATABASE_URL))

SORT_TYPES = [None, asc, desc]
SORT_OPS = [None, operator.gt, operator.lt]

def value_from_request(field, get):
    try:
        return get['f%s' % field.spQueryFieldId]
    except KeyError:
        return None

FieldAndOp = namedtuple('FieldAndOp', 'field op')

def filter_by_collection(model, query, collection):
    if (model is models.Accession and
        collection.discipline.division.institution.isaccessionsglobal):
        logger.info("not filtering query b/c accessions are global in this database")
        return query

    if model is models.Taxon:
        logger.info("filtering taxon to discipline: %s", collection.discipline.name)
        return query.filter(model.TaxonTreeDefID == collection.discipline.taxontreedef_id)

    if model is models.Geography:
        logger.info("filtering geography to discipline: %s", collection.discipline.name)
        return query.filter(model.GeographyTreeDefID == collection.discipline.geographytreedef_id)

    if model is models.LithoStrat:
        logger.info("filtering lithostrat to discipline: %s", collection.discipline.name)
        return query.filter(model.LithoStratTreeDefID == collection.discipline.lithostrattreedef_id)

    if model is models.GeologicTimePeriod:
        logger.info("filtering geologic time period to discipline: %s", collection.discipline.name)
        return query.filter(model.GeologicTimePeriodTreeDefID == collection.discipline.geologictimeperiodtreedef_id)

    if model is models.Storage:
        logger.info("filtering storage to institution: %s", collection.discipline.division.institution.name)
        return query.filter(model.StorageTreeDefID == collection.discipline.division.institution.storagetreedef_id)

    for filter_col, scope, scope_name in (
        ('CollectionID'       , lambda collection: collection, lambda o: o.collectionname),
        ('collectionMemberId' , lambda collection: collection, lambda o: o.collectionname),
        ('DisciplineID'       , lambda collection: collection.discipline, lambda o: o.name),
        ('DivisionID'         , lambda collection: collection.discipline.division, lambda o: o.name),
        ('InstitutionID'      , lambda collection: collection.discipline.division.institution, lambda o: o.name)):

        if hasattr(model, filter_col):
            o = scope(collection)
            logger.info("filtering query by %s: %s", filter_col, scope_name(o))
            return query.filter(getattr(model, filter_col) == o.id)

    logger.warn("query not filtered by scope")
    return query

@require_GET
@login_required
def query(request, id):
    limit = int(request.GET.get('limit', 20))
    offset = int(request.GET.get('offset', 0))
    session = Session()
    sp_query = session.query(models.SpQuery).get(int(id))
    distinct = sp_query.selectDistinct
    tableid = sp_query.contextTableId
    count_only = sp_query.countOnly

    field_specs = [FieldSpec.from_spqueryfield(field, value_from_request(field, request.GET))
                   for field in sorted(sp_query.fields, key=lambda field: field.position)]

    return execute(session, request.specify_collection,
                   tableid, distinct, count_only,
                   field_specs, limit, offset)

class EphemeralField(
    namedtuple('EphemeralField', "stringId, isRelFld, operStart, startValue, isNot, isDisplay, sortType")):
    @classmethod
    def from_json(cls, json):
        return cls(**{field: json[field.lower()] for field in cls._fields})

@require_POST
@csrf_exempt
@login_required
def ephemeral(request):
    spquery = json.load(request)
    logger.info('ephemeral query: %s', spquery)
    limit = spquery.get('limit', 20)
    offset = spquery.get('offset', 0)
    distinct = spquery['selectdistinct']
    tableid = spquery['contexttableid']
    count_only = spquery['countonly']
    session = Session()
    
    field_specs = [FieldSpec.from_spqueryfield(EphemeralField.from_json(data))
                   for data in sorted(spquery['fields'], key=lambda field: field['position'])]

    return execute(session, request.specify_collection,
                   tableid, distinct, count_only,
                   field_specs, limit, offset)

def execute(session, collection, tableid, distinct, count_only, field_specs, limit, offset):
    model = models.models_by_tableid[tableid]
    id_field = getattr(model, model._id)
    query = session.query(id_field)
    query = filter_by_collection(model, query, collection)

    order_by_exprs = []
    join_cache = {}
    deferreds = [None]
    for fs in field_specs:
        sort_type = SORT_TYPES[fs.sort_type]

        query, field, deferred = fs.add_to_query(query,
                                                 sorting=sort_type is not None,
                                                 join_cache=join_cache,
                                                 collection=collection)
        if fs.display:
            query = query.add_columns(field)
            deferreds.append(deferred)

        if sort_type is not None:
            order_by_exprs.append(sort_type(field))
    if distinct:
        query = query.distinct()
    count = query.count()
    query = query.order_by(*order_by_exprs).limit(limit).offset(offset)

    if not count_only:
        results = [[deferred(value) if deferred else value
                    for value, deferred in zip(row, deferreds)]
                   for row in query] if any(deferreds) else list(query)
    else:
        results = []

    session.close()

    data = {'count': count, 'results': results}
    return HttpResponse(toJson(data), content_type='application/json')
