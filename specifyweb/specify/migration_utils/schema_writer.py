from typing import TypedDict, NotRequired
import logging
from typing import NamedTuple, TypedDict, NotRequired

from django.db.models import Q
from django.apps import apps as global_apps

from specifyweb.specify.models_utils.load_datamodel import FieldDoesNotExistError
from specifyweb.specify.models import datamodel
from specifyweb.specify.migration_utils.schema_reader import (
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

class TableSchemaConfig(NamedTuple):
    name: str
    discipline_id: int
    schema_type: int = 0
    description: str = "TBD"
    language: str = "en"

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

    containers = Splocalecontainer.objects.filter(
        name=table_name.lower(),
        schematype=0,
    )    
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

    containers = Splocalecontainer.objects.filter(
        name=table_name.lower(),
        schematype=0,
    )
    items = Splocalecontaineritem.objects.filter(
        container__in=containers,
        name__iexact=field_name,
    )
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
