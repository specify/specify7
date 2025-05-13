from django.db import migrations

def add_attachment_import_role(apps, schema_editor):
    LibraryRole = apps.get_model('permissions', 'LibraryRole')
    role = LibraryRole.objects.create(
        name="Bulk Attachment Import",
        description="Gives full access to the Bulk Attachment Import. Allows creating new attachments for any attachment table"
    )
    # Attachment dataset permissions
    role.policies.create(resource='/attachment_import/dataset', action='create')
    role.policies.create(resource='/attachment_import/dataset', action='update')
    role.policies.create(resource='/attachment_import/dataset', action='delete')
    role.policies.create(resource='/attachment_import/dataset', action='upload')
    role.policies.create(resource='/attachment_import/dataset', action='rollback')

    # Attachment permissions
    role.policies.create(resource='/table/attachment', action='create')
    role.policies.create(resource='/table/attachment', action='read')
    role.policies.create(resource='/table/attachment', action='delete')

    # Table Specific permissions (Auto-generated)
    role.policies.create(resource='/table/accession', action='read')
    role.policies.create(resource='/table/accession', action='update')
    role.policies.create(resource='/table/accessionattachment', action='read')
    role.policies.create(resource='/table/accessionattachment', action='create')
    role.policies.create(resource='/table/accessionattachment', action='delete')

    role.policies.create(resource='/table/agent', action='read')
    role.policies.create(resource='/table/agent', action='update')
    role.policies.create(resource='/table/agentattachment', action='read')
    role.policies.create(resource='/table/agentattachment', action='create')
    role.policies.create(resource='/table/agentattachment', action='delete')

    role.policies.create(resource='/table/borrow', action='read')
    role.policies.create(resource='/table/borrow', action='update')
    role.policies.create(resource='/table/borrowattachment', action='read')
    role.policies.create(resource='/table/borrowattachment', action='create')
    role.policies.create(resource='/table/borrowattachment', action='delete')

    role.policies.create(resource='/table/collectingevent', action='read')
    role.policies.create(resource='/table/collectingevent', action='update')
    role.policies.create(resource='/table/collectingeventattachment', action='read')
    role.policies.create(resource='/table/collectingeventattachment', action='create')
    role.policies.create(resource='/table/collectingeventattachment', action='delete')

    role.policies.create(resource='/table/collectingtrip', action='read')
    role.policies.create(resource='/table/collectingtrip', action='update')
    role.policies.create(resource='/table/collectingtripattachment', action='read')
    role.policies.create(resource='/table/collectingtripattachment', action='create')
    role.policies.create(resource='/table/collectingtripattachment', action='delete')

    role.policies.create(resource='/table/collectionobject', action='read')
    role.policies.create(resource='/table/collectionobject', action='update')
    role.policies.create(resource='/table/collectionobjectattachment', action='read')
    role.policies.create(resource='/table/collectionobjectattachment', action='create')
    role.policies.create(resource='/table/collectionobjectattachment', action='delete')

    role.policies.create(resource='/table/conservdescription', action='read')
    role.policies.create(resource='/table/conservdescription', action='update')
    role.policies.create(resource='/table/conservdescriptionattachment', action='read')
    role.policies.create(resource='/table/conservdescriptionattachment', action='create')
    role.policies.create(resource='/table/conservdescriptionattachment', action='delete')

    role.policies.create(resource='/table/conservevent', action='read')
    role.policies.create(resource='/table/conservevent', action='update')
    role.policies.create(resource='/table/conserveventattachment', action='read')
    role.policies.create(resource='/table/conserveventattachment', action='create')
    role.policies.create(resource='/table/conserveventattachment', action='delete')

    role.policies.create(resource='/table/dnasequence', action='read')
    role.policies.create(resource='/table/dnasequence', action='update')
    role.policies.create(resource='/table/dnasequenceattachment', action='read')
    role.policies.create(resource='/table/dnasequenceattachment', action='create')
    role.policies.create(resource='/table/dnasequenceattachment', action='delete')

    role.policies.create(resource='/table/dnasequencingrun', action='read')
    role.policies.create(resource='/table/dnasequencingrun', action='update')
    role.policies.create(resource='/table/dnasequencingrunattachment', action='read')
    role.policies.create(resource='/table/dnasequencingrunattachment', action='create')
    role.policies.create(resource='/table/dnasequencingrunattachment', action='delete')

    role.policies.create(resource='/table/deaccession', action='read')
    role.policies.create(resource='/table/deaccession', action='update')
    role.policies.create(resource='/table/deaccessionattachment', action='read')
    role.policies.create(resource='/table/deaccessionattachment', action='create')
    role.policies.create(resource='/table/deaccessionattachment', action='delete')

    role.policies.create(resource='/table/disposal', action='read')
    role.policies.create(resource='/table/disposal', action='update')
    role.policies.create(resource='/table/disposalattachment', action='read')
    role.policies.create(resource='/table/disposalattachment', action='create')
    role.policies.create(resource='/table/disposalattachment', action='delete')

    role.policies.create(resource='/table/exchangein', action='read')
    role.policies.create(resource='/table/exchangein', action='update')
    role.policies.create(resource='/table/exchangeinattachment', action='read')
    role.policies.create(resource='/table/exchangeinattachment', action='create')
    role.policies.create(resource='/table/exchangeinattachment', action='delete')

    role.policies.create(resource='/table/exchangeout', action='read')
    role.policies.create(resource='/table/exchangeout', action='update')
    role.policies.create(resource='/table/exchangeoutattachment', action='read')
    role.policies.create(resource='/table/exchangeoutattachment', action='create')
    role.policies.create(resource='/table/exchangeoutattachment', action='delete')

    role.policies.create(resource='/table/fieldnotebook', action='read')
    role.policies.create(resource='/table/fieldnotebook', action='update')
    role.policies.create(resource='/table/fieldnotebookattachment', action='read')
    role.policies.create(resource='/table/fieldnotebookattachment', action='create')
    role.policies.create(resource='/table/fieldnotebookattachment', action='delete')

    role.policies.create(resource='/table/fieldnotebookpage', action='read')
    role.policies.create(resource='/table/fieldnotebookpage', action='update')
    role.policies.create(resource='/table/fieldnotebookpageattachment', action='read')
    role.policies.create(resource='/table/fieldnotebookpageattachment', action='create')
    role.policies.create(resource='/table/fieldnotebookpageattachment', action='delete')

    role.policies.create(resource='/table/fieldnotebookpageset', action='read')
    role.policies.create(resource='/table/fieldnotebookpageset', action='update')
    role.policies.create(resource='/table/fieldnotebookpagesetattachment', action='read')
    role.policies.create(resource='/table/fieldnotebookpagesetattachment', action='create')
    role.policies.create(resource='/table/fieldnotebookpagesetattachment', action='delete')

    role.policies.create(resource='/table/gift', action='read')
    role.policies.create(resource='/table/gift', action='update')
    role.policies.create(resource='/table/giftattachment', action='read')
    role.policies.create(resource='/table/giftattachment', action='create')
    role.policies.create(resource='/table/giftattachment', action='delete')

    role.policies.create(resource='/table/loan', action='read')
    role.policies.create(resource='/table/loan', action='update')
    role.policies.create(resource='/table/loanattachment', action='read')
    role.policies.create(resource='/table/loanattachment', action='create')
    role.policies.create(resource='/table/loanattachment', action='delete')

    role.policies.create(resource='/table/locality', action='read')
    role.policies.create(resource='/table/locality', action='update')
    role.policies.create(resource='/table/localityattachment', action='read')
    role.policies.create(resource='/table/localityattachment', action='create')
    role.policies.create(resource='/table/localityattachment', action='delete')

    role.policies.create(resource='/table/morphbankview', action='read')
    role.policies.create(resource='/table/morphbankview', action='update')
    role.policies.create(resource='/table/attachmentimageattribute', action='read')
    role.policies.create(resource='/table/attachmentimageattribute', action='create')
    role.policies.create(resource='/table/attachmentimageattribute', action='delete')

    role.policies.create(resource='/table/permit', action='read')
    role.policies.create(resource='/table/permit', action='update')
    role.policies.create(resource='/table/permitattachment', action='read')
    role.policies.create(resource='/table/permitattachment', action='create')
    role.policies.create(resource='/table/permitattachment', action='delete')

    role.policies.create(resource='/table/preparation', action='read')
    role.policies.create(resource='/table/preparation', action='update')
    role.policies.create(resource='/table/preparationattachment', action='read')
    role.policies.create(resource='/table/preparationattachment', action='create')
    role.policies.create(resource='/table/preparationattachment', action='delete')

    role.policies.create(resource='/table/referencework', action='read')
    role.policies.create(resource='/table/referencework', action='update')
    role.policies.create(resource='/table/referenceworkattachment', action='read')
    role.policies.create(resource='/table/referenceworkattachment', action='create')
    role.policies.create(resource='/table/referenceworkattachment', action='delete')

    role.policies.create(resource='/table/repositoryagreement', action='read')
    role.policies.create(resource='/table/repositoryagreement', action='update')
    role.policies.create(resource='/table/repositoryagreementattachment', action='read')
    role.policies.create(resource='/table/repositoryagreementattachment', action='create')
    role.policies.create(resource='/table/repositoryagreementattachment', action='delete')

    role.policies.create(resource='/table/storage', action='read')
    role.policies.create(resource='/table/storage', action='update')
    role.policies.create(resource='/table/storageattachment', action='read')
    role.policies.create(resource='/table/storageattachment', action='create')
    role.policies.create(resource='/table/storageattachment', action='delete')

    role.policies.create(resource='/table/taxon', action='read')
    role.policies.create(resource='/table/taxon', action='update')
    role.policies.create(resource='/table/taxonattachment', action='read')
    role.policies.create(resource='/table/taxonattachment', action='create')
    role.policies.create(resource='/table/taxonattachment', action='delete')

    role.policies.create(resource='/table/treatmentevent', action='read')
    role.policies.create(resource='/table/treatmentevent', action='update')
    role.policies.create(resource='/table/treatmenteventattachment', action='read')
    role.policies.create(resource='/table/treatmenteventattachment', action='create')
    role.policies.create(resource='/table/treatmenteventattachment', action='delete')


class Migration(migrations.Migration):
    dependencies = [
        ('permissions', '0007_add_stats_edit_permission')
    ]
    operations = [
        migrations.RunPython(add_attachment_import_role)
    ]