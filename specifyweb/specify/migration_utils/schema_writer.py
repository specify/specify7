import logging
from typing import TypedDict, Required, NotRequired, Unpack, Iterable, cast

from django.db.models import Q, Model
from django.db.models.functions import Lower
from django.apps import apps as global_apps

from specifyweb.specify.models_utils.load_datamodel import FieldDoesNotExistError, TableDoesNotExistError, Table
from specifyweb.specify.models import datamodel
from specifyweb.specify.migration_utils.utils import batch_query
from specifyweb.specify.migration_utils.schema_reader import (
    bulk_create_splocaleitemstr_idempotent,
    camel_to_spaced_title_case,
    find_missing_schema_config_fields,
    uncapitilize,
    datamodel_type_to_schematype
)
from specifyweb.backend.setup_tool.schema_defaults import read_schema_config_defaults, SchemaDefaults, TableDefaults, FieldDefaults

HIDDEN_FIELDS = [
    "timestampcreated", "timestampmodified", "version", "createdbyagent", "modifiedbyagent"
]

logger = logging.getLogger(__name__)

class ContainerAttrs(TypedDict):
    name: Required[str]
    discipline_id: Required[int]
    type: NotRequired[str | None]
    schematype: NotRequired[int]
    ishidden: NotRequired[bool]
    issystem: NotRequired[bool]
    version: NotRequired[int]
    aggregator: NotRequired[str | None]
    defaultui: NotRequired[str | None]
    format: NotRequired[str | None]
    isuiformatter: NotRequired[bool | None]
    picklistname: NotRequired[str | None]

class ContainerItemAttrs(TypedDict):
    name: Required[str]
    type: NotRequired[str | None]
    format: NotRequired[str | None]
    ishidden: NotRequired[bool]
    isrequired: NotRequired[bool | None]
    issystem: NotRequired[bool | None]
    isuiformatter: NotRequired[bool | None]
    picklistname: NotRequired[str | None]
    type: NotRequired[str | None]
    weblinkname: NotRequired[str | None]
    container_id: NotRequired[int | None]

class SchemaWriterError(Exception):
    ...

class MissingRequiredAttribute(SchemaWriterError):
    ...

class SchemaFieldBuilder:
    def __init__(self, table: Table, field_defaults: FieldDefaults = FieldDefaults(), **attrs: Unpack[ContainerItemAttrs]):
        if "name" not in attrs.keys():
            raise MissingRequiredAttribute("name is required")
        field_name = attrs["name"]
        field = table.get_field(field_name)
        if field is None:
            raise FieldDoesNotExistError(f"{field_name} does not exist on table {table.name}")

        default_localized = camel_to_spaced_title_case(field.name)
        self._label = field_defaults.get('name', default_localized)
        self._description = field_defaults.get('desc', default_localized)
        self._attrs: ContainerItemAttrs = {
            "format": None,
            "ishidden": field_defaults.get('ishidden', field_name.lower() in HIDDEN_FIELDS),
            "isrequired": field_defaults.get('isrequired', field.required),
            "issystem": False,
            "isuiformatter": False,
            "picklistname": field_defaults.get('picklistname'),
            "type": datamodel_type_to_schematype(field.type) if field.is_relationship else field.type,
            "weblinkname": None,
            # The order of this unpacking matters
            # If some defaults were specified in the provided defaults, make
            # sure to use those after the before "global" defaults, but
            # prioritize any provided attrs after the field defaults
            # In other words, the order of precedence goes:
            # attrs -> field defaults -> global defaults
            **self._field_defaults_to_fieldattrs(field_defaults),
            **attrs
        }

    def localize(self, label: str | None = None, description: str | None = None):
        if label is not None:
            self._label = label
        if description is not None:
            self._description = description
        return self

    def _field_defaults_to_fieldattrs(self, field_defaults: FieldDefaults) -> ContainerItemAttrs:
        special_keys = {"name", "desc"}
        return {k:v for k,v in field_defaults.items() if k not in special_keys}

    def _expand_localization_attrs(self, item_id: int):
        return (
            {
                "itemname_id": item_id,
                "text": self._label
            },
            {
                "itemdesc_id": item_id,
                "text": self._description
            }
        )

