import { RA } from '../../utils/types';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { Attachment } from '../DataModel/types';
import { AttachmentUploadSpec, EagerDataSet } from './Import';
import React from 'react';

export type UploadAttachmentSpec = {
  readonly token: string;
  readonly attachmentlocation: string;
};

export type AttachmentStatus =
  | 'incorrectFormatter'
  | 'noFile'
  | 'uploaded'
  | 'deleted'
  | { readonly type: 'skipped' | 'cancelled'; readonly reason: string };

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
  'disambiguated' | 'status' | 'uploadTokenSpec'
> &
  Omit<
    UploadableFileSpec,
    'attachmentId' | 'disambiguated' | 'status' | 'uploadTokenSpec' | 'file'
  > & { readonly file: Required<FileWithExtras> };

export type CanDelete = Omit<
  PartialUploadableFileSpec,
  'matchedId' | 'attachmentId'
> &
  Pick<UploadableFileSpec, 'matchedId' | 'attachmentId'>;

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
