import json
import re

from django.db import migrations


KEY_MAP = {
    'auditing.do_audits': ('general', 'auditing', 'enableAuditLog'),
    'auditing.audit_field_updates': (
        'general',
        'auditing',
        'logFieldLevelChanges',
    ),
    'ui.formatting.scrdateformat': ('general', 'formatting', 'fullDateFormat'),
    'ui.formatting.scrmonthformat': (
        'general',
        'formatting',
        'monthYearDateFormat',
    ),
    'attachment.preview_size': (
        'general',
        'attachments',
        'attachmentThumbnailSize',
    ),
}

COLLECTION_KEY_MAP = {
    'CO_CREATE_COA': (
        'general',
        'collectionObjectCreation',
        'createCollectionObjectAttributes',
    ),
    'CO_CREATE_PREP': (
        'general',
        'collectionObjectCreation',
        'createPreparations',
    ),
    'CO_CREATE_DET': (
        'general',
        'collectionObjectCreation',
        'createDeterminations',
    ),
}


def parse_properties(data: str) -> dict[str, str]:
    if isinstance(data, bytes):
        data = data.decode()
    values = {}
    for line in data.splitlines():
        match = re.match(r'\s*([^#=]+?)\s*=\s*(.*?)\s*$', line)
        if match is not None:
            values[match.group(1)] = match.group(2)
    return values


def convert_value(key: str, value: str):
    if key in {'auditing.do_audits', 'auditing.audit_field_updates'}:
        return value.lower() != 'false'
    if key == 'attachment.preview_size':
        try:
            return int(float(value))
        except ValueError:
            return 256
    return value


def set_nested_value(values, location, value):
    category, subcategory, item = location
    values.setdefault(category, {}).setdefault(subcategory, {})[item] = value


def merge_resource_values(resource, values, Spappresourcedata):
    target_data = resource.spappresourcedatas.first()
    if target_data is None:
        target_values = {}
    else:
        try:
            target_values = json.loads(target_data.data)
        except (TypeError, ValueError):
            target_values = {}

    for category, subcategories in values.items():
        for subcategory, items in subcategories.items():
            for item, value in items.items():
                target_values.setdefault(category, {}).setdefault(subcategory, {}).setdefault(item, value)

    if target_data is None:
        Spappresourcedata.objects.create(
            spappresource=resource,
            data=json.dumps(target_values).encode(),
        )
    else:
        target_data.data = json.dumps(target_values).encode()
        target_data.save()


def migrate_collection_preferences(legacy_resources, apps):
    Collection = apps.get_model('specify', 'Collection')
    SpecifyUser = apps.get_model('specify', 'SpecifyUser')
    Spappresource = apps.get_model('specify', 'Spappresource')
    Spappresourcedir = apps.get_model('specify', 'Spappresourcedir')
    Spappresourcedata = apps.get_model('specify', 'Spappresourcedata')
    resource_owner = SpecifyUser.objects.order_by('id').first()
    collection_values = {}

    for resource_data in legacy_resources:
        for key, value in parse_properties(resource_data.data or '').items():
            for prefix, location in COLLECTION_KEY_MAP.items():
                if not key.startswith(f'{prefix}_'):
                    continue
                collection_id = key.removeprefix(f'{prefix}_')
                if collection_id.isdigit():
                    set_nested_value(
                        collection_values.setdefault(int(collection_id), {}),
                        location,
                        value.lower() != 'false',
                    )

    for collection_id, values in collection_values.items():
        collection = Collection.objects.filter(id=collection_id).first()
        if collection is None:
            continue
        directory_filters = {
            'collection_id': collection.id,
            'discipline_id': collection.discipline_id,
            'usertype': None,
            'ispersonal': False,
            'specifyuser': None,
        }
        directory = Spappresourcedir.objects.filter(
            **directory_filters
        ).first()
        if directory is None:
            directory = Spappresourcedir.objects.create(
                **directory_filters
            )
        resource, _ = Spappresource.objects.get_or_create(
            spappresourcedir=directory,
            name='CollectionPreferences',
            defaults={
                'level': 0,
                'mimetype': 'application/json',
                'metadata': '',
                'specifyuser': resource_owner,
            },
        )
        merge_resource_values(resource, values, Spappresourcedata)


def migrate_global_preferences(apps, schema_editor):
    SpecifyUser = apps.get_model('specify', 'SpecifyUser')
    Spappresource = apps.get_model('specify', 'Spappresource')
    Spappresourcedir = apps.get_model('specify', 'Spappresourcedir')
    Spappresourcedata = apps.get_model('specify', 'Spappresourcedata')

    directories = Spappresourcedir.objects.filter(
        collection__isnull=True,
        discipline__isnull=True,
        usertype='Global Prefs',
        ispersonal=False,
    )
    directory = directories.first()
    if directory is None:
        return
    resource_owner = directory.specifyuser or SpecifyUser.objects.order_by('id').first()

    target = Spappresource.objects.filter(
        spappresourcedir=directory,
        name='GlobalPreferences',
    ).first()
    legacy_resources = list(Spappresourcedata.objects.filter(
        spappresource__spappresourcedir__usertype='Prefs',
        spappresource__name='preferences',
    ))

    if target is None:
        legacy_data = list(
        Spappresourcedata.objects.filter(
            spappresource__spappresourcedir__usertype__in=['Prefs', 'Global Prefs'],
            spappresource__name='preferences',
        ).values_list('data', flat=True)
        )
        values = {}
        for data in legacy_data:
            for key, value in parse_properties(data or '').items():
                location = KEY_MAP.get(key)
                if location is None:
                    continue
                set_nested_value(values, location, convert_value(key, value))

        target = Spappresource.objects.create(
            spappresourcedir=directory,
            specifyuser=resource_owner,
            level=0,
            name='GlobalPreferences',
            mimetype='application/json',
            metadata='',
        )
        Spappresourcedata.objects.create(
            spappresource=target,
            data=json.dumps(values).encode(),
        )

    migrate_collection_preferences(legacy_resources, apps)


class Migration(migrations.Migration):
    dependencies = [
        ('setup_tool', '0001_ensure_discipline_resource_dirs'),
    ]

    operations = [
        migrations.RunPython(migrate_global_preferences, migrations.RunPython.noop),
    ]