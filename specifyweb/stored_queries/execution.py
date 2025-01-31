import csv
import json
import logging
import os
import re
import xml.dom.minidom
from collections import namedtuple, defaultdict
from datetime import datetime, timedelta
from functools import reduce

from django.conf import settings
from django.db import transaction
from sqlalchemy import sql, orm, func, select, text
from sqlalchemy.sql.expression import asc, desc, insert, literal

from specifyweb.stored_queries.group_concat import group_by_displayed_fields
from specifyweb.specify.tree_utils import get_search_filters

from . import models
from .format import ObjectFormatter
from .query_construct import QueryConstruct
from .queryfield import QueryField
from .relative_date_utils import apply_absolute_date
from .field_spec_maps import apply_specify_user_name
from ..notifications.models import Message
from ..permissions.permissions import check_table_permissions
from ..specify.auditlog import auditlog
from ..specify.models import Loan, Loanpreparation, Loanreturnpreparation, Taxontreedef
from specifyweb.specify.utils import log_sqlalchemy_query

logger = logging.getLogger(__name__)

SORT_TYPES = [None, asc, desc]

def set_group_concat_max_len(connection):
    """The default limit on MySQL group concat function is quite
    small. This function increases it for the database connection for
    the given session.
    """
    connection.execute('SET group_concat_max_len = 1024 * 1024 * 1024')

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
        treedef_ids = Taxontreedef.objects.filter(get_search_filters(collection, 'taxon')).values_list('id', flat=True)
        return query.filter(model.TaxonTreeDefID.in_(tuple(treedef_ids)))

    if model is models.TaxonTreeDefItem:
        logger.info("filtering taxon rank to discipline: %s", collection.discipline.name)
        treedef_ids = Taxontreedef.objects.filter(get_search_filters(collection, 'taxon')).values_list('id', flat=True)
        return query.filter(model.TaxonTreeDefID.in_(tuple(treedef_ids)))

    if model is models.Geography:
        logger.info("filtering geography to discipline: %s", collection.discipline.name)
        return query.filter(model.GeographyTreeDefID == collection.discipline.geographytreedef_id)

    if model is models.GeographyTreeDefItem:
        logger.info("filtering geography rank to discipline: %s", collection.discipline.name)
        return query.filter(model.GeographyTreeDefID == collection.discipline.geographytreedef_id)

    if model is models.LithoStrat:
        logger.info("filtering lithostrat to discipline: %s", collection.discipline.name)
        return query.filter(model.LithoStratTreeDefID == collection.discipline.lithostrattreedef_id)

    if model is models.LithoStratTreeDefItem:
        logger.info("filtering lithostrat rank to discipline: %s", collection.discipline.name)
        return query.filter(model.LithoStratTreeDefID == collection.discipline.lithostrattreedef_id)

    if model is models.GeologicTimePeriod:
        logger.info("filtering geologic time period to discipline: %s", collection.discipline.name)
        return query.filter(model.GeologicTimePeriodTreeDefID == collection.discipline.geologictimeperiodtreedef_id)

    if model is models.GeologicTimePeriodTreeDefItem:
        logger.info("filtering geologic time period rank to discipline: %s", collection.discipline.name)
        return query.filter(model.GeologicTimePeriodTreeDefID == collection.discipline.geologictimeperiodtreedef_id)

    if model is models.TectonicUnit:
        logger.info("filtering tectonic unit to discipline: %s", collection.discipline.name)
        return query.filter(model.TectonicUnitTreeDefID == collection.discipline.tectonicunittreedef_id)

    if model is models.TectonicUnitTreeDefItem:
        logger.info("filtering tectonic unit rank to discipline: %s", collection.discipline.name)
        return query.filter(model.TectonicUnitTreeDefID == collection.discipline.tectonicunittreedef_id)

    if model is models.Storage:
        logger.info("filtering storage to institution: %s", collection.discipline.division.institution.name)
        return query.filter(model.StorageTreeDefID == collection.discipline.division.institution.storagetreedef_id)

    if model is models.StorageTreeDefItem:
        logger.info("filtering storage rank to institution: %s", collection.discipline.division.institution.name)
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


