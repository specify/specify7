import operator
import logging
import json
from datetime import datetime
from collections import namedtuple

from django.http import HttpResponse, HttpResponseBadRequest, HttpResponseRedirect, HttpResponseForbidden
from django.views.decorators.http import require_GET, require_POST
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.cache import never_cache
from django.conf import settings

from sqlalchemy.sql.expression import asc, desc, and_, or_, insert, literal
from sqlalchemy.sql.functions import count

from specifyweb.specify.models import Collection
from specifyweb.specify.api import toJson, uri_for_model
from specifyweb.specify.views import login_maybe_required, apply_access_control
from . import models

from .queryfield import QueryField
from .format import ObjectFormatter

logger = logging.getLogger(__name__)

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
@login_maybe_required
@never_cache
def query(request, id):
    limit = int(request.GET.get('limit', 20))
    offset = int(request.GET.get('offset', 0))

    with models.session_context() as session:
        sp_query = session.query(models.SpQuery).get(int(id))
        distinct = sp_query.selectDistinct
        tableid = sp_query.contextTableId
        count_only = sp_query.countOnly

        field_specs = [QueryField.from_spqueryfield(field, value_from_request(field, request.GET))
                       for field in sorted(sp_query.fields, key=lambda field: field.position)]

        data = execute(session, request.specify_collection, request.specify_user,
                       tableid, distinct, count_only, field_specs, limit, offset)

    return HttpResponse(toJson(data), content_type='application/json')


class EphemeralField(
    namedtuple('EphemeralField', "stringId, isRelFld, operStart, startValue, isNot, isDisplay, sortType")):
    @classmethod
    def from_json(cls, json):
        return cls(**{field: json[field.lower()] for field in cls._fields})

@require_POST
@csrf_exempt
@login_maybe_required
@never_cache
def ephemeral(request):
    try:
        spquery = json.load(request)
    except ValueError as e:
        return HttpResponseBadRequest(e)
    data = run_ephemeral_query(request.specify_collection, request.specify_user, spquery)
    return HttpResponse(toJson(data), content_type='application/json')

def run_ephemeral_query(collection, user, spquery):
    logger.info('ephemeral query: %s', spquery)
    limit = spquery.get('limit', 20)
    offset = spquery.get('offset', 0)
    recordsetid = spquery.get('recordsetid', None)
    if 'collectionid' in spquery:
        collection = Collection.objects.get(pk=spquery['collectionid'])
        logger.debug('forcing collection to %s', collection.collectionname)

    distinct = spquery['selectdistinct']
    tableid = spquery['contexttableid']
    count_only = spquery['countonly']

    with models.session_context() as session:
        field_specs = [QueryField.from_spqueryfield(EphemeralField.from_json(data))
                       for data in sorted(spquery['fields'], key=lambda field: field['position'])]

        return execute(session, collection, user, tableid, distinct, count_only,
                       field_specs, limit, offset, recordsetid)

@require_POST
@csrf_exempt
@login_maybe_required
@apply_access_control
@never_cache
def make_recordset(request):
    try:
        recordset_info = json.load(request)
    except ValueError as e:
        return HttpResponseBadRequest(e)

    spquery = recordset_info['fromquery']
    tableid = spquery['contexttableid']

    with models.session_context() as session:
        recordset = models.RecordSet()
        recordset.timestampCreated = datetime.now()
        recordset.version = 0
        recordset.collectionMemberId = request.specify_collection.id
        recordset.dbTableId = tableid
        recordset.name = recordset_info['name']
        if 'remarks' in recordset_info:
            recordset.remarks = recordset_info['remarks']
        recordset.type = 0
        recordset.createdByAgentID = request.specify_user_agent.id
        recordset.SpecifyUserID = request.specify_user.id
        session.add(recordset)
        session.flush()
        new_rs_id = recordset.recordSetId

        model = models.models_by_tableid[tableid]
        id_field = getattr(model, model._id)

        field_specs = [QueryField.from_spqueryfield(EphemeralField.from_json(data))
                       for data in sorted(spquery['fields'], key=lambda field: field['position'])]

        query, __ = build_query(session, request.specify_collection, request.specify_user, tableid, field_specs)
        query = query.with_entities(id_field, literal(new_rs_id)).distinct()
        RSI = models.RecordSetItem
        ins = insert(RSI).from_select((RSI.recordId, RSI.RecordSetID), query)
        session.execute(ins)

    return HttpResponseRedirect(uri_for_model('recordset', new_rs_id))

def execute(session, collection, user, tableid, distinct, count_only, field_specs, limit, offset, recordsetid=None):
    query, order_by_exprs = build_query(session, collection, user, tableid, field_specs, recordsetid)

    if distinct:
        query = query.distinct()

    if count_only:
        return {'count': query.count()}
    else:
        query = query.order_by(*order_by_exprs).offset(offset)
        if limit:
            query = query.limit(limit)

        return {'results': list(query)}

def build_query(session, collection, user, tableid, field_specs, recordsetid=None):
    objectformatter = ObjectFormatter(collection, user)
    model = models.models_by_tableid[tableid]
    id_field = getattr(model, model._id)
    query = session.query(id_field)
    query = filter_by_collection(model, query, collection)

    if recordsetid is not None:
        recordset = session.query(models.RecordSet).get(recordsetid)
        assert recordset.dbTableId == tableid
        query = query.join(models.RecordSetItem, models.RecordSetItem.recordId == id_field) \
                .filter(models.RecordSetItem.recordSet == recordset)

    order_by_exprs = []
    join_cache = {}
    for fs in field_specs:
        sort_type = SORT_TYPES[fs.sort_type]

        query, field = fs.add_to_query(query, objectformatter,
                                       join_cache=join_cache,
                                       collection=collection)
        if fs.display:
            query = query.add_columns(objectformatter.fieldformat(fs, field))

        if sort_type is not None:
            order_by_exprs.append(sort_type(field))

    logger.debug("query: %s", query)
    return query, order_by_exprs
