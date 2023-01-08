import json
from django import http
from specifyweb.specify.views import openapi
from django.http import HttpResponse
from . import utils
from . import utils_temp

from sqlalchemy.sql.expression import func, distinct

from specifyweb.specify.views import login_maybe_required
import logging

logger = logging.getLogger(__name__)
from django.db import connection
from time import perf_counter


def perf_time_wrapper(function_to_run, message):
    t1 = perf_counter()
    value_to_return = function_to_run()
    t2 = perf_counter()
    logger.warning(message)
    logger.warning(t2-t1)
    return value_to_return

@login_maybe_required
@openapi(schema={
    'get': {
        'responses': {
            '200': {
                'description': 'Returns Global Collection Holding Stats for Specify',
                'content': {
                    'application/json': {
                        'schema': {
                            'type': 'object',
                            'properties': {
                                'familieRepresented': {
                                    'type': 'integer'
                                },
                                'generRepresented': {
                                    'type': 'integer'
                                },
                                'speciesRepresented': {
                                    'type': 'integer'
                                }
                            }
                        }
                    }
                }
            }
        }
    }}, )
def collection_holdings(request) -> HttpResponse:
    cursor = connection.cursor()
    cursor.execute("""
    SELECT distinct(taxon.nodenumber)
        FROM determination join taxon using (taxonid)
        WHERE CollectionMemberID = % s
        AND determination.IsCurrent = true and taxon.IsAccepted <> 0 and taxon.rankid >= 180
    """, [request.specify_collection.id])
    all_node_numbers_used = [x[0] for x in list(cursor.fetchall())]
    all_node_numbers_used.sort()
   # logger.warning(all_node_numbers_used)
    # Holdings
    # Families
    holding_dict = {}
   # family_count = utils.count_occurrence_ranks(all_families, all_node_numbers_used)
    holding_dict['familiesRepresented'] = 0
    cursor.execute("""
    select nodeNumber, highestChildNodeNumber from taxon where rankid = 180
    """)
    all_genera = list(cursor.fetchall())
    all_genera.sort()
    #logger.warning(all_genera)
    genera_count_optimized = perf_time_wrapper(lambda: utils_temp.ddoc(all_genera, all_node_numbers_used), 'optimized version took: ')
    logger.warning('genera count optimized: ')
    logger.warning(genera_count_optimized[0])
    genera_count = perf_time_wrapper(lambda : utils.count_occurrence_ranks(all_genera, all_node_numbers_used), 'non optimized took: ')
    logger.warning('normal genera count: ')
    #logger.warning(len(genera_count[1]))
    logger.warning(genera_count[0])
    holding_dict['generaRepresented'] = genera_count[0]
    # Genera represented
    holding_dict['speciesRepresented'] = 0
    return http.JsonResponse(holding_dict)

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
    geography_dict = {}
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
    return http.JsonResponse(geography_dict)

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
