import {
  PartialUploadableFileSpec,
  AttachmentStatus,
  UploadAttachmentSpec,
  TestInternalUploadSpec,
  UploadInternalWorkable,
  PostWorkUploadSpec,
  CanUpload,
} from './types';
import { filterArray, RA, WritableArray } from '../../utils/types';
import React from 'react';
import { uploadFile } from './attachments';
import { Dialog, LoadingScreen } from '../Molecules/Dialog';
import { Button } from '../Atoms/Button';
import { wbText } from '../../localization/workbench';
import { fetchResource, saveResource } from '../DataModel/resource';
import { serializeResource } from '../DataModel/helpers';
import { AttachmentMapping } from './importPaths';
import { Progress } from '../Atoms';
import {
  FilterTablesByEndsWith,
  SerializedResource,
} from '../DataModel/helperTypes';
import { reasonToSkipUpload } from './batchUploadUtils';
import { formatTime, removeKey } from '../../utils/utils';
import { commonText } from '../../localization/common';
import { ajax } from '../../utils/ajax';
import { EagerDataSet } from './Import';
import { attachmentsText } from '../../localization/attachments';
import { formsText } from '../../localization/forms';
import { MILLISECONDS } from '../Atoms/timeUnits';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { Attachment } from '../DataModel/types';

const mapUploadFiles = (
  uploadable: PartialUploadableFileSpec
): TestInternalUploadSpec<'uploading'> => {
  const reason = reasonToSkipUpload(uploadable);
  const canUpload = ((_: PartialUploadableFileSpec): _ is CanUpload =>
    reason === undefined)(uploadable);
  return canUpload
    ? {
        ...uploadable,
        canUpload: true,
        status: undefined,
      }
    : {
        ...uploadable,
        canUpload: false,
        status: { type: 'skipped', reason: reason! },
      };
};

type WorkProgress = {
  readonly total: number;
  readonly uploaded: number;
  readonly type:
    | 'confirmAction'
    | 'safe'
    | 'stopping'
    | 'stopped'
    | 'interrupted';
  readonly retryingIn: number;
};

type WorkRef<ACTION extends 'uploading' | 'deleting'> = {
  mappedFiles: WritableArray<
    TestInternalUploadSpec<ACTION> | PostWorkUploadSpec<ACTION>
  >; // TODO: Use RA instead. All writable array properties have been avoided.
  uploadPromise: Promise<number | undefined>;
  retrySpec: Record<number, number>;
};

