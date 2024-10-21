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
  collectingEventGuid: createItem('CollectingEvent', 'guid'),
  collectingEventFieldnumber: createItem(
    'CollectingEvent',
    'stationFieldNumber'
  ),
  loanNumber: createItem('Loan', 'loanNumber'),
  accessionNumber: createItem('Accession', 'accessionNumber'),
  giftNumber: createItem('Gift', 'giftNumber'),
  preparationBarcode: createItem('Preparation', 'barCode'),
  borrowInvoiceNumber: createItem('Borrow', 'invoiceNumber'),
};
