import json
from django import http
from specifyweb.specify.views import openapi
from django.http import HttpResponse

from sqlalchemy.sql.expression import func, distinct

from specifyweb.specify.views import login_maybe_required
from specifyweb.specify.api import toJson
from specifyweb.context import app_resource
# from specifyweb.stored_queries.models import Determination, Taxon
import logging

logger = logging.getLogger(__name__)
from django.db import connection


@openapi(schema={
    'get': {
        'responses': {
            '200': {
                'description': 'Returns Global Collection Stats for Specify that backend delivers',
                'content': {
                    'application/json': {
                        'schema': {
                            'type': 'object',
                            'properties': {
                                'holdings': {
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
                                },
                                'preparation': {
                                    'type': 'object',
                                    'additionalProperties': True,
                                },
                                'typeSpecimen': {
                                    'type': 'object',
                                    'additionalProperties': True,
                                },
                                'localityGeography': {
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
                },
            }
        }
    }}, )
def collection_global(request) -> http.HttpResponse:
    cursor = connection.cursor()
    # Holdings
    # Families
    holding_dict = {}
    cursor.execute("""
    SELECT count(*) FROM (SELECT DISTINCT tx.TaxonID FROM (SELECT DISTINCT tax.TaxonID,tax.nodenumber FROM (SELECT TaxonID FROM determination WHERE CollectionMemberID = %s AND determination.IsCurrent = true) as Families1,taxon as tax WHERE tax.isaccepted <> 0 and tax.TaxonID = Families1.TaxonID) as Families2, taxon as tx WHERE tx.rankid = 140 and Families2.nodenumber between tx.nodenumber and tx.HighestChildNodeNumber) as Familes3
                  """, [request.specify_collection.id])
    holding_dict['familiesRepresented'] = int(cursor.fetchone()[0])

    # Genera represented
    cursor.execute("""
       SELECT count(DISTINCT tx.TaxonID) FROM (SELECT DISTINCT tax.TaxonID,tax.nodenumber FROM (SELECT TaxonID FROM determination WHERE CollectionMemberID = %s AND determination.IsCurrent <> 0) as Genera1,taxon as tax WHERE tax.isaccepted <> 0 and tax.TaxonID = Genera1.TaxonID) as Genera2, taxon as tx WHERE tx.rankid = 180 and Genera2.nodenumber between tx.nodenumber and tx.HighestChildNodeNumber""",
                   [request.specify_collection.id])
    holding_dict['generaRepresented'] = int(cursor.fetchone()[0])

    # UNQ_SPEC
    cursor.execute("""
       SELECT count(DISTINCT tx.TaxonID) FROM (SELECT DISTINCT tax.TaxonID,tax.nodenumber FROM (SELECT TaxonID FROM determination WHERE CollectionMemberID = %s AND determination.IsCurrent <> 0) as Genera1,taxon as tax WHERE tax.isaccepted <> 0 and tax.TaxonID = Genera1.TaxonID) as Genera2, taxon as tx WHERE tx.rankid = 220 and Genera2.nodenumber between tx.nodenumber and tx.HighestChildNodeNumber"""
                   , [request.specify_collection.id])
    holding_dict['speciesRepresented'] = int(cursor.fetchone()[0])

    # PREP_BY_TYPE_LOTS
    cursor.execute("""
       SELECT pt.Name, trim(cast(concat(count(PreparationID), ' / ',  sum(countAmt)) as char(50))) FROM preparation p INNER JOIN preptype pt ON pt.PrepTypeID = p.PrepTypeID  WHERE CollectionMemberID = %s group by pt.Name""",
                   [request.specify_collection.id])
    prepbytypelots_result = cursor.fetchall()

    preptypelotstotal_dict = {}
    for preptype_stat in list(prepbytypelots_result):
        lots_total_arr = preptype_stat[1].split(' / ')
        preptypelotstotal_dict[preptype_stat[0]] = {
            'lots': int(lots_total_arr[0]),
            'total': int(lots_total_arr[1])
        }

    ####LOC_GEO

    # COUNTRIES
    geography_dict = {}
    cursor.execute("""
       SELECT count(Name) FROM (SELECT DISTINCT Name FROM (SELECT g.GeographyID,g.nodenumber FROM locality as l inner join geography as g on l.GeographyID = g.GeographyID) as GEO, geography as g WHERE g.rankid = 200 and GEO.nodenumber between g.nodenumber and g.HighestChildNodeNumber) As GEO2""")
    geography_dict['countries'] = int((cursor.fetchone()[0]))

    # TYPE_SPEC_CNT
    cursor.execute("""
           SELECT TypeStatusName, count(DeterminationID) AS DeterminationCount FROM determination WHERE CollectionMemberID = %s AND TypeStatusName is not null group by TypeStatusName""",
                   [request.specify_collection.id])
    type_specific_count_result = cursor.fetchall()
    type_spec_dict = {}
    for type_spec_stat in list(type_specific_count_result):
        type_spec_dict[type_spec_stat[0]] = int(type_spec_stat[1])

    return_dict = {'holdings': holding_dict,
                   'preparation': preptypelotstotal_dict,
                   'typeSpecimen': type_spec_dict,
                   'localityGeography': geography_dict}
    return http.JsonResponse(return_dict)


def collection_user():
    return 'r'
