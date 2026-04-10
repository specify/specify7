import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import type { BrokerFetchResult } from './fetchers';
import { fetchName, fetchOccurrence } from './fetchers';

const emptyBrokerFetchResult: BrokerFetchResult = {
  records: [],
  isUnavailable: false,
};

export function useOccurrence(guid = ''): BrokerFetchResult | undefined {
  return useAsyncState(
    React.useCallback(
      async () =>
        guid === '' ? emptyBrokerFetchResult : fetchOccurrence(guid),
      [guid]
    ),
    false
  )[0];
}

export function useSpecies(speciesName = ''): BrokerFetchResult | undefined {
  return useAsyncState(
    React.useCallback(
      async () =>
        speciesName === '' ? emptyBrokerFetchResult : fetchName(speciesName),
      [speciesName]
    ),
    false
  )[0];
}
