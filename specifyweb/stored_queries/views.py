import operator
import logging
from collections import namedtuple

from django.http import HttpResponse
from django.views.decorators.http import require_GET
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
    field_specs = [FieldSpec.from_spqueryfield(field, value_from_request(field, request.GET))
                   for field in sorted(sp_query.fields, key=lambda field: field.position)]
    model = models.models_by_tableid[sp_query.contextTableId]
    id_field = getattr(model, model._id)
    query = session.query(id_field)
    query = filter_by_collection(model, query, request.specify_collection)

    headers = ['id']
    order_by_exprs = []
    for fs in field_specs:
        query, field = fs.add_to_query(query,
                                       collection=request.specify_collection)
        if fs.display:
            query = query.add_columns(field)
            headers.append(fs.spqueryfieldid)
        sort_type = SORT_TYPES[fs.sort_type]
        if sort_type is not None:
            order_by_exprs.append(sort_type(field))
    count = query.distinct().count()
    query = query.order_by(*order_by_exprs).distinct().limit(limit).offset(offset)

    results = {
        'columns': headers,
        'results': list(query),
        'count': count
    }
    session.close()
    return HttpResponse(toJson(results), content_type='application/json')

