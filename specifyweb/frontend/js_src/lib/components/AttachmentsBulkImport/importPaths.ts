import { IR } from '../../utils/types';
import { Tables } from '../DataModel/types';
import { getField } from '../DataModel/helpers';
import { schema } from '../DataModel/schema';

export const AttachmentMapping: {
  [P in keyof Tables &
    (
      | 'CollectionObject'
      | 'Taxon'
      | 'CollectingEvent'
      | 'Loan'
      | 'Accession'
      | 'Gift'
      | 'Borrow'
    )]: {
    readonly relationship: keyof Tables[P]['toManyDependent'] &
      (
        | 'collectionObjectAttachments'
        | 'taxonAttachments'
        | 'collectingEventAttachments'
        | 'loanAttachments'
        | 'accessionAttachments'
        | 'giftAttachments'
        | 'borrowAttachments'
      );
    readonly attachmentTable: keyof Tables;
  };
} = {
  CollectionObject: {
    relationship: 'collectionObjectAttachments',
    attachmentTable: 'CollectionObjectAttachment',
  },
  Taxon: {
    relationship: 'taxonAttachments',
    attachmentTable: 'TaxonAttachment',
  },
  CollectingEvent: {
    relationship: 'collectingEventAttachments',
    attachmentTable: 'CollectingEventAttachment',
  },
  Loan: {
    relationship: 'loanAttachments',
    attachmentTable: 'LoanAttachment',
  },
  Accession: {
    relationship: 'accessionAttachments',
    attachmentTable: 'AccessionAttachment',
  },
  Gift: {
    relationship: 'giftAttachments',
    attachmentTable: 'GiftAttachment',
  },
  Borrow: {
    relationship: 'borrowAttachments',
    attachmentTable: 'BorrowAttachment',
  },
} as const;

export const staticAttachmentImportPaths: IR<{
  readonly label: string;
  readonly baseTable: keyof typeof AttachmentMapping;
  readonly path: string;
  readonly restPath: string;
}> = {
  collectionObjectCatalogNumber: {
    label: getField(schema.models.CollectionObject, 'catalogNumber').label,
    baseTable: 'CollectionObject',
    path: 'catalogNumber',
    restPath: 'collectionObjectAttachmentId',
  },
  collectionObjectAltCatalogNumber: {
    label: getField(schema.models.CollectionObject, 'altCatalogNumber').label,
    baseTable: 'CollectionObject',
    path: 'altcatalogNumber',
    restPath: 'collectionObjectAttachmentId',
  },
  taxonFullName: {
    label: getField(schema.models.Taxon, 'fullName').label,
    baseTable: 'Taxon',
    path: 'fullName',
    restPath: `taxonAttachmentId`,
  },
  collectingEventGuid: {
    label: getField(schema.models.CollectingEvent, 'guid').label,
    baseTable: 'CollectingEvent',
    path: 'guid',
    restPath: `collectingEventAttachmentId`,
  },
  collectingEventFieldnumber: {
    label: getField(schema.models.CollectingEvent, 'stationFieldNumber').label,
    baseTable: 'CollectingEvent',
    path: 'stationfieldnumber',
    restPath: `collectingEventAttachmentId`,
  },
  loanNumber: {
    label: getField(schema.models.Loan, 'loanNumber').label,
    baseTable: 'Loan',
    path: 'loannumber',
    restPath: `loanattachmentid`,
  },
  accessionNumber: {
    label: getField(schema.models.Accession, 'accessionNumber').label,
    baseTable: 'Accession',
    path: 'accessionnumber',
    restPath: 'accessionattachmentid',
  },
  giftNumber: {
    label: getField(schema.models.Gift, 'giftNumber').label,
    baseTable: 'Gift',
    path: 'giftnumber',
    restPath: 'giftattachmentid',
  },
  borrowInvoiceNumber: {
    label: getField(schema.models.Borrow, 'invoiceNumber').label,
    baseTable: 'Borrow',
    path: 'invoicenumber',
    restPath: 'borrowattachmentid',
  },
};
