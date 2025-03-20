import re

from typing import NamedTuple, List
import logging

from django.db.models import Q, Count
from django.apps import apps as global_apps

from specifyweb.specify.load_datamodel import Table, FieldDoesNotExistError, TableDoesNotExistError
from specifyweb.specify.model_extras import GEOLOGY_DISCIPLINES, PALEO_DISCIPLINES
from specifyweb.specify.models import (
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
)

logger = logging.getLogger(__name__)

HIDDEN_FIELDS = [
    "timestampcreated", "timestampmodified", "version", "createdbyagent", "modifiedbyagent"
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
    Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')

    try:
        table: Table = datamodel.get_table_strict(table_name)
    except TableDoesNotExistError:
        logger.warning(
            f"Table does not exist in latest state of the datamodel, skipping Schema Config entry for: {table_name}"
        )
        return

    table_config = TableSchemaConfig(
        name=table.name,
        discipline_id=discipline_id,
        schema_type=0,
        description=camel_to_spaced_title_case(uncapitilize(table.name)) if description is None else description,
        language="en"
    )

    # Create Splocalecontainer for the table
    sp_local_container, _ = Splocalecontainer.objects.get_or_create(
        name=table_config.name.lower(),
        discipline_id=discipline_id,
        schematype=table_config.schema_type,
        ishidden=False,
        issystem=table.system,
        version=0,
    )

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
        update_table_field_schema_config_with_defaults(table_name, discipline_id, field.name, apps)


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
    try:
        table: Table = datamodel.get_table_strict(table_name)
    except TableDoesNotExistError:
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

    sp_local_container, _ = Splocalecontainer.objects.get_or_create(
        name=table.name.lower(),
        discipline_id=discipline_id,
        schematype=table_config.schema_type,
    )

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

# ##############################################################################
# Migration schema config helper functions
# ##############################################################################

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

def revert_cotype_splocalecontaineritem(apps):
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
    Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')

    Splocaleitemstr.objects.filter(
        text=COT_TEXT,
        itemdesc__container__name="collectionobject",
        itemdesc__container__schematype=0,
    ).delete()
    Splocaleitemstr.objects.filter(
        text=COT_TEXT,
        itemname__container__name="collectionobject",
        itemname__container__schematype=0,
    ).delete()
    Splocalecontaineritem.objects.filter(
        name=COT_FIELD_NAME, container__name="collectionobject", container__schematype=0
    ).delete()

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
        if Picklist.objects.filter(
            name=AGETYPE_PICKLIST_NAME,
            type=0,
            collection_id=collection.id
        ).exists(): 
            continue

        age_type_picklist = Picklist.objects.create(
            name=AGETYPE_PICKLIST_NAME,
            issystem=False,
            readonly=False,
            sizelimit=-1,
            sorttype=1,
            type=0,
            collection=collection
        )
        for age_type in DEFAULT_AGE_TYPES:
            PicklistItem.objects.create(
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
        Picklist.objects.get_or_create(
            name=COG_PICKLIST_NAME,
            issystem=True,
            readonly=True,
            sizelimit=-1,
            sorttype=1,
            type=1,
            tablename='collectionobjectgrouptype',
            collection=collection,
            formatter='CollectionObjectGroupType'
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
            table = datamodel.get_table_strict(table_name)
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
            table = datamodel.get_table_strict(table_name)
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
                for field_name in fields:
                    items = Splocalecontaineritem.objects.filter(
                        container=container,
                        name=field_name.lower()
                    )

                    for item in items:
                        item.ishidden = True
                        item.save()

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
                for field_name in fields:
                    items = Splocalecontaineritem.objects.filter(
                        container=container,
                        name=field_name.lower()
                    )

                    for item in items:
                        item.ishidden = False
                        item.save()

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

    for table, fields in MIGRATION_0023_FIELDS_BIS.items():
        containers = Splocalecontainer.objects.filter(
            name=table.lower(),
            schematype=0
        )
        for container in containers:
            items = Splocalecontaineritem.objects.filter(
                container=container,
                name__in=[field_name.lower() for field_name in fields]
            )
            logger.info(f"Updating {items.count()} items for table {table} and container {container.id}")
            items.update(ishidden=True)

    duplicates = (
        Splocalecontaineritem.objects.values("container", "name")
        .annotate(count=Count("id"))
        .filter(count__gt=1)
    )
    for duplicate in duplicates:
        container_id = duplicate['container']
        name = duplicate['name']
        duplicate_items = Splocalecontaineritem.objects.filter(container_id=container_id, name=name)
        item_to_keep = duplicate_items.first()
        items_to_delete = duplicate_items.exclude(id=item_to_keep.id)

        Splocaleitemstr.objects.filter(itemdesc_id__in=items_to_delete).update(itemdesc_id=item_to_keep.id)
        Splocaleitemstr.objects.filter(itemname_id__in=items_to_delete).update(itemname_id=item_to_keep.id)
        items_to_delete.delete()

def reverse_update_hidden_prop(apps, schema_editor=None):
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')

    for table, fields in MIGRATION_0023_FIELDS_BIS.items():
        containers = Splocalecontainer.objects.filter(
            name=table.lower(),
        )
        for container in containers:
            items = Splocalecontaineritem.objects.filter(
                container=container,
                name__in=[field_name.lower() for field_name in fields]
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
