# Generated by Django 2.2.10 on 2022-07-19 15:06

from django.db import migrations

def add_permission(apps, schema_editor):
    UserPolicy = apps.get_model('permissions', 'UserPolicy')
    LibraryRolePolicy = apps.get_model('permissions', 'LibraryRolePolicy')
    RolePolicy = apps.get_model('permissions', 'RolePolicy')

    for p in UserPolicy.objects.filter(resource='/workbench/dataset', action='upload'):
        UserPolicy.objects.create(
            collection=p.collection,
            specifyuser=p.specifyuser,
            resource=p.resource,
            action='create_recordset',
        )

    for p in RolePolicy.objects.filter(resource='/workbench/dataset', action='upload'):
        RolePolicy.objects.create(
            role=p.role,
            resource=p.resource,
            action='create_recordset',
        )

    for p in LibraryRolePolicy.objects.filter(resource='/workbench/dataset', action='upload'):
        LibraryRolePolicy.objects.create(
            role=p.role,
            resource=p.resource,
            action='create_recordset',
        )

class Migration(migrations.Migration):

    dependencies = [
        ('permissions', '0005_merge_20220414_1451'),
    ]

    operations = [
        migrations.RunPython(add_permission),
    ]