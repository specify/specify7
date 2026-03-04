import re
from collections.abc import Iterable
from typing import Any, Literal

from django.db.models import IntegerField, Prefetch, Q
from django.db.models.functions import Cast, Right, Substr

from specifyweb.specify.api.calculated_fields import calculate_extra_fields
from specifyweb.specify.models import Collectionobject, Determination

_RESOURCE_URI_ID_RE = re.compile(r'/(\d+)/?$')
_YEAR_CATALOG_NUMBER_DELIMITERS = '-/|._:; *$%#@'
_YEAR_CATALOG_NUMBER_DELIMITER_CLASS = re.escape(_YEAR_CATALOG_NUMBER_DELIMITERS)
_STORED_YEAR_CATALOG_NUMBER_RE = re.compile(
    rf'^(?P<year>\d{{4}})[{_YEAR_CATALOG_NUMBER_DELIMITER_CLASS}]+(?P<number>\d{{6}})$'
)
_ENTRY_YEAR_CATALOG_NUMBER_RE = re.compile(
    rf'(?<!\d)(?P<year>\d{{4}})[{_YEAR_CATALOG_NUMBER_DELIMITER_CLASS}]+(?P<number>\d{{6}})(?!\d)'
)
MAX_RESOLVE_COLLECTION_OBJECTS = 1000
_NUMERIC_CATALOG_NUMBER_QUERY_REGEX = r'^[0-9]+$'
_YEAR_BASED_CATALOG_NUMBER_QUERY_REGEX = (
    rf'^[0-9]{{4}}[{_YEAR_CATALOG_NUMBER_DELIMITER_CLASS}]+[0-9]{{6}}$'
)
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

def parse_catalog_number_requests(
    entries: Iterable[str],
) -> tuple[list[tuple[int, int]], dict[int, list[tuple[int, int]]]]:
    numeric_ranges: list[tuple[int, int]] = []
    year_based_ranges: dict[int, list[tuple[int, int]]] = {}

    for raw_entry in entries:
        entry = raw_entry.strip()
        if entry == '':
            continue

        year_matches = list(_ENTRY_YEAR_CATALOG_NUMBER_RE.finditer(entry))
        if len(year_matches) > 0:
            index = 0
            while index < len(year_matches):
                current_match = year_matches[index]
                year = int(current_match.group('year'))
                start = int(current_match.group('number'))
                end = start

                if index + 1 < len(year_matches):
                    next_match = year_matches[index + 1]
                    if (
                        int(next_match.group('year')) == year
                        and '-' in entry[current_match.end() : next_match.start()]
                    ):
                        end = int(next_match.group('number'))
                        index += 1

                if start > end:
                    start, end = end, start
                year_based_ranges.setdefault(year, []).append((start, end))
                index += 1

        entry_segments: list[str] = []
        cursor = 0
        for match in year_matches:
            entry_segments.append(entry[cursor : match.start()])
            entry_segments.append(' ' * (match.end() - match.start()))
            cursor = match.end()
        entry_segments.append(entry[cursor:])

        numeric_entry = ''.join(entry_segments)
        tokens = _tokenize_catalog_entry(numeric_entry)
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
            numeric_ranges.append((start, end))

    if len(numeric_ranges) == 0 and len(year_based_ranges) == 0:
        raise ValueError('Provide at least one catalog number.')

    return numeric_ranges, year_based_ranges

def _build_catalog_query(ranges: Iterable[tuple[int, int]]) -> Q:
    query = Q()
    for start, end in ranges:
        if start == end:
            query |= Q(
                catalognumber__regex=_NUMERIC_CATALOG_NUMBER_QUERY_REGEX,
                catalog_number_int=start,
            )
        else:
            query |= Q(
                catalognumber__regex=_NUMERIC_CATALOG_NUMBER_QUERY_REGEX,
                catalog_number_int__gte=start,
                catalog_number_int__lte=end,
            )
    return query

def _build_year_based_catalog_query(year_based_ranges: dict[int, list[tuple[int, int]]]) -> Q:
    query = Q()
    for year, ranges in year_based_ranges.items():
        sequence_query = Q()
        for start, end in ranges:
            if start == end:
                sequence_query |= Q(catalog_sequence_int=start)
            else:
                sequence_query |= Q(
                    catalog_sequence_int__gte=start, catalog_sequence_int__lte=end
                )
        query |= (
            Q(
                catalognumber__regex=_YEAR_BASED_CATALOG_NUMBER_QUERY_REGEX,
                catalog_year_int=year,
            )
            & sequence_query
        )
    return query

def _build_catalog_number_query(
    numeric_ranges: list[tuple[int, int]],
    year_based_ranges: dict[int, list[tuple[int, int]]],
) -> Q:
    query = Q()
    if len(numeric_ranges) > 0:
        query |= _build_catalog_query(numeric_ranges)
    if len(year_based_ranges) > 0:
        query |= _build_year_based_catalog_query(year_based_ranges)
    return query

