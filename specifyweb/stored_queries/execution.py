import os
import logging
import json
from collections import namedtuple
from datetime import datetime

from django.conf import settings

from sqlalchemy.sql.expression import asc, desc, insert, literal

from ..specify.models import Collection
from ..specify.celery import app
from ..notifications.models import Message

from . import models
from .queryfield import QueryField
from .select_into_outfile import SelectIntoOutfile
from .format import ObjectFormatter


logger = logging.getLogger(__name__)

SORT_TYPES = [None, asc, desc]

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

def field_specs_from_json(json_fields):
    class EphemeralField(
        namedtuple('EphemeralField', "stringId, isRelFld, operStart, startValue, isNot, isDisplay, sortType")):
        @classmethod
        def from_json(cls, json):
            return cls(**{field: json[field.lower()] for field in cls._fields})

    return [QueryField.from_spqueryfield(EphemeralField.from_json(data))
            for data in sorted(json_fields, key=lambda field: field['position'])]

@app.task
def do_export(spquery, collection, user):
    filename = 'export_test%s.csv' % datetime.now().isoformat()
    recordsetid = spquery.get('recordsetid', None)

    distinct = spquery['selectdistinct']
    tableid = spquery['contexttableid']
    count_only = False

    with models.session_context() as session:
        field_specs = field_specs_from_json(spquery['fields'])

        query = execute(session, collection, user,
                        tableid, distinct, count_only, field_specs,
                        limit=0, offset=0, recordsetid=recordsetid,
                        json=False, replace_nulls=True)

        path = os.path.join(settings.DEPOSITORY_DIR, filename)
        stmt = SelectIntoOutfile(query.with_labels().statement, path)
        session.execute(stmt)

    Message.objects.create(user=user, content=json.dumps({
        'type': 'query-export-complete',
        'file': filename,
    }))

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
        field_specs = field_specs_from_json(spquery['fields'])

        return execute(session, collection, user, tableid, distinct, count_only,
                       field_specs, limit, offset, recordsetid)

def recordset(collection, user, user_agent, recordset_info):
    spquery = recordset_info['fromquery']
    tableid = spquery['contexttableid']

    with models.session_context() as session:
        recordset = models.RecordSet()
        recordset.timestampCreated = datetime.now()
        recordset.version = 0
        recordset.collectionMemberId = collection.id
        recordset.dbTableId = tableid
        recordset.name = recordset_info['name']
        if 'remarks' in recordset_info:
            recordset.remarks = recordset_info['remarks']
        recordset.type = 0
        recordset.createdByAgentID = user_agent.id
        recordset.SpecifyUserID = user.id
        session.add(recordset)
        session.flush()
        new_rs_id = recordset.recordSetId

        model = models.models_by_tableid[tableid]
        id_field = getattr(model, model._id)

        field_specs = field_specs_from_json(spquery['fields'])

        query, __ = build_query(session, collection, user, tableid, field_specs)
        query = query.with_entities(id_field, literal(new_rs_id)).distinct()
        RSI = models.RecordSetItem
        ins = insert(RSI).from_select((RSI.recordId, RSI.RecordSetID), query)
        session.execute(ins)

    return new_rs_id

def execute(session, collection, user, tableid, distinct, count_only, field_specs, limit, offset,
            recordsetid=None, json=True, replace_nulls=False):

    session.connection().execute('SET group_concat_max_len = 1024 * 1024 * 1024')
    query, order_by_exprs = build_query(session, collection, user, tableid, field_specs,
                                        recordsetid=recordsetid, replace_nulls=replace_nulls)

    if distinct:
        query = query.distinct()

    if count_only:
        return {'count': query.count()} if json else query.count()
    else:
        logger.debug("order by: %s", order_by_exprs)
        query = query.order_by(*order_by_exprs).offset(offset)
        if limit:
            query = query.limit(limit)

        return {'results': list(query)} if json else query

def build_query(session, collection, user, tableid, field_specs, recordsetid=None, replace_nulls=False):
    objectformatter = ObjectFormatter(collection, user, replace_nulls)
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
