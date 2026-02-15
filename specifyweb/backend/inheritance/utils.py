import json
import logging

from django.conf import settings

logger = logging.getLogger(__name__)

def get_parent_cat_num_inheritance_setting(collection, user) -> bool:
    import specifyweb.backend.context.app_resource as app_resource

    parent_inheritance_enabled: bool = False  

    try:
        collection_prefs_json, _, __ = app_resource.get_app_resource(collection, user, 'CollectionPreferences')

        if collection_prefs_json is not None:
            collection_prefs_dict = json.loads(collection_prefs_json)

            catalog_number_parent_inheritance = collection_prefs_dict.get('catalogNumberParentInheritance', {})
            behavior = catalog_number_parent_inheritance.get('behavior', {}) \
                if isinstance(catalog_number_parent_inheritance, dict) else {}
            parent_inheritance_enabled = behavior.get('inheritance', False) if isinstance(behavior, dict) else False

            if not isinstance(parent_inheritance_enabled, bool):
                parent_inheritance_enabled = False

    except json.JSONDecodeError:
        logger.warning(f"Error: Could not decode JSON for collection preferences")
    except TypeError as e:
        logger.warning(f"Error: Unexpected data structure in collection preferences: {e}")
    except Exception as e:
        logger.warning(f"An unexpected error occurred: {e}")
    
    return parent_inheritance_enabled


def get_cat_num_inheritance_setting(collection, user) -> bool:
    import specifyweb.backend.context.app_resource as app_resource

    inheritance_enabled: bool = False

    try:
        collection_prefs_json, _, __ = app_resource.get_app_resource(collection, user, 'CollectionPreferences')

        if collection_prefs_json is not None:
            collection_prefs_dict = json.loads(collection_prefs_json)

            catalog_number_inheritance = collection_prefs_dict.get('catalogNumberInheritance', {})
            behavior = catalog_number_inheritance.get('behavior', {}) \
                if isinstance(catalog_number_inheritance, dict) else {}
            inheritance_enabled = behavior.get('inheritance', False) if isinstance(behavior, dict) else False

            if not isinstance(inheritance_enabled, bool):
                inheritance_enabled = False

    except json.JSONDecodeError:
        logger.warning(f"Error: Could not decode JSON for collection preferences")
    except TypeError as e:
        logger.warning(f"Error: Unexpected data structure in collection preferences: {e}")
    except Exception as e:
        logger.warning(f"An unexpected error occurred: {e}")

    return inheritance_enabled

