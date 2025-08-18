from django.db import migrations

def apply_migration(apps, schema_editor):
    UserPolicy = apps.get_model('permissions', 'UserPolicy')
    LibraryRolePolicy = apps.get_model('permissions', 'LibraryRolePolicy')
    RolePolicy = apps.get_model('permissions', 'RolePolicy')

    user_policies = UserPolicy.objects.filter(resource='/record/replace')
    role_policies = RolePolicy.objects.filter(resource='/record/replace')
    library_role_policies = LibraryRolePolicy.objects.filter(resource='/record/replace')

    user_policies.update(resource="/record/merge")
    role_policies.update(resource="/record/merge")
    library_role_policies.update(resource="/record/merge")

def revert_migration(apps, schema_editor): 
    UserPolicy = apps.get_model('permissions', 'UserPolicy')
    LibraryRolePolicy = apps.get_model('permissions', 'LibraryRolePolicy')
    RolePolicy = apps.get_model('permissions', 'RolePolicy')

    user_policies = UserPolicy.objects.filter(resource="/record/merge")
    role_policies = RolePolicy.objects.filter(resource="/record/merge")
    library_role_policies = LibraryRolePolicy.objects.filter(resource="/record/merge")

    user_policies.update(resource='/record/replace')
    role_policies.update(resource='/record/replace')
    library_role_policies.update(resource='/record/replace')

class Migration(migrations.Migration):
    dependencies = [
        ('permissions', '0005_merge_20220414_1451'),
        ('notifications', '0003_spmerging')
    ]

    operations = [
        migrations.RunPython(apply_migration, revert_migration, atomic=True),
    ]
