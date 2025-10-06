
import json
import logging

logger = logging.getLogger(__name__)

def get_unique_catnum_across_comp_co_coll_pref(collection, user) -> bool:
    import specifyweb.backend.context.app_resource as app_resource

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

    return unique_catnum_enabled