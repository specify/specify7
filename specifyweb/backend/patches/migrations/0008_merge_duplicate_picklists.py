from django.db import migrations
from django.db.models import Count

def deduplicate_picklists(apps, schema_editor):
    Picklist = apps.get_model('specify', 'Picklist')
    PicklistItem = apps.get_model('specify', 'PicklistItem')

    # Find groups that are duplicates by business key
    duplicate_groups = (
        Picklist.objects
        .values('name', 'tablename', 'fieldname', 'collection')  # <-- use field names
        .annotate(pl_count=migrations.models.Count('id'))
        .filter(pl_count__gt=1)
    )

    for group in duplicate_groups:
        # Order by id so the lowest-id is the "primary"
        picklists = (
            Picklist.objects
            .filter(
                name=group['name'],
                tablename=group['tablename'],
                fieldname=group['fieldname'],
                collection=group['collection'],
            )
            .order_by('id')
        )

        # Sanity
        if picklists.count() < 2:
            continue

        primary = picklists.first()
        duplicates = picklists.exclude(id=primary.id)  # <-- use 'id'

        # Preload existing (title, value) pairs from the primary to avoid dupes
        existing_pairs = set(
            PicklistItem.objects
            .filter(picklist=primary)
            .values_list('title', 'value')
        )

        for dup in duplicates:
            # Grab all items on the duplicate picklist
            dup_items = list(
                PicklistItem.objects
                .filter(picklist=dup)
                .only('id', 'title', 'value', 'picklist')
                .order_by('id')
            )

            # Partition into items we should move vs delete
            to_move = []
            to_delete_ids = []
            for it in dup_items:
                key = (it.title, it.value)
                if key in existing_pairs:
                    to_delete_ids.append(it.id)
                else:
                    it.picklist = primary
                    to_move.append(it)
                    existing_pairs.add(key)  # avoid creating a dupe on later items

            if to_move:
                PicklistItem.objects.bulk_update(to_move, ['picklist'])
            if to_delete_ids:
                PicklistItem.objects.filter(id__in=to_delete_ids).delete()

            # Remove the empty duplicate picklist
            dup.delete()

class Migration(migrations.Migration):
    dependencies = [
        ('patches', '0007_fix_tectonicunit_tree_root'),
    ]

    operations = [
        migrations.RunPython(
            deduplicate_picklists,
            reverse_code=migrations.RunPython.noop,
            atomic=True,
        ),
    ]
