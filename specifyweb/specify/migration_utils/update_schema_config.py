import json
import os
import re

from functools import lru_cache
from typing import NamedTuple, List
import logging


from django.conf import settings
from django.db.models import Q, Count, Window, F
from django.apps import apps as global_apps
from django.core.exceptions import MultipleObjectsReturned
from django.db import connection, transaction
from django.db.models.functions import RowNumber

from specifyweb.specify.models_utils.load_datamodel import Table, FieldDoesNotExistError, TableDoesNotExistError
from specifyweb.specify.models_utils.model_extras import GEOLOGY_DISCIPLINES, PALEO_DISCIPLINES
from specifyweb.specify.models import (
    Discipline,
    datamodel,
)
from specifyweb.specify.migration_utils.sp7_schemaconfig import (
    MIGRATION_0002_TABLES,
    MIGRATION_0004_FIELDS,
    MIGRATION_0004_TABLES,
    MIGRATION_0007_FIELDS,
    MIGRATION_0008_FIELDS,
    MIGRATION_0012_FIELDS,
    MIGRATION_0013_FIELDS,
    MIGRATION_0020_FIELDS,
    MIGRATION_0021_FIELDS,
    MIGRATION_0023_FIELDS,
    MIGRATION_0023_FIELDS_BIS,
    MIGRATION_0024_FIELDS,
    MIGRATION_0027_FIELDS,
    MIGRATION_0027_UPDATE_FIELDS,
    MIGRATION_0029_FIELDS,
    MIGRATION_0029_UPDATE_FIELDS,
    MIGRATION_0032_FIELDS,
    MIGRATION_0032_UPDATE_FIELDS,
    MIGRATION_0033_TABLES,
    MIGRATION_0034_FIELDS,
    MIGRATION_0034_UPDATE_FIELDS,
    MIGRATION_0035_FIELDS,
    MIGRATION_0038_FIELDS,
    MIGRATION_0038_UPDATE_FIELDS,
    MIGRATION_0040_TABLES,
    MIGRATION_0040_FIELDS,
    MIGRATION_0040_UPDATE_FIELDS,
    MIGRATION_0040_HIDDEN_FIELDS,
)

logger = logging.getLogger(__name__)

HIDDEN_FIELDS = [
    "timestampcreated", "timestampmodified", "version", "createdbyagent", "modifiedbyagent"
]


@lru_cache(maxsize=None)
def _schema_override_hidden_fields_for_discipline(discipline_type: str | None) -> dict[str, set[str]]:
    if not discipline_type:
        return {}

    schema_overrides_path = os.path.join(
        settings.SPECIFY_CONFIG_DIR,
        discipline_type.lower(),
        "schema_overrides.json",
    )

    try:
        with open(schema_overrides_path, encoding="utf-8") as schema_overrides_file:
            schema_overrides = json.load(schema_overrides_file)
    except FileNotFoundError:
        return {}
    except (json.JSONDecodeError, OSError) as exception:
        logger.warning(
            "Unable to parse schema overrides for discipline %s from %s: %s",
            discipline_type,
            schema_overrides_path,
            exception,
        )
        return {}

    if not isinstance(schema_overrides, dict):
        return {}

    hidden_overrides: dict[str, set[str]] = {}

    for table_name, table_config in schema_overrides.items():
        if not isinstance(table_config, dict):
            continue

        table_items = table_config.get("items", [])
        if isinstance(table_items, dict):
            item_entries = [table_items]
        elif isinstance(table_items, list):
            item_entries = table_items
        else:
            continue

        for item_entry in item_entries:
            if not isinstance(item_entry, dict):
                continue

            for field_name, field_config in item_entry.items():
                if not isinstance(field_config, dict):
                    continue

                if any(key.lower() == "ishidden" for key in field_config):
                    hidden_overrides.setdefault(table_name.lower(), set()).add(field_name.lower())

    return hidden_overrides


def _fields_without_explicit_hidden_override(
    table_name: str,
    fields: list[str],
    discipline_type: str | None,
) -> list[str]:
    discipline_hidden_overrides = _schema_override_hidden_fields_for_discipline(
        discipline_type
    ).get(table_name.lower(), set())
    return [
        field_name.lower()
        for field_name in fields
        if field_name.lower() not in discipline_hidden_overrides
    ]


def datamodel_type_to_schematype(datamodel_type: str) -> str: 
    """
    Converts a string like `many-to-one` to `ManyToOne` by: 
    - Splitting on hyphens
      - e.g., ['many', 'to', 'one']
    - Lowering then capitilizing each string in the split
      - e.g., ['Many', 'To', 'One']
    - Joining the split strings back together
      - e.g., 'ManyToOne'
    """
    return "".join(map(lambda type_part: type_part.lower().capitalize(), datamodel_type.split('-')))

def camel_to_spaced_title_case(camel_case: str) -> str: 
    """
    Given a camel case string, convert it to title case and add spaces

    - `catalogNumber` -> `Catalog Number`
    - `modifiedByAgent` -> `Modified By Agent`
    - `yesNo6` -> `Yes No6`
    - `cojo` -> `Cojo`
    """
    return re.sub(r"(?<!^)(?=[A-Z])", " ", camel_case).title()

class TableSchemaConfig(NamedTuple):
    name: str
    discipline_id: int
    schema_type: int = 0
    description: str = "TBD"
    language: str = "en"

class FieldSchemaConfig(NamedTuple):
    name: str
    column: str
    java_type: str
    description: str = ""
    language: str = "en"

def uncapitilize(string: str) -> str: 
    return string.lower() if len(string) <= 1 else string[0].lower() + string[1:]

def update_table_schema_config_with_defaults(
    table_name,
    discipline_id: int,
    description: str = None,
    apps = global_apps
):
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
    Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')

    table = datamodel.get_table(table_name)
    
    # BUG: The splocalecontainer related tables can still exist in the database, 
    # and this will result in skipping any operation if the table/field is 
    # removed, renamed, etc.
    if table is None: 
        logger.warning(
            f"Table does not exist in latest state of the datamodel, skipping Schema Config entry for: {table_name}"
        )
        return

    table_config = TableSchemaConfig(
        name=table.name,
        discipline_id=discipline_id,
        schema_type=0,
        description=camel_to_spaced_title_case(uncapitilize(table.name))
        if description is None
        else description,
        language="en"
    )

    # Create Splocalecontainer for the table
    sp_local_container, is_new = Splocalecontainer.objects.get_or_create(
        name=table_config.name.lower(),
        discipline_id=discipline_id,
        schematype=table_config.schema_type,
        ishidden=False,
        issystem=table.system,
        version=0,
    )

    if Splocalecontaineritem.objects.filter(
        container=sp_local_container,
        name=table_config.name.lower(),
    ).exists():
        return

    # Create a Splocaleitemstr for the table name and description
    for k, text in {
        "containername": camel_to_spaced_title_case(uncapitilize(table.name)),
        "containerdesc": table_config.description,
    }.items():
        item_str = {
            "text": text,
            "language": "en",
            "version": 0,
        }
        item_str[k] = sp_local_container
        Splocaleitemstr.objects.get_or_create(**item_str)

    for field in table.all_fields:
        update_table_field_schema_config_with_defaults(
            table_name,
            discipline_id,
            field.name,
            apps,
        )


def revert_table_schema_config(table_name, apps=global_apps):
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')

    containers = Splocalecontainer.objects.filter(name=table_name)
    items = Splocalecontaineritem.objects.filter(container__in=containers)
    Splocaleitemstr.objects.filter(
        Q(itemname__in=items) |
        Q(itemdesc__in=items) |
        Q(containername__in=containers) |
        Q(containerdesc__in=containers)
    ).delete()
    items.delete()
    containers.delete()

