import type React from 'react';

import type { RA } from '../../utils/types';
import type { PartialAttachmentUploadSpec } from './Import';
import type { staticAttachmentImportPaths } from './importPaths';
import type { keyLocalizationMapAttachment } from './utils';

export type UploadAttachmentSpec = {
  readonly token: string;
  readonly attachmentLocation: string;
};
type Matched = { readonly type: 'matched'; readonly id: number };

export type AttachmentStatus =
  | Matched
  | {
      readonly type: 'cancelled' | 'skipped';
      readonly reason: keyof typeof keyLocalizationMapAttachment;
    }
  | { readonly type: 'success'; readonly successType: 'deleted' | 'uploaded' };

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

type FileWithExtras = File & {
  // eslint-disable-next-line functional/prefer-readonly-type
  parsedName?: string;
};

/*
 * Forcing keys to be primitive because objects would be
 * ignored during syncing to backend.
 */
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
  // eslint-disable-next-line functional/prefer-readonly-type
  mappedFiles: RA<PartialUploadableFileSpec>;
  // eslint-disable-next-line functional/prefer-readonly-type
  uploadPromise: Promise<number | undefined>;
  readonly retrySpec: Record<number, number>;
};

export type AttachmentWorkStateProps = {
  readonly onCompletedWork: (
    uploadables: RA<PartialUploadableFileSpec> | undefined
  ) => void;
} & {
  readonly workProgress: AttachmentWorkProgress;
  readonly workRef: React.MutableRefObject<AttachmentWorkRef>;
  readonly onStop: () => void;
  readonly triggerNow: () => void;
};

type SavedDataSetFields = {
  readonly id: number;
  readonly timestampcreated: string;
  readonly timestampmodified?: string;
};

export type AttachmentDataSetResource = {
  readonly name: string;
  readonly rows: RA<PartialUploadableFileSpec>;
  readonly uploaderstatus:
    | 'deleting'
    | 'deletingInterrupted'
    | 'main'
    | 'renaming'
    | 'uploading'
    | 'uploadInterrupted'
    | 'validating';
  readonly uploadplan: PartialAttachmentUploadSpec;
};

export type SavedAttachmentDataSetResource = AttachmentDataSetResource &
  SavedDataSetFields;

export type FetchedDataSet =
  | SavedAttachmentDataSetResource &
      (
        | { readonly uploaderstatus: 'main' }
        | ({
            readonly uploaderstatus: 'deleting' | 'uploading';
            readonly rows: RA<PartialUploadableFileSpec>;
          } & {
            readonly uploadplan: {
              readonly staticPathKey: keyof typeof staticAttachmentImportPaths;
            };
          })
      );
