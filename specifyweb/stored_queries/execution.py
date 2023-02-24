import csv
import json
import logging
import os
import re
import xml.dom.minidom

from collections import namedtuple, defaultdict
from datetime import datetime
from functools import reduce

from django.conf import settings
from sqlalchemy.sql.expression import asc, desc, insert, literal
from sqlalchemy import sql, orm
from django.db import transaction
from django.db.models import F


from ..specify.models import Collection, Loan, Loanpreparation, Loanreturnpreparation
from ..specify.auditlog import auditlog

from . import models
from .format import ObjectFormatter
from .query_construct import QueryConstruct
from .queryfield import QueryField
from ..notifications.models import Message
from ..specify.models import Collection
from ..permissions.permissions import check_table_permissions

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

EphemeralField = namedtuple('EphemeralField', "stringId isRelFld operStart startValue isNot isDisplay sortType formatName")

def field_specs_from_json(json_fields):
    """Given deserialized json data representing an array of SpQueryField
    records, return an array of QueryField objects that can build the
    corresponding sqlalchemy query.
    """
    def ephemeral_field_from_json(json):
        return EphemeralField(**{field: json.get(field.lower(), None) for field in EphemeralField._fields})

    return [QueryField.from_spqueryfield(ephemeral_field_from_json(data))
            for data in sorted(json_fields, key=lambda field: field['position'])]

