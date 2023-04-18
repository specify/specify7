import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useTriggerState } from '../../hooks/useTriggerState';
import { ajax } from '../../utils/ajax';
import { Range } from '../Molecules/Range';
import { formatUrl } from '../Router/queryString';

export function GbifMap({
  mapData,
}: {
  readonly mapData:
    | {
        readonly datasetKey: string;
      }
    | { readonly publishingOrg: string };
}): JSX.Element | null {
  const [yearRange] = useAsyncState(
    React.useCallback(
      async () =>
        ajax<{
          readonly minYear?: number;
          readonly maxYear?: number;
        }>(
          formatUrl(
            'https://api.gbif.org/v2/map/occurrence/density/capabilities.json',
            mapData
          ),
          {
            headers: {
              Accept: 'application/json',
            },
          }
        ).then(
          ({ data }) =>
            [
              data.minYear ?? 0,
              data.maxYear ?? new Date().getFullYear(),
            ] as const
        ),
      [mapData]
    ),
    true
  );
  const [range, setRange] = useTriggerState(yearRange);
  return yearRange === undefined || range === undefined ? null : (
    <Range range={yearRange} value={[range, setRange]} />
  );
}
