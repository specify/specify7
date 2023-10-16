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
import type { AttachmentStatus, PartialUploadableFileSpec } from './types';
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
export function SafeRollbackAttachmentsNew({
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
      mockAction: boolean,
      triggerRetry?: () => void
    ) => deleteFileWrapped(deletable, baseTableName, mockAction, triggerRetry),
    [baseTableName]
  );
  return (
    <>
      <Button.BorderedGray
        disabled={rollbackDisabled}
        onClick={() => setTriedRollback('tried')}
      >
        {wbText.rollback()}
      </Button.BorderedGray>
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
                      deleteFileWrapped(deletable, baseTableName, true)
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

async function deleteFileWrapped<KEY extends keyof Tables>(
  deletableFile: PartialUploadableFileSpec,
  baseTable: KEY,
  mockDelete: boolean,
  triggerRetry?: () => void
): Promise<PartialUploadableFileSpec> {
  const getDeletableCommited = (status: AttachmentStatus) => ({
    ...deletableFile,
    status,
    attachmentId:
      status.type === 'success' ? undefined : deletableFile.attachmentId,
    // If deleted, reset token. Will just be generated later if uploaded again
    uploadAttachmentSpec:
      status.type === 'success' ? undefined : deletableFile.uploadTokenSpec,
  });

  if (deletableFile.attachmentId === undefined)
    return getDeletableCommited({
      type: 'skipped',
      reason: 'noAttachments',
    });

  const record = resolveAttachmentRecord(
    deletableFile.matchedId,
    deletableFile.disambiguated,
    deletableFile.uploadFile.parsedName
  );

  if (record.type !== 'matched')
    return getDeletableCommited({ type: 'skipped', reason: record.reason });

  if (mockDelete) return getDeletableCommited(record);

  const matchId = record.id;
  const baseResourceResponse = await fetchForAttachmentUpload(
    baseTable,
    matchId,
    triggerRetry
  );

  if (baseResourceResponse.type === 'invalid')
    return getDeletableCommited({
      type: 'skipped',
      reason: baseResourceResponse.reason,
    });
  const baseResource = baseResourceResponse.record;

  const { key, values: oldAttachments } = getAttachmentsFromResource(
    baseResource,
    `${baseTable}attachments`
  );

  const attachmentToRemove = oldAttachments.findIndex(
    ({ id }) => id === deletableFile.attachmentId
  );
  if (attachmentToRemove === -1) {
    return getDeletableCommited({
      type: 'skipped',
      reason: 'nothingFound',
    });
  }
  const newResource = {
    ...baseResource,
    [key]: removeItem(oldAttachments, attachmentToRemove),
  };

  const saveResponse = await saveForAttachmentUpload(
    baseTable,
    matchId,
    newResource
  );
  return getDeletableCommited(
    saveResponse.type === 'invalid'
      ? { type: 'skipped', reason: saveResponse.reason }
      : { type: 'success', successType: 'deleted' }
  );
}
