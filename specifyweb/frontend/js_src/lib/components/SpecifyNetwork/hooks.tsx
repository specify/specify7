import { RA } from '../../utils/types';
import { BrokerRecord, fetchName, fetchOccurrence } from './fetchers';
import { useAsyncState } from '../../hooks/useAsyncState';
import React from 'react';

export function useOccurrence(guid: string): RA<BrokerRecord> | undefined {
  return useAsyncState(
    React.useCallback(
      async () => (guid === '' ? [] : fetchOccurrence(guid)),
      [guid]
    ),
    false
  )[0];
}

export function useSpecies(
  speciesName: string | undefined
): RA<BrokerRecord> | undefined {
  return useAsyncState(
    React.useCallback(
      () => (speciesName === undefined ? [] : fetchName(speciesName)),
      [speciesName]
    ),
    false
  )[0];
}
