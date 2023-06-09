from django import http

from specifyweb.permissions.permissions import check_table_permissions
from specifyweb.specify.views import openapi
from django.http import HttpResponse
from ..specify.models import Preparation, Determination
from specifyweb.specify.views import login_maybe_required
import logging
import copy
from ..specify.tree_extras import set_fullnames, renumber_tree
logger = logging.getLogger(__name__)
from django.db import connection

TABLE_TO_IMPORT = "TABLE_TO_IMPORT"
TAXON_TREE_ID = 5
ranks = ["Kingdom", "Phylum", "Class", "Order", "Family", "Genus", "Species"]
columns = ["name", "guid", "author", "common_name", "source"]
rank_item_arr = [10, 30, 60, 100, 140, 180, 220, 230]
taxon_tree_def_item_arr = []


def construct_taxon_dict(taxon_array):
    return {key: taxon_array[index] for index, key in enumerate(columns)}


def construct_taxon_array(taxon_array):
    return [construct_taxon_dict(taxon_array[index: index+ len(columns)]) for index in range(0, len(columns) * len(ranks), len(columns))]

def import_taxon(current_taxon_row, previous_taxon_row):
    current_taxon_row_mapped = construct_taxon_array(current_taxon_row)
    for rank_index in range(len(current_taxon_row)):
        if not (current_taxon_row_mapped[rank_index]['guid'] == previous_taxon_row[rank_index]['guid']):
            return insert_taxon_row(current_taxon_row_mapped, rank_index, previous_taxon_row[0:rank_index])
            break
    return previous_taxon_row


def coalesce(value1, value2):
    if value1 is None:
        if value2 is None:
            return None
        return value2
    if value2 is None:
        return value1
    return value2


def insert_taxon_row(taxon_row_to_insert, rank_index, previous_parents):
    running_parent_id = None
    previous_taxon_to_return = []
    for index in range(len(previous_parents)):
        running_parent_id = coalesce(running_parent_id,
                                     previous_parents[index]['id'])
        previous_taxon_to_return.append(copy.deepcopy(previous_parents[index]))

    for updating_index in range(rank_index, len(taxon_row_to_insert)):
        updating_taxon = taxon_row_to_insert[updating_index]
        new_parent_id = update_id(updating_taxon, running_parent_id,
                                  updating_index)
        updated_taxon = copy.deepcopy(updating_taxon)
        updated_taxon['id'] = new_parent_id
        previous_taxon_to_return.append(
            updated_taxon
        )
        running_parent_id = coalesce(running_parent_id, new_parent_id)
    return previous_taxon_to_return

def wrap_in_null(string_to_wrap):
    if string_to_wrap is None:
        return "null"

    double_q = string_to_wrap.replace('"', '$(DQ)$')
    single_q = double_q.replace("'", '$(SQ)$')

    return f'"{single_q}"'
    #return "null" if string_to_wrap is None else f"""'{string_to_wrap}'"""

def update_id(id, parent_id, updating_index):
    if id['guid'] is None:
        return None
    cursor = connection.cursor()
    sql_str = """insert into taxon
                (TimestampCreated,  text3, commonname, guid, IsAccepted, IsHybrid, name, rankid,text4, taxontreedefitemid, taxontreedefid, parentid)
                values(now(), {author}, {common_name}, {guid}, 1, 0, {name}, {rankid}, {source}, {ttdefitemid}, {taxonTreeId}, {parentid});""".format(
                name=wrap_in_null(id['name']),
                guid=wrap_in_null(id['guid']),
                author=wrap_in_null(id['author']),
                common_name=wrap_in_null(id['common_name']),
                source=wrap_in_null(id['source']),
                rankid=rank_item_arr[updating_index],
                parentid=parent_id if parent_id is not None else 'null',
                ttdefitemid=taxon_tree_def_item_arr[updating_index],
                taxonTreeId=TAXON_TREE_ID
    )
    logger.warning(sql_str)
    cursor.execute(sql_str)
    cursor.execute(
        """select max(taxonid) from taxon"""
    )
    return_id, = cursor.fetchone()
    #logger.warning(f"setting parent of id:  {return_id}, name: , {id},  to , {parent_id},  at rank , {updating_index}")
    return return_id


@login_maybe_required
@openapi(schema={
    'get': {
        'responses': {
            '200': {
                'description': 'Returns Global Collection Preparation Stats for Specify',
                'content': {
                    'application/json': {
                        'schema': {
                            'type': 'object',
                            'additionalProperties': True,
                        }
                    }
                }
            }
        }
    }}, )
