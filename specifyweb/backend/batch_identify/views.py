import json
import re
from collections.abc import Iterable
from collections import Counter
from typing import Any, Literal

from django import http
from django.db import transaction
from django.db.models import IntegerField, Prefetch, Q
from django.db.models.functions import Cast
from django.views.decorators.http import require_POST

from specifyweb.backend.permissions.permissions import check_table_permissions
from specifyweb.specify.api.calculated_fields import calculate_extra_fields
from specifyweb.specify.api.crud import post_resource
from specifyweb.specify.models import Collectionobject, Determination
from specifyweb.specify.views import login_maybe_required, openapi

_RESOURCE_URI_ID_RE = re.compile(r'/(\d+)/?$')
_MAX_RESOLVE_COLLECTION_OBJECTS = 1000
_METADATA_KEYS = {
    'id',
    'resource_uri',
    'recordset_info',
    '_tablename',
    'version',
}

CatalogToken = int | Literal['-']

def _tokenize_catalog_entry(entry: str) -> list[CatalogToken]:
    tokens: list[CatalogToken] = []
    current_number: list[str] = []

    for character in entry:
        if character.isdigit():
            current_number.append(character)
            continue

        if len(current_number) > 0:
            tokens.append(int(''.join(current_number)))
            current_number = []

        if character == '-':
            tokens.append('-')

    if len(current_number) > 0:
        tokens.append(int(''.join(current_number)))

    return tokens

def _parse_catalog_number_ranges(entries: Iterable[str]) -> list[tuple[int, int]]:
    ranges: list[tuple[int, int]] = []

    for raw_entry in entries:
        entry = raw_entry.strip()
        if entry == '':
            continue

        tokens = _tokenize_catalog_entry(entry)
        if not any(isinstance(token, int) for token in tokens):
            continue

        index = 0
        while index < len(tokens):
            token = tokens[index]
            if token == '-':
                index += 1
                continue

            start = token
            end = start
            if (
                index + 2 < len(tokens)
                and tokens[index + 1] == '-'
                and isinstance(tokens[index + 2], int)
            ):
                end = tokens[index + 2]
                index += 3
            else:
                index += 1

            if start > end:
                start, end = end, start
            ranges.append((start, end))

    if len(ranges) == 0:
        raise ValueError('Provide at least one catalog number.')

    return ranges

def _build_catalog_query(ranges: Iterable[tuple[int, int]]) -> Q:
    query = Q()
    for start, end in ranges:
        if start == end:
            query |= Q(catalog_number_int=start)
        else:
            query |= Q(catalog_number_int__gte=start, catalog_number_int__lte=end)
    return query

def _find_unmatched_catalog_numbers(
    ranges: Iterable[tuple[int, int]], matched_catalog_numbers: Iterable[int]
) -> list[str]:
    requested_numbers: set[int] = set()
    for start, end in ranges:
        requested_numbers.update(range(start, end + 1))

    matched_numbers = {
        catalog_number
        for catalog_number in matched_catalog_numbers
        if isinstance(catalog_number, int)
    }

    return sorted(
        (str(number) for number in requested_numbers - matched_numbers), key=int
    )

def _sanitize_determination_payload(payload: dict[str, Any]) -> dict[str, Any]:
    return {
        key: value
        for key, value in payload.items()
        if key.lower() not in _METADATA_KEYS and key.lower() != 'collectionobject'
    }

def _parse_catalog_numbers(request_data: dict[str, Any]) -> list[str]:
    catalog_numbers = request_data.get('catalogNumbers')
    if not isinstance(catalog_numbers, list):
        raise ValueError("'catalogNumbers' must be a list of strings.")
    if not all(isinstance(entry, str) for entry in catalog_numbers):
        raise ValueError("'catalogNumbers' must be a list of strings.")
    return catalog_numbers

def _parse_validate_only(request_data: dict[str, Any]) -> bool:
    validate_only = request_data.get('validateOnly', False)
    if not isinstance(validate_only, bool):
        raise ValueError("'validateOnly' must be a boolean.")
    return validate_only

def _fetch_collection_objects_by_catalog_ranges(
    collection_id: int,
    catalog_ranges: Iterable[tuple[int, int]],
    include_current_determinations: bool = True,
    max_results: int | None = None,
) -> list[Collectionobject]:
    queryset = (
        Collectionobject.objects.filter(collectionmemberid=collection_id)
        .exclude(catalognumber__isnull=True)
        .exclude(catalognumber='')
        .select_related('collectionobjecttype__taxontreedef')
        .annotate(catalog_number_int=Cast('catalognumber', IntegerField()))
        .filter(_build_catalog_query(catalog_ranges))
        .order_by('catalog_number_int', 'id')
    )
    if include_current_determinations:
        queryset = queryset.prefetch_related(
            Prefetch(
                'determinations',
                queryset=Determination.objects.only('id', 'iscurrent'),
                to_attr='prefetched_determinations',
            )
        )
    if isinstance(max_results, int):
        queryset = queryset[:max_results]
    return list(queryset)

