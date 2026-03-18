from .utils import _set_string, _get_string, _delete_key, _add_to_set, _remove_from_set, _set_elements, _redis_type, format_key, _key_exists


def set_string(key: str | bytes, value: str, time_to_live=None, override_existing=True):
    return _set_string(format_key(key), value, time_to_live=time_to_live, override_existing=override_existing, decode_responses=True)


def set_bytes(key: str | bytes, value: bytes, time_to_live=None, override_existing=True):
    return _set_string(format_key(key), value, time_to_live=time_to_live, override_existing=override_existing, decode_responses=False)


def get_string(key: str | bytes, delete_key=False) -> str:
    return _get_string(format_key(key), delete_key=delete_key, decode_responses=True)


def get_bytes(key: str | bytes, delete_key=False) -> bytes:
    return _get_string(format_key(key), delete_key=delete_key, decode_responses=False)


def add_to_set(key: str | bytes, *elements: str):
    return _add_to_set(format_key(key), *elements)


def remove_from_set(key: str | bytes, *elements: str):
    return _remove_from_set(format_key(key), *elements)


def set_members(key: str | bytes):
    return _set_elements(format_key(key))


def delete_key(key: str | bytes):
    return _delete_key(format_key(key))


def redis_type(key: str | bytes):
    return _redis_type(format_key(key))


def key_exists(key: str) -> bool:
    return _key_exists(key)
