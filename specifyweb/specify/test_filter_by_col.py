from django.test import TestCase

from specifyweb.specify.filter_by_col import build_query_exprs, build_query_paths
from . import models as spmodels

TABLE_TO_COLLECTION_FIELD_PATHS = {
    'Accession': [['division']],
    'AccessionAgent': [['accession', 'division']],
    'AccessionAttachment': [
        ['accession', 'division'],
        ['attachment']],
    'AccessionAuthorization': [['accession', 'division']],
    'AccessionCitation': [
        ['accession', 'division'],
        ['referencework', 'institution']],
    'Address': [['divisions']],
    'AddressOfRecord': [
        ['accessions', 'division'],
        ['agent', 'division']],
    'Agent': [['division']],
    'AgentAttachment': [
        ['agent', 'division'],
        ['attachment']],
    'AgentGeography': [
        ['agent', 'division'],
        ['geography', 'definition', 'disciplines']],
    'AgentIdentifier': [['agent', 'division']],
    'AgentSpecialty': [['agent', 'division']],
    'AgentVariant': [['agent', 'division']],
    'Appraisal': [
        ['collectionobjects', 'collection'],
        ['accession', 'division'],
        ['agent', 'division']],
    'Attachment': [['base_attachment']],
    'AttachmentImageAttribute': [['attachments']],
    'AttachmentMetadata': [['attachment']],
    'AttachmentTag': [['attachment']],
    'AttributeDef': [['discipline']],
    'Author': [['agent', 'division']],
    'AutoNumberingScheme': [
        ['collections'],
        ['divisions'],
        ['disciplines']],
    'Borrow': [['borrowagents', 'agent', 'division']],
    'BorrowAgent': [['agent', 'division']],
    'BorrowAttachment': [
        ['borrow', 'borrowagents', 'agent', 'division'],
        ['attachment']],
    'BorrowMaterial': [['borrow', 'borrowagents', 'agent', 'division']],
    'BorrowReturnMaterial': [
        ['borrowmaterial', 'borrow', 'borrowagents', 'agent', 'division'],
        ['agent', 'division']],
    'CollectingEvent': [['discipline']],
    'CollectingEventAttachment': [
        ['collectingevent', 'discipline'],
        ['attachment']],
    'CollectingEventAttr': [
        ['collectingevent', 'discipline'],
        ['definition', 'discipline']],
    'CollectingEventAttribute': [['discipline']],
    'CollectingEventAuthorization': [
        ['collectingevent', 'discipline'],
        ['permit', 'institution']],
    'CollectingTrip': [['discipline']],
    'CollectingTripAttachment': [
        ['collectingtrip', 'discipline'],
        ['attachment']],
    'CollectingTripAttribute': [['discipline']],
    'CollectingTripAuthorization': [
        ['collectingtrip', 'discipline'],
        ['permit', 'institution']],
    'Collection': [['discipline']],
    'CollectionObject': [['collection']],
    'CollectionObjectAttachment': [['collectionobject', 'collection']],
    'CollectionObjectAttr': [['collectionobject', 'collection']],
    'CollectionObjectAttribute': [
        ['collectionobjects', 'collection'],
        ['agent1', 'division']],
    'CollectionObjectCitation': [['collectionobject', 'collection']],
    'CollectionObjectProperty': [['collectionobject', 'collection']],
    'CollectionRelType': [
        ['leftsidecollection', 'discipline'],
        ['rightsidecollection', 'discipline']],
    'CollectionRelationship': [
        ['leftside', 'collection'],
        ['rightside', 'collection']],
    'Collector': [['division']],
    'CommonNameTx': [
        ['taxon', 'definition', 'discipline'],
        ['citations', 'referencework', 'institution']],
    'CommonNameTxCitation': [
        ['commonnametx', 'taxon', 'definition', 'discipline'],
        ['commonnametx', 'citations', 'referencework', 'institution'],
        ['referencework', 'institution']],
    'ConservDescription': [['collectionobject', 'collection']],
    'ConservDescriptionAttachment': [
        ['attachment'],
        ['conservdescription', 'collectionobject', 'collection']],
    'ConservEvent': [['conservdescription', 'collectionobject', 'collection']],
    'ConservEventAttachment': [
        ['attachment'],
        ['conservevent', 'conservdescription', 'collectionobject']],
    'Container': [['storage', 'definition', 'institutions']],
    'DNAPrimer': [['dnasequencingruns', 'dnasequence', 'collectionobject', 'collection']],
    'DNASequence': [['collectionobject', 'collection']],
    'DNASequenceAttachment': [
        ['dnasequence', 'collectionobject', 'collection'],
        ['attachment']],
    'DNASequencingRun': [['dnasequence', 'collectionobject', 'collection']],
    'DNASequencingRunAttachment': [
        ['dnasequencingrun', 'dnasequence', 'collectionobject', 'collection'],
        ['attachment']],
    'DNASequencingRunCitation': [
        ['sequencingrun', 'dnasequence', 'collectionobject', 'collection'],
        ['referencework', 'institution']],
    'DataType': None,
    'Deaccession': [
        ['agent1', 'division'],
        ['agent2', 'division'],
        ['exchangeouts', 'division']],
    'DeaccessionAgent': [
        ['agent', 'division'],
        ['deaccession', 'agent1', 'division'],
        ['deaccession', 'agent2', 'division'],
        ['deaccession', 'exchangeouts', 'division']],
    'DeaccessionAttachment': [
        ['attachment'],
        ['deaccession', 'agent1', 'division'],
        ['deaccession', 'agent2', 'division'],
        ['deaccession', 'exchangeouts', 'division']],
    'Determination': [['collectionobject', 'collection']],
    'DeterminationCitation': [
        ['determination', 'collectionobject', 'collection'],
        ['referencework', 'institution']],
    'Determiner': [
        ['determination', 'collectionobject', 'collection'],
        ['agent', 'division']],
    'Discipline': [['usergroupscopeid']],
    'Disposal': [
        ['deaccession', 'agent1', 'division'],
        ['deaccession', 'agent2', 'division'],
        ['deaccession', 'exchangeouts', 'division']],
    'DisposalAgent': [
        ['disposal', 'deaccession', 'agent1', 'division'],
        ['disposal', 'deaccession', 'agent2', 'division'],
        ['disposal', 'deaccession', 'exchangeouts', 'division'],
        ['agent', 'division']],
    'DisposalAttachment': [
        ['disposal', 'deaccession', 'agent1', 'division'],
        ['disposal', 'deaccession', 'agent2', 'division'],
        ['disposal', 'deaccession', 'exchangeouts', 'division'],
        ['attachment']],
    'DisposalPreparation': [
        ['disposal', 'deaccession', 'agent1', 'division'],
        ['disposal', 'deaccession', 'agent2', 'division'],
        ['disposal', 'deaccession', 'exchangeouts', 'division'],
        ['preparation', 'collectionobject', 'collection']],
    'Division': [['usergroupscopeid']],
    'ExchangeIn': [['division']],
    'ExchangeInAttachment': [
        ['exchangein', 'division'],
        ['attachment']],
    'ExchangeInPrep': [['discipline']],
    'ExchangeOut': [['division']],
    'ExchangeOutAttachment': [
        ['exchangeout', 'division'],
        ['attachment']],
    'ExchangeOutPrep': [['discipline']],
    'Exsiccata': [['referencework', 'institution']],
    'ExsiccataItem': [['collectionobject', 'collection']],
    'Extractor': [
        ['dnasequence', 'collectionobject', 'collection'],
        ['agent', 'division']],
    'FieldNotebook': [['collection']],
    'FieldNotebookAttachment': [
        ['fieldnotebook', 'collection'],
        ['attachment']],
    'FieldNotebookPage': [['discipline']],
    'FieldNotebookPageAttachment': [
        ['fieldnotebookpage', 'discipline'],
        ['attachment']],
    'FieldNotebookPageSet': [['discipline']],
    'FieldNotebookPageSetAttachment': [
        ['fieldnotebookpageset', 'discipline'],
        ['attachment']],
    'FundingAgent': [['division']],
    'GeoCoordDetail': [['locality', 'discipline']],
    'Geography': [['definition', 'disciplines']],
    'GeographyTreeDef': [['disciplines']],
    'GeographyTreeDefItem': [['treedef', 'disciplines']],
    'GeologicTimePeriod': [['definition', 'disciplines']],
    'GeologicTimePeriodTreeDef': [['disciplines']],
    'GeologicTimePeriodTreeDefItem': [['treedef', 'disciplines']],
    'Gift': [['discipline']],
    'GiftAgent': [['gift', 'discipline']],
    'GiftAttachment': [
        ['gift', 'discipline'],
        ['attachment']],
    'GiftPreparation': [['gift', 'discipline']],
    'GroupPerson': [['division']],
    'InfoRequest': [['agent', 'division']],
    'Institution': [['usergroupscopeid']],
    'InstitutionNetwork': [['collections']],
    'Journal': [['institution']],
    'LatLonPolygon': [['locality', 'discipline']],
    'LatLonPolygonPnt': [['latlonpolygon', 'locality', 'discipline']],
    'LithoStrat': [['definition', 'disciplines']],
    'LithoStratTreeDef': [['disciplines']],
    'LithoStratTreeDefItem': [['treedef', 'disciplines']],
    'Loan': [['discipline']],
    'LoanAgent': [['discipline']],
    'LoanAttachment': [
        ['loan', 'discipline'],
        ['attachment']],
    'LoanPreparation': [['discipline']],
    'LoanReturnPreparation': [['discipline']],
    'Locality': [['discipline']],
    'LocalityAttachment': [
        ['locality', 'discipline'],
        ['attachment']],
    'LocalityCitation': [['locality', 'discipline']],
    'LocalityDetail': [['locality', 'discipline']],
    'LocalityNameAlias': [['locality', 'discipline']],
    'MaterialSample': [['preparation', 'collectionobject', 'collection']],
    'MorphBankView': None,
    'OtherIdentifier': [['collectionobject', 'collection']],
    'PaleoContext': [['discipline']],
    'PcrPerson': [
        ['dnasequence', 'collectionobject', 'collection'],
        ['agent', 'division']],
    'Permit': [['institution']],
    'PermitAttachment': [
        ['permit', 'institution'],
        ['attachment']],
    'PickList': [['collection']],
    'PickListItem': [['picklist', 'collection']],
    'PrepType': [['collection']],
    'Preparation': [['collectionobject', 'collection']],
    'PreparationAttachment': [
        ['preparation', 'collectionobject', 'collection'],
        ['attachment']],
    'PreparationAttr': [
        ['preparation', 'collectionobject', 'collection'],
        ['definition', 'discipline']],
    'PreparationAttribute': [['preparations', 'collectionobject', 'collection']],
    'PreparationProperty': [['preparation', 'collectionobject', 'collection']],
    'Project': [
        ['agent', 'division'],
        ['collectionobjects', 'collection']],
    'RecordSet': [['specifyuser', 'agents', 'division']],
    'RecordSetItem': [['recordset', 'specifyuser', 'agents', 'division']],
    'ReferenceWork': [['institution']],
    'ReferenceWorkAttachment': [
        ['referencework', 'institution'],
        ['attachment']],
    'RepositoryAgreement': [['division']],
    'RepositoryAgreementAttachment': [
        ['repositoryagreement', 'division'],
        ['attachment']],
    'Shipment': [['discipline']],
    'SpAppResource': [['specifyuser', 'agents', 'division']],
    'SpAppResourceData': [['spappresource', 'specifyuser', 'agents', 'division']],
    'SpAppResourceDir': [['collection']],
    'SpAuditLog': None,
    'SpAuditLogField': None,
    'SpExportSchema': [['discipline']],
    'SpExportSchemaItem': [['spexportschema', 'discipline']],
    'SpExportSchemaItemMapping': [['exportschemaitem', 'spexportschema', 'discipline']],
    'SpExportSchemaMapping': [['spexportschemas', 'discipline']],
    'SpFieldValueDefault': None,
    'SpLocaleContainer': [['discipline']],
    'SpLocaleContainerItem': [['container', 'discipline']],
    'SpLocaleItemStr': [['containername', 'discipline']],
    'SpPermission': None,
    'SpPrincipal': None,
    'SpQuery': [['specifyuser', 'agents', 'division']],
    'SpQueryField': [],
    'SpReport': [
        ['specifyuser', 'agents', 'division'],
        ['appresource', 'specifyuser', 'agents', 'division']],
    'SpSymbiotaInstance': [['schemamapping', 'spexportschemas', 'discipline']],
    'SpTaskSemaphore': [['collection']],
    'SpVersion': None,
    'SpViewSetObj': [['spappresourcedir', 'collection']],
    'SpVisualQuery': [['specifyuser', 'agents', 'division']],
    'SpecifyUser': [['agents', 'division']],
    'Storage': [['definition', 'institutions']],
    'StorageAttachment': [
        ['storage', 'definition', 'institutions'],
        ['attachment']],
    'StorageTreeDef': [['institutions']],
    'StorageTreeDefItem': [['treedef', 'institutions']],
    'Taxon': [['definition', 'discipline']],
    'TaxonAttachment': [
        ['taxon', 'definition', 'discipline'],
        ['attachment']],
    'TaxonAttribute': [
        ['agent1', 'division'],
        ['taxons', 'definition', 'discipline']],
    'TaxonCitation': [
        ['taxon', 'definition', 'discipline'],
        ['referencework', 'institution']],
    'TaxonTreeDef': [['discipline']],
    'TaxonTreeDefItem': [['treedef', 'discipline']],
    'TreatmentEvent': [['collectionobject', 'collection']],
    'TreatmentEventAttachment': [
        ['treatmentevent', 'collectionobject', 'collection'],
        ['attachment']],
    'VoucherRelationship': [['collectionobject', 'collection']],
    'Workbench': [['specifyuser', 'agents', 'division']],
    'WorkbenchDataItem': [['workbenchrow', 'workbench', 'specifyuser', 'agents', 'division']],
    'WorkbenchRow': [['workbench', 'specifyuser', 'agents', 'division']],
    'WorkbenchRowExportedRelationship': [['workbenchrow', 'workbench', 'specifyuser', 'agents', 'division']],
    'WorkbenchRowImage': [['workbenchrow', 'workbench', 'specifyuser', 'agents', 'division']],
    'WorkbenchTemplate': [['specifyuser', 'agents', 'division']],
    'WorkbenchTemplateMappingItem': [['workbenchtemplate', 'specifyuser', 'agents', 'division']],
}

class TestFilterByCol(TestCase):
    def test_filter_query_path(self) -> None:
        for sp_table in spmodels.datamodel.tables:
            paths = build_query_paths(sp_table)
            if paths is None:
                self.assertEqual(TABLE_TO_COLLECTION_FIELD_PATHS[sp_table.name], None)
                continue
            target_paths = TABLE_TO_COLLECTION_FIELD_PATHS[sp_table.name]
            for path, target_path in zip(paths, target_paths):
                self.assertEqual(path, target_path)
            build_query_exprs(sp_table)