def update_table_field_schema_config_with_defaults(
    table_name,
    discipline_id: int,
    field_name: str,
    apps = global_apps
):
    table = datamodel.get_table(table_name)

    # BUG: The splocalecontainer related tables can still exist in the database, 
    # and this will result in skipping any operation if the table/field is 
    # removed, renamed, etc.
    if table is None: 
        logger.warning(f"Table does not exist in latest state of the datamodel, skipping Schema Config entry for: {table_name}")
        return

    table_name = table.name
    table_config = TableSchemaConfig(
        name=table_name.lower(),
        discipline_id=discipline_id,
        schema_type=0,
        language="en"
    )

    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')

    try:
        sp_local_container, _ = Splocalecontainer.objects.get_or_create(
            name=table.name.lower(),
            discipline_id=discipline_id,
            schematype=table_config.schema_type,
        )
    except MultipleObjectsReturned:
        sp_local_container = Splocalecontainer.objects.filter(
            name=table.name.lower(),
            discipline_id=discipline_id,
            schematype=table_config.schema_type
        ).first()

    try:
        field = table.get_field_strict(field_name)
    except FieldDoesNotExistError:
        if field_name in {'parentCog', 'parentCO', 'children', 'componentParent', 'components'}:
            return
        logger.warning(
            f"Field does not exist in latest state of the datamodel, skipping Schema Config entry for: {table_name} -> {field_name}"
        )
        return
    except AttributeError:
        logger.warning(
            f"Field does not exist in latest state of the datamodel, skipping Schema Config entry for: {table_name} -> {field_name}"
        )
        return

    field_config = FieldSchemaConfig(
        name=field_name,
        column=field.column,
        java_type=datamodel_type_to_schematype(field.type) if field.is_relationship else field.type,
        description=camel_to_spaced_title_case(field.name),
        language="en"
    )

    sp_local_container_item, _ = Splocalecontaineritem.objects.get_or_create(
        name=field_config.name,
        container=sp_local_container,
        type=field_config.java_type,
        ishidden=field_config.name.lower() in HIDDEN_FIELDS,
        isrequired=field.required,
        issystem=table.system,
        version=0,
    )

    for k, text in {
        "itemname": field_config.description,
        "itemdesc": field_config.description,
    }.items():
        itm_str = {
            'text': text,
            'language': 'en',
            'version': 0,
        }
        itm_str[k] = sp_local_container_item
        Splocaleitemstr.objects.get_or_create(**itm_str)

def revert_table_field_schema_config(table_name, field_name, apps=global_apps):
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')

    containers = Splocalecontainer.objects.filter(name=table_name)
    items = Splocalecontaineritem.objects.filter(container__in=containers, name=field_name)
    Splocaleitemstr.objects.filter(
        Q(itemname__in=items) |
        Q(itemdesc__in=items)
    ).delete()
    items.delete()

def update_table_field_schema_config_params(
    table_name,
    discipline_id: int,
    field_name: str,
    update_params: dict,
    apps = global_apps
):
    table = datamodel.get_table(table_name)

    if table is None: 
        logger.warning(f"Table does not exist in latest state of the datamodel, skipping Schema Config entry for: {table_name}")
        return

    table_name = table.name
    table_config = TableSchemaConfig(
        name=table_name.lower(),
        discipline_id=discipline_id,
        schema_type=0,
        language="en"
    )

    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')

    try:
        sp_local_container, _ = Splocalecontainer.objects.get_or_create(
            name=table.name.lower(),
            discipline_id=discipline_id,
            schematype=table_config.schema_type,
        )
    except MultipleObjectsReturned:
        sp_local_container = Splocalecontainer.objects.filter(
            name=table.name.lower(),
            discipline_id=discipline_id,
            schematype=table_config.schema_type
        ).first()

    try:
        field = table.get_field_strict(field_name)
    except FieldDoesNotExistError:
        logger.warning(
            f"Field does not exist in latest state of the datamodel, skipping Schema Config entry for: {table_name} -> {field_name}"
        )
        return
    except AttributeError:
        logger.warning(
            f"Field does not exist in latest state of the datamodel, skipping Schema Config entry for: {table_name} -> {field_name}"
        )
        return

    field_config = FieldSchemaConfig(
        name=field_name,
        column=field.column,
        java_type=datamodel_type_to_schematype(field.type) if field.is_relationship else field.type,
        description=camel_to_spaced_title_case(field.name),
        language="en"
    )

    qs = Splocalecontaineritem.objects.filter(
        name=field_config.name,
        container=sp_local_container,
        type=field_config.java_type, # maybe remove from filter
    )
    count = qs.count()

    if count == 0:
        # logger.warning(f"Splocalecontaineritem does not exist for: {table_name} -> {field_name}, skipping update")
        return

    if count > 1:
        updated = qs.update(**update_params)
        logger.info(f"Updated {updated} duplicate Splocalecontaineritem rows for {table_name}.{field_name}")
        return

    sp_local_container_item = qs.first()
    for k, v in update_params.items():
        setattr(sp_local_container_item, k, v)
    sp_local_container_item.save(update_fields=list(update_params.keys()))

def deduplicate_schema_config_sql(apps=None):
    dedupe_sql = '''
    /*

    This script removes duplicate entries in the `splocalecontaineritem` table
    based on the combination of `DisciplineID`, `Name`, and `Field Name`.
    It ensures that only one unique entry remains for each combination,
    deleting any duplicates along with their associated string entries
    to maintain schema integrity.

    This was created to clean up duplicates found in a Swiss database on 2025-01-28.

    */


    -- 1. Identify all duplicate Container Item IDs 
    -- We group by Discipline, Table Name, and Field Name
    -- We keep the record with the lowest ID (rn = 1) and mark the rest (rn > 1)
    CREATE TEMPORARY TABLE container_items_to_delete AS
    SELECT 
        sub.SpLocaleContainerItemID
    FROM (
        SELECT 
            slci.SpLocaleContainerItemID,
            ROW_NUMBER() OVER (
                PARTITION BY slc.DisciplineID, slc.Name, slci.Name 
                ORDER BY slci.SpLocaleContainerItemID ASC
            ) as rn
        FROM splocalecontaineritem slci
        JOIN splocalecontainer slc ON slci.SpLocaleContainerID = slc.SpLocaleContainerID
    ) sub
    WHERE sub.rn > 1;

    -- 2. Delete the dependent strings first to satisfy Foreign Key constraints
    -- This handles strings linked as either 'Name' or 'Description'
    DELETE FROM splocaleitemstr 
    WHERE SpLocaleContainerItemNameID IN (SELECT SpLocaleContainerItemID FROM container_items_to_delete)
    OR SpLocaleContainerItemDescID IN (SELECT SpLocaleContainerItemID FROM container_items_to_delete);

    -- 3. Delete the duplicate Container Items
    DELETE FROM splocalecontaineritem 
    WHERE SpLocaleContainerItemID IN (SELECT SpLocaleContainerItemID FROM container_items_to_delete);

    -- 4. Clean up the temporary table
    DROP TEMPORARY TABLE container_items_to_delete;
    '''
    cursor = connection.cursor()
    cursor.execute(dedupe_sql)
    cursor.close()

