import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { ajax } from '../../utils/ajax';
import { formatUrl } from '../Router/queryString';

export function GbifMap({
  mapData,
}: {
  readonly mapData:
    | {
        readonly datasetKey: string;
      }
    | { readonly publishingOrg: string };
}): JSX.Element {
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
        ).then(({ data }) => data),
      [mapData]
    ),
    true
  );
}
