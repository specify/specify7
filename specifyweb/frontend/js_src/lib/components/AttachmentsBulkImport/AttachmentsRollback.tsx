import React from 'react';

import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import { wbText } from '../../localization/workbench';
import type { RA } from '../../utils/types';
import { removeItem } from '../../utils/utils';
import { Progress } from '../Atoms';
import { Button } from '../Atoms/Button';
import type {
  FilterTablesByEndsWith,
  SerializedResource,
} from '../DataModel/helperTypes';
import { fetchResource, saveResource } from '../DataModel/resource';
import { Dialog } from '../Molecules/Dialog';
import type { EagerDataSet } from './Import';
import { AttachmentMapping } from './importPaths';
import { PerformAttachmentTask } from './PerformAttachmentTask';
import type {
  AttachmentStatus,
  AttachmentWorkStateProps,
  PartialUploadableFileSpec,
  UploadInternalWorkable,
} from './types';
import { canDeleteAttachment, resolveAttachmentRecord } from './utils';

function mapDeleteFiles(
  uploadable: PartialUploadableFileSpec
): PartialUploadableFileSpec {
  const addStatus = (status: AttachmentStatus) => ({
    ...uploadable,
    status,
  });
  if (uploadable.attachmentId === undefined)
    return addStatus({ type: 'skipped', reason: 'noAttachments' });
  const record = resolveAttachmentRecord(
    uploadable.matchedId,
    uploadable.disambiguated,
    uploadable.file.parsedName
  );
  return addStatus(
    record.type === 'matched'
      ? record
      : { type: 'skipped', reason: record.reason }
  );
}

const shouldWork = (
  uploadable: PartialUploadableFileSpec
): uploadable is UploadInternalWorkable<'deleting'> =>
  uploadable.status?.type === 'matched';

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
  readonly baseTableName: keyof typeof AttachmentMapping;
}): JSX.Element {
  const rollbackDisabled = React.useMemo(
    () =>
      dataSet.needsSaved || !dataSet.uploadableFiles.some(canDeleteAttachment),
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
    async (deletable: UploadInternalWorkable<'deleting'>) =>
      deleteFileWrapped(deletable, baseTableName),
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
      {dataSet.status === 'deleting' && !dataSet.needsSaved ? (
        <PerformAttachmentTask<'deleting'>
          files={dataSet.uploadableFiles}
          shouldWork={shouldWork}
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
                  handleSync(dataSet.uploadableFiles.map(mapDeleteFiles), true);
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

async function deleteFileWrapped<KEY extends keyof typeof AttachmentMapping>(
  deletableFile: UploadInternalWorkable<'deleting'>,
  baseTable: KEY
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
  const matchId = deletableFile.status.id;
  const baseResource = await fetchResource(baseTable, matchId);

  const oldAttachments = baseResource[
    AttachmentMapping[baseTable].relationship
  ] as RA<SerializedResource<FilterTablesByEndsWith<'Attachment'>>>;
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
    [AttachmentMapping[baseTable].relationship]: removeItem(
      oldAttachments,
      attachmentToRemove
    ),
  };

  await saveResource(baseTable, matchId, newResource);
  return getDeletableCommited({ type: 'success', successType: 'deleted' });
}
