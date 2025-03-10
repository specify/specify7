"""
Modules for filtering resources by the collection logged in
"""

from typing import Any, List, Optional, Tuple
from django.core.exceptions import FieldError
from django.db.models import Q
from django_stubs_ext import QuerySetAny
from specifyweb.specify.filter_by_col_map import TABLE_TO_COLLECTION_FILTER_QUERIES

from specifyweb.specify.load_datamodel import Table

from . import models as spmodels
from .scoping import ScopeType
from .models import Geography, Geologictimeperiod, Lithostrat, Taxon, Storage, \
    Attachment, Tectonicunit

HIERARCHY = ['collectionobject', 'collection', 'discipline', 'division', 'institution']

class HierarchyException(Exception):
    pass

def filter_by_collection_original(queryset, collection, strict=True):
    if queryset.model is Attachment:
        return queryset.filter(
            Q(scopetype=None) |
            Q(scopetype=ScopeType.GLOBAL) |
            Q(scopetype=ScopeType.COLLECTION, scopeid=collection.id) |
            Q(scopetype=ScopeType.DISCIPLINE, scopeid=collection.discipline.id) |
            Q(scopetype=ScopeType.DIVISION, scopeid=collection.discipline.division.id) |
            Q(scopetype=ScopeType.INSTITUTION, scopeid=collection.discipline.division.institution.id))

    if queryset.model in (Geography, Geologictimeperiod, Lithostrat, Tectonicunit):
        return queryset.filter(definition__disciplines=collection.discipline)

    if queryset.model is Taxon:
        return queryset.filter(definition__discipline=collection.discipline)

    if queryset.model is Storage:
        return queryset.filter(definition__institutions=collection.discipline.division.institution.id)

    try:
        return queryset.filter(collectionmemberid=collection.id)
    except FieldError:
        pass

    for fieldname in HIERARCHY:
        if getattr(queryset.model, fieldname, None):
            break
    else:
        if strict:
            raise HierarchyException('queryset model ' + queryset.model.__name__ + ' has no hierarchy field')
        else:
            return queryset

    if fieldname == 'collectionobject':
        lookup = 'collectionobject__collection'
        join = 'collection'
    else:
        lookup = join = fieldname

    value = collection
    field = 'collection'
    while field != join:
        field = HIERARCHY[ 1+HIERARCHY.index(field) ]
        value = getattr(value, field)

    return queryset.filter(**{ lookup: value })