EphemeralField = namedtuple('EphemeralField', "stringId isRelFld operStart startValue isNot isDisplay sortType formatName isStrict")

def field_specs_from_json(json_fields):
    """Given deserialized json data representing an array of SpQueryField
    records, return an array of QueryField objects that can build the
    corresponding sqlalchemy query.
    """
    def ephemeral_field_from_json(json):
        return EphemeralField(**{field: json.get(field.lower(), None) for field in EphemeralField._fields})

    field_specs =  [QueryField.from_spqueryfield(ephemeral_field_from_json(data))
            for data in sorted(json_fields, key=lambda field: field['position'])]

    return field_specs

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
                         distinct=spquery['selectdistinct'], delimiter=spquery['delimiter'], bom=spquery['bom'])
        elif exporttype == 'kml':
            query_to_kml(session, collection, user, tableid, field_specs, path, spquery['captions'], host,
                         recordsetid=recordsetid, strip_id=False, selected_rows=spquery.get('selectedrows', None))
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
                 distinct=False, delimiter=',', bom=False):
    """Build a sqlalchemy query using the QueryField objects given by
    field_specs and send the results to a CSV file at the given
    file path.

    See build_query for details of the other accepted arguments.
    """
    set_group_concat_max_len(session.connection())
    query, __ = build_query(session, collection, user, tableid, field_specs, recordsetid, replace_nulls=True, distinct=distinct)

    logger.debug('query_to_csv starting')

    encoding = 'utf-8'
    if bom:
        encoding = 'utf-8-sig'

    with open(path, 'w', newline='', encoding=encoding) as f:
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
                for f in (row[1:] if strip_id or distinct else row)
            ]
            csv_writer.writerow(encoded)

    logger.debug('query_to_csv finished')

def row_has_geocoords(coord_cols, row):
    """Assuming single point
    """
    return row[coord_cols[0]] != None and row[coord_cols[0]] != '' and row[coord_cols[1]] != None and row[coord_cols[1]] != ''