class SchemaTableBuilder:
    def __init__(self, apps = global_apps, skip_missing_fields: bool = True, table_defaults: TableDefaults = TableDefaults(), **attrs: Unpack[ContainerAttrs]):
        if "name" not in attrs.keys():
            raise MissingRequiredAttribute("name is required")

        if "discipline_id" not in attrs.keys():
            raise MissingRequiredAttribute("discipline_id is required")
        self.apps = apps
        self.skip_missing_fields = skip_missing_fields
        self._table_defaults = table_defaults
        table_name = attrs["name"]

        datamodel_table = datamodel.get_table(table_name)
        if datamodel_table is None:
            raise TableDoesNotExistError(f"{table_name} does not exist in the datamodel")
        self.table = datamodel_table

        self.fields: dict[str, SchemaFieldBuilder] = {}
        default_localized = camel_to_spaced_title_case(uncapitilize(table_name))
        self.label: str = table_defaults.get('name', default_localized)
        self.description: str = table_defaults.get('desc', default_localized)
        self._attrs = {
            "type": None,
            "schematype": 0,
            "ishidden": False,
            "issystem": False,
            "version": 0,
            "aggregator": None,
            "defaultui": None,
            "format": None,
            "isuiformatter": None,
            "picklistname": None,
            # The order of this unpacking matters
            # If some defaults were specified in the provided defaults, make
            # sure to use those after the before "global" defaults, but
            # prioritize any provided attrs after the table defaults
            # In other words, the order of precedence goes:
            # attrs -> table defaults -> global defaults
            **self._table_defaults_to_containerattrs(self._table_defaults),
            **attrs
        }

    def add_field(self, **field_attrs: Unpack[ContainerItemAttrs]) -> SchemaFieldBuilder | None:
        try:
            field_defaults = self._table_defaults.get('items', dict()).get(field_attrs.get('name', '').lower(), FieldDefaults())
            field = SchemaFieldBuilder(
                table=self.table,
                field_defaults=field_defaults,
                **field_attrs
            )
        except FieldDoesNotExistError:
            if self.skip_missing_fields:
                return None
            raise
        field_name = field_attrs["name"].lower()
        self.fields[field_name] = field
        return field

    def localize(self, label: str | None = None, description: str | None = None):
        if label is not None:
            self.label = label
        if description is not None:
            self.description = description

    def execute(self):
        created, container = self._get_or_create_container()
        # If the SpLocaleContainer already existed, we have to check for any
        # existing SpLocaleContainerItem records
        if not created:
            names = map(lambda f: f._attrs["name"].lower(), self.fields.values())
            for _, item_name in self._filter_existing_container_items(container.pk, names):
                self.fields.pop(item_name, "")
        # With any existing SpLocaleContainerItem records removed from
        # self.fields, we create the items that need to be created
        self._create_container_items(container.pk, self.fields.values())
        self._create_all_localization_strings(container.pk)

    def _table_defaults_to_containerattrs(self, table_defaults: TableDefaults) -> ContainerAttrs:
        special_default_keys = {"name", "desc", "items"}
        return {k:v for k,v in table_defaults.items() if k not in special_default_keys}

    def _get_or_create_container(self):
        Splocalecontainer = self.apps.get_model("specify", "Splocalecontainer")
        Splocaleitemstr = self.apps.get_model("specify", "Splocaleitemstr")
        return get_or_create_splocalecontainer(
            Splocalecontainer,
            Splocaleitemstr,
            table_label=self.label,
            table_description=self.description,
            **self._attrs
        )

    def _create_all_localization_strings(self, container_id: int):
        Splocaleitemstr = self.apps.get_model("specify", "Splocaleitemstr")
        localization_strings = []
        localization_strings.extend(self._item_localization_attrs(container_id))
        create_localization_strings(Splocaleitemstr, localization_strings)

    def _item_localization_attrs(self, container_id: int):
        item_strings = []
        names = map(lambda f: f._attrs["name"].lower(), self.fields.values())
        for item_id, item_name in self._filter_existing_container_items(container_id, names):
            item_strings.extend(self.fields[item_name]._expand_localization_attrs(item_id))
        return item_strings

    def _filter_existing_container_items(self, container_id: int, names: Iterable[str]):
        Splocalecontaineritem = self.apps.get_model("specify", "Splocalecontaineritem")
        items_query = Splocalecontaineritem.objects.filter(
            name__in=names,
            container_id=container_id
        ).values_list("pk", Lower("name"))
        for names in batch_query(items_query):
            yield from cast(tuple[tuple[int, str]], names)

    def _create_container_items(self, container_id: int, fields: Iterable[SchemaFieldBuilder]):
        Splocalecontaineritem = self.apps.get_model("specify", "Splocalecontaineritem")
        Splocalecontaineritem.objects.bulk_create(
            [
                Splocalecontaineritem(
                    container_id=container_id,
                    **attrs,
                )
                for attrs in tuple(map(lambda f: f._attrs, fields))
            ]
        )