SCOPE_TABLE_FILTER_EXPR = {
    'Institution': 'collection.discipline.division.institution',
    'Division': 'collection.discipline.division',
    'Discipline': 'collection.discipline',
    'Collection': 'collection',
    'CollectionObject': 'collection',
    'Attachment': '',
    'ScopeType': '',
    'Discipline_ScopeType': 'collection.discipline.usergroupscopeid',
}
GENERIC_FIELDS_TO_TABLE_MAP = {
    'institution': 'Institution',
    'division': 'Division',
    'discipline': 'Discipline',
    'collection': 'Collection',
    'collectionobject': 'CollectionObject',
    'institutions': 'Institution',
    'divisions': 'Division',
    'disciplines': 'Discipline',
    'collections': 'Collection',
    'collectionobjects': 'CollectionObject',
    'attachment': 'Attachment',
    'attachments': 'Attachment',
    'base_attachment': 'Attachment',
    'usergroupscopeid': 'ScopeType',
}
FIELDS_TO_INSTITUTION_MAP = {
    'institution': (['institution']),
    'institutions': (['institutions']),
    'journal': (['journal', 'institution']),
    'permit': (['permit', 'institution']),
    # 'referencework': (['referencework', 'institutions']),
    'referencework': (['referencework', 'institution']),
    'storage': (['storage', 'definition', 'institutions'])
}
FIELDS_TO_DIVISION_MAP = {
    'division': (['division']),
    'divisions': (['divisions']),
    'accession': (['accession', 'division']),
    'accessions': (['accessions', 'division']),
    'agent': (['agent', 'division']),
    'agents': (['agents', 'division']),
    'collector': (['collector', 'division']),
    'exchangein': (['exchangein', 'division']),
    'exchangeout': (['exchangeout', 'division']),
    'exchangeouts': (['exchangeouts', 'division']),
    'fundingagent': (['fundingagent', 'division']),
    'groupperson': (['groupperson', 'division']),
    'repositoryagreement': (['repositoryagreement', 'division'])
}
FIELDS_TO_DISCIPLINE_MAP = {
    'discipline': (['discipline']),
    'disciplines': (['disciplines']),
    'usergroupscopeid': (['usergroupscopeid']),
    'attributedef': (['attributedef', 'discipline']),
    'collectingevent': (['collectingevent', 'discipline']),
    'collectioneventattribute': (['collectioneventattribute', 'discipline']),
    'collectiontrip': (['collectiontrip', 'discipline']),
    'collectingtrip': (['collectingtrip', 'discipline']),
    'collectiontripattribute': (['collectiontripattribute', 'discipline']),
    'exchangeinprep': (['exchangeinprep', 'discipline']),
    'exchangeoutprep': (['exchangeoutprep', 'discipline']),
    'fieldnotebookpage': (['fieldnotebookpage', 'discipline']),
    'fieldnotebookpageset': (['fieldnotebookpageset', 'discipline']),
    'gift': (['gift', 'discipline']),
    'giftagent': (['giftagent', 'discipline']),
    'giftpreparation': (['giftpreparation', 'discipline']),
    'loan': (['loan', 'discipline']),
    'loanagent': (['loanagent', 'discipline']),
    'loanpreparation': (['loanpreparation', 'discipline']),
    'loanreturnpreparation': (['loanreturnpreparation', 'discipline']),
    'locality': (['locality', 'discipline']),
    'localitycitation': (['localitycitation', 'discipline']),
    'localitynamealias': (['localitynamealias', 'discipline']),
    'paleocontext': (['paleocontext', 'discipline']),
    'shipment': (['shipment', 'discipline']),
    'spexportschema': (['spexportschema', 'discipline']),
    'spexportschemas': (['spexportschemas', 'discipline']),
    'splocalecontainer': (['splocalecontainer', 'discipline']),
    'taxon': (['taxon', 'definition', 'discipline']),
    'taxons': (['taxons', 'definition', 'discipline']),
    'geography': (['geography', 'definition', 'disciplines']),
    'geologictimeperiod': (['geologictimeperiod', 'definition', 'disciplines']),
    'lithostratigraphy': (['lithostratigraphy', 'definition', 'disciplines'])
}
FIELDS_TO_COLLECTION_MAP = {
    'collection': (['collection']),
    'collections': (['collections']),
    'fieldnotebook': (['fieldnotebook', 'collection']),
    'picklist': (['picklist', 'collection']),
    'preptype': (['preptype', 'collection']),
    'spappresourcedir': (['spappresourcedir', 'collection']),
    'sptasksemaphor': (['sptasksemaphor', 'collection'])   
}
FIELDS_TO_COLLECTIONOBJECT_MAP = {
    'collectionobject': (['collectionobject', 'collection']),
    'collectionobjects': (['collectionobjects', 'collection']),
    'collectionobjectattachment': (['collectionobjectattachment', 'collectionobject', 'collection']),
    'collectionobjectattr': (['collectionobjectattr', 'collectionobject', 'collection']),
    'collectionobjectcitation': (['collectionobjectcitation', 'collectionobject', 'collection']),
    'collectionobjectproperty': (['collectionobjectproperty', 'collectionobject', 'collection']),
    'conservdescription': (['conservdescription', 'collectionobject', 'collection']),
    'dnasequence': (['dnasequence', 'collectionobject', 'collection']),
    'determination': (['determination', 'collectionobject', 'collection']),
    'exsiccataitem': (['exsiccataitem', 'collectionobject', 'collection']),
    'otheridentifier': (['otheridentifier', 'collectionobject', 'collection']),
    'preparation': (['preparation', 'collectionobject', 'collection']),
    'preparations': (['preparations', 'collectionobject', 'collection']),
    'treatmentevent': (['treatmentevent', 'collectionobject', 'collection']),
    'voucherrelationship': (['voucherrelationship', 'collectionobject', 'collection'])
}
FIELDS_TO_OTHER_MAP = {
    'attachment': (['attachment'],),
    'attachments': (['attachments'],),
    'base_attachment': (['base_attachment'],),
    'deaccession': (['deaccession', 'agent1'],
                    ['deaccession', 'agent2'],
                    ['deaccession', 'exchangeouts']),
    'definition_disciplines': (['definition', 'disciplines'],),
    'definition_discipline': (['definition', 'discipline'],),
    'definition_institutions': (['definition', 'institutions'],),
    'borrowagents': (['borrowagents', 'agent'],),
    'borrow': (['borrow', 'borrowagents', 'agent'],),
    'borrowmaterial': (['borrowmaterial', 'borrow', 'borrowagents', 'agent'],),
    'borrowreturnmaterials': (['agent'],
                              ['borrowmaterial']), # check this
    'leftsidecollection': (['leftsidecollection', 'discipline'],),
    'rightsidecollection': (['rightsidecollection', 'discipline'],),
    'collectionrelationshiptype': (['collectionrelationshiptype', 'leftsidecollection'],
                                   ['collectionrelationshiptype', 'rightsidecollection']),
    'leftside': (['leftside', 'collection'],),
    'rightside': (['rightside', 'collection'],),
    'collectionrelationship': (['collectionrelationship', 'leftside'],
                               ['collectionrelationship', 'rightside']),
    'citations': (['citations', 'referencework'],),
    'commonnametx': (['commonnametx', 'taxon'],
                     ['commonnametx', 'citations']),
    'conservevent': (['conservevent', 'conservdescription', 'collectionobject'],),
    # 'sequencingrun': (['sequencingrun', 'collectionobject'],),
    'sequencingrun': (['sequencingrun', 'dnasequence'],),
    # 'dnasequencingrun': (['dnasequencingrun', 'collectionobject'],),
    # 'dnasequencingruns': (['dnasequencingruns', 'collectionobject'],),
    'dnasequencingrun': (['dnasequencingrun', 'dnasequence'],),
    'dnasequencingruns': (['dnasequencingruns', 'dnasequence'],),
    'permit': (['permit', 'institution'],),
    'agent1': (['agent1', 'division'],),
    'agent2': (['agent2', 'division'],),
    'disposal': (['disposal', 'deaccession'],),
    'treedef': (['treedef', 'disciplines'],), #TODO: check this
    'treedef_discipline': (['treedef', 'discipline'],),
    'treedef_disciplines': (['treedef', 'disciplines'],),
    'treedef_institutions': (['treedef', 'institutions'],),
    'latlonpolygon': (['latlonpolygon', 'locality'],),
    'specifyuser': (['specifyuser', 'agents'],),
    'specifyusers': (['specifyusers', 'agents'],),
    'recordset': (['recordset', 'specifyuser'],),
    'spappresource': (['spappresource', 'specifyuser'],),
    'appresource': (['appresource', 'specifyuser'],),
    'exportschemaitem': (['exportschemaitem', 'spexportschema'],),
    'container': (['container', 'discipline'],), # check this, used by SpLocaleContainerItem->container->SPLocaleContainer
    'containername': (['containername', 'discipline'],), # check this too
    'permission': (['permission', 'specifyuser'],), # maybe add more Qs
    'permissions': (['permissions', 'specifyuser'],), # maybe add more Qs
    'principals': (['principals', 'scope', 'institution'],), # maybe add more Qs, maybe ['principals', 'permissions']
    'scope': (['scope', 'institution'],), # maybe edit this, maybe ['scope', 'permission']
    'schemamapping': (['schemamapping', 'spexportschemas'],),
    'workbench': (['workbench', 'specifyuser'],),
    'workbenchrow': (['workbenchrow', 'workbench'],),
    'workbenchtemplate': (['workbenchtemplate', 'specifyuser'],)
}

