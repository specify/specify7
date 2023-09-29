import { IR } from '../../utils/types';
import { Tables } from '../DataModel/types';

export const staticAttachmentImportPaths: IR<{
  readonly baseTable: keyof Tables;
  readonly path: string;
}> = {
  collectionObjectCatalogNumber: {
    baseTable: 'CollectionObject',
    path: 'catalogNumber',
  },
  collectionObjectAltCatalogNumber: {
    baseTable: 'CollectionObject',
    path: 'altcatalogNumber',
  },
  taxonFullName: {
    baseTable: 'Taxon',
    path: 'fullName',
  },
  collectingEventGuid: {
    baseTable: 'CollectingEvent',
    path: 'guid',
  },
  collectingEventFieldnumber: {
    baseTable: 'CollectingEvent',
    path: 'stationfieldnumber',
  },
  loanNumber: {
    baseTable: 'Loan',
    path: 'loannumber',
  },
  accessionNumber: {
    baseTable: 'Accession',
    path: 'accessionnumber',
  },
  giftNumber: {
    baseTable: 'Gift',
    path: 'giftnumber',
  },
  borrowInvoiceNumber: {
    baseTable: 'Borrow',
    path: 'invoicenumber',
  },
};
