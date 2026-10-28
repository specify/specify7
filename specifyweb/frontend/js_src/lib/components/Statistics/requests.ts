import React from 'react';

import type { AjaxProps, AjaxResponseObject } from '../../utils/ajax';
import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import {
  subscribeThrottledPromises,
  throttledPromisesAreLoading,
} from '../../utils/ajax/throttledPromise';

const pending = new Set<symbol>();
const listeners = new Set<() => void>();
let generation = 0;
const delayCancellers = new Set<() => void>();

const notify = (): void => listeners.forEach((listener) => listener());

export const statisticsAreLoading = (): boolean =>
  pending.size > 0 || throttledPromisesAreLoading();

export function useStatisticsLoading(): boolean {
  return React.useSyncExternalStore(
    React.useCallback((listener) => {
      listeners.add(listener);
      const unsubscribe = subscribeThrottledPromises(listener);
      return () => {
        listeners.delete(listener);
        unsubscribe();
      };
    }, []),
    statisticsAreLoading
  );
}

export function cancelStatisticsRequests(): void {
  generation += 1;
  Array.from(delayCancellers).forEach((cancel) => cancel());
}

export async function statisticsAjax<T>(
  url: string,
  options: AjaxProps
): Promise<AjaxResponseObject<T> | undefined> {
  const requestGeneration = generation;
  const token = Symbol();
  pending.add(token);
  notify();
  try {
    while (requestGeneration === generation) {
      const result = await ajax<T>(url, {
        ...options,
        headers: { ...options.headers, 'X-Specify-Statistics': 'true' },
        expectedErrors: [...(options.expectedErrors ?? []), Http.CONFLICT],
      });
      if (requestGeneration !== generation) return undefined;
      if (result.status !== Http.CONFLICT) return result;
      const retryAfter = Number(
        result.response.headers.get('X-Specify-Retry-After')
      );
      const delay =
        (Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 2) * 1000;
      await new Promise<void>((resolve) => {
        const finish = (): void => {
          globalThis.clearTimeout(timer);
          delayCancellers.delete(finish);
          resolve();
        };
        const timer = globalThis.setTimeout(finish, delay);
        delayCancellers.add(finish);
      });
    }
    return undefined;
  } finally {
    pending.delete(token);
    notify();
  }
}
