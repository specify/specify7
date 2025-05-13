import type React from 'react';
import type { LocalizedString } from 'typesafe-i18n';
import type { State } from 'typesafe-reducer';

import type { RA, RR } from '../../utils/types';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { Attachment, Tables } from '../DataModel/types';
import type { DatasetBase, DatasetBriefBase } from '../WbPlanView/Wrapped';
import type { PartialAttachmentUploadSpec } from './Import';
import type { staticAttachmentImportPaths } from './importPaths';
import type { keyLocalizationMapAttachment } from './utils';

export type UploadAttachmentSpec = {
  readonly token: string;
  readonly attachmentLocation: string;
};

type Matched = State<
  'matched',
  {
    readonly id: number;
  }
>;

type Skipped = State<
  'cancelled' | 'skipped',
  {
    readonly reason: keyof typeof keyLocalizationMapAttachment;
  }
>;
type Success = State<
  'success',
  {
    readonly successType: 'deleted' | 'uploaded';
  }
>;
export type AttachmentStatus = Matched | Skipped | Success;

export type PartialUploadableFileSpec = Partial<UploadableFileSpec> &
  Pick<UploadableFileSpec, 'uploadFile'>;

type UploadableFileSpec = {
  readonly uploadFile: UnBoundFile;
  readonly matchedId: RA<number>;
  readonly status: AttachmentStatus;
  readonly disambiguated: number;
  readonly attachmentId: number;
  readonly uploadTokenSpec: UploadAttachmentSpec;
  /*
   * This is added because if an attachment was uploaded correctly, but a network error
   * happened while saving the resource, and we retry, we will loose the previous attachment
   */
  readonly attachmentFromPreviousTry?: SpecifyResource<Attachment>;
};

/*
 * Forcing keys to be primitive because objects would be
 * ignored during syncing to backend.
 */
export type BoundFile = Pick<File, 'name' | 'size' | 'type'>;

export type UnBoundFile = {
  readonly file: BoundFile | File;
  readonly parsedName?: string;
};

export type AttachmentWorkProgress = {
  readonly total: number;
  readonly uploaded: number;
  readonly type: 'interrupted' | 'safe' | 'stopped' | 'stopping';
  readonly retryingIn: number;
  readonly stoppedByUser: boolean;
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
  readonly workProgress: AttachmentWorkProgress;
  readonly workRef: React.MutableRefObject<AttachmentWorkRef>;
  readonly onStop: () => void;
  readonly triggerNow: () => void;
  readonly dialogText: RR<
    'onAction' | 'onCancelled' | 'onCancelledDescription',
    LocalizedString
  >;
};

export type AttachmentDatasetBrief = DatasetBriefBase & {
  readonly uploaderstatus:
    | 'deleting'
    | 'deletingInterrupted'
    | 'main'
    | 'uploading'
    | 'uploadInterrupted'
    | 'validating';
};

export type AttachmentDataSetPlan = AttachmentDatasetBrief & {
  readonly uploadplan: {
    readonly staticPathKey: string;
  };
};

export type AttachmentDataSet = AttachmentDatasetBrief &
  DatasetBase & {
    readonly rows: RA<PartialUploadableFileSpec>;
    readonly uploadplan: PartialAttachmentUploadSpec;
    readonly uploadresult?: {
      readonly timestamp: string;
    };
  };

export type FetchedDataSet = AttachmentDataSet &
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

export type WrappedActionProps<KEY extends keyof Tables> = {
  readonly uploadableFile: PartialUploadableFileSpec;
  readonly baseTableName: KEY;
  readonly dryRun: boolean;
  readonly triggerRetry?: () => void;
};
