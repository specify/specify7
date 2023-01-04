import { RR, WritableArray } from '../types';

const currentRequestsGenerator = <T>(): WritableArray<Promise<T>> => [];

export const networkRequestsSpec: RR<
  'backendStats' | 'queryStats',
  {
    readonly currentRequests: WritableArray<Promise<any>>;
    readonly maxFetchCount: number;
  }
> = {
  queryStats: {
    maxFetchCount: 10,
    currentRequests: currentRequestsGenerator<number | string | undefined>(),
  },
  backendStats: {
    maxFetchCount: 1,
    currentRequests: currentRequestsGenerator<number>(),
  },
};

export async function throttledAjax<T>(
  key: keyof typeof networkRequestsSpec,
  promiseGenerator: () => Promise<T>
) {
  const { maxFetchCount, currentRequests } = networkRequestsSpec[key];
  while (currentRequests.length > maxFetchCount) {
    await Promise.any(currentRequests).then(
      () =>
        new Promise<void>((resolve) => {
          setTimeout(() => {
            resolve();
          }, 1000);
        })
    );
  }
  const newPromise = promiseGenerator().finally(() => {
    currentRequests.splice(currentRequests.indexOf(newPromise), 1);
  });
  currentRequests.push(newPromise);
  return newPromise;
}
