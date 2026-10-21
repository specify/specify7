import React from 'react';

import type { GetOrSet, RA } from '../../utils/types';
import { MINUTE, SECOND } from '../Atoms/timeUnits';
import type {
  AttachmentWorkProgress,
  AttachmentWorkRef,
  PartialUploadableFileSpec,
} from './types';

const retryTimes = [MINUTE, 2 * MINUTE, 5 * MINUTE, 10 * MINUTE];
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
    retrySpec: {},
  });

  const [workProgress, setWorkProgress] =
    React.useState<AttachmentWorkProgress>({
      total: workRef.current.mappedFiles.length,
      uploaded: 0,
      type: 'safe',
      retryingIn: 0,
      stoppedByUser: false,
    });

  const triggerStop = (stoppedByUser: boolean = true) =>
    setWorkProgress((previousState) => ({
      ...previousState,
      type: 'stopping',
      stoppedByUser,
    }));

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
      (uploadable, postIndex) =>
        postIndex === currentIndex ? postUpload : uploadable
    );
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

    /*
     * It may look like this could create a very long promise chain
     * but the length will always be less than the number of retries
     * even if the work isn't cancelled.
     */
    const workPromise = workRef.current.uploadPromise.then(
      async (previousIndex) => {
        if (previousIndex === undefined) return undefined;
        return new Promise<number | undefined>(async (resolve) => {
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
                workRef.current.retrySpec[currentUploadingIndex] ??= 0;
                const nextTry =
                  workRef.current.retrySpec[currentUploadingIndex];
                workRef.current.retrySpec[currentUploadingIndex] += 1;
                if (nextTry >= retryTimes.length) {
                  triggerStop(false);
                  return;
                }
                nextUploadingIndex = currentUploadingIndex;
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
                      reason: workProgress.stoppedByUser
                        ? 'userStopped'
                        : 'interruptionStopped',
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
        });
      }
    );
    return () => {
      destructorCalled = true;
      workRef.current.uploadPromise = workPromise;
    };
  }, [workProgress.type, setWorkProgress]);

  useTimeout(workProgress.type, setWorkProgress);

  return children({
    workProgress,
    onStop: triggerStop,
    workRef,
    triggerNow: () => {
      /*
       * If user triggers a retry, reset the retrySpec.
       * Since the previous values of retrySpec are not needed,
       * resetting to empty object is sufficient
       */
      workRef.current = { ...workRef.current, retrySpec: {} };
      setWorkProgress((previousProgress) => ({
        ...previousProgress,
        type: 'safe',
      }));
    },
  });
}

const useTimeout = (
  type: AttachmentWorkProgress['type'],
  setWorkProgress: GetOrSet<AttachmentWorkProgress>[1]
) =>
  React.useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (type === 'interrupted') {
      interval = setInterval(() => {
        if (interval === undefined) return;
        setWorkProgress((previousState) => {
          // If upload was stopped, don't bother retrying.
          if (previousState.type !== 'interrupted') {
            return previousState;
          }

          const nextRemainingTime = previousState.retryingIn - SECOND;
          if (nextRemainingTime <= 0)
            // Trigger action start when interrupt finishes
            return { ...previousState, type: 'safe' };

          return {
            ...previousState,
            retryingIn: nextRemainingTime,
          };
        });
      }, SECOND);
    }
    return () => {
      clearInterval(interval);
    };
  }, [type, setWorkProgress]);