def generate_attachment_exprs(prefix=''):
    return (
        ({f'{prefix}scopetype': None}),
        ({f'{prefix}scopetype': ScopeType.GLOBAL}),
        ({f'{prefix}scopetype': ScopeType.COLLECTION, 'scopeid': 'collection.id'}),
        ({f'{prefix}scopetype': ScopeType.DISCIPLINE, 'scopeid': 'collection.discipline.id'}), 
        ({f'{prefix}scopetype': ScopeType.DIVISION, 'scopeid': 'collection.discipline.division.id'}), 
        ({f'{prefix}scopetype': ScopeType.INSTITUTION, 'scopeid': 'collection.discipline.division.institution.id'}),
    )

FIELDS_TO_ATTACHMENT_EXPRS = {
    key: generate_attachment_exprs(prefix) for key, prefix in [('base_attachment', ''), ('attachment', 'attachment__'), ('attachments', 'attachments__')]
}

FIELD_TO_EXPRS_MAP = {}
for field, expr in FIELDS_TO_INSTITUTION_MAP.items():
    FIELD_TO_EXPRS_MAP[field] = ((expr,), 'Institution')
for field, expr in FIELDS_TO_DIVISION_MAP.items():
    FIELD_TO_EXPRS_MAP[field] = ((expr,), 'Division')
