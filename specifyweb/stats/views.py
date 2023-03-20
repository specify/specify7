from django import http

from specifyweb.permissions.permissions import check_table_permissions
from specifyweb.specify.views import openapi
from django.http import HttpResponse
from ..specify.models import Preparation, Determination
from specifyweb.specify.views import login_maybe_required
import logging

logger = logging.getLogger(__name__)
from django.db import connection

def import_taxon(current_taxon_row, previous_taxon_row):
    for rank_index in range(len(current_taxon_row)):
        if not (current_taxon_row[rank_index] == previous_taxon_row[rank_index]['name']):
            return insert_taxon_row(current_taxon_row, rank_index, previous_taxon_row[0:rank_index])
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
        previous_taxon_to_return.append({
            'name': previous_parents[index]['name'],
            'id': previous_parents[index]['id']
        }
        )

    for updating_index in range(rank_index, len(taxon_row_to_insert)):
        updating_taxon = taxon_row_to_insert[updating_index]
        new_parent_id = update_id(updating_taxon, running_parent_id,
                                  updating_index)
        previous_taxon_to_return.append(
            {
                'name': updating_taxon,
                'id': new_parent_id
            }
        )
        running_parent_id = coalesce(running_parent_id, new_parent_id)
    return previous_taxon_to_return


def update_id(id, parent_id, updating_index):
    if id is None:
        return None
    cursor = connection.cursor()
    sql_str = """insert into fake_taxon (name_, rankid, parentid) values('{n}', {rid}, {pid});""".format(n=id,
                rid=updating_index,
                pid="null" if parent_id is None else parent_id)
    logger.warning(sql_str)
    cursor.execute(sql_str)
    cursor.execute(
        """select max(faketaxonid) from fake_taxon"""
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
    cursor = connection.cursor()
    # PREP_BY_TYPE_LOTS
    cursor.execute(
        """
        SELECT pt.Name, count(PreparationID), if(sum(countAmt) is null, 0, sum(countAmt))
        FROM preparation p
                 INNER JOIN preptype pt ON pt.PrepTypeID = p.PrepTypeID
        WHERE CollectionMemberID = % s
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
    previous_row = [{'name': None, 'id': 1} for c in range(8)]
    cursor.execute(
        """
        SELECT kingdom, phylum, class, order_, family, genus, species, subspecies from taxon_to_import; 
        """
    )
    taxon_to_import = list(cursor.fetchall())


    for taxon_counter in range(len(taxon_to_import)):
        if taxon_counter % 100 == 0:
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
