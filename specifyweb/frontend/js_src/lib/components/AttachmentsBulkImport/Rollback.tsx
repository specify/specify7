import React from 'react';

import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import { wbText } from '../../localization/workbench';
import type { RA } from '../../utils/types';
import { removeItem } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import type { Tables } from '../DataModel/types';
import { Dialog } from '../Molecules/Dialog';
import { hasPermission } from '../Permissions/helpers';
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
  readonly baseTableName: keyof Tables | undefined;
}): JSX.Element {
  const rollbackDisabled = React.useMemo(
    () =>
      dataSet.needsSaved ||
      !dataSet.rows.some(canDeleteAttachment) ||
      baseTableName === undefined,
    // Uploader status is enough as a depedency
    [dataSet.needsSaved, dataSet.uploaderstatus, baseTableName]
  );
  const [rollback, setTriedRollback] = React.useState<
    'confirmed' | 'main' | 'tried'
  >('main');

  const [deletedCount, setDeletedCount] = React.useState<number | undefined>(
    undefined
  );

  const handleRollbackReMap = React.useCallback(
    (uploadables: RA<PartialUploadableFileSpec> | undefined): void => {
      handleSync(uploadables, false);
      setTriedRollback('main');
      setDeletedCount(
        uploadables?.filter(({ status }) => status?.type === 'success').length
      );
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
        baseTableName: baseTableName!,
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
              <Button.Danger
                onClick={() => {
                  Promise.all(
                    dataSet.rows.map(async (deletable) =>
                      deleteFileWrapped({
                        uploadableFile: deletable,
                        baseTableName: baseTableName!,
                        dryRun: true,
                      })
                    )
                  ).then((files) => handleSync(files, true));
                  setTriedRollback('confirmed');
                }}
              >
                {wbText.rollback()}
              </Button.Danger>
            </>
          }
          header={wbText.beginRollback()}
          onClose={() => handleRollbackReMap(undefined)}
        >
          {attachmentsText.rollbackDescription()}
        </Dialog>
      )}
      {deletedCount === undefined ? null : (
        <Dialog
          buttons={commonText.close()}
          header={attachmentsText.rollbackResults()}
          onClose={() => setDeletedCount(undefined)}
        >
          {attachmentsText.resultValue({
            success: deletedCount,
            total: dataSet.rows.length,
            action: attachmentsText.deleted().toLowerCase(),
          })}
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
  const getDeletableCommitted = (
    status: AttachmentStatus,
    isSuccess: boolean = status.type === 'success'
  ) => ({
    ...deletableFile,
    status,
    attachmentId: isSuccess ? undefined : deletableFile.attachmentId,
    // If deleted, reset token. Will just be generated later if uploaded again
    uploadAttachmentSpec: isSuccess ? undefined : deletableFile.uploadTokenSpec,
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
    // If attachment got deleted from somewhere else, mark it deleted
    return getDeletableCommitted(
      {
        type: 'skipped',
        reason: 'noAttachments',
      },
      true
    );
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
