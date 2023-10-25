import React from 'react';

import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import { wbText } from '../../localization/workbench';
import type { RA } from '../../utils/types';
import { removeItem } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import type { Tables } from '../DataModel/types';
import { Dialog } from '../Molecules/Dialog';
import { ActionState } from './ActionState';
import type { EagerDataSet } from './Import';
import { PerformAttachmentTask } from './PerformAttachmentTask';
import type {
  AttachmentStatus,
  PartialUploadableFileSpec,
  WrappedActionProps,
} from './types';
import {
  canDeleteAttachment,
  fetchForAttachmentUpload,
  getAttachmentsFromResource,
  resolveAttachmentRecord,
  saveForAttachmentUpload,
} from './utils';
import { hasPermission } from '../Permissions/helpers';

const dialogtext = {
  onAction: wbText.rollback(),
  onCancelled: wbText.rollbackCanceled(),
  onCancelledDescription: wbText.rollbackCanceledDescription(),
};
export function AttachmentRollback({
  dataSet,
  baseTableName,
  onSync: handleSync,
}: {
  readonly dataSet: EagerDataSet;
  readonly onSync: (
    generatedState: RA<PartialUploadableFileSpec> | undefined,
    isSyncing: boolean
  ) => void;
  readonly baseTableName: keyof Tables;
}): JSX.Element {
  const rollbackDisabled = React.useMemo(
    () => dataSet.needsSaved || !dataSet.rows.some(canDeleteAttachment),
    [dataSet]
  );
  const [rollback, setTriedRollback] = React.useState<
    'confirmed' | 'main' | 'tried'
  >('main');

  const handleRollbackReMap = React.useCallback(
    (uploadables: RA<PartialUploadableFileSpec> | undefined): void => {
      handleSync(uploadables, false);
      setTriedRollback('main');
    },
    [handleSync]
  );

  const generateDeletePromise = React.useCallback(
    async (
      deletable: PartialUploadableFileSpec,
      dryRun: boolean,
      triggerRetry?: () => void
    ) =>
      deleteFileWrapped({
        uploadableFile: deletable,
        baseTableName,
        dryRun,
        triggerRetry,
      }),
    [baseTableName]
  );
  return (
    <>
      {hasPermission('/attachment_import/dataset', 'rollback') && (
        <Button.BorderedGray
          disabled={rollbackDisabled}
          onClick={() => setTriedRollback('tried')}
        >
          {wbText.rollback()}
        </Button.BorderedGray>
      )}
      {dataSet.uploaderstatus === 'deleting' && !dataSet.needsSaved ? (
        <PerformAttachmentTask
          files={dataSet.rows}
          workPromiseGenerator={generateDeletePromise}
          onCompletedWork={handleRollbackReMap}
        >
          {(props) => (
            <ActionState
              {...props}
              dialogText={dialogtext}
              onCompletedWork={handleRollbackReMap}
            />
          )}
        </PerformAttachmentTask>
      ) : null}
      {rollback === 'tried' && (
        <Dialog
          buttons={
            <>
              <Button.DialogClose>{commonText.close()}</Button.DialogClose>
              <Button.Fancy
                onClick={() => {
                  Promise.all(
                    dataSet.rows.map(async (deletable) =>
                      deleteFileWrapped({
                        uploadableFile: deletable,
                        baseTableName,
                        dryRun: true,
                      })
                    )
                  ).then((files) => handleSync(files, true));
                  setTriedRollback('confirmed');
                }}
              >
                {wbText.rollback()}
              </Button.Fancy>
            </>
          }
          header={wbText.beginRollback()}
          onClose={() => handleRollbackReMap(undefined)}
        >
          {attachmentsText.rollbackDescription()}
        </Dialog>
      )}
    </>
  );
}

async function deleteFileWrapped<KEY extends keyof Tables>({
  uploadableFile: deletableFile,
  baseTableName,
  dryRun,
  triggerRetry,
}: WrappedActionProps<KEY>): Promise<PartialUploadableFileSpec> {
  const getDeletableCommitted = (status: AttachmentStatus) => ({
    ...deletableFile,
    status,
    attachmentId:
      status.type === 'success' ? undefined : deletableFile.attachmentId,
    // If deleted, reset token. Will just be generated later if uploaded again
    uploadAttachmentSpec:
      status.type === 'success' ? undefined : deletableFile.uploadTokenSpec,
  });

  if (deletableFile.attachmentId === undefined)
    return getDeletableCommitted({
      type: 'skipped',
      reason: 'noAttachments',
    });

  const record = resolveAttachmentRecord(
    deletableFile.matchedId,
    deletableFile.disambiguated,
    deletableFile.uploadFile.parsedName
  );

  if (record.type !== 'matched')
    return getDeletableCommitted({ type: 'skipped', reason: record.reason });

  if (dryRun) return getDeletableCommitted(record);

  const matchId = record.id;
  const baseResourceResponse = await fetchForAttachmentUpload(
    baseTableName,
    matchId,
    triggerRetry
  );

  if (baseResourceResponse.type === 'invalid')
    return getDeletableCommitted({
      type: 'skipped',
      reason: baseResourceResponse.reason,
    });
  const baseResource = baseResourceResponse.record;

  const { key, values: oldAttachments } = getAttachmentsFromResource(
    baseResource,
    `${baseTableName}attachments`
  );

  const attachmentToRemove = oldAttachments.findIndex(
    ({ id }) => id === deletableFile.attachmentId
  );
  if (attachmentToRemove === -1) {
    return getDeletableCommitted({
      type: 'skipped',
      reason: 'nothingFound',
    });
  }
  const newResource = {
    ...baseResource,
    [key]: removeItem(oldAttachments, attachmentToRemove),
  };

  const saveResponse = await saveForAttachmentUpload(
    baseTableName,
    matchId,
    newResource
  );
  return getDeletableCommitted(
    saveResponse.type === 'invalid'
      ? { type: 'skipped', reason: saveResponse.reason }
      : { type: 'success', successType: 'deleted' }
  );
}