# FEATURE: Add a SchemaReader helper
class SchemaWriter:
    def __init__(self, apps = global_apps, schema_defaults: SchemaDefaults = dict(), skip_missing_tables_and_fields: bool = True):
        self.apps = apps
        self._schema_defaults = schema_defaults
        self._tables: dict[str, SchemaTableBuilder] = {}
        self.skip_missing_tables_and_fields = skip_missing_tables_and_fields

    def execute(self):
        for table in self._tables.values():
            table.execute()

    def add_table(self, *, table_label: str | None = None, table_description: str | None = None, **attrs: Unpack[ContainerAttrs]) -> SchemaTableBuilder | None:
        table_defaults = self._schema_defaults.get(attrs.get('name', '').lower(), TableDefaults())
        try:
            table_builder = SchemaTableBuilder(
                apps=self.apps,
                skip_missing_fields=self.skip_missing_tables_and_fields,
                table_defaults=table_defaults,
                **attrs
            )
        except TableDoesNotExistError:
            if self.skip_missing_tables_and_fields:
                return None
            raise

        table_builder.localize(
            label=table_label,
            description=table_description
        )
        table_name = attrs["name"].lower()
        self._tables[table_name] = table_builder
        return table_builder

def create_localization_strings(Splocaleitemstr, rows: list[dict]):
    common_string_attrs = {
        "language": "en",
        "version": 0
    }
    resolved_rows = [{**common_string_attrs, **row} for row in rows]
    return bulk_create_splocaleitemstr_idempotent(Splocaleitemstr, resolved_rows)


# BUG: This does not use the Schema Defaults defined in schema_localization_en.json
def get_or_create_splocalecontainer(Splocalecontainer, Splocaleitemstr, table_label: str | None = None, table_description: str | None = None, **container_attrs: Unpack[ContainerAttrs]) -> tuple[bool, Model]:
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
        return False, sp_local_container

    sp_local_container = Splocalecontainer.objects.create(**resolved_container_attrs)

    container_string_rows = [
        {
            "containername_id": sp_local_container.pk,
            "text": table_label or camel_to_spaced_title_case(uncapitilize(string_label))
        },
        {
            "containerdesc_id": sp_local_container.pk,
            "text": table_description or camel_to_spaced_title_case(uncapitilize(string_label))
        }
    ]
    create_localization_strings(Splocaleitemstr, container_string_rows)
    return True, sp_local_container

