import type { RR } from '../../utils/types';
import type { Tables } from '../DataModel/types';

export const tablesWithBusRulesIn6 = new Set([
  'AccessionAgentBusRules',
  'AccessionAuthorizationBusRules',
  'AccessionBusRules',
  'AddressBusRules',
  'AgentBusRules',
  'AppraisalBusRules',
  'AttachmentBusRules',
  'AttachmentOwnerBaseBusRules',
  'AttachmentReferenceBaseBusRules',
  'AuthorBusRules',
  'BaseTreeBusRules',
  'BioStratBusRules',
  'BorrowBusRules',
  'CatalogNumberingSchemeBusRules',
  'CatAutoNumberingSchemeBusRules',
  'CollectingEventAttributeBusRules',
  'CollectingEventAuthorizationBusRules',
  'CollectingEventBusRules',
  'CollectingTripAuthorizationBusRules',
  'CollectingTripBusRules',
  'CollectionBusRules',
  'CollectionObjectBusRules',
  'CollectionSetupBusRules',
  'CollectorBusRules',
  'ConservDescriptionBusRules',
  'ConservEventBusRules',
  'ContainerBusRules',
  'DataTypeBusRules',
  'DeaccessionAgentBusRules',
  'DeaccessionBusRules',
  'DeterminationBusRules',
  'DeterminerBusRules',
  'DisciplineBusRules',
  'DisposalAgentBusRules',
  'DisposalBusRules',
  'DisposalPreparationBusRules',
  'DivisionBusRules',
  'DNASequenceBusRules',
  'DNASequencingRunBusRules',
  'ExchangeInBusRules',
  'ExchangeOutBusRules',
  'ExchangeOutPrepBusRules',
  'ExtractorBusRules',
  'FieldNotebookBusRules',
  'FieldNotebookPageBusRules',
  'FieldNotebookPageSetBusRules',
  'FundingAgentBusRules',
  'GeoCoordDetailBusRules',
  'GeographyBusRules',
  'GeologicTimePeriodBusRules',
  'GiftBusRules',
  'GiftPreparationBusRules',
  'GroupPersonBusRules',
  'InfoRequestBusRules',
  'InstitutionBusRules',
  'JournalBusRules',
  'LithoStratBusRules',
  'LoanBusRules',
  'LoanGiftShipmentBusRules',
  'LoanPreparationBusRules',
  'LoanReturnPreparationBusRules',
  'LocalityBusRules',
  'LocalityDetailBusRules',
  'PaleoContextBusRules',
  'PcrPersonBusRules',
  'PermitBusRules',
  'PickListBusRules',
  'PreparationBusRules',
  'PrepTypeBusRules',
  'ReferenceWorkBusRules',
  'RepositoryAgreementBusRules',
  'ShipmentBusRules',
  'SpecifyUserBusRules',
  'StorageBusRules',
  'TableSearchResults',
  'TaxonBusRules',
  'TreatmentEventBusRules',
  'TreeableSearchQueryBuilder',
  'TreeDefBusRules',
]);

/**
 * Most of the time business rules class name can be inferred from table name.
 * Exceptions:
 */
export const businessRulesOverride: Partial<RR<keyof Tables, string>> = {
  Shipment: 'LoanGiftShipment',
  CollectionObjectAttachment: 'Attachment',
};

export const getBusinessRuleClassFromTable = (
  tableName: keyof Tables
): string =>
  businessRulesOverride[tableName] === undefined
    ? tablesWithBusRulesIn6.has(`${tableName}BusRules`)
      ? `edu.ku.brc.specify.datamodel.busrules.${tableName}BusRules`
      : ''
    : `edu.ku.brc.specify.datamodel.busrules.${businessRulesOverride[
        tableName
      ]!}BusRules`;