const retryTimes = [0.2, 0.2].map((minutes) => minutes * 60);
const INTERRUPT_TIME_STEP = 1;
export function useAttachmentWorkLoop<ACTION extends 'uploading' | 'deleting'>(
  initializeMappedFiles: () => WritableArray<TestInternalUploadSpec<ACTION>>,
  shouldWork: (
    uploadable: TestInternalUploadSpec<ACTION> | PostWorkUploadSpec<ACTION>
  ) => uploadable is UploadInternalWorkable<ACTION>,
  workPromiseGenerator: (
    uploadable: UploadInternalWorkable<ACTION>,
    triggerRetry: () => void
  ) => Promise<PostWorkUploadSpec<ACTION>>,
  onCompletedWork: (
    uploadables: RA<TestInternalUploadSpec<ACTION> | PostWorkUploadSpec<ACTION>>
  ) => void,
  pendingChange: boolean
): [WorkProgress, { current: WorkRef<ACTION> }, () => void, () => void] {
  const workRef = React.useRef<WorkRef<ACTION>>({
    mappedFiles: initializeMappedFiles(),
    uploadPromise: Promise.resolve(0),
    retrySpec: { 0: 0 },
  });

  const [workProgress, setWorkProgress] = React.useState<WorkProgress>({
    total: workRef.current.mappedFiles.filter(shouldWork).length,
    uploaded: 0,
    type: 'confirmAction',
    retryingIn: 0,
  });

  const stop = () => {
    setWorkProgress((prevState) => ({ ...prevState, type: 'stopping' }));
  };

  React.useEffect(() => {
    // Consider the case that React destroys Effect and calls it again. Currently, it only does that
    // in development to test for function purity. However, still need to guard against that. Solution
    // is to save promise in a ref and have the next cycle of useEffect wait for it. Additionally, it
    // should be assumed that files could be uploaded before React gets time to destructor effect completely
    // since time on main thread could be non-deterministically given.

    if (
      workProgress.type === 'confirmAction' ||
      workProgress.type === 'interrupted'
    )
      return;

    let destructorCalled = false;

    const setStopped = () =>
      setWorkProgress((prevState) => ({ ...prevState, type: 'stopped' }));

    const handleProgress = (
      postUpload: PostWorkUploadSpec<ACTION> | UploadInternalWorkable<ACTION>,
      currentIndex: number,
      nextIndex: number
    ) => {
      setWorkProgress((progress) => ({
        ...progress,
        uploaded: (nextIndex === currentIndex ? 0 : 1) + progress.uploaded,
      }));
      workRef.current.mappedFiles = workRef.current.mappedFiles.map(
        (uploadble, postIndex) =>
          postIndex === currentIndex ? postUpload : uploadble
      );
    };

    const handleStopped = (stoppedIndex: number) => {
      workRef.current.mappedFiles = workRef.current.mappedFiles.map(
        (uploadable, index) => ({
          ...uploadable,
          status:
            index >= stoppedIndex && shouldWork(uploadable)
              ? 'cancelled'
              : uploadable.status,
        })
      );
      setStopped();
    };
    // It may look like this could create a very long promise chain
    // but the length will always be less than the number of retries
    // even if the work isn't cancelled.
    const workPromise = workRef.current.uploadPromise.then((previousIndex) =>
      previousIndex === undefined
        ? Promise.resolve(undefined)
        : new Promise<number | undefined>(async (resolve) => {
            let nextUploadingIndex = previousIndex;
            if (workProgress.type === 'stopping') {
              handleStopped(nextUploadingIndex);
              resolve(undefined);
              return;
            }

            while (nextUploadingIndex < workRef.current.mappedFiles.length) {
              if (destructorCalled) {
                resolve(nextUploadingIndex);
                return;
              }

              const currentUploadingIndex = nextUploadingIndex++;

              const fileToUpload =
                workRef.current.mappedFiles[currentUploadingIndex];

              if (!shouldWork(fileToUpload)) {
                continue;
              }

              const workResult = await workPromiseGenerator(
                fileToUpload,
                () => {
                  destructorCalled = true;
                  const nextTry =
                    workRef.current.retrySpec[currentUploadingIndex] ??
                    workRef.current.retrySpec[currentUploadingIndex]++;
                  workRef.current.retrySpec = {
                    [currentUploadingIndex]: nextTry,
                  };
                  nextUploadingIndex = currentUploadingIndex;
                  if (nextTry >= retryTimes.length) {
                    stop();
                    return;
                  }
                  setWorkProgress((previousProgress) => ({
                    ...previousProgress,
                    type: 'interrupted',
                    retryingIn: retryTimes[nextTry],
                  }));
                }
              );
              handleProgress(
                workResult,
                currentUploadingIndex,
                nextUploadingIndex
              );
            }

            onCompletedWork(workRef.current.mappedFiles);
            //TODO: Check if this is the best way of doing this. This should always be the end of the upload loop.
            resolve(undefined);
          })
    );
    return () => {
      destructorCalled = true;
      workRef.current.uploadPromise = workPromise;
    };
  }, [workProgress.type, workRef, setWorkProgress]);

  React.useEffect(() => {
    if (pendingChange) return;
    setWorkProgress((prevState) => ({ ...prevState, type: 'safe' }));
  }, [pendingChange]);

  React.useEffect(() => {
    let interval: NodeJS.Timer | undefined;
    if (workProgress.type === 'interrupted') {
      interval = setInterval(() => {
        if (interval === undefined) return;
        setWorkProgress((prevState) => {
          // If upload was stopped, don't bother retrying.
          if (prevState.type !== 'interrupted') {
            return prevState;
          }

          const nextRemainingTime = prevState.retryingIn - INTERRUPT_TIME_STEP;
          if (nextRemainingTime <= 0)
            // Trigger action start when interrupt finishes
            return { ...prevState, type: 'safe' };

          return {
            ...prevState,
            retryingIn: nextRemainingTime,
          };
        });
      }, INTERRUPT_TIME_STEP * MILLISECONDS);
    }
    return () => {
      clearInterval(interval);
      interval = undefined;
    };
  }, [workProgress.type]);

  return [
    workProgress,
    workRef,
    stop,
    () => setWorkProgress((prevState) => ({ ...prevState, type: 'safe' })),
  ];
}

