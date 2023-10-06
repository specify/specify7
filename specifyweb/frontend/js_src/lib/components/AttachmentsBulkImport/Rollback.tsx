import React from 'react';

import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import { wbText } from '../../localization/workbench';
import type { RA } from '../../utils/types';
import { removeItem } from '../../utils/utils';
import { Progress } from '../Atoms';
import { Button } from '../Atoms/Button';
import type { SerializedResource } from '../DataModel/helperTypes';
import { fetchResource, saveResource } from '../DataModel/resource';
import type { Tables } from '../DataModel/types';
import { Dialog } from '../Molecules/Dialog';
import type { EagerDataSet } from './Import';
import { PerformAttachmentTask } from './PerformAttachmentTask';
import type {
  AttachmentStatus,
  AttachmentWorkStateProps,
  PartialUploadableFileSpec,
} from './types';
import {
  canDeleteAttachment,
  getAttachmentsFromResource,
  resolveAttachmentRecord,
} from './utils';

function RollbackState({
  workProgress,
  workRef,
  onStop: handleStop,
  onCompletedWork: handleCompletedWork,
}: AttachmentWorkStateProps): JSX.Element | null {
  return workProgress.type === 'safe' ? (
    <Dialog
      buttons={
        <Button.Danger onClick={handleStop}>{wbText.stop()}</Button.Danger>
      }
      header={wbText.rollingBack()}
      onClose={undefined}
    >
      {attachmentsText.filesRollbacked({
        rollbacked: workProgress.uploaded,
        total: workProgress.total,
      })}
      <Progress max={workProgress.total} value={workProgress.uploaded} />
    </Dialog>
  ) : // eslint-disable-next-line no-nested-ternary
  workProgress.type === 'stopping' ? (
    <Dialog buttons={undefined} header={wbText.aborting()} onClose={undefined}>
      {wbText.aborting()}
    </Dialog>
  ) : workProgress.type === 'stopped' ? (
    <Dialog
      buttons={<Button.DialogClose>{commonText.close()}</Button.DialogClose>}
      header={wbText.rollbackCanceled()}
      onClose={() => handleCompletedWork(workRef.current.mappedFiles)}
    >
      {wbText.rollbackCanceledDescription()}
    </Dialog>
  ) : null;
}

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
    async (deletable: PartialUploadableFileSpec, mockAction: boolean) =>
      deleteFileWrapped(deletable, baseTableName, mockAction),
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
            <RollbackState {...props} onCompletedWork={handleRollbackReMap} />
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
                    dataSet.rows.map((deletable) =>
                      deleteFileWrapped(deletable, baseTableName, true)
                    )
                  ).then((files) => handleSync(files, true)),
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
  mockDelete: boolean
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
    deletableFile.file.parsedName
  );

  if (record.type !== 'matched')
    return getDeletableCommited({ type: 'skipped', reason: record.reason });

  if (mockDelete) return getDeletableCommited(record);

  const matchId = record.id;
  const baseResource = await fetchResource(baseTable, matchId);

  const oldAttachments = getAttachmentsFromResource(
    baseResource as SerializedResource<Tables['CollectionObject']>,
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
    [`${baseTable}attachments`.toLowerCase()]: removeItem(
      oldAttachments,
      attachmentToRemove
    ),
  };

  await saveResource(baseTable, matchId, newResource);
  return getDeletableCommited({ type: 'success', successType: 'deleted' });
}
