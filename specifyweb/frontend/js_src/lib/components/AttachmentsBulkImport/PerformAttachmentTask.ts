import React from 'react';

import type { RA } from '../../utils/types';
import { MILLISECONDS, MINUTE } from '../Atoms/timeUnits';
import type {
  AttachmentWorkProgress,
  AttachmentWorkRef,
  PartialUploadableFileSpec,
} from './types';

const retryTimes = [0.2 * MINUTE, 0.2 * MINUTE];
const INTERRUPT_TIME_STEP = 1;
export function PerformAttachmentTask({
  files,
  workPromiseGenerator,
  onCompletedWork: handleCompletedWork,
  children,
}: {
  readonly files: RA<PartialUploadableFileSpec>;
  readonly workPromiseGenerator: (
    uploadable: PartialUploadableFileSpec,
    mockUpload: boolean,
    triggerRetry: () => void
  ) => Promise<PartialUploadableFileSpec>;
  readonly onCompletedWork: (
    uploadables: RA<PartialUploadableFileSpec>
  ) => void;
  readonly children: (props: {
    readonly workProgress: AttachmentWorkProgress;
    readonly workRef: React.MutableRefObject<AttachmentWorkRef>;
    readonly onStop: () => void;
    readonly triggerNow: () => void;
  }) => JSX.Element | null;
}): JSX.Element | null {
  const workRef = React.useRef<AttachmentWorkRef>({
    mappedFiles: files,
    uploadPromise: Promise.resolve(0),
    retrySpec: { 0: 0 },
  });

  const [workProgress, setWorkProgress] =
    React.useState<AttachmentWorkProgress>({
      total: workRef.current.mappedFiles.length,
      uploaded: 0,
      type: 'safe',
      retryingIn: 0,
    });

  const stop = () => {
    setWorkProgress((previousState) => ({
      ...previousState,
      type: 'stopping',
    }));
  };

  React.useEffect(() => {
    /*
     * Consider the case that React destroys Effect and calls it again. Currently, it only does that
     * in development to test for function purity. However, still need to guard against that. Solution
     * is to save promise in a ref and have the next cycle of useEffect wait for it. Additionally, it
     * Should be assumed that files could be uploaded before React gets time to destructor effect completely
     * since time on main thread could be non-deterministically given.
     */

    if (workProgress.type === 'interrupted') return;

    const isMocking = workProgress.type === 'stopping';
    let destructorCalled = false;

    const setStopped = () =>
      setWorkProgress((previousState) => ({
        ...previousState,
        type: 'stopped',
      }));

    const handleProgress = (
      postUpload: PartialUploadableFileSpec,
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

    /*
     * It may look like this could create a very long promise chain
     * but the length will always be less than the number of retries
     * even if the work isn't cancelled.
     */
    const workPromise = workRef.current.uploadPromise.then(
      async (previousIndex) =>
        previousIndex === undefined
          ? Promise.resolve(undefined)
          : new Promise<number | undefined>(async (resolve) => {
              let nextUploadingIndex = previousIndex;

              while (nextUploadingIndex < workRef.current.mappedFiles.length) {
                if (destructorCalled) {
                  resolve(nextUploadingIndex);
                  return;
                }

                const currentUploadingIndex = nextUploadingIndex++;

                const fileToUpload =
                  workRef.current.mappedFiles[currentUploadingIndex];

                const workResult = await workPromiseGenerator(
                  fileToUpload,
                  isMocking,
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
                ).then((result) =>
                  // If stopped by the user, but a new status change was reported, preserve it.
                  isMocking && result.status?.type === 'matched'
                    ? {
                        ...result,
                        status: {
                          type: 'cancelled',
                          reason: 'userStopped',
                        } as const,
                      }
                    : result
                );
                handleProgress(
                  workResult,
                  currentUploadingIndex,
                  nextUploadingIndex
                );
              }

              if (isMocking) {
                resolve(undefined);
                setStopped();
                return;
              }

              handleCompletedWork(workRef.current.mappedFiles);
              // TODO: Check if this is the best way of doing this. This should always be the end of the upload loop.
              resolve(undefined);
            })
    );
    return () => {
      destructorCalled = true;
      workRef.current.uploadPromise = workPromise;
    };
  }, [workProgress.type, setWorkProgress]);

  React.useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (workProgress.type === 'interrupted') {
      interval = setInterval(() => {
        if (interval === undefined) return;
        setWorkProgress((previousState) => {
          // If upload was stopped, don't bother retrying.
          if (previousState.type !== 'interrupted') {
            return previousState;
          }

          const nextRemainingTime =
            previousState.retryingIn - INTERRUPT_TIME_STEP;
          if (nextRemainingTime <= 0)
            // Trigger action start when interrupt finishes
            return { ...previousState, type: 'safe' };

          return {
            ...previousState,
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
      setWorkProgress((previousProgress) => ({
        ...previousProgress,
        type: 'safe',
      })),
  });
}