def update_table_schema_config_with_defaults(
    table_name: str,
    discipline_id: int,
    discipline_type: str | None = None,
    apps = global_apps,
    table_defaults: TableDefaults = TableDefaults()
):
    schema_defaults = read_schema_config_defaults(discipline_type)
    table_name_str = table_defaults.get('name')
    table_desc_str = table_defaults.get('desc')

    writer = SchemaWriter(apps, schema_defaults=schema_defaults)

    table_writer = writer.add_table(
        table_label=table_name_str,
        table_description=table_desc_str,
        name=table_name.lower(),
        discipline_id=discipline_id
    )

    # BUG: The splocalecontainer related tables can still exist in the database, 
    # and this will result in skipping any operation if the table/field is 
    # removed, renamed, etc.
    if table_writer is None:
        logger.warning(
            f"Table does not exist in latest state of the datamodel, skipping Schema Config entry for: {table_name}"
        )
        return

    for field in table_writer.table._all_fields(exclude_id_field=True):
        field_defaults = {}
        if table_defaults.get('items'):
            field_defaults = table_defaults['items'].get(field.name.lower(), dict())

        field_label = field_defaults.pop("name", None)
        field_desc = field_defaults.pop("desc", None)
        field_writer = table_writer.add_field(
            **field_defaults,
            name=field.name
        )
        if field_writer is not None:
            field_writer.localize(
                label=field_label,
                description=field_desc
            )
    writer.execute()

def revert_table_schema_config(table_name: str, apps=global_apps):
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

def update_table_field_schema_config_with_defaults(
    table_name: str,
    discipline_id: int,
    field_name: str,
    discipline_type: str | None = None,
    apps = global_apps,
    defaults: FieldDefaults = FieldDefaults()
):
    schema_defaults = read_schema_config_defaults(discipline_type)
    writer = SchemaWriter(apps, schema_defaults=schema_defaults)

    table_writer = writer.add_table(
        discipline_id=discipline_id,
        name=table_name.lower()
    )

    # BUG: The splocalecontainer related tables can still exist in the database, 
    # and this will result in skipping any operation if the table/field is 
    # removed, renamed, etc.
    if table_writer is None:
        logger.warning(f"Table does not exist in latest state of the datamodel, skipping Schema Config entry for: {table_name}")
        return

    field_label = defaults.get('name')
    field_description = defaults.get('desc')

    item_attrs: ContainerItemAttrs = {
        "name": field_name,
        "version": 0,
        "ishidden": defaults.get("ishidden"),
        "isrequired": defaults.get('isrequired'),
        'picklistname': defaults.get('picklistname'),
        'weblinkname': defaults.get('weblinkname')
    }

    field = table_writer.add_field(
        **{k:v for k,v in item_attrs.items() if v is not None}
    )
    if field is not None:
        field.localize(
            label=field_label,
            description=field_description
        )
    writer.execute()

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
    table_name: str,
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

    created, sp_local_container = get_or_create_splocalecontainer(
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

    qs = Splocalecontaineritem.objects.filter(
        name=field_name,
        container=sp_local_container,
        type=datamodel_type_to_schematype(field.type) if field.is_relationship else field.type
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

def create_missing_schema_config_fields(discipline_id: int, discipline_type: str, apps=global_apps, stdout=None):
    missing_tables, missing_fields = find_missing_schema_config_fields(discipline_id, apps=apps)
    missing_table_set = set(missing_tables)

    for table_name in missing_tables:
        if stdout is not None:
            stdout(f"Creating schema config table container for {table_name}...")
        update_table_schema_config_with_defaults(
            table_name=table_name,
            discipline_id=discipline_id,
            discipline_type=discipline_type,
            apps=apps
        )

    for table_name, fields in missing_fields.items():
        if table_name in missing_table_set:
            continue
        for field_name in fields:
            if stdout is not None:
                stdout(f"Creating schema config field {table_name}.{field_name}...")
            update_table_field_schema_config_with_defaults(
                table_name=table_name,
                discipline_id=discipline_id,
                discipline_type=discipline_type,
                field_name=field_name,
                apps=apps
            )

    return missing_tables, missing_fields
