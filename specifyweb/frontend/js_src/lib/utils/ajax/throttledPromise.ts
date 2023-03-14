import type { RR, WritableArray } from '../types';

export type PromiseWithSpec<T> = Promise<T> & {
  spec: number | string;
};
const currentRequestsGenerator = <T>(): WritableArray<PromiseWithSpec<T>> => [];

let maybeFulfilled: WritableArray<PromiseWithSpec<any>> = [];

export const cleanMaybeFulfilled = (): void => {
  maybeFulfilled = [];
};

export const networkRequestsSpec: RR<
  'backendStats' | 'queryStats',
  {
    readonly currentRequests: WritableArray<PromiseWithSpec<any>>;
    readonly maxFetchCount: number;
  }
> = {
  queryStats: {
    maxFetchCount: 5,
    currentRequests: currentRequestsGenerator<number | string | undefined>(),
  },
  backendStats: {
    maxFetchCount: 1,
    currentRequests: currentRequestsGenerator<number>(),
  },
};

export async function throttledPromise<T>(
  key: keyof typeof networkRequestsSpec,
  promiseGenerator: () => Promise<T>,
  promiseSpec: number | string
): Promise<T> {
  const { maxFetchCount, currentRequests } = networkRequestsSpec[key];
  while (currentRequests.length > maxFetchCount) {
    await Promise.any(currentRequests);
  }
  const promiseInFulfilled = maybeFulfilled.find(
    (fulfilledPromise) => fulfilledPromise.spec === promiseSpec
  );
  if (promiseInFulfilled !== undefined) return promiseInFulfilled;

  const newPromise = promiseGenerator().finally(() => {
    currentRequests.splice(currentRequests.indexOf(newPromise), 1);
  }) as PromiseWithSpec<T>;
  newPromise.spec = promiseSpec;
  currentRequests.push(newPromise);
  maybeFulfilled.push(newPromise);
  return newPromise;
}