def deduplicate_schema_config_orm(apps, schema_editor=None):
    ContainerItem = apps.get_model('specify', 'SpLocaleContainerItem')
    ItemStr = apps.get_model('specify', 'SpLocaleItemStr')

    with transaction.atomic():
        # Identify duplicates using Window function
        # Partition by the container relationship and the item name
        qs = ContainerItem.objects.annotate(
            rn=Window(
                expression=RowNumber(),
                partition_by=[
                    F('container__discipline'), 
                    F('container__name'), 
                    F('name')
                ],
                order_by=F('id').asc()
            )
        )

        # Extract the IDs of the duplicates, keep the first and delete the rest
        ids_to_delete = [item.id for item in qs if item.rn > 1]

        if ids_to_delete:
            # Delete dependent strings using corrected field names
            ItemStr.objects.filter(itemname_id__in=ids_to_delete).delete()
            ItemStr.objects.filter(itemdesc_id__in=ids_to_delete).delete()
            
            # Delete the duplicate Container Items
            ContainerItem.objects.filter(id__in=ids_to_delete).delete()
            
            print(f"Successfully deleted {len(ids_to_delete)} duplicate schema items.")
        else:
            print("No duplicates found.")

# ##############################################################################
# Migration schema config helper functions
# ##############################################################################

def update_all_table_schema_config_with_defaults(apps):
    Discipline = apps.get_model('specify', 'Discipline')
    for discipline in Discipline.objects.all():
        for table in datamodel.tables:
            update_table_schema_config_with_defaults(table.name, discipline.id, None, apps)

# ##########################################
# Used in 0002_schema_config_update.py
# ##########################################

DEFAULT_COG_TYPES = [
    'Discrete',
    'Consolidated',
    'Drill Core',
]

def create_geo_table_schema_config_with_defaults(apps):
    Discipline = apps.get_model('specify', 'Discipline')
    for discipline in Discipline.objects.all():
        for table, desc in MIGRATION_0002_TABLES:
            update_table_schema_config_with_defaults(table, discipline.id, desc, apps)

# ##########################################
# Used in 0003_cotype_picklist.py
# ##########################################

COT_PICKLIST_NAME = 'CollectionObjectType'
COT_FIELD_NAME = 'collectionObjectType'
COT_TEXT = 'Collection Object Type'

def create_cotype_splocalecontaineritem(apps):
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
    Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')

    # Create a Splocalecontaineritem record for each CollectionObject Splocalecontainer
    # NOTE: Each discipline has its own CollectionObject Splocalecontainer
    for container in Splocalecontainer.objects.filter(name='collectionobject', schematype=0):
        container_item, _ = Splocalecontaineritem.objects.get_or_create(
            name=COT_FIELD_NAME,
            picklistname=COT_PICKLIST_NAME,
            type='ManyToOne',
            container=container,
            isrequired=True
        )
        Splocaleitemstr.objects.get_or_create(
            language='en',
            text=COT_TEXT,
            itemname=container_item
        )
        Splocaleitemstr.objects.get_or_create(
            language='en',
            text=COT_TEXT,
            itemdesc=container_item
        )

# ##########################################
# Used in 0004_stratigraphy_age.py
# ##########################################

AGETYPE_PICKLIST_NAME = 'AgeType'
DEFAULT_AGE_TYPES = [
    'Sedimentation', 
    'Metamorphism', 
    'Erosion', 
    'Diagenetic', 
]

def create_agetype_picklist(apps):
    Collection = apps.get_model('specify', 'Collection')
    Picklist = apps.get_model('specify', 'Picklist')
    PicklistItem = apps.get_model('specify', 'Picklistitem')

    for collection in Collection.objects.all():
        age_type_picklist, created = Picklist.objects.get_or_create(
            name=AGETYPE_PICKLIST_NAME,
            type=0,
            collection_id=collection.id,
            defaults={
                "issystem": False,
                "readonly": False,
                "sizelimit": -1,
                "sorttype": 1,
            }
        )
        if created: 
            for age_type in DEFAULT_AGE_TYPES:
                PicklistItem.objects.get_or_create(
                    title=age_type,
                    value=age_type,
                    picklist=age_type_picklist
                )

def create_strat_table_schema_config_with_defaults(apps):
    Discipline = apps.get_model('specify', 'Discipline')
    for discipline in Discipline.objects.all():
        for table, desc in MIGRATION_0004_TABLES: # NOTE: lots of Nones, getting skips
            update_table_schema_config_with_defaults(table, discipline.id, desc, apps)

        for table, fields in MIGRATION_0004_FIELDS.items():
            for field in fields:
                update_table_field_schema_config_with_defaults(table, discipline.id, field, apps)

def revert_strat_table_schema_config_with_defaults(apps):
    for table, _ in MIGRATION_0004_TABLES:
        revert_table_schema_config(table, apps)
    for table, fields in MIGRATION_0004_FIELDS.items():
        for field in fields:
            revert_table_field_schema_config(table, field, apps)

# ##########################################
# Used in 0007_schema_config_update.py
# ##########################################

COG_PICKLIST_NAME = 'COGTypes'
COGTYPE_FIELD_NAME = 'cogType'
SYSTEM_COGTYPE_PICKLIST_NAME = "SystemCOGTypes"

def update_cog_type_fields(apps):
    Discipline = apps.get_model('specify', 'Discipline')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
    Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')

    # Revert COG -> children before adding to avoid duplicates
    revert_table_field_schema_config('CollectionObjectGroup', 'children', apps)
    # Add StorageTreeDef -> institution and COG -> children
    for discipline in Discipline.objects.all():
        for table, fields in MIGRATION_0007_FIELDS.items():
            for field in fields: 
                update_table_field_schema_config_with_defaults(table, discipline.id, field, apps)

    # Remove COG -> cojo
    revert_table_field_schema_config('CollectionObjectGroup', 'cojo', apps)

    # Remove duplicate CollectionObject -> collectionObjectType
    container_items = Splocalecontaineritem.objects.filter(
        name="collectionObjectType",
        picklistname=None,
        container__name="CollectionObject",
    )
    for container_item in container_items:
        Splocaleitemstr.objects.filter(itemname=container_item).delete()
        Splocaleitemstr.objects.filter(itemdesc=container_item).delete()
    container_items.delete()

# NOTE: The reverse function will not re-add the duplicate CO -> coType or COG -> cojo as its unnecessary
def revert_cog_type_fields(apps):
    # Remove StorageTreeDef -> institution and COG -> children
    for table, fields in MIGRATION_0007_FIELDS.items():
            for field in fields: 
                revert_table_field_schema_config(table, field, apps)

def create_cogtype_picklist(apps):
    Collection = apps.get_model('specify', 'Collection')
    Picklist = apps.get_model('specify', 'Picklist')

    # Create a cogtype picklist for each collection
    for collection in Collection.objects.all():
        Picklist.objects.update_or_create(
            collection=collection,
            name=COG_PICKLIST_NAME,
            defaults={
                "type": 1,
                "tablename": "collectionobjectgrouptype",
                "issystem": True,
                "readonly": True,
                "sizelimit": -1,
                "sorttype": 1,
                "formatter": "CollectionObjectGroupType",
            },
        )

def revert_cogtype_picklist(apps):
    Picklist = apps.get_model('specify', 'Picklist')

    Picklist.objects.filter(name=COG_PICKLIST_NAME).delete()


# Updates COG -> cogtype to use the type 1 picklist created above
def update_cogtype_splocalecontaineritem(apps):
    Splocalecontaineritem = apps.get_model("specify", "Splocalecontaineritem")

    Splocalecontaineritem.objects.filter(
        container__name="collectionobjectgroup",
        container__schematype=0,
        name=COGTYPE_FIELD_NAME,
    ).update(picklistname=COG_PICKLIST_NAME, type="ManyToOne", isrequired=True)


