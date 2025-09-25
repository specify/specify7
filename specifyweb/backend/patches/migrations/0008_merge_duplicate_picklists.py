from django.db import migrations
from django.db.models import Count, F

def deduplicate_picklists(apps, schema_editor):
    Picklist = apps.get_model('specify', 'Picklist')
    PicklistItem = apps.get_model('specify', 'PicklistItem')
    
    duplicate_picklist_groups = (
        Picklist.objects
        .values(
            collection_name=F('collection__collectionName'),
            name=F('name'),
            tablename=F('tablename'),
        )
        .annotate(pl_count=Count('picklistid'))
        .filter(pl_count__gt=1)
    )

    for group in duplicate_picklist_groups:
        picklists = Picklist.objects.filter(
            collection__collectionName=group['collection_name'],
            name=group['name'],
            tablename=group['tablename'],
        ).order_by('picklistid')

        if picklists.count() < 2:
            continue

        primary_picklist = picklists.first()
        duplicate_picklists = picklists.exclude(picklistid=primary_picklist.picklistid)

        # Before deleting duplicates, add any picklist items that don't exist in the
        # primary picklist to the primary picklist.
        for duplicate in duplicate_picklists:
            items = PicklistItem.objects.filter(picklist=duplicate).order_by('picklistitemid')
            for item in items:
                existing_item = PicklistItem.objects.filter( # TODO: Verify these are the right fields to check for duplicates
                    picklist=primary_picklist,
                    value=item.value,
                    displayvalue=item.displayvalue
                ).first()
                if not existing_item:
                    item.picklist = primary_picklist
                    item.save()
                else:
                    # TODO: Update references to the duplicate picklist if necessary
                    item.delete()

            duplicate.delete()

class Migration(migrations.Migration):
    dependencies = [
        ('patches', '0007_fix_tectonicunit_tree_root')
    ]

    operations = [
        migrations.RunPython(
            deduplicate_picklists,
            migrations.RunPython.noop,
            atomic=True
        )
    ]
