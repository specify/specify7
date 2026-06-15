import logging
from django.db.models import Count

from specifyweb.specify.migration_utils.schema_reader import _fields_without_explicit_hidden_override, _schema_override_hidden_values_for_discipline
from specifyweb.specify.migration_utils.sp7_schemaconfig import (
    MIGRATION_0023_FIELDS,
    MIGRATION_0023_FIELDS_BIS,
)

logger = logging.getLogger(__name__)

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
                    name__iexact=field_name
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
    discipline_types_by_id = dict(Discipline.objects.values_list("id", "type"))

    for table, fields in MIGRATION_0023_FIELDS_BIS.items():
        field_names = [field_name.lower() for field_name in fields]
        field_name_set = set(field_names)
        containers = Splocalecontainer.objects.filter(
            name=table.lower(),
            schematype=0
        )
        for container in containers:
            discipline_type = discipline_types_by_id.get(container.discipline_id, "")
            explicit_hidden_overrides = {
                field_name: ishidden
                for field_name, ishidden in _schema_override_hidden_values_for_discipline(
                    discipline_type
                ).get(table.lower(), {}).items()
                if field_name in field_name_set
            }
            explicit_fields_to_hide = [
                field_name
                for field_name, ishidden in explicit_hidden_overrides.items()
                if ishidden
            ]
            explicit_fields_to_show = [
                field_name
                for field_name, ishidden in explicit_hidden_overrides.items()
                if not ishidden
            ]

            if explicit_fields_to_hide:
                Splocalecontaineritem.objects.filter(
                    container=container,
                    ishidden=False,
                    name__in=explicit_fields_to_hide,
                ).update(ishidden=True)

            if explicit_fields_to_show:
                Splocalecontaineritem.objects.filter(
                    container=container,
                    ishidden=True,
                    name__in=explicit_fields_to_show,
                ).update(ishidden=False)

            fields_to_hide = _fields_without_explicit_hidden_override(
                table,
                field_names,
                discipline_type,
            )
            if not fields_to_hide:
                continue

            items_updated = Splocalecontaineritem.objects.filter(
                container=container,
                ishidden=False,
                name__in=fields_to_hide
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
        item_to_keep = duplicate_items.first()
        items_to_delete = duplicate_items.exclude(id=item_to_keep.id)

        Splocaleitemstr.objects.filter(itemdesc_id__in=items_to_delete).update(itemdesc_id=item_to_keep.id)
        Splocaleitemstr.objects.filter(itemname_id__in=items_to_delete).update(itemname_id=item_to_keep.id)
        items_to_delete.delete()

def reverse_update_hidden_prop(apps, schema_editor=None):
    Splocalecontainer = apps.get_model('specify', 'Splocalecontainer')
    Splocalecontaineritem = apps.get_model('specify', 'Splocalecontaineritem')
    Discipline = apps.get_model('specify', 'Discipline')
    discipline_types_by_id = dict(Discipline.objects.values_list("id", "type"))

    for table, fields in MIGRATION_0023_FIELDS_BIS.items():
        field_names = [field_name.lower() for field_name in fields]
        containers = Splocalecontainer.objects.filter(
            name=table.lower(),
        )
        for container in containers:
            discipline_type = discipline_types_by_id.get(container.discipline_id, "")
            fields_to_unhide = _fields_without_explicit_hidden_override(
                table,
                field_names,
                discipline_type,
            )
            if not fields_to_unhide:
                continue

            items = Splocalecontaineritem.objects.filter(
                container=container,
                name__in=fields_to_unhide
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