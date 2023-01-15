from django import http
from specifyweb.specify.views import openapi
from django.http import HttpResponse
from . import utils

from specifyweb.specify.views import login_maybe_required
import logging

logger = logging.getLogger(__name__)
from django.db import connection
from time import perf_counter

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
                                'familiesRepresented': {
                                    'type': 'integer'
                                },
                                'generaRepresented': {
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
    t1 = perf_counter()
    holding_dict = {
        'familiesRepresented':  utils.get_tree_rank_stats(140, request), #families
        'generaRepresented': utils.get_tree_rank_stats(180, request), #genera
        'speciesRepresented': utils.get_tree_rank_stats(220, request) #species
    }
    t2 = perf_counter()
    logger.warning('this took: ')
    logger.warning(t2-t1)
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

def node_number_rework(request) -> HttpResponse:
    cursor = connection.cursor()
    utils.node_number_rework_test(request)
    full_name = ''

    cursor.execute(
        """
        SELECT distinct t.taxonid, nodenumber, highestchildnodenumber
        FROM 
        """
    )

