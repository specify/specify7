from django.db import migrations


def unarchive_shared_queries(apps, schema_editor):
    alias = schema_editor.connection.alias
    archives = apps.get_model('stored_queries', 'QueryArchive')
    memberships = apps.get_model('stored_queries', 'QueryFolderMembership')
    shared = archives.objects.using(alias).filter(
        query__share_grants__isnull=False
    )
    for owner_id, query_id in shared.values_list('owner_id', 'query_id').distinct():
        memberships.objects.using(alias).filter(
            owner_id=owner_id, query_id=query_id, section='sharing'
        ).delete()
    shared.delete()


class Migration(migrations.Migration):
    dependencies = [
        ('stored_queries', '0005_remove_archived_favorites'),
        ('permissions', '0009_spqueryshare'),
    ]

    operations = [
        migrations.RunPython(unarchive_shared_queries, migrations.RunPython.noop),
    ]