def _fetch_matched_catalog_numbers(collection_id: int, catalog_ranges: Iterable[tuple[int, int]]) -> set[int]:
    return {
        catalog_number
        for catalog_number in Collectionobject.objects.filter(
            collectionmemberid=collection_id
        )
        .exclude(catalognumber__isnull=True)
        .exclude(catalognumber='')
        .annotate(catalog_number_int=Cast('catalognumber', IntegerField()))
        .filter(_build_catalog_query(catalog_ranges))
        .values_list('catalog_number_int', flat=True)
        if isinstance(catalog_number, int)
    }

def _extract_current_determination_ids(collection_objects: Iterable[Collectionobject]) -> list[int]:
    current_determination_ids: list[int] = []
    for collection_object in collection_objects:
        determinations = getattr(collection_object, 'prefetched_determinations', [])
        extra = calculate_extra_fields(
            collection_object,
            {
                'determinations': [
                    {
                        'resource_uri': (
                            f"/api/specify/determination/{determination.id}/"
                        ),
                        'iscurrent': determination.iscurrent,
                    }
                    for determination in determinations
                ]
            },
        )
        resource_uri = extra.get('currentdetermination')
        if not isinstance(resource_uri, str):
            continue
        current_determination_match = _RESOURCE_URI_ID_RE.search(resource_uri)
        if current_determination_match is None:
            continue
        current_determination_ids.append(int(current_determination_match.group(1)))
    return current_determination_ids

def _filter_collection_objects_to_majority_type(
    collection_objects: Iterable[Collectionobject],
) -> tuple[list[Collectionobject], list[str]]:
    collection_objects_list = list(collection_objects)
    if len(collection_objects_list) <= 1:
        return collection_objects_list, []

    type_counts = Counter(
        collection_object.collectionobjecttype_id
        for collection_object in collection_objects_list
    )
    majority_type_id = max(type_counts, key=type_counts.get)

    retained_collection_objects: list[Collectionobject] = []
    differing_type_catalog_numbers: list[str] = []
    for collection_object in collection_objects_list:
        if collection_object.collectionobjecttype_id == majority_type_id:
            retained_collection_objects.append(collection_object)
        elif isinstance(collection_object.catalognumber, str):
            differing_type_catalog_numbers.append(collection_object.catalognumber)

    return retained_collection_objects, differing_type_catalog_numbers

def _parse_collection_object_ids(request_data: dict[str, Any]) -> list[int]:
    collection_object_ids = request_data.get('collectionObjectIds')
    if not isinstance(collection_object_ids, list):
        raise ValueError("'collectionObjectIds' must be a list of numbers.")
    if not all(
        isinstance(collection_object_id, int)
        for collection_object_id in collection_object_ids
    ):
        raise ValueError("'collectionObjectIds' must be a list of numbers.")

    deduplicated_ids: list[int] = []
    seen: set[int] = set()
    for collection_object_id in collection_object_ids:
        if collection_object_id <= 0 or collection_object_id in seen:
            continue
        seen.add(collection_object_id)
        deduplicated_ids.append(collection_object_id)

    if len(deduplicated_ids) == 0:
        raise ValueError('Provide at least one collection object ID.')

    return deduplicated_ids

def _resolve_collection_object_taxon_tree_def_id(
    collection_object: Collectionobject,
    fallback_taxon_tree_def_id: int | None,
) -> int | None:
    return (
        collection_object.collectionobjecttype.taxontreedef_id
        if collection_object.collectionobjecttype is not None
        else fallback_taxon_tree_def_id
    )

def _resolve_collection_object_taxon_tree_name(
    collection_object: Collectionobject,
    fallback_taxon_tree_name: str | None,
) -> str | None:
    return (
        collection_object.collectionobjecttype.taxontreedef.name
        if collection_object.collectionobjecttype is not None
        else fallback_taxon_tree_name
    )

def _has_single_effective_collection_object_taxon_tree(
    collection_objects: Iterable[Collectionobject],
    fallback_taxon_tree_def_id: int | None,
) -> bool:
    effective_taxon_tree_def_ids = {
        _resolve_collection_object_taxon_tree_def_id(
            collection_object,
            fallback_taxon_tree_def_id,
        )
        for collection_object in collection_objects
    }
    if len(effective_taxon_tree_def_ids) == 0:
        return True
    if None in effective_taxon_tree_def_ids:
        return False
    return len(effective_taxon_tree_def_ids) == 1