for field, expr in FIELDS_TO_DISCIPLINE_MAP.items():
    FIELD_TO_EXPRS_MAP[field] = ((expr,), 'Discipline')
for field, expr in FIELDS_TO_COLLECTION_MAP.items():
    FIELD_TO_EXPRS_MAP[field] = ((expr,), 'Collection')
for field, expr in FIELDS_TO_COLLECTIONOBJECT_MAP.items():
    FIELD_TO_EXPRS_MAP[field] = ((expr,), 'CollectionObject')
for field, expr in FIELDS_TO_OTHER_MAP.items():
    FIELD_TO_EXPRS_MAP[field] = (expr, 'Other')

# Maps table name to that table's field names to that (eventually) will lead to a collection reference
TABLE_TO_FIELDS_MAP = {
    'Accession': ['division'],
    'AccessionAgent': ['accession'],
    'AccessionAttachment': ['accession', 'attachment'],
    'AccessionAuthorization': ['accession'],
    'AccessionCitation': ['accession', 'referencework'],
    'Address': ['divisions'],
    'AddressOfRecord': ['accessions', 'agent'],
    'Agent': ['division'],
    'AgentAttachment': ['agent', 'attachment'],
    'AgentGeography': ['agent', 'geography'],
    'AgentIdentifier': ['agent'],
    'AgentSpecialty': ['agent'],
    'AgentVariant': ['agent'],
    'Appraisal': ['collectionobjects', 'accession', 'agent'],
    'Attachment': ['base_attachment'],
    'AttachmentImageAttribute': ['attachments'],
    'AttachmentMetadata': ['attachment'],
    'AttachmentTag': ['attachment'],
    'AttributeDef': ['discipline'],
    'Author': ['agent'],
    'AutoNumberingScheme': ['collections', 'divisions', 'disciplines'],
    'Borrow': ['borrowagents'],
    'BorrowAgent': ['agent'],
    'BorrowAttachment': ['borrow', 'attachment'],
    'BorrowMaterial': ['borrow'], # 'BorrowMaterial': ['borrow', 'borrowreturnmaterials'], # check to make sure infinte recursion doesn't happen
    'BorrowReturnMaterial': ['borrowmaterial', 'agent'],
    'CollectingEvent': ['discipline'],
    'CollectingEventAttachment': ['collectingevent', 'attachment'],
    'CollectingEventAttr': ['collectingevent', 'definition_discipline'],
    'CollectingEventAttribute': ['discipline'],
    'CollectingEventAuthorization': ['collectingevent', 'permit'],
    'CollectingTrip': ['discipline'],
    'CollectingTripAttachment': ['collectingtrip', 'attachment'],
    'CollectingTripAttribute': ['discipline'],
    'CollectingTripAuthorization': ['collectingtrip', 'permit'],
    'Collection': ['discipline'],
    'CollectionObject': ['collection'],
    'CollectionObjectAttachment': ['collectionobject'],
    'CollectionObjectAttr': ['collectionobject'],
    'CollectionObjectAttribute': ['collectionobjects', 'agent1'],
    'CollectionObjectCitation': ['collectionobject'],
    'CollectionObjectProperty': ['collectionobject'],
    'CollectionRelType': ['leftsidecollection', 'rightsidecollection'],
    'CollectionRelationship': ['leftside', 'rightside'],
    'Collector': ['division'],
    'CommonNameTx': ['taxon', 'citations'],
    'CommonNameTxCitation': ['commonnametx', 'referencework'],
    'ConservDescription': ['collectionobject'],
    'ConservDescriptionAttachment': ['attachment', 'conservdescription'],
    'ConservEvent': ['conservdescription'],
    'ConservEventAttachment': ['attachment', 'conservevent'],
    'Container': ['storage'],
    'DNAPrimer': ['dnasequencingruns'],
    'DNASequence': ['collectionobject'],
    'DNASequenceAttachment': ['dnasequence', 'attachment'],
    'DNASequencingRun': ['dnasequence'],
    'DNASequencingRunAttachment': ['dnasequencingrun', 'attachment'],
    'DNASequencingRunCitation': ['sequencingrun', 'referencework'],
    'DataType': None, # throw HierarchyException
    'Deaccession': ['agent1', 'agent2', 'exchangeouts'],
    'DeaccessionAgent': ['agent', 'deaccession'],
    'DeaccessionAttachment': ['attachment', 'deaccession'],
    'Determination': ['collectionobject'],
    'DeterminationCitation': ['determination', 'referencework'],
    'Determiner': ['determination', 'agent'],
    'Discipline': ['usergroupscopeid'],
    'Disposal': ['deaccession'],
    'DisposalAgent': ['disposal', 'agent'],
    'DisposalAttachment': ['disposal', 'attachment'],
    'DisposalPreparation': ['disposal', 'preparation'],
    'Division': ['usergroupscopeid'],
    'ExchangeIn': ['division'],
    'ExchangeInAttachment': ['exchangein', 'attachment'],
    'ExchangeInPrep': ['discipline'],
    'ExchangeOut': ['division'],
    'ExchangeOutAttachment': ['exchangeout', 'attachment'],
    'ExchangeOutPrep': ['discipline'],
    'Exsiccata': ['referencework'],
    'ExsiccataItem': ['collectionobject'],
    'Extractor': ['dnasequence', 'agent'],
    'FieldNotebook': ['collection'],
    'FieldNotebookAttachment': ['fieldnotebook', 'attachment'],
    'FieldNotebookPage': ['discipline'],
    'FieldNotebookPageAttachment': ['fieldnotebookpage', 'attachment'],
    'FieldNotebookPageSet': ['discipline'],
    'FieldNotebookPageSetAttachment': ['fieldnotebookpageset', 'attachment'],
    'FundingAgent': ['division'],
    'GeoCoordDetail': ['locality'],
    'Geography': ['definition_disciplines'],
    'GeographyTreeDef': ['disciplines'],
    'GeographyTreeDefItem': ['treedef'],
    'GeologicTimePeriod': ['definition_disciplines'],
    'GeologicTimePeriodTreeDef': ['disciplines'],
    'GeologicTimePeriodTreeDefItem': ['treedef'],
    'Gift': ['discipline'],
    'GiftAgent': ['gift'],
    'GiftAttachment': ['gift', 'attachment'],
    'GiftPreparation': ['gift'],
    'GroupPerson': ['division'],
    'InfoRequest': ['agent'],
    'Institution': ['usergroupscopeid'], # check this, maybe should be 'division'
    'InstitutionNetwork': ['collections'],
    'Journal': ['institution'],
    'LatLonPolygon': ['locality'],
    'LatLonPolygonPnt': ['latlonpolygon'],
    'LithoStrat': ['definition_disciplines'],
    'LithoStratTreeDef': ['disciplines'],
    'LithoStratTreeDefItem': ['treedef'],
    'Loan': ['discipline'],
    'LoanAgent': ['discipline'],
    'LoanAttachment': ['loan', 'attachment'],
    'LoanPreparation': ['discipline'],
    'LoanReturnPreparation': ['discipline'],
    'Locality': ['discipline'],
    'LocalityAttachment': ['locality', 'attachment'],
    'LocalityCitation': ['locality'],
    'LocalityDetail': ['locality'],
    'LocalityNameAlias': ['locality'],
    'MaterialSample': ['preparation'],
    'MorphBankView': None, # throw HierarchyException
    'Notification': None, # throw HierarchyException
    'OtherIdentifier': ['collectionobject'],
    'PaleoContext': ['discipline'],
    'PcrPerson': ['dnasequence', 'agent'],
    'Permit': ['institution'],
    'PermitAttachment': ['permit', 'attachment'],
    'PickList': ['collection'],
    'PickListItem': ['picklist'],
    'PrepType': ['collection'],
    'Preparation': ['collectionobject'],
    'PreparationAttachment': ['preparation', 'attachment'],
    'PreparationAttr': ['preparation', 'definition_discipline'],
    'PreparationAttribute': ['preparations'],
    'PreparationProperty': ['preparation'],
    'Project': ['agent', 'collectionobjects'],
    'RecordSet': ['specifyuser'],
    'RecordSetItem': ['recordset'],
    'ReferenceWork': ['institution'],
    'ReferenceWorkAttachment': ['referencework', 'attachment'],
    'RepositoryAgreement': ['division'],
    'RepositoryAgreementAttachment': ['repositoryagreement', 'attachment'],
    'Shipment': ['discipline'],
    'SpAppResource': ['specifyuser'],
    'SpAppResourceData': ['spappresource'],
    'SpAppResourceDir': ['collection'],
    'SpAuditLog': None, # throw HierarchyException
    'SpAuditLogField': None, # throw HierarchyException
    'SpExportSchema': ['discipline'],
    'SpExportSchemaItem': ['spexportschema'],
    'SpExportSchemaItemMapping': ['exportschemaitem'],
    'SpExportSchemaMapping': ['spexportschemas'],
    'SpFieldValueDefault': None, # throw HierarchyException
    'SpLocaleContainer': ['discipline'],
    'SpLocaleContainerItem': ['container'],
    'SpLocaleItemStr': ['containername'],
    # 'SpPermission': ['principals'], # check this, maybe ['permissions', 'scope']
    'SpPermission': None, # having trouble with this one, setting it to None for now
    # 'SpPrincipal': ['scope'], #['scope', 'specifyusers', 'permissions'],
    'SpPrincipal': None, # having trouble with this one, setting it to None for now
    'SpQuery': ['specifyuser'],
    'SpQueryField': [],
    'SpReport': ['specifyuser', 'appresource'],
    'SpSymbiotaInstance': ['schemamapping'],
    'SpTaskSemaphore': ['collection'],
    'SpVersion': None, # throw HierarchyException
    'SpViewSetObj': ['spappresourcedir'],
    'SpVisualQuery': ['specifyuser'],
    'SpecifyUser': ['agents'],
    'Storage': ['definition_institutions'],
    'StorageAttachment': ['storage', 'attachment'],
    'StorageTreeDef': ['institutions'],
    'StorageTreeDefItem': ['treedef_institutions'],
    'Taxon': ['definition_discipline'],
    'TaxonAttachment': ['taxon', 'attachment'],
    'TaxonAttribute': ['agent1', 'taxons'],
    'TaxonCitation': ['taxon', 'referencework'],
    'TaxonTreeDef': ['discipline'],
    'TaxonTreeDefItem': ['treedef_discipline'],
    'TreatmentEvent': ['collectionobject'],
    'TreatmentEventAttachment': ['treatmentevent', 'attachment'],
    'VoucherRelationship': ['collectionobject'],
    'Workbench': ['specifyuser'],
    'WorkbenchDataItem': ['workbenchrow'],
    'WorkbenchRow': ['workbench'],
    'WorkbenchRowExportedRelationship': ['workbenchrow'],
    'WorkbenchRowImage': ['workbenchrow'],
    'WorkbenchTemplate': ['specifyuser'],
    'WorkbenchTemplateMappingItem': ['workbenchtemplate'],
}

