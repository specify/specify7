from . import models
from .models import models_by_tableid

from specifyweb.businessrules.attachment_rules import tables_with_attachments

dependent_fields = {
    'Accession.accessionagents',
    'Accession.accessionauthorizations',
    'Agent.addresses',
    'Agent.variants',
    'Agent.groups',
    'Agent.agentgeographies',
    'Agent.agentspecialties',
    'Borrow.borrowagents',
    'Borrow.borrowmaterials',
    'Borrowmaterial.borrowreturnmaterials',
    'Collectingevent.collectors',
    'Collectingevent.collectingeventattribute',
    'Collectingevent.collectingeventattrs',
    'Collectingtrip.fundingagents',
    'Collectionobject.determinations',
    'Collectionobject.dnasequences',
    'Collectionobject.collectionobjectattribute',
    'Collectionobject.collectionobjectattrs',
    'Collectionobject.collectionobjectcitations',
    'Collectionobject.conservdescriptions',
    'Collectionobject.dnasequences',
    'Collectionobject.exsiccataitems',
    'Collectionobject.otheridentifiers',
    'Collectionobject.treatmentevents',
    'Collectionobject.preparations',
    'Commonnametx.citations',
    'Conservdescription.events',
    'Dnasequence.dnasequencingruns',
    'Dnasequencingrun.citations',
    'Deaccession.deaccessionagents',
    'Deaccession.deaccessionpreparations',
    'Determination.determinationcitations',
    'Exchangein.exchangeinpreps',
    'Exchangeout.exchangeoutpreps',
    'Exsiccata.exsiccataitems',
    'Fieldnotebook.pagesets',
    'Fieldnotebookpageset.pages',
    'Gift.giftagents',
    'Gift.giftpreparations',
    'Latlonpolygon.points',
    'Loan.loanagents',
    'Loan.loanpreparations',
    'Loanpreparation.loanreturnpreparations',
    'Locality.localitydetails',
    'Locality.geocoorddetails',
    'Locality.latlonpolygons',
    'Locality.localitycitations',
    'Locality.localitynamealiass',
    'Picklist.picklistitems',
    'Preptype.attributedefs',
    'Preparation.preparationattribute',
    'Preparation.preparationattrs',
    'Referencework.authors',
    'Repositoryagreement.repositoryagreementagents',
    'Repositoryagreement.repositoryagreementauthorizations',
    'Spquery.fields',
    'Taxon.commonnames',
    'Taxon.taxoncitations',
}

dependent_fields.update(
     model.__name__ + '.' +
    ('attachments'
     if model.__name__ in ('Fieldnotebook',
                           'Fieldnotebookpage',
                           'Fieldnotebookpageset',
                           'Dnasequence',
                           'Dnasequencingrun')
     else model.__name__.lower() + 'attachments')
    for model in tables_with_attachments)

dependent_fields.update(model.__name__ + 'attachment.attachment' for model in tables_with_attachments)

for field in dependent_fields:
    model_name, field_name = field.split('.')
    model = getattr(models, model_name)
    field = model._meta.get_field_by_name(field_name)


system_tables = {
    'Attachment',
    'Attachmentimageattribute',
    'Attachmentmetadata',
    'Attachmenttag',
    'Attributedef',
    'Autonumberingscheme',
    'Collectionreltype',
    'Collectionrelationship',
    'Datatype',
    'Morphbankview',
    'Otheridentifier',
    'Picklist',
    'Picklistitem',
    'Recordset',
    'Recordsetitem',
    'Spappresource',
    'Spappresourcedata',
    'Spappresourcedir',
    'Spauditlog',
    'Spauditlogfield',
    'Spexportschema',
    'Spexportschemaitem',
    'Spexportschemaitemmapping',
    'Spexportschemamapping',
    'Spfieldvaluedefault',
    'Splocalecontainer',
    'Splocalecontaineritem',
    'Splocaleitemstr',
    'Sppermission',
    'Spprincipal',
    'Spquery',
    'Spqueryfield',
    'Spreport',
    'Sptasksemaphore',
    'Spversion',
    'Spviewsetobj',
    'Spvisualquery',
    'Specifyuser',
    'Workbench',
    'Workbenchdataitem',
    'Workbenchrow',
    'Workbenchrowexportedrelationship',
    'Workbenchrowimage',
    'Workbenchtemplate',
    'Workbenchtemplatemappingitem',
}

dependent_fields.update(model.__name__ + '.' + model.__name__.lower() + 'attachments'
                        for model in tables_with_attachments)


def is_dependent(model_name, field_name):
    return model_name.capitalize() + '.' + field_name.lower() in dependent_fields

system_tables.update(model.__name__ + 'attachment'
                     for model in tables_with_attachments)


system_tables.update(model.__name__ for model in models_by_tableid.values()
                     if model.__name__.endswith('treedef') or
                     model.__name__.endswith('treedefitem'))

for table in system_tables:
    getattr(models, table)


