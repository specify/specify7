import { exportsForTests } from '../Usages';
import { requireContext } from '../../../tests/helpers';
import { schema } from '../../DataModel/schema';
import { overrideAjax } from '../../../tests/ajax';
import { getResourceApiUrl } from '../../DataModel/resource';

const { tableReplacements, findParentRelationships, postProcessBlockers } =
  exportsForTests;

requireContext();

test('Table Replacements are calculated properly', () =>
  expect(tableReplacements()).toMatchInlineSnapshot(`
    {
      "AccessionAgent": "Accession",
      "AccessionAttachment": "Accession",
      "AccessionAuthorization": "Accession",
      "AccessionCitation": "Accession",
      "AgentAttachment": "Agent",
      "AgentGeography": "Agent",
      "AgentSpecialty": "Agent",
      "AgentVariant": "Agent",
      "AttachmentMetadata": "Attachment",
      "AttachmentTag": "Attachment",
      "BorrowAgent": "Borrow",
      "BorrowAttachment": "Borrow",
      "BorrowMaterial": "Borrow",
      "BorrowReturnMaterial": "BorrowMaterial",
      "CollectingEventAttachment": "CollectingEvent",
      "CollectingEventAttr": "CollectingEvent",
      "CollectingEventAttribute": "CollectingEvent",
      "CollectingEventAuthorization": "CollectingEvent",
      "CollectingTripAttachment": "CollectingTrip",
      "CollectingTripAttribute": "CollectingTrip",
      "CollectingTripAuthorization": "CollectingTrip",
      "CollectionObjectAttachment": "CollectionObject",
      "CollectionObjectAttr": "CollectionObject",
      "CollectionObjectAttribute": "CollectionObject",
      "CollectionObjectCitation": "CollectionObject",
      "CollectionObjectProperty": "CollectionObject",
      "Collector": "CollectingEvent",
      "CommonNameTxCitation": "CommonNameTx",
      "ConservDescriptionAttachment": "ConservDescription",
      "ConservEventAttachment": "ConservEvent",
      "DNASequenceAttachment": "DNASequence",
      "DNASequencingRunAttachment": "DNASequencingRun",
      "DNASequencingRunCitation": "DNASequencingRun",
      "DeaccessionAgent": "Deaccession",
      "DeaccessionAttachment": "Deaccession",
      "DeterminationCitation": "Determination",
      "DisposalAgent": "Disposal",
      "DisposalAttachment": "Disposal",
      "DisposalPreparation": "Disposal",
      "ExchangeInPrep": "ExchangeIn",
      "ExchangeOutPrep": "ExchangeOut",
      "ExsiccataItem": "Exsiccata",
      "FieldNotebookAttachment": "FieldNotebook",
      "FieldNotebookPage": "FieldNotebookPageSet",
      "FieldNotebookPageAttachment": "FieldNotebookPage",
      "FieldNotebookPageSet": "FieldNotebookPage",
      "FieldNotebookPageSetAttachment": "FieldNotebookPageSet",
      "GeographyTreeDefItem": "GeographyTreeDef",
      "GeologicTimePeriodTreeDefItem": "GeologicTimePeriodTreeDef",
      "GiftAgent": "Gift",
      "GiftAttachment": "Gift",
      "GiftPreparation": "Gift",
      "LatLonPolygon": "Locality",
      "LatLonPolygonPnt": "LatLonPolygon",
      "LithoStratTreeDefItem": "LithoStratTreeDef",
      "LoanAgent": "Loan",
      "LoanAttachment": "Loan",
      "LoanPreparation": "Loan",
      "LoanReturnPreparation": "LoanPreparation",
      "LocalityAttachment": "Locality",
      "LocalityCitation": "Locality",
      "LocalityDetail": "Locality",
      "PcrPerson": "DNASequence",
      "PermitAttachment": "Permit",
      "PickListItem": "PickList",
      "PreparationAttachment": "Preparation",
      "PreparationAttr": "Preparation",
      "PreparationAttribute": "Preparation",
      "PreparationProperty": "Preparation",
      "RecordSetItem": "RecordSet",
      "ReferenceWorkAttachment": "ReferenceWork",
      "RepositoryAgreementAttachment": "RepositoryAgreement",
      "SpAppResourceData": "SpAppResource",
      "SpAppResourceDir": "SpAppResource",
      "SpAuditLogField": "SpAuditLog",
      "SpExportSchemaItem": "SpExportSchema",
      "SpExportSchemaItemMapping": "SpExportSchemaItem",
      "SpExportSchemaMapping": "SpExportSchema",
      "SpLocaleContainerItem": "SpLocaleContainer",
      "SpQueryField": "SpQuery",
      "StorageAttachment": "Storage",
      "StorageTreeDefItem": "StorageTreeDef",
      "TaxonAttachment": "Taxon",
      "TaxonAttribute": "Taxon",
      "TaxonCitation": "Taxon",
      "TaxonTreeDefItem": "TaxonTreeDef",
      "TreatmentEventAttachment": "TreatmentEvent",
      "WorkbenchRow": "Workbench",
      "WorkbenchRowImage": "WorkbenchRow",
      "WorkbenchTemplate": "Workbench",
    }
  `));

test('There is a single relationship for each replacement table', () => {
  const relationships = Object.fromEntries(
    Object.entries(tableReplacements()).map(([table, replacement]) => [
      table,
      findParentRelationships(
        schema.models[table],
        schema.models[replacement]
      ).map(({ name }) => name),
    ])
  );
  expect(Object.values(relationships).every(({ length }) => length === 1));
});

const loanAgentId = 1;
const loanId = 3;
overrideAjax(`/api/specify/loanagent/${loanAgentId}/`, {
  resource_uri: getResourceApiUrl('LoanAgent', loanAgentId),
  id: loanAgentId,
  loan: getResourceApiUrl('Loan', loanId),
});
test('postProcessBlockers', async () => {
  const resources = await postProcessBlockers([
    {
      field: 'Agent',
      model: schema.models.LoanAgent,
      id: loanAgentId,
    },
    {
      field: 'createdBy',
      model: schema.models.CollectionObject,
      id: 2,
    },
  ]);

  expect(resources).toEqual([
    { tableName: 'Loan', ids: [loanId] },
    {
      tableName: 'CollectionObject',
      ids: [2],
    },
  ]);
});
