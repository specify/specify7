import csv
import json
import logging
import os
import re

from typing import Literal, NamedTuple
import xml.dom.minidom
from collections import namedtuple, defaultdict
from datetime import datetime
from functools import reduce

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from specifyweb.specify.models import Collectionobject
from specifyweb.specify.utils import get_parent_cat_num_inheritance_setting
from sqlalchemy import sql, orm, func, text
from sqlalchemy.sql.expression import asc, desc, insert, literal

from specifyweb.specify.field_change_info import FieldChangeInfo
from specifyweb.specify.models_by_table_id import get_table_id_by_model_name
from specifyweb.backend.stored_queries.group_concat import group_by_displayed_fields
from specifyweb.specify.tree_utils import get_search_filters

from . import models
from .format import ObjectFormatter, ObjectFormatterProps
from .query_construct import QueryConstruct
from .queryfield import QueryField
from .relative_date_utils import apply_absolute_date
from .field_spec_maps import apply_specify_user_name
from specifyweb.backend.notifications.models import Message
from specifyweb.backend.permissions.permissions import check_table_permissions
from specifyweb.specify.auditlog import auditlog
from specifyweb.specify.models import Collectionobjectgroupjoin, Loan, Loanpreparation, Loanreturnpreparation, Taxontreedef
from specifyweb.specify.utils import get_cat_num_inheritance_setting, log_sqlalchemy_query

from specifyweb.backend.stored_queries.group_concat import group_by_displayed_fields
from specifyweb.backend.stored_queries.queryfield import fields_from_json

logger = logging.getLogger(__name__)

SORT_LITERAL: Literal["asc"] | Literal["desc"] | None = None

SERIES_MAX_ROWS = 10000

class QuerySort:
    SORT_TYPES = [None, asc, desc]

    NONE: 0
    ASC: 1
    DESC: 2

    @staticmethod
    def by_id(sort_id: int):
        return QuerySort.SORT_TYPES[sort_id]

class BuildQueryProps(NamedTuple):
    recordsetid: int | None = None
    replace_nulls: bool = False
    formatauditobjs: bool = False
    distinct: bool = False
    series: bool = False
    implicit_or: bool = True
    formatter_props: ObjectFormatterProps = ObjectFormatterProps(
        format_agent_type = False,
        format_picklist = False,
        format_types = True,
        numeric_catalog_number = True,
        format_expr = True,
    )


def set_group_concat_max_len(connection):
    """The default limit on MySQL group concat function is quite
    small. This function increases it for the database connection for
    the given session.
    """
    connection.execute("SET group_concat_max_len = 1024 * 1024 * 1024")


def filter_by_collection(model, query, collection):
    """Add predicates to the given query to filter result to items scoped
    to the given collection. The model argument indicates the "base"
    table of the query. E.g. If model was CollectingEvent, this
    function would limit the results to collecting events in the same
    discipline as the given collection since collecting events are
    scoped to the discipline level.
    """
    if (
        model is models.Accession
        and collection.discipline.division.institution.isaccessionsglobal
    ):
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
        return query.filter(
            model.GeographyTreeDefID == collection.discipline.geographytreedef_id
        )

    if model is models.GeographyTreeDefItem:
        logger.info(
            "filtering geography rank to discipline: %s", collection.discipline.name
        )
        return query.filter(
            model.GeographyTreeDefID == collection.discipline.geographytreedef_id
        )

    if model is models.LithoStrat:
        logger.info(
            "filtering lithostrat to discipline: %s", collection.discipline.name
        )
        return query.filter(
            model.LithoStratTreeDefID == collection.discipline.lithostrattreedef_id
        )

    if model is models.LithoStratTreeDefItem:
        logger.info(
            "filtering lithostrat rank to discipline: %s", collection.discipline.name
        )
        return query.filter(
            model.LithoStratTreeDefID == collection.discipline.lithostrattreedef_id
        )

    if model is models.GeologicTimePeriod:
        logger.info(
            "filtering geologic time period to discipline: %s",
            collection.discipline.name,
        )
        return query.filter(
            model.GeologicTimePeriodTreeDefID
            == collection.discipline.geologictimeperiodtreedef_id
        )

    if model is models.GeologicTimePeriodTreeDefItem:
        logger.info(
            "filtering geologic time period rank to discipline: %s",
            collection.discipline.name,
        )
        return query.filter(
            model.GeologicTimePeriodTreeDefID
            == collection.discipline.geologictimeperiodtreedef_id
        )

    if model is models.TectonicUnit:
        logger.info("filtering tectonic unit to discipline: %s", collection.discipline.name)
        return query.filter(model.TectonicUnitTreeDefID == collection.discipline.tectonicunittreedef_id)

    if model is models.TectonicUnitTreeDefItem:
        logger.info("filtering tectonic unit rank to discipline: %s", collection.discipline.name)
        return query.filter(model.TectonicUnitTreeDefID == collection.discipline.tectonicunittreedef_id)

    if model is models.Storage:
        logger.info(
            "filtering storage to institution: %s",
            collection.discipline.division.institution.name,
        )
        return query.filter(
            model.StorageTreeDefID
            == collection.discipline.division.institution.storagetreedef_id
        )

    if model is models.StorageTreeDefItem:
        logger.info(
            "filtering storage rank to institution: %s",
            collection.discipline.division.institution.name,
        )
        return query.filter(
            model.StorageTreeDefID
            == collection.discipline.division.institution.storagetreedef_id
        )

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
        ("CollectionID", lambda collection: collection, lambda o: o.collectionname),
        (
            "collectionMemberId",
            lambda collection: collection,
            lambda o: o.collectionname,
        ),
        ("DisciplineID", lambda collection: collection.discipline, lambda o: o.name),
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