def do_export(spquery, collection, user, filename, exporttype, host):
    """Executes the given deserialized query definition, sending the
    to a file, and creates "export completed" message when finished.

    See query_to_csv for details of the other accepted arguments.
    """
    recordsetid = spquery.get('recordsetid', None)

    distinct = spquery['selectdistinct']
    tableid = spquery['contexttableid']

    path = os.path.join(settings.DEPOSITORY_DIR, filename)
    message_type = 'query-export-to-csv-complete'

    with models.session_context() as session:
        field_specs = field_specs_from_json(spquery['fields'])
        if exporttype == 'csv':
            query_to_csv(session, collection, user, tableid, field_specs, path,
                         recordsetid=recordsetid, 
                         captions=spquery['captions'], strip_id=True,
                         distinct=spquery['selectdistinct'], delimiter=spquery['delimiter'],)
        elif exporttype == 'kml':
            query_to_kml(session, collection, user, tableid, field_specs, path, spquery['captions'], host,
                         recordsetid=recordsetid, add_header=True, strip_id=False)
            message_type = 'query-export-to-kml-complete'

    Message.objects.create(user=user, content=json.dumps({
        'type': message_type,
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

        query_to_csv(session, collection, user, tableid, field_specs, path, distinct=spquery['selectdistinct'])

def query_to_csv(session, collection, user, tableid, field_specs, path,
                 recordsetid=None, captions=False, strip_id=False, row_filter=None,
                 distinct=False, delimiter='\t'):
    """Build a sqlalchemy query using the QueryField objects given by
    field_specs and send the results to a CSV file at the given
    file path.

    See build_query for details of the other accepted arguments.
    """
    set_group_concat_max_len(session)
    query, __ = build_query(session, collection, user, tableid, field_specs, recordsetid, replace_nulls=True, distinct=distinct)

    logger.debug('query_to_csv starting')

    with open(path, 'w', newline='', encoding='utf-8') as f:
        csv_writer = csv.writer(f, delimiter=delimiter)
        if captions:
            header = captions
            if not strip_id and not distinct:
                header = ['id'] + header
            csv_writer.writerow(header)

        for row in query.yield_per(1):
            if row_filter is not None and not row_filter(row): continue
            encoded = [
                re.sub('\r|\n', ' ', str(f))
                for f in (row[1:] if strip_id and not distinct else row)
            ]
            csv_writer.writerow(encoded)

    logger.debug('query_to_csv finished')

def row_has_geocoords(coord_cols, row):
    """Assuming single point
    """
    return row[coord_cols[0]] != None and row[coord_cols[0]] != '' and row[coord_cols[1]] != None and row[coord_cols[1]] != ''


def query_to_kml(session, collection, user, tableid, field_specs, path, captions, host,
                 recordsetid=None, strip_id=False):
    """Build a sqlalchemy query using the QueryField objects given by
    field_specs and send the results to a kml file at the given
    file path.

    See build_query for details of the other accepted arguments.
    """
    set_group_concat_max_len(session)
    query, __ = build_query(session, collection, user, tableid, field_specs, recordsetid, replace_nulls=True)

    logger.debug('query_to_kml starting')

    kmlDoc = xml.dom.minidom.Document()

    kmlElement = kmlDoc.createElementNS('http://earth.google.com/kml/2.2', 'kml')
    kmlElement.setAttribute('xmlns','http://earth.google.com/kml/2.2')
    kmlElement = kmlDoc.appendChild(kmlElement)
    documentElement = kmlDoc.createElement('Document')
    documentElement = kmlElement.appendChild(documentElement)

    if not strip_id:
        model = models.models_by_tableid[tableid]
        table = str(getattr(model, model._id)).split('.')[0].lower() #wtfiw
    else:
        table = None

    coord_cols = getCoordinateColumns(field_specs, table != None)

    for row in query.yield_per(1):
        if row_has_geocoords(coord_cols, row):
            placemarkElement = createPlacemark(kmlDoc, row, coord_cols, table, captions, host)
            documentElement.appendChild(placemarkElement)

    with open(path, 'wb') as kmlFile:
        kmlFile.write(kmlDoc.toprettyxml('  ', newl = '\n', encoding = 'utf-8'))

    logger.debug('query_to_kml finished')

def getCoordinateColumns(field_specs, hasId):
    lat1, lng1, lat2, lng2, lltype = (-1,-1,-1,-1,-1)
    f = 1 if hasId else 0
    for fld in field_specs:
        if fld.fieldspec.table.name == 'Locality':
            jp = fld.fieldspec.join_path
            f_name = jp[len(jp)-1].name.lower()
            if f_name == 'longitude1':
                lng1 = f
            elif f_name == 'latitude1':
                lat1 = f
            elif f_name == 'longitude2':
                lng2 = f
            elif f_name == 'latitude2':
                lat2 = f
            elif f_name == 'latlongtype':
                lltype = f
        if fld.display:
            f = f + 1

    result = [lng1, lat1]
    if lng2 != -1 and lat2 != -1:
        result.append(lng2)
        result.append(lat2)
        if lltype != -1:
            result.append(lltype)

    return result

def createPlacemark(kmlDoc, row, coord_cols, table, captions, host):
  # This creates a  element for a row of data.
    #print row
    placemarkElement = kmlDoc.createElement('Placemark')
    extElement = kmlDoc.createElement('ExtendedData')
    placemarkElement.appendChild(extElement)

    # Loop through the columns and create a  element for every field that has a value.
    adj = 0 if table == None else 1
    nameElement = kmlDoc.createElement('name')
    nameText = kmlDoc.createTextNode(row[adj])
    nameElement.appendChild(nameText)
    placemarkElement.appendChild(nameElement)
    for f in range(adj, len(row)):
        if f not in coord_cols:
            dataElement = kmlDoc.createElement('Data')
            dataElement.setAttribute('name', captions[f-adj])
            valueElement = kmlDoc.createElement('value')
            dataElement.appendChild(valueElement)
            valueText = kmlDoc.createTextNode(row[f])
            valueElement.appendChild(valueText)
            extElement.appendChild(dataElement)



    #display coords
    crdElement = kmlDoc.createElement('Data')
    crdElement.setAttribute('name', 'coordinates')
    crdValue = kmlDoc.createElement('value')
    crdElement.appendChild(crdValue)
    crdStr = row[coord_cols[1]] + ', ' + row[coord_cols[0]]
    if len(coord_cols) >= 4:
        crdStr += ' : ' + row[coord_cols[3]] + ', ' + row[coord_cols[2]]
    if len(coord_cols) == 5:
        crdStr += ' (' + row[coord_cols[4]] + ')'
    crdValue.appendChild(kmlDoc.createTextNode(crdStr))
    extElement.appendChild(crdElement)

    #add the url
    if table != None:
        urlElement = kmlDoc.createElement('Data')
        urlElement.setAttribute('name', 'go to')
        urlValue = kmlDoc.createElement('value')
        urlElement.appendChild(urlValue)
        urlText = kmlDoc.createTextNode(host + '/specify/view/' + table + '/' + str(row[0]) + '/')
        urlValue.appendChild(urlText)
        extElement.appendChild(urlElement)

    #add coords
    if len(coord_cols) == 5:
        coord_type = row[coord_cols[4]].lower()
    elif len(coord_cols) == 4:
        coord_type = 'line'
    else:
        coord_type = 'point'


    pointElement = kmlDoc.createElement('Point')
    coordinates = row[coord_cols[0]] + ',' + row[coord_cols[1]]
    coorElement = kmlDoc.createElement('coordinates')
    coorElement.appendChild(kmlDoc.createTextNode(coordinates))
    pointElement.appendChild(coorElement)

    if coord_type == 'point':
        placemarkElement.appendChild(pointElement)
    else:
        multiElement = kmlDoc.createElement('MultiGeometry')
        multiElement.appendChild(pointElement)
        if coord_type == 'line':
            lineElement = kmlDoc.createElement('LineString')
            tessElement = kmlDoc.createElement('tessellate')
            tessElement.appendChild(kmlDoc.createTextNode('1'))
            lineElement.appendChild(tessElement)
            coordinates =  row[coord_cols[0]] + ',' + row[coord_cols[1]] + ' ' +  row[coord_cols[2]] + ',' + row[coord_cols[3]]
            coorElement = kmlDoc.createElement('coordinates')
            coorElement.appendChild(kmlDoc.createTextNode(coordinates))
            lineElement.appendChild(coorElement)
            multiElement.appendChild(lineElement)
        else:
            ringElement = kmlDoc.createElement('LinearRing')
            tessElement = kmlDoc.createElement('tessellate')
            tessElement.appendChild(kmlDoc.createTextNode('1'))
            ringElement.appendChild(tessElement)
            coordinates = row[coord_cols[0]] + ',' + row[coord_cols[1]]
            coordinates += ' ' + row[coord_cols[2]] + ',' + row[coord_cols[1]]
            coordinates += ' ' + row[coord_cols[2]] + ',' + row[coord_cols[3]]
            coordinates += ' ' + row[coord_cols[0]] + ',' + row[coord_cols[3]]
            coordinates += ' ' + row[coord_cols[0]] + ',' + row[coord_cols[1]]
            coorElement = kmlDoc.createElement('coordinates')
            coorElement.appendChild(kmlDoc.createTextNode(coordinates))
            ringElement.appendChild(coorElement)
            multiElement.appendChild(ringElement)

        placemarkElement.appendChild(multiElement)

    return placemarkElement


def run_ephemeral_query(collection, user, spquery):
    """Execute a Specify query from deserialized json and return the results
    as an array for json serialization to the web app.
    """
    logger.info('ephemeral query: %s', spquery)
    limit = spquery.get('limit', 20)
    offset = spquery.get('offset', 0)
    recordsetid = spquery.get('recordsetid', None)
    distinct = spquery['selectdistinct']
    tableid = spquery['contexttableid']
    count_only = spquery['countonly']
    try:
        format_audits = spquery['formatauditrecids']
    except:
        format_audits = False
    with models.session_context() as session:
        field_specs = field_specs_from_json(spquery['fields'])

        return execute(session, collection, user, tableid, distinct, count_only,
                       field_specs, limit, offset, recordsetid, formatauditobjs=format_audits)

def augment_field_specs(field_specs, formatauditobjs=False):
    print("augment_field_specs ######################################")
    new_field_specs = []
    for fs in field_specs:
        print(fs)
        print(fs.fieldspec.table.tableId)
        field = fs.fieldspec.join_path[-1]
        model = models.models_by_tableid[fs.fieldspec.table.tableId]
        if field.type == 'java.util.Calendar':
            precision_field = field.name + "Precision"
            has_precision = hasattr(model, precision_field)
            if has_precision:
                new_field_specs.append(make_augmented_field_spec(fs, model, precision_field))
        elif formatauditobjs and model.name.lower.startswith('spauditlog'):
            if field.name.lower() in 'newvalue, oldvalue':
                log_model = models.models_by_tableid[530];
                new_field_specs.append(make_augmented_field_spec(fs, log_model, 'TableNum'))
                new_field_specs.append(make_augmented_field_spec(fs, model, 'FieldName'))
            elif field.name.lower() == 'recordid':
                new_field_specs.append(make_augmented_field_spec(fs, model, 'TableNum'))
    print("################################ sceps_dleif_tnemgua")

def make_augmented_field_spec(field_spec, model, field_name):
    print("make_augmented_field_spec ######################################")

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

def return_loan_preps(collection, user, agent, data):
    spquery = data['query']
    commit = data['commit']

    tableid = spquery['contexttableid']
    if not (tableid == Loanpreparation.specify_model.tableId): raise AssertionError(
        f"Unexpected tableId '{tableid}' in request. Expected {Loanpreparation.specify_model.tableId}",
        {"tableId" : tableid,
         "expectedTableId": Loanpreparation.specify_model.tableId,
         "localizationKey" : "unexpectedTableId"})

    with models.session_context() as session:
        model = models.models_by_tableid[tableid]
        id_field = getattr(model, model._id)

        field_specs = field_specs_from_json(spquery['fields'])

        query, __ = build_query(session, collection, user, tableid, field_specs)
        lrp = orm.aliased(models.LoanReturnPreparation)
        loan = orm.aliased(models.Loan)
        query = query.join(loan).outerjoin(lrp)
        unresolved = (model.quantity - sql.functions.coalesce(sql.functions.sum(lrp.quantityResolved), 0)).label('unresolved')
        query = query.with_entities(id_field, unresolved, loan.loanId, loan.loanNumber).group_by(id_field)
        to_return = [
            (lp_id, quantity, loan_id, loan_no)
            for lp_id, quantity, loan_id, loan_no in query
            if quantity > 0
        ]
        if not commit:
            return to_return
        with transaction.atomic():
            for lp_id, quantity, _, _ in to_return:
                lp = Loanpreparation.objects.select_for_update().get(pk=lp_id)
                was_resolved = lp.isresolved
                lp.quantityresolved = lp.quantityresolved + quantity
                lp.quantityreturned = lp.quantityreturned + quantity
                lp.isresolved = True
                lp.save()

                auditlog.update(lp, agent, None, [
                    {'field_name': 'quantityresolved', 'old_value': lp.quantityresolved - quantity, 'new_value': lp.quantityresolved},
                    {'field_name': 'quantityreturned', 'old_value': lp.quantityreturned - quantity, 'new_value': lp.quantityreturned},
                    {'field_name': 'isresolved', 'old_value': was_resolved, 'new_value': True},
                ])

                new_lrp = Loanreturnpreparation.objects.create(
                    quantityresolved=quantity,
                    quantityreturned=quantity,
                    loanpreparation_id=lp_id,
                    returneddate=data.get('returneddate', None),
                    receivedby_id=data.get('receivedby', None),
                    createdbyagent=agent,
                    discipline=collection.discipline,
                )
                auditlog.insert(new_lrp, agent)
            loans_to_close = Loan.objects.select_for_update().filter(
                pk__in=set((loan_id for _, _, loan_id, _ in to_return)),
                isclosed=False,
            ).exclude(
                loanpreparations__isresolved=False
            )
            for loan in loans_to_close:
                loan.isclosed = True
                loan.save()
                auditlog.update(loan, agent, None, [
                    {'field_name': 'isclosed', 'old_value': False, 'new_value': True},
                ])
        return to_return

def execute(session, collection, user, tableid, distinct, count_only, field_specs, limit, offset, recordsetid=None, formatauditobjs=False):
    "Build and execute a query, returning the results as a data structure for json serialization"

    set_group_concat_max_len(session)
    query, order_by_exprs = build_query(session, collection, user, tableid, field_specs, recordsetid=recordsetid, formatauditobjs=formatauditobjs, distinct=distinct)

    if count_only:
        return {'count': query.count()}
    else:
        logger.debug("order by: %s", order_by_exprs)
        query = query.order_by(*order_by_exprs).offset(offset)
        if limit:
            query = query.limit(limit)

        return {'results': list(query)}

def build_query(session, collection, user, tableid, field_specs,
                recordsetid=None, replace_nulls=False, formatauditobjs=False, distinct=False, implicit_or=True):
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

    distinct = if True, do not return record IDs and query distinct rows
    """
    model = models.models_by_tableid[tableid]
    id_field = getattr(model, model._id)

    query = QueryConstruct(
        collection=collection,
        objectformatter=ObjectFormatter(collection, user, replace_nulls),
        query=session.query().distinct() if distinct else session.query(id_field),
    )

    tables_to_read = set([
        table
        for fs in field_specs
        for table in query.tables_in_path(fs.fieldspec.root_table, fs.fieldspec.join_path)
    ])

    for table in tables_to_read:
        check_table_permissions(collection, user, table, "read")

    query = filter_by_collection(model, query, collection)

    if recordsetid is not None:
        logger.debug("joining query to recordset: %s", recordsetid)
        recordset = session.query(models.RecordSet).get(recordsetid)
        if not (recordset.dbTableId == tableid): raise AssertionError(
            f"Unexpected tableId '{tableid}' in request. Expected '{recordset.dbTableId}'",
            {"tableId" : tableid,
             "expectedTableId" : recordset.dbTableId,
             "localizationKey" : "unexpectedTableId"})
        query = query.join(models.RecordSetItem, models.RecordSetItem.recordId == id_field) \
                .filter(models.RecordSetItem.recordSet == recordset)

    order_by_exprs = []
    predicates_by_field = defaultdict(list)
    #augment_field_specs(field_specs, formatauditobjs)
    for fs in field_specs:
        sort_type = SORT_TYPES[fs.sort_type]

        query, field, predicate = fs.add_to_query(query, formatauditobjs=formatauditobjs)
        if fs.display:
            query = query.add_columns(query.objectformatter.fieldformat(fs, field))

        if sort_type is not None:
            order_by_exprs.append(sort_type(field))

        if predicate is not None:
            predicates_by_field[fs.fieldspec].append(predicate)

    if implicit_or:
        implicit_ors = [
            reduce(sql.or_, ps)
            for ps in predicates_by_field.values()
            if ps
        ]

        if implicit_ors:
            where = reduce(sql.and_, implicit_ors)
            query = query.filter(where)
    else:
        where = reduce(sql.and_, (p for ps in predicates_by_field.values() for p in ps))
        query = query.filter(where)

    logger.debug("query: %s", query.query)
    return query.query, order_by_exprs