def revert_cogtype_splocalecontaineritem(apps):
    Splocalecontaineritem = apps.get_model("specify", "Splocalecontaineritem")

    Splocalecontaineritem.objects.filter(
        container__name="collectionobjectgroup",
        container__schematype=0,
        name=COGTYPE_FIELD_NAME,
    ).update(picklistname=None, type=None, isrequired=None)


def update_systemcogtypes_picklist(apps):
    Picklist = apps.get_model('specify', 'Picklist')

    Picklist.objects.filter(name='Default Collection Object Group Types').update(
        name=SYSTEM_COGTYPE_PICKLIST_NAME,
        type=0,
        issystem=True,
        readonly=True,
        sizelimit=3,
        tablename=None
    )

def revert_systemcogtypes_picklist(apps):
    Picklist = apps.get_model('specify', 'Picklist')

    # revert only changes the name and not the other attributes as those were incorrect
    Picklist.objects.filter(name=SYSTEM_COGTYPE_PICKLIST_NAME).update(
        name='Default Collection Object Group Types',
    )


# Updates cogtype -> type to use the Default COGType picklist (Drill Core, Discrete, Consolidated)
def update_cogtype_type_splocalecontaineritem(apps):
    Splocalecontaineritem = apps.get_model("specify", "Splocalecontaineritem")

    Splocalecontaineritem.objects.filter(
        container__name="collectionobjectgrouptype",
        container__schematype=0,
        name="type",
    ).update(picklistname=SYSTEM_COGTYPE_PICKLIST_NAME, isrequired=True)


def revert_cogtype_type_splocalecontaineritem(apps):
    Splocalecontaineritem = apps.get_model("specify", "Splocalecontaineritem")

    Splocalecontaineritem.objects.filter(
        container__name="collectionobjectgrouptype",
        container__schematype=0,
        name="type",
    ).update(picklistname=None, isrequired=None)

# ##########################################
# Used in 0008_schema_config_update.py
# ##########################################

def update_relative_age_fields(apps):
    Discipline = apps.get_model('specify', 'Discipline')

    # Add absoluteAgeCitation -> absoluteAge & Add relativeAgeCitation -> relativeAge
    for discipline in Discipline.objects.all():
        for table, fields in MIGRATION_0008_FIELDS.items(): 
            for field in fields: 
                update_table_field_schema_config_with_defaults(table, discipline.id, field, apps)

def revert_relative_age_fields(apps):
    # Remove absoluteAgeCitation -> absoluteAge and relativeAgeCitation -> relativeAge
        for table, fields in MIGRATION_0008_FIELDS.items(): 
            for field in fields: 
                revert_table_field_schema_config(table, field, apps)

# ##########################################
# Used in 0012_add_cojo_to_schema_config.py
# ##########################################

def add_cojo_to_schema_config(apps):
    Discipline = apps.get_model('specify', 'Discipline')
    for discipline in Discipline.objects.all():
        for table, fields in MIGRATION_0012_FIELDS.items():
            for field in fields:
                update_table_field_schema_config_with_defaults(
                    table, discipline.id, field, apps)


def remove_cojo_from_schema_config(apps):
    for table, fields in MIGRATION_0012_FIELDS.items():
        for field in fields:
            revert_table_field_schema_config(table, field, apps)


# ##########################################
# Used in 0013_collectionobjectgroup_parentcog.py
# ##########################################

def update_cog_schema_config(apps):
    revert_table_field_schema_config(
        'CollectionObjectGroup', 'parentCojo', apps)
    revert_table_field_schema_config(
        'CollectionObjectGroup', 'parentCog', apps)

    Discipline = apps.get_model('specify', 'Discipline')
    for discipline in Discipline.objects.all():
        for table, fields in MIGRATION_0013_FIELDS.items():
            for field in fields:
                update_table_field_schema_config_with_defaults(
                    table, discipline.id, field, apps)


def revert_update_cog_schema_config(apps):
    for table, fields in MIGRATION_0013_FIELDS.items():
        for field in fields:
            revert_table_field_schema_config(table, field, apps)

    Discipline = apps.get_model('specify', 'Discipline')
    for discipline in Discipline.objects.all():
        update_table_field_schema_config_with_defaults(
            'CollectionObjectGroup', discipline.id, 'parentCojo', apps)

# ##########################################
# Used in 0015_add_version_to_ages.py
# ##########################################

def update_age_schema_config(apps):
    # Revert before adding to avoid duplicates
    revert_update_age_schema_config(apps)

    Discipline = apps.get_model('specify', 'Discipline')
    for discipline in Discipline.objects.all():
        update_table_field_schema_config_with_defaults('AbsoluteAge', discipline.id, 'version', apps)
        update_table_field_schema_config_with_defaults('RelativeAge', discipline.id, 'version', apps)

def revert_update_age_schema_config(apps):
    revert_table_field_schema_config('AbsoluteAge', 'version', apps)
    revert_table_field_schema_config('RelativeAge', 'version', apps)

# ##########################################
# Used in 0017_schemaconfig_fixes.py
# ##########################################

CONTAINER_MIGRATIONS = [MIGRATION_0002_TABLES, MIGRATION_0004_TABLES]

CONTAINER_ITEM_MIGRATIONS = [
    MIGRATION_0004_FIELDS,
    MIGRATION_0007_FIELDS,
    MIGRATION_0008_FIELDS,
    MIGRATION_0012_FIELDS,
    MIGRATION_0013_FIELDS,
]

def fix_table_captions(apps):
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
    Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')

    for migration in CONTAINER_MIGRATIONS:
        for table_name, table_desc in migration:
            table = datamodel.get_table(table_name)
            
            # BUG: The splocalecontainer related tables can still exist in the 
            # database, and this will result in skipping any operation if the 
            # table/field is removed, renamed, etc.
            if table is None: 
                logger.warning(f"Table does not exist in latest state of the datamodel, skipping Schema Config update for: {table_name}")
                continue
            containers = Splocalecontainer.objects.filter(
                name=table_name.lower(), schematype=0)

            # If needed, correct the label of the table in the schema config
            if table_desc is not None:
                Splocaleitemstr.objects.filter(
                    containername__in=containers, text=table_desc
                ).update(text=camel_to_spaced_title_case(uncapitilize(table.name)))

            # Update the types for the fields in the table
            items = Splocalecontaineritem.objects.filter(
                container__in=containers)
            for item in items:
                datamodel_field = table.get_field(item.name)
                if not datamodel_field:
                    continue

                item.type = datamodel_type_to_schematype(
                    datamodel_field.type) if datamodel_field.is_relationship else datamodel_field.type
                item.isrequired = datamodel_field.required if item.isrequired is None else item.isrequired

                item.save()


def fix_item_types(apps):
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')

    for migration in CONTAINER_ITEM_MIGRATIONS:
        for table_name, fields in migration.items():
            table = datamodel.get_table(table_name)
            # BUG: The splocalecontainer related tables can still exist in the 
            # database, and this will result in skipping any operation if the 
            # table/field is removed, renamed, etc.
            if table is None:
                logger.warning(f"Table does not exist in latest state of the datamodel, skipping Schema Config entry for: {table_name}")
                continue
            items = Splocalecontaineritem.objects.filter(
                container__name=table_name.lower(), container__schematype=0, name__in=fields)

            for item in items:
                datamodel_field = table.get_field(item.name)
                if not datamodel_field:
                    continue

                item.type = datamodel_type_to_schematype(
                    datamodel_field.type) if datamodel_field.is_relationship else datamodel_field.type
                item.isrequired = datamodel_field.required if item.isrequired is None else item.isrequired

                item.save()


