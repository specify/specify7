from django.db.models import F

from related import RelatedSearch

class ColObjCollectors(RelatedSearch):
    definition = 'Collectionobject.collectingevent.collectors.agent'
    distinct = True
    columns = [
        'catalognumber',
        'catalogeddate',
        'collectingevent.startdate',
        'collectingevent.collectors.agent.lastname',
        ]

class CollObjToDeterminer(RelatedSearch):
    definition = 'Collectionobject.determinations.determiner'
    distinct = True
    columns = [
        'determinations.taxon.fullname',
        'determinations.taxon.commonname',
        'determinations.determiner.lastname',
        'determinations.determiner.firstname',
        #                'determinations.determiner.agenttype',
        ]
    filters = { 'determinations.iscurrent': True }

class CollObToLocality(RelatedSearch):
    definition = 'Collectingevent.locality'
    columns = [
        'locality.localityname',
        'startdate',
        'enddate',
        'locality.latitude1',
        'locality.longitude1',
        ]

class CollObject(RelatedSearch):
    definition = 'Collectionobject.determinations.taxon'
    distinct = True
    columns = [
        'catalognumber',
        'catalogeddate',
        'determinations.taxon.fullname',
        ]

class GeoToTaxon(RelatedSearch):
    definition = 'Collectingevent.collectionobjects.determinations.taxon'
    distinct = True
    columns = [
        'collectionobjects.determinations.taxon.fullname',
        'locality.geography.fullname',
        ]
    filters = { 'collectionobjects.determinations.iscurrent': True }

class AcceptedTaxon(RelatedSearch):
    definition = 'Taxon.acceptedtaxon'
    columns = [
        'fullname',
        'acceptedtaxon.fullname',
        ]

class SynonymCollObjs(RelatedSearch):
    definition = 'Collectionobject.determinations.taxon'
    distinct = True
    columns = [
        'catalognumber',
        'determinations.taxon.fullname',
        'determinations.preferredtaxon.fullname',
        ]
    excludes = { 'determinations.taxon': F('determinations__preferredtaxon') }

class OtherSynsCollObjs(RelatedSearch):
    definition = 'Taxon'
    distinct = True
    columns = [
        'determinations.collectionobject.catalognumber',
        'fullname',
        'determinations.preferredtaxon.fullname',
        'acceptedchildren.fullname',
        ]
    excludes = { 'acceptedchildren__id': F('id') }

class CurrCollObject(RelatedSearch):
    definition = 'Collectionobject.determinations.taxon'
    distinct = True
    columns = [
        'catalognumber',
        'catalogeddate',
        'determinations.taxon.fullname',
        ]
    filters = { 'determinations.iscurrent': True }

class AgentFromAgentVariant(RelatedSearch):
    definition = 'Agent'
    columns = [
        'variants.name',
        'lastname',
        'firstname',
        ]

class LocalityAlias(RelatedSearch):
    definition = 'Locality'
    columns = [
        'localityname',
        'localitynamealiass.name'
        ]

class CEToCO(RelatedSearch):
    definition = 'Collectingevent.collectionobjects'
    columns = [
        'collectionobjects.catalognumber',
        'startdate',
        'enddate',
        ]

# class LocToCo(RelatedSearch):
#     definition = 'Locality.collectingevents.collectionobjects'
#     columns = [
#         'collectingevents.collectionobjects.catalognumber',
#         'collectingevents.startname',
#         'localityname',
#         'latitude1',
#         'longitude1',
#         ]

class AccessionToCo(RelatedSearch):
    definition = 'Accession.collectionobjects.determinations.taxon'
    columns = [
        'collectionobjects.catalognumber',
        'collectionobjects.determinations.taxon.fullname',
        'accessionnumber',
        ]
    filters = { 'collectionobjects.determinations.iscurrent': True }

class AccessionToAgent(RelatedSearch):
    definition = 'Accession.accessionagents.agent'
    columns = [
        'accessionagents.agent.lastname',
        'accessionagents.agent.firstname',
        'accessionagents.role',
        'accessionnumber',
        ]

class BorrowToAgent(RelatedSearch):
    definition = 'Borrow.borrowagents.agent'
    columns = [
        'invoicenumber',
        'borrowagents.agent.lastname',
        'borrowagents.agent.firstname',
        'borrowagents.role',
        ]

class AppraisalToAgent(RelatedSearch):
    definition = 'Appraisal.agent'
    columns = [
        'appraisalnumber',
        'agent.lastname',
        'agent.firstname',
        ]



__all__ = [cls.__name__ for cls in globals().values()
           if isinstance(cls, type) and
           issubclass(cls, RelatedSearch) and
           not cls is RelatedSearch]
