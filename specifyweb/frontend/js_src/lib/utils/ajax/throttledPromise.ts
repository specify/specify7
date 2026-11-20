import type { RR, WritableArray } from '../types';

export type PromiseWithSpec<T> = Promise<T> & {
  // eslint-disable-next-line functional/prefer-readonly-type
  spec: number | string;
};

type KillablePromise<T> = PromiseWithSpec<T> & {
  readonly group: string;
  // eslint-disable-next-line functional/prefer-readonly-type
  killPromise: () => void;
};
const currentRequestsGenerator = <T>(): WritableArray<PromiseWithSpec<T>> => [];

let maybeFulfilled: WritableArray<KillablePromise<any>> = [];
const pendingPromises = new Set<Promise<unknown>>();
const listeners = new Set<() => void>();

export const throttledPromisesAreLoading = (): boolean =>
  pendingPromises.size > 0;

export function subscribeThrottledPromises(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const notify = (): void => listeners.forEach((listener) => listener());

export const cleanThrottledPromises = (killPromises = true): void => {
  if (killPromises) maybeFulfilled.forEach((promise) => promise.killPromise());
  maybeFulfilled = [];
};

export const networkRequestsSpec: RR<
  'backendStats' | 'queryStats',
  {
    // eslint-disable-next-line functional/prefer-readonly-type
    currentRequests: WritableArray<Promise<any>>;
    readonly maxFetchCount: number;
  }
> = {
  queryStats: {
    maxFetchCount: 4,
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
): Promise<T | undefined> {
  const { maxFetchCount, currentRequests } = networkRequestsSpec[key];
  const promiseInFulfilled = maybeFulfilled.find(
    (fulfilledPromise) =>
      fulfilledPromise.group === key && fulfilledPromise.spec === promiseSpec
  );
  if (promiseInFulfilled !== undefined) return promiseInFulfilled;
  let promiseKilled = false;
  const run = async (): Promise<T | undefined> => {
    while (currentRequests.length >= maxFetchCount && !promiseKilled) {
      await Promise.race(
        currentRequests.map((promise) =>
          promise.then(
            () => undefined,
            () => undefined
          )
        )
      );
    }
    if (promiseKilled) return undefined;
    const promiseToAdd = promiseGenerator();
    currentRequests.push(promiseToAdd);
    try {
      return await promiseToAdd;
    } finally {
      currentRequests.splice(currentRequests.indexOf(promiseToAdd), 1);
    }
  };
  const returnPromise: KillablePromise<T | undefined> = Object.assign(run(), {
    spec: promiseSpec,
    group: key,
    killPromise: () => {
      promiseKilled = true;
    },
  });
  maybeFulfilled.push(returnPromise);
  pendingPromises.add(returnPromise);
  notify();
  const settled = (): void => {
    pendingPromises.delete(returnPromise);
    notify();
  };
  returnPromise.then(settled, settled);
  return returnPromise;
}