def query_to_kml(session, collection, user, tableid, field_specs, path, captions, host,
                 recordsetid=None, strip_id=False, selected_rows=None):
    """Build a sqlalchemy query using the QueryField objects given by
    field_specs and send the results to a kml file at the given
    file path.

    See build_query for details of the other accepted arguments.
    """
    set_group_concat_max_len(session.connection())
    query, __ = build_query(session, collection, user, tableid, field_specs, recordsetid, replace_nulls=True)
    if selected_rows:
        model = models.models_by_tableid[tableid]
        id_field = getattr(model, model._id)
        query = query.filter(id_field.in_(selected_rows))

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
    coords = {'longitude1': -1, 'latitude1': -1, 'longitude2': -1, 'latitude2': -1, 'latlongtype': -1}
    f = 1 if hasId else 0
    for fld in field_specs:
        if fld.fieldspec.table.name == 'Locality':
            jp = fld.fieldspec.join_path
            if not jp:
                continue
            f_name = jp[-1].name.lower()
            if f_name in coords:
                coords[f_name] = f
        if fld.display:
            f = f + 1

    result = [coords['longitude1'], coords['latitude1']]
    if coords['longitude2'] != -1 and coords['latitude2'] != -1:
        result.extend([coords['longitude2'], coords['latitude2']])
        if coords['latlongtype'] != -1:
            result.append(coords['latlongtype'])

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
    series = spquery.get('selectseries', None)
    tableid = spquery['contexttableid']
    count_only = spquery['countonly']
    try:
        format_audits = spquery['formatauditrecids']
    except:
        format_audits = False

    with models.session_context() as session:
        field_specs = field_specs_from_json(spquery['fields'])
        return execute(session, collection, user, tableid, distinct, series, count_only,
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

def execute(session, collection, user, tableid, distinct, series, count_only,
            field_specs, limit, offset, recordsetid=None, formatauditobjs=False):
    "Build and execute a query, returning the results as a data structure for json serialization"

    set_group_concat_max_len(session.connection())
    query, order_by_exprs = build_query(session, collection, user, tableid, field_specs, recordsetid=recordsetid,
                                        formatauditobjs=formatauditobjs, distinct=distinct, series=series)

    if count_only:
        return {'count': query.count()}
    else:
        logger.debug("order by: %s", order_by_exprs)
        if series:
            order_by_exprs.insert(0, text("MIN(IFNULL(CAST(`CatalogNumber` AS DECIMAL(65)), NULL))"))
        
        query = query.order_by(*order_by_exprs).offset(offset)
        
        if limit:
            query = query.limit(limit)

        if series:
            return {'results': series_post_query(query)}

        log_sqlalchemy_query(query) # Debugging
        return {'results': list(query)}

def build_query(session, collection, user, tableid, field_specs,
                recordsetid=None, replace_nulls=False, formatauditobjs=False,
                distinct=False, series=False, implicit_or=True):
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

    distinct = if True, group by all display fields, and return all record IDs associated with a row

    series = (only for CO) if True, group by all display fields.
    Group catalog numbers that fall within the same range together.
    Return all record IDs associated with a row.
    """
    model = models.models_by_tableid[tableid]
    id_field = getattr(model, model._id)
    catalog_number_field = model.catalogNumber if hasattr(model, 'catalogNumber') else None

    field_specs = [apply_absolute_date(field_spec) for field_spec in field_specs]
    field_specs = [apply_specify_user_name(field_spec, user) for field_spec in field_specs]

    query_construct_query = None
    if series and catalog_number_field:
        query_construct_query = session.query(
            func.group_concat(
                func.concat(
                    id_field,
                    ':',
                    catalog_number_field
                ),
                separator='|'
            ).label('co_id_catnum_paired_values')
        )
    elif distinct:
        query_construct_query = session.query(func.group_concat(id_field.distinct(), separator=','))
    else:
        query_construct_query = query_construct_query = session.query(id_field)
    
    query = QueryConstruct(
        collection=collection,
        objectformatter=ObjectFormatter(collection, user, replace_nulls),
        query=query_construct_query,
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
    selected_fields = []
    predicates_by_field = defaultdict(list)
    # augment_field_specs(field_specs, formatauditobjs)
    for fs in field_specs:
        sort_type = SORT_TYPES[fs.sort_type]

        if series and fs.fieldspec.get_field().name.lower() == 'catalognumber':
            continue

        query, field, predicate = fs.add_to_query(query, formatauditobjs=formatauditobjs)
        if fs.display:
            formatted_field = query.objectformatter.fieldformat(fs, field)
            query = query.add_columns(formatted_field)
            selected_fields.append(formatted_field)
        
        if hasattr(field, 'key') and field.key.lower() == 'catalognumber':
                catalog_number_field = formatted_field

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

    if series:
        query = group_by_displayed_fields(query, selected_fields, ignore_cat_num=True)
    elif distinct:
        query = group_by_displayed_fields(query, selected_fields)

    internal_predicate = query.get_internal_filters()
    query = query.filter(internal_predicate)

    logger.warning("query: %s", query.query)
    return query.query, order_by_exprs

def series_post_query(query, co_id_cat_num_pair_col_index=0):
    """Transform the query results by removing the co_id:catnum pair column
    and adding a co_id colum and formatted catnum range column.
    Sort the results by the first catnum in the range."""
    log_sqlalchemy_query(query)  # Debugging

    def group_consecutive_ranges(lst):
        def group_consecutives(acc, x):
            if not acc or int(acc[-1][-1][1]) + 1 != int(x[1]):
                acc.append([x])
            else:
                acc[-1].append(x)
            return acc

        grouped = reduce(group_consecutives, lst, [])
        return [
            (','.join([x[0] for x in group]), f"{group[0][1]} - {group[-1][1]}" if len(group) > 1 else f"{group[0][1]}")
            for group in grouped
        ]

    def process_row(row):
        co_id_cat_num_consecutive_pairs = group_consecutive_ranges(
            sorted(
                (pair.split(':') for pair in row[co_id_cat_num_pair_col_index].split(',')),
                key=lambda x: int(x[1])
            )
        )

        return [
            [co_id, cat_num_series] + list(
                list(row[1:]) if co_id_cat_num_pair_col_index == 0
                else list(row[:co_id_cat_num_pair_col_index]) + list(row[co_id_cat_num_pair_col_index + 1:])
            )
            for co_id, cat_num_series in co_id_cat_num_consecutive_pairs
        ]

    return [item for sublist in map(process_row, list(query)) for item in sublist]

def series_post_query_test(query): # TODO: Remove after adding unit tests

    query_results = list(query)
    series_query_results = []

    input = [["0012,0013,0014", "SomeText1", "Vial"],
     ["0015", "OtherText", "Vial"],
     ["0016,", "AnotherText", "Vial"],
     ["0017,0018", "SomeText2", "Vial"],
     ["0020, 0021, 0022", "SomeText3", "Vial"]]
    
    output = [["0012 - 0014", "SomeText1", "Vial"],
     ["0015", "OtherText", "Vial"],
     ["0016", "AnotherText", "Vial"],
     ["0017 - 0018", "SomeText2", "Vial"],
     ["0020 - 0022", "SomeText3", "Vial"]]


    input = [
        ["1,2,3", "0021,0022,0043", "SomeText1", "Vial"],
        ["4", "0023", "OtherText", "Vial"],
        ["5", "0024", "AnotherText", "Vial"],
        ["6,7", "0025,0026", "SomeText2", "Vial"],
        ["8,9,10", "0027,0028,0029", "SomeText3", "Vial"]
    ]
    output = [
        ["1,2", "0021 - 0022", "SomeText1", "Vial"],
        ["4", "0023", "OtherText", "Vial"],
        ["5", "0024", "AnotherText", "Vial"],
        ["6,7", "0025 - 0026", "SomeText2", "Vial"],
        ["8,9,10", "0027 - 0029", "SomeText3", "Vial"],
        ["3", "0043", "SomeText1", "Vial"]
    ]

    input = [
        ["1,2,3", "0021,0022,0043", "SomeText1", "Vial"],
        ["4", "0023", "OtherText", "Vial"],
        ["5", "0024", "AnotherText", "Vial"],
        ["6,7", "0025,0026", "SomeText2", "Vial"],
        ["8,9,10", "0027,0028,0029", "SomeText3", "Vial"]
    ]
    output = [
        ["1,2", "21 - 22", "SomeText1", "Vial"],
        ["4", "23", "OtherText", "Vial"],
        ["5", "24", "AnotherText", "Vial"],
        ["6,7", "25 - 26", "SomeText2", "Vial"],
        ["8,9,10", "27 - 29", "SomeText3", "Vial"],
        ["3", "43", "SomeText1", "Vial"]
    ]

    input = [
        ["16586,28543", "000061109,000061110", "Keebaugh"],
        ["223224,223707,223712,223713,223792,223880,223881,223882,223883,223884,223885,223886,223887,223888,223889,224121,224122,224123,224124,224139,224140,224141,224142,224143,224144,224145,224149,224158,224159,224160,224161,224200,224201,224202,224203,224204,224205,224206,224207,224230,224231,224232,224233,224234,224235,224236,224237,224238,224239,224240,224255,224256,224257,224258,224259,224260,224261,224554,224555,224556,224557,224561,224652,224653,224654,224655,224656,224657,224658,224659,224660,224661,224662,224663,224664,224665,224666,224667,224668,224669,224670,224671,224672,224673,224674,224675,224676,224677,224678,224679,224680,224681,224746,224747,224748,224749,224750,224751,224752,224753,224754,224755,224756,224757,224758,224759,224760,224761,224762,224763,224764,224765,224766,224767,224768,224769,224770,224771,224772,224773,224774,224775,224776,224777,224917,224918,224919,224920,224921,224922,224923,224924,224925,224926,224927,224928,224929,224930,224931,224932,224933,224934,224935,224936,224937,224938,224939,224940,224941,224942,224943,224944,224945,224946,224947,224948,224949,225538,225539,225540,225541,225542,225543,225544,225545,225546,225547,225548,225549,225550,225551,225552,225553,225554,225555,225556,225557,225558,225559,225560,225561,225562,225563,225564,225565,225566,225567,225568,225569,225570,225571,225572,225573,225574,225575,225576,225577,225578,225579,225580,225581,225582,225583,225584,225585,225586,225587,225588,225589,225590,225591,225592,225593,225594,225595,225596,225597,225598,225599,225600,225601,225602,225603,225604,225605,225606,225607,225608,225609,225610,225611,225612,225613,225614,225615,225616,225617,225618,225619,225620,225621,225622,225623,225624,225625,225626,225627,225628,225629,225630,225631,225632,225633,225634,225936,225937,225938,225939,225940,225941,225942,225943,225944,225945,225946,225947,225948,225949,225950,225951,225952,225953,225954,225955,225956,225957,225958,225959,225960,225961,225962,225963,225964,225965,225966,225967,227169,227170,227171,227172,227173,227174,227175,227176,227177,227178,227179,227180,227181,227182,227183,227184,227185,227186,227187,227188,227189,227190,227191,227192,227193,227194,227195,227196,227197,227198,227199,227200,227298,227299,227300,227301,227302,227303,227304,227305,227306,227307,227308,227309,227310,227311,227312,227313,227314,227315,227316,227317,227318,227319,227320,227321,227322,227323,227324,227325,227326,227327,227328,227329,227330,227427,227428,227429,227430,227431,227432,227433,227434,227435,227436,227437,227438,227439,227440,227441,227442,227443,227444,227445,227446,227447,227448,227449,227450,227451,227452,227453,227454,227455,227456,227457,227458,227560,227561,227562,227563,227564,227565,227566,227567,227568,227569,227570,227571,227572,227573,227574,227575,227576,227577,227578,227579,227580,227581,227582,227583,227584,227585,227586,227587,227588,227589,227590,227591,227656,227657,227658,227659,227660,227661,227662,227663,227664,227665,227666,227667,227668,227669,227670,227671,227672,227673,227674,227675,227676,227677,227678,227679,227680,227681,227682,227683,227684,227685,227686,227687", 
         "000061053,000061054,000061055,000061056,000061057,000061058,000061059,000061060,000061061,000061062,000061063,000061064,000061065,000061066,000061067,000061068,000061069,000061070,000061071,000061072,000061073,000061074,000061075,000061076,000061077,000061078,000061079,000061080,000061081,000061082,000061083,000061084,000061085,000061086,000061087,000061088,000061089,000061090,000061091,000061092,000061093,000061094,000061095,000061096,000061097,000061098,000061099,000061100,000061101,000061102,000061103,000061104,000062656,000101392,000101571,000101645,000101672,000101872,000101873,000101874,000101875,000101888,000102018,000102019,000102020,000102110,000102420,000102421,000102422,000102423,000102424,000102425,000102426,000102427,000102428,000102429,000102491,000113183,000113689,000113751,000114066,000114140,000114207,000118367,000118559,000118643,000119023,000119047,000119162,000119242,000119342,000119428,000119551,000119552,000119553,000119554,000119555,000119556,000119557,000119558,000119559,000119560,000119561,000119562,000119563,000119564,000119565,000119566,000119567,000119568,000119569,000119570,000119571,000119572,000119573,000119574,000119575,000119576,000119577,000119578,000119579,000119580,000119581,000119582,000119583,000119584,000119585,000119586,000119587,000119588,000119589,000119590,000119591,000119592,000119593,000119594,000119595,000119596,000119597,000119598,000119599,000119600,000119601,000119602,000119603,000119604,000119605,000119606,000119607,000119608,000119609,000119610,000119611,000119612,000119613,000119614,000119615,000119616,000119617,000119618,000119619,000119620,000119621,000119622,000119623,000119624,000119625,000119626,000119627,000119628,000119629,000119630,000119631,000119632,000119633,000119634,000119635,000119636,000119637,000119638,000119639,000119640,000119641,000119642,000119643,000119644,000119645,000119647,000119648,000119649,000119650,000119651,000119652,000119653,000119654,000119655,000119656,000119657,000119658,000119659,000119660,000119661,000119662,000119663,000119664,000119665,000119666,000119667,000119668,000119669,000119670,000119671,000119672,000119673,000119674,000119675,000119676,000119677,000119678,000119679,000119680,000119681,000119682,000119683,000119684,000119685,000119686,000119687,000119688,000119689,000119690,000119691,000119692,000119693,000119694,000119695,000119696,000119697,000119698,000119699,000119700,000119701,000119702,000119703,000119704,000119705,000119706,000119707,000119708,000119709,000119710,000119711,000119712,000119713,000119714,000119715,000119716,000119717,000119718,000119719,000119720,000119721,000119722,000119723,000119724,000119725,000119726,000119727,000119728,000119729,000119730,000119731,000119732,000119733,000119734,000119735,000119736,000119737,000119738,000119739,000119740,000119741,000119742,000119743,000119744,000119745,000119746,000119747,000119748,000119749,000119750,000119751,000119752,000119753,000119754,000119755,000119756,000119757,000119758,000119759,000119760,000119761,000119762,000119763,000119764,000119765,000119766,000119767,000119768,000119769,000119770,000119771,000119772,000119773,000119774,000119775,000119776,000119777,000119778,000119779,000119780,000119781,000119782,000119783,000119784,000119785,000119786,000119787,000119788,000119789,000119790,000119791,000119792,000119793,000119794,000119795,000119796,000119797,000119798,000119799,000119800,000119801,000119802,000119803,000119804,000119805,000119806,000119807,000119808,000119809,000119810,000119811,000119812,000119813,000119814,000119815,000119816,000119817,000119818,000119819,000119820,000119821,000119822,000119823,000119824,000119825,000119826,000119827,000119828,000119829,000119830,000119831,000119832,000119833,000119834,000119835,000119836,000119837,000119838,000119839,000119840,000119841,000119842,000119843,000119844,000119845,000119846,000119847,000119848,000119849,000119850,000119851,000119852,000119853,000119854,000119855,000119856,000119857,000119858,000119859,000119860,000119861,000119862,000119863,000119864,000119865,000119866,000119867,000119868,000119869,000119870,000119871,000119872,000119873,000119874,000119875,000119876,000119877,000119878,000119879,000119880,000119881,000119882,000119883,000119884,000119885,000119886,000119887,000119888,000119889,000119890,000119891,000119892,000119893,000119894,000119895,000119896,000119897,000119898,000119899,000119900,000119901,000119902,000119903,000119904,000119905,000119906", 
         "Blom"
        ]
    ]
    output = [
        ["51518,51519,51520,51521", "9423 - 9426", "Fernandes"],
        ["51718", "9427 - 9500", "Barbosa"],
        ["51719", "9501","Admin"]
    ]
    desired_output = [
        ["51518 - 51521", "9423 - 9426", "Fernandes"],
        ["51718", "9427 - 9500", "Barbosa"],
        ["51719", "9501", "Admin"]
    ]

    co_id_cat_num_pair_col_index = 0
    input = [
        ["1:0021,2:0022,3:0043", "SomeText1", "Vial"],
        ["4:0023", "OtherText", "Vial"],
        ["5:0024", "AnotherText", "Vial"],
        ["6:0025,7:0026", "SomeText2", "Vial"],
        ["8:0027,9:0028,10:0029", "SomeText3", "Vial"]
    ]
    output = [
        ["1,2", "21 - 22", "SomeText1", "Vial"],
        ["4", "23", "OtherText", "Vial"],
        ["5", "24", "AnotherText", "Vial"],
        ["6,7", "25 - 26", "SomeText2", "Vial"],
        ["8,9,10", "27 - 29", "SomeText3", "Vial"],
        ["3", "43", "SomeText1", "Vial"]
    ]


    return series_query_results