# def field_specs_from_json(json_fields):
#     """Given deserialized json data representing an array of SpQueryField
#     records, return an array of QueryField objects that can build the
#     corresponding sqlalchemy query.
#     """
#     def ephemeral_field_from_json(json):
#         return EphemeralField(**{field: json.get(field.lower(), None) for field in EphemeralField._fields})

#     field_specs =  [QueryField.from_spqueryfield(ephemeral_field_from_json(data))
#             for data in sorted(json_fields, key=lambda field: field['position'])]

#     return field_specs

def do_export(spquery, collection, user, filename, exporttype, host):
    """Executes the given deserialized query definition, sending the
    to a file, and creates "export completed" message when finished.

    See query_to_csv for details of the other accepted arguments.
    """
    recordsetid = spquery.get("recordsetid", None)

    distinct = spquery["selectdistinct"]
    tableid = spquery["contexttableid"]

    path = os.path.join(settings.DEPOSITORY_DIR, filename)
    message_type = "query-export-to-csv-complete"

    with models.session_context() as session:
        field_specs = fields_from_json(spquery['fields'])
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

# def stored_query_to_csv(query_id, collection, user, path):
#     """Executes a query from the Spquery table with the given id and send
#     the results to a CSV file at path.

#     See query_to_csv for details of the other accepted arguments.
#     """
#     with models.session_context() as session:
#         sp_query = session.query(models.SpQuery).get(query_id)
#         tableid = sp_query.contextTableId

#         field_specs = [
#             QueryField.from_spqueryfield(field)
#             for field in sorted(sp_query.fields, key=lambda field: field.position)
#         ]

#         query_to_csv(
#             session,
#             collection,
#             user,
#             tableid,
#             field_specs,
#             path,
#             distinct=spquery["selectdistinct"],
#         )  # bug?


def query_to_csv(
    session,
    collection,
    user,
    tableid,
    field_specs,
    path,
    recordsetid=None,
    captions=False,
    strip_id=False,
    row_filter=None,
    distinct=False,
    delimiter=",",
    bom=False,
):
    """Build a sqlalchemy query using the QueryField objects given by
    field_specs and send the results to a CSV file at the given
    file path.

    See build_query for details of the other accepted arguments.
    """
    set_group_concat_max_len(session.connection())
    query, __ = build_query(
        session,
        collection,
        user,
        tableid,
        field_specs,
        BuildQueryProps(recordsetid=recordsetid, replace_nulls=True, distinct=distinct),
    )
    query = apply_special_post_query_processing(query, tableid, field_specs, collection, user, should_list_query=False)

    logger.debug("query_to_csv starting")

    encoding = 'utf-8'
    if bom:
        encoding = 'utf-8-sig'

    with open(path, 'w', newline='', encoding=encoding) as f:
        csv_writer = csv.writer(f, delimiter=delimiter)
        if captions:
            header = captions
            if not strip_id and not distinct:
                header = ["id"] + header
            csv_writer.writerow(header)

        if isinstance(query, list):
            for row in query:
                if row_filter is not None and not row_filter(row):
                    continue
                encoded = [
                    re.sub("\r|\n", " ", str(f))
                    for f in (row[1:] if strip_id or distinct else row)
                ]
                csv_writer.writerow(encoded)
        else:
            for row in query.yield_per(1):
                if row_filter is not None and not row_filter(row):
                    continue
                encoded = [
                    re.sub("\r|\n", " ", str(f))
                    for f in (row[1:] if strip_id or distinct else row)
                ]
                csv_writer.writerow(encoded)

    logger.debug("query_to_csv finished")


def row_has_geocoords(coord_cols, row):
    """Assuming single point"""
    return (
        row[coord_cols[0]] != None
        and row[coord_cols[0]] != ""
        and row[coord_cols[1]] != None
        and row[coord_cols[1]] != ""
    )


