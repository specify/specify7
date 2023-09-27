import React from 'react';

import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import { wbText } from '../../localization/workbench';
import { ajax } from '../../utils/ajax';
import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { formatTime } from '../../utils/utils';
import { Progress } from '../Atoms';
import { Button } from '../Atoms/Button';
import { dialogIcons } from '../Atoms/Icons';
import { serializeResource } from '../DataModel/helpers';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { schema } from '../DataModel/schema';
import type { Attachment, Tables } from '../DataModel/types';
import { Dialog, LoadingScreen } from '../Molecules/Dialog';
import { uploadFile } from '../Attachments/attachments';
import { resolveAttachmentRecord, validateAttachmentFiles } from './utils';
import type { AttachmentUploadSpec, EagerDataSet } from './Import';
import { AttachmentMapping } from './importPaths';
import { PerformAttachmentTask } from './PerformAttachmentTask';
import { AttachmentsAvailable } from '../Attachments/Plugin';
import type {
  AttachmentStatus,
  AttachmentWorkStateProps,
  PartialUploadableFileSpec,
  UploadAttachmentSpec,
  UploadInternalWorkable,
} from './types';

function mapUploadFiles(
  uploadable: PartialUploadableFileSpec
): PartialUploadableFileSpec {
  const addStatus = (status: AttachmentStatus): PartialUploadableFileSpec => ({
    ...uploadable,
    status,
  });
  if (uploadable.attachmentId !== undefined)
    return addStatus({
      type: 'skipped',
      reason: 'alreadyUploaded',
    });
  if (!(uploadable.file instanceof File))
    return addStatus({
      type: 'skipped',
      reason: 'noFile',
    });

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
): uploadable is UploadInternalWorkable<'uploading'> =>
  mapUploadFiles(uploadable).status?.type === 'matched';