def build_expr_path(field_names_path: List[str]) -> str:
    """
    Creates a query path string from a list of field names by joining them with double underscores, 
    commonly used in ORM queries.
    """
    expr = ''
    for field in field_names_path:
        expr += f'{field}__'
    return expr[:-2]

def is_table_already_in_path(table: Table, table_path: List[str] = []) -> bool:
    """
    Checks if a given table object is already included in a list of tables.
    """
    return table in table_path

def is_table_name_already_in_path(table: str, table_path: List[str] = []) -> bool:
    """
    Checks if a given table name is already included in a list of table names.
    """
    if table == 'Other':
        return False # TODO: check this later
    return table in table_path

def clean_field_path(field_path: List[str]) -> List[str]:
    """
    Removes consecutive duplicates from a list of field names to prevent redundant path steps in queries.
    """
    # Remove a duplicate field name in the list if there are back to back field names in the list
    if not field_path:
        return []

    cleaned_field_path = [field_path[0]]
    for i in range(1, len(field_path)):
        if field_path[i] != field_path[i-1]:
            cleaned_field_path.append(field_path[i])
    return cleaned_field_path

def get_field_path_table(field_path: List[str], starting_table) -> Table:
    """
    Traverses a path of field names starting from a given table to find and return the table at the end of the path.
    """
    if isinstance(starting_table, str):
        starting_table = spmodels.datamodel.get_table(starting_table)
    
    current_table = starting_table
    for field_name in field_path:
        rel = current_table.get_relationship(field_name)
        current_table = spmodels.datamodel.get_table(rel.relatedModelName)
    return current_table

