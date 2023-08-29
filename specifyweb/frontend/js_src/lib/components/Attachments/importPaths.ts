import { IR } from '../../utils/types';
import { attachmentsText } from '../../localization/attachments';
import { Tables } from '../DataModel/types';

export const AttachmentMapping: {
  [P in keyof Tables & ('CollectionObject' | 'Taxon')]: {
    readonly relationship: keyof Tables[P]['toManyDependent'] &
      ('collectionObjectAttachments' | 'taxonAttachments');
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
} as const;

export const staticAttachmentImportPaths: IR<{
  readonly label: string;
  readonly baseTable: keyof typeof AttachmentMapping;
  readonly path: string;
  readonly restPath: string;
}> = {
  collectionObjectCatalogNumber: {
    label: attachmentsText.coCatalogNumber(),
    baseTable: 'CollectionObject',
    path: 'catalogNumber',
    restPath: 'collectionObjectAttachmentId',
  },
  taxonFullName: {
    label: attachmentsText.taxonFullName(),
    baseTable: 'Taxon',
    path: 'fullName',
    restPath: `taxonAttachmentId`,
  },
};