def query_to_kml(
    session,
    collection,
    user,
    tableid,
    field_specs,
    path,
    captions,
    host,
    recordsetid=None,
    strip_id=False,
    selected_rows=None,
):
    """Build a sqlalchemy query using the QueryField objects given by
    field_specs and send the results to a kml file at the given
    file path.

    See build_query for details of the other accepted arguments.
    """
    set_group_concat_max_len(session.connection())
    query, __ = build_query(
        session,
        collection,
        user,
        tableid,
        field_specs,
        BuildQueryProps(recordsetid=recordsetid, replace_nulls=True),
    )
    if selected_rows:
        model = models.models_by_tableid[tableid]
        query = query.filter(model._id.in_(selected_rows))

    query = apply_special_post_query_processing(query, tableid, field_specs, collection, user, should_list_query=False)

    logger.debug("query_to_kml starting")

    kmlDoc = xml.dom.minidom.Document()

    kmlElement = kmlDoc.createElementNS("http://earth.google.com/kml/2.2", "kml")
    kmlElement.setAttribute("xmlns", "http://earth.google.com/kml/2.2")
    kmlElement = kmlDoc.appendChild(kmlElement)
    documentElement = kmlDoc.createElement("Document")
    documentElement = kmlElement.appendChild(documentElement)

    if not strip_id:
        model = models.models_by_tableid[tableid]
        table = str(model._id).split(".")[0].lower()  # wtfiw
    else:
        table = None

    coord_cols = getCoordinateColumns(field_specs, table != None)

    if isinstance(query, list):
        for row in query:
            if row_has_geocoords(coord_cols, row):
                placemarkElement = createPlacemark(
                    kmlDoc, row, coord_cols, table, captions, host
                )
                documentElement.appendChild(placemarkElement)
    else:
        for row in query.yield_per(1):
            if row_has_geocoords(coord_cols, row):
                placemarkElement = createPlacemark(
                    kmlDoc, row, coord_cols, table, captions, host
                )
                documentElement.appendChild(placemarkElement)

    with open(path, "wb") as kmlFile:
        # This should be controlled by a preference or argument, because it makes adding 
        # tests difficult.
        kmlFile.write(kmlDoc.toprettyxml("  ", newl="\n", encoding="utf-8"))

    logger.debug("query_to_kml finished")


def getCoordinateColumns(field_specs, hasId):
    coords = {
        "longitude1": -1,
        "latitude1": -1,
        "longitude2": -1,
        "latitude2": -1,
        "latlongtype": -1,
    }
    f = 1 if hasId else 0
    for fld in field_specs:
        if fld.fieldspec.table.name == "Locality":
            jp = fld.fieldspec.join_path
            # BUG: In the cases where the basetable's formatted is added to the query,
            # then the below branch will incorrectly skip incrementing the index.
            # To fix this, simply do all the below logic in `if jp` (rather than continuing)
            # See test: specifyweb.backend.stored_queries.tests.test_execution.TestGetCoordinateColumns.test_formatted_fields)
            if not jp:
                continue
            f_name = jp[-1].name.lower()
            if f_name in coords:
                coords[f_name] = f
        if fld.display:
            f = f + 1

    result = [coords["longitude1"], coords["latitude1"]]
    if coords["longitude2"] != -1 and coords["latitude2"] != -1:
        result.extend([coords["longitude2"], coords["latitude2"]])
        if coords["latlongtype"] != -1:
            result.append(coords["latlongtype"])

    return result


