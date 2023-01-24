import { exportsForTests, parentTableRelationship } from '../Usages';
import { requireContext } from '../../../tests/helpers';
import { schema } from '../../DataModel/schema';
import { overrideAjax } from '../../../tests/ajax';
import { getResourceApiUrl } from '../../DataModel/resource';

const { postProcessBlockers } = exportsForTests;

requireContext();

test('Parent table relationships are calculated properly', () =>
  expect(parentTableRelationship()).toMatchInlineSnapshot(`
    {
      "AccessionAgent": "[relationship accession]",
      "AccessionAttachment": "[relationship accession]",
      "AccessionAuthorization": "[relationship accession]",
      "AccessionCitation": "[relationship accession]",
      "AgentAttachment": "[relationship agent]",
      "AgentGeography": "[relationship agent]",
      "AgentIdentifier": "[relationship agent]",
      "AgentSpecialty": "[relationship agent]",
      "AgentVariant": "[relationship agent]",
      "AttachmentMetadata": "[relationship attachment]",
      "AttachmentTag": "[relationship attachment]",
      "BorrowAgent": "[relationship borrow]",
      "BorrowAttachment": "[relationship borrow]",
      "BorrowMaterial": "[relationship borrow]",
      "BorrowReturnMaterial": "borrowMaterial",
      "CollectingEventAttachment": "[relationship collectingEvent]",
      "CollectingEventAttr": "[relationship collectingEvent]",
      "CollectingEventAuthorization": "[relationship collectingEvent]",
      "CollectingTripAttachment": "[relationship collectingTrip]",
      "CollectingTripAuthorization": "[relationship collectingTrip]",
      "CollectionObjectAttachment": "[relationship collectionObject]",
      "CollectionObjectAttr": "[relationship collectionObject]",
      "CollectionObjectCitation": "[relationship collectionObject]",
      "CollectionObjectProperty": "[relationship collectionObject]",
      "Collector": "collectingEvent",
      "CommonNameTxCitation": "[relationship commonNameTx]",
      "ConservDescriptionAttachment": "[relationship conservDescription]",
      "ConservEventAttachment": "[relationship conservEvent]",
      "DNASequenceAttachment": "[relationship dnaSequence]",
      "DNASequencingRunAttachment": "[relationship dnaSequencingRun]",
      "DNASequencingRunCitation": "[relationship sequencingRun]",
      "DeaccessionAgent": "[relationship deaccession]",
      "DeaccessionAttachment": "[relationship deaccession]",
      "DeterminationCitation": "[relationship determination]",
      "Determiner": "determination",
      "DisposalAgent": "[relationship disposal]",
      "DisposalAttachment": "[relationship disposal]",
      "DisposalPreparation": "[relationship disposal]",
      "ExchangeInAttachment": "[relationship exchangeIn]",
      "ExchangeInPrep": "[relationship exchangeIn]",
      "ExchangeOutAttachment": "[relationship exchangeOut]",
      "ExchangeOutPrep": "[relationship exchangeOut]",
      "ExsiccataItem": "[relationship exsiccata]",
      "FieldNotebookAttachment": "[relationship fieldNotebook]",
      "FieldNotebookPage": "pageSet",
      "FieldNotebookPageAttachment": "[relationship fieldNotebookPage]",
      "FieldNotebookPageSet": "fieldNotebook",
      "FieldNotebookPageSetAttachment": "[relationship fieldNotebookPageSet]",
      "GeographyTreeDefItem": "[relationship treeDef]",
      "GeologicTimePeriodTreeDefItem": "[relationship treeDef]",
      "GiftAgent": "[relationship gift]",
      "GiftAttachment": "[relationship gift]",
      "GiftPreparation": "[relationship gift]",
      "LatLonPolygon": "locality",
      "LatLonPolygonPnt": "[relationship latLonPolygon]",
      "LithoStratTreeDefItem": "[relationship treeDef]",
      "LoanAgent": "[relationship loan]",
      "LoanAttachment": "[relationship loan]",
      "LoanPreparation": "[relationship loan]",
      "LoanReturnPreparation": "loanPreparation",
      "LocalityAttachment": "[relationship locality]",
      "LocalityCitation": "[relationship locality]",
      "LocalityDetail": "[relationship locality]",
      "PcrPerson": "dnaSequence",
      "PermitAttachment": "[relationship permit]",
      "PickListItem": "[relationship pickList]",
      "PreparationAttachment": "[relationship preparation]",
      "PreparationAttr": "[relationship preparation]",
      "PreparationProperty": "[relationship preparation]",
      "RecordSetItem": "[relationship recordSet]",
      "ReferenceWorkAttachment": "[relationship referenceWork]",
      "RepositoryAgreementAttachment": "[relationship repositoryAgreement]",
      "SpAppResourceData": "[relationship spAppResource]",
      "SpAuditLogField": "[relationship spAuditLog]",
      "SpExportSchemaItem": "[relationship spExportSchema]",
      "SpExportSchemaItemMapping": "[relationship exportSchemaItem]",
      "SpLocaleContainerItem": "[relationship container]",
      "SpQueryField": "[relationship query]",
      "StorageAttachment": "[relationship storage]",
      "StorageTreeDefItem": "[relationship treeDef]",
      "TaxonAttachment": "[relationship taxon]",
      "TaxonCitation": "[relationship taxon]",
      "TaxonTreeDefItem": "[relationship treeDef]",
      "TreatmentEventAttachment": "[relationship treatmentEvent]",
      "WorkbenchRow": "[relationship workbench]",
      "WorkbenchRowImage": "[relationship workbenchRow]",
    }
  `));

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