def build_field_path(field_path: List[str], table_path: List[Table] = []) -> List[Any]:
    """
    Recursively builds and extends a field path based on mappings, 
    to explore all possible field paths starting from the last field in the provided path.
    """
    if field_path[-1] in GENERIC_FIELDS_TO_TABLE_MAP.keys():
        return field_path
    elif is_table_already_in_path(field_path[-1], table_path):
        return field_path # TODO: check if this is the right thing to do here
    else:
        full_field_field_paths = []
        next_field_paths, next_table_name = FIELD_TO_EXPRS_MAP[field_path[-1]]
        for next_field_path in next_field_paths:
            new_field_path = clean_field_path(field_path + next_field_path)
            cur_table = get_field_path_table(new_field_path, table_path[0]) if next_table_name == 'Other' \
                else spmodels.datamodel.get_table(next_table_name)
            new_table_path = table_path + [cur_table]
            full_field_field_path = build_field_path(new_field_path, new_table_path)
            if len(full_field_field_path) == 1 and isinstance(full_field_field_path[0], list):
                full_field_field_path = full_field_field_path[0]
            elif isinstance(full_field_field_path[0], list):
                for path in full_field_field_path:
                    full_field_field_paths.append(clean_field_path(path))
                continue
            full_field_field_paths.append(full_field_field_path)
        return full_field_field_paths

