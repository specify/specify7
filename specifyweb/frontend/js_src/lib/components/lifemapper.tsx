import '../../css/lifemapper.css';

import React from 'react';

import ajax from '../ajax';
import {
  fetchLocalScientificName,
  formatLifemapperViewPageRequest,
  formatOccurrenceDataRequest,
} from '../lifemapperutills';
import lifemapperText from '../localization/lifemapper';
import type { IR, RA } from '../types';
import type { ComponentProps } from './lifemapperwrapper';
import { Link } from './basic';

type FullAggregatorResponse = {
  readonly records: RA<{
    readonly count: number;
    readonly provider: {
      readonly code: string;
    };
    readonly records: RA<{
      readonly 's2n:issues': IR<string>;
      readonly 'dwc:scientificName': string;
    }>;
  }>;
};

export function SpecifyNetworkBadge({
  guid,
  model,
}: ComponentProps): JSX.Element | null {
  const [occurrenceName, setOccurrenceName] = React.useState('');

  React.useEffect(() => {
    fetchOccurrenceName({
      guid,
      model,
    })
      .then(setOccurrenceName)
      .catch(console.error);
  }, [guid, model]);

  if (!guid) return null;

  return (
    <Link
      href={formatLifemapperViewPageRequest(guid, occurrenceName)}
      target="_blank"
      title={lifemapperText('specifyNetwork')}
      aria-label={lifemapperText('specifyNetwork')}
      className="h-7 relative"
      rel="noreferrer"
    >
      <img src="/static/img/specify_network_logo_long.svg" alt="" />
    </Link>
  );
}

async function fetchOccurrenceName({
  model,
  guid,
}: ComponentProps): Promise<string> {
  return ajax<FullAggregatorResponse>(formatOccurrenceDataRequest(guid), {
    mode: 'cors',
    headers: { Accept: 'application/json' },
  })
    .then(({ data: { records } }) =>
      records
        .filter(({ count }) => count > 0)
        .map(({ records }) => records[0]['dwc:scientificName'])
        .find((occurrenceName) => occurrenceName)
    )
    .catch(console.error)
    .then(
      (remoteOccurrence) => remoteOccurrence ?? fetchLocalScientificName(model)
    )
    .catch(console.error)
    .then((occurrenceName) => occurrenceName ?? '');
}
