import {
  AttachmentStatus,
  AttachmentWorkStateProps,
  PartialUploadableFileSpec,
  PostWorkUploadSpec,
  TestInternalUploadSpec,
  UploadAttachmentSpec,
  UploadInternalWorkable,
} from './types';
import { filterArray, RA } from '../../utils/types';
import React from 'react';
import { uploadFile } from './attachments';
import { Dialog, LoadingScreen } from '../Molecules/Dialog';
import { Button } from '../Atoms/Button';
import { wbText } from '../../localization/workbench';
import { AttachmentMapping } from './importPaths';
import { Progress } from '../Atoms';
import {
  reasonToSkipUpload,
  validateAttachmentFiles,
} from './batchUploadUtils';
import { formatTime, removeKey } from '../../utils/utils';
import { commonText } from '../../localization/common';
import { ajax } from '../../utils/ajax';
import {
  AttachmentUploadSpec,
  canValidateAttachmentDataSet,
  EagerDataSet,
} from './Import';
import { attachmentsText } from '../../localization/attachments';
import { formsText } from '../../localization/forms';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { Attachment, Tables } from '../DataModel/types';
import { AttachmentsAvailable } from './Plugin';
import { dialogIcons } from '../Atoms/Icons';
import { PerformAttachmentTask } from './PerformAttachmentTask';
import { schema } from '../DataModel/schema';
import { serializeResource } from '../DataModel/helpers';
import { SerializedResource } from '../DataModel/helperTypes';

const mapUploadFiles = (
  uploadable: PartialUploadableFileSpec
): TestInternalUploadSpec<'uploading'> => {
  const reason = reasonToSkipUpload(uploadable);
  return reason === undefined
    ? ({
        ...uploadable,
        canUpload: true,
        status: undefined,
      } as UploadInternalWorkable<'uploading'>)
    : {
        ...uploadable,
        canUpload: false,
        status: { type: 'skipped', reason: reason! },
      };
};

const shouldWork = (
  uploadable:
    | TestInternalUploadSpec<'uploading'>
    | PostWorkUploadSpec<'uploading'>
): uploadable is UploadInternalWorkable<'uploading'> => uploadable.canUpload;

function PerformAttachmentUpload(
  props: Parameters<typeof PerformAttachmentTask<'uploading'>>[0]
): JSX.Element | null {
  return PerformAttachmentTask<'uploading'>(props);
}

export const attachmentRemoveInternalUploadables = (
  internalSpec:
    | TestInternalUploadSpec<'uploading' | 'deleting'>
    | PostWorkUploadSpec<'uploading' | 'deleting'>
): PartialUploadableFileSpec =>
  'canUpload' in internalSpec
    ? removeKey(internalSpec, 'canUpload')
    : removeKey(internalSpec, 'canDelete');

async function prepareForUpload(
  dataSet: EagerDataSet
): Promise<RA<TestInternalUploadSpec<'uploading'>>> {
  const validatedFiles = await validateAttachmentFiles(
    dataSet.uploadableFiles,
    dataSet.uploadSpec as AttachmentUploadSpec,
    //If user validated before, and chose disambiguation, need to preserve it
    true
  );
  const mappedUpload = validatedFiles.map(mapUploadFiles);
  const fileNamesToTokenize = filterArray(
    mappedUpload.map((uploadable) =>
      uploadable.canUpload && uploadable.uploadTokenSpec === undefined
        ? uploadable.file.parsedName
        : undefined
    )
  );
  if (fileNamesToTokenize.length === 0) return mappedUpload;
  return await ajax<RA<UploadAttachmentSpec>>(
    '/attachment_gw/get_upload_params/',
    {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: {
        filenames: fileNamesToTokenize,
      },
    }
  ).then(({ data }) => {
    if (fileNamesToTokenize.length !== data.length) {
      // Throwing an error for development testing. Hasn't happened yet.
      throw new Error(
        'DEV: length changed in between effect calls. Unsafe. Aborting upload.'
      );
    }
    let indexInTokenData = 0;
    return mappedUpload.map((uploadableFile) => {
      return {
        ...uploadableFile,
        uploadTokenSpec:
          uploadableFile.canUpload &&
          uploadableFile.uploadTokenSpec === undefined
            ? data[indexInTokenData++]
            : uploadableFile.uploadTokenSpec,
      };
    });
  });
}