def build_query_paths(table: Table) ->  Optional[List[Any]]:
    """
    Generates all possible query paths for a given table by looking up starting fields 
    and recursively building paths from them.
    """
    field_paths_lst = []
    if not hasattr(table, 'name') or table.name not in TABLE_TO_FIELDS_MAP.keys():
        return None
    starting_fields = TABLE_TO_FIELDS_MAP[table.name]
    if starting_fields is None:
        return None
    for start_field in starting_fields:
        field_paths, _ = FIELD_TO_EXPRS_MAP[start_field]
        for field_path in field_paths:
            full_field_field_path = build_field_path(field_path, [table])
            if len(full_field_field_path) == 1 and isinstance(full_field_field_path[0], list):
                full_field_field_path = full_field_field_path[0]
            elif isinstance(full_field_field_path[0], list):
                for path in full_field_field_path:
                    field_paths_lst.append(clean_field_path(path))
                continue
            field_paths_lst.append(clean_field_path(full_field_field_path))
    return field_paths_lst

def filter_out_bad_filter_queries(queryset, collection, q_lst) -> List[Tuple[str, str]]:
    """
    Filters out query expressions from a list that cause exceptions when applied to a queryset, 
    indicating they are invalid or unsupported.
    """
    good_q_lst = []
    for q in q_lst:
        try:
            queryset = queryset.filter(**{q[0]: q[1]})
        except Exception as e:
            continue
        good_q_lst.append(q)
    return good_q_lst

def build_query_exprs(table: Table) -> Optional[List[Tuple[str, str]]]:
    """
    Builds query expressions for filtering a queryset based on the relationships defined between tables, starting from a given table and its field paths.
    """
    field_paths_lst = build_query_paths(table)
    if field_paths_lst is None:
        return None
    end_table_lst = []
    for field_path in field_paths_lst:
        if field_path[-1] == 'base_attachment':
            end_table_lst.append(spmodels.datamodel.get_table('Attachment'))
            continue
        elif field_path[-1] == 'usergroupscopeid':
            end_table_lst.append(None)
            continue
        end_table = get_field_path_table(field_path, table)
        end_table_lst.append(end_table)

    q_lst = []
    for field_path, end_table in zip(field_paths_lst, end_table_lst):
        if end_table is None:
            if field_path[-1] == 'usergroupscopeid':
                q_expr_left = 'usergroupscopeid'
                q_expr_right = 'collection.usergroupscopeid'
                if table.name == 'Institution':
                    q_expr_right = 'collection.discipline.division.institution.usergroupscopeid'
                elif table.name == 'Division':
                    q_expr_right = 'collection.discipline.division.usergroupscopeid'
                elif table.name == 'Discipline':
                    q_expr_right = 'collection.discipline.usergroupscopeid'
                elif table.name == 'Collection':
                    q_expr_right = 'collection.usergroupscopeid'
                elif table.name == 'CollectionObject':
                    q_expr_right = 'collection.usergroupscopeid'
                
                q_lst.append((q_expr_left, q_expr_right))
            continue
        elif end_table.name == 'Attachment':
            q_attachment_exprs = FIELDS_TO_ATTACHMENT_EXPRS[field_path[-1]]
            for q_attachment_expr in q_attachment_exprs:
                for q_expr_left, q_expr_right in q_attachment_expr.items():
                    # Add fields before attachment if there are any
                    if len(field_path) > 1:
                        prefix = build_expr_path(field_path[:-1]) + '__'
                        q_expr_left = f'{prefix}__{q_expr_left}'
                    q_lst.append((q_expr_left, q_expr_right))
            continue

        q_expr_left = build_expr_path(field_path)
        q_expr_right = SCOPE_TABLE_FILTER_EXPR[end_table.name]
        q_lst.append((q_expr_left, q_expr_right))

    return q_lst