def collection_preparations(request) -> HttpResponse:
    # check_table_permissions(request.specify_collection, request.specify_user, Preparation, "read")
    renumber_tree('taxon')
    set_fullnames('taxon', TAXON_TREE_ID, 14)
    # cursor = connection.cursor()
    # # PREP_BY_TYPE_LOTS
    # cursor.execute(
    #     """
    #     SELECT pt.Name, count(PreparationID), if(sum(countAmt) is null, 0, sum(countAmt))
    #     FROM preparation p
    #              INNER JOIN preptype pt ON pt.PrepTypeID = p.PrepTypeID
    #     WHERE CollectionMemberID = %s
    #     group by pt.Name
    #     """,
    #     [request.specify_collection.id]
    # )
    # prepbytypelots_result = cursor.fetchall()
    # preptypelotstotal_dict = {}
    # for (name, lots, total) in list(prepbytypelots_result):
    #     preptypelotstotal_dict[name] = {
    #         'lots': int(lots),
    #         'total': int(total)
    #     }
    return http.JsonResponse({3: 5})


@login_maybe_required
@openapi(schema={
    'get': {
        'responses': {
            '200': {
                'description': 'Returns Global Collection Locality/Geography Stats for Specify',
                'content': {
                    'application/json': {
                        'schema': {
                            'type': 'object',
                            'properties': {
                                'countries': {
                                    'type': 'integer'
                                }
                            }
                        }
                    }
                }
            }
        }
    }}, )
def collection_locality_geography(request) -> HttpResponse:
    cursor = connection.cursor()
    ####LOC_GEO
    # COUNTRIES
    '''geography_dict = {}
    #don't need geographyid
    cursor.execute(
        """
        SELECT count(Name)
        FROM (SELECT DISTINCT Name
              FROM (SELECT g.GeographyID, g.nodenumber
                    FROM locality as l
                             inner join geography as g on l.GeographyID = g.GeographyID) as GEO,
                   geography as g
              WHERE g.rankid = 200
                and GEO.nodenumber between g.nodenumber and g.HighestChildNodeNumber) As GEO2
        """)
    geography_dict['countries'] = int((cursor.fetchone()[0]))
    
    '''
    previous_row_init = [None for _ in range(len(columns)*len(ranks))]
    previous_row = construct_taxon_array(previous_row_init)

    select_stmt = ""

    for rank in ranks:
        if rank.lower() == "order":
            select_stmt += "order_, "
        else:
            select_stmt += rank.lower() + ", "
        for col in columns[1::]:
            select_stmt += rank.lower() + "_" + col + ", "
    select_stmt += "\n"
    #Trim last trailing comma
    select_stmt = select_stmt[:-3]

    cursor.execute(
        f"""
        SELECT
        {select_stmt}
        from {TABLE_TO_IMPORT}
        """
    )

    taxon_to_import = list(cursor.fetchall())


    for taxon_counter in range(len(taxon_to_import)):
        logger.warning('On row: ')
        logger.warning(taxon_counter)
        previous_row = import_taxon(taxon_to_import[taxon_counter], previous_row)

    return http.JsonResponse({3: 5})





@login_maybe_required
@openapi(schema={
    'get': {
        'responses': {
            '200': {
                'description': 'Returns Global Collection Type Specimen Stats for Specify',
                'content': {
                    'application/json': {
                        'schema': {
                            'type': 'object',
                            'additionalProperties': True,
                        }
                    }
                }
            }
        }
    }}, )
def collection_type_specimens(request) -> HttpResponse:
    check_table_permissions(request.specify_collection, request.specify_user,
                            Determination, "read")
    cursor = connection.cursor()
    # TYPE_SPEC_CNT
    cursor.execute(
        """
        SELECT TypeStatusName, count(DeterminationID) AS DeterminationCount
        FROM determination
        WHERE CollectionMemberID = % s
          AND TypeStatusName is not null
        group by TypeStatusName
        """,
        [request.specify_collection.id]
    )
    type_specific_count_result = cursor.fetchall()
    type_spec_dict = {}
    for (name, value) in list(type_specific_count_result):
        type_spec_dict[name] = int(value)
    return http.JsonResponse(type_spec_dict)

def collection_user():
    return http.Http404
