import re
from collections.abc import Callable
from typing import Any, TypedDict

# Regex matching api uris for extracting the model name and id number.
URI_RE = re.compile(r'^/api/specify/(\w+)/($|(\d+))')

class CollectionPayloadMeta(TypedDict):
    limit: int
    offset: int
    total_count: int

class CollectionPayload(TypedDict):
    objects: list[dict[str, Any]]
    meta: CollectionPayloadMeta

def parse_uri(uri: str) -> tuple[str, str]:
    """Return the model name and id from a resource or collection URI."""
    match = URI_RE.match(uri)
    assert match is not None, f"Bad URI: {uri}"
    groups = match.groups()
    return groups[0], groups[2]

def strict_uri_to_model(uri: str, model: str) -> tuple[str, int]:
    uri_model, uri_id = parse_uri(uri)
    assert model.lower() == uri_model.lower(), f"{model} does not match model in uri: {uri_model}"
    assert uri_id is not None
    return uri_model, int(uri_id)

def objs_to_data(objs, offset=0, limit=20) -> CollectionPayload:
    from specifyweb.specify.api.serializers import _obj_to_data
    """Wrapper for backwards compatibility."""
    return objs_to_data_(objs, objs.count(), lambda o: _obj_to_data(o, lambda x: None), offset, limit)

def objs_to_data_(
    objs,
    total_count,
    mapper: Callable[[Any], dict[str, Any]],
    offset=0,
    limit=20
) -> CollectionPayload:
    """Return a collection structure with a list of the data of given objects
    and collection meta data.
    """
    offset, limit = int(offset), int(limit)

    if limit == 0:
        objs = objs[offset:]
    else:
        objs = objs[offset:offset + limit]

    return {'objects': [mapper(o) for o in objs],
            'meta': {'limit': limit,
                     'offset': offset,
                     'total_count': total_count}}