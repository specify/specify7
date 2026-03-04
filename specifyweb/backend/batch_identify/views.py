import json

from django import http
from django.db import transaction
from django.views.decorators.http import require_POST

from specifyweb.backend.permissions.permissions import check_table_permissions
from specifyweb.specify.api.crud import post_resource
from specifyweb.specify.models import Collectionobject, Determination
from specifyweb.specify.views import login_maybe_required, openapi

from .view_helpers import (
    MAX_RESOLVE_COLLECTION_OBJECTS,
    build_taxon_tree_groups,
    extract_current_determination_ids,
    fetch_collection_objects_by_catalog_requests,
    fetch_collection_objects_by_ids,
    fetch_matched_catalog_number_identifiers,
    find_unmatched_catalog_numbers,
    has_single_effective_collection_object_taxon_tree,
    parse_catalog_number_requests,
    parse_catalog_numbers,
    parse_collection_object_ids,
    parse_validate_only,
    sanitize_determination_payload,
)
from .api_schemas import (
    BATCH_IDENTIFY_OPENAPI_SCHEMA,
    BATCH_IDENTIFY_RESOLVE_OPENAPI_SCHEMA,
    BATCH_IDENTIFY_VALIDATE_RECORD_SET_OPENAPI_SCHEMA,
)

@openapi(schema=BATCH_IDENTIFY_VALIDATE_RECORD_SET_OPENAPI_SCHEMA)
@login_maybe_required
@require_POST
def batch_identify_validate_record_set(request: http.HttpRequest):
    check_table_permissions(
        request.specify_collection, request.specify_user, Collectionobject, 'read'
    )

    try:
        request_data = json.loads(request.body)
    except json.JSONDecodeError:
        return http.JsonResponse({'error': 'Invalid JSON body.'}, status=400)

    try:
        collection_object_ids = parse_collection_object_ids(request_data)
    except ValueError as error:
        return http.JsonResponse({'error': str(error)}, status=400)

    collection_objects, missing_collection_object_ids = fetch_collection_objects_by_ids(
        request.specify_collection.id,
        collection_object_ids,
        order_by_id=True,
    )
    if len(missing_collection_object_ids) > 0:
        return http.JsonResponse(
            {
                'error': (
                    'One or more collection object IDs do not exist or are not in'
                    ' the active collection.'
                )
            },
            status=400,
        )

    has_mixed_taxon_trees = not has_single_effective_collection_object_taxon_tree(
        collection_objects,
        request.specify_collection.discipline.taxontreedef_id,
    )
    taxon_tree_groups = build_taxon_tree_groups(
        collection_objects,
        request.specify_collection.discipline.taxontreedef_id,
        (
            request.specify_collection.discipline.taxontreedef.name
            if request.specify_collection.discipline.taxontreedef is not None
            else None
        ),
    )

    return http.JsonResponse(
        {
            'collectionObjectIds': [collection_object.id for collection_object in collection_objects],
            'hasMixedTaxonTrees': has_mixed_taxon_trees,
            'taxonTreeGroups': taxon_tree_groups,
        }
    )

