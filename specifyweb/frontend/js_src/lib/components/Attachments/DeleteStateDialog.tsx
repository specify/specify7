import {
  AttachmentStatus,
  AttachmentWorkStateProps,
  PartialUploadableFileSpec,
  PostWorkUploadSpec,
  TestInternalUploadSpec,
  UploadInternalWorkable,
} from './types';
import { RA } from '../../utils/types';
import { AttachmentMapping } from './importPaths';
import React from 'react';
import { fetchResource, saveResource } from '../DataModel/resource';
import { removeItem } from '../../utils/utils';
import { Dialog } from '../Molecules/Dialog';
import { Button } from '../Atoms/Button';
import { wbText } from '../../localization/workbench';
import { Progress } from '../Atoms';
import { attachmentRemoveInternalUploadables } from './UploadStateDialog';
import { canDeleteAttachment, reasonToSkipDelete } from './batchUploadUtils';
import {
  FilterTablesByEndsWith,
  SerializedResource,
} from '../DataModel/helperTypes';
import { commonText } from '../../localization/common';
import { EagerDataSet } from './Import';
import { PerformAttachmentTask } from './PerformAttachmentTask';
import { attachmentsText } from '../../localization/attachments';

const mapDeleteFiles = (
  uploadable: PartialUploadableFileSpec
): TestInternalUploadSpec<'deleting'> => {
  const reason = reasonToSkipDelete(uploadable);
  return reason === undefined
    ? ({
        ...uploadable,
        canDelete: true,
        status: undefined,
      } as UploadInternalWorkable<'deleting'>)
    : {
        ...uploadable,
        canDelete: false,
        status: { type: 'skipped', reason: reason! },
      };
};

const shouldWork = (
  uploadable:
    | TestInternalUploadSpec<'deleting'>
    | PostWorkUploadSpec<'deleting'>
): uploadable is UploadInternalWorkable<'deleting'> => uploadable.canDelete;

function PerformAttachmentRollback(
  props: Parameters<typeof PerformAttachmentTask<'deleting'>>[0]
): JSX.Element | null {
  return PerformAttachmentTask<'deleting'>(props);
}

function RollbackState({
  workProgress,
  workRef,
  onStop: handleStop,
  onCompletedWork: handleCompletedWork,
}: AttachmentWorkStateProps<'deleting'>): JSX.Element | null {
  return workProgress.type === 'safe' ? (
    <Dialog
      buttons={
        <>
          <Button.Danger onClick={handleStop}>{wbText.stop()}</Button.Danger>
        </>
      }
      header={wbText.rollingBack()}
      onClose={() => undefined}
    >
      {attachmentsText.filesRollbacked({
        rollbacked: workProgress.uploaded,
        total: workProgress.total,
      })}
      <Progress value={workProgress.uploaded} max={workProgress.total} />
    </Dialog>
  ) : workProgress.type === 'stopping' ? (
    <Dialog
      header={wbText.aborting()}
      buttons={<></>}
      onClose={() => undefined}
    >
      {wbText.aborting()}
    </Dialog>
  ) : workProgress.type === 'stopped' ? (
    <Dialog
      header={wbText.rollbackCanceled()}
      buttons={<Button.DialogClose>{commonText.close()}</Button.DialogClose>}
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
  readonly baseTableName: keyof typeof AttachmentMapping | undefined;
}): JSX.Element {
  const rollbackDisabled = React.useMemo(
    () =>
      dataSet.needsSaved || !dataSet.uploadableFiles.some(canDeleteAttachment),
    [dataSet]
  );
  const [rollback, setTriedRollback] = React.useState<
    'base' | 'tried' | 'confirmed'
  >('base');

  const handleRollbackReMap = React.useCallback(
    (
      uploadables:
        | RA<
            TestInternalUploadSpec<'deleting'> | PostWorkUploadSpec<'deleting'>
          >
        | undefined
    ): void => {
      handleSync(
        uploadables === undefined
          ? undefined
          : uploadables.map(attachmentRemoveInternalUploadables),
        false
      );
      setTriedRollback('base');
    },
    [handleSync]
  );

  const generateDeletePromise = React.useCallback(
    (deletable: UploadInternalWorkable<'deleting'>) =>
      deleteFileWrapped(deletable, baseTableName!),
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
      {dataSet.status === 'deleting' && !dataSet.needsSaved && (
        <PerformAttachmentRollback
          files={
            dataSet.uploadableFiles as RA<TestInternalUploadSpec<'deleting'>>
          }
          shouldWork={shouldWork}
          workPromiseGenerator={generateDeletePromise}
          onCompletedWork={handleRollbackReMap}
        >
          {(props) => (
            <RollbackState {...props} onCompletedWork={handleRollbackReMap} />
          )}
        </PerformAttachmentRollback>
      )}
      {rollback === 'tried' && (
        <Dialog
          header={wbText.beginRollback()}
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
): Promise<PostWorkUploadSpec<'deleting'>> {
  const getDeletableCommited = (status: AttachmentStatus | undefined) => ({
    ...deletableFile,
    status,
    attachmentId: status === 'deleted' ? undefined : deletableFile.attachmentId,
    // If deleted, reset token. Will just be generated later if uploaded again
    uploadAttachmentSpec:
      status === 'deleted' ? undefined : deletableFile.uploadTokenSpec,
  });
  const matchId =
    deletableFile.matchedId?.length === 1
      ? deletableFile.matchedId[0]
      : (deletableFile.disambiguated as number);
  const baseResource = await fetchResource(baseTable, matchId);

  const oldAttachments = baseResource[
    AttachmentMapping[baseTable].relationship
  ] as RA<SerializedResource<FilterTablesByEndsWith<'Attachment'>>>;
  const attachmentToRemove = oldAttachments.findIndex(
    ({ id }) => id === deletableFile.attachmentId
  );
  if (attachmentToRemove === -1) {
    return getDeletableCommited({ type: 'skipped', reason: 'not found' });
  }
  const newResource = {
    ...baseResource,
    [AttachmentMapping[baseTable].relationship]: removeItem(
      oldAttachments,
      attachmentToRemove
    ),
  };

  await saveResource(baseTable, matchId, newResource);
  return getDeletableCommited('deleted');
}
