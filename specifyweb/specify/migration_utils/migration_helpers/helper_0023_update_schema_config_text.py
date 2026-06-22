import logging
from django.db.models import Count

from specifyweb.specify.migration_utils.schema_reader import _fields_without_explicit_hidden_override, _schema_override_hidden_values_for_discipline

logger = logging.getLogger(__name__)

# ##########################################
# Used in 0023_update_schema_config_text.py
# ##########################################


MIGRATION_0023_FIELDS = {
    'CollectionObjectGroup': [
        ('guid', 'GUID', 'GUID'), 
        ('cogType', 'Type', 'Determines the logic Specify should use when managing the children within that COG'),
        ('igsn', 'IGSN', 'An International Generic Sample Number (IGSN) provides an unambiguous globally unique and persistent identifier for physical samples.'),
        ('cojo', 'Parent COG', 'This connects a Collection Object Group to its parent Collection Object Group, which is used for managing a hierarchy.'), 
        ('yesno2', 'YesNo2', 'YesNo2'),
        ('yesno1', 'YesNo1', 'YesNo1'),
        ],

    'CollectionObjectGroupJoin' : [
        ('yesno2', 'YesNo2', 'YesNo2'),
        ('isSubstrate', 'Is Substrate?', 'The Collection Object that serves as the physical base for other items within the COG. This designation is useful for COGs with shared substrates.'),
        ('yesno1', 'YesNo1', 'YesNo1'),
        ('isPrimary', 'Is Primary?', 'The Collection Object designated as the most significant item in a Consolidated COG. A CO child must be set as “primary” when using a “Consolidated” COG.'),
        ('childCo', 'Child Collection Object', 'Child Collection Object'),
        ('childCog', 'Child Collection Object Group', 'Child Collection Object Group'),
        ('ParentCog', 'Parent', 'Parent Collection Object Group'),
        ('yesno3', 'YesNo3', 'YesNo3'),
    ],

    'CollectionObjectGroupType' : [
        ('cogTypeId', 'Collection Object Group Type ID', 'Collection Object Group Type ID'),
        ('yesno3', 'YesNo3', 'YesNo3'),
    ],

    'CollectionObjectType': [
        ('collectionObjectTypeId', 'Collection Object Type ID', 'Collection Object Type ID'),
        ('taxonTreeDef', 'Taxon Tree', 'The Taxon Tree associated with this Collection Object Type'),
    ],

    'AbsoluteAge': [
        ('yesno2', 'YesNo2', 'YesNo2'),
    ],

    'RelativeAge': [
        ('yesno2', 'YesNo2', 'YesNo2'),
        ('yesno1', 'YesNo1', 'YesNo1'),
    ],

    'CollectionObject': [
        ('collectionObjectType', 'Type', 'The type of object, such as a fish, mammal, mineral, rock, or meteorite.'),
        ('cojo', 'Parent COG', 'Connects a Collection Object to its Collection Object Group'),
    ],

    'TectonicUnit': [
        ('guid', 'GUID', 'GUID'),
        ('yesno1', 'YesNo1', 'YesNo1'),
        ('tectonicUnitId', 'Tectonic Unit ID', 'Tectonic Unit Id'),
        ('yesno2', 'YesNo2', 'YesNo2'),
    ],

    'TectonicUnitTreeDefItem': [
        ('createdbyagent', 'Created By Agent', 'Created By Agent'),
        ('rankId', 'Rank ID', 'Rank Id'),
    ]
}

MIGRATION_0023_FIELDS_BIS = {
    'CollectionObjectGroup': ['guid', ' text3', 'decimal2', 'igsn', 'text2', 'collection', 'description', 'text1', 'cojo', 'decimal1', 'yesno3', 'integer3', 'yesno2', 'collectionObjectGroupId', 'integer2', 'yesno1', 'integer1', 'decimal3', ],
    'CollectionObjectGroupJoin' : ['yesno2', 'text1', 'yesno1', 'integer3', 'integer2', 'integer1', 'text3', 'yesno3', 'precedence', 'text2'],
    'CollectionObjectGroupType' : ['collection'],
    'CollectionObjectType': ['text3', 'collectionObjectTypeId', 'text2', 'text1', 'collection'],
    'AbsoluteAge': ['collectionDate', 'absoluteAgeId', 'date1', 'date2', 'yesno1', 'yesno2', 'agent1', 'number1', 'number2', 'collectionObject', 'absoluteAgeCitations', 'text1', 'text2'],
    'RelativeAge': ['number2', 'yesno2', 'relativeAgeId', 'relativeAgePeriod', 'text1', 'agent1', 'collectionDate', 'text2', 'agent2', 'date1', 'date2', 'collectionObject', 'relativeAgeCitations', 'number1', 'yesno1'],
    'CollectionObject': ['collectionObjectType', 'relativeAges', 'absoluteAges', 'cojo'],
    'AbsoluteAgeCitation': ['collectionMember', 'absoluteAgeCitationId'],
    'RelativeAgeCitation': ['relativeAgeCitationId', 'collectionMember'],
    'TectonicUnit': ['collectionMember', 'nodeNumber', 'yesno1', 'tectonicUnitId', 'number1', 'yesno2', 'number2', 'rankId', 'text1'],
    'TectonicUnitTreeDefItem': ['children', 'rankId', 'parent', 'treeDef', 'treeEntries', 'tectonicUnitTreeDefItemId'],
    'TectonicUnitTreeDef': ['discipline', 'treeEntries', 'tectonicUnitTreeDefId']
}

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
