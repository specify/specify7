import type React from 'react';

import type { RA } from '../../utils/types';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { Attachment } from '../DataModel/types';
import { staticAttachmentImportPaths } from './importPaths';
import { PartialAttachmentUploadSpec } from './Import';
import { keyLocalizationMapAttachment } from './utils';

export type UploadAttachmentSpec = {
  readonly token: string;
  readonly attachmentlocation: string;
};
type Matched = { readonly type: 'matched'; readonly id: number };

export type AttachmentStatus =
  | {
      readonly type: 'cancelled' | 'skipped';
      readonly reason: keyof typeof keyLocalizationMapAttachment;
    }
  | { readonly type: 'success'; readonly successType: 'deleted' | 'uploaded' }
  | Matched;

export type PartialUploadableFileSpec = Partial<UploadableFileSpec> &
  Pick<UploadableFileSpec, 'file'>;

type UploadableFileSpec = {
  readonly file: UnBoundFile;
  readonly matchedId: RA<number>;
  readonly status: AttachmentStatus;
  readonly disambiguated: number;
  readonly attachmentId: number;
  readonly uploadTokenSpec: UploadAttachmentSpec;
};

export type CanUpload = Pick<
  PartialUploadableFileSpec,
  'disambiguated' | 'uploadTokenSpec'
> & {
  readonly matchedId: RA<number>;
  readonly file: Required<FileWithExtras>;
};

export type CanDelete = Omit<
  PartialUploadableFileSpec,
  'attachmentId' | 'matchedId'
> &
  Pick<UploadableFileSpec, 'attachmentId' | 'matchedId'>;

export type UploadInternalWorkable<ACTION extends 'deleting' | 'uploading'> = {
  readonly status: Matched;
} & (ACTION extends 'uploading'
  ? CanUpload & {
      readonly attachmentFromPreviousTry?: SpecifyResource<Attachment>;
    }
  : CanDelete);

type FileWithExtras = File & {
  parsedName?: string;
};

// Forcing keys to be primitive because objects would be
// ignored during syncing to backend.
export type BoundFile = Pick<
  FileWithExtras,
  'name' | 'parsedName' | 'size' | 'type'
>;

export type UnBoundFile = BoundFile | FileWithExtras;

export type AttachmentWorkProgress = {
  readonly total: number;
  readonly uploaded: number;
  readonly type: 'interrupted' | 'safe' | 'stopped' | 'stopping';
  readonly retryingIn: number;
};

export type AttachmentWorkRef = {
  mappedFiles: RA<PartialUploadableFileSpec>;
  uploadPromise: Promise<number | undefined>;
  retrySpec: Record<number, number>;
};

export type AttachmentWorkStateProps = {
  readonly workProgress: AttachmentWorkProgress;
  readonly workRef: React.MutableRefObject<AttachmentWorkRef>;
  readonly onStop: () => void;
  readonly triggerNow: () => void;
} & {
  readonly onCompletedWork: (
    uploadables: RA<PartialUploadableFileSpec> | undefined
  ) => void;
};

type SavedDataSetFields = {
  readonly id: number;
  readonly timeStampCreated: string;
  readonly timeStampModified?: string;
};

export type AttachmentDataSetResource = {
  readonly name: string;
  readonly uploadableFiles: RA<PartialUploadableFileSpec>;
  readonly status?:
    | 'deleting'
    | 'deletingInterrupted'
    | 'renaming'
    | 'uploading'
    | 'uploadInterrupted'
    | 'validating';
  readonly uploadSpec: PartialAttachmentUploadSpec;
};

export type SavedAttachmentDataSetResource = AttachmentDataSetResource &
  SavedDataSetFields;

export type FetchedDataSet =
  | SavedAttachmentDataSetResource &
      (
        | { readonly status: undefined }
        | ({
            readonly status: 'deleting' | 'uploading';
            readonly uploadableFiles: RA<PartialUploadableFileSpec>;
          } & {
            readonly uploadSpec: {
              readonly staticPathKey: keyof typeof staticAttachmentImportPaths;
            };
          })
      );

export type AttachmentDataSetMeta = Pick<
  SavedAttachmentDataSetResource,
  'id' | 'name' | 'timeStampCreated' | 'timeStampModified'
>;
