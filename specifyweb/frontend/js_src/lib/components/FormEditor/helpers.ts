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
  'AuthorBusRules',
  'BioStratBusRules',
  'BorrowBusRules',
  'CatalogNumberingSchemeBusRules',
  'CatAutoNumberingSchemeBusRules',
  'CollectingEventBusRules',
  'CollectingTripAuthorizationBusRules',
  'CollectingTripBusRules',
  'CollectionBusRules',
  'CollectionObjectBusRules',
  'CollectorBusRules',
  'ConservDescriptionBusRules',
  'ConservEventBusRules',
  'ContainerBusRules',
  'DataTypeBusRules',
  'DeaccessionAgentBusRules',
  'DeterminationBusRules',
  'DeterminerBusRules',
  'DisciplineBusRules',
  'DivisionBusRules',
  'DNASequenceBusRules',
  'DNASequencingRunBusRules',
  'ExchangeOutBusRules',
  'ExchangeOutPrepBusRules',
  'ExtractorBusRules',
  'FieldNotebookBusRules',
  'FieldNotebookPageSetBusRules',
  'FundingAgentBusRules',
  'GeographyBusRules',
  'GeologicTimePeriodBusRules',
  'GiftBusRules',
  'GiftPreparationBusRules',
  'GroupPersonBusRules',
  'InfoRequestBusRules',
  'LithoStratBusRules',
  'LoanBusRules',
  'LoanGiftShipmentBusRules',
  'LoanPreparationBusRules',
  'LoanReturnPreparationBusRules',
  'LocalityBusRules',
  'PcrPersonBusRules',
  'PermitBusRules',
  'PickListBusRules',
  'PreparationBusRules',
  'PrepTypeBusRules',
  'SpecifyUserBusRules',
  'StorageBusRules',
  'TaxonBusRules',
  'TreatmentEventBusRules',
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
