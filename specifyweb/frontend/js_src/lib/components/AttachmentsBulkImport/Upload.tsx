import React from 'react';

import { usePromise } from '../../hooks/useAsyncState';
import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import { wbText } from '../../localization/workbench';
import { ajax } from '../../utils/ajax';
import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { removeKey } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { dialogIcons } from '../Atoms/Icons';
import {
  attachmentSettingsPromise,
  fetchAssetToken,
  uploadFile,
} from '../Attachments/attachments';
import { LoadingContext } from '../Core/Contexts';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { serializeResource } from '../DataModel/serializers';
import { strictGetTable } from '../DataModel/tables';
import type { Attachment, Tables } from '../DataModel/types';
import { Dialog } from '../Molecules/Dialog';
import { hasPermission } from '../Permissions/helpers';
import { ActionState } from './ActionState';
import type { AttachmentUploadSpec, EagerDataSet } from './Import';
import { PerformAttachmentTask } from './PerformAttachmentTask';
import type {
  AttachmentStatus,
  PartialUploadableFileSpec,
  UploadAttachmentSpec,
  WrappedActionProps,
} from './types';
import {
  fetchForAttachmentUpload,
  getAttachmentsFromResource,
  resolveAttachmentRecord,
  saveForAttachmentUpload,
  validateAttachmentFiles,
} from './utils';

async function prepareForUpload(
  dataSet: EagerDataSet,
  baseTableName: keyof Tables
): Promise<RA<PartialUploadableFileSpec>> {
  // Matching happens here
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
        dryRun: true,
      })
    )
  );
  const fileNamesToTokenize = filterArray(
    mappedUpload.map((uploadable) =>
      uploadable.status?.type === 'matched' &&
      uploadable.uploadTokenSpec === undefined
        ? uploadable.uploadFile.file.name
        : undefined
    )
  );
  if (fileNamesToTokenize.length === 0) return mappedUpload;
  /*
   * Attachment location generation happens here. The attachment location happens before any upload because in case
   * of interruptions, attachment location is used to infer which attachments were uploaded or not.
   */
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

const dialogText = {
  onAction: wbText.uploading(),
  onCancelled: wbText.uploadCanceled({type: wbText.upload()}),
  onCancelledDescription: wbText.uploadCanceledDescription({type: wbText.upload()}),
} as const;

