from businessrules.attachment_rules import tables_with_attachments

dependent_fields = {
    'Accession.accessionagents',
    'Accession.accessionauthorizations',
    'Agent.addresses',
    'Agent.variants',
    'Agent.groups',
    'Collectionobject.determinations',
    'Collectionobject.dnasequences',
    'Collectionobject.collectionobjectattribute',
    'Collectionobject.preparations',
    'Collectingevent.collectors',
    'Collectingevent.collectingeventattribute',
    'Collector.agent',
    'Locality.localitydetails',
    'Picklist.picklistitems',
    'Spquery.fields'
}

dependent_fields.update(model.__name__ + '.' + model.__name__.lower() + 'attachments'
                        for model in tables_with_attachments)
