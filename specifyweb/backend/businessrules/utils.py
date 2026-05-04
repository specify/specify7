
import json
import logging
from contextlib import contextmanager
from contextvars import ContextVar

logger = logging.getLogger(__name__)

_unique_catnum_pref_cache: ContextVar[dict[tuple[int | None, int | None], bool] | None] = ContextVar(
    "unique_catnum_pref_cache",
    default=None,
)

@contextmanager
def cache_unique_catnum_preferences():
    token = _unique_catnum_pref_cache.set({})
    try:
        yield
    finally:
        _unique_catnum_pref_cache.reset(token)

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