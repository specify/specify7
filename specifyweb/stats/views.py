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

rank_item_arr = [10, 30, 60, 100, 140, 180, 220, 230]
taxon_tree_def_item_arr = [2, 3, 6, 10, 11, 12, 13, 14]
def construct_taxon_dict(taxon_array):
    return {'name': taxon_array[0],
            'guid': taxon_array[1],
            'author': taxon_array[2],
            'common_name': taxon_array[3],
            'remarks': taxon_array[4],
            'source': taxon_array[5]
            }
def construct_taxon_array(taxon_array):
    return [construct_taxon_dict(taxon_array[index: index+6]) for index in range(0, 48, 6)]

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
                (TimestampCreated,  text3, commonname, guid, IsAccepted, IsHybrid, name, rankid, remarks, text4, taxontreedefitemid, taxontreedefid, parentid)
                values(now(), {author}, {common_name}, {guid}, 1, 0, {name}, {rankid}, {remarks}, {source}, {ttdefitemid}, 1, {parentid});""".format(
                name=wrap_in_null(id['name']),
                guid=wrap_in_null(id['guid']),
                author=wrap_in_null(id['author']),
                common_name=wrap_in_null(id['common_name']),
                remarks=wrap_in_null(id['remarks']),
                source=wrap_in_null(id['source']),
                rankid=rank_item_arr[updating_index],
                parentid=parent_id if parent_id is not None else 'null',
                ttdefitemid=taxon_tree_def_item_arr[updating_index]
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
    check_table_permissions(request.specify_collection, request.specify_user, Preparation, "read")
    renumber_tree('taxon')
    set_fullnames('taxon', 1, 14)
    cursor = connection.cursor()
    # PREP_BY_TYPE_LOTS
    cursor.execute(
        """
        SELECT pt.Name, count(PreparationID), if(sum(countAmt) is null, 0, sum(countAmt))
        FROM preparation p
                 INNER JOIN preptype pt ON pt.PrepTypeID = p.PrepTypeID
        WHERE CollectionMemberID = %s
        group by pt.Name
        """,
        [request.specify_collection.id]
    )
    prepbytypelots_result = cursor.fetchall()
    preptypelotstotal_dict = {}
    for (name, lots, total) in list(prepbytypelots_result):
        preptypelotstotal_dict[name] = {
            'lots': int(lots),
            'total': int(total)
        }
    return http.JsonResponse(preptypelotstotal_dict)


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
    previous_row_init = [None for c in range(48)]
    previous_row = construct_taxon_array(previous_row_init)
    cursor.execute(
        """
        SELECT 
        kingdom, kingdom_guid, kingdom_author, kingdom_common_name, kingdom_remarks, kingdom_source,
        phylum, phylum_guid, phylum_author, phylum_common_name, phylum_remarks, phylum_source,
        class, class_guid, class_author, class_common_name, class_remarks, class_source,
        order_, order_guid, order_author, order_common_name, order_remarks, order_source, 
        family, family_guid, family_author, family_common_name, family_remarks, family_source,
        genus, genus_guid, genus_author, genus_common_name, genus_remarks, genus_source,
        species, species_guid, species_author, species_common_name, species_remarks, species_source,
        subspecies, subspecies_guid, subspecies_author, subspecies_common_name, subspecies_remarks, subspecies_source
        FROM full_taxon_to_import_guid_new; 
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
