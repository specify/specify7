from django.db import migrations
from specifyweb.backend.workbench.upload.auditlog import auditlog

def add_attachment_import_role(apps, schema_editor):
    LibraryRole = apps.get_model('permissions', 'LibraryRole')
    role = LibraryRole.objects.create(
        name="Bulk Attachment Import",
        description="Gives full access to the Bulk Attachment Import. Allows creating new attachments for any attachment table"
    )
    auditlog.insert(role)

    # Define policy sets grouped by resource
    policy_definitions = [
        # Attachment dataset permissions
        {'resource': '/attachment_import/dataset', 'actions': ['create', 'update', 'delete', 'upload', 'rollback']},
        # Attachment permissions
        {'resource': '/table/attachment', 'actions': ['create', 'read', 'delete']},
        # Table Specific permissions
        {'resource': '/table/accession', 'actions': ['read', 'update']},
        {'resource': '/table/accessionattachment', 'actions': ['read', 'create', 'delete']},
        {'resource': '/table/agent', 'actions': ['read', 'update']},
        {'resource': '/table/agentattachment', 'actions': ['read', 'create', 'delete']},
        {'resource': '/table/borrow', 'actions': ['read', 'update']},
        {'resource': '/table/borrowattachment', 'actions': ['read', 'create', 'delete']},
        {'resource': '/table/collectingevent', 'actions': ['read', 'update']},
        {'resource': '/table/collectingeventattachment', 'actions': ['read', 'create', 'delete']},
        {'resource': '/table/collectingtrip', 'actions': ['read', 'update']},
        {'resource': '/table/collectingtripattachment', 'actions': ['read', 'create', 'delete']},
        {'resource': '/table/collectionobject', 'actions': ['read', 'update']},
        {'resource': '/table/collectionobjectattachment', 'actions': ['read', 'create', 'delete']},
        {'resource': '/table/conservdescription', 'actions': ['read', 'update']},
        {'resource': '/table/conservdescriptionattachment', 'actions': ['read', 'create', 'delete']},
        {'resource': '/table/conservevent', 'actions': ['read', 'update']},
        {'resource': '/table/conserveventattachment', 'actions': ['read', 'create', 'delete']},
        {'resource': '/table/dnasequence', 'actions': ['read', 'update']},
        {'resource': '/table/dnasequenceattachment', 'actions': ['read', 'create', 'delete']},
        {'resource': '/table/dnasequencingrun', 'actions': ['read', 'update']},
        {'resource': '/table/dnasequencingrunattachment', 'actions': ['read', 'create', 'delete']},
        {'resource': '/table/deaccession', 'actions': ['read', 'update']},
        {'resource': '/table/deaccessionattachment', 'actions': ['read', 'create', 'delete']},
        {'resource': '/table/disposal', 'actions': ['read', 'update']},
        {'resource': '/table/disposalattachment', 'actions': ['read', 'create', 'delete']},
        {'resource': '/table/exchangein', 'actions': ['read', 'update']},
        {'resource': '/table/exchangeinattachment', 'actions': ['read', 'create', 'delete']},
        {'resource': '/table/exchangeout', 'actions': ['read', 'update']},
        {'resource': '/table/exchangeoutattachment', 'actions': ['read', 'create', 'delete']},
        {'resource': '/table/fieldnotebook', 'actions': ['read', 'update']},
        {'resource': '/table/fieldnotebookattachment', 'actions': ['read', 'create', 'delete']},
        {'resource': '/table/fieldnotebookpage', 'actions': ['read', 'update']},
        {'resource': '/table/fieldnotebookpageattachment', 'actions': ['read', 'create', 'delete']},
        {'resource': '/table/fieldnotebookpageset', 'actions': ['read', 'update']},
        {'resource': '/table/fieldnotebookpagesetattachment', 'actions': ['read', 'create', 'delete']},
        {'resource': '/table/gift', 'actions': ['read', 'update']},
        {'resource': '/table/giftattachment', 'actions': ['read', 'create', 'delete']},
        {'resource': '/table/loan', 'actions': ['read', 'update']},
        {'resource': '/table/loanattachment', 'actions': ['read', 'create', 'delete']},
        {'resource': '/table/locality', 'actions': ['read', 'update']},
        {'resource': '/table/localityattachment', 'actions': ['read', 'create', 'delete']},
        {'resource': '/table/morphbankview', 'actions': ['read', 'update']},
        {'resource': '/table/attachmentimageattribute', 'actions': ['read', 'create', 'delete']},
        {'resource': '/table/permit', 'actions': ['read', 'update']},
        {'resource': '/table/permitattachment', 'actions': ['read', 'create', 'delete']},
        {'resource': '/table/preparation', 'actions': ['read', 'update']},
        {'resource': '/table/preparationattachment', 'actions': ['read', 'create', 'delete']},
        {'resource': '/table/referencework', 'actions': ['read', 'update']},
        {'resource': '/table/referenceworkattachment', 'actions': ['read', 'create', 'delete']},
        {'resource': '/table/repositoryagreement', 'actions': ['read', 'update']},
        {'resource': '/table/repositoryagreementattachment', 'actions': ['read', 'create', 'delete']},
        {'resource': '/table/storage', 'actions': ['read', 'update']},
        {'resource': '/table/storageattachment', 'actions': ['read', 'create', 'delete']},
        {'resource': '/table/taxon', 'actions': ['read', 'update']},
        {'resource': '/table/taxonattachment', 'actions': ['read', 'create', 'delete']},
        {'resource': '/table/treatmentevent', 'actions': ['read', 'update']},
        {'resource': '/table/treatmenteventattachment', 'actions': ['read', 'create', 'delete']},
    ]

    # Create each policy and log its creation
    for policy in policy_definitions:
        for action in policy['actions']:
            obj, created = role.policies.get_or_create(resource=policy['resource'], action=action)
            if created:
                auditlog.insert(obj)

class Migration(migrations.Migration):
    dependencies = [
        ('permissions', '0007_add_stats_edit_permission')
    ]
    operations = [
        migrations.RunPython(add_attachment_import_role)
    ]