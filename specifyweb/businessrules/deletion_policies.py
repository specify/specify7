"""Defines how deletions of related rows should be handled. """

# TODO: A lot of this is implicit in the dependent fields information.

# Set of ForeignKey fields for which the referencing row should be
# deleted if the pointed to foreign row is deleted.
cascade = {
    'Address.agent',
    'Agentgeography.agent',
    'Agentspecialty.agent',
    'Commonnametx.taxon',
    'Determination.collectionobject',
    'Geography.parent',
    'Geologictimeperiod.parent',
    'Lithostrat.parent',
    'Recordsetitem.recordset',
    'Storage.parent',
    'Taxon.parent',
    'Preparation.collectionobject',
    'Loanpreparation.loan',
    'Loanagent.loan',
    'Loanreturnpreparation.loanpreparation',
}

# Set of ForeignKey Fields for which deleting the foreign row is
# blocked by the presence of a referencing row.
protect = {
    'Accessionauthorization.permit',
    'Agentgeography.geography',
    'Collectingevent.locality',
    'Collectingeventattribute.hosttaxon',
    'Collectionobject.accession',
    'Collectionobject.appraisal',
    'Collectionobject.collectingevent',
    'Collectionobject.collection',
    'Container.storage',
    'Determination.preferredtaxon',
    'Determination.taxon',
    'Geography.definitionitem',
    'Geologictimeperiod.definitionitem',
    'Lithostrat.definitionitem',
    'Locality.geography',
    'Paleocontext.biostrat',
    'Paleocontext.chronosstrat',
    'Paleocontext.chronosstratend',
    'Paleocontext.lithostrat',
    'Preparation.preptype',
    'Preparation.storage',
    'Referencework.journal',
    'Storage.definitionitem',
    'Taxon.definitionitem',
    'Taxon.hybridparent1',
    'Taxon.hybridparent2',
    'Taxoncitation.taxon',
}
