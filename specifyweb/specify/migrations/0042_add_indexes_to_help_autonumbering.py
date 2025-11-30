from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('specify', '0041_add_missing_schema_after_reorganization'),
    ]

    operations = [
        # accession, accessionnumber, division
        migrations.AddIndex(
            model_name='accession',
            index=models.Index(fields=['division_id', 'accessionnumber'], name='DivAccessionNumberIDX'),
        ),
        # collectionobject, catalognumber, collection
        migrations.AddIndex(
            model_name='collectionobject',
            index=models.Index(fields=['collectionmemberid', 'catalognumber'], name='ColCatalogNumberIDX'),
        ),
        # loan, discipline, loannumber
        migrations.AddIndex(
            model_name='loan',
            index=models.Index(fields=['discipline', 'loannumber'], name='DispLoanNumberIDX'),
        ),

        # borrow, invoicenumber, null
        migrations.AddIndex(
            model_name='borrow',
            index=models.Index(fields=['invoicenumber'], name='BorrowInvoiceNumberIDX'),
        ),

        # exchangein, exchangeinnumber, division
        migrations.AddIndex(
            model_name='exchangein',
            index=models.Index(fields=['division', 'exchangeinnumber'], name='DivExcInNumberIDX'),
        ),

        # exchangeout, exchangeoutnumber, division
        migrations.AddIndex(
            model_name='exchangeout',
            index=models.Index(fields=['division', 'exchangeoutnumber'], name='DivExcOutNumberIDX'),
        ),

        # collectingevent, stationfieldnumber, discipline
        migrations.AddIndex(
            model_name='collectingevent',
            index=models.Index(fields=['discipline', 'stationfieldnumber'], name='DispStationFieldNumIDX'),
        ),

        # collection, regnumber, discipline
        migrations.AddIndex(
            model_name='collection',
            index=models.Index(fields=['discipline', 'regnumber'], name='DispColRegNumberIDX'),
        ),

        # collector, ordernumber, division
        migrations.AddIndex(
            model_name='collector',
            index=models.Index(fields=['division', 'ordernumber'], name='DivCollectorOrderNumIDX'),
        ),

        # deaccession, deaccessionnumber, null
        migrations.AddIndex(
            model_name='deaccession',
            index=models.Index(fields=['deaccessionnumber'], name='DeaccessionNumberIDX'),
        ),

        # discipline, regnumber, division
        migrations.AddIndex(
            model_name='discipline',
            index=models.Index(fields=['division', 'regnumber'], name='DivDispRegNumberIDX'),
        ),

        # disposal, disposalnumber, null
        migrations.AddIndex(
            model_name='disposal',
            index=models.Index(fields=['disposalnumber'], name='DisposalNumberIDX'),
        ),

        # division, regnumber, institution
        migrations.AddIndex(
            model_name='division',
            index=models.Index(fields=['institution', 'regnumber'], name='InstDivRegNumberIDX'),
        ),

        # exsiccataitem, number, null
        migrations.AddIndex(
            model_name='exsiccataitem',
            index=models.Index(fields=['number'], name='ExsiccataItemNumberIDX'),
        ),

        # fieldnotebookpage, pagenumber, discipline
        migrations.AddIndex(
            model_name='fieldnotebookpage',
            index=models.Index(fields=['discipline', 'pagenumber'], name='DispFNBPageNumIDX'),
        ),

        # fieldnotebookpageset, pagenumber, discipline
        migrations.AddIndex(
            model_name='fieldnotebookpageset',
            index=models.Index(fields=['discipline', 'pagenumber'], name='DispFNBPageSetNumIDX'),
        ),

        # fundingagent, pagenumber, division
        migrations.AddIndex(
            model_name='fundingagent',
            index=models.Index(fields=['division', 'pagenumber'], name='DivFundingAgentPageNumIDX'),
        ),

        # gift, giftnumber, discipline
        migrations.AddIndex(
            model_name='gift',
            index=models.Index(fields=['discipline', 'giftnumber'], name='DispGiftNumberIDX'),
        ),

        # groupperson, ordernumber, division
        migrations.AddIndex(
            model_name='groupperson',
            index=models.Index(fields=['division', 'ordernumber'], name='DivGroupPersonOrderNumIDX'),
        ),

        # permit, permitnumber, institution
        migrations.AddIndex(
            model_name='permit',
            index=models.Index(fields=['institution', 'permitnumber'], name='InstPermitNumberIDX'),
        ),

        # referencework, librarynumber, institution
        migrations.AddIndex(
            model_name='referencework',
            index=models.Index(fields=['institution', 'librarynumber'], name='InstRefWorkLibNumIDX'),
        ),

        # repositoryagreement, repositoryagreementnumber, division
        migrations.AddIndex(
            model_name='repositoryagreement',
            index=models.Index(fields=['division', 'repositoryagreementnumber'], name='DivRepoAgreeNumIDX'),
        ),

        # shipment, shipmentnumber, discipline
        migrations.AddIndex(
            model_name='shipment',
            index=models.Index(fields=['discipline', 'shipmentnumber'], name='DispShipmentNumberIDX'),
        ),

        # treatmentevent, treatmentnumber, division
        migrations.AddIndex(
            model_name='treatmentevent',
            index=models.Index(fields=['division', 'treatmentnumber'], name='DivTreatmentNumberIDX'),
        ),
    ]