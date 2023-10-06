import React from 'react';

import { usePromise } from '../../hooks/useAsyncState';
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
import {
  attachmentSettingsPromise,
  uploadFile,
} from '../Attachments/attachments';
import { serializeResource } from '../DataModel/helpers';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { schema, strictGetModel } from '../DataModel/schema';
import type { Attachment, Tables } from '../DataModel/types';
import { Dialog } from '../Molecules/Dialog';
import type { AttachmentUploadSpec, EagerDataSet } from './Import';
import { PerformAttachmentTask } from './PerformAttachmentTask';
import type {
  AttachmentStatus,
  AttachmentWorkStateProps,
  PartialUploadableFileSpec,
  UploadAttachmentSpec,
} from './types';
import {
  getAttachmentsFromResource,
  resolveAttachmentRecord,
  validateAttachmentFiles,
} from './utils';
import { LoadingContext } from '../Core/Contexts';

async function prepareForUpload(
  dataSet: EagerDataSet,
  baseTableName: keyof Tables
): Promise<RA<PartialUploadableFileSpec>> {
  const validatedFiles = await validateAttachmentFiles(
    dataSet.rows,
    dataSet.uploadplan as AttachmentUploadSpec,
    // If user validated before, and chose disambiguation, need to preserve it
    true
  );
  const mappedUpload = await Promise.all(
    validatedFiles.map(async (uploadable) =>
      uploadFileWrapped({
        uploadableFile: uploadable,
        baseTableName,
        mockUpload: true,
      })
    )
  );
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
    return mappedUpload.map((uploadableFile) => {
      let uploadToken: UploadAttachmentSpec | undefined = undefined;
      if (
        uploadableFile.status?.type === 'matched' &&
        uploadableFile.uploadTokenSpec === undefined
      ) {
        uploadToken = data[indexInTokenData];
        indexInTokenData += 1;
      }
      return {
        ...uploadableFile,
        uploadTokenSpec: uploadToken ?? uploadableFile.uploadTokenSpec,
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
  readonly baseTableName: keyof Tables;
}): JSX.Element {
  const [upload, setTriedUpload] = React.useState<
    'confirmed' | 'main' | 'tried'
  >('main');

  const loading = React.useContext(LoadingContext);

  React.useEffect(() => {
    if (upload !== 'confirmed') return;
    let destructorCalled = false;
    /*
     * If upload was confirmed, but dataset status hasn't been set to uploading,
     * the uploader is validating, and generating tokens. Display loading screen
     * in that case
     */
    loading(
      prepareForUpload(dataSet, baseTableName).then((mappedResult) => {
        if (destructorCalled) return;
        handleSync(mappedResult, true);
      })
    );
    return () => {
      destructorCalled = true;
    };
  }, [upload]);

  const generateUploadPromise = React.useCallback(
    async (
      uploadable: PartialUploadableFileSpec,
      mockAction: boolean,
      triggerRetry: () => void
    ): Promise<PartialUploadableFileSpec> =>
      uploadFileWrapped({
        uploadableFile: uploadable,
        baseTableName,
        uploadAttachmentSpec: uploadable.uploadTokenSpec,
        mockUpload: mockAction,
        triggerRetry,
      }),
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
  const [available] = usePromise(attachmentSettingsPromise, true);

  return (
    <>
      <Button.BorderedGray
        disabled={dataSet.needsSaved}
        onClick={() => setTriedUpload('tried')}
      >
        {wbText.upload()}
      </Button.BorderedGray>
      {dataSet.uploaderstatus === 'uploading' && !dataSet.needsSaved ? (
        <PerformAttachmentTask
          files={dataSet.rows}
          workPromiseGenerator={generateUploadPromise}
          onCompletedWork={handleUploadReMap}
        >
          {(props) => (
            <UploadState {...props} onCompletedWork={handleUploadReMap} />
          )}
        </PerformAttachmentTask>
      ) : null}
      {upload === 'tried' &&
        (typeof available === 'boolean' ? (
          available ? (
            <Dialog
              buttons={
                <>
                  <Button.DialogClose>{commonText.close()}</Button.DialogClose>
                  <Button.Fancy onClick={() => setTriedUpload('confirmed')}>
                    {wbText.upload()}
                  </Button.Fancy>
                </>
              }
              header={attachmentsText.beginAttachmentUpload()}
              onClose={() => handleUploadReMap(undefined)}
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
              {attachmentsText.attachmentServerUnavailable()}
            </Dialog>
          )
        ) : null)}
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

type UploadFileProps<KEY extends keyof Tables> = {
  readonly uploadableFile: PartialUploadableFileSpec;
  readonly baseTableName: KEY;
  readonly uploadAttachmentSpec?: UploadAttachmentSpec;
  readonly mockUpload: boolean;
  readonly triggerRetry?: () => void;
};
async function uploadFileWrapped<KEY extends keyof Tables>({
  uploadableFile,
  baseTableName,
  uploadAttachmentSpec,
  mockUpload,
  triggerRetry,
}: UploadFileProps<KEY>): Promise<PartialUploadableFileSpec> {
  const getUploadableCommited = (
    status: AttachmentStatus,
    attachmentId?: number
  ) => ({
    ...uploadableFile,
    status,
    attachmentId,
  });

  if (uploadableFile.attachmentId !== undefined)
    return getUploadableCommited(
      {
        type: 'skipped',
        reason: 'alreadyUploaded',
      },
      uploadableFile.attachmentId
    );

  if (!(uploadableFile.file instanceof File))
    return getUploadableCommited({
      type: 'skipped',
      reason: 'noFile',
    });

  const record = resolveAttachmentRecord(
    uploadableFile.matchedId,
    uploadableFile.disambiguated,
    uploadableFile.file.parsedName
  );
  if (record.type !== 'matched')
    return getUploadableCommited({ type: 'skipped', reason: record.reason });

  if (mockUpload) return getUploadableCommited(record);

  const attachmentUpload = await uploadFile(
    uploadableFile.file,
    () => undefined,
    uploadAttachmentSpec
  ).catch(triggerRetry);

  if (attachmentUpload === undefined) {
    return getUploadableCommited({
      type: 'cancelled',
      reason: 'attachmentServerUnavailable',
    });
  }

  const matchId = record.id;
  // Fetch base resource from the backend (for ex. CollectionObject or Taxon)
  const baseResourceRaw = new schema.models[
    baseTableName as 'CollectionObject'
  ].Resource({
    id: matchId,
  });
  // Casting to simplify typing
  const baseResource = await baseResourceRaw.fetch();
  attachmentUpload.set('tableID', baseResource.specifyModel.tableId);
  const relationshipName =
    `${baseTableName}attachments` as 'collectionObjectAttachments';

  const attachmentCollection = await baseResource.rgetCollection(
    relationshipName
  );

  const model = strictGetModel(`${baseTableName}Attachment`);
  const baseAttachment: SpecifyResource<Tables['CollectionObjectAttachment']> =
    new model.Resource({
      attachment: attachmentUpload as never,
    });

  attachmentCollection.add(baseAttachment);
  const oridinalToSearch = baseAttachment.get('ordinal');

  let isConflict = false;
  const baseResourceSaved = await baseResource
    .save({
      onSaveConflict: () => {
        /*
         * FEATURE: Try fetching and saving the resource again - just do triggerRetry(). Maybe not
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
  const attachmentsSaved = getAttachmentsFromResource(
    baseResourceSaved,
    `${baseTableName}attachments`
  );

  // This really shouldn't be anything other than 1.
  const ordinalLocationMatch = attachmentsSaved.filter((baseAttachment) => {
    const attachment =
      baseAttachment.attachment as SerializedResource<Attachment>;
    return (
      attachment.attachmentLocation ===
        uploadAttachmentSpec?.attachmentLocation &&
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
        uploadAttachmentSpec?.attachmentLocation
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
