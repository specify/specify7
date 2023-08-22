import {
  AttachmentStatus,
  CanDelete,
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
import {
  attachmentRemoveInternalUploadables,
  useAttachmentWorkLoop,
} from './UploadStateDialog';
import { reasonToSkipDelete } from './batchUploadUtils';
import {
  FilterTablesByEndsWith,
  SerializedResource,
} from '../DataModel/helperTypes';
import { commonText } from '../../localization/common';
import { EagerDataSet } from './Import';

const mapDeleteFiles = (
  uploadable: PartialUploadableFileSpec
): TestInternalUploadSpec<'deleting'> => {
  const reason = reasonToSkipDelete(uploadable);
  const canDelete = ((_: PartialUploadableFileSpec): _ is CanDelete =>
    reason === undefined)(uploadable);
  return canDelete
    ? {
        ...uploadable,
        canDelete: true,
        status: undefined,
      }
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

export function RollbackAttachments({
  dataSet,
  uploadedFiles,
  onSync: handleSync,
  baseTableName,
}: {
  readonly uploadedFiles: RA<PartialUploadableFileSpec>;
  readonly onSync: (
    postDeletedFiles: RA<PartialUploadableFileSpec> | undefined,
    isSyncing: boolean
  ) => void;
  readonly baseTableName: keyof typeof AttachmentMapping;
  readonly dataSet: EagerDataSet;
}): JSX.Element | null {
  const handleUploadReMap = React.useCallback(
    (
      uploadables:
        | RA<
            TestInternalUploadSpec<'deleting'> | PostWorkUploadSpec<'deleting'>
          >
        | undefined
    ): void =>
      handleSync(
        uploadables === undefined
          ? undefined
          : uploadables.map(attachmentRemoveInternalUploadables),
        false
      ),
    [handleSync]
  );

  const generateDeletePromise = React.useCallback(
    (deletable: UploadInternalWorkable<'deleting'>) =>
      deleteFileWrapped(deletable, baseTableName),
    [baseTableName]
  );

  const [deleteProgress, deleteRef, triggerStop] =
    useAttachmentWorkLoop<'deleting'>(
      () => uploadedFiles.map(mapDeleteFiles),
      shouldWork,
      generateDeletePromise,
      handleUploadReMap,
      dataSet.save || dataSet.needsSaved
    );

  return deleteProgress.type === 'safe' ? (
    <Dialog
      buttons={
        <>
          <Button.Danger onClick={triggerStop}>{wbText.stop()}</Button.Danger>
        </>
      }
      header={'Deleting'}
      onClose={() => undefined}
    >
      {`Files Deleted: ${deleteProgress.uploaded}/${deleteProgress.total}`}
      <Progress value={deleteProgress.uploaded} max={deleteProgress.total} />
    </Dialog>
  ) : deleteProgress.type === 'stopping' ? (
    <Dialog
      header={wbText.aborting()}
      buttons={<></>}
      onClose={() => undefined}
    >
      {wbText.aborting()}
    </Dialog>
  ) : deleteProgress.type === 'stopped' ? (
    <Dialog
      header={'Abort Successful'}
      buttons={<Button.DialogClose>{'Close'}</Button.DialogClose>}
      onClose={() => handleUploadReMap(deleteRef.current.mappedFiles)}
    >
      {'Abort Successful message'}
    </Dialog>
  ) : (
    <Dialog
      header={'Begin Rollback?'}
      buttons={
        <>
          <Button.DialogClose>{commonText.close()}</Button.DialogClose>
          <Button.Fancy
            onClick={() => handleSync(deleteRef.current.mappedFiles, true)}
          >
            {'Start'}
          </Button.Fancy>
        </>
      }
      onClose={() => handleUploadReMap(undefined)}
    >
      {'Deleting the attachments will do some dangerous stuff'}
    </Dialog>
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
    //uploadAttachmentSpec:
    //  status === 'deleted' ? undefined : deletableFile.uploadTokenSpec,
  });
  const matchId =
    deletableFile.matchedId?.length === 1
      ? deletableFile.matchedId[0]
      : (deletableFile.disambiguated as number);
  const baseResource = await fetchResource(baseTable, matchId);

  const oldAttachments = baseResource[AttachmentMapping[baseTable]] as RA<
    SerializedResource<FilterTablesByEndsWith<'Attachment'>>
  >;
  const attachmentToRemove = oldAttachments.findIndex(
    ({ id }) => id === deletableFile.attachmentId
  );
  if (attachmentToRemove === -1) {
    return getDeletableCommited({ type: 'skipped', reason: 'not found' });
  }
  const newResource = {
    ...baseResource,
    [AttachmentMapping[baseTable]]: removeItem(
      oldAttachments,
      attachmentToRemove
    ),
  };

  const savedResource = await saveResource(baseTable, matchId, newResource);
  console.log(savedResource);
  return getDeletableCommited('deleted');
}
