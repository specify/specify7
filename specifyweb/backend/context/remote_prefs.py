import json
import re

from typing import Literal
from contextvars import ContextVar
from contextlib import contextmanager

from django.utils.encoding import force_str

from specifyweb.backend.cache.thread import ThreadCache
from specifyweb.specify.models import Spappresourcedata

REMOTE_PREFERENCE_KEY = Literal[
    "auditing.do_audits",
    "auditing.audit_field_updates",
    "ui.formatting.scrdateformat",
]

GLOBAL_PREFERENCE_KEY = Literal[
    "AUDIT_LIFESPAN_MONTHS",
    "general.auditing.enableAuditLog",
    "general.auditing.logFieldLevelChanges",
    "general.formatting.fullDateFormat",
    "general.formatting.monthYearDateFormat",
    "general.attachments.attachmentThumbnailSize",
]

REMOTE_TO_GLOBAL = {
    "auditing.do_audits": "general.auditing.enableAuditLog",
    "auditing.audit_field_updates": "general.auditing.logFieldLevelChanges",
    "ui.formatting.scrdateformat": "general.formatting.fullDateFormat",
    "ui.formatting.scrmonthformat": "general.formatting.monthYearDateFormat",
    "attachment.preview_size": "general.attachments.attachmentThumbnailSize",
}

GLOBAL_TO_REMOTE = {value: key for key, value in REMOTE_TO_GLOBAL.items()}
COLLECTION_TO_REMOTE = {
    'general.collectionObjectCreation.createCollectionObjectAttributes': 'CO_CREATE_COA',
    'general.collectionObjectCreation.createPreparations': 'CO_CREATE_PREP',
    'general.collectionObjectCreation.createDeterminations': 'CO_CREATE_DET',
}

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


def get_all_global_preferences_database() -> dict:
    resource = Spappresourcedata.objects.filter(
        spappresource__name='GlobalPreferences',
        spappresource__spappresourcedir__usertype='Global Prefs',
    ).first()
    if resource is None:
        return {}
    try:
        return json.loads(force_str(resource.data))
    except (TypeError, ValueError):
        return {}


def get_all_runtime_remote_prefs_database(collection_id: int | None = None) -> str:
    """Return legacy properties plus migrated global values for old consumers."""
    properties = get_all_remote_prefs_database()
    global_values = get_all_global_preferences_database()
    migrated = []
    for global_key, remote_key in GLOBAL_TO_REMOTE.items():
        value = global_values
        for part in global_key.split('.'):
            if not isinstance(value, dict):
                value = None
                break
            value = value.get(part)
        if value is not None:
            migrated.append(f'{remote_key}={str(value).lower() if isinstance(value, bool) else value}')
    if collection_id is not None:
        collection_resource = Spappresourcedata.objects.filter(
            spappresource__name='CollectionPreferences',
            spappresource__spappresourcedir__collection_id=collection_id,
        ).first()
        if collection_resource is not None:
            try:
                collection_values = json.loads(force_str(collection_resource.data))
            except (TypeError, ValueError):
                collection_values = {}
            for global_key, remote_key in COLLECTION_TO_REMOTE.items():
                value = collection_values
                for part in global_key.split('.'):
                    if not isinstance(value, dict):
                        value = None
                        break
                    value = value.get(part)
                if value is not None:
                    migrated.append(
                        f'{remote_key}_{collection_id}='
                        f'{str(value).lower() if isinstance(value, bool) else value}'
                    )
    return '\n'.join(part for part in (properties, *migrated) if part)
def get_preference(joined_preferences: str, key: str) -> str | None:
    match = re.search(f"{re.escape(key)}" + r'=(.+)', joined_preferences)
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
    global_key = REMOTE_TO_GLOBAL.get(key)
    if global_key is not None:
        value = get_global_pref(global_key)
        if value is not None:
            return value

    def get_remote_pref_from_database():
        return get_pref_from_database(key, 'remote')

    return _remote_preference_cache.get_or_set(key, get_remote_pref_from_database)


def get_global_pref(key: GLOBAL_PREFERENCE_KEY) -> str | None:
    if '.' in key:
        value = get_all_global_preferences_database()
        for part in key.split('.'):
            if not isinstance(value, dict):
                return None
            value = value.get(part)
        return None if value is None else str(value).lower() if isinstance(value, bool) else str(value)

    def get_global_pref_from_database():
        return get_pref_from_database(key, 'global')

    return _global_preference_cache.get_or_set(key, get_global_pref_from_database)
