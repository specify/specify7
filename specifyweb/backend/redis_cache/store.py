from .utils import _set_string, _get_string


def set_string(key: str, value: str, time_to_live=None, override_existing=True):
    return _set_string(key, value, time_to_live=time_to_live, override_existing=override_existing, decode_responses=True)


def set_bytes(key: str, value: bytes, time_to_live=None, override_existing=True):
    return _set_string(key, value, time_to_live=time_to_live, override_existing=override_existing, decode_responses=False)


def get_string(key: str, delete_key=False) -> str:
    return _get_string(key, delete_key=delete_key, decode_responses=True)


def get_bytes(key: str, delete_key=False) -> bytes:
    return _get_string(key, delete_key=delete_key, decode_responses=False)