async function prepareForUpload(
  dataSet: EagerDataSet
): Promise<RA<PartialUploadableFileSpec>> {
  const validatedFiles = await validateAttachmentFiles(
    dataSet.uploadableFiles,
    dataSet.uploadSpec as AttachmentUploadSpec,
    // If user validated before, and chose disambiguation, need to preserve it
    true
  );
  const mappedUpload = validatedFiles.map(mapUploadFiles);
  const fileNamesToTokenize = filterArray(
    mappedUpload.map((uploadable) =>
      uploadable.status?.type === 'matched' &&
      uploadable.uploadTokenSpec === undefined
        ? uploadable.file.name
        : undefined
    )
  );
  if (fileNamesToTokenize.length === 0) return mappedUpload;
  return ajax<RA<UploadAttachmentSpec>>('/attachment_gw/get_upload_params/', {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: {
      filenames: fileNamesToTokenize,
    },
  }).then(({ data }) => {
    if (fileNamesToTokenize.length !== data.length) {
      // Throwing an error for development testing. Hasn't happened yet.
      throw new Error(
        'DEV: length changed in between effect calls. Unsafe. Aborting upload.'
      );
    }
    let indexInTokenData = 0;
    return mappedUpload.map((uploadableFile) => ({
      ...uploadableFile,
      uploadTokenSpec:
        uploadableFile.status?.type === 'matched' &&
        uploadableFile.uploadTokenSpec === undefined
          ? data[indexInTokenData++]
          : uploadableFile.uploadTokenSpec,
    }));
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
  readonly baseTableName: keyof typeof AttachmentMapping;
}): JSX.Element {
  const uploadDisabled = React.useMemo(() => dataSet.needsSaved, [dataSet]);

  const [upload, setTriedUpload] = React.useState<
    'main' | 'confirmed' | 'tried'
  >('main');

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
    async (
      uploadable: UploadInternalWorkable<'uploading'>,
      triggerRetry: () => void
    ): Promise<PartialUploadableFileSpec> =>
      uploadFileWrapped(
        uploadable,
        baseTableName,
        uploadable.uploadTokenSpec,
        triggerRetry
      ),
    [baseTableName]
  );
  const handleUploadReMap = React.useCallback(
    (uploadables: RA<PartialUploadableFileSpec> | undefined): void => {
      handleSync(uploadables, false);
      // Reset upload at the end
      setTriedUpload('main');
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
      {dataSet.status === 'uploading' && !dataSet.needsSaved ? (
        <PerformAttachmentTask<'uploading'>
          files={dataSet.uploadableFiles}
          shouldWork={shouldWork}
          workPromiseGenerator={generateUploadPromise}
          onCompletedWork={handleUploadReMap}
        >
          {(props) => (
            <UploadState {...props} onCompletedWork={handleUploadReMap} />
          )}
        </PerformAttachmentTask>
      ) : null}
      {upload === 'tried' && (
        <AttachmentsAvailable>
          {({ available }) =>
            available ? (
              <Dialog
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
                header={attachmentsText.beginAttachmentUpload()}
                onClose={() => {
                  handleUploadReMap(undefined);
                }}
              >
                {attachmentsText.beginUploadDescription()}
              </Dialog>
            ) : (
              <Dialog
                buttons={
                  <Button.DialogClose>{commonText.close()}</Button.DialogClose>
                }
                header={attachmentsText.attachmentServerUnavailable()}
                icon={dialogIcons.warning}
                onClose={() => {
                  handleSync(undefined, false);
                  setTriedUpload('main');
                }}
              >
                <p>{attachmentsText.attachmentServerUnavailable()}</p>
              </Dialog>
            )
          }
        </AttachmentsAvailable>
      )}

      {
        /*
         * If upload was confirmed, but dataset status hasn't been set to uploading,
         * the uploader is validating, and generating tokens. Display loading screen
         * in that case
         */
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
}: AttachmentWorkStateProps): JSX.Element | null {
  return workProgress.type === 'safe' ? (
    <Dialog
      buttons={
        <Button.Danger onClick={handleStop}>{wbText.stop()}</Button.Danger>
      }
      header={wbText.uploading()}
      onClose={undefined}
    >
      {attachmentsText.filesUploaded({
        uploaded: workProgress.uploaded,
        total: workProgress.total,
      })}
      <Progress max={workProgress.total} value={workProgress.uploaded} />
    </Dialog>
  ) : workProgress.type === 'stopping' ? (
    <Dialog buttons={undefined} header={wbText.aborting()} onClose={undefined}>
      {wbText.aborting()}
    </Dialog>
  ) : workProgress.type === 'stopped' ? (
    <Dialog
      buttons={<Button.DialogClose>{commonText.close()}</Button.DialogClose>}
      header={wbText.uploadCanceled()}
      onClose={() => handleCompletedWork(workRef.current.mappedFiles)}
    >
      {wbText.uploadCanceledDescription()}
    </Dialog>
  ) : workProgress.type === 'interrupted' ? (
    <Dialog
      buttons={
        <>
          <Button.Danger onClick={handleStop}>{wbText.stop()}</Button.Danger>
          <Button.Fancy onClick={triggerNow}>
            {attachmentsText.tryNow()}
          </Button.Fancy>
        </>
      }
      header={attachmentsText.interrupted()}
      onClose={undefined}
    >
      {attachmentsText.interruptedTime({
        remainingTime: formatTime(workProgress.retryingIn),
      })}
    </Dialog>
  ) : null;
}

async function uploadFileWrapped<KEY extends keyof typeof AttachmentMapping>(
  uploadableFile: UploadInternalWorkable<'uploading'>,
  baseTable: KEY,
  uploadAttachmentSpec: UploadAttachmentSpec | undefined,
  triggerRetry: () => void
): Promise<PartialUploadableFileSpec> {
  const getUploadableCommited = (
    status: AttachmentStatus | undefined,
    attachmentId?: number
  ) => ({
    ...uploadableFile,
    status,
    attachmentId,
  });

  let attachmentUpload: SpecifyResource<Attachment> | undefined;
  try {
    attachmentUpload = await uploadFile(
      uploadableFile.file,
      () => undefined,
      uploadAttachmentSpec
    );
  } catch {
    triggerRetry();
  }

  if (attachmentUpload === undefined) {
    return getUploadableCommited({
      type: 'cancelled',
      reason: 'attachmentServerUnavailable',
    });
  }
  const matchId = uploadableFile.status.id;
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
        /*
         * TODO: Try fetching and saving the resource again - just do triggerRetry(). Maybe not
         * since triggerRetry will avoid all upload if more than MAX_RETRIES
         */
        isConflict = true;
      },
    })
    .then(serializeResource);

  if (isConflict) {
    return getUploadableCommited({
      type: 'cancelled',
      reason: 'saveConflict',
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

  const success = { type: 'success', successType: 'uploaded' } as const;
  if (ordinalLocationMatch.length === 1)
    return getUploadableCommited(success, ordinalLocationMatch[0].id);

  if (ordinalLocationMatch.length === 0) {
    /*
     * If ordinal makes it too restrictive, try matching by
     * attachment location. If more than 1 match, we can skip.
     * If no match, also skip. We can't handle it.
     */
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
      return getUploadableCommited(success, locationMatch[0].id);
    }
  }

  /*
   * We really can't handle this case. This would happen if ordinal and attachment
   * location don't uniquely identify the uploaded attachment.
   * or if we can't find the uploaded attachment by attachment location.
   * this is fairly unlikely, so probably never needed
   */

  return getUploadableCommited({
    type: 'skipped',
    // TODO: Make this more descriptive. Very unlikely to ever get raised
    reason: 'unhandledFatalResourceError',
  });
}