export function SafeUploadAttachmentsNew({
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
  const uploadDisabled = React.useMemo(
    () =>
      dataSet.needsSaved ||
      !canValidateAttachmentDataSet(dataSet) ||
      baseTableName === undefined,
    [dataSet]
  );

  const [upload, setTriedUpload] = React.useState<
    'base' | 'tried' | 'confirmed'
  >('base');

  React.useEffect(() => {
    if (upload !== 'confirmed') return;
    let destructorCalled = false;
    prepareForUpload(dataSet).then((mappedResult) => {
      if (destructorCalled) return;
      handleSync(mappedResult, true);
    });
    return () => {
      destructorCalled = true;
    };
  }, [upload]);

  const generateUploadPromise = React.useCallback(
    (
      uploadable: UploadInternalWorkable<'uploading'>,
      triggerRetry: () => void
    ): Promise<PostWorkUploadSpec<'uploading'>> =>
      uploadFileWrapped(
        uploadable,
        baseTableName!,
        uploadable.uploadTokenSpec,
        triggerRetry
      ),
    [baseTableName]
  );
  const handleUploadReMap = React.useCallback(
    (
      uploadables:
        | RA<
            | TestInternalUploadSpec<'uploading'>
            | PostWorkUploadSpec<'uploading'>
          >
        | undefined
    ): void => {
      handleSync(
        uploadables === undefined
          ? undefined
          : uploadables.map(attachmentRemoveInternalUploadables),
        false
      );
      // reset upload at the end
      setTriedUpload('base');
    },
    [handleSync]
  );
  return (
    <>
      <Button.BorderedGray
        disabled={uploadDisabled}
        onClick={() => setTriedUpload('tried')}
      >
        {wbText.upload()}
      </Button.BorderedGray>
      {dataSet.status === 'uploading' && !dataSet.needsSaved && (
        <PerformAttachmentUpload
          files={
            dataSet.uploadableFiles as RA<TestInternalUploadSpec<'uploading'>>
          }
          shouldWork={shouldWork}
          workPromiseGenerator={generateUploadPromise}
          onCompletedWork={handleUploadReMap}
        >
          {(props) => (
            <UploadState {...props} onCompletedWork={handleUploadReMap} />
          )}
        </PerformAttachmentUpload>
      )}
      {upload === 'tried' && (
        <AttachmentsAvailable>
          {({ available }) =>
            available ? (
              <Dialog
                header={attachmentsText.beginAttachmentUpload()}
                buttons={
                  <>
                    <Button.DialogClose>
                      {commonText.close()}
                    </Button.DialogClose>
                    <Button.Fancy
                      onClick={() => {
                        setTriedUpload('confirmed');
                      }}
                    >
                      {wbText.upload()}
                    </Button.Fancy>
                  </>
                }
                onClose={() => {
                  handleUploadReMap(undefined);
                }}
              >
                {attachmentsText.beginUploadDescription()}
              </Dialog>
            ) : (
              <Dialog
                icon={dialogIcons.warning}
                buttons={
                  <Button.DialogClose>{commonText.close()}</Button.DialogClose>
                }
                header={attachmentsText.attachmentServerUnavailable()}
                onClose={() => {
                  handleSync(undefined, false);
                  setTriedUpload('base');
                }}
              >
                <p>{attachmentsText.attachmentServerUnavailable()}</p>
              </Dialog>
            )
          }
        </AttachmentsAvailable>
      )}

      {
        // if upload was confirmed, but dataset status hasn't been set to uploading,
        // the uploader is validating, and generating tokens. Display loading screen
        // in that case
        upload === 'confirmed' && dataSet.status !== 'uploading' && (
          <LoadingScreen />
        )
      }
    </>
  );
}

function UploadState({
  workProgress,
  workRef,
  onStop: handleStop,
  onCompletedWork: handleCompletedWork,
  triggerNow,
}: AttachmentWorkStateProps<'uploading'>): JSX.Element | null {
  return workProgress.type === 'safe' ? (
    <Dialog
      buttons={
        <>
          <Button.Danger onClick={handleStop}>{wbText.stop()}</Button.Danger>
        </>
      }
      header={wbText.uploading()}
      onClose={() => undefined}
    >
      {attachmentsText.filesUploaded([
        workProgress.uploaded,
        workProgress.total,
      ])}
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
      header={wbText.uploadCanceled()}
      buttons={<Button.DialogClose>{commonText.close()}</Button.DialogClose>}
      onClose={() => handleCompletedWork(workRef.current.mappedFiles)}
    >
      {wbText.uploadCanceledDescription()}
    </Dialog>
  ) : workProgress.type === 'interrupted' ? (
    <Dialog
      header={attachmentsText.interrupted()}
      buttons={
        <>
          <Button.Danger onClick={handleStop}>{wbText.stop()}</Button.Danger>
          <Button.Fancy onClick={triggerNow}>
            {attachmentsText.tryNow()}
          </Button.Fancy>
        </>
      }
      onClose={() => undefined}
    >
      {attachmentsText.interruptedTime([formatTime(workProgress.retryingIn)])}
    </Dialog>
  ) : null;
}

export async function getFileValidity(file: File): Promise<void> {
  // Read the first byte of the file. If this fails, it would mean
  // the actual upload of the file to asset server is also guaranteed
  // to fail. Doing this because, browsers will throw File error
  // but that'd be outside of JS code, and we won't be able to catch it.
  return;
  await file.slice(0, 1).arrayBuffer();
}

async function uploadFileWrapped<KEY extends keyof typeof AttachmentMapping>(
  uploadableFile: UploadInternalWorkable<'uploading'>,
  baseTable: KEY,
  uploadAttachmentSpec: UploadAttachmentSpec | undefined,
  triggerRetry: () => void
): Promise<PostWorkUploadSpec<'uploading'>> {
  const getUploadableCommited = (
    status: AttachmentStatus | undefined,
    attachmentId?: number
  ) => ({
    ...uploadableFile,
    status,
    attachmentId: attachmentId,
  });

  try {
    await getFileValidity(uploadableFile.file);
  } catch (runTimeFileError) {
    console.log(runTimeFileError);
    return getUploadableCommited({
      type: 'cancelled',
      reason: attachmentsText.errorReadingFile([runTimeFileError]),
    });
  }
  let attachmentUpload: SpecifyResource<Attachment> | undefined;
  try {
    attachmentUpload = await uploadFile(
      uploadableFile.file,
      () => undefined,
      uploadAttachmentSpec
    );
  } catch (error) {
    triggerRetry();
  }

  if (attachmentUpload === undefined) {
    return getUploadableCommited({
      type: 'cancelled',
      reason: attachmentsText.attachmentServerUnavailable(),
    });
  }
  const matchId =
    uploadableFile.matchedId.length === 1
      ? uploadableFile.matchedId[0]
      : (uploadableFile.disambiguated as number);

  // Fetch base resource from the backend (for ex. CollectionObject or Taxon)
  const baseResourceRaw = new schema.models[baseTable].Resource({
    id: matchId,
  });
  const baseResource = (await baseResourceRaw.fetch()) as SpecifyResource<
    Tables['CollectionObject']
  >;
  attachmentUpload.set('tableID', baseResource.specifyModel.tableId);
  const relationshipName = AttachmentMapping[baseTable]
    .relationship as 'collectionObjectAttachments';

  const attachmentCollection = await baseResource.rgetCollection(
    relationshipName
  );

  const baseAttachment = new schema.models[
    AttachmentMapping[baseTable].attachmentTable
  ].Resource({
    attachment: attachmentUpload as never,
  }) as SpecifyResource<Tables['CollectionObjectAttachment']>;

  attachmentCollection.add(baseAttachment);
  const oridinalToSearch = baseAttachment.get('ordinal');

  let isConflict = false;
  const baseResourceSaved = await baseResource
    .save({
      onSaveConflict: () => {
        // TODO: Try fetching and saving the resource again - just do triggerRetry(). Maybe not
        // since triggerRetry will avoid all upload if more than MAX_RETRIES
        isConflict = true;
      },
    })
    .then(serializeResource);

  if (isConflict) {
    return getUploadableCommited({
      type: 'cancelled',
      reason: formsText.saveConflict(),
    });
  }
  const attachmentsSaved = baseResourceSaved[relationshipName];

  // This really shouldn't be anything other than 1.
  const ordinalLocationMatch = attachmentsSaved.filter((baseAttachment) => {
    const attachment =
      baseAttachment.attachment as SerializedResource<Attachment>;
    return (
      attachment.attachmentLocation ===
        uploadAttachmentSpec?.attachmentlocation &&
      baseAttachment.ordinal === oridinalToSearch
    );
  });

  if (ordinalLocationMatch.length === 1)
    return getUploadableCommited('uploaded', ordinalLocationMatch[0].id);

  if (ordinalLocationMatch.length === 0) {
    // If ordinal makes it too restrictive, try matching by
    // attachment location. If more than 1 match, we can skip.
    // If no match, also skip. We can't handle it.
    const locationMatch = attachmentsSaved.filter((baseAttachment) => {
      const attachment =
        baseAttachment.attachment as SerializedResource<Attachment>;
      return (
        attachment.attachmentLocation ===
        uploadAttachmentSpec?.attachmentlocation
      );
    });
    if (locationMatch.length === 1) {
      // Single match, so safe.
      console.warn('using match by attachmentLocation');
      return getUploadableCommited('uploaded', locationMatch[0].id);
    }
  }

  // We really can't handle this case. This would happen if ordinal and attachment
  // location don't uniquely identify the uploaded attachment.
  // or if we can't find the uploaded attachment by attachment location.
  // this is fairly unlikely, so probably never needed

  return getUploadableCommited({
    type: 'skipped',
    // TODO: Make this more descriptive. Very unlikely to ever get raised
    reason: attachmentsText.unhandledFatalResourceError(),
  });
}
