import { RR, WritableArray } from '../types';
import { SpecifyResource } from '../../components/DataModel/legacyTypes';
import { SpQuery } from '../../components/DataModel/types';

export type PromiseWithSpec<T, S> = Promise<T> & { spec: S };
const currentRequestsGenerator = <T, S>(): WritableArray<
  PromiseWithSpec<T, S>
> => [];

const fulfilledNetworkRequests: {
  networkRequests: WritableArray<PromiseWithSpec<any, any>>;
} = { networkRequests: [] };

export const cleanFulfilledRequests = (): void => {
  fulfilledNetworkRequests.networkRequests = [];
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
      SpecifyResource<SpQuery>
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
) {
  const { maxFetchCount, currentRequests } = networkRequestsSpec[key];
  const indexInFulfilled = fulfilledNetworkRequests.networkRequests.findIndex(
    (currentPromise) => {
      return currentPromise.spec === promiseSpec;
    }
  );
  if (indexInFulfilled !== -1) {
    return fulfilledNetworkRequests.networkRequests[indexInFulfilled];
  }
  const promiseIndex = currentRequests.findIndex((currentPromise) => {
    return currentPromise.spec === promiseSpec;
  });
  if (promiseIndex !== -1) {
    return currentRequests[promiseIndex];
  }
  while (currentRequests.length > maxFetchCount) {
    await Promise.any(currentRequests);
  }
  const newPromise = promiseGenerator().finally(() => {
    currentRequests.splice(currentRequests.indexOf(newPromise), 1);
    fulfilledNetworkRequests.networkRequests.push(newPromise);
  }) as PromiseWithSpec<T, S>;
  newPromise.spec = promiseSpec;
  currentRequests.push(newPromise);
  return newPromise;
}