def schemaconfig_fixes(apps, schema_editor=None):
    fix_table_captions(apps)
    fix_item_types(apps)

# ##########################################
# Used in 0018_cot_catnum_schema.py
# ##########################################

def add_cot_catnum_to_schema(apps, schema_editor=None):
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
    Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')

    CollectionObjectType_Table = datamodel.get_table_strict(
        'collectionobjecttype')
    catalognumber_format_field = CollectionObjectType_Table.get_field_strict(
        'catalogNumberFormatName')

    for container in Splocalecontainer.objects.filter(name='collectionobjecttype', schematype=0):
        schema_item, created = Splocalecontaineritem.objects.get_or_create(
            name=catalognumber_format_field.name, type=catalognumber_format_field.type, container=container)
        if created:
            schema_item.version = 0

        schema_item.isrequired = (
            catalognumber_format_field.required
            if schema_item.isrequired is None
            else schema_item.isrequired
        )

        schema_item.save()

        schema_name = camel_to_spaced_title_case(
            catalognumber_format_field.name)
        Splocaleitemstr.objects.get_or_create(
            language='en', text=schema_name, itemname=schema_item)
        Splocaleitemstr.objects.get_or_create(
            language='en', text=schema_name, itemdesc=schema_item)

def remove_cot_catnum_from_schema(apps, schema_editor=None):
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
    Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')

    CollectionObjectType_Table = datamodel.get_table_strict(
        'collectionobjecttype')
    catalognumber_format_field = CollectionObjectType_Table.get_field_strict(
        'catalogNumberFormatName')

    containers = Splocalecontainer.objects.filter(
        name='collectionobjecttype', schematype=0)
    items = Splocalecontaineritem.objects.filter(
        name='catalogNumberFormatName', container__in=containers)

    schema_name = camel_to_spaced_title_case(catalognumber_format_field.name)
    filters = Q(language='en', text=schema_name) & (
        Q(itemname__in=items) | Q(itemdesc__in=items))
    locale_strings = Splocaleitemstr.objects.filter(filters)

    locale_strings.delete()
    items.delete()

# ##########################################
# Used in 0020_add_tectonicunit_to_pc_in_schema_config.py
# ##########################################

def add_tectonicunit_to_pc_in_schema_config(apps):
    Discipline = apps.get_model('specify', 'Discipline')
    for discipline in Discipline.objects.all():
        for table, fields in MIGRATION_0020_FIELDS.items():
            for field in fields:
                update_table_field_schema_config_with_defaults(
                    table, discipline.id, field, apps)

def remove_tectonicunit_from_pc_schema_config(apps):
    for table, fields in MIGRATION_0020_FIELDS.items():
        for field in fields:
            revert_table_field_schema_config(table, field, apps)

# ##########################################
# Used in 0021_update_hidden_geo_tables.py
# ##########################################

def fix_hidden_geo_prop(apps, schema_editor=None):
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
    Discipline = apps.get_model('specify', 'Discipline')

    excluded_disciplines = PALEO_DISCIPLINES | GEOLOGY_DISCIPLINES

    filtered_disciplines = Discipline.objects.exclude(type__in=excluded_disciplines)

    for discipline in filtered_disciplines:
        for table, fields in MIGRATION_0021_FIELDS.items():
            containers = Splocalecontainer.objects.filter(
                name=table.lower(),
                discipline_id=discipline.id,
            )
            for container in containers:
                # BUG: What if the user wants the field unhidden?
                Splocalecontaineritem.objects.filter(
                    container=container,
                    name__in=tuple(map(lambda field_name: field_name.lower(), fields))
                ).update(ishidden=True)

def reverse_fix_hidden_geo_prop(apps, schema_editor=None):
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
    Discipline = apps.get_model('specify', 'Discipline')

    excluded_disciplines = PALEO_DISCIPLINES | GEOLOGY_DISCIPLINES

    filtered_disciplines = Discipline.objects.exclude(type__in=excluded_disciplines)

    for discipline in filtered_disciplines:
        for table, fields in MIGRATION_0021_FIELDS.items():
            containers = Splocalecontainer.objects.filter(
                name=table.lower(),
                discipline_id=discipline.id,
            )
            for container in containers:
                # BUG: What if the user wants the field hidden? 
                Splocalecontaineritem.objects.filter(
                    container=container,
                    name__in=tuple(map(lambda field_name: field_name.lower(), fields))
                ).update(ishidden=False)

# ##########################################
# Used in 0023_update_schema_config_text.py
# ##########################################

def update_schema_config_field_desc(apps, schema_editor=None):
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
    Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')

    for table, fields in MIGRATION_0023_FIELDS.items():
        #i.e: Collection Object
        containers = Splocalecontainer.objects.filter(
            name=table.lower(),
        )

        for container in containers:
            for field_name, new_name, new_desc in fields:
                #i.e: COType
                items = Splocalecontaineritem.objects.filter(
                    container=container,
                    name=field_name.lower()
                )

                for item in items:
                    localized_items_desc = Splocaleitemstr.objects.filter(itemdesc_id=item.id).first()
                    localized_items_name = Splocaleitemstr.objects.filter(itemname_id=item.id).first()

                    if localized_items_desc is None or localized_items_name is None:
                        continue

                    localized_items_desc.text = new_desc
                    localized_items_desc.save() 

                    localized_items_name.text = new_name
                    localized_items_name.save() 

def update_hidden_prop(apps, schema_editor=None):
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
    Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')
    Discipline = apps.get_model('specify', 'Discipline')

    discipline_types = dict(Discipline.objects.values_list("id", "type"))

    for table, fields in MIGRATION_0023_FIELDS_BIS.items():
        containers = Splocalecontainer.objects.filter(
            name=table.lower(),
            schematype=0
        )
        for container in containers:
            fields_to_hide = _fields_without_explicit_hidden_override(
                table,
                fields,
                discipline_types.get(container.discipline_id),
            )
            if not fields_to_hide:
                continue

            items_updated = Splocalecontaineritem.objects.filter(
                container=container,
                ishidden=False,
                name__in=fields_to_hide,
            ).update(ishidden=True)
            if items_updated > 0:
                logger.info(f"Hid {items_updated} items for table {table} and container {container.id}")

    duplicates = (
        Splocalecontaineritem.objects.values("container", "name")
        .annotate(count=Count("id"))
        .filter(count__gt=1)
    )
    for duplicate in duplicates:
        container_id = duplicate['container']
        name = duplicate['name']
        duplicate_items = Splocalecontaineritem.objects.filter(container_id=container_id, name=name)
        item_to_keep = duplicate_items.order_by("ishidden", "id").first()
        if item_to_keep is None:
            continue

        items_to_delete = duplicate_items.exclude(id=item_to_keep.id)

        Splocaleitemstr.objects.filter(itemdesc_id__in=items_to_delete).update(itemdesc_id=item_to_keep.id)
        Splocaleitemstr.objects.filter(itemname_id__in=items_to_delete).update(itemname_id=item_to_keep.id)
        items_to_delete.delete()

def reverse_update_hidden_prop(apps, schema_editor=None):
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
    Discipline = apps.get_model('specify', 'Discipline')

    discipline_types = dict(Discipline.objects.values_list("id", "type"))

    for table, fields in MIGRATION_0023_FIELDS_BIS.items():
        containers = Splocalecontainer.objects.filter(
            name=table.lower(),
        )
        for container in containers:
            fields_to_unhide = _fields_without_explicit_hidden_override(
                table,
                fields,
                discipline_types.get(container.discipline_id),
            )
            if not fields_to_unhide:
                continue

            items = Splocalecontaineritem.objects.filter(
                container=container,
                name__in=fields_to_unhide,
            )
            logger.info(f"Reverting {items.count()} items for table {table} and container {container.id}")
            items.update(ishidden=False)

