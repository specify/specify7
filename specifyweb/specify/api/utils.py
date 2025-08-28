import json
import logging

from specifyweb.specify import models as spmodels
from specifyweb.backend.businessrules.exceptions import BusinessRuleException
from django.conf import settings

logger = logging.getLogger(__name__)

# TODO: is this used somewhere? 
def get_spmodel_class(model_name: str):
    try:
        return getattr(spmodels, model_name.capitalize())
    except AttributeError:
        pass
    # Iterate over all attributes in the models module
    for attr_name in dir(spmodels):
        # Check if the attribute name matches the model name case-insensitively
        if attr_name.lower() == model_name.lower():
            return getattr(spmodels, attr_name)
    raise AttributeError(f"Model '{model_name}' not found in models module.")

def create_default_collection_types(apps):
    Collection = apps.get_model('specify', 'Collection')
    Collectionobject = apps.get_model('specify', 'Collectionobject')
    Collectionobjecttype = apps.get_model('specify', 'Collectionobjecttype')
    code_set = set(Collection.objects.all().values_list('code', flat=True))

    # Create default collection types for each collection, named after the discipline
    for collection in Collection.objects.all():
        discipline = collection.discipline
        discipline_name = discipline.name
        cot, created = Collectionobjecttype.objects.get_or_create(
            name=discipline_name,
            collection=collection,
            taxontreedef_id=discipline.taxontreedef_id
        )

        # Update CollectionObjects' collectionobjecttype for the discipline
        Collectionobject.objects.filter(collection=collection).update(collectionobjecttype=cot)
        collection.collectionobjecttype = cot
        try:
            collection.save()
        except BusinessRuleException as e:
            if 'Collection must have unique code in discipline' in str(e):
                # May want to do something besides numbering, but users can edit if after the migrqation if they want.
                i = 1
                while True:
                    collection.code = f'{collection.code}-{i}'
                    i += 1
                    if collection.code not in code_set:
                        code_set.add(collection.code)
                        break
                try:
                    collection.save()
                except BusinessRuleException as e:
                    logger.warning(f'Problem saving collection {collection}: {e}')
            continue

def get_picklists(collection: spmodels.Collection, tablename: str, fieldname: str):
    schema_items = spmodels.Splocalecontaineritem.objects.filter(
        container__discipline=collection.discipline,
        container__schematype=0,
        container__name=tablename.lower(),
        name=fieldname.lower(),
    )

    schemaitem = schema_items and schema_items[0]
    picklists = None
    if len(schema_items) > 0 and schema_items[0].picklistname:
        picklists = spmodels.Picklist.objects.filter(name=schema_items[0].picklistname)
        collection_picklists = picklists.filter(collection=collection)
        if len(collection_picklists) > 0:
            picklists = collection_picklists

    return picklists, schemaitem

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