def createPlacemark(kmlDoc, row, coord_cols, table, captions, host):
    # This creates a  element for a row of data.
    # print row
    placemarkElement = kmlDoc.createElement("Placemark")
    extElement = kmlDoc.createElement("ExtendedData")
    placemarkElement.appendChild(extElement)

    # Loop through the columns and create a  element for every field that has a value.
    adj = 0 if table == None else 1
    nameElement = kmlDoc.createElement("name")
    nameText = kmlDoc.createTextNode(row[adj])
    nameElement.appendChild(nameText)
    placemarkElement.appendChild(nameElement)
    for f in range(adj, len(row)):
        if f not in coord_cols:
            dataElement = kmlDoc.createElement("Data")
            dataElement.setAttribute("name", captions[f - adj])
            valueElement = kmlDoc.createElement("value")
            dataElement.appendChild(valueElement)
            valueText = kmlDoc.createTextNode(row[f])
            valueElement.appendChild(valueText)
            extElement.appendChild(dataElement)

    # display coords
    crdElement = kmlDoc.createElement("Data")
    crdElement.setAttribute("name", "coordinates")
    crdValue = kmlDoc.createElement("value")
    crdElement.appendChild(crdValue)
    crdStr = row[coord_cols[1]] + ", " + row[coord_cols[0]]
    if len(coord_cols) >= 4:
        crdStr += " : " + row[coord_cols[3]] + ", " + row[coord_cols[2]]
    if len(coord_cols) == 5:
        crdStr += " (" + row[coord_cols[4]] + ")"
    crdValue.appendChild(kmlDoc.createTextNode(crdStr))
    extElement.appendChild(crdElement)

    # add the url
    if table != None:
        urlElement = kmlDoc.createElement("Data")
        urlElement.setAttribute("name", "go to")
        urlValue = kmlDoc.createElement("value")
        urlElement.appendChild(urlValue)
        urlText = kmlDoc.createTextNode(
            host + "/specify/view/" + table + "/" + str(row[0]) + "/"
        )
        urlValue.appendChild(urlText)
        extElement.appendChild(urlElement)

    # add coords
    if len(coord_cols) == 5:
        coord_type = row[coord_cols[4]].lower()
    elif len(coord_cols) == 4:
        coord_type = "line"
    else:
        coord_type = "point"

    pointElement = kmlDoc.createElement("Point")
    coordinates = row[coord_cols[0]] + "," + row[coord_cols[1]]
    coorElement = kmlDoc.createElement("coordinates")
    coorElement.appendChild(kmlDoc.createTextNode(coordinates))
    pointElement.appendChild(coorElement)

    if coord_type == "point":
        placemarkElement.appendChild(pointElement)
    else:
        multiElement = kmlDoc.createElement("MultiGeometry")
        multiElement.appendChild(pointElement)
        if coord_type == "line":
            lineElement = kmlDoc.createElement("LineString")
            tessElement = kmlDoc.createElement("tessellate")
            tessElement.appendChild(kmlDoc.createTextNode("1"))
            lineElement.appendChild(tessElement)
            coordinates = (
                row[coord_cols[0]]
                + ","
                + row[coord_cols[1]]
                + " "
                + row[coord_cols[2]]
                + ","
                + row[coord_cols[3]]
            )
            coorElement = kmlDoc.createElement("coordinates")
            coorElement.appendChild(kmlDoc.createTextNode(coordinates))
            lineElement.appendChild(coorElement)
            multiElement.appendChild(lineElement)
        else:
            ringElement = kmlDoc.createElement("LinearRing")
            tessElement = kmlDoc.createElement("tessellate")
            tessElement.appendChild(kmlDoc.createTextNode("1"))
            ringElement.appendChild(tessElement)
            coordinates = row[coord_cols[0]] + "," + row[coord_cols[1]]
            coordinates += " " + row[coord_cols[2]] + "," + row[coord_cols[1]]
            coordinates += " " + row[coord_cols[2]] + "," + row[coord_cols[3]]
            coordinates += " " + row[coord_cols[0]] + "," + row[coord_cols[3]]
            coordinates += " " + row[coord_cols[0]] + "," + row[coord_cols[1]]
            coorElement = kmlDoc.createElement("coordinates")
            coorElement.appendChild(kmlDoc.createTextNode(coordinates))
            ringElement.appendChild(coorElement)
            multiElement.appendChild(ringElement)

        placemarkElement.appendChild(multiElement)

    return placemarkElement


def run_ephemeral_query(collection, user, spquery):
    """Execute a Specify query from deserialized json and return the results
    as an array for json serialization to the web app.
    """
    logger.info("ephemeral query: %s", spquery)
    limit = spquery.get("limit", 20)
    offset = spquery.get("offset", 0)
    recordsetid = spquery.get("recordsetid", None)
    distinct = spquery["selectdistinct"]
    series = spquery.get('smushed', None)
    tableid = spquery["contexttableid"]
    count_only = spquery["countonly"]
    format_audits = spquery.get("formatauditrecids", False)

    with models.session_context() as session:
        field_specs = fields_from_json(spquery["fields"])
        return execute(
            session=session,
            collection=collection,
            user=user,
            tableid=tableid,
            distinct=distinct,
            series=series,
            count_only=count_only,
            field_specs=field_specs,
            limit=limit,
            offset=offset,
            recordsetid=recordsetid,
            formatauditobjs=format_audits,
        )


# def augment_field_specs(field_specs: list[QueryField], formatauditobjs=False):
#     print("augment_field_specs ######################################")
#     new_field_specs = []
#     for fs in field_specs:
#         print(fs)
#         print(fs.fieldspec.table.tableId)
#         field = fs.fieldspec.join_path[-1]
#         model = models.models_by_tableid[fs.fieldspec.table.tableId]
#         if field.type == "java.util.Calendar":
#             precision_field = field.name + "Precision"
#             has_precision = hasattr(model, precision_field)
#             if has_precision:
#                 new_field_specs.append(
#                     make_augmented_field_spec(fs, model, precision_field)
#                 )
#         elif formatauditobjs and model.name.lower().startswith("spauditlog"):
#             if field.name.lower() in "newvalue, oldvalue":
#                 log_model = models.models_by_tableid[530]
#                 new_field_specs.append(
#                     make_augmented_field_spec(fs, log_model, "TableNum")
#                 )
#                 new_field_specs.append(
#                     make_augmented_field_spec(fs, model, "FieldName")
#                 )
#             elif field.name.lower() == "recordid":
#                 new_field_specs.append(make_augmented_field_spec(fs, model, "TableNum"))
#     print("################################ sceps_dleif_tnemgua")