const shouldWork = (
  uploadable:
    | TestInternalUploadSpec<'uploading'>
    | PostWorkUploadSpec<'uploading'>
): uploadable is UploadInternalWorkable<'uploading'> => uploadable.canUpload;

export const attachmentRemoveInternalUploadables = (
  internalSpec:
    | TestInternalUploadSpec<'uploading' | 'deleting'>
    | PostWorkUploadSpec<'uploading' | 'deleting'>
): PartialUploadableFileSpec =>
  'canUpload' in internalSpec
    ? removeKey(internalSpec, 'canUpload')
    : removeKey(internalSpec, 'canDelete');

export function UploadAttachments({
  filesToUpload,
  baseTableName,
  dataSet,
  onSync: handleSync,
}: {
  readonly dataSet: EagerDataSet;
  readonly filesToUpload: RA<PartialUploadableFileSpec>;
  readonly onSync: (
    generatedState: RA<PartialUploadableFileSpec> | undefined,
    isSyncing: boolean
  ) => void;
  readonly baseTableName: keyof typeof AttachmentMapping;
}): JSX.Element | null {
  const handleUploadReMap = React.useCallback(
    (
      uploadables:
        | RA<
            | TestInternalUploadSpec<'uploading'>
            | PostWorkUploadSpec<'uploading'>
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

  const generateUploadPromise = React.useCallback(
    (
      uploadable: UploadInternalWorkable<'uploading'>,
      triggerRetry: () => void
    ): Promise<PostWorkUploadSpec<'uploading'>> =>
      uploadFileWrapped(
        uploadable,
        baseTableName,
        uploadable.uploadTokenSpec,
        triggerRetry
      ),
    [baseTableName]
  );

  const [uploadProgress, uploadRef, triggerStop, triggerNow] =
    useAttachmentWorkLoop<'uploading'>(
      () => filesToUpload.map(mapUploadFiles),
      shouldWork,
      generateUploadPromise,
      handleUploadReMap,
      dataSet.needsSaved || dataSet.save
    );

  const [aboutToUpload, setAboutToUpload] = React.useState(false);

  React.useEffect(() => {
    let destructorCalled = false;
    if (aboutToUpload) {
      const fileNamesToTokenize = filterArray(
        uploadRef.current!.mappedFiles.map((uploadable) =>
          uploadable.canUpload && uploadable.uploadTokenSpec === undefined
            ? uploadable.file.parsedName
            : undefined
        )
      );

      (fileNamesToTokenize.length === 0
        ? // Don't fetch params if every file to upload has defined token
          Promise.resolve(undefined)
        : ajax<RA<UploadAttachmentSpec>>('/attachment_gw/get_upload_params/', {
            method: 'POST',
            headers: { Accept: 'application/json' },
            body: {
              filenames: fileNamesToTokenize,
            },
          }).then(({ data }) => {
            if (destructorCalled) return;
            if (fileNamesToTokenize.length !== data.length) {
              // Throwing an error for development testing. Hasn't happened yet.
              throw new Error(
                'DEV: length changed in between effect calls. Unsafe. Aborting upload.'
              );
            }
            let indexInTokenData = 0;
            uploadRef.current.mappedFiles = uploadRef.current.mappedFiles.map(
              (uploadableFile) => {
                return {
                  ...uploadableFile,
                  uploadTokenSpec:
                    uploadableFile.canUpload &&
                    uploadableFile.uploadTokenSpec === undefined
                      ? data[indexInTokenData++]
                      : uploadableFile.uploadTokenSpec,
                };
              }
            );
          })
      ).then(async () => {
        if (destructorCalled) return;
        handleSync(uploadRef.current.mappedFiles, true);
      });
    }
    return () => {
      destructorCalled = true;
    };
  }, [aboutToUpload]);

  return uploadProgress.type === 'safe' ? (
    <Dialog
      buttons={
        <>
          <Button.Danger onClick={triggerStop}>{wbText.stop()}</Button.Danger>
        </>
      }
      header={wbText.uploading()}
      onClose={() => undefined}
    >
      {`Files Uploaded: ${uploadProgress.uploaded}/${uploadProgress.total}`}
      <Progress value={uploadProgress.uploaded} max={uploadProgress.total} />
    </Dialog>
  ) : uploadProgress.type === 'stopping' ? (
    <Dialog
      header={wbText.aborting()}
      buttons={<></>}
      onClose={() => undefined}
    >
      {wbText.aborting()}
    </Dialog>
  ) : uploadProgress.type === 'stopped' ? (
    <Dialog
      header={'Abort Successful'}
      buttons={<Button.DialogClose>{'Close'}</Button.DialogClose>}
      onClose={() => handleUploadReMap(uploadRef.current.mappedFiles)}
    >
      {'Abort Successful message'}
    </Dialog>
  ) : uploadProgress.type === 'interrupted' ? (
    <Dialog
      header={'Interrupted'}
      buttons={
        <>
          <Button.Danger onClick={triggerStop}>{wbText.stop()}</Button.Danger>
          <Button.Fancy onClick={triggerNow}>{'Try Now'}</Button.Fancy>
        </>
      }
      onClose={() => undefined}
    >
      {`Interrupted. Retrying in ${formatTime(uploadProgress.retryingIn)}s`}
    </Dialog>
  ) : aboutToUpload ? (
    <LoadingScreen />
  ) : (
    <Dialog
      header={'Begin Attachment Upload?'}
      buttons={
        <>
          <Button.DialogClose>{commonText.close()}</Button.DialogClose>
          <Button.Fancy onClick={() => setAboutToUpload(true)}>
            {'Start'}
          </Button.Fancy>
        </>
      }
      onClose={() => handleUploadReMap(undefined)}
    >
      {
        'Uploading the attachments will make attachments in the asset server, and in the Specify database'
      }
    </Dialog>
  );
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

  const fetchedResource = await fetchResource(baseTable, matchId, false);
  if (fetchedResource === undefined) {
    return getUploadableCommited({
      type: 'cancelled',
      reason: formsText.nothingFound(),
    });
  }

  const mapped = fetchedResource[AttachmentMapping[baseTable]] as RA<
    SerializedResource<FilterTablesByEndsWith<'Attachment'>>
  >;
  const mappedResource = {
    ...fetchedResource,
    [AttachmentMapping[baseTable]]: [
      ...mapped,
      {
        ordinal: 0,
        attachment: serializeResource(attachmentUpload!),
      },
    ],
  };

  let isConflict = false;
  const savedResource = await saveResource(
    baseTable,
    matchId,
    mappedResource,
    () => {
      // TODO: Try fetching and saving the resource again - just do triggerRetry(). Maybe not
      // since triggerRetry will avoid all upload if more than MAX_RETRIES
      isConflict = true;
    },
    true
  );

  if (isConflict) {
    return getUploadableCommited({
      type: 'cancelled',
      reason: formsText.saveConflict(),
    });
  }

  const uploadedAttachmentId = Math.max(
    ...(
      savedResource[AttachmentMapping[baseTable]] as RA<
        SerializedResource<FilterTablesByEndsWith<'Attachment'>>
      >
    ).map(({ id }) => id)
  );

  return getUploadableCommited('uploaded', uploadedAttachmentId);
}
