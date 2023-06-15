import type { RR, WritableArray } from '../types';
type PromiseWithSpec<T> = Promise<T> & {
  readonly spec: number | string;
};

type KillablePromise<T> = PromiseWithSpec<T> & {
  readonly killPromise: () => void;
};
const currentRequestsGenerator = <T>(): WritableArray<PromiseWithSpec<T>> => [];

let maybeFulfilled: WritableArray<KillablePromise<any>> = [];

export const cleanThrottledPromises = (): void => {
  maybeFulfilled.forEach((promise) => promise.killPromise());
  maybeFulfilled = [];
  /*
   * Since the kill promise is already supplied, the promises will resolve within a work loop.
   * So, it is sufficient to directly empty the currentRequests for future requests.
   */
  Object.entries(networkRequestsSpec).forEach(([key, _]) => {
    networkRequestsSpec[key].currentRequests = [];
  });
};

export const networkRequestsSpec: RR<
  'backendStats' | 'queryStats',
  {
    readonly currentRequests: WritableArray<Promise<any>>;
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
    (fulfilledPromise) => fulfilledPromise.spec === promiseSpec
  );
  if (promiseInFulfilled !== undefined) return promiseInFulfilled;
  let promiseKilled = false;
  const returnPromise: KillablePromise<T | undefined> = new Promise(
    async (resolve) => {
      while (currentRequests.length >= maxFetchCount && !promiseKilled) {
        await Promise.any(currentRequests);
      }
      if (promiseKilled) {
        resolve(undefined);
        return;
      }
      const promiseToAdd = promiseGenerator().then((result) => {
        currentRequests.splice(currentRequests.indexOf(promiseToAdd), 1);
        resolve(result);
      });
      currentRequests.push(promiseToAdd);
    }
  ) as KillablePromise<T | undefined>;
  returnPromise.spec = promiseSpec;

  returnPromise.killPromise = () => {
    promiseKilled = true;
  };
  maybeFulfilled.push(returnPromise);
  return returnPromise;
}