def reverse_update_schema_config_field_desc(apps, schema_editor=None):
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
    Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')

    for table, fields in MIGRATION_0023_FIELDS.items():
        containers = Splocalecontainer.objects.filter(
            name=table.lower(),
        )

        for container in containers:
            for field_name, new_name, new_desc in fields:
                items = Splocalecontaineritem.objects.filter(
                    container=container,
                    name=field_name.lower()
                )

                for item in items:
                    localized_items_desc = Splocaleitemstr.objects.filter(itemdesc_id=item.id).first()
                    localized_items_name = Splocaleitemstr.objects.filter(itemname_id=item.id).first()

                    if localized_items_desc is None or localized_items_name is None:
                        continue

                    localized_items_desc.text = item.name
                    localized_items_desc.save() 

                    localized_items_name.text = item.name
                    localized_items_name.save()

# ##########################################
# Used in 0024_add_uniqueIdentifier_storage.py
# ##########################################

def update_storage_unique_id_fields(apps):
    Discipline = apps.get_model('specify', 'Discipline')

    # Add uniqueIdentifier -> storage
    for discipline in Discipline.objects.all():
        for table, fields in MIGRATION_0024_FIELDS.items(): 
            for field in fields: 
                update_table_field_schema_config_with_defaults(table, discipline.id, field, apps)

def revert_storage_unique_id_fields(apps):
    # Remove uniqueIdentifier -> storage
    for table, fields in MIGRATION_0024_FIELDS.items(): 
        for field in fields: 
            revert_table_field_schema_config(table, field, apps)

# ##########################################
# Used in 0027_CO_children.py
# ##########################################

def update_co_children_fields(apps):
    def update_discipline_fields(apps):
        Discipline = apps.get_model('specify', 'Discipline')

        for discipline in Discipline.objects.all():
            for table, fields in MIGRATION_0027_FIELDS.items(): 
                for field in fields: 
                    update_table_field_schema_config_with_defaults(table, discipline.id, field, apps)

    def update_schema_config_field_desc(apps):
        Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
        Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
        Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')

        for table, fields in MIGRATION_0027_UPDATE_FIELDS.items():
            #i.e: Collection Object
            containers = Splocalecontainer.objects.filter(
                name=table.lower(),
            )

            for container in containers:
                for field_name, new_name, new_desc in fields:
                    #i.e: COType
                    items = Splocalecontaineritem.objects.filter(
                        container=container,
                        name=field_name.lower()
                    )

                    for item in items:
                        localized_items_desc = Splocaleitemstr.objects.filter(itemdesc_id=item.id).first()
                        localized_items_name = Splocaleitemstr.objects.filter(itemname_id=item.id).first()

                        if localized_items_desc is None or localized_items_name is None:
                            continue

                        localized_items_desc.text = new_desc
                        localized_items_desc.save() 

                        localized_items_name.text = new_name
                        localized_items_name.save() 

    update_discipline_fields(apps)
    update_schema_config_field_desc(apps)

def revert_co_children_fields(apps):
    def revert_update_fields(apps):
        for table, fields in MIGRATION_0027_FIELDS.items(): 
            for field in fields: 
                revert_table_field_schema_config(table, field, apps)

    def revert_update_schema_field(apps):
        Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
        Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')

        for table, fields in MIGRATION_0027_UPDATE_FIELDS.items():
            containers = Splocalecontainer.objects.filter(
                name=table.lower(),
            )
            for container in containers:
                for field_name in fields:
                    items = Splocalecontaineritem.objects.filter(
                        container=container,
                        name=field_name
                    )

                    for item in items:
                        item.ishidden = False
                        item.save()

    revert_update_fields(apps)
    revert_update_schema_field(apps)

# ##########################################
# Used in 0029_remove_collectionobject_parentco.py
# ##########################################

def remove_collectionobject_parentco(apps):
    def update_fields(apps):
        Discipline = apps.get_model('specify', 'Discipline')

        for discipline in Discipline.objects.all():
            for table, fields in MIGRATION_0029_FIELDS.items(): 
                for field in fields: 
                    update_table_field_schema_config_with_defaults(table, discipline.id, field, apps)

    def update_schema_config_field_desc(apps):
        Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
        Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
        Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')

        for table, fields in MIGRATION_0029_UPDATE_FIELDS.items():
            #i.e: Collection Object
            containers = Splocalecontainer.objects.filter(
                name=table.lower(),
            )

            for container in containers:
                for field_name, new_name, new_desc in fields:
                    #i.e: COType
                    items = Splocalecontaineritem.objects.filter(
                        container=container,
                        name=field_name.lower()
                    )

                    for item in items:
                        localized_items_desc = Splocaleitemstr.objects.filter(itemdesc_id=item.id).first()
                        localized_items_name = Splocaleitemstr.objects.filter(itemname_id=item.id).first()

                        if localized_items_desc is None or localized_items_name is None:
                            continue

                        localized_items_desc.text = new_desc
                        localized_items_desc.save() 

                        localized_items_name.text = new_name
                        localized_items_name.save() 

    def hide_co_component(apps):
        Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
        Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
        Discipline = apps.get_model('specify', 'Discipline')

        disciplines = Discipline.objects.all()

        for discipline in disciplines:
            for table, fields in MIGRATION_0029_UPDATE_FIELDS.items():
                containers = Splocalecontainer.objects.filter(
                    name=table.lower(),
                    discipline_id=discipline.id,
                )
                for container in containers:
                    for field_name, _, _ in fields:
                        items = Splocalecontaineritem.objects.filter(
                            container=container,
                            name=field_name.lower()
                        )

                        for item in items:
                            item.ishidden = True
                            item.save()

    update_fields(apps)
    update_schema_config_field_desc(apps)
    hide_co_component(apps)

def revert_remove_collectionobject_parentco(apps):
    def revert_update_fields(apps):
        for table, fields in MIGRATION_0029_FIELDS.items(): 
            for field in fields: 
                revert_table_field_schema_config(table, field, apps)

    def revert_update_schema_field(apps):
        Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
        Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')

        for table, fields in MIGRATION_0029_UPDATE_FIELDS.items():
            containers = Splocalecontainer.objects.filter(
                name=table.lower(),
            )
            for container in containers:
                for field_name in fields:
                    items = Splocalecontaineritem.objects.filter(
                        container=container,
                        name=field_name
                    )

                    for item in items:
                        item.ishidden = False
                        item.save()

    def reverse_hide_co_component(apps):
        Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
        Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
        Discipline = apps.get_model('specify', 'Discipline')

        disciplines = Discipline.objects.all()

        for discipline in disciplines:
            for table, fields in MIGRATION_0029_UPDATE_FIELDS.items():
                containers = Splocalecontainer.objects.filter(
                    name=table.lower(),
                    discipline_id=discipline.id,
                )
                for container in containers:
                    for field_name, _, _ in fields:
                        items = Splocalecontaineritem.objects.filter(
                            container=container,
                            name=field_name.lower()
                        )

                        for item in items:
                            item.ishidden = False
                            item.save()

    revert_update_fields(apps)
    revert_update_schema_field(apps)
    reverse_hide_co_component(apps)

# ##########################################
# Used in 0032_add_quantities_gift.py
# ##########################################

