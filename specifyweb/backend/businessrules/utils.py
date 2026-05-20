import json
import logging
from contextlib import contextmanager
from contextvars import ContextVar
from typing import Any

from django.core.exceptions import ObjectDoesNotExist

from specifyweb.backend.cache.thread import ThreadCache

logger = logging.getLogger(__name__)

_unique_catnum_pref_cache = ThreadCache[tuple[int | None, int | None], bool](
    ContextVar(
        "unique_catnum_pref_cache",
        default=None
    )
)

_component_catnum_cache = ThreadCache[tuple[str, int | None, int | None], bool](
    ContextVar(
        "component_catnum_cache",
        default=None,
    )
)

_collection_default_type_cache = ThreadCache[int, int | None](
    ContextVar(
        "collection_default_type_cache",
        default=None,
    )
)

_collection_cache = ThreadCache[int, Any](
    ContextVar(
        "businessrules_collection_cache",
        default=None,
    )
)

_agent_specifyuser_cache = ThreadCache[int, Any | None](
    ContextVar(
        "businessrules_agent_specifyuser_cache",
        default=None,
    )
)


@contextmanager
def cache_unique_catnum_preferences():
    with (
        _unique_catnum_pref_cache.activate(),
        _component_catnum_cache.activate(),
        _collection_default_type_cache.activate(),
        _collection_cache.activate(),
        _agent_specifyuser_cache.activate()
    ):
        yield


def _get_cached_collection(collection_id: int):

    def get_collection():
        from specifyweb.specify.models import Collection
        return Collection.objects.get(id=collection_id)

    return _collection_cache.get_or_set(collection_id, get_collection)


def _get_agent_specifyuser(agent_id: int):

    def get_specifyuser_from_agent():
        from specifyweb.specify.models import Agent
        return (Agent.objects
                .select_related("specifyuser")
                .get(id=agent_id)
                .specifyuser)

    return _agent_specifyuser_cache.get_or_set(agent_id, get_specifyuser_from_agent)


def get_default_collectionobjecttype_id(collection_id: int) -> int | None:
    from specifyweb.specify.models import Collection

    def get_cot_id_from_collection():
        return (
            Collection.objects.filter(id=collection_id)
            .values_list("collectionobjecttype_id", flat=True)
            .first()
        )

    return _collection_default_type_cache.get_or_set(collection_id, get_cot_id_from_collection)


def component_catalog_number_exists(
    catalog_number: str | None,
    excluded_component_id: int | None = None,
    collection_id: int | None = None,
) -> bool:
    from specifyweb.specify.models import Component

    if catalog_number is None:
        return False

    def component_exists_with_catalog_number() -> bool:
        query = Component.objects.filter(catalognumber=catalog_number)
        if collection_id is not None:
            query = query.filter(collectionobject__collection_id=collection_id)
        if excluded_component_id is not None:
            query = query.exclude(pk=excluded_component_id)
        return query.exists()

    # We do a "soft cache" of catalognumbers for Components in Collection
    # That is, if the cache is active and we observe some CatalogNumber on a
    # Component in a Collection, we cache that result for future use
    # i.e., We never store that some Component -> catalogNumber does not exist
    # in the cache: only that a Component -> catalogNumber DOES exist
    cache_key = (catalog_number, collection_id)
    cache_is_active, cached_comp_exists = _component_catnum_cache.get(cache_key, default=False)
    if cache_is_active and cached_comp_exists:
        return True
    db_component_exists = component_exists_with_catalog_number()
    if cache_is_active and db_component_exists:
        _component_catnum_cache.set(cache_key, db_component_exists)
    return db_component_exists


def _get_unique_catnum_across_comp_co_coll_pref(collection, user) -> bool:
    import specifyweb.backend.context.app_resource as app_resource

    collection_prefs = app_resource.get_app_resource(
        collection, user, 'CollectionPreferences')
    if collection_prefs is None:
        return False

    collection_prefs_json, _, __ = collection_prefs
    if collection_prefs_json is None:
        return False

    try:
        collection_prefs_dict = json.loads(collection_prefs_json)
    except (TypeError, ValueError) as e:
        logger.warning(
            "Invalid CollectionPreferences JSON while resolving catalog number "
            "uniqueness preference for collection %s and user %s: %s",
            getattr(collection, "id", None),
            getattr(user, "id", None),
            e,
        )
        return False

    if not isinstance(collection_prefs_dict, dict):
        logger.warning(
            "Invalid CollectionPreferences shape while resolving catalog number "
            "uniqueness preference for collection %s and user %s",
            getattr(collection, "id", None),
            getattr(user, "id", None),
        )
        return False

    unique_catalog_number_pref = collection_prefs_dict.get(
        'uniqueCatalogNumberAccrossComponentAndCO', {})
    if not isinstance(unique_catalog_number_pref, dict):
        return False

    behavior = unique_catalog_number_pref.get('behavior', {})
    if not isinstance(behavior, dict):
        return False

    unique_catnum_enabled = behavior.get('uniqueness', False)
    return unique_catnum_enabled if isinstance(unique_catnum_enabled, bool) else False


def get_cached_unique_catnum_across_comp_co_coll_pref(collection, user) -> bool:
    cache_key = (
        getattr(collection, "pk", None),
        getattr(user, "pk", None),
    )

    def get_preference_value(): return _get_unique_catnum_across_comp_co_coll_pref(
        collection, user)

    return _unique_catnum_pref_cache.get_or_set(cache_key, get_preference_value)


def get_unique_catnum_across_comp_co_coll_pref_by_ids(
    collection_id: int | None,
    agent_id: int | None,
) -> bool:
    if collection_id is None or agent_id is None:
        return False

    try:
        user = _get_agent_specifyuser(agent_id)
        collection = _get_cached_collection(collection_id)
    except ObjectDoesNotExist:
        return False

    if user is None:
        return False

    return get_cached_unique_catnum_across_comp_co_coll_pref(
        collection,
        user,
    )
