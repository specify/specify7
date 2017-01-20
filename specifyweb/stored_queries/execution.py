import os
import logging
import json
import csv
from collections import namedtuple
from datetime import datetime

from django.conf import settings

from sqlalchemy.sql.expression import asc, desc, insert, literal

from ..specify.models import Collection
from ..notifications.models import Message

from . import models
from .queryfield import QueryField
from .format import ObjectFormatter


logger = logging.getLogger(__name__)

SORT_TYPES = [None, asc, desc]

def set_group_concat_max_len(session):
    """The default limit on MySQL group concat function is quite
    small. This function increases it for the database connection for
    the given session.
    """
    session.connection().execute('SET group_concat_max_len = 1024 * 1024 * 1024')

def filter_by_collection(model, query, collection):
    """Add predicates to the given query to filter result to items scoped
    to the given collection. The model argument indicates the "base"
    table of the query. E.g. If model was CollectingEvent, this
    function would limit the results to collecting events in the same
    discipline as the given collection since collecting events are
    scoped to the discipline level.
    """
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

    if model in (
            models.Agent,
            models.Accession,
            models.RepositoryAgreement,
            models.ExchangeIn,
            models.ExchangeOut,
            models.ConservDescription,
    ):
        return query.filter(model.DivisionID == collection.discipline.division_id)

    for filter_col, scope, scope_name in (
            ('CollectionID'       , lambda collection: collection, lambda o: o.collectionname),
            ('collectionMemberId' , lambda collection: collection, lambda o: o.collectionname),
            ('DisciplineID'       , lambda collection: collection.discipline, lambda o: o.name),

        # The below are disabled to match Specify 6 behavior.
            # ('DivisionID'         , lambda collection: collection.discipline.division, lambda o: o.name),
            # ('InstitutionID'      , lambda collection: collection.discipline.division.institution, lambda o: o.name),
    ):

        if hasattr(model, filter_col):
            o = scope(collection)
            logger.info("filtering query by %s: %s", filter_col, scope_name(o))
            return query.filter(getattr(model, filter_col) == o.id)

    logger.warn("query not filtered by scope")
    return query

def field_specs_from_json(json_fields):
    """Given deserialized json data representing an array of SpQueryField
    records, return an array of QueryField objects that can build the
    corresponding sqlalchemy query.
    """
    class EphemeralField(
        namedtuple('EphemeralField', "stringId, isRelFld, operStart, startValue, isNot, isDisplay, sortType")):
        @classmethod
        def from_json(cls, json):
            return cls(**{field: json[field.lower()] for field in cls._fields})

    return [QueryField.from_spqueryfield(EphemeralField.from_json(data))
            for data in sorted(json_fields, key=lambda field: field['position'])]

def do_export(spquery, collection, user, filename):
    """Executes the given deserialized query definition, sending the
    to a CSV file, and creates "export completed" message when finished.

    See query_to_csv for details of the other accepted arguments.
    """
    recordsetid = spquery.get('recordsetid', None)

    distinct = spquery['selectdistinct']
    tableid = spquery['contexttableid']

    path = os.path.join(settings.DEPOSITORY_DIR, filename)

    with models.session_context() as session:
        field_specs = field_specs_from_json(spquery['fields'])
        query_to_csv(session, collection, user, tableid, field_specs, path,
                     recordsetid=recordsetid, add_header=True, strip_id=True)

    Message.objects.create(user=user, content=json.dumps({
        'type': 'query-export-complete',
        'file': filename,
    }))

def stored_query_to_csv(query_id, collection, user, path):
    """Executes a query from the Spquery table with the given id and send
    the results to a CSV file at path.

    See query_to_csv for details of the other accepted arguments.
    """
    with models.session_context() as session:
        sp_query = session.query(models.SpQuery).get(query_id)
        tableid = sp_query.contextTableId

        field_specs = [QueryField.from_spqueryfield(field)
                       for field in sorted(sp_query.fields, key=lambda field: field.position)]

        query_to_csv(session, collection, user, tableid, field_specs, path)

def query_to_csv(session, collection, user, tableid, field_specs, path,
                 recordsetid=None, add_header=False, strip_id=False):
    """Build a sqlalchemy query using the QueryField objects given by
    field_specs and send the results to a CSV file at the given
    file path.

    See build_query for details of the other accepted arguments.
    """
    set_group_concat_max_len(session)
    query, __ = build_query(session, collection, user, tableid, field_specs, recordsetid, replace_nulls=True)

    logger.debug('query_to_csv starting')

    with open(path, 'wb') as f:
        csv_writer = csv.writer(f)
        if add_header:
            header = [fs.fieldspec.to_stringid() for fs in field_specs]
            if not strip_id:
                header = ['id'] + header
            csv_writer.writerow(header)
        for row in query.yield_per(1):
            csv_writer.writerow(row[1:] if strip_id else row)

    logger.debug('query_to_csv finished')

def run_ephemeral_query(collection, user, spquery):
    """Execute a Specify query from deserialized json and return the results
    as an array for json serialization to the web app.
    """
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
    "Create a record set from the records matched by a query."
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

def execute(session, collection, user, tableid, distinct, count_only, field_specs, limit, offset, recordsetid=None):
    "Build and execute a query, returning the results as a data structure for json serialization"

    set_group_concat_max_len(session)
    query, order_by_exprs = build_query(session, collection, user, tableid, field_specs, recordsetid=recordsetid)

    if distinct:
        query = query.distinct()

    if count_only:
        return {'count': query.count()}
    else:
        logger.debug("order by: %s", order_by_exprs)
        query = query.order_by(*order_by_exprs).offset(offset)
        if limit:
            query = query.limit(limit)

        return {'results': list(query)}

def build_query(session, collection, user, tableid, field_specs, recordsetid=None, replace_nulls=False):
    """Build a sqlalchemy query using the QueryField objects given by
    field_specs.

    session = an sqlalchemy Session instance.

    collection = an instance of specifyweb.specify.models.Collection.
    Returned records will be filtered to the scope of the collection.

    user = an instance of specifyweb.specify.models.Specifyuser.  The
    user will be used in the lookup process for any formatters that
    are used.

    tableid = an integer that indicates the "base table" of the query.
    See specify_datamodel.xml.

    field_specs = [QueryField instances] defining the fields of
    the Specify query.

    recordsetid = integer id of a row from the RecordSet table. Results
    will be filtered to items from the given record set unless None.

    replace_nulls = if True, replace null values with ""
    """
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