def find_unmatched_catalog_numbers(
    numeric_ranges: Iterable[tuple[int, int]],
    year_based_ranges: dict[int, list[tuple[int, int]]],
    matched_catalog_numbers: set[int],
    matched_year_based_catalog_numbers: set[tuple[int, int]],
) -> list[str]:
    requested_numbers: set[int] = set()
    for start, end in numeric_ranges:
        requested_numbers.update(range(start, end + 1))

    requested_year_based_numbers: set[tuple[int, int]] = set()
    for year, ranges in year_based_ranges.items():
        for start, end in ranges:
            requested_year_based_numbers.update(
                (year, number) for number in range(start, end + 1)
            )

    unmatched_numeric_numbers = sorted(
        requested_numbers - matched_catalog_numbers,
        key=int,
    )
    unmatched_year_based_numbers = sorted(
        requested_year_based_numbers - matched_year_based_catalog_numbers
    )

    return [
        *(str(number) for number in unmatched_numeric_numbers),
        *(
            f'{year:04d}-{number:06d}'
            for year, number in unmatched_year_based_numbers
        ),
    ]

def sanitize_determination_payload(payload: dict[str, Any]) -> dict[str, Any]:
    return {
        key: value
        for key, value in payload.items()
        if key.lower() not in _METADATA_KEYS and key.lower() != 'collectionobject'
    }

def parse_catalog_numbers(request_data: dict[str, Any]) -> list[str]:
    catalog_numbers = request_data.get('catalogNumbers')
    if not isinstance(catalog_numbers, list):
        raise ValueError("'catalogNumbers' must be a list of strings.")
    if not all(isinstance(entry, str) for entry in catalog_numbers):
        raise ValueError("'catalogNumbers' must be a list of strings.")
    return catalog_numbers

def parse_validate_only(request_data: dict[str, Any]) -> bool:
    validate_only = request_data.get('validateOnly', False)
    if not isinstance(validate_only, bool):
        raise ValueError("'validateOnly' must be a boolean.")
    return validate_only

def fetch_collection_objects_by_catalog_requests(
    collection_id: int,
    numeric_ranges: list[tuple[int, int]],
    year_based_ranges: dict[int, list[tuple[int, int]]],
    include_current_determinations: bool = True,
    max_results: int | None = None,
) -> list[Collectionobject]:
    queryset = (
        Collectionobject.objects.filter(collectionmemberid=collection_id)
        .exclude(catalognumber__isnull=True)
        .exclude(catalognumber='')
        .select_related('collectionobjecttype__taxontreedef')
    )
    if len(numeric_ranges) > 0:
        queryset = queryset.annotate(catalog_number_int=Cast('catalognumber', IntegerField()))
    if len(year_based_ranges) > 0:
        queryset = queryset.annotate(
            catalog_year_int=Cast(Substr('catalognumber', 1, 4), IntegerField()),
            catalog_sequence_int=Cast(Right('catalognumber', 6), IntegerField()),
        )
    queryset = queryset.filter(
        _build_catalog_number_query(numeric_ranges, year_based_ranges)
    ).order_by('catalognumber', 'id')
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

def fetch_collection_objects_by_ids(
    collection_id: int,
    collection_object_ids: list[int],
    order_by_id: bool = False,
) -> tuple[list[Collectionobject], list[int]]:
    queryset = Collectionobject.objects.filter(
        collectionmemberid=collection_id,
        id__in=collection_object_ids,
    ).select_related('collectionobjecttype__taxontreedef')
    if order_by_id:
        queryset = queryset.order_by('id')

    collection_objects = list(queryset)
    existing_collection_object_ids = {
        collection_object.id for collection_object in collection_objects
    }
    missing_collection_object_ids = [
        collection_object_id
        for collection_object_id in collection_object_ids
        if collection_object_id not in existing_collection_object_ids
    ]
    return collection_objects, missing_collection_object_ids

def fetch_matched_catalog_number_identifiers(
    collection_id: int,
    numeric_ranges: list[tuple[int, int]],
    year_based_ranges: dict[int, list[tuple[int, int]]],
) -> tuple[set[int], set[tuple[int, int]]]:
    queryset = (
        Collectionobject.objects.filter(
            collectionmemberid=collection_id
        )
        .exclude(catalognumber__isnull=True)
        .exclude(catalognumber='')
    )
    if len(numeric_ranges) > 0:
        queryset = queryset.annotate(catalog_number_int=Cast('catalognumber', IntegerField()))
    if len(year_based_ranges) > 0:
        queryset = queryset.annotate(
            catalog_year_int=Cast(Substr('catalognumber', 1, 4), IntegerField()),
            catalog_sequence_int=Cast(Right('catalognumber', 6), IntegerField()),
        )
    catalog_numbers = queryset.filter(
        _build_catalog_number_query(numeric_ranges, year_based_ranges)
    ).values_list('catalognumber', flat=True)

    matched_numeric_numbers: set[int] = set()
    matched_year_based_numbers: set[tuple[int, int]] = set()
    for catalog_number in catalog_numbers:
        if not isinstance(catalog_number, str):
            continue
        if catalog_number.isdigit():
            matched_numeric_numbers.add(int(catalog_number))
        year_match = _STORED_YEAR_CATALOG_NUMBER_RE.match(catalog_number)
        if year_match is None:
            continue
        matched_year_based_numbers.add(
            (int(year_match.group('year')), int(year_match.group('number')))
        )

    return matched_numeric_numbers, matched_year_based_numbers

def extract_current_determination_ids(collection_objects: Iterable[Collectionobject]) -> list[int]:
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

def parse_collection_object_ids(request_data: dict[str, Any]) -> list[int]:
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

def has_single_effective_collection_object_taxon_tree(
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

def build_taxon_tree_groups(
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
