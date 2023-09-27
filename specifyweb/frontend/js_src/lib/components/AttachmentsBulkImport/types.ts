import type React from 'react';

import type { RA } from '../../utils/types';
import type { AttachmentUploadSpec, EagerDataSet } from './Import';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { Attachment } from '../DataModel/types';
import { staticAttachmentImportPaths } from './importPaths';
import { PartialAttachmentUploadSpec } from './Import';
import { keyLocalizationMapAttachment } from './utils';

export type UploadAttachmentSpec = {
  readonly token: string;
  readonly attachmentlocation: string;
};

export type AttachmentStatus =
  | {
      readonly type: 'cancelled' | 'skipped';
      readonly reason: keyof typeof keyLocalizationMapAttachment;
    }
  | { readonly type: 'success'; readonly successType: 'deleted' | 'uploaded' }
  | { readonly type: 'matched'; readonly id: number };

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

export type CanUpload = Omit<
  UploadableFileSpec,
  'attachmentId' | 'disambiguated' | 'file' | 'status' | 'uploadTokenSpec'
> &
  Pick<PartialUploadableFileSpec, 'disambiguated' | 'uploadTokenSpec'> & {
    readonly file: Required<FileWithExtras>;
    readonly status: { readonly type: 'matched'; readonly id: number };
  };

export type CanDelete = Omit<
  PartialUploadableFileSpec,
  'attachmentId' | 'matchedId'
> &
  Pick<UploadableFileSpec, 'attachmentId' | 'matchedId'>;

export type UploadInternalWorkable<ACTION extends 'uploading' | 'deleting'> = {
  readonly status: undefined;
} & ACTION extends 'uploading'
  ? {
      readonly canUpload: true;
      readonly attachmentFromPreviousTry?: SpecifyResource<Attachment>;
    } & CanUpload
  : {
      readonly canDelete: true;
      readonly status: { readonly type: 'matched'; readonly id: number };
    } & CanDelete;

type FileWithExtras = File & {
  parsedName?: string;
};

// Forcing keys to be primitive because objects would be
// ignored during syncing to backend.
export type BoundFile = Pick<
  {
    [P in keyof FileWithExtras as FileWithExtras[P] extends object
      ? never
      : P]: FileWithExtras[P];
  },
  'size' | 'name' | 'parsedName' | 'type'
>;

export type UnBoundFile = FileWithExtras | BoundFile;

export type CanValidate = Omit<EagerDataSet, 'uploadSpec'> & {
  readonly uploadSpec: AttachmentUploadSpec;
};

export type AttachmentWorkProgress = {
  readonly total: number;
  readonly uploaded: number;
  readonly type: 'safe' | 'stopping' | 'stopped' | 'interrupted';
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

type SavedDataSetResources = {
  readonly id: number;
  readonly timeStampCreated: string;
  readonly timeStampModified?: string;
};
export type AttachmentDataSetResource<SAVED extends boolean> =
  (SAVED extends true ? SavedDataSetResources : {}) & {
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

export type FetchedDataSet =
  | (AttachmentDataSetResource<true> & {
      readonly status: 'deleting' | 'uploading';
      readonly uploadableFiles: RA<PartialUploadableFileSpec>;
    } & {
      readonly uploadSpec: {
        readonly staticPathKey: keyof typeof staticAttachmentImportPaths;
      };
    })
  | (AttachmentDataSetResource<true> & { readonly status: undefined });

export type AttachmentDataSetMeta = Pick<
  AttachmentDataSetResource<true>,
  'id' | 'name' | 'timeStampCreated' | 'timeStampModified'
>;
