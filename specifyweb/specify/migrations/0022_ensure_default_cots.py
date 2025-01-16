from django.db import migrations
from specifyweb.specify.utils import create_default_collection_types

class Migration(migrations.Migration):

    def handle_default_collection_types(apps, schema_editor):
        create_default_collection_types(apps)

    def revert_default_collection_types(apps, schema_editor):
        # Set all collection records to have a null collectionobjecttype
        Collectionobject = apps.get_model('specify', 'Collectionobject')
        Collectionobject.objects.all().update(collectionobjecttype=None)

        # Set all the collectionobject records of the collection
        # NOTE: Do we want to do this?
        Collectionobject.objects.update(collectionobjecttype=None)

        # Delete all CollectionObjectType records
        Collectionobjecttype = apps.get_model('specify', 'Collectionobjecttype')
        Collectionobjecttype.objects.all().delete()

    dependencies = [
        ('specify', '0021_update_hidden_geo_tables'),
    ]

    operations = [
        migrations.RunPython(handle_default_collection_types, revert_default_collection_types, atomic=True),
    ]