# def make_augmented_field_spec(field_spec, model, field_name):
#     print("make_augmented_field_spec ######################################")


def recordset(collection, user, user_agent, recordset_info): # pragma: no cover
    "Create a record set from the records matched by a query."
    spquery = recordset_info["fromquery"]
    tableid = spquery["contexttableid"]

    with models.session_context() as session:
        recordset = models.RecordSet()
        recordset.timestampCreated = timezone.now()
        recordset.version = 0
        recordset.collectionMemberId = collection.id
        recordset.dbTableId = tableid
        recordset.name = recordset_info["name"]
        if "remarks" in recordset_info:
            recordset.remarks = recordset_info["remarks"]
        recordset.type = 0
        recordset.createdByAgentID = user_agent.id
        recordset.SpecifyUserID = user.id
        session.add(recordset)
        session.flush()
        new_rs_id = recordset.recordSetId

        model = models.models_by_tableid[tableid]

        field_specs = fields_from_json(spquery["fields"])

        query, __ = build_query(session, collection, user, tableid, field_specs)
        query = query.with_entities(model._id, literal(new_rs_id)).distinct()
        RSI = models.RecordSetItem
        ins = insert(RSI).from_select((RSI.recordId, RSI.RecordSetID), query)
        session.execute(ins)

    return new_rs_id


def return_loan_preps(collection, user, agent, data):
    spquery = data["query"]
    commit = data["commit"]

    tableid = spquery["contexttableid"]
    if not (tableid == Loanpreparation.specify_model.tableId):
        raise AssertionError(
            f"Unexpected tableId '{tableid}' in request. Expected {Loanpreparation.specify_model.tableId}",
            {
                "tableId": tableid,
                "expectedTableId": Loanpreparation.specify_model.tableId,
                "localizationKey": "unexpectedTableId",
            },
        )

    with models.session_context() as session:
        model = models.models_by_tableid[tableid]

        field_specs = fields_from_json(spquery["fields"])

        query, __ = build_query(session, collection, user, tableid, field_specs)
        lrp = orm.aliased(models.LoanReturnPreparation)
        loan = orm.aliased(models.Loan)
        query = query.join(loan).outerjoin(lrp)
        unresolved = (
            sql.functions.coalesce(model.quantity, 0)
            - sql.functions.coalesce(sql.functions.sum(lrp.quantityResolved), 0)
        ).label("unresolved")
        query = query.with_entities(
            model._id, unresolved, loan.loanId, loan.loanNumber
        ).group_by(model._id)
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

                auditlog.update(
                    lp,
                    agent,
                    None,
                    [
                        FieldChangeInfo(
                            field_name="quantityresolved",
                            old_value=lp.quantityresolved - quantity,
                            new_value=lp.quantityresolved,
                        ),
                        FieldChangeInfo(
                            field_name="quantityreturned",
                            old_value=lp.quantityreturned - quantity,
                            new_value=lp.quantityreturned,
                        ),
                        FieldChangeInfo(
                            field_name="isresolved",
                            old_value=was_resolved,
                            new_value=True,
                        ),
                    ],
                )

                new_lrp = Loanreturnpreparation.objects.create(
                    quantityresolved=quantity,
                    quantityreturned=quantity,
                    loanpreparation_id=lp_id,
                    returneddate=data.get("returneddate", None),
                    receivedby_id=data.get("receivedby", None),
                    createdbyagent=agent,
                    discipline=collection.discipline,
                )
                auditlog.insert(new_lrp, agent)
            loans_to_close = (
                Loan.objects.select_for_update()
                .filter(
                    pk__in={loan_id for _, _, loan_id, _ in to_return},
                    isclosed=False,
                )
                .exclude(loanpreparations__isresolved=False)
            )
            for loan in loans_to_close:
                loan.isclosed = True
                loan.save()
                auditlog.update(
                    loan,
                    agent,
                    None,
                    [
                        {
                            "field_name": "isclosed",
                            "old_value": False,
                            "new_value": True,
                        },
                    ],
                )
        return to_return