def _build_taxon_tree_groups(
    collection_objects: Iterable[Collectionobject],
    fallback_taxon_tree_def_id: int | None,
    fallback_taxon_tree_name: str | None,
) -> list[dict[str, Any]]:
    grouped: dict[int | None, dict[str, Any]] = {}
    for collection_object in collection_objects:
        tree_def_id = _resolve_collection_object_taxon_tree_def_id(
            collection_object,
            fallback_taxon_tree_def_id,
        )
        tree_name = _resolve_collection_object_taxon_tree_name(
            collection_object,
            fallback_taxon_tree_name,
        )
        group = grouped.setdefault(
            tree_def_id,
            {
                'taxonTreeDefId': tree_def_id,
                'taxonTreeName': tree_name,
                'collectionObjectIds': [],
                'catalogNumbers': [],
                'collectionObjectTypeNames': set(),
            },
        )
        group['collectionObjectIds'].append(collection_object.id)
        if isinstance(collection_object.catalognumber, str):
            group['catalogNumbers'].append(collection_object.catalognumber)

        collection_object_type_name = (
            collection_object.collectionobjecttype.name
            if collection_object.collectionobjecttype is not None
            else None
        )
        if isinstance(collection_object_type_name, str):
            group['collectionObjectTypeNames'].add(collection_object_type_name)
        else:
            group['collectionObjectTypeNames'].add('Default Collection Object Type')

    groups = sorted(
        grouped.values(),
        key=lambda group: (group['taxonTreeName'] is None, group['taxonTreeName'] or ''),
    )
    for group in groups:
        group['collectionObjectIds'] = sorted(group['collectionObjectIds'])
        group['catalogNumbers'] = sorted(group['catalogNumbers'])
        group['collectionObjectTypeNames'] = sorted(group['collectionObjectTypeNames'])
    return groups

@openapi(
    schema={
        'post': {
            'requestBody': {
                'required': True,
                'content': {
                    'application/json': {
                        'schema': {
                            'type': 'object',
                            'properties': {
                                'catalogNumbers': {
                                    'type': 'array',
                                    'items': {'type': 'string'},
                                },
                                'validateOnly': {'type': 'boolean'},
                            },
                            'required': ['catalogNumbers'],
                            'additionalProperties': False,
                        }
                    }
                },
            },
            'responses': {
                '200': {
                    'description': (
                        'Resolved collection objects and validation details for'
                        ' catalog number input.'
                    ),
                    'content': {
                        'application/json': {
                            'schema': {
                                'type': 'object',
                                'properties': {
                                    'collectionObjectIds': {
                                        'type': 'array',
                                        'items': {'type': 'integer'},
                                    },
                                    'currentDeterminationIds': {
                                        'type': 'array',
                                        'items': {'type': 'integer'},
                                    },
                                    'unmatchedCatalogNumbers': {
                                        'type': 'array',
                                        'items': {'type': 'string'},
                                    },
                                    'differingTypeCatalogNumbers': {
                                        'type': 'array',
                                        'items': {'type': 'string'},
                                    },
                                    'hasMixedTaxonTrees': {'type': 'boolean'},
                                    'taxonTreeGroups': {
                                        'type': 'array',
                                        'items': {
                                            'type': 'object',
                                            'properties': {
                                                'taxonTreeDefId': {
                                                    'oneOf': [
                                                        {'type': 'integer'},
                                                        {'type': 'null'},
                                                    ]
                                                },
                                                'taxonTreeName': {
                                                    'oneOf': [
                                                        {'type': 'string'},
                                                        {'type': 'null'},
                                                    ]
                                                },
                                                'collectionObjectIds': {
                                                    'type': 'array',
                                                    'items': {'type': 'integer'},
                                                },
                                                'catalogNumbers': {
                                                    'type': 'array',
                                                    'items': {'type': 'string'},
                                                },
                                                'collectionObjectTypeNames': {
                                                    'type': 'array',
                                                    'items': {'type': 'string'},
                                                },
                                            },
                                            'required': [
                                                'taxonTreeDefId',
                                                'taxonTreeName',
                                                'collectionObjectIds',
                                                'catalogNumbers',
                                                'collectionObjectTypeNames',
                                            ],
                                            'additionalProperties': False,
                                        },
                                    },
                                },
                                'required': [
                                    'collectionObjectIds',
                                    'currentDeterminationIds',
                                    'unmatchedCatalogNumbers',
                                    'differingTypeCatalogNumbers',
                                    'hasMixedTaxonTrees',
                                    'taxonTreeGroups',
                                ],
                                'additionalProperties': False,
                            }
                        }
                    },
                },
                '400': {
                    'description': 'Invalid request payload.',
                    'content': {
                        'application/json': {
                            'schema': {
                                'type': 'object',
                                'properties': {'error': {'type': 'string'}},
                                'required': ['error'],
                                'additionalProperties': False,
                            }
                        }
                    },
                },
            },
        }
    }
)
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
        catalog_numbers = _parse_catalog_numbers(request_data)
        catalog_ranges = _parse_catalog_number_ranges(catalog_numbers)
        validate_only = _parse_validate_only(request_data)
    except ValueError as error:
        return http.JsonResponse({'error': str(error)}, status=400)

    collection_objects = _fetch_collection_objects_by_catalog_ranges(
        request.specify_collection.id,
        catalog_ranges,
        include_current_determinations=not validate_only,
        max_results=_MAX_RESOLVE_COLLECTION_OBJECTS,
    )
    collection_objects, differing_type_catalog_numbers = _filter_collection_objects_to_majority_type(collection_objects)
    has_mixed_taxon_trees = not _has_single_effective_collection_object_taxon_tree(
        collection_objects,
        request.specify_collection.discipline.taxontreedef_id,
    )
    taxon_tree_groups = _build_taxon_tree_groups(
        collection_objects,
        request.specify_collection.discipline.taxontreedef_id,
        (
            request.specify_collection.discipline.taxontreedef.name
            if request.specify_collection.discipline.taxontreedef is not None
            else None
        ),
    )
    matched_catalog_numbers = _fetch_matched_catalog_numbers(
        request.specify_collection.id, catalog_ranges
    )

    collection_object_ids = [
        collection_object.id for collection_object in collection_objects
    ]
    current_determination_ids = (
        _extract_current_determination_ids(collection_objects)
        if not validate_only
        else []
    )
    unmatched_catalog_numbers = _find_unmatched_catalog_numbers(
        catalog_ranges, matched_catalog_numbers
    )
    return http.JsonResponse(
        {
            'collectionObjectIds': collection_object_ids,
            'currentDeterminationIds': current_determination_ids,
            'unmatchedCatalogNumbers': unmatched_catalog_numbers,
            'differingTypeCatalogNumbers': differing_type_catalog_numbers,
            'hasMixedTaxonTrees': has_mixed_taxon_trees,
            'taxonTreeGroups': taxon_tree_groups,
        }
    )

