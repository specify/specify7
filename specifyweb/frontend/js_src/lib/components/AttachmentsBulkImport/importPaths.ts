import type { IR } from '../../utils/types';
import type { Tables } from '../DataModel/types';

const createItem = <TABLE_NAME extends keyof Tables>(
  baseTable: TABLE_NAME,
  path: keyof Tables[TABLE_NAME]['fields']
) => ({
  baseTable,
  path,
});

export const staticAttachmentImportPaths: IR<ReturnType<typeof createItem>> = {
  collectionObjectCatalogNumber: createItem(
    'CollectionObject',
    'catalogNumber'
  ),
  collectionObjectAltCatalogNumber: createItem(
    'CollectionObject',
    'altCatalogNumber'
  ),
  taxonFullName: createItem('Taxon', 'fullName'),
  storageFullName: createItem('Storage', 'fullName'),
  collectingEventGuid: createItem('CollectingEvent', 'guid'),
  collectingEventFieldnumber: createItem(
    'CollectingEvent',
    'stationFieldNumber'
  ),
  loanNumber: createItem('Loan', 'loanNumber'),
  accessionNumber: createItem('Accession', 'accessionNumber'),
  giftNumber: createItem('Gift', 'giftNumber'),
  preparationBarcode: createItem('Preparation', 'barCode'),
  preparationGUID: createItem('Preparation', 'guid'),
  borrowInvoiceNumber: createItem('Borrow', 'invoiceNumber'),
  treatmentEventFieldNumber: createItem('TreatmentEvent', 'fieldNumber'),
  exchangeInAttachment: createItem('ExchangeIn', 'exchangeInNumber'),
  exchangeOutAttachment: createItem('ExchangeOut', 'exchangeOutNumber'),
  referenceWorkGUID: createItem('ReferenceWork', 'guid'),
  referenceWorkTitle: createItem('ReferenceWork', 'title'),
  localityUniqueIdentifier: createItem('Locality', 'uniqueIdentifier'),
  localityGUID: createItem('Locality', 'guid'),
  permitNumber: createItem('Permit', 'permitNumber'),
  agentGUID: createItem('Agent', 'guid'),
  collectingTripName: createItem('CollectingTrip', 'collectingTripName'),
  deaccessionNumber: createItem('Deaccession', 'deaccessionNumber'),
};
