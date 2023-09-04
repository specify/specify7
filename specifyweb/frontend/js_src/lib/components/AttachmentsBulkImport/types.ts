import type React from 'react';

import type { RA } from '../../utils/types';
import type { AttachmentUploadSpec, EagerDataSet } from './Import';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { Attachment } from '../DataModel/types';
import { staticAttachmentImportPaths } from './importPaths';
import { PartialAttachmentUploadSpec } from './Import';

export type UploadAttachmentSpec = {
  readonly token: string;
  readonly attachmentlocation: string;
};

export type AttachmentStatus =
  | 'incorrectFormatter'
  | 'noFile'
  | 'uploaded'
  | 'deleted'
  | { readonly type: 'cancelled' | 'skipped'; readonly reason: string };

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
  Pick<
    PartialUploadableFileSpec,
    'disambiguated' | 'status' | 'uploadTokenSpec'
  > & { readonly file: Required<FileWithExtras> };

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
    } & CanDelete;

// Weakens types if we can't perform upload or delete. Strictens them if we can.
export type TestInternalUploadSpec<ACTION extends 'uploading' | 'deleting'> =
  ACTION extends 'uploading'
    ?
        | UploadInternalWorkable<'uploading'>
        | ({ readonly canUpload: false } & PartialUploadableFileSpec)
    :
        | UploadInternalWorkable<'deleting'>
        | ({ readonly canDelete: false } & PartialUploadableFileSpec);

// Weak type. Used because after uploading/deleting, return spec becomes fuzzy in types.
export type PostWorkUploadSpec<ACTION extends 'uploading' | 'deleting'> =
  PartialUploadableFileSpec &
    (ACTION extends 'uploading'
      ? {
          readonly canUpload: boolean;
        }
      : { readonly canDelete: boolean });

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

export type AttachmentWorkRef<ACTION extends 'uploading' | 'deleting'> = {
  mappedFiles: RA<TestInternalUploadSpec<ACTION> | PostWorkUploadSpec<ACTION>>;
  uploadPromise: Promise<number | undefined>;
  retrySpec: Record<number, number>;
};

export type AttachmentWorkStateProps<ACTION extends 'uploading' | 'deleting'> =
  {
    readonly workProgress: AttachmentWorkProgress;
    readonly workRef: React.MutableRefObject<AttachmentWorkRef<ACTION>>;
    readonly onStop: () => void;
    readonly triggerNow: () => void;
  } & {
    readonly onCompletedWork: (
      uploadables:
        | RA<TestInternalUploadSpec<ACTION> | PostWorkUploadSpec<ACTION>>
        | undefined
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
      readonly uploadSpec: {
        readonly staticPathKey: keyof typeof staticAttachmentImportPaths;
      };
    } & (
        | {
            readonly status: 'deleting';
            readonly uploadableFiles: RA<PostWorkUploadSpec<'deleting'>>;
          }
        | {
            readonly status: 'uploading';
            readonly uploadableFiles: RA<PostWorkUploadSpec<'uploading'>>;
          }
      ))
  | (AttachmentDataSetResource<true> & { readonly status: undefined });

export type AttachmentDataSetMeta = Pick<
  AttachmentDataSetResource<true>,
  'id' | 'name' | 'timeStampCreated' | 'timeStampModified'
>;