@openapi(
    schema={
        'post': {
            'requestBody': {
                'required': True,
                'content': {
                    'application/json': {
                        'schema': {
                            'type': 'object',
                            'properties': {
                                'collectionObjectIds': {
                                    'type': 'array',
                                    'items': {'type': 'integer'},
                                },
                                'determination': {
                                    'type': 'object',
                                    'additionalProperties': True,
                                },
                            },
                            'required': ['collectionObjectIds', 'determination'],
                            'additionalProperties': False,
                        }
                    }
                },
            },
            'responses': {
                '200': {
                    'description': (
                        'Created determination records for all selected collection'
                        ' objects.'
                    ),
                    'content': {
                        'application/json': {
                            'schema': {
                                'type': 'object',
                                'properties': {
                                    'createdCount': {'type': 'integer'},
                                    'collectionObjectIds': {
                                        'type': 'array',
                                        'items': {'type': 'integer'},
                                    },
                                    'determinationIds': {
                                        'type': 'array',
                                        'items': {'type': 'integer'},
                                    },
                                },
                                'required': [
                                    'createdCount',
                                    'collectionObjectIds',
                                    'determinationIds',
                                ],
                                'additionalProperties': False,
                            }
                        }
                    },
                },
                '400': {
                    'description': 'Invalid request payload.',
                    'content': {
                        'application/json': {
                            'schema': {
                                'type': 'object',
                                'properties': {'error': {'type': 'string'}},
                                'required': ['error'],
                                'additionalProperties': False,
                            }
                        }
                    },
                },
            },
        }
    }
)
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
        collection_object_ids = _parse_collection_object_ids(request_data)
    except ValueError as error:
        return http.JsonResponse({'error': str(error)}, status=400)

    determination_payload = request_data.get('determination')
    if not isinstance(determination_payload, dict):
        return http.JsonResponse(
            {'error': "'determination' must be an object."}, status=400
        )

    collection_objects = list(
        Collectionobject.objects.filter(
            collectionmemberid=request.specify_collection.id,
            id__in=collection_object_ids,
        ).select_related('collectionobjecttype__taxontreedef')
    )
    existing_collection_object_ids = {
        collection_object.id for collection_object in collection_objects
    }
    missing_collection_object_ids = [
        collection_object_id
        for collection_object_id in collection_object_ids
        if collection_object_id not in existing_collection_object_ids
    ]
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

    collection_objects, _ = _filter_collection_objects_to_majority_type(collection_objects)
    collection_object_ids = [collection_object.id for collection_object in collection_objects]

    if not _has_single_effective_collection_object_taxon_tree(
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

    cleaned_payload = _sanitize_determination_payload(determination_payload)
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