export function AttachmentUpload({
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
  const canUploadAny = React.useMemo(
    () =>
      dataSet.rows.every(({ uploadFile: { file } }) => file instanceof File) &&
      dataSet.rows.some(
        /*
         * Crude check. Can't do better than this, since files are matched
         * just before upload
         */
        ({ attachmentId, uploadFile }) =>
          attachmentId === undefined && uploadFile.parsedName !== undefined
      ),
    [dataSet.rows]
  );

  const [upload, setTriedUpload] = React.useState<
    'confirmed' | 'main' | 'tried'
  >('main');

  const loading = React.useContext(LoadingContext);

  React.useEffect(() => {
    if (upload !== 'confirmed' || baseTableName === undefined) return;
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
      dryRun: boolean,
      triggerRetry: () => void
    ): Promise<PartialUploadableFileSpec> =>
      uploadFileWrapped({
        uploadableFile: uploadable,
        baseTableName: baseTableName!,
        uploadAttachmentSpec: uploadable.uploadTokenSpec,
        dryRun,
        triggerRetry,
      }),
    [baseTableName]
  );
  const [uploadedCount, setUploadedCount] = React.useState<number | undefined>(
    undefined
  );

  const handleUploadReMap = React.useCallback(
    (uploadables: RA<PartialUploadableFileSpec> | undefined): void => {
      const postResults = uploadables?.map((file) =>
        file.attachmentFromPreviousTry === undefined
          ? file
          : removeKey(file, 'attachmentFromPreviousTry')
      );
      handleSync(postResults, false);
      // Reset upload at the end
      setTriedUpload('main');
      setUploadedCount(
        postResults?.filter(({ status }) => status?.type === 'success').length
      );
    },
    [handleSync]
  );
  const [available] = usePromise(attachmentSettingsPromise, true);

  return (
    <>
      {hasPermission('/attachment_import/dataset', 'upload') && (
        <Button.BorderedGray
          disabled={
            !canUploadAny || dataSet.needsSaved || baseTableName === undefined
          }
          onClick={() => setTriedUpload('tried')}
        >
          {wbText.upload()}
        </Button.BorderedGray>
      )}
      {dataSet.uploaderstatus === 'uploading' && !dataSet.needsSaved ? (
        <PerformAttachmentTask
          files={dataSet.rows}
          workPromiseGenerator={generateUploadPromise}
          onCompletedWork={handleUploadReMap}
        >
          {(props) => (
            <ActionState
              {...props}
              dialogText={dialogText}
              onCompletedWork={handleUploadReMap}
            />
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
                  <Button.Save onClick={() => setTriedUpload('confirmed')}>
                    {wbText.upload()}
                  </Button.Save>
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
      {uploadedCount === undefined ? null : (
        <Dialog
          buttons={commonText.close()}
          header={wbText.uploadResults()}
          onClose={() => setUploadedCount(undefined)}
        >
          {attachmentsText.resultValue({
            success: uploadedCount,
            total: dataSet.rows.length,
            action: commonText.uploaded().toLowerCase(),
          })}
        </Dialog>
      )}
    </>
  );
}

async function uploadFileWrapped<KEY extends keyof Tables>({
  uploadableFile,
  baseTableName,
  uploadAttachmentSpec,
  dryRun,
  triggerRetry,
}: WrappedActionProps<KEY> & {
  readonly uploadAttachmentSpec?: UploadAttachmentSpec;
}): Promise<PartialUploadableFileSpec> {
  const getUploadableCommited = ({
    status,
    attachmentId,
    uploadedAttachment,
  }: {
    readonly status: AttachmentStatus;
    readonly attachmentId?: number;
    readonly uploadedAttachment?: SpecifyResource<Attachment>;
  }): PartialUploadableFileSpec => ({
    ...uploadableFile,
    status,
    attachmentId,
    attachmentFromPreviousTry: uploadedAttachment,
  });

  if (uploadableFile.attachmentId !== undefined)
    return getUploadableCommited({
      status: {
        type: 'skipped',
        reason: 'alreadyUploaded',
      },
      attachmentId: uploadableFile.attachmentId,
    });

  if (!(uploadableFile.uploadFile.file instanceof File))
    return getUploadableCommited({
      status: {
        type: 'skipped',
        reason: 'noFile',
      },
    });

  const record = resolveAttachmentRecord(
    uploadableFile.matchedId,
    uploadableFile.disambiguated,
    uploadableFile.uploadFile.parsedName
  );
  if (record.type !== 'matched')
    return getUploadableCommited({
      status: { type: 'skipped', reason: record.reason },
    });

  if (dryRun) return getUploadableCommited({ status: record });

  /*
   * TODO: Make this smarter if it causes performance problems.
   * Fetch multiple tokens at once
   */
  const attachmentUpload =
    uploadableFile.attachmentFromPreviousTry ??
    (await (uploadableFile.uploadTokenSpec === undefined
      ? Promise.resolve(undefined)
      : // Connection could be lost here, so silencing errors
        fetchAssetToken(uploadAttachmentSpec?.attachmentLocation!, true)
    )
      .then(async (token) =>
        /*
         * Token will be undefined if fetchAssetToken fails due to internet being
         * lost.
         */
        token === undefined
          ? undefined
          : uploadFile(
              uploadableFile.uploadFile.file as File,
              () => undefined,
              token === undefined ||
                uploadAttachmentSpec?.attachmentLocation === undefined
                ? undefined
                : { ...uploadAttachmentSpec, token },
              false
            )
      )
      .catch(triggerRetry));

  if (attachmentUpload === undefined) {
    return getUploadableCommited({
      status: {
        type: 'cancelled',
        reason: 'attachmentUploadError',
      },
    });
  }

  const matchId = record.id;

  const baseResourceResponse = await fetchForAttachmentUpload(
    baseTableName,
    matchId,
    triggerRetry
  );
  if (baseResourceResponse.type === 'invalid')
    return getUploadableCommited({
      status: {
        type: 'skipped',
        reason: baseResourceResponse.reason,
      },
      uploadedAttachment: attachmentUpload,
    });

  /*
   * BUG: The resource could have changed. In that case, we will save attachment to a state resource.
   * Fairly unlikely, so not being handled. Potentially solve this by checking the field again
   * or use version numbers (which might be better if indirect references are used to match)
   */

  const baseResource = baseResourceResponse.record;

  attachmentUpload.set('tableID', strictGetTable(baseTableName).tableId);

  const { key: relationshipName, values: oldAttachmentCollection } =
    getAttachmentsFromResource(baseResource, `${baseTableName}attachments`);

  const attachmentModel = strictGetTable(`${baseTableName}Attachment`);

  const baseAttachment: SerializedResource<
    Tables['CollectionObjectAttachment']
  > = serializeResource(
    new attachmentModel.Resource({
      attachment: attachmentUpload as never,
    })
  );

  const oridinalToSearch = oldAttachmentCollection.length;

  const newResourceWithAttachment = {
    ...baseResource,
    [relationshipName]: [
      ...oldAttachmentCollection,
      { ...baseAttachment, ordinal: oridinalToSearch },
    ],
  };

  const resourceSavedResponse = await saveForAttachmentUpload(
    baseTableName,
    matchId,
    newResourceWithAttachment,
    triggerRetry
  );
  if (resourceSavedResponse.type === 'invalid')
    return getUploadableCommited({
      status: {
        type: 'skipped',
        reason: resourceSavedResponse.reason,
      },
      uploadedAttachment: attachmentUpload,
    });
  const baseResourceSaved = resourceSavedResponse.record;
  const { values: attachmentsSaved } = getAttachmentsFromResource(
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
    return getUploadableCommited({
      status: success,
      attachmentId: ordinalLocationMatch[0].id,
    });

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
      return getUploadableCommited({
        status: success,
        attachmentId: locationMatch[0].id,
      });
    }
  }

  /*
   * We really can't handle this case. This would happen if ordinal and attachment
   * location don't uniquely identify the uploaded attachment.
   * or if we can't find the uploaded attachment by attachment location.
   * this is fairly unlikely, so probably never needed
   */

  return getUploadableCommited({
    status: {
      type: 'skipped',
      // TODO: Make this more descriptive. Very unlikely to ever get raised
      reason: 'unhandledFatalResourceError',
    },
  });
}