def execute(
    session,
    collection,
    user,
    tableid,
    distinct,
    series,
    count_only,
    field_specs,
    limit,
    offset,
    recordsetid=None,
    formatauditobjs=False,
    formatter_props=ObjectFormatterProps(),
):
    "Build and execute a query, returning the results as a data structure for json serialization"

    set_group_concat_max_len(session.info["connection"])
    query, order_by_exprs = build_query(
        session,
        collection,
        user,
        tableid,
        field_specs,
        BuildQueryProps(
            recordsetid=recordsetid,
            formatauditobjs=formatauditobjs,
            distinct=distinct,
            series=series,
            formatter_props=formatter_props,
        ),
    )

    if count_only:
        if series:
            cat_num_sort_type = 0
            for field_spec in field_specs:
                if field_spec.fieldspec.get_field() and field_spec.fieldspec.get_field().name.lower() == 'catalognumber':
                    cat_num_sort_type = field_spec.sort_type
                    break
            return {'count': len(series_post_query(query, limit=SERIES_MAX_ROWS, offset=0, sort_type=cat_num_sort_type, is_count=True))}
        else:
            return {'count': query.count()}
    else:
        cat_num_col_id = None
        cat_num_sort_type = None
        idx = 0
        for field_spec in field_specs:
            if field_spec.fieldspec.get_field() and field_spec.fieldspec.get_field().name.lower() == 'catalognumber':
                cat_num_col_id = idx
                cat_num_sort_type = field_spec.sort_type
                break
            idx += 1
        is_valid_series_query = series and \
            cat_num_col_id is not None \
            and tableid == get_table_id_by_model_name('Collectionobject')

        if is_valid_series_query:
            # order_by_exprs.insert(0, text("MIN(IFNULL(CAST(`CatalogNumber` AS DECIMAL(65)), NULL))")) # doesn't work if there are non-numeric catalog numbers
            # if cat_num_sort_type in {0, 1}:
            #     order_by_exprs.insert(0, text("collectionobject.`CatalogNumber`"))
            # elif cat_num_sort_type == 2:
            #     order_by_exprs.insert(0, text("collectionobject.`CatalogNumber` DESC"))
            order_by_exprs.insert(0, text("collectionobject.`CatalogNumber`"))

            # query = query.limit(SERIES_MAX_ROWS)
            return {'results': series_post_query(query, limit=limit, offset=offset, sort_type=cat_num_sort_type)}
        
        logger.debug("order by: %s", order_by_exprs)
        query = query.order_by(*order_by_exprs).offset(offset)

        if limit:
            query = query.limit(limit)

        log_sqlalchemy_query(query) # Debugging
        return {"results": apply_special_post_query_processing(query, tableid, field_specs, collection, user)}

def build_query(
    session,
    collection,
    user,
    tableid,
    field_specs,
    props: BuildQueryProps = BuildQueryProps(),
):
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
    id_field = model._id
    catalog_number_field = model.catalogNumber if hasattr(model, 'catalogNumber') else None

    field_specs = [apply_absolute_date(field_spec) for field_spec in field_specs]
    field_specs = [apply_specify_user_name(field_spec, user) for field_spec in field_specs]

    query_construct_query = session.query(id_field)
    if props.series and catalog_number_field:
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
    elif props.distinct:
        query_construct_query = session.query(func.group_concat(id_field.distinct(), separator=','))
    else:
        query_construct_query = session.query(id_field)
    
    query = QueryConstruct(
        collection=collection,
        objectformatter=ObjectFormatter(
            collection,
            user,
            props.replace_nulls,
            props=props.formatter_props,
        ),
        query=query_construct_query
    )

    tables_to_read = {
            table
            for fs in field_specs
            for table in query.tables_in_path(
                fs.fieldspec.root_table, fs.fieldspec.join_path
            )
    }

    for table in tables_to_read:
        check_table_permissions(collection, user, table, "read")

    query = filter_by_collection(model, query, collection)

    if props.recordsetid is not None:
        logger.debug("joining query to recordset: %s", props.recordsetid)
        recordset = session.query(models.RecordSet).get(props.recordsetid)
        if not (recordset.dbTableId == tableid):
            raise AssertionError(
                f"Unexpected tableId '{tableid}' in request. Expected '{recordset.dbTableId}'",
                {
                    "tableId": tableid,
                    "expectedTableId": recordset.dbTableId,
                    "localizationKey": "unexpectedTableId",
                },
            )
        query = query.join(
            models.RecordSetItem, models.RecordSetItem.recordId == id_field
        ).filter(models.RecordSetItem.recordSet == recordset)

    order_by_exprs = []
    selected_fields = []
    predicates_by_field = defaultdict(list)
    # augment_field_specs(field_specs, formatauditobjs)
    for fs in field_specs:
        # sort_type = SORT_TYPES[fs.sort_type]
        sort_type = QuerySort.by_id(fs.sort_type)

        if props.series and fs.fieldspec.get_field() and fs.fieldspec.get_field().name.lower() == 'catalognumber':
            _, _, predicate = fs.add_to_query(query, formatauditobjs=props.formatauditobjs)
            predicates_by_field[fs.fieldspec].append(predicate) if predicate is not None else None
            continue

        query, field, predicate = fs.add_to_query(
            query, formatauditobjs=props.formatauditobjs, collection=collection, user=user
        )

        if field is None:
            continue

        formatted_field = None
        if fs.display:
            formatted_field = query.objectformatter.fieldformat(fs, field)
            query = query.add_columns(formatted_field)
            selected_fields.append(formatted_field)
        
        if hasattr(field, 'key') and field.key and field.key.lower() == 'catalognumber':
            catalog_number_field = formatted_field


        if sort_type is not None:
            order_by_exprs.append(sort_type(field))

        if predicate is not None:
            predicates_by_field[fs.fieldspec].append(predicate)

    if props.implicit_or:
        implicit_ors = [
            reduce(sql.or_, ps) for ps in predicates_by_field.values() if ps
        ]

        if implicit_ors:
            where = reduce(sql.and_, implicit_ors)
            query = query.filter(where)
    else:
        where = reduce(sql.and_, (p for ps in predicates_by_field.values() for p in ps))
        query = query.filter(where)

    if props.series:
        query = group_by_displayed_fields(query, selected_fields, ignore_cat_num=True)
    elif props.distinct:
        query = group_by_displayed_fields(query, selected_fields)

    internal_predicate = query.get_internal_filters()
    query = query.filter(internal_predicate)

    logger.debug("query: %s", query.query)
    return query.query, order_by_exprs