@openapi(schema=BATCH_IDENTIFY_RESOLVE_OPENAPI_SCHEMA)
@login_maybe_required
@require_POST
def batch_identify_resolve(request: http.HttpRequest):
    check_table_permissions(
        request.specify_collection, request.specify_user, Collectionobject, 'read'
    )

    try:
        request_data = json.loads(request.body)
    except json.JSONDecodeError:
        return http.JsonResponse({'error': 'Invalid JSON body.'}, status=400)

    try:
        catalog_numbers = parse_catalog_numbers(request_data)
        numeric_ranges, year_based_ranges = parse_catalog_number_requests(catalog_numbers)
        validate_only = parse_validate_only(request_data)
    except ValueError as error:
        return http.JsonResponse({'error': str(error)}, status=400)

    collection_objects = fetch_collection_objects_by_catalog_requests(
        request.specify_collection.id,
        numeric_ranges,
        year_based_ranges,
        include_current_determinations=not validate_only,
        max_results=MAX_RESOLVE_COLLECTION_OBJECTS,
    )
    has_mixed_taxon_trees = not has_single_effective_collection_object_taxon_tree(
        collection_objects,
        request.specify_collection.discipline.taxontreedef_id,
    )
    taxon_tree_groups = build_taxon_tree_groups(
        collection_objects,
        request.specify_collection.discipline.taxontreedef_id,
        (
            request.specify_collection.discipline.taxontreedef.name
            if request.specify_collection.discipline.taxontreedef is not None
            else None
        ),
    )
    
    matched_catalog_numbers, matched_year_based_catalog_numbers = fetch_matched_catalog_number_identifiers(
        request.specify_collection.id,
        numeric_ranges,
        year_based_ranges,
    )

    collection_object_ids = [collection_object.id for collection_object in collection_objects]
    current_determination_ids = (
        extract_current_determination_ids(collection_objects)
        if not validate_only
        else []
    )
    unmatched_catalog_numbers = find_unmatched_catalog_numbers(
        numeric_ranges,
        year_based_ranges,
        matched_catalog_numbers,
        matched_year_based_catalog_numbers,
    )
    return http.JsonResponse(
        {
            'collectionObjectIds': collection_object_ids,
            'currentDeterminationIds': current_determination_ids,
            'unmatchedCatalogNumbers': unmatched_catalog_numbers,
            'hasMixedTaxonTrees': has_mixed_taxon_trees,
            'taxonTreeGroups': taxon_tree_groups,
        }
    )

@openapi(schema=BATCH_IDENTIFY_OPENAPI_SCHEMA)
@login_maybe_required
@require_POST
@transaction.atomic
def batch_identify(request: http.HttpRequest):
    check_table_permissions(
        request.specify_collection, request.specify_user, Collectionobject, 'read'
    )
    check_table_permissions(
        request.specify_collection, request.specify_user, Determination, 'create'
    )

    try:
        request_data = json.loads(request.body)
    except json.JSONDecodeError:
        return http.JsonResponse({'error': 'Invalid JSON body.'}, status=400)

    try:
        collection_object_ids = parse_collection_object_ids(request_data)
    except ValueError as error:
        return http.JsonResponse({'error': str(error)}, status=400)

    determination_payload = request_data.get('determination')
    if not isinstance(determination_payload, dict):
        return http.JsonResponse(
            {'error': "'determination' must be an object."}, status=400
        )

    collection_objects, missing_collection_object_ids = fetch_collection_objects_by_ids(
        request.specify_collection.id,
        collection_object_ids,
    )
    if len(missing_collection_object_ids) > 0:
        return http.JsonResponse(
            {
                'error': (
                    'One or more collection object IDs do not exist or are not in'
                    ' the active collection.'
                )
            },
            status=400,
        )

    if not has_single_effective_collection_object_taxon_tree(
        collection_objects,
        request.specify_collection.discipline.taxontreedef_id,
    ):
        return http.JsonResponse(
            {
                'error': (
                    'Selected collection objects must all use collection object'
                    ' types in the same taxon tree, or all default to the'
                    " discipline's taxon tree."
                )
            },
            status=400,
        )

    cleaned_payload = sanitize_determination_payload(determination_payload)
    mark_as_current = cleaned_payload.get('isCurrent') is True
    if mark_as_current:
        check_table_permissions(
            request.specify_collection, request.specify_user, Determination, 'update'
        )

    determination_ids: list[int] = []
    for collection_object_id in collection_object_ids:
        if mark_as_current:
            Determination.objects.filter(
                collectionmemberid=request.specify_collection.id,
                collectionobject_id=collection_object_id,
                iscurrent=True,
            ).update(iscurrent=False)

        determination = post_resource(
            request.specify_collection,
            request.specify_user_agent,
            'determination',
            {
                **cleaned_payload,
                'collectionobject': (
                    f"/api/specify/collectionobject/{collection_object_id}/"
                ),
            },
        )
        determination_ids.append(determination.id)

    return http.JsonResponse(
        {
            'createdCount': len(determination_ids),
            'collectionObjectIds': collection_object_ids,
            'determinationIds': determination_ids,
        }
    )
