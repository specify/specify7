from typing import TypedDict, NotRequired
import logging
from collections import defaultdict

from django.db.models import Q, Exists, OuterRef, F, Window
from django.db import transaction, connection
from django.db.models.functions import RowNumber
from django.apps import apps as global_apps

from specifyweb.specify.models_utils.load_datamodel import FieldDoesNotExistError, TableDoesNotExistError
from specifyweb.specify.models import datamodel
from specifyweb.specify.migration_utils.SchemaReader import (
    TableSchemaConfig,
    FieldSchemaConfig,
    TableDefaults,
    bulk_create_splocaleitemstr_idempotent,
    camel_to_spaced_title_case,
    find_missing_schema_config_fields,
    uncapitilize,
    HIDDEN_FIELDS,
    datamodel_type_to_schematype
)

logger = logging.getLogger(__name__)

class FieldDefaults(TypedDict):
    name: NotRequired[str]
    desc: NotRequired[str]
    ishidden: NotRequired[bool]
    isrequired: NotRequired[bool]
    picklistname: NotRequired[str]

def update_table_schema_config_with_defaults(
    table_name,
    discipline_id: int,
    description: str | None = None,
    apps = global_apps,
    defaults: TableDefaults | None = None,
    pending_itemstr_rows: list[dict] | None = None,
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

    flush_itemstr_at_end = pending_itemstr_rows is None
    if flush_itemstr_at_end:
        pending_itemstr_rows = []

    try:
        table_defaults = defaults if defaults is not None else TableDefaults()
        table_name_str = table_defaults.get('name', camel_to_spaced_title_case(uncapitilize(table.name)))
        table_desc_str = table_defaults.get('desc', camel_to_spaced_title_case(uncapitilize(table.name)))

        table_config = TableSchemaConfig(
            name=table.name,
            discipline_id=discipline_id,
            schema_type=0,
            description=table_desc_str if description is None else description,
            language="en",
        )

        container_attrs = {
            "name": table_config.name.lower(),
            "discipline_id": discipline_id,
            "schematype": table_config.schema_type
        }

        fetched_sp_locale_container = Splocalecontainer.objects.filter(**container_attrs).order_by("id").first()

        if fetched_sp_locale_container is None:
            sp_local_container = Splocalecontainer.objects.create(**{
                **container_attrs,
                "ishidden": False,
                "issystem": table.system,
                "version": 0,
            })
        else:
            sp_local_container = fetched_sp_locale_container

        if Splocalecontaineritem.objects.filter(
            container=sp_local_container,
            name=table_config.name.lower(),
        ).exists():
            return

        item_str_rows = []
        for k, text in {
            "containername": table_name_str,
            "containerdesc": table_desc_str,
        }.items():
            item_str_rows.append(
                {
                    "text": text,
                    "language": "en",
                    "version": 0,
                    k: sp_local_container,
                }
            )

        pending_itemstr_rows.extend(item_str_rows)

        for field in table._all_fields(exclude_id_field=True):
            field_defaults = None
            if table_defaults.get('items'):
                field_defaults = table_defaults['items'].get(field.name.lower())

            update_table_field_schema_config_with_defaults(
                table_name,
                discipline_id,
                field.name,
                apps,
                defaults=field_defaults,
                pending_itemstr_rows=pending_itemstr_rows,
            )

    finally:
        if flush_itemstr_at_end and pending_itemstr_rows:
            bulk_create_splocaleitemstr_idempotent(Splocaleitemstr, pending_itemstr_rows)

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

class FieldDefaults(TypedDict):
    name: NotRequired[str]
    desc: NotRequired[str]
    ishidden: NotRequired[bool]
    isrequired: NotRequired[bool]
    picklistname: NotRequired[str]

def update_table_field_schema_config_with_defaults(
    table_name,
    discipline_id: int,
    field_name: str,
    apps = global_apps,
    defaults: FieldDefaults | None = None,
    pending_itemstr_rows: list[dict] | None = None,
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

    sp_local_container = (
        Splocalecontainer.objects.filter(
            name=table.name.lower(),
            discipline_id=discipline_id,
            schematype=table_config.schema_type,
        )
        .order_by('id')
            .first()
    )

    if sp_local_container is None:
        sp_local_container = Splocalecontainer.objects.create(
            name=table.name.lower(),
            discipline_id=discipline_id,
            schematype=table_config.schema_type,
            ishidden=False,
            issystem=table.system,
            version=0,
        )

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

    # Apply defaults if provided
    field_name_str = camel_to_spaced_title_case(field.name)
    field_desc_str = camel_to_spaced_title_case(field.name)
    field_hidden = field_name.lower() in HIDDEN_FIELDS
    field_required = field.required
    picklist_name = None
    if defaults is not None:
        field_name_str = defaults.get('name', field_name_str)
        field_desc_str = defaults.get('desc', field_desc_str)
        field_hidden = defaults.get('ishidden', field_hidden)
        field_required = defaults.get('isrequired', field_required)
        picklist_name = defaults.get('picklistname', picklist_name)

    field_config = FieldSchemaConfig(
        name=field_name,
        column=field.column,
        java_type=datamodel_type_to_schematype(field.type) if field.is_relationship else field.type,
        description=field_desc_str,
        language="en"
    )

    container_item_attrs = {
        "name": field_config.name,
        "container": sp_local_container
    }

    fetched_sp_locale_container_item = Splocalecontaineritem.objects.filter(**container_item_attrs).order_by("id").first()

    if fetched_sp_locale_container_item is None:
        sp_locale_container_item = Splocalecontaineritem.objects.create(**{
            **container_item_attrs,
            "type": field_config.java_type,
            "ishidden": field_hidden,
            "isrequired": field_required,
            "issystem": table.system,
            "version": 0,
            "picklistname": picklist_name
            }
        )
    else:
        sp_locale_container_item = fetched_sp_locale_container_item

    itm_str_rows = []
    for k, text in {
        "itemname": field_name_str,
        "itemdesc": field_desc_str,
    }.items():
        row = {
            "text": text,
            "language": "en",
            "version": 0,
            k: sp_locale_container_item,
        }
        itm_str_rows.append(row)

    if pending_itemstr_rows is None:
        bulk_create_splocaleitemstr_idempotent(Splocaleitemstr, itm_str_rows)
    else:
        pending_itemstr_rows.extend(itm_str_rows)

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

    sp_local_container = (
        Splocalecontainer.objects.filter(
            name=table.name.lower(),
            discipline_id=discipline_id,
            schematype=table_config.schema_type,
        )
        .order_by('id')
            .first()
    )

    if sp_local_container is None:
        sp_local_container = Splocalecontainer.objects.create(
            name=table.name.lower(),
            discipline_id=discipline_id,
            schematype=table_config.schema_type,
            ishidden=False,
            issystem=table.system,
            version=0,
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

    qs = Splocalecontaineritem.objects.filter(
        name=field_config.name,
        container=sp_local_container,
        type=field_config.java_type,
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

def create_missing_schema_config_fields(discipline_id: int, apps=global_apps, stdout=None):
    missing_tables, missing_fields = find_missing_schema_config_fields(discipline_id, apps=apps)
    missing_table_set = set(missing_tables)

    for table_name in missing_tables:
        if stdout is not None:
            stdout(f"Creating schema config table container for {table_name}...")
        update_table_schema_config_with_defaults(table_name, discipline_id, apps=apps)

    for table_name, fields in missing_fields.items():
        if table_name in missing_table_set:
            continue
        for field_name in fields:
            if stdout is not None:
                stdout(f"Creating schema config field {table_name}.{field_name}...")
            update_table_field_schema_config_with_defaults(table_name, discipline_id, field_name, apps=apps)

    return missing_tables, missing_fields

def deduplicate_schema_config_sql(apps=None):
    dedupe_sql = '''
    /*

    This script removes duplicate entries in the `splocalecontaineritem` table.

    The safe dedupe key is the concrete container row plus the item name:
    `SpLocaleContainerID` + `Name`.

    Why this matters:
    - Schema config containers can share the same logical table name inside a
     discipline while still being distinct rows.
    - Grouping by discipline + table name + field name can collapse valid rows
     from different containers that merely happen to share the same name.
    - Keeping the first row for a specific container/name pair preserves real
     schema config entries and only removes true duplicates.

    Any duplicate rows are deleted together with their dependent string rows.

    */


    -- 1. Identify all duplicate Container Item IDs
    -- We group by the concrete container row and the field name.
    -- Only schema-type 0 containers are eligible for this cleanup.
    -- We keep the record with the lowest ID (rn = 1) and mark the rest (rn > 1)
    CREATE TEMPORARY TABLE container_items_to_delete AS
    SELECT 
        sub.SpLocaleContainerItemID
    FROM (
        SELECT 
            slci.SpLocaleContainerItemID,
            ROW_NUMBER() OVER (
                PARTITION BY slci.SpLocaleContainerID, slci.Name 
                ORDER BY slci.SpLocaleContainerItemID ASC
            ) as rn
        FROM splocalecontaineritem slci
        JOIN splocalecontainer slc ON slci.SpLocaleContainerID = slc.SpLocaleContainerID
        WHERE slc.SchemaType = 0
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

def deduplicate_splocalecontainers(apps):
    Container = apps.get_model('specify', 'SpLocaleContainer')
    ContainerItem = apps.get_model('specify', 'SpLocaleContainerItem')
    ItemStr = apps.get_model('specify', 'SpLocaleItemStr')

    with transaction.atomic():
        # Find duplicate SpLocaleContainers
        # A duplicate should be in the same discipline and have the same name
        # and schematype
        # For this query we consider the oldest SpLocaleContainer as the
        # "cannonical" record, and all later records as the duplicates
        # We could be a little smarter about this and also check the associated
        # container items and strings, but this should be minimally sufficient
        # without sacrificing complexity and speed
        # See #7988
        duplicate_containers = Container.objects.filter(schematype=0).annotate(
            earlier_exists=Exists(
                Container.objects.filter(
                    discipline_id=OuterRef('discipline_id'),
                    schematype=0,
                    name=OuterRef('name'),
                    timestampcreated__lt=OuterRef('timestampcreated')
                )
            )
        ).filter(earlier_exists=True)

        # Remove the items and strings shouldn't be strictly neccesary as they
        # should both cascade if we call duplicate_containers.delete()
        # But this is the safer option for any edge cases with historical
        # models in migrations and if we ever decide to change the delete
        # behavior later down the line
        # Plus, I don't think the performance impact should be **that**
        # significantly different...
        duplicate_items = ContainerItem.objects.filter(container__in=duplicate_containers)
        ItemStr.objects.filter(itemname__in=duplicate_items).delete()
        ItemStr.objects.filter(itemdesc__in=duplicate_items).delete()
        duplicate_items.delete()

        ItemStr.objects.filter(containername__in=duplicate_containers).delete()
        ItemStr.objects.filter(containerdesc__in=duplicate_containers).delete()
        duplicate_containers.delete()

def deduplicate_containeritems_and_strings(apps):
    ContainerItem = apps.get_model('specify', 'SpLocaleContainerItem')
    ItemStr = apps.get_model('specify', 'SpLocaleItemStr')
    with transaction.atomic():
        # Identify duplicate container items using a Window function.
        # Partition by container_id + item name only.
        # Only schema type 0 containers (standard schema) are eligible for this cleanup.
        # The schema type 1 refers to the WorkBench Schema from Specify 6, which has
        # a different structure and should not be modified by this cleanup.
        #
        # Why this key:
        # - Rows are only true duplicates when they refer to the same concrete
        #   container row and the same field name.
        # - Earlier broad grouping by discipline/container-name/field-name could
        #   collapse valid rows from different containers that happened to share
        #   names, causing missing Schema Config fields after dedupe.
        # - This narrower key preserves legitimate rows and only removes
        #   duplicates that are semantically equivalent.
        qs = ContainerItem.objects.filter(
            container__schematype=0,
        ).annotate(
            rn=Window(
                expression=RowNumber(),
                partition_by=[
                    F('container_id'),
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

def deduplicate_schema_config_orm(apps, schema_editor=None):
    with transaction.atomic():
        deduplicate_splocalecontainers(apps)
        deduplicate_containeritems_and_strings(apps)