def apply_filters_to_queryset(queryset, q_lst) -> QuerySetAny:
    """
    Applies a list of filter expressions to the queryset.
    """
    q_object = Q()
    for q_expr_left, q_expr_right in q_lst:
        q_object |= Q(**{q_expr_left: q_expr_right})
    return queryset.filter(q_object)

def get_initial_query_list(model_name: str, pre_check_filter: bool, queryset, collection, lookup=False) -> List[tuple]:
    """
    Retrieves the initial list of query expressions based on the model name.
    If pre_check_filter is True, filters out bad queries.
    """
    if lookup:
        _, q_lst_init = TABLE_TO_COLLECTION_FILTER_QUERIES[model_name]
    else:
        q_lst_init = build_query_exprs(queryset, spmodels.datamodel.get_table(model_name))

    if pre_check_filter:
        return filter_out_bad_filter_queries(queryset, collection, q_lst_init)
    else:
        return q_lst_init

def filter_by_collection_base(queryset: QuerySetAny, collection, strict=True, pre_check_filter=True, lookup=False) -> QuerySetAny:
    """
    Base function to apply filter queries to a queryset based on a model's relationship to a collection.
    Can be configured for robust or lookup-based filtering.
    """
    table_name = queryset.model.specify_model.name
    q_lst_init = get_initial_query_list(table_name, pre_check_filter, queryset, collection, lookup)

    if q_lst_init is None:
        if strict:
            raise HierarchyException(f'Queryset model {table_name} does not have a defined hierarchy field.')
        else:
            return queryset

    return apply_filters_to_queryset(queryset, q_lst_init)

def filter_by_collection_robust(queryset: QuerySetAny, collection, strict=True, pre_check_filter=True) -> QuerySetAny:
    """
    Applies a robust set of filter queries to a queryset based on the table's relationship to a collection, 
    with strict error handling and optional pre-check of filters.
    """
    return filter_by_collection_base(queryset, collection, strict, pre_check_filter, lookup=False)

def filter_by_collection_lookup(queryset, collection, strict=True, pre_check_filter=True) -> QuerySetAny:
    """
    Similar to filter_by_collection_robust, but specifically tailored for lookup operations,
    potentially using a predefined set of filter queries.
    """
    return filter_by_collection_base(queryset, collection, strict, pre_check_filter, lookup=True)


def filter_by_collection(queryset: QuerySetAny, collection, strict=True, robust=False, lookup=False, pre_check_filter=True) -> QuerySetAny:
    """
    Main function to filter a queryset by collection, choosing between robust filtering, 
    lookup-based filtering, or an original method based on parameters.
    """
    if robust:
        if lookup:
            return filter_by_collection_lookup(queryset, collection, strict, pre_check_filter)
        else:
            return filter_by_collection_robust(queryset, collection, strict, pre_check_filter)
    else:
        return filter_by_collection_original(queryset, collection, strict)

def create_filter_col_data() -> str:
    """
    Generates a data structure mapping table names to their collection field paths and filter queries, 
    intended for use in optimizing or pre-configuring query building.
    """
    data = ''
    data += ("TABLE_TO_COLLECTION_FIELD_PATHS = {\n")
    for sp_table in spmodels.datamodel.tables:
        paths = build_query_paths(sp_table)
        if paths is None:
            data += (f"    '{sp_table.name}': None,\n")
            continue
        data += (f"    '{sp_table.name}': {{\n")
        data += (f"        'field_paths': [\n")
        for path in paths:
            data += (f"            {path},\n")
        data += ("        ],\n")
        data += ("        'filter_query': [\n")
        exprs = build_query_exprs(None, sp_table)
        for expr in exprs:
            data += (f"            {expr},\n")
        data += ("        ],\n")
        data += ("    },\n")
    data += ("}\n")
    return data