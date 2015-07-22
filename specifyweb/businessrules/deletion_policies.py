"""Defines how deletions of related rows should be handled. """

from specifyweb.specify.datamodel import datamodel

# TODO: A lot of this is implicit in the dependent fields information.

# Set of ForeignKey fields for which the referencing row should be
# deleted if the pointed to foreign row is deleted. Attachment fields
# are added automatically.
cascade = {
    '%s.%s' % (rel.relatedModelName.capitalize(), rel.otherSideName.lower())
    for table in datamodel.tables
    for rel in table.relationships
    if rel.dependent and rel.type == 'one-to-many'
}


# {
#     'Collectionrelationship.leftside',
#     'Collectionrelationship.rightside',
# }

# # Set of ForeignKey Fields for which deleting the foreign row is
# # blocked by the presence of a referencing row.

# protect = {
#     '%s.%s' % (table.name.capitalize(), rel.name.lower())
#     for table in datamodel.tables
#     for rel in table.relationships
#     if rel.type == 'many-to-one'
# } - cascade

# protect = {
#     'Accessionauthorization.permit',
#     'Agentgeography.geography',
#     'Collectingevent.locality',
#     'Collectingeventattribute.hosttaxon',
#     'Collectionobject.accession',
#     'Collectionobject.appraisal',
#     'Collectionobject.cataloger',
#     'Collectionobject.collectingevent',
#     'Collectionobject.collection',
#     'Collectionobject.paleocontext',
#     'Collectingevent.paleocontext',
#     'Container.storage',
#     'Determination.preferredtaxon',
#     'Determination.taxon',
#     'Geography.definitionitem',
#     'Geologictimeperiod.definitionitem',
#     'Lithostrat.definitionitem',
#     'Locality.geography',
#     'Locality.paleocontext',
#     'Paleocontext.biostrat',
#     'Paleocontext.chronosstrat',
#     'Paleocontext.chronosstratend',
#     'Paleocontext.lithostrat',
#     'Preparation.preptype',
#     'Preparation.storage',
#     'Referencework.journal',
#     'Storage.definitionitem',
#     'Taxon.definitionitem',
#     'Taxon.hybridparent1',
#     'Taxon.hybridparent2',
#     'Taxoncitation.taxon',
# }
