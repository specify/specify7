from django.db.models import F

from .related import RelatedSearch

class ColObjCollectors(RelatedSearch):
    id = 5
    definition = 'Collectionobject.collectingevent.collectors.agent'
    distinct = True
    columns = [
        'catalognumber',
        'catalogeddate',
        'collectingevent.startdate',
        'collectingevent.collectors.agent.lastname',
        ]

class CollObjToDeterminer(RelatedSearch):
    id = 1
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
    id = 2
    definition = 'Collectingevent.locality'
    columns = [
        'locality.localityname',
        'startdate',
        'enddate',
        'locality.latitude1',
        'locality.longitude1',
        ]

class CollObject(RelatedSearch):
    id = 3
    definition = 'Collectionobject.determinations.taxon'
    distinct = True
    columns = [
        'catalognumber',
        'catalogeddate',
        'determinations.taxon.fullname',
        ]

class GeoToTaxon(RelatedSearch):
    id = 4
    definition = 'Collectingevent.collectionobjects.determinations.taxon'
    distinct = True
    filters = { 'collectionobjects.determinations.iscurrent': True }
    columns = [
        'collectionobjects.determinations.taxon.fullname',
        'locality.geography.fullname',
        ]

class AcceptedTaxon(RelatedSearch):
    id = 6
    definition = 'Taxon.acceptedtaxon'
    columns = [
        'fullname',
        'acceptedtaxon.fullname',
        ]

class SynonymCollObjs(RelatedSearch):
    id = 7
    definition = 'Collectionobject.determinations.taxon'
    distinct = True
    excludes = { 'determinations.taxon': F('determinations__preferredtaxon') }
    columns = [
        'catalognumber',
        'determinations.taxon.fullname',
        'determinations.preferredtaxon.fullname',
        ]

class OtherSynsCollObjs(RelatedSearch):
    id = 9
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
    id = 10
    definition = 'Collectionobject.determinations.taxon'
    distinct = True
    filters = { 'determinations.iscurrent': True }
    columns = [
        'catalognumber',
        'catalogeddate',
        'determinations.taxon.fullname',
        ]

class AgentFromAgentVariant(RelatedSearch):
    id = 11
    definition = 'Agentvariant.agent'
    columns = [
        'name',
        'agent.lastname',
        'agent.firstname',
        ]

class LocalityAlias(RelatedSearch):
    id = 12
    definition = 'Locality'
    filters = { 'localitynamealiass.isnull': False }
    columns = [
        'localityname',
        'localitynamealiass.name'
        ]

class CEToCO(RelatedSearch):
    id = 13
    definition = 'Collectingevent.collectionobjects'
    columns = [
        'collectionobjects.catalognumber',
        'startdate',
        'enddate',
        ]

# class LocToCo(RelatedSearch):
#     id = 29
#     definition = 'Locality.collectingevents.collectionobjects'
#     columns = [
#         'collectingevent.collectionobjects.catalognumber',
#         'collectingevent.startdate',
#         'localityname',
#         'latitude1',
#         'longitude1',
#         ]

class AccessionToCo(RelatedSearch):
    id = 31
    definition = 'Accession.collectionobjects.determinations.taxon'
    distinct = True
    filters = { 'collectionobjects.determinations.iscurrent': True }
    columns = [
        'collectionobjects.catalognumber',
        'collectionobjects.determinations.taxon.fullname',
        'accessionnumber',
        ]

class AccessionToAgent(RelatedSearch):
    id = 32
    definition = 'Accession.accessionagents.agent'
    columns = [
        'accessionagents.agent.lastname',
        'accessionagents.agent.firstname',
        'accessionagents.role',
        'accessionnumber',
        ]

class BorrowToAgent(RelatedSearch):
    id = 33
    definition = 'Borrow.borrowagents.agent'
    columns = [
        'invoicenumber',
        'borrowagents.agent.lastname',
        'borrowagents.agent.firstname',
        'borrowagents.role',
        ]

class AppraisalToAgent(RelatedSearch):
    id = 34
    definition = 'Appraisal.agent'
    columns = [
        'appraisalnumber',
        'agent.lastname',
        'agent.firstname',
        ]

class GeoTimePeriodToCO(RelatedSearch):
    id = 35
    definition = 'Geologictimeperiod.chronosstratspaleocontext.collectionobjects'
    columns = [
        'fullname',
        'chronosstratspaleocontext.collectionobjects.catalognumber'
        ]

class CollEventToCollectors(RelatedSearch):
    id = 36
    definition = 'Collectingevent.collectors.agent'
    columns = [
        'collectors.agent.lastname',
        'collectors.agent.firstname',
        'startdate',
        'stationfieldnumber'
        ]

# class CollTripCollEvent(RelatedSearch):
#     id = 37
#     definition = 'Collectingevent.collectingtrip'
#     columns = [
#         'stationfieldnumber',
#         'collectingtrip.collectingtripname',
#         'startdate'
#         ]

class AgentExchangeIn(RelatedSearch):
    id = 38
    definition = 'Exchangein.agentreceivedfrom'
    columns = [
        'exchangedate',
        'descriptionofmaterial',
        'agentreceivedfrom.abbreviation'
        ]

