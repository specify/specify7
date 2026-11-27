"""Compatibility exports for API helpers and legacy object serialization."""

from specifyweb.specify.api_utils import (
    CollectionPayload as CollectionPayload,
    objs_to_data_ as objs_to_data_,
    strict_uri_to_model as strict_uri_to_model,
)

def objs_to_data(objs, offset=0, limit=20) -> CollectionPayload:
    from specifyweb.specify.api.serializers import _obj_to_data
    """Wrapper for backwards compatibility."""
    return objs_to_data_(objs, objs.count(), lambda o: _obj_to_data(o, lambda x: None), offset, limit)