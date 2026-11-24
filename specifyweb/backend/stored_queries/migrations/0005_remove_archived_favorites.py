from django.db import migrations
from django.db.models import Exists, OuterRef


def remove_archived_favorites(apps, schema_editor):
    alias = schema_editor.connection.alias
    favorites = apps.get_model('stored_queries', 'QueryFavorite')
    archives = apps.get_model('stored_queries', 'QueryArchive')
    archived = archives.objects.using(alias).filter(
        owner_id=OuterRef('owner_id'), query_id=OuterRef('query_id')
    )
    favorites.objects.using(alias).filter(Exists(archived)).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('stored_queries', '0004_query_archive'),
    ]

    operations = [
        migrations.RunPython(remove_archived_favorites, migrations.RunPython.noop),
    ]
