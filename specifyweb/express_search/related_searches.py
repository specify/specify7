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
    filters = { 'determinations.iscurrent': True }
    columns = [
        'determinations.taxon.fullname',
        'determinations.taxon.commonname',
        'determinations.determiner.lastname',
        'determinations.determiner.firstname',
        'determinations.determiner.agenttype',
        ]

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
    filters = { 'collectionobjects.determinations.iscurrent': True }
    columns = [
        'collectionobjects.determinations.taxon.fullname',
        'locality.geography.fullname',
        ]

class AcceptedTaxon(RelatedSearch):
    definition = 'Taxon.acceptedtaxon'
    columns = [
        'fullname',
        'acceptedtaxon.fullname',
        ]

class SynonymCollObjs(RelatedSearch):
    definition = 'Collectionobject.determinations.taxon'
    distinct = True
    excludes = { 'determinations.taxon': F('determinations__preferredtaxon') }
    columns = [
        'catalognumber',
        'determinations.taxon.fullname',
        'determinations.preferredtaxon.fullname',
        ]

class OtherSynsCollObjs(RelatedSearch):
    definition = 'Collectionobject.determinations.preferredtaxon.acceptedchildren'
    distinct = True
    excludes = { 'determinations.preferredtaxon.acceptedchildren': F('determinations__preferredtaxon') }
    columns = [
        'catalognumber',
        'determinations.taxon.fullname',
        'determinations.preferredtaxon.fullname',
        'determinations.preferredtaxon.acceptedchildren.fullname',
        ]

class CurrCollObject(RelatedSearch):
    definition = 'Collectionobject.determinations.taxon'
    distinct = True
    filters = { 'determinations.iscurrent': True }
    columns = [
        'catalognumber',
        'catalogeddate',
        'determinations.taxon.fullname',
        ]

class AgentFromAgentVariant(RelatedSearch):
    definition = 'Agentvariant.agent'
    columns = [
        'name',
        'agent.lastname',
        'agent.firstname',
        ]

class LocalityAlias(RelatedSearch):
    definition = 'Locality'
    filters = { 'localitynamealiass.isnull': False }
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
    distinct = True
    filters = { 'collectionobjects.determinations.iscurrent': True }
    columns = [
        'collectionobjects.catalognumber',
        'collectionobjects.determinations.taxon.fullname',
        'accessionnumber',
        ]

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
