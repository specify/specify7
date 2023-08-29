import { RA } from '../../utils/types';
import {
  AttachmentWorkProgress,
  AttachmentWorkRef,
  PostWorkUploadSpec,
  TestInternalUploadSpec,
  UploadInternalWorkable,
} from './types';
import React from 'react';
import { MILLISECONDS } from '../Atoms/timeUnits';
const retryTimes = [0.2, 0.2].map((minutes) => minutes * 60);
const INTERRUPT_TIME_STEP = 1;
export function PerformAttachmentTask<ACTION extends 'uploading' | 'deleting'>({
  files,
  shouldWork,
  workPromiseGenerator,
  onCompletedWork: handleCompletedWork,
  children,
}: {
  readonly files: RA<TestInternalUploadSpec<ACTION>>;
  readonly shouldWork: (
    uploadable: TestInternalUploadSpec<ACTION> | PostWorkUploadSpec<ACTION>
  ) => uploadable is UploadInternalWorkable<ACTION>;
  readonly workPromiseGenerator: (
    uploadable: UploadInternalWorkable<ACTION>,
    triggerRetry: () => void
  ) => Promise<PostWorkUploadSpec<ACTION>>;
  readonly onCompletedWork: (
    uploadables: RA<TestInternalUploadSpec<ACTION> | PostWorkUploadSpec<ACTION>>
  ) => void;
  readonly children: (props: {
    readonly workProgress: AttachmentWorkProgress;
    readonly workRef: React.MutableRefObject<AttachmentWorkRef<ACTION>>;
    readonly onStop: () => void;
    readonly triggerNow: () => void;
  }) => JSX.Element | null;
}): JSX.Element | null {
  const workRef = React.useRef<AttachmentWorkRef<ACTION>>({
    mappedFiles: files,
    uploadPromise: Promise.resolve(0),
    retrySpec: { 0: 0 },
  });

  const [workProgress, setWorkProgress] =
    React.useState<AttachmentWorkProgress>({
      total: workRef.current.mappedFiles.filter(shouldWork).length,
      uploaded: 0,
      type: 'safe',
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

    if (workProgress.type === 'interrupted') return;

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

            handleCompletedWork(workRef.current.mappedFiles);
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
  return children({
    workProgress,
    onStop: stop,
    workRef,
    triggerNow: () =>
      setWorkProgress((prevProgress) => ({ ...prevProgress, type: 'safe' })),
  });
}