# def series_post_query_for_int_cat_nums(query, co_id_cat_num_pair_col_index=0):
#     """Transform the query results by removing the co_id:catnum pair column
#     and adding a co_id colum and formatted catnum range column.
#     Sort the results by the first catnum in the range."""
#     log_sqlalchemy_query(query)  # Debugging

#     def group_consecutive_ranges(lst):
#         def group_consecutives(acc, x):
#             if not acc or int(acc[-1][-1][1]) + 1 != int(x[1]):
#                 acc.append([x])
#             else:
#                 acc[-1].append(x)
#             return acc

#         grouped = reduce(group_consecutives, lst, [])
#         return [
#             (','.join([x[0] for x in group]), f"{group[0][1]} - {group[-1][1]}" if len(group) > 1 else f"{group[0][1]}")
#             for group in grouped
#         ]

#     def process_row(row):
#         co_id_cat_num_consecutive_pairs = group_consecutive_ranges(
#             sorted(
#                 (pair.split(':') for pair in row[co_id_cat_num_pair_col_index].split(',')),
#                 key=lambda x: int(x[1])
#             )
#         )

#         return [
#             [co_id, cat_num_series] + list(
#                 list(row[1:]) if co_id_cat_num_pair_col_index == 0
#                 else list(row[:co_id_cat_num_pair_col_index]) + list(row[co_id_cat_num_pair_col_index + 1:])
#             )
#             for co_id, cat_num_series in co_id_cat_num_consecutive_pairs
#         ]

#     MAX_ROWS = 500
#     return [item for sublist in map(process_row, list(query)) for item in sublist][:MAX_ROWS]

def series_post_query(query, limit=40, offset=0, sort_type=0, co_id_cat_num_pair_col_index=0, is_count=False):
    """Transform the query results by removing the co_id:catnum pair column
    and adding a co_id colum and formatted catnum range column.
    Sort the results by the first catnum in the range."""

    log_sqlalchemy_query(query)  # Debugging

    def parse_catalog_for_comparing(s):
        def check_for_decimal(s):
            decimal_match = re.search(r'\d+\.\d+', s)
            if decimal_match:
                return decimal_match.group()
            return None

        try:
            num = int(s)
            return (num, '', '')
        except ValueError:
            decimal_match_str = check_for_decimal(s)
            if decimal_match_str:
                num, dec = decimal_match_str.split('.')
                match = re.search(rf'(\D*)({num}\.{dec})(.*)', s)
                if match:
                    prefix, number, postfix = match.groups()
                    prefix = prefix if prefix else '' 
                    postfix = postfix if postfix else '' 
                    return (int(float(number)), prefix, postfix)
            
            # Match integer-integer string, like "1234-5678" so that the number 12345678 is parsed
            match = re.search(r'^(\d+)-(\d+)$', s)
            if match:
                num1, num2 = match.groups()
                combined_number = int(str(num1) + str(num2))  # Concatenate as strings, then convert to int
                return (combined_number, '', '')
            
            # Match string-interger string, like "abc-1234" so that the number 1234 is parsed
            match = re.search(r'(\D*)(\d+)', s)
            if match:
                prefix, number = match.groups()
                prefix = prefix if prefix else '' 
                return (int(number), prefix, '')

            match = re.search(r'(\D*)(\d+)(.*)', s)
            if match:
                prefix, number, postfix = match.groups()
                prefix = prefix if prefix else '' 
                postfix = postfix if postfix else '' 
                return (int(number), prefix, postfix)
            
            return (None, s, '')

    def parse_catalog_for_sorting(catalog): # pragma: no cover
        m = re.match(r'^([A-Za-z]*)(\d+)$', catalog)
        if m:
            return m.group(1), int(m.group(2))
        else:
            return catalog, None

    def catalog_sort_key(x):
        num, prefix, postfix = parse_catalog_for_comparing(x[1])
        return (prefix, num, postfix if num is not None else x[1])

    def are_adjacent(cat1, cat2):
        num1, prefix1, postfix1 = parse_catalog_for_comparing(cat1)
        num2, prefix2, postfix2 = parse_catalog_for_comparing(cat2)
        return prefix1 == prefix2 and \
               postfix1 == postfix2 and \
               num1 is not None and \
               num2 is not None and \
               (num1 + 1 == num2 or num1 == num2)

    def group_consecutive_ranges(lst):
        def group_consecutives(acc, x):
            if not acc or not are_adjacent(acc[-1][-1][1], x[1]):
                acc.append([x])
            else:
                acc[-1].append(x)
            return acc

        grouped = reduce(group_consecutives, lst, [])
        return [
            (','.join([x[0] for x in group]),
             f"{group[0][1]} - {group[-1][1]}" if len(group) > 1 else f"{group[0][1]}")
            for group in grouped
        ]

    def process_row(row):
        co_id_cat_num_seq = row[co_id_cat_num_pair_col_index]
        if row[co_id_cat_num_pair_col_index] is None:
            return []

        sorted_pairs = sorted(
            [[item if item else '0'
              for item in pair.split(':')]
              for pair in co_id_cat_num_seq.split(',') if isinstance(co_id_cat_num_seq, str)],
            key=catalog_sort_key
        )
        co_id_cat_num_consecutive_pairs = group_consecutive_ranges(sorted_pairs)
        return [
            [co_id, cat_num_series] + (
                list(row[1:]) if co_id_cat_num_pair_col_index == 0
                else list(row[:co_id_cat_num_pair_col_index]) + list(row[co_id_cat_num_pair_col_index + 1:])
            )
            for co_id, cat_num_series in co_id_cat_num_consecutive_pairs
        ]

    # Process and flatten the results
    results = [item for sublist in map(process_row, list(query)) for item in sublist]

    # Reorder the final results based on sort_type
    if sort_type == 2:
        results = results[::-1]

    if is_count:
        return results

    series_limit = limit if limit else SERIES_MAX_ROWS
    offset = offset if offset else 0
    return results[offset:offset + series_limit]

