
import json
import logging
from contextlib import contextmanager
from contextvars import ContextVar
from typing import Any

logger = logging.getLogger(__name__)

_unique_catnum_pref_cache: ContextVar[dict[tuple[int | None, int | None], bool] | None] = ContextVar(
    "unique_catnum_pref_cache",
    default=None,
)

_component_catnum_cache: ContextVar[dict[int, set[str]] | None] = ContextVar(
    "component_catnum_cache",
    default=None,
)

_collection_default_type_cache: ContextVar[dict[int, int | None] | None] = ContextVar(
    "collection_default_type_cache",
    default=None,
)

_collection_cache: ContextVar[dict[int, Any] | None] = ContextVar(
    "businessrules_collection_cache",
    default=None,
)

_agent_specifyuser_cache: ContextVar[dict[int, Any | None] | None] = ContextVar(
    "businessrules_agent_specifyuser_cache",
    default=None,
)

@contextmanager
def cache_unique_catnum_preferences():
    pref_token = _unique_catnum_pref_cache.set({})
    component_token = _component_catnum_cache.set({})
    default_type_token = _collection_default_type_cache.set({})
    collection_token = _collection_cache.set({})
    agent_user_token = _agent_specifyuser_cache.set({})
    try:
        yield
    finally:
        _agent_specifyuser_cache.reset(agent_user_token)
        _collection_cache.reset(collection_token)
        _collection_default_type_cache.reset(default_type_token)
        _component_catnum_cache.reset(component_token)
        _unique_catnum_pref_cache.reset(pref_token)

def _get_collection(collection_id: int):
    from specifyweb.specify.models import Collection

    cache = _collection_cache.get()
    if cache is None:
        return Collection.objects.get(id=collection_id)

    if collection_id not in cache:
        cache[collection_id] = Collection.objects.get(id=collection_id)

    return cache[collection_id]

def _get_agent_specifyuser(agent_id: int):
    from specifyweb.specify.models import Agent

    cache = _agent_specifyuser_cache.get()
    if cache is None:
        return Agent.objects.select_related("specifyuser").get(id=agent_id).specifyuser

    if agent_id not in cache:
        cache[agent_id] = (
            Agent.objects
            .select_related("specifyuser")
            .get(id=agent_id)
            .specifyuser
        )

    return cache[agent_id]

def get_default_collectionobjecttype_id(collection_or_id) -> int | None:
    from specifyweb.specify.models import Collection

    collection = None if isinstance(collection_or_id, int) else collection_or_id
    collection_id = (
        collection_or_id
        if isinstance(collection_or_id, int)
        else getattr(collection_or_id, "id", None)
    )
    if collection_id is None:
        return getattr(collection, "collectionobjecttype_id", None)

    cache = _collection_default_type_cache.get()
    if cache is None:
        if collection is not None:
            return getattr(collection, "collectionobjecttype_id", None)
        return (
            Collection.objects
            .filter(id=collection_id)
            .values_list("collectionobjecttype_id", flat=True)
            .first()
        )

    if collection_id not in cache:
        if collection is not None:
            cache[collection_id] = getattr(collection, "collectionobjecttype_id", None)
        else:
            cache[collection_id] = (
                Collection.objects
                .filter(id=collection_id)
                .values_list("collectionobjecttype_id", flat=True)
                .first()
            )

    return cache[collection_id]

def component_catalog_number_cache_is_active() -> bool:
    return _component_catnum_cache.get() is not None

def clear_component_catalog_number_cache(collection_id: int) -> None:
    cache = _component_catnum_cache.get()
    if cache is not None:
        cache.pop(collection_id, None)

def collection_has_component_catalog_number(collection_id: int | None, catalog_number: str | None) -> bool:
    from specifyweb.specify.models import Component

    if collection_id is None or catalog_number is None:
        return False

    cache = _component_catnum_cache.get()
    if cache is None:
        return Component.objects.filter(
            catalognumber=catalog_number,
            collectionobject__collection_id=collection_id,
        ).exists()

    if collection_id not in cache:
        cache[collection_id] = set(
            Component.objects.filter(
                collectionobject__collection_id=collection_id,
            )
            .exclude(catalognumber=None)
            .values_list("catalognumber", flat=True)
        )

    return catalog_number in cache[collection_id]

def get_unique_catnum_across_comp_co_coll_pref(collection, user) -> bool:
    import specifyweb.backend.context.app_resource as app_resource

    cache = _unique_catnum_pref_cache.get()
    cache_key = (
        getattr(collection, "id", None),
        getattr(user, "id", None),
    )
    if cache is not None and cache_key in cache:
        return cache[cache_key]

    unique_catnum_enabled: bool = False

    try:
        collection_prefs_json, _, __ = app_resource.get_app_resource(collection, user, 'CollectionPreferences')

        if collection_prefs_json is not None:
            collection_prefs_dict = json.loads(collection_prefs_json)

            unique_catalog_number_pref = collection_prefs_dict.get('uniqueCatalogNumberAccrossComponentAndCO', {})
            behavior = unique_catalog_number_pref.get('behavior', {}) \
                if isinstance(unique_catalog_number_pref, dict) else {}
            unique_catnum_enabled = behavior.get('uniqueness', False) if isinstance(behavior, dict) else False

            if not isinstance(unique_catnum_enabled, bool):
                unique_catnum_enabled = False

    except json.JSONDecodeError:
        logger.warning(f"Error: Could not decode JSON for collection preferences")
    except TypeError as e:
        logger.warning(f"Error: Unexpected data structure in collection preferences: {e}")
    except Exception as e:
        logger.warning(f"An unexpected error occurred: {e}")

    if cache is not None:
        cache[cache_key] = unique_catnum_enabled

    return unique_catnum_enabled

def get_unique_catnum_across_comp_co_coll_pref_by_ids(
    collection_id: int | None,
    agent_id: int | None,
) -> bool:
    if collection_id is None or agent_id is None:
        return False

    user = _get_agent_specifyuser(agent_id)
    if user is None:
        return False

    return get_unique_catnum_across_comp_co_coll_pref(
        _get_collection(collection_id),
        user,
    )
