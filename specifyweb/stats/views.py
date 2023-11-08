from django import http

from specifyweb.permissions.permissions import check_table_permissions
from specifyweb.specify.views import openapi
from django.http import HttpResponse, Http404

from ..specify.models import Preparation, Determination, Discipline, Locality, Collectionobject, Collectionobjectattachment, Attachment
from specifyweb.specify.views import login_maybe_required
import logging

logger = logging.getLogger(__name__)
from django.db import connection

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
def collection_locality_geography(request, stat) -> HttpResponse:
    geography_dict = {}
    if stat == 'percentGeoReferenced':
        geography_dict[stat] = get_percent_georeferenced(request)
    else:
        raise Http404
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
    check_table_permissions(request.specify_collection, request.specify_user,
                            Determination, "read")
    cursor = connection.cursor()
    # TYPE_SPEC_CNT
    cursor.execute(
        """
        SELECT TypeStatusName, count(DeterminationID) AS DeterminationCount
        FROM determination
        WHERE CollectionMemberID = %s
          AND TypeStatusName is not null
          AND IsCurrent
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

def get_percent_georeferenced(request):
    check_table_permissions(request.specify_collection, request.specify_user,
                            Discipline, "read")
    check_table_permissions(request.specify_collection, request.specify_user,
                            Locality, "read")
    cursor = connection.cursor()
    cursor.execute("""
       SELECT CASE WHEN 
       (SELECT count(*) FROM locality
        JOIN discipline ON 
        locality.DisciplineID = discipline.DisciplineID 
        WHERE discipline.DisciplineID = %s) = 0 THEN 0 
        ELSE ((count(localityid) * 1.0) / 
        ((SELECT count(*) FROM locality) * 1.0)) * 100.0 
        END AS PercentGeoReferencedLocalities FROM locality WHERE not latitude1 is null""",
                   [request.specify_collection.discipline.id])
    percent_georeferenced = round(cursor.fetchone()[0],2)
    return percent_georeferenced

@login_maybe_required
@openapi(schema={
    'get': {
        'responses': {
            '200': {
                'description': 'Returns Attachment Stats for Specify',
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
def collection_attachments(request, stat)->HttpResponse:
    attachments_dict = {}
    if stat == 'percentCoImaged':
        attachments_dict[stat] = get_percent_imaged(request)
    else:
        raise Http404
    return http.JsonResponse(attachments_dict)

def get_percent_imaged(request):
    check_table_permissions(request.specify_collection, request.specify_user, Collectionobject, "read")
    check_table_permissions(request.specify_collection, request.specify_user, Collectionobjectattachment, "read")
    check_table_permissions(request.specify_collection, request.specify_user, Attachment, "read")
    cursor = connection.cursor()
    cursor.execute("""select 
	100.0*(select count(distinct(co.collectionobjectid)) 
    as co_count from   collectionobject co join collectionobjectattachment using (collectionobjectid) 
    join attachment using (attachmentid) where attachment.mimetype regexp 'image' and co.collectionid = %(coid)s         
    and collectionobjectattachment.collectionmemberid = %(coid)s) / (select greatest(sub.co_count, 1) from 
    (select count(*) as co_count from collectionobject co where co.CollectionID = %(coid)s) as sub) as percent_imaged""", {"coid": request.specify_collection.id})
    percent_imaged = round(cursor.fetchone()[0], 2)
    return percent_imaged