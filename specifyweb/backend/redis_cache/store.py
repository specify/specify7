from .utils import _set_string, _get_string, _delete_key, _add_to_set, _set_elements, _redis_type


def set_string(key: str, value: str, time_to_live=None, override_existing=True):
    return _set_string(key, value, time_to_live=time_to_live, override_existing=override_existing, decode_responses=True)


def set_bytes(key: str, value: bytes, time_to_live=None, override_existing=True):
    return _set_string(key, value, time_to_live=time_to_live, override_existing=override_existing, decode_responses=False)


def get_string(key: str, delete_key=False) -> str:
    return _get_string(key, delete_key=delete_key, decode_responses=True)


def get_bytes(key: str, delete_key=False) -> bytes:
    return _get_string(key, delete_key=delete_key, decode_responses=False)


def add_to_set(key: str, *elements: str):
    return _add_to_set(key, *elements)

def set_members(key: str):
    return _set_elements(key)


def delete_key(key: str):
    return _delete_key(key)


def redis_type(key: str):
    return _redis_type(key)