class AgentExchangeOut(RelatedSearch):
    id = 39
    definition = 'Exchangeout.agentsentto'
    columns = [
        'exchangedate',
        'descriptionofmaterial',
        'agentsentto.abbreviation'
        ]

# class GeographyCE(RelatedSearch):
#     id = 40
#     definition = 'Geography.localities.collectingevents'
#     columns = [
#         'localities.collectingevents.startdate',
#         'localities.collectingevents.stationfieldnumber',
#         'fullname'
#         ]

# class GeographyCO(RelatedSearch):
#     id = 41
#     definition = 'Geography.localities.collectingevents.collectionobjects'
#     columns = [
#         'localities.collectingevents.collectionobjects.catalognumber',
#         'fullname'
#         ]

class GiftCO(RelatedSearch):
    id = 42
    definition = 'Gift.giftpreparations.preparation.collectionobject'
    columns = [
        'giftpreparations.preparation.collectionobject.catalognumber',
        'giftpreparations.preparation.preptype.name',
        'giftnumber'
        ]

class GiftAgent(RelatedSearch):
    id = 43
    definition = 'Gift.giftagents.agent'
    columns = [
        'giftagents.agent.lastname',
        'giftagents.agent.firstname',
        'giftagents.role',
        'giftnumber'
        ]

class LoanCO(RelatedSearch):
    id = 44
    definition = 'Loan.loanpreparations.preparation.collectionobject'
    columns = [
        'loanpreparations.preparation.collectionobject.catalognumber',
        'loanpreparations.preparation.preptype.name',
        'loannumber'
        ]

class LoanAgent(RelatedSearch):
    id = 45
    definition = 'Loan.loanagents.agent'
    columns = [
        'loanagents.agent.lastname',
        'loanagents.agent.firstname',
        'loanagents.role',
        'loannumber'
        ]

class LithoStratToCO(RelatedSearch):
    id = 46
    definition = 'Lithostrat.paleocontexts.collectionobjects'
    columns = [
        'paleocontexts.collectionobjects.catalognumber',
        'fullname'
        ]

class PermitToCO(RelatedSearch):
    id = 47
    definition = 'Permit.accessionauthorizations.accession.collectionobjects'
    columns = [
        'accessionauthorizations.accession.collectionobjects.catalognumber',
        'permitnumber'
        ]

class PermitIssuedToAgent(RelatedSearch):
    id = 48
    definition = 'Permit.issuedto'
    columns = [
        'issuedto.lastname',
        'issuedto.firstname',
        'permitnumber'
        ]

class PermitIssuedByAgent(RelatedSearch):
    id = 49
    definition = 'Permit.issuedby'
    columns = [
        'issuedby.lastname',
        'issuedby.firstname',
        'permitnumber'
        ]

# class ProjectCO(RelatedSearch):
#     id = 50
#     definition = 'Project.collectionobjects'
#     columns = [
#         'collectionobjects.catalognumber',
#         'projectname',
#         'projectnumber'
#         ]

class ProjectAgent(RelatedSearch):
    id = 51
    definition = 'Project.agent'
    columns = [
        'agent.lastname',
        'agent.firstname',
        'projectname',
        'projectnumber'
        ]

class RepoAgreeAgent(RelatedSearch):
    id = 52
    definition = 'Repositoryagreement.originator'
    columns = [
        'originator.lastname',
        'originator.firstname',
        'repositoryagreementnumber'
        ]

class StorageCO(RelatedSearch):
    id = 53
    definition = 'Storage.preparations.collectionobject'
    columns = [
        'preparations.collectionobject.catalognumber',
        'name',
        'fullname'
        ]

class TaxCollObject(RelatedSearch):
    id = 54
    distinct = True
    definition = 'Collectionobject.determinations.taxon'
    columns = [
        'catalognumber',
        'catalogeddate',
        'determinations.iscurrent',
        'determinations.taxon.fullname'
        ]

# class ColObjToContainer(RelatedSearch):
#     id = 55
#     definition = 'Collectionobject.container'
#     columns = [
#         'container.type',
#         'container.name',
#         'catalognumber'
#         ]

# class ContainerToKids(RelatedSearch):
#     id = 56
#     definition = "Collectionobject.container"
#     columns = [
#         'catalognumber',
#         'catalogeddate',
#         'container.name'
#         ]

# class ContainerToContainerKids(RelatedSearch):
#     id = 57
#     definition = "Container.children"
#     columns = [
#         'name',
#         'children.name'
#         ]

class ExchangeInCO(RelatedSearch):
    id = 58
    definition = 'Exchangein.exchangeinpreps.preparation.collectionobject'
    columns = [
        'exchangeinpreps.preparation.collectionobject.catalognumber',
        'exchangeinpreps.preparation.preptype.name',
        'exchangedate'
        ]

class ExchangeOutCO(RelatedSearch):
    id = 59
    definition = 'Exchangeout.exchangeoutpreps.preparation.collectionobject'
    columns = [
        'exchangeoutpreps.preparation.collectionobject.catalognumber',
        'exchangeoutpreps.preparation.preptype.name',
        'exchangedate'
        ]

__all__ = [cls.__name__ for cls in globals().values()
           if isinstance(cls, type) and
           issubclass(cls, RelatedSearch) and
           not cls is RelatedSearch]