def apply_special_post_query_processing(query, tableid, field_specs, collection, user, should_list_query=True):
    parent_inheritance_pref = get_parent_cat_num_inheritance_setting(collection, user)
    
    if parent_inheritance_pref:
        query = parent_inheritance_post_query_processing(query, tableid, field_specs, collection, user)
    else: 
        query = cog_inheritance_post_query_processing(query, tableid, field_specs, collection, user)
    
    if should_list_query:
        return list(query)
    return query

def parent_inheritance_post_query_processing(query, tableid, field_specs, collection, user, should_list_query=True): # pragma: no cover
    if tableid == 1 and 'catalogNumber' in [fs.fieldspec.join_path[0].name for fs in field_specs if fs.fieldspec.join_path]:
        if not get_parent_cat_num_inheritance_setting(collection, user):
            return list(query)

        # Get the catalogNumber field index
        catalog_number_field_index = [fs.fieldspec.join_path[0].name for fs in field_specs].index('catalogNumber') + 1

        if field_specs[catalog_number_field_index - 1].op_num != 1:
            return list(query)

        results = list(query)
        updated_results = []

        # Map results, replacing null catalog numbers with the parent catalog number
        for result in results:
            result = list(result)
            if result[catalog_number_field_index] is None or result[catalog_number_field_index] == '':
                component_id = result[0]  # Assuming the first column is the child's ID
                component_obj = Collectionobject.objects.filter(id=component_id).first()
                if component_obj and component_obj.componentParent:
                    result[catalog_number_field_index] = component_obj.componentParent.catalognumber
            updated_results.append(tuple(result))

        return updated_results

    return query

def cog_inheritance_post_query_processing(query, tableid, field_specs, collection, user):
    if tableid == 1 and 'catalogNumber' in [fs.fieldspec.join_path[0].name for fs in field_specs if fs.fieldspec.join_path]:
        if not get_cat_num_inheritance_setting(collection, user):
            # query = query.filter(collectionobjectgroupjoin_1.isprimary == 1)
            return list(query)

        # Get the catalogNumber field index
        catalog_number_field_index = [fs.fieldspec.join_path[0].name for fs in field_specs if fs.fieldspec.join_path].index('catalogNumber') + 1

        if field_specs[catalog_number_field_index - 1].op_num != 1:
            return list(query)

        results = list(query)
        updated_results = []

        # Map results, replacing null catalog numbers with the collection object group primary collection catalog number
        for result in results:
            result = list(result)
            if result[catalog_number_field_index] is None or result[catalog_number_field_index] == '':
                cojo = Collectionobjectgroupjoin.objects.filter(childco_id=result[0]).first()
                if cojo:
                    primary_cojo = Collectionobjectgroupjoin.objects.filter(
                        parentcog=cojo.parentcog, isprimary=True).first()
                    if primary_cojo:
                        result[catalog_number_field_index] = primary_cojo.childco.catalognumber
            updated_results.append(tuple(result))

        return updated_results

    return query
