import logging
from typing import TypedDict, Required, NotRequired, Unpack

from django.db.models import Q, Model
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
    datamodel_type_to_schematype
)

HIDDEN_FIELDS = [
    "timestampcreated", "timestampmodified", "version", "createdbyagent", "modifiedbyagent"
]

logger = logging.getLogger(__name__)

class ContainerAttrs(TypedDict):
    name: Required[str]
    discipline_id: Required[int]
    schematype: NotRequired[int]
    ishidden: NotRequired[bool]
    issystem: NotRequired[bool]
    version: NotRequired[int]

class ContainerItemAttrs(TypedDict):
    name: Required[str]
    format: NotRequired[str | None]
    ishidden: NotRequired[bool]
    isrequired: NotRequired[bool | None]
    issystem: NotRequired[bool | None]
    isuiformatter: NotRequired[bool | None]
    picklistname: NotRequired[str | None]
    type: NotRequired[str | None]
    weblinkname: NotRequired[str | None]
    field_label: NotRequired[str | None]
    field_description: NotRequired[str | None]

def create_localization_strings(Splocaleitemstr, rows: list[dict]):
    common_string_attrs = {
        "language": "en",
        "version": 0
    }
    resolved_rows = [{**common_string_attrs, **row} for row in rows]
    return bulk_create_splocaleitemstr_idempotent(Splocaleitemstr, resolved_rows)


def get_or_create_splocalecontainer(Splocalecontainer, Splocaleitemstr, table_label: str | None = None, table_description: str | None = None, **container_attrs: Unpack[ContainerAttrs]):
    if "name" not in container_attrs.keys():
        raise ValueError("Trying to create a SpLocaleContainer without a name!")

    if "discipline_id" not in container_attrs.keys():
        raise ValueError("Trying to create a SpLocaleContianer without a Discipline")

    resolved_container_attrs: ContainerAttrs = {
        "ishidden": False,
        "issystem": False,
        "schematype": 0,
        "version": 0,
        # The order of this unpacking matters
        # If the defaults were specified in container_attrs, make sure to prioritize them over the defaults
        **container_attrs
    }

    string_label = resolved_container_attrs["name"]
    resolved_container_attrs['name'] = resolved_container_attrs['name'].lower()

    sp_local_container = (
        Splocalecontainer.objects.filter(
            name=resolved_container_attrs['name'],
            discipline_id=resolved_container_attrs['discipline_id'],
            schematype=resolved_container_attrs['schematype']
        )
        .order_by('pk')
        .first()
    )

    if sp_local_container is not None:
        # BUG?: Not sure if we want to handle also checking for and (if needed)
        # creating the container strings here
        return sp_local_container

    sp_local_container = Splocalecontainer.objects.create(**resolved_container_attrs)

    container_string_rows = [
        {
            "containername": sp_local_container,
            "text": table_label or camel_to_spaced_title_case(uncapitilize(string_label))
        },
        {
            "containerdesc": sp_local_container,
            "text": table_description or camel_to_spaced_title_case(uncapitilize(string_label))
        }
    ]
    create_localization_strings(Splocaleitemstr, container_string_rows)
    return sp_local_container

def get_or_create_splocalecontaineritem(
        Splocalecontaineritem: type[Model],
        Splocaleitemstr: type[Model],
        container: Model,
        *,
        field_label: str | None = None,
        field_description: str | None = None,
        **container_item_attrs: Unpack[ContainerItemAttrs]
):
    if "name" not in container_item_attrs.keys():
        raise ValueError("Trying to create a SpLocaleContainerItem without a name!")

    table_name = container.name
    table = datamodel.get_table(table_name)

    # BUG: The splocalecontainer related tables can still exist in the database,
    # and this will result in skipping any operation if the table/field is
    # removed, renamed, etc.
    if table is None:
        logger.warning(f"Table does not exist in latest state of the datamodel, skipping Schema Config entry for: {table_name}")
        return

    field_name = container_item_attrs["name"]

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
    
    resolved_item_attrs: ContainerItemAttrs = {
        "format": None,
        "ishidden": field_name.lower() in HIDDEN_FIELDS,
        "isrequired": field.required,
        "issystem": False,
        "isuiformatter": False,
        "picklistname": None,
        "type": datamodel_type_to_schematype(field.type) if field.is_relationship else field.type,
        "weblinkname": None,
        "container_id": container.pk,
        # The order of this unpacking matters
        # If the defaults were specified in container_item_attrs, make sure to
        # prioritize them over the defaults
        **container_item_attrs,
    }

    container_item = (
        Splocalecontaineritem.objects.filter(
            name__iexact=resolved_item_attrs['name'],
            container_id=container.pk
        )
        .order_by('pk')
        .first()
    )
    if container_item is not None:
        # BUG?: Not sure if we want to handle also checking for and (if needed)
        # creating the field strings here
        return container_item

    container_item = Splocalecontaineritem.objects.create(**resolved_item_attrs)
    item_string_rows = [
        {
            "itemname": container_item,
            "text": field_label or camel_to_spaced_title_case(field.name)
        },
        {
            "itemdesc": container_item,
            "text": field_description or camel_to_spaced_title_case(field.name)
        }
    ]
    create_localization_strings(Splocaleitemstr, item_string_rows)
    return container_item

def update_table_schema_config_with_defaults(
    table_name,
    discipline_id: int,
    apps = global_apps,
    defaults: TableDefaults | None = None
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

    table_defaults = defaults if defaults is not None else TableDefaults()
    table_name_str = table_defaults.get('name', camel_to_spaced_title_case(uncapitilize(table.name)))
    table_desc_str = table_defaults.get('desc', camel_to_spaced_title_case(uncapitilize(table.name)))

    container_attrs = {
        "name": table.name.lower(),
        "discipline_id": discipline_id,
    }

    sp_locale_container = get_or_create_splocalecontainer(
        Splocalecontainer,
        Splocaleitemstr,
        table_label=table_name_str,
        table_description=table_desc_str,
        **container_attrs
    )

    for field in table._all_fields(exclude_id_field=True):
        field_defaults = {}
        if table_defaults.get('items'):
            field_defaults = table_defaults['items'].get(field.name.lower(), dict())

        field_label = field_defaults.pop("name", None)
        field_desc = field_defaults.pop("desc", None)
        get_or_create_splocalecontaineritem(
            Splocalecontaineritem,
            Splocaleitemstr,
            container=sp_locale_container,
            field_label=field_label,
            field_description=field_desc,
            **field_defaults,
            name=field.name
        )

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

    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')

    sp_local_container = get_or_create_splocalecontainer(
        Splocalecontainer,
        Splocaleitemstr,
        name=table.name,
        discipline_id=discipline_id
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

    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
    Splocaleitemstr = apps.get_model('specify', 'Splocaleitemstr')

    sp_local_container = get_or_create_splocalecontainer(
        Splocalecontainer,
        Splocaleitemstr,
        discipline_id=discipline_id,
        name=table.name
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