def add_quantities_gift(apps):
    def update_fields(apps):
        Discipline = apps.get_model('specify', 'Discipline')

        for discipline in Discipline.objects.all():
            for table, fields in MIGRATION_0032_FIELDS.items(): 
                for field in fields: 
                    update_table_field_schema_config_with_defaults(table, discipline.id, field, apps)

    def update_schema_config_field_desc(apps):
        Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
        Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
        Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')

        for table, fields in MIGRATION_0032_UPDATE_FIELDS.items():
            #i.e: Collection Object
            containers = Splocalecontainer.objects.filter(
                name=table.lower(),
            )

            for container in containers:
                for field_name, new_name, new_desc in fields:
                    #i.e: COType
                    items = Splocalecontaineritem.objects.filter(
                        container=container,
                        name=field_name.lower()
                    )

                    for item in items:
                        localized_items_desc = Splocaleitemstr.objects.filter(itemdesc_id=item.id).first()
                        localized_items_name = Splocaleitemstr.objects.filter(itemname_id=item.id).first()

                        if localized_items_desc is None or localized_items_name is None:
                            continue

                        localized_items_desc.text = new_desc
                        localized_items_desc.save() 

                        localized_items_name.text = new_name
                        localized_items_name.save() 

    update_fields(apps)
    update_schema_config_field_desc(apps)

def revert_add_quantities_gift(apps):
    def revert_update_fields(apps):
        for table, fields in MIGRATION_0032_FIELDS.items(): 
            for field in fields: 
                revert_table_field_schema_config(table, field, apps)

    def revert_update_schema_field(apps):
        Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
        Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')

        for table, fields in MIGRATION_0032_UPDATE_FIELDS.items():
            containers = Splocalecontainer.objects.filter(
                name=table.lower(),
            )
            for container in containers:
                for field_name in fields:
                    items = Splocalecontaineritem.objects.filter(
                        container=container,
                        name=field_name
                    )

                    for item in items:
                        item.ishidden = False
                        item.save()

    revert_update_fields(apps)
    revert_update_schema_field(apps)

# ##########################################
# Used in 0033_update_paleo_desc.py
# ##########################################

def update_paleo_desc(apps):
    def fix_table_description(apps):
        Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
        Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')

        for table_name, table_desc in MIGRATION_0033_TABLES:
            containers = Splocalecontainer.objects.filter(name=table_name.lower(), schematype=0)
            Splocaleitemstr.objects.filter(containerdesc__in=containers).update(text=table_desc)

    fix_table_description(apps)

# ##########################################
# Used in 0034_accession_date_fields.py
# ##########################################

def update_accession_date_fields(apps):
    def update_0034_fields(apps):
        """
        Update table-field schema entries for plain field names
        (e.g., MIGRATION_0034_FIELDS).
        """
        Discipline = apps.get_model('specify', 'Discipline')
        for discipline in Discipline.objects.all():
            for table, fields in MIGRATION_0034_FIELDS.items():
                for field_name in fields:
                    update_table_field_schema_config_with_defaults(table, discipline.id, field_name, apps)

    def update_0034_schema_config_field_desc(apps):
        """
        Update field descriptions and display names using MIGRATION_0034_UPDATE_FIELDS
        (tuple: (fieldName, newLabel, newDesc)).
        """
        Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
        Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
        Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')

        for table, fields in MIGRATION_0034_UPDATE_FIELDS.items():
            containers = Splocalecontainer.objects.filter(name=table.lower())
            for container in containers:
                for (field_name, new_name, new_desc) in fields:
                    items = Splocalecontaineritem.objects.filter(
                        container=container,
                        name=field_name.lower()
                    )
                    for item in items:
                        item.ishidden = True
                        item.save()
                        desc_str = Splocaleitemstr.objects.filter(itemdesc_id=item.id).first()
                        name_str = Splocaleitemstr.objects.filter(itemname_id=item.id).first()
                        if not desc_str or not name_str:
                            continue
                        desc_str.text = new_desc
                        desc_str.save()
                        name_str.text = new_name
                        name_str.save()

    update_0034_fields(apps)
    update_0034_schema_config_field_desc(apps)

def revert_update_accession_date_fields(apps):
    def revert_0034_fields(apps):
        """
        Revert table-field entries for plain field names.
        """
        for table, fields in MIGRATION_0034_FIELDS.items():
            for field_name in fields:
                revert_table_field_schema_config(table, field_name, apps)

    def revert_0034_schema_config_field_desc(apps):
        """
        Revert the field name/description updates.
        """
        Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
        Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')

        for table, fields in MIGRATION_0034_UPDATE_FIELDS.items():
            containers = Splocalecontainer.objects.filter(name=table.lower())
            for container in containers:
                for (field_name, _, _) in fields:
                    items = Splocalecontaineritem.objects.filter(
                        container=container,
                        name=field_name.lower()
                    )
                    for item in items:
                        # If needed, reset ishidden or revert text
                        pass

    revert_0034_fields(apps)
    revert_0034_schema_config_field_desc(apps)

# ##########################################
# Used in 0035_version_required.py
# ##########################################

def update_version_required(apps):
    Discipline = apps.get_model('specify', 'Discipline')
    updated_config_params = {
        'isrequired': False,
    }

    # Update the schema config for each discipline with the version isHidden change
    for discipline in Discipline.objects.all():
        for table, fields in MIGRATION_0035_FIELDS.items():
            for field in fields:    
                update_table_field_schema_config_params(table, discipline.id, field, updated_config_params, apps)

def revert_version_required(apps):
    Discipline = apps.get_model('specify', 'Discipline')
    updated_config_params = {
        'isrequired': True,
    }

    # Revert the schema config for each discipline with the version isHidden change
    for discipline in Discipline.objects.all():
        for table, fields in MIGRATION_0035_FIELDS.items():
            for field in fields:    
                update_table_field_schema_config_params(table, discipline.id, field, updated_config_params, apps)

# ##########################################
# Used in 0039_agent_fields_for_loan_and_gift.py
# ##########################################

def update_loan_and_gift_agent_fields(apps):
    Discipline = apps.get_model('specify', 'Discipline')
    for discipline in Discipline.objects.all():
        for table, fields in MIGRATION_0038_FIELDS.items():
            for field_name in fields:
                update_table_field_schema_config_with_defaults(table, discipline.id, field_name, apps)

def revert_loan_and_gift_agent_fields(apps):
    for table, fields in MIGRATION_0038_FIELDS.items():
        for field_name in fields:
            revert_table_field_schema_config(table, field_name, apps)

def update_loan_and_gift_agents(apps):
    """
    Update field descriptions and display names using MIGRATION_0038_UPDATE_FIELDS
    (tuple: (fieldName, newLabel, newDesc)).
    """
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
    Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')

    def upsert_single_str(*, itemdesc_id=None, itemname_id=None, text=""):
        if (itemdesc_id is None) == (itemname_id is None):
            raise ValueError("Exactly one of itemdesc_id or itemname_id must be provided")

        qs = Splocaleitemstr.objects.filter(
            itemdesc_id=itemdesc_id,
            itemname_id=itemname_id,
        ).order_by("id")

        obj = qs.first()
        if obj is None:
            return Splocaleitemstr.objects.create(
                itemdesc_id=itemdesc_id,
                itemname_id=itemname_id,
                text=text,
            )

        qs.exclude(id=obj.id).delete()

        if obj.text != text:
            obj.text = text
            obj.save(update_fields=["text"])

        return obj

    for table, fields in MIGRATION_0038_UPDATE_FIELDS.items():
        containers = Splocalecontainer.objects.filter(name=table.lower())

        for container in containers:
            for (field_name, new_name, new_desc) in fields:
                items = Splocalecontaineritem.objects.filter(
                    container=container,
                    name=field_name.lower(),
                )

                for item in items:
                    # Hide the existing field
                    if not item.ishidden:
                        item.ishidden = True
                        item.save(update_fields=["ishidden"])

                    upsert_single_str(itemdesc_id=item.id, text=new_desc)
                    upsert_single_str(itemname_id=item.id, text=new_name)

