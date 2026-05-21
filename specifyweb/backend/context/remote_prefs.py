import re

from typing import Literal
from contextvars import ContextVar
from contextlib import contextmanager

from django.utils.encoding import force_str

from specifyweb.backend.cache.thread import ThreadCache
from specifyweb.specify.models import Spappresourcedata

REMOTE_PREFERENCE_KEY = Literal["auditing.do_audits",
                                "auditing.audit_field_updates", "ui.formatting.scrdateformat"]

GLOBAL_PREFERENCE_KEY = Literal["AUDIT_LIFESPAN_MONTHS"]

_remote_preference_cache = ThreadCache[REMOTE_PREFERENCE_KEY, str](
    ContextVar(
        "remote_preference_cache",
        default=None
    )
)

_global_preference_cache = ThreadCache[GLOBAL_PREFERENCE_KEY, str](
    ContextVar(
        "global_preference_cache",
        default=None
    )
)


@contextmanager
def cache_remote_preferences():
    with (
        _remote_preference_cache.activate(),
        _global_preference_cache.activate()
    ):
        yield


def get_all_remote_prefs_database() -> str:
    res = Spappresourcedata.objects.filter(
        spappresource__name='preferences',
        spappresource__spappresourcedir__usertype='Prefs')

    # Spappresource.data is stored in a blob field even though we treat
    # it as a TextField. Starting in django 2.2 it doesn't automatically
    # get decoded from bytes to str.
    return '\n'.join(force_str(r.data) for r in res)


def get_all_global_prefs_database() -> str:
    res = Spappresourcedata.objects.filter(
        spappresource__name='preferences',
        spappresource__spappresourcedir__usertype='Global Prefs')
    return '\n'.join(force_str(r.data) for r in res)


def get_preference(joined_preferences: str, key: str) -> str | None:
    match = re.search(f"{key}" + r'=(.+)', joined_preferences)
    if match is None:
        return None
    return match.group(1)


def get_pref_from_database(key: str, pref_type: Literal["remote", "global"]) -> str | None:
    if pref_type == "remote":
        fetched_preferences = get_all_remote_prefs_database()
    elif pref_type == "global":
        fetched_preferences = get_all_global_prefs_database()
    else:
        raise ValueError(
            f"Unknown pref type: {pref_type}. Expected one of remote or global")
    return get_preference(fetched_preferences, key)


def get_remote_pref(key: REMOTE_PREFERENCE_KEY) -> str | None:
    def get_remote_pref_from_database():
        return get_pref_from_database(key, 'remote')

    return _remote_preference_cache.get_or_set(key, get_remote_pref_from_database)


def get_global_pref(key: GLOBAL_PREFERENCE_KEY) -> str | None:
    def get_global_pref_from_database():
        return get_pref_from_database(key, 'global')

    return _global_preference_cache.get_or_set(key, get_global_pref_from_database)
