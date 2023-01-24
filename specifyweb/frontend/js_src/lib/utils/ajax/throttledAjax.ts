import { RR, WritableArray } from '../types';

export type PromiseWithSpec<T, S> = Promise<T> & { spec: S };
const currentRequestsGenerator = <T, S>(): WritableArray<
  PromiseWithSpec<T, S>
> => [];

let fulfilledPromises: WritableArray<PromiseWithSpec<any, any>> = [];

export const cleanFulfilledRequests = (): void => {
  fulfilledPromises = [];
};

export const networkRequestsSpec: RR<
  'backendStats' | 'queryStats',
  {
    readonly currentRequests: WritableArray<PromiseWithSpec<any, any>>;
    readonly maxFetchCount: number;
  }
> = {
  queryStats: {
    maxFetchCount: 10,
    currentRequests: currentRequestsGenerator<
      number | string | undefined,
      string
    >(),
  },
  backendStats: {
    maxFetchCount: 1,
    currentRequests: currentRequestsGenerator<number, string>(),
  },
};

export async function throttledAjax<T, S>(
  key: keyof typeof networkRequestsSpec,
  promiseGenerator: () => Promise<T>,
  promiseSpec: S
): Promise<T> {
  const { maxFetchCount, currentRequests } = networkRequestsSpec[key];
  while (currentRequests.length > maxFetchCount) {
    await Promise.any(currentRequests);
  }
  const promiseInFulfilled = fulfilledPromises.find(
    (fulfilledPromise) => fulfilledPromise.spec === promiseSpec
  );
  if (promiseInFulfilled !== undefined) return promiseInFulfilled;

  const promiseInAwaiting = currentRequests.find(
    (awaitingPromise) => awaitingPromise.spec === promiseSpec
  );
  if (promiseInAwaiting !== undefined) return promiseInAwaiting;

  const newPromise = promiseGenerator().finally(() => {
    currentRequests.splice(currentRequests.indexOf(newPromise), 1);
    fulfilledPromises.push(newPromise);
  }) as PromiseWithSpec<T, S>;
  newPromise.spec = promiseSpec;
  currentRequests.push(newPromise);
  return newPromise;
}