def revert_loan_and_gift_agents(apps):
    """
    Revert the field name/description updates.
    """
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')

    for table, fields in MIGRATION_0038_UPDATE_FIELDS.items():
        containers = Splocalecontainer.objects.filter(name=table.lower())
        for container in containers:
            for (field_name, _, _) in fields:
                items = Splocalecontaineritem.objects.filter(
                    container=container,
                    name=field_name.lower()
                )
                for item in items:
                    # If needed, reset ishidden or revert text
                    pass

# ##########################################
# Used in 0040_components.py
# ##########################################

def remove_0029_schema_config_fields(apps, schema_editor=None):
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
    Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')

    FIELDS_TO_REMOVE = MIGRATION_0029_UPDATE_FIELDS
    for table, fields in FIELDS_TO_REMOVE.items():
        items = Splocalecontaineritem.objects.filter(
            container__name=table.lower(),
            container__schematype=0,
            # we only need the field name from the tuple of Schema Config information
            name__in=list(map(lambda f: f[0].lower(), fields))
        )

        # Delete field labels (captions) and descriptions (Splocaleitemstr) associated with the fields
        Splocaleitemstr.objects.filter(
            Q(itemdesc__in=items) | Q(itemname__in=items)
        ).delete()

        items.delete()

def create_table_schema_config_with_defaults(apps, schema_editor=None):
    Discipline = apps.get_model('specify', 'Discipline')
    for discipline in Discipline.objects.all():
        for table, desc in MIGRATION_0040_TABLES:
            update_table_schema_config_with_defaults(table, discipline.id, desc, apps)

        for table, fields in MIGRATION_0040_FIELDS.items():
            for field in fields:
                update_table_field_schema_config_with_defaults(table, discipline.id, field, apps)

def update_schema_config_field_desc_for_components(apps, schema_editor=None):
    Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')

    for table, fields in MIGRATION_0040_UPDATE_FIELDS.items():
        for field_name, new_name, new_desc in fields:

            Splocaleitemstr.objects.filter(
                itemdesc__container__name=table.lower(),
                itemdesc__container__schematype=0,
                itemdesc__name=field_name.lower()
            ).update(text=new_desc)

            Splocaleitemstr.objects.filter(
                itemname__container__name=table.lower(),
                itemname__container__schematype=0,
                itemname__name=field_name.lower()
            ).update(text=new_name)

def update_hidden_prop_for_compoenents(apps, schema_editor=None):
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')

    for table, fields in MIGRATION_0040_FIELDS.items():
        Splocalecontaineritem.objects.filter(
            container__name=table.lower(),
            container__schematype=0,
            name__in=list(map(lambda f: f.lower(), fields))
        ).update(ishidden=True)

def create_cotype_splocalecontaineritem_for_components(apps):
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
    PICKLIST_NAME = 'CollectionObjectType'
    FIELD_NAME = 'type'

    # Create a Splocalecontaineritem record for each Component Splocalecontainer
    # NOTE: Each discipline has its own Component Splocalecontainer
    Splocalecontaineritem.objects.filter(
        container__name='component',
        container__schematype=0,
        name=FIELD_NAME
    ).update(
        picklistname=PICKLIST_NAME,
        isrequired=True,
        type='ManyToOne',
    )

def hide_component_fields(apps, schema_editor=None):
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')

    for table, fields in MIGRATION_0040_HIDDEN_FIELDS.items():
        Splocalecontaineritem.objects.filter(
            container__name=table.lower(),
            container__schematype=0,
            name__in=list(map(lambda f: f.lower(), fields))
        ).update(ishidden=True)

def restore_0029_schema_config_fields(apps, schema_editor=None):
    Discipline = apps.get_model('specify', 'Discipline')
    FIELDS_TO_REMOVE = MIGRATION_0029_UPDATE_FIELDS
    for discipline in Discipline.objects.all():
        for table, fields in FIELDS_TO_REMOVE.items():
            for field_name, _, _ in fields:
                update_table_field_schema_config_with_defaults(table, discipline.id, field_name, apps)

def revert_table_schema_config_with_defaults(apps, schema_editor=None):
    for table, _ in MIGRATION_0040_TABLES:
        revert_table_schema_config(table, apps)
    for table, fields in MIGRATION_0040_FIELDS.items():
        for field in fields:
            revert_table_field_schema_config(table, field, apps)

def reverse_hide_component_fields(apps, schema_editor=None):
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
    Discipline = apps.get_model('specify', 'Discipline')

    for discipline in Discipline.objects.all():
        for table, fields in MIGRATION_0040_HIDDEN_FIELDS.items():
            containers = Splocalecontainer.objects.filter(
                name=table.lower(),
                discipline_id=discipline.id,
            )
            for container in containers:
                for field_name in fields:
                    items = Splocalecontaineritem.objects.filter(
                        container=container,
                        name=field_name.lower()
                    )
                    items.update(ishidden=True)
                    
def componets_schema_config_migrations(apps, schema_editor=None):
        remove_0029_schema_config_fields(apps, schema_editor)
        create_table_schema_config_with_defaults(apps, schema_editor)
        update_schema_config_field_desc(apps, schema_editor)
        update_hidden_prop(apps, schema_editor)
        create_cotype_splocalecontaineritem(apps)
        hide_component_fields(apps, schema_editor)

# ##########################################
# Used in 0042_discipline_type_picklist.py
# ##########################################

from specifyweb.backend.context.app_resource import DISCIPLINE_NAMES

DISCIPLINE_TYPE_PICKLIST_NAME = 'DisciplineType'

def create_discipline_type_picklist(apps):
    Collection = apps.get_model('specify', 'Collection')
    Picklist = apps.get_model('specify', 'Picklist')
    Picklistitem = apps.get_model('specify', 'Picklistitem')

    # Create a discipline type picklist for each collection
    for collection in Collection.objects.all():
        picklist, created = Picklist.objects.get_or_create(
            name=DISCIPLINE_TYPE_PICKLIST_NAME,
            type=0,
            collection=collection,
            defaults={
                "issystem": True,
                "readonly": True,
                "sizelimit": -1,
                "sorttype": 1,
            }
        )
        # If the picklist doesn't exist, create a new one
        if created:
            ordinal = 1
            items = []
            for value, title in DISCIPLINE_NAMES.items():
                items.append(
                    Picklistitem(
                        picklist=picklist,
                        ordinal=ordinal,
                        value=value,
                        title=title,
                    )
                )
                ordinal += 1
            Picklistitem.objects.bulk_create(items)

def revert_discipline_type_picklist(apps):
    Picklist = apps.get_model('specify', 'Picklist')

    Picklist.objects.filter(name=DISCIPLINE_TYPE_PICKLIST_NAME).delete()

def update_discipline_type_splocalecontaineritem(apps):
    Splocalecontaineritem = apps.get_model("specify", "Splocalecontaineritem")

    Splocalecontaineritem.objects.filter(
        container__name="discipline",
        container__schematype=0,
        name="type",
    ).update(picklistname=DISCIPLINE_TYPE_PICKLIST_NAME, isrequired=True)

def revert_discipline_type_splocalecontaineritem(apps):
    Splocalecontaineritem = apps.get_model("specify", "Splocalecontaineritem")

    Splocalecontaineritem.objects.filter(
        container__name="discipline",
        container__schematype=0,
        name="type",
    ).update(picklistname=None, isrequired=None)